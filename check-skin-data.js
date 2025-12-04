const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(process.env.APPDATA, 'rift-revealer', 'database', 'rift-revealer.db');
console.log('Opening database:', dbPath);

const db = new Database(dbPath);

console.log('\n=== Checking skin_id data in match_participants ===\n');

// Check how many participants have skin_id populated
const skinStats = db.prepare(`
  SELECT
    COUNT(*) as total,
    COUNT(skin_id) as with_skin,
    COUNT(*) - COUNT(skin_id) as without_skin
  FROM match_participants
`).get();

console.log('Skin ID Statistics:');
console.log('  Total participants:', skinStats.total);
console.log('  With skin_id:', skinStats.with_skin);
console.log('  Without skin_id (NULL):', skinStats.without_skin);

// Show sample of recent match participants with skin data
console.log('\n=== Sample of recent participants (with skin_id) ===\n');
const sampleWithSkin = db.prepare(`
  SELECT
    mp.username,
    mp.tag_line,
    mp.champion_name,
    mp.champion_id,
    mp.skin_id,
    m.game_creation
  FROM match_participants mp
  JOIN matches m ON mp.match_id = m.match_id
  WHERE mp.skin_id IS NOT NULL
  ORDER BY m.game_creation DESC
  LIMIT 10
`).all();

sampleWithSkin.forEach(p => {
  console.log(`${p.username}#${p.tag_line} - ${p.champion_name} (Champion ID: ${p.champion_id}, Skin ID: ${p.skin_id})`);
});

// Check skin_cache table
console.log('\n=== Skin Cache Table ===\n');
const cacheStats = db.prepare(`SELECT COUNT(*) as count FROM skin_cache`).get();
console.log('Cached skins in database:', cacheStats.count);

if (cacheStats.count > 0) {
  console.log('\nSample cached skins:');
  const cachedSkins = db.prepare(`
    SELECT skin_id, champion_id, file_path, last_fetched
    FROM skin_cache
    ORDER BY last_fetched DESC
    LIMIT 10
  `).all();

  cachedSkins.forEach(s => {
    const fetched = new Date(s.last_fetched).toLocaleString();
    console.log(`  Skin ${s.skin_id} (Champ ${s.champion_id}): ${s.file_path}`);
    console.log(`    Fetched: ${fetched}`);
  });
}

// Check the most recent match roster
console.log('\n=== Most Recent Match (Last Roster) ===\n');
const recentMatch = db.prepare(`
  SELECT match_id, game_creation, queue_id
  FROM matches
  ORDER BY game_creation DESC
  LIMIT 1
`).get();

if (recentMatch) {
  console.log('Match ID:', recentMatch.match_id);
  console.log('Date:', new Date(recentMatch.game_creation).toLocaleString());
  console.log('Queue ID:', recentMatch.queue_id);

  const roster = db.prepare(`
    SELECT username, tag_line, champion_name, champion_id, skin_id, team_id
    FROM match_participants
    WHERE match_id = ?
    ORDER BY team_id, username
  `).all(recentMatch.match_id);

  console.log('\nRoster:');
  roster.forEach(p => {
    const skinInfo = p.skin_id !== null ? `Skin: ${p.skin_id}` : 'Skin: NULL';
    console.log(`  [Team ${p.team_id}] ${p.username}#${p.tag_line} - ${p.champion_name} (${skinInfo})`);
  });
}

db.close();
console.log('\n✓ Done');
