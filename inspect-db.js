const Database = require('better-sqlite3');

const db = new Database('./database/havewemeet.db');

console.log('=== Database Inspection ===\n');

// Get config
const config = db.prepare('SELECT * FROM user_config').get();
console.log('User Config:');
console.log('  Summoner:', config?.summoner_name);
console.log('  Region:', config?.region);
console.log('  PUUID:', config?.puuid?.substring(0, 20) + '...\n');

// Count matches
const matchCount = db.prepare('SELECT COUNT(*) as count FROM matches').get();
console.log(`Total Matches: ${matchCount.count}\n`);

// Count participants
const participantCount = db.prepare('SELECT COUNT(*) as count FROM match_participants').get();
console.log(`Total Participants: ${participantCount.count}\n`);

// Get sample match data
console.log('Sample Match:');
const sampleMatch = db.prepare(`
  SELECT
    m.match_id,
    m.game_creation,
    COUNT(DISTINCT mp.puuid) as player_count
  FROM matches m
  JOIN match_participants mp ON m.match_id = mp.match_id
  GROUP BY m.match_id
  LIMIT 1
`).get();

if (sampleMatch) {
  console.log('  Match ID:', sampleMatch.match_id);
  console.log('  Date:', new Date(sampleMatch.game_creation).toLocaleString());
  console.log('  Players in match:', sampleMatch.player_count);

  // Get players from this match
  const players = db.prepare(`
    SELECT summoner_name, champion_name, kills, deaths, assists, win, team_id
    FROM match_participants
    WHERE match_id = ?
    ORDER BY team_id, summoner_name
  `).all(sampleMatch.match_id);

  console.log('\n  Team 100:');
  players.filter(p => p.team_id === 100).forEach(p => {
    console.log(`    ${p.summoner_name} (${p.champion_name}) ${p.kills}/${p.deaths}/${p.assists} ${p.win ? 'WIN' : 'LOSS'}`);
  });

  console.log('\n  Team 200:');
  players.filter(p => p.team_id === 200).forEach(p => {
    console.log(`    ${p.summoner_name} (${p.champion_name}) ${p.kills}/${p.deaths}/${p.assists} ${p.win ? 'WIN' : 'LOSS'}`);
  });
}

// Test the query logic
console.log('\n\n=== Testing Query Logic ===\n');

if (config) {
  // Pick a random player from the database
  const randomPlayer = db.prepare(`
    SELECT DISTINCT summoner_name
    FROM match_participants
    WHERE puuid != ?
    LIMIT 1
  `).get(config.puuid);

  if (randomPlayer) {
    console.log(`Testing history with: ${randomPlayer.summoner_name}\n`);

    const games = db.prepare(`
      SELECT DISTINCT
        m.match_id,
        m.game_creation,
        opponent.summoner_name as opponent_name,
        opponent.champion_name as opponent_champion,
        opponent.team_id as opponent_team,
        user.champion_name as user_champion,
        user.team_id as user_team,
        user.win as user_win
      FROM matches m
      INNER JOIN match_participants user ON m.match_id = user.match_id AND user.puuid = ?
      INNER JOIN match_participants opponent ON m.match_id = opponent.match_id AND opponent.summoner_name = ? AND opponent.puuid != ?
      WHERE m.game_creation < (strftime('%s', 'now') - 300) * 1000
      ORDER BY m.game_creation DESC
      LIMIT 3
    `).all(config.puuid, randomPlayer.summoner_name, config.puuid);

    console.log(`Found ${games.length} games with ${randomPlayer.summoner_name}:\n`);

    games.forEach((game, i) => {
      const sameTeam = game.user_team === game.opponent_team;
      const relation = sameTeam ? 'Teammate' : 'Enemy';
      const result = game.user_win ? 'W' : 'L';
      console.log(`  ${i+1}. [${result}] ${game.user_champion} vs ${game.opponent_champion} (${relation})`);
    });
  }
}

db.close();
