// Simulate lobby analysis to debug why players aren't showing up
const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'rift-revealer', 'database', 'rift-revealer.db');
console.log('DB path:', dbPath);

const db = new Database(dbPath, { readonly: true });

// Import the helper functions from db.js
function formatRiotId(username, tagLine) {
  if (!username) return 'Unknown';
  if (!tagLine) return username;
  return `${username}#${tagLine}`;
}

function parseRiotId(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return { username: null, tagLine: null };
  }
  const trimmed = fullName.trim();
  if (trimmed.includes('#')) {
    const [username, tagLine] = trimmed.split('#').map(s => s.trim());
    return { username: username || null, tagLine: tagLine || null };
  }
  return { username: trimmed, tagLine: null };
}

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

  if (configUserNorm === playerUserNorm) {
    if (config.tag_line && tagLine) {
      return normalizeForComparison(config.tag_line) === normalizeForComparison(tagLine);
    }
    return true;
  }
  return false;
}

// Get config
const config = db.prepare('SELECT * FROM user_config').get();
console.log('\n=== User Config ===');
console.log(`User: ${formatRiotId(config.username, config.tag_line)}`);
console.log(`PUUID: ${config.puuid}`);

// Simulate lobby players (based on your database - players you've actually played with)
const simulatedLobby = [
  {
    username: 'Trake',
    tagLine: 'Lean',
    puuid: config.puuid, // You
    championId: 157,
    profileIconId: 5000,
    source: 'championSelect'
  },
  {
    username: 'yingman',
    tagLine: 'ying',
    puuid: null, // Simulate not having PUUID from LCU
    championId: 64,
    profileIconId: 5001,
    source: 'championSelect'
  },
  {
    username: 'timsi',
    tagLine: 'YOKAI',
    puuid: null,
    championId: 238,
    profileIconId: 5002,
    source: 'championSelect'
  },
  {
    username: 'Saddam Stoned',
    tagLine: 'EUW',
    puuid: null,
    championId: 84,
    profileIconId: 5003,
    source: 'championSelect'
  },
  {
    username: 'RandomPlayer',
    tagLine: 'NA1',
    puuid: null, // This player is NOT in your history
    championId: 99,
    profileIconId: 5004,
    source: 'championSelect'
  }
];

console.log('\n=== SIMULATING LOBBY ANALYSIS ===');
console.log('Lobby players:', simulatedLobby.map(p => formatRiotId(p.username, p.tagLine)));

const analysis = [];

for (const player of simulatedLobby) {
  console.log(`\n--- Analyzing: ${formatRiotId(player.username, player.tagLine)} ---`);

  // Check if it's the current user
  if (isConfiguredUser(config, player.puuid, player.username, player.tagLine)) {
    console.log('  ✓ Skipping self');
    continue;
  }

  console.log(`  Player data: username="${player.username}", tagLine="${player.tagLine}", puuid="${player.puuid}"`);

  // Simulate getPlayerHistory
  const usernameNorm = normalizeForComparison(player.username);
  const tagLineNorm = normalizeForComparison(player.tagLine);

  let games = [];

  // Try PUUID query first
  if (player.puuid) {
    console.log('  Trying PUUID query...');
    const gamesStmt = db.prepare(`
      SELECT DISTINCT
        m.match_id,
        opponent.username as opponent_username,
        opponent.tag_line as opponent_tag_line
      FROM matches m
      INNER JOIN match_participants user ON m.match_id = user.match_id AND user.puuid = ?
      INNER JOIN match_participants opponent ON m.match_id = opponent.match_id
        AND opponent.puuid = ?
        AND opponent.puuid != ?
      ORDER BY m.game_creation DESC
      LIMIT 5
    `);
    games = gamesStmt.all(config.puuid, player.puuid, config.puuid);
    console.log(`    Found ${games.length} games via PUUID`);
  }

  // Fallback to name matching
  if (games.length === 0 && player.username) {
    console.log('  Trying name-based query...');
    console.log(`    Normalized username: "${usernameNorm}"`);
    console.log(`    Normalized tagLine: "${tagLineNorm}"`);

    const gamesStmt = db.prepare(`
      SELECT DISTINCT
        m.match_id,
        opponent.username as opponent_username,
        opponent.tag_line as opponent_tag_line,
        opponent.puuid as opponent_puuid
      FROM matches m
      INNER JOIN match_participants user ON m.match_id = user.match_id AND user.puuid = ?
      INNER JOIN match_participants opponent ON m.match_id = opponent.match_id
        AND (
          LOWER(REPLACE(opponent.username, ' ', '')) = ?
          ${player.tagLine ? "AND LOWER(REPLACE(opponent.tag_line, ' ', '')) = ?" : ''}
        )
        AND opponent.puuid != ?
      ORDER BY m.game_creation DESC
      LIMIT 5
    `);

    const params = [config.puuid, usernameNorm];
    if (player.tagLine) {
      params.push(tagLineNorm);
    }
    params.push(config.puuid);

    games = gamesStmt.all(...params);
    console.log(`    Found ${games.length} games via name`);
  }

  if (games.length > 0) {
    console.log(`  ✓ FOUND ${games.length} games! Player SHOULD appear in UI`);
    games.forEach((g, i) => {
      console.log(`    ${i + 1}. ${g.opponent_username}#${g.opponent_tag_line} (${g.match_id})`);
    });
    analysis.push(player);
  } else {
    console.log(`  ✗ No games found - player will NOT appear in UI`);
  }
}

console.log('\n=== ANALYSIS RESULT ===');
console.log(`Total players that would show in UI: ${analysis.length}`);
if (analysis.length > 0) {
  console.log('Players:');
  analysis.forEach((p, i) => {
    console.log(`  ${i + 1}. ${formatRiotId(p.username, p.tagLine)}`);
  });
} else {
  console.log('⚠️  NO PLAYERS WOULD SHOW! This is the problem.');
}

db.close();
