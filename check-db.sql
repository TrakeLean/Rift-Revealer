.mode column
.headers on

-- Check skin_id population
SELECT '=== Skin ID Statistics ===' as '';
SELECT
  COUNT(*) as total_participants,
  COUNT(skin_id) as with_skin_id,
  COUNT(*) - COUNT(skin_id) as null_skin_id
FROM match_participants;

-- Sample recent matches with skin data
SELECT '' as '';
SELECT '=== Recent Participants WITH skin_id ===' as '';
SELECT
  mp.username || '#' || mp.tag_line as player,
  mp.champion_name,
  mp.skin_id,
  datetime(m.game_creation/1000, 'unixepoch', 'localtime') as game_date
FROM match_participants mp
JOIN matches m ON mp.match_id = m.match_id
WHERE mp.skin_id IS NOT NULL
ORDER BY m.game_creation DESC
LIMIT 5;

-- Skin cache table
SELECT '' as '';
SELECT '=== Skin Cache Table ===' as '';
SELECT COUNT(*) as cached_skins FROM skin_cache;

SELECT
  skin_id,
  champion_id,
  file_path
FROM skin_cache
LIMIT 5;
