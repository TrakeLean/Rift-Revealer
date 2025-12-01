const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class DatabaseManager {
  constructor() {
    // Use userData directory for the database (writable location)
    const userDataPath = app.getPath('userData');
    const dbDir = path.join(userDataPath, 'database');

    console.log('Database directory:', dbDir);

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('Created database directory');
    }

    const dbPath = path.join(dbDir, 'rift-revealer.db');
    console.log('Database path:', dbPath);

    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    console.log('Database opened successfully');
  }

  initialize() {
    // Schema file is in the asar (read-only), which is fine for reading
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    console.log('Schema path:', schemaPath);

    const schema = fs.readFileSync(schemaPath, 'utf8');
    this.db.exec(schema);
    console.log('Database schema initialized');

    // Run migrations for existing databases
    this.runMigrations();
  }

  runMigrations() {
    // Check if profile_icon_id column exists in players table
    const playersInfo = this.db.prepare("PRAGMA table_info(players)").all();
    const hasProfileIconInPlayers = playersInfo.some(col => col.name === 'profile_icon_id');
    const hasSkinInPlayers = playersInfo.some(col => col.name === 'skin_id');

    const participantsInfo = this.db.prepare("PRAGMA table_info(match_participants)").all();
    const hasProfileIconInParticipants = participantsInfo.some(col => col.name === 'profile_icon_id');

    if (!hasProfileIconInPlayers) {
      console.log('Running migration: Adding profile_icon_id to players table');
      this.db.exec('ALTER TABLE players ADD COLUMN profile_icon_id INTEGER');
    }
    if (!hasSkinInPlayers) {
      console.log('Running migration: Adding skin_id to players table');
      this.db.exec('ALTER TABLE players ADD COLUMN skin_id INTEGER');
    }
    if (!hasProfileIconInParticipants) {
      console.log('Running migration: Adding profile_icon_id to match_participants table');
      this.db.exec('ALTER TABLE match_participants ADD COLUMN profile_icon_id INTEGER');
    }

    console.log('Database migrations completed');
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

  savePlayer(puuid, summonerName, region, profileIconId = null, skinId = null) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO players (puuid, summoner_name, region, last_seen, profile_icon_id, skin_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(puuid, summonerName, region, Date.now(), profileIconId, skinId);
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

    console.log(`Saving match ${matchData.metadata.matchId} with ${matchData.info.participants.length} participants`);

    // Debug: Log first participant's name data
    if (matchData.info.participants.length > 0) {
      const first = matchData.info.participants[0];
      console.log('  First participant name data:');
      console.log('    summonerName:', first.summonerName);
      console.log('    riotIdGameName:', first.riotIdGameName);
      console.log('    riotIdTagline:', first.riotIdTagline);
    }

    const participantStmt = this.db.prepare(`
      INSERT INTO match_participants (
        match_id, puuid, summoner_name, champion_name, champion_id, team_id,
        kills, deaths, assists, win, total_damage_dealt, total_damage_to_champions,
        total_minions_killed, gold_earned, role, lane, team_position, profile_icon_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const participant of matchData.info.participants) {
      // Use Riot ID format (gameName#tagLine) if available
      let summonerName = null;

      // Priority 1: Use riotIdGameName (this is the modern format)
      if (participant.riotIdGameName) {
        // Note: Field is "riotIdTagline" (lowercase), not "riotIdTagLine"!
        if (participant.riotIdTagline) {
          summonerName = `${participant.riotIdGameName}#${participant.riotIdTagline}`;
        } else {
          // Fallback for edge cases where tagline might be missing
          summonerName = participant.riotIdGameName;
        }
      }
      // Priority 2: Fall back to legacy summonerName (older accounts)
      else if (participant.summonerName) {
        summonerName = participant.summonerName;
      }

      // Debug logging
      if (!summonerName) {
        console.error('⚠️  WARNING: No summoner name found!');
        console.error('   participant.summonerName:', participant.summonerName);
        console.error('   participant.riotIdGameName:', participant.riotIdGameName);
        console.error('   participant.riotIdTagline:', participant.riotIdTagline);
        console.error('   participant.puuid:', participant.puuid);
      }

      this.savePlayer(participant.puuid, summonerName, matchData.info.platformId, participant.profileIconId);
      // Skin not available from match API; leave null

      participantStmt.run(
        matchData.metadata.matchId,
        participant.puuid,
        summonerName,
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
        participant.teamPosition,
        participant.profileIconId || null
      );
    }
  }

  // Helper: Categorize queue IDs into game modes
  categorizeQueue(queueId) {
    const ranked = [420, 440]; // Ranked Solo/Duo, Ranked Flex
    const normal = [400, 430]; // Normal Draft, Normal Blind
    const aram = [450, 100]; // ARAM
    const arena = [1700]; // Arena
    const other = [0, 700, 720, 830, 840, 850, 900, 1020, 1300, 1400, 1900]; // Custom, Clash, URF, etc.

    if (ranked.includes(queueId)) return 'Ranked';
    if (normal.includes(queueId)) return 'Normal';
    if (aram.includes(queueId)) return 'ARAM';
    if (arena.includes(queueId)) return 'Arena';
    return 'Other';
  }

  getPlayerHistory(summonerName, puuid = null) {
    const config = this.getUserConfig();
    if (!config) {
      return { games: [], stats: null };
    }

    let games;

    // Priority 1: Match by PUUID if available (most reliable)
    if (puuid) {
      const gamesStmt = this.db.prepare(`
        SELECT DISTINCT
          m.match_id,
          m.game_creation,
          m.game_duration,
          m.queue_id,
          opponent.summoner_name as opponent_name,
          opponent.team_position as opponent_team_position,
          opponent.lane as opponent_lane,
          opponent.role as opponent_role,
          opponent.champion_name as opponent_champion,
          opponent.kills as opponent_kills,
          opponent.deaths as opponent_deaths,
          opponent.assists as opponent_assists,
          opponent.win as opponent_win,
          opponent.team_id as opponent_team,
          opponent.profile_icon_id as opponent_profile_icon,
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
        INNER JOIN match_participants opponent ON m.match_id = opponent.match_id
          AND opponent.puuid = ?
          AND opponent.puuid != ?
        WHERE m.game_creation < (strftime('%s', 'now') - 1800) * 1000
        ORDER BY m.game_creation DESC
      `);

      games = gamesStmt.all(config.puuid, puuid, config.puuid);
    }
    // Priority 2: Fallback to name matching (for backwards compatibility or when PUUID unavailable)
    else {
      // Extract game name from Riot ID (e.g., "Player#TAG" -> "Player")
      const gameName = summonerName.split('#')[0];

      console.log(`  DB Query: Searching for "${summonerName}" or "${gameName}"`);

      // Debug: Check what names are in the database
      const checkStmt = this.db.prepare(`
        SELECT DISTINCT summoner_name FROM match_participants
        WHERE LOWER(summoner_name) LIKE LOWER(?)
        LIMIT 5
      `);
      const matchingNames = checkStmt.all(`%${gameName}%`);
      console.log(`  Found similar names in DB:`, matchingNames.map(n => n.summoner_name));

      const gamesStmt = this.db.prepare(`
        SELECT DISTINCT
          m.match_id,
          m.game_creation,
          m.game_duration,
          m.queue_id,
          opponent.summoner_name as opponent_name,
          opponent.team_position as opponent_team_position,
          opponent.lane as opponent_lane,
          opponent.role as opponent_role,
          opponent.champion_name as opponent_champion,
          opponent.kills as opponent_kills,
          opponent.deaths as opponent_deaths,
          opponent.assists as opponent_assists,
          opponent.win as opponent_win,
          opponent.team_id as opponent_team,
          opponent.profile_icon_id as opponent_profile_icon,
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
        INNER JOIN match_participants opponent ON m.match_id = opponent.match_id
          AND (
            LOWER(opponent.summoner_name) = LOWER(?)
            OR LOWER(opponent.summoner_name) = LOWER(?)
            OR LOWER(opponent.summoner_name) LIKE LOWER(? || '#%')
          )
          AND opponent.puuid != ?
        WHERE m.game_creation < (strftime('%s', 'now') - 1800) * 1000
        ORDER BY m.game_creation DESC
      `);

      games = gamesStmt.all(config.puuid, summonerName, gameName, gameName, config.puuid);
    }

    if (games.length === 0) {
      return { games: [], stats: null };
    }

    // Group games by queue category
    const gamesByMode = {};
    games.forEach(game => {
      const mode = this.categorizeQueue(game.queue_id);
      if (!gamesByMode[mode]) {
        gamesByMode[mode] = [];
      }
      gamesByMode[mode].push(game);
    });

    // Split games into teammate/enemy
    const teammateGames = games.filter(g => g.user_team === g.opponent_team);
    const enemyGames = games.filter(g => g.user_team !== g.opponent_team);

    // Helper: Calculate performance stats for a set of games
    const calculatePerformance = (gamesList) => {
      if (gamesList.length === 0) {
        return { avgKills: 0, avgDeaths: 0, avgAssists: 0, avgKDA: 0 };
      }
      const totalKills = gamesList.reduce((sum, g) => sum + g.opponent_kills, 0);
      const totalDeaths = gamesList.reduce((sum, g) => sum + g.opponent_deaths, 0);
      const totalAssists = gamesList.reduce((sum, g) => sum + g.opponent_assists, 0);
      const avgKills = totalKills / gamesList.length;
      const avgDeaths = totalDeaths / gamesList.length;
      const avgAssists = totalAssists / gamesList.length;
      const avgKDA = avgDeaths > 0 ? (avgKills + avgAssists) / avgDeaths : avgKills + avgAssists;
      return {
        avgKills: Math.round(avgKills * 10) / 10,
        avgDeaths: Math.round(avgDeaths * 10) / 10,
        avgAssists: Math.round(avgAssists * 10) / 10,
        avgKDA: Math.round(avgKDA * 10) / 10
      };
    };

    // Helper: Get top champions for a set of games
    const getTopChampions = (gamesList) => {
      const championMap = {};
      gamesList.forEach(g => {
        const champ = g.opponent_champion;
        if (!championMap[champ]) {
          championMap[champ] = { wins: 0, losses: 0, games: 0 };
        }
        championMap[champ].games++;
        if (g.opponent_win === 1) {
          championMap[champ].wins++;
        } else {
          championMap[champ].losses++;
        }
      });

      return Object.entries(championMap)
        .map(([champion, stats]) => ({
          champion,
          games: stats.games,
          wins: stats.wins,
          losses: stats.losses,
          winRate: Math.round((stats.wins / stats.games) * 100)
        }))
        .sort((a, b) => b.games - a.games)
        .slice(0, 3); // Top 3 champions
    };

    // Helper: Get role stats (Jungle/Support/etc)
    const getRoleStats = (gamesList) => {
      const roleMap = {};

      gamesList.forEach(g => {
        const rawRole = (
          g.opponent_team_position ||
          g.opponent_lane ||
          g.opponent_role ||
          ''
        ).toUpperCase();
        // Normalize Riot role strings into friendlier labels
        const role = {
          JUNGLE: 'Jungle',
          JG: 'Jungle',
          TOP: 'Top',
          MIDDLE: 'Mid',
          MID: 'Mid',
          BOTTOM: 'ADC',
          ADC: 'ADC',
          DUO_CARRY: 'ADC',
          UTILITY: 'Support',
          SUPPORT: 'Support',
        }[rawRole] || 'Unknown';

        if (!roleMap[role]) {
          roleMap[role] = { wins: 0, losses: 0, games: 0 };
        }

        roleMap[role].games += 1;
        if (g.user_win === 1) {
          roleMap[role].wins += 1;
        } else {
          roleMap[role].losses += 1;
        }
      });

      return Object.entries(roleMap)
        .map(([role, stats]) => ({
          role,
          games: stats.games,
          wins: stats.wins,
          losses: stats.losses,
          winRate: Math.round((stats.wins / stats.games) * 100)
        }))
        .sort((a, b) => b.games - a.games);
    };

    // Helper: Get recent form (last 5 games)
    const getRecentForm = (gamesList) => {
      return gamesList
        .slice(0, 5)
        .map(g => g.user_win === 1 ? 'W' : 'L');
    };

    // Helper: Calculate stats for a specific game mode
    const calculateModeStats = (modeGames, isEnemy) => {
      const relevantGames = isEnemy
        ? modeGames.filter(g => g.user_team !== g.opponent_team)
        : modeGames.filter(g => g.user_team === g.opponent_team);

      if (relevantGames.length === 0) return null;

      const wins = relevantGames.filter(g => g.user_win === 1).length;
      return {
        games: relevantGames.length,
        wins,
        losses: relevantGames.length - wins,
        winRate: Math.round((wins / relevantGames.length) * 100),
        lastPlayed: new Date(relevantGames[0].game_creation),
        recentForm: getRecentForm(relevantGames),
        topChampions: getTopChampions(relevantGames),
        performance: calculatePerformance(relevantGames),
        roleStats: getRoleStats(relevantGames)
      };
    };

    // Calculate enemy stats
    const enemyWins = enemyGames.filter(g => g.user_win === 1).length;
    const enemyStats = {
      games: enemyGames.length,
      wins: enemyWins,
      losses: enemyGames.length - enemyWins,
      winRate: enemyGames.length > 0 ? Math.round((enemyWins / enemyGames.length) * 100) : 0,
      lastPlayed: enemyGames.length > 0 ? new Date(enemyGames[0].game_creation) : null,
      recentForm: getRecentForm(enemyGames),
      topChampions: getTopChampions(enemyGames),
      performance: calculatePerformance(enemyGames),
      roleStats: getRoleStats(enemyGames)
    };

    // Calculate ally stats
    const allyWins = teammateGames.filter(g => g.user_win === 1).length;
    const allyStats = {
      games: teammateGames.length,
      wins: allyWins,
      losses: teammateGames.length - allyWins,
      winRate: teammateGames.length > 0 ? Math.round((allyWins / teammateGames.length) * 100) : 0,
      lastPlayed: teammateGames.length > 0 ? new Date(teammateGames[0].game_creation) : null,
      recentForm: getRecentForm(teammateGames),
      topChampions: getTopChampions(teammateGames),
      performance: calculatePerformance(teammateGames),
      roleStats: getRoleStats(teammateGames)
    };

    // Calculate threat level based on enemy win rate
    let threatLevel = 'medium';
    if (enemyGames.length > 0) {
      if (enemyStats.winRate < 40) threatLevel = 'low';
      else if (enemyStats.winRate > 60) threatLevel = 'high';
    }

    // Calculate ally quality based on ally win rate
    let allyQuality = 'average';
    if (teammateGames.length > 0) {
      if (allyStats.winRate < 40) allyQuality = 'poor';
      else if (allyStats.winRate > 60) allyQuality = 'good';
    }

    // Get last seen info (most recent game overall)
    const lastGame = games[0];
    const isAlly = lastGame.user_team === lastGame.opponent_team;
    const lastSeen = {
      timestamp: new Date(lastGame.game_creation),
      champion: lastGame.opponent_champion,
      role: lastGame.team_position || null,
      outcome: lastGame.user_win === 1 ? 'win' : 'loss',
      isAlly
    };

    // Get profile icon from most recent game
    const profileIconId = lastGame.opponent_profile_icon || null;

    // Calculate mode-specific stats
    const byMode = {};
    Object.keys(gamesByMode).forEach(mode => {
      const modeGames = gamesByMode[mode];
      byMode[mode] = {
        asEnemy: calculateModeStats(modeGames, true),
        asAlly: calculateModeStats(modeGames, false)
      };
    });

    return {
      games,
      stats: {
        totalGames: games.length,
        asTeammate: {
          games: teammateGames.length,
          wins: allyWins,
          losses: teammateGames.length - allyWins,
          winRate: teammateGames.length > 0 ? ((allyWins / teammateGames.length) * 100).toFixed(0) : 0
        },
        asEnemy: {
          games: enemyGames.length,
          wins: enemyWins,
          losses: enemyGames.length - enemyWins,
          winRate: enemyGames.length > 0 ? ((enemyWins / enemyGames.length) * 100).toFixed(0) : 0
        },
        // Enhanced stats for new UI
        enhanced: {
          asEnemy: enemyStats,
          asAlly: allyStats,
          lastSeen,
          threatLevel,
          allyQuality,
          byMode,  // Add mode-specific stats
          profileIconId  // Add profile icon
        }
      }
    };
  }

  /**
   * Get the most recent match roster that includes the configured user.
   * Returns players with team info so the renderer can show a scoreboard-style view.
   */
  getMostRecentMatchRoster() {
    const config = this.getUserConfig();
    if (!config?.puuid) {
      return null;
    }

    // Find the latest match the user participated in
    const matchStmt = this.db.prepare(`
      SELECT m.match_id, m.queue_id, m.game_creation
      FROM matches m
      INNER JOIN match_participants mp ON m.match_id = mp.match_id AND mp.puuid = ?
      ORDER BY m.game_creation DESC
      LIMIT 1
    `);

    const match = matchStmt.get(config.puuid);
    if (!match) {
      return null;
    }

    const rosterStmt = this.db.prepare(`
      SELECT
        mp.puuid,
        mp.summoner_name,
        mp.champion_name,
        mp.champion_id,
        mp.team_id,
        mp.role,
        mp.lane,
        mp.team_position,
        mp.profile_icon_id,
        mp.win,
        p.skin_id as skin_id
      FROM match_participants mp
      LEFT JOIN players p ON p.puuid = mp.puuid
      WHERE mp.match_id = ?
      ORDER BY mp.team_id ASC
    `);

    const playersRaw = rosterStmt.all(match.match_id);
    const seen = new Map();
    const playersBase = [];

    for (const p of playersRaw) {
      const key = `${p.puuid}-${p.team_id}`;
      if (seen.has(key)) {
        continue; // dedupe duplicate participant rows for the same match
      }
      seen.set(key, true);
      playersBase.push({
        puuid: p.puuid,
        summonerName: p.summoner_name,
        championName: p.champion_name,
        championId: p.champion_id,
        championName: p.champion_name,
        teamId: p.team_id,
        role: p.role,
        lane: p.lane,
        teamPosition: p.team_position,
        profileIconId: p.profile_icon_id,
        win: p.win === 1,
        skinId: p.skin_id || null
      });
    }

    // Enrich with encounter stats
    const players = playersBase.map((p) => {
      let encounterCount = 0;
      let wins = 0;
      let losses = 0;
      let winRate = 0;
      let asEnemy = null;
      let asAlly = null;
      let lastSeen = null;
      let threatLevel = null;
      let allyQuality = null;
      let byMode = null;
      let gamesTransformed = [];

      try {
        const history = this.getPlayerHistory(p.summonerName, p.puuid);
        if (history && history.stats) {
          encounterCount = history.stats.totalGames || 0;
          const enemyWins = Number(history.stats.asEnemy?.wins || 0);
          const allyWins = Number(history.stats.asTeammate?.wins || 0);
          wins = enemyWins + allyWins;
          losses = Math.max(encounterCount - wins, 0);
          winRate = encounterCount > 0 ? Math.round((wins / encounterCount) * 100) : 0;

          asEnemy = history.stats.enhanced.asEnemy;
          asAlly = history.stats.enhanced.asAlly;
          lastSeen = history.stats.enhanced.lastSeen;
          threatLevel = history.stats.enhanced.threatLevel;
          allyQuality = history.stats.enhanced.allyQuality;
          byMode = history.stats.enhanced.byMode;

          gamesTransformed = history.games.map(g => ({
            gameId: g.match_id,
            champion: g.opponent_champion,
            role: g.team_position,
            outcome: g.user_win === 1 ? 'win' : 'loss',
            kda: {
              kills: g.opponent_kills,
              deaths: g.opponent_deaths,
              assists: g.opponent_assists
            },
            timestamp: new Date(g.game_creation),
            isAlly: g.user_team === g.opponent_team
          }));
        }
      } catch (err) {
        // Swallow errors; leave defaults
      }

      return {
        ...p,
        encounterCount,
        wins,
        losses,
        winRate,
        asEnemy,
        asAlly,
        lastSeen,
        threatLevel,
        allyQuality,
        byMode,
        games: gamesTransformed
      };
    });

    const userTeamId = players.find(p => p.puuid === config.puuid)?.teamId || null;

    return {
      matchId: match.match_id,
      queueId: match.queue_id,
      gameCreation: match.game_creation,
      userTeamId,
      players
    };
  }

  // ========== Player Tagging Methods ==========

  /**
   * Add or update a tag for a player
   * @param {string} puuid - Player's PUUID
   * @param {string} summonerName - Player's summoner name
   * @param {string} tagType - 'toxic', 'friendly', 'notable', or 'duo'
   * @param {string|null} note - Optional note text
   */
  addPlayerTag(puuid, summonerName, tagType, note = null) {
    const stmt = this.db.prepare(`
      INSERT INTO player_tags (puuid, summoner_name, tag_type, note, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(puuid, tag_type) DO UPDATE SET
        summoner_name = excluded.summoner_name,
        note = excluded.note,
        created_at = excluded.created_at
    `);
    return stmt.run(puuid, summonerName, tagType, note, Date.now());
  }

  /**
   * Remove a specific tag from a player
   * @param {string} puuid - Player's PUUID
   * @param {string} tagType - Tag type to remove
   */
  removePlayerTag(puuid, tagType) {
    const stmt = this.db.prepare(`
      DELETE FROM player_tags WHERE puuid = ? AND tag_type = ?
    `);
    return stmt.run(puuid, tagType);
  }

  /**
   * Remove all tags from a player
   * @param {string} puuid - Player's PUUID
   */
  removeAllPlayerTags(puuid) {
    const stmt = this.db.prepare(`
      DELETE FROM player_tags WHERE puuid = ?
    `);
    return stmt.run(puuid);
  }

  /**
   * Get all tags for a specific player
   * @param {string} puuid - Player's PUUID
   * @returns {Array} Array of tag objects
   */
  getPlayerTags(puuid) {
    const stmt = this.db.prepare(`
      SELECT tag_type, note, created_at FROM player_tags WHERE puuid = ?
    `);
    return stmt.all(puuid);
  }

  /**
   * Get all tagged players
   * @returns {Array} Array of tagged player objects with their tags
   */
  getAllTaggedPlayers() {
    const stmt = this.db.prepare(`
      SELECT puuid, summoner_name, tag_type, note, created_at
      FROM player_tags
      ORDER BY created_at DESC
    `);
    return stmt.all();
  }

  /**
   * Check if a player has any tags
   * @param {string} puuid - Player's PUUID
   * @returns {boolean}
   */
  hasPlayerTags(puuid) {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM player_tags WHERE puuid = ?
    `);
    const result = stmt.get(puuid);
    return result.count > 0;
  }

  /**
   * Update auto-update check setting
   * @param {boolean} enabled
   */
  setAutoUpdateCheck(enabled) {
    // First ensure the column exists (for existing databases)
    try {
      const stmt = this.db.prepare(`
        UPDATE user_config SET auto_update_check = ? WHERE id = (SELECT id FROM user_config ORDER BY id DESC LIMIT 1)
      `);
      stmt.run(enabled ? 1 : 0);
    } catch (error) {
      // Column might not exist in old schema, add it
      this.db.exec('ALTER TABLE user_config ADD COLUMN auto_update_check INTEGER DEFAULT 1');
      const stmt = this.db.prepare(`
        UPDATE user_config SET auto_update_check = ? WHERE id = (SELECT id FROM user_config ORDER BY id DESC LIMIT 1)
      `);
      stmt.run(enabled ? 1 : 0);
    }
  }

  /**
   * Update auto-start setting
   * @param {boolean} enabled
   */
  setAutoStart(enabled) {
    // First ensure the column exists (for existing databases)
    try {
      const stmt = this.db.prepare(`
        UPDATE user_config SET auto_start = ? WHERE id = (SELECT id FROM user_config ORDER BY id DESC LIMIT 1)
      `);
      stmt.run(enabled ? 1 : 0);
    } catch (error) {
      // Column might not exist in old schema, add it
      this.db.exec('ALTER TABLE user_config ADD COLUMN auto_start INTEGER DEFAULT 0');
      const stmt = this.db.prepare(`
        UPDATE user_config SET auto_start = ? WHERE id = (SELECT id FROM user_config ORDER BY id DESC LIMIT 1)
      `);
      stmt.run(enabled ? 1 : 0);
    }
  }

  /**
   * Get auto-start setting
   * @returns {boolean}
   */
  getAutoStart() {
    try {
      const config = this.getUserConfig();
      return config?.auto_start === 1;
    } catch (error) {
      return false;
    }
  }

  close() {
    this.db.close();
  }
}

module.exports = DatabaseManager;
