const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor() {
    const dbDir = path.join(__dirname, '../../database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(path.join(dbDir, 'rift-revealer.db'));
    this.db.pragma('journal_mode = WAL');
  }

  initialize() {
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    this.db.exec(schema);
  }

  getUserConfig() {
    const stmt = this.db.prepare('SELECT * FROM user_config ORDER BY id DESC LIMIT 1');
    return stmt.get();
  }

  saveUserConfig(config) {
    const stmt = this.db.prepare(`
      INSERT INTO user_config (puuid, summoner_name, region, riot_api_key, last_updated)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(
      config.puuid,
      config.summoner_name,
      config.region,
      config.riot_api_key,
      Date.now()
    );
  }

  savePlayer(puuid, summonerName, region) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO players (puuid, summoner_name, region, last_seen)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(puuid, summonerName, region, Date.now());
  }

  saveMatch(matchData) {
    const matchStmt = this.db.prepare(`
      INSERT OR IGNORE INTO matches (match_id, game_creation, game_duration, game_mode, queue_id, imported_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    matchStmt.run(
      matchData.metadata.matchId,
      matchData.info.gameCreation,
      matchData.info.gameDuration,
      matchData.info.gameMode,
      matchData.info.queueId,
      Date.now()
    );

    const participantStmt = this.db.prepare(`
      INSERT INTO match_participants (
        match_id, puuid, summoner_name, champion_name, champion_id, team_id,
        kills, deaths, assists, win, total_damage_dealt, total_damage_to_champions,
        total_minions_killed, gold_earned, role, lane, team_position
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const participant of matchData.info.participants) {
      this.savePlayer(participant.puuid, participant.summonerName, matchData.info.platformId);

      participantStmt.run(
        matchData.metadata.matchId,
        participant.puuid,
        participant.summonerName,
        participant.championName,
        participant.championId,
        participant.teamId,
        participant.kills,
        participant.deaths,
        participant.assists,
        participant.win ? 1 : 0,
        participant.totalDamageDealt,
        participant.totalDamageDealtToChampions,
        participant.totalMinionsKilled,
        participant.goldEarned,
        participant.role,
        participant.lane,
        participant.teamPosition
      );
    }
  }

  getPlayerHistory(summonerName) {
    const config = this.getUserConfig();
    if (!config) {
      return { games: [], stats: null };
    }

    const gamesStmt = this.db.prepare(`
      SELECT DISTINCT
        m.match_id,
        m.game_creation,
        m.game_duration,
        m.queue_id,
        opponent.summoner_name as opponent_name,
        opponent.champion_name as opponent_champion,
        opponent.kills as opponent_kills,
        opponent.deaths as opponent_deaths,
        opponent.assists as opponent_assists,
        opponent.win as opponent_win,
        opponent.team_id as opponent_team,
        user.champion_name as user_champion,
        user.kills as user_kills,
        user.deaths as user_deaths,
        user.assists as user_assists,
        user.win as user_win,
        user.team_id as user_team,
        user.total_damage_to_champions as user_damage,
        opponent.total_damage_to_champions as opponent_damage,
        user.total_minions_killed as user_cs,
        opponent.total_minions_killed as opponent_cs
      FROM matches m
      INNER JOIN match_participants user ON m.match_id = user.match_id AND user.puuid = ?
      INNER JOIN match_participants opponent ON m.match_id = opponent.match_id AND opponent.summoner_name = ? AND opponent.puuid != ?
      WHERE m.game_creation < (strftime('%s', 'now') - 300) * 1000
      ORDER BY m.game_creation DESC
    `);

    const games = gamesStmt.all(config.puuid, summonerName, config.puuid);

    if (games.length === 0) {
      return { games: [], stats: null };
    }

    // Calculate stats
    const teammateGames = games.filter(g => g.user_team === g.opponent_team);
    const enemyGames = games.filter(g => g.user_team !== g.opponent_team);

    const teammateWins = teammateGames.filter(g => g.user_win === 1).length;
    const enemyWins = enemyGames.filter(g => g.user_win === 1).length;

    return {
      games,
      stats: {
        totalGames: games.length,
        asTeammate: {
          games: teammateGames.length,
          wins: teammateWins,
          losses: teammateGames.length - teammateWins,
          winRate: teammateGames.length > 0 ? ((teammateWins / teammateGames.length) * 100).toFixed(0) : 0
        },
        asEnemy: {
          games: enemyGames.length,
          wins: enemyWins,
          losses: enemyGames.length - enemyWins,
          winRate: enemyGames.length > 0 ? ((enemyWins / enemyGames.length) * 100).toFixed(0) : 0
        }
      }
    };
  }

  close() {
    this.db.close();
  }
}

module.exports = DatabaseManager;
