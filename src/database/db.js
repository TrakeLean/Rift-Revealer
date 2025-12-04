const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Helper: Format display name from username and tag_line
function formatRiotId(username, tagLine) {
  if (!username) return 'Unknown';
  if (!tagLine) return username;
  return `${username}#${tagLine}`;
}

// Helper: Parse Riot ID string into components
function parseRiotId(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return { username: null, tagLine: null };
  }
  const trimmed = fullName.trim();
  if (trimmed.includes('#')) {
    const [username, tagLine] = trimmed.split('#').map(s => s.trim());
    return { username: username || null, tagLine: tagLine || null };
  }
  // Legacy name without tag or just username
  return { username: trimmed, tagLine: null };
}

// Helper: Normalize for comparison (case-insensitive, no spaces)
function normalizeForComparison(str) {
  if (!str) return '';
  return str.trim().toLowerCase().replace(/\s+/g, '');
}

function isConfiguredUser(config, puuid, username, tagLine) {
  if (!config) return false;
  if (config.puuid && puuid && config.puuid === puuid) return true;
  if (!config.username || !username) return false;

  const configUserNorm = normalizeForComparison(config.username);
  const playerUserNorm = normalizeForComparison(username);

  // Match if usernames match
  if (configUserNorm === playerUserNorm) {
    // Exact tag match (if both present)
    if (config.tag_line && tagLine) {
      return normalizeForComparison(config.tag_line) === normalizeForComparison(tagLine);
    }
    // If no tag info, match on username alone
    return true;
  }
  return false;
}

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

    // In-memory cache of live skin selections (by puuid and normalized name)
    this.liveSkinSelections = {
      puuid: new Map(),
      name: new Map()
    };
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
    // NOTE: Since you deleted the database, migrations are simplified
    // Removed skin_cache table creation - no longer needed with direct CDN URLs

    // Add unique constraint on (match_id, puuid) to prevent duplicate imports
    const hasUniqueConstraint = this.db.prepare(`
      SELECT sql FROM sqlite_master
      WHERE type='table' AND name='match_participants'
      AND sql LIKE '%UNIQUE%match_id%puuid%'
    `).get();

    if (!hasUniqueConstraint) {
      console.log('Running migration: Adding unique constraint to match_participants');
      console.log('  This will remove duplicate entries...');

      // SQLite doesn't support adding constraints to existing tables, so we need to recreate it
      this.db.exec('PRAGMA foreign_keys=OFF');

      this.db.exec(`
        BEGIN TRANSACTION;

        -- Create new table with unique constraint
        CREATE TABLE match_participants_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          match_id TEXT NOT NULL,
          puuid TEXT NOT NULL,
          username TEXT,
          tag_line TEXT,
          champion_name TEXT,
          champion_id INTEGER,
          skin_id INTEGER,
          team_id INTEGER,
          kills INTEGER,
          deaths INTEGER,
          assists INTEGER,
          win INTEGER,
          lane TEXT,
          FOREIGN KEY (match_id) REFERENCES matches(match_id),
          FOREIGN KEY (puuid) REFERENCES players(puuid),
          UNIQUE(match_id, puuid)
        );

        -- Copy data, removing duplicates (keep the first occurrence)
        INSERT INTO match_participants_new (
          match_id, puuid, username, tag_line, champion_name, champion_id,
          skin_id, team_id, kills, deaths, assists, win, lane
        )
        SELECT DISTINCT match_id, puuid, username, tag_line, champion_name, champion_id,
          skin_id, team_id, kills, deaths, assists, win, lane
        FROM match_participants
        GROUP BY match_id, puuid;

        -- Drop old table and rename new one
        DROP TABLE match_participants;
        ALTER TABLE match_participants_new RENAME TO match_participants;

        -- Recreate indexes
        CREATE INDEX idx_participants_match ON match_participants(match_id);
        CREATE INDEX idx_participants_puuid ON match_participants(puuid);

        COMMIT;
      `);

      this.db.exec('PRAGMA foreign_keys=ON');
      console.log('  Migration complete: duplicates removed, unique constraint added');
    }

    console.log('Database migrations completed');
  }

  getUserConfig() {
    const stmt = this.db.prepare('SELECT * FROM user_config LIMIT 1');
    return stmt.get();
  }

  saveUserConfig(config) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO user_config (id, puuid, username, tag_line, region, riot_api_key, last_updated, auto_update_check, auto_start)
      VALUES (1, ?, ?, ?, ?, ?, ?, COALESCE(?, 1), COALESCE(?, 0))
    `);
    return stmt.run(
      config.puuid,
      config.username,
      config.tag_line,
      config.region,
      config.riot_api_key,
      Date.now(),
      config.auto_update_check ?? 1,
      config.auto_start ?? 0
    );
  }

  savePlayer(puuid, username, tagLine, region, profileIconId = null) {
    const stmt = this.db.prepare(`
      INSERT INTO players (puuid, username, tag_line, region, last_seen, profile_icon_id)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(puuid) DO UPDATE SET
        username = excluded.username,
        tag_line = excluded.tag_line,
        region = excluded.region,
        last_seen = excluded.last_seen,
        profile_icon_id = excluded.profile_icon_id
    `);
    return stmt.run(puuid, username, tagLine, region, Date.now(), profileIconId);
  }

  setLiveSkinSelections(players = [], clearFirst = false) {
    try {
      // Only clear cache if explicitly requested (e.g., new lobby started)
      // Otherwise, merge new data with existing cache to preserve skins across state transitions
      if (clearFirst) {
        this.liveSkinSelections.puuid.clear();
        this.liveSkinSelections.name.clear();
        console.log('  [Skin Cache] Cleared cache (clearFirst=true)');
      }

      let added = 0;
      players.forEach((p) => {
        if (!p || p.skinId === undefined || p.skinId === null) return;
        const entry = { skinId: p.skinId, championId: p.championId ?? null };

        if (p.puuid) {
          this.liveSkinSelections.puuid.set(p.puuid, entry);
          added++;
        }
        if (p.username && p.tagLine) {
          const fullName = formatRiotId(p.username, p.tagLine);
          const norm = normalizeForComparison(fullName);
          if (norm) {
            this.liveSkinSelections.name.set(norm, entry);
          }
        }
      });

      console.log(`  [Skin Cache] Added ${added} skin(s), total cached: ${this.liveSkinSelections.puuid.size} by PUUID, ${this.liveSkinSelections.name.size} by name`);
    } catch (err) {
      console.warn('Failed to cache live skin selections:', err.message);
    }
  }

  getLiveSkinSelection(puuid, username, tagLine) {
    // Try Riot match PUUID then fallback to normalized name (handles LCU PUUID mismatch)
    if (puuid && this.liveSkinSelections.puuid.has(puuid)) {
      return this.liveSkinSelections.puuid.get(puuid);
    }
    const fullName = formatRiotId(username, tagLine);
    const norm = normalizeForComparison(fullName);
    if (norm && this.liveSkinSelections.name.has(norm)) {
      return this.liveSkinSelections.name.get(norm);
    }
    return null;
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
      console.log('    riotIdGameName:', first.riotIdGameName);
      console.log('    riotIdTagline:', first.riotIdTagline);
    }

    // Prepare statement (execution deferred until after role inference)
    const participantStmt = this.db.prepare(`
      INSERT INTO match_participants (
        match_id, puuid, username, tag_line, champion_name, champion_id, skin_id, team_id,
        kills, deaths, assists, win, lane
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Helper: normalize role to canonical slots
    const normalizeRole = (participant) => {
      const raw =
        (participant.teamPosition ||
          participant.individualPosition ||
          participant.role ||
          participant.lane ||
          '')
          .toString()
          .toUpperCase()
          .trim();

      if (!raw || raw === 'INVALID') return 'UNKNOWN';
      if (['TOP'].includes(raw)) return 'TOP';
      if (['JUNGLE', 'JUNG', 'JG'].includes(raw)) return 'JUNGLE';
      if (['MIDDLE', 'MID', 'MIDL'].includes(raw)) return 'MIDDLE';
      if (['BOTTOM', 'BOT', 'ADC', 'DUO_CARRY', 'DUO'].includes(raw)) return 'BOTTOM';
      if (['UTILITY', 'SUPPORT', 'SUP', 'DUO_SUPPORT'].includes(raw)) return 'SUPPORT';
      return raw; // Keep unexpected but non-empty values for visibility
    };

    const processedParticipants = [];

    for (const participant of matchData.info.participants) {
      // Use Riot ID format (username#tagLine)
      let username = null;
      let tagLine = null;

      // Priority 1: Use riotIdGameName (this is the modern format)
      if (participant.riotIdGameName) {
        username = participant.riotIdGameName;
        tagLine = participant.riotIdTagline || null;
      }

      // Debug logging
      if (!username) {
        console.error('⚠️  WARNING: No username found!');
        console.error('   participant.riotIdGameName:', participant.riotIdGameName);
        console.error('   participant.riotIdTagline:', participant.riotIdTagline);
        console.error('   participant.puuid:', participant.puuid);
      }

      const profileIconId = participant.profileIcon || participant.profileIconId || null;
      this.savePlayer(participant.puuid, username, tagLine, matchData.info.platformId, profileIconId);

      // Prefer live skin selection (captured from champ select / gameflow) when match data lacks skin info.
      // Riot match API PUUIDs can differ from LCU PUUIDs, so also fall back to name-based lookup.
      const liveSkin = this.getLiveSkinSelection(participant.puuid, username, tagLine);
      const resolvedSkinId =
        participant.skinId ??
        (liveSkin && (liveSkin.championId === null || liveSkin.championId === participant.championId) ? liveSkin.skinId : null) ??
        (participant.championId ? participant.championId * 1000 : null); // Fallback to default skin (base skin ID)

      const lane = normalizeRole(participant);

      processedParticipants.push({
        participant,
        username,
        tagLine,
        resolvedSkinId,
        lane
      });
    }

    // Infer missing/invalid roles per team for SR-style queues
    const expectedRoles = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'SUPPORT'];
    const byTeam = new Map();
    for (const p of processedParticipants) {
      const team = p.participant.teamId ?? 0;
      if (!byTeam.has(team)) byTeam.set(team, []);
      byTeam.get(team).push(p);
    }

    for (const [teamId, players] of byTeam.entries()) {
      const present = new Set(players.map(p => p.lane).filter(r => r && r !== 'UNKNOWN'));
      const missing = expectedRoles.filter(r => !present.has(r));
      const unknowns = players.filter(p => !p.lane || p.lane === 'UNKNOWN');
      for (const u of unknowns) {
        const next = missing.shift();
        if (next) {
          u.lane = next;
        }
      }
    }

    // Persist participants after role inference
    for (const p of processedParticipants) {
      participantStmt.run(
        matchData.metadata.matchId,
        p.participant.puuid,
        p.username,
        p.tagLine,
        p.participant.championName,
        p.participant.championId,
        p.resolvedSkinId ?? null,
        p.participant.teamId,
        p.participant.kills,
        p.participant.deaths,
        p.participant.assists,
        p.participant.win ? 1 : 0,
        p.lane
      );
    }
  }

  // Helper: Categorize queue IDs into game modes
  categorizeQueue(queueId) {
    const ranked = [420, 440]; // Ranked Solo/Duo, Ranked Flex
    const normal = [400, 430]; // Normal Draft, Normal Blind
    const aram = [450, 100, 2400]; // ARAM (includes ARAM Mayhem)
    const arena = [1700]; // Arena
    const other = [0, 700, 720, 830, 840, 850, 900, 1020, 1300, 1400, 1900]; // Custom, Clash, URF, etc.

    if (ranked.includes(queueId)) return 'Ranked';
    if (normal.includes(queueId)) return 'Normal';
    if (aram.includes(queueId)) return 'ARAM';
    if (arena.includes(queueId)) return 'Arena';
    return 'Other';
  }

  getPlayerHistory(username, tagLine, puuid = null) {
    const config = this.getUserConfig();
    if (!config) {
      return { games: [], stats: null };
    }

    // Normalize for comparison
    const usernameNorm = normalizeForComparison(username);
    const tagLineNorm = normalizeForComparison(tagLine);

    // Always start with an empty list; we'll fill it with the first successful query
    let games = [];

    // Priority 1: Match by PUUID if available (most reliable)
    if (puuid) {
      const gamesStmt = this.db.prepare(`
        SELECT DISTINCT
          m.match_id,
          m.game_creation,
          m.game_duration,
          m.queue_id,
          opponent.username as opponent_username,
          opponent.tag_line as opponent_tag_line,
          opponent.lane as opponent_lane,
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
          user.team_id as user_team
        FROM matches m
        INNER JOIN match_participants user ON m.match_id = user.match_id AND user.puuid = ?
        INNER JOIN match_participants opponent ON m.match_id = opponent.match_id
          AND opponent.puuid = ?
          AND opponent.puuid != ?
        ORDER BY m.game_creation DESC
      `);

      games = gamesStmt.all(config.puuid, puuid, config.puuid);
    }

    // Priority 2: Fallback to name matching (PUUIDs can occasionally differ between LCU and Match API)
    if ((!games || games.length === 0) && username) {
      console.log(`  DB Query: Searching for "${username}#${tagLine || ''}" (PUUID lookup empty)`);

      // Debug: Check what names are in the database
      const checkStmt = this.db.prepare(`
        SELECT DISTINCT username, tag_line FROM match_participants
        WHERE LOWER(REPLACE(username, ' ', '')) LIKE LOWER(?)
        LIMIT 5
      `);
      const matchingNames = checkStmt.all(`%${usernameNorm}%`);
      console.log(`  Found similar names in DB:`, matchingNames.map(n => formatRiotId(n.username, n.tag_line)));

      const gamesStmt = this.db.prepare(`
        SELECT DISTINCT
          m.match_id,
          m.game_creation,
          m.game_duration,
          m.queue_id,
          opponent.username as opponent_username,
          opponent.tag_line as opponent_tag_line,
          opponent.lane as opponent_lane,
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
          user.team_id as user_team
        FROM matches m
        INNER JOIN match_participants user ON m.match_id = user.match_id AND user.puuid = ?
        INNER JOIN match_participants opponent ON m.match_id = opponent.match_id
          AND (
            -- Exact username match (case-insensitive, no spaces)
            LOWER(REPLACE(opponent.username, ' ', '')) = ?
            -- Also match tagline if provided
            ${tagLine ? "AND LOWER(REPLACE(opponent.tag_line, ' ', '')) = ?" : ''}
          )
          AND opponent.puuid != ?
        ORDER BY m.game_creation DESC
      `);

      const params = [config.puuid, usernameNorm];
      if (tagLine) {
        params.push(tagLineNorm);
      }
      params.push(config.puuid);

      games = gamesStmt.all(...params);
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
        const rawRole = (g.opponent_lane || '').toUpperCase();
        // Normalize Riot role strings into friendlier labels
        const role = {
          JUNGLE: 'Jungle',
          TOP: 'Top',
          MIDDLE: 'Mid',
          MID: 'Mid',
          BOTTOM: 'ADC',
          ADC: 'ADC',
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
      role: lastGame.opponent_lane || null,
      outcome: lastGame.user_win === 1 ? 'win' : 'loss',
      isAlly
    };

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
          byMode
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
        mp.username,
        mp.tag_line,
        mp.champion_name,
        mp.champion_id,
        mp.skin_id,
        mp.team_id,
        mp.lane,
        mp.win,
        p.profile_icon_id as profile_icon_id
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
        username: p.username,
        tagLine: p.tag_line,
        championName: p.champion_name,
        championId: p.champion_id,
        teamId: p.team_id,
        role: null,
        lane: p.lane,
        teamPosition: p.lane,
        profileIconId: p.profile_icon_id,
        win: p.win === 1,
        skinId: p.skin_id ?? null
      });
    }

    const userTeamId =
      playersBase.find(p => isConfiguredUser(config, p.puuid, p.username, p.tagLine))?.teamId || null;

    // Enrich with encounter stats; avoid querying for the configured user
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

      if (!isConfiguredUser(config, p.puuid, p.username, p.tagLine)) {
        try {
          const history = this.getPlayerHistory(p.username, p.tagLine, p.puuid);
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
              role: g.opponent_lane || null,
              outcome: g.user_win === 1 ? 'win' : 'loss',
              kda: {
                kills: g.opponent_kills,
                deaths: g.opponent_deaths,
                assists: g.opponent_assists
              },
              timestamp: new Date(g.game_creation),
              isAlly: g.user_team === g.opponent_team
            }));
          } else {
            console.log(`[Last Match Roster] No history found for ${formatRiotId(p.username, p.tagLine)} (PUUID: ${p.puuid})`);
          }
        } catch (err) {
          console.error(`[Last Match Roster] Error getting history for ${formatRiotId(p.username, p.tagLine)}:`, err.message);
        }
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
   * @param {string} username - Player's username
   * @param {string} tagLine - Player's tag line
   * @param {string} tagType - 'toxic', 'friendly', 'notable', or 'duo'
   * @param {string|null} note - Optional note text
   */
  addPlayerTag(puuid, username, tagLine, tagType, note = null) {
    const stmt = this.db.prepare(`
      INSERT INTO player_tags (puuid, username, tag_line, tag_type, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(puuid, tag_type) DO UPDATE SET
        username = excluded.username,
        tag_line = excluded.tag_line,
        note = excluded.note,
        created_at = excluded.created_at
    `);
    return stmt.run(puuid, username, tagLine, tagType, note, Date.now());
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
      SELECT puuid, username, tag_line, tag_type, note, created_at
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
    const stmt = this.db.prepare(`
      UPDATE user_config SET auto_update_check = ? WHERE id = 1
    `);
    stmt.run(enabled ? 1 : 0);
  }

  /**
   * Update auto-start setting
   * @param {boolean} enabled
   */
  setAutoStart(enabled) {
    const stmt = this.db.prepare(`
      UPDATE user_config SET auto_start = ? WHERE id = 1
    `);
    stmt.run(enabled ? 1 : 0);
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
module.exports.formatRiotId = formatRiotId;
module.exports.parseRiotId = parseRiotId;
