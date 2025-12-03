-- User configuration table
CREATE TABLE IF NOT EXISTS user_config (
    id INTEGER PRIMARY KEY CHECK(id = 1),
    puuid TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL,
    tag_line TEXT NOT NULL,
    region TEXT NOT NULL,
    riot_api_key TEXT,
    last_updated INTEGER,
    auto_update_check INTEGER DEFAULT 1,
    auto_start INTEGER DEFAULT 0
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
    puuid TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    tag_line TEXT NOT NULL,
    region TEXT NOT NULL,
    last_seen INTEGER,
    profile_icon_id INTEGER
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
    match_id TEXT PRIMARY KEY,
    game_creation INTEGER NOT NULL,
    game_duration INTEGER,
    game_mode TEXT,
    queue_id INTEGER,
    imported_at INTEGER
);

-- Match participants table with detailed stats
CREATE TABLE IF NOT EXISTS match_participants (
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
    FOREIGN KEY (puuid) REFERENCES players(puuid)
);

-- Player tags/notes table
CREATE TABLE IF NOT EXISTS player_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    puuid TEXT NOT NULL,
    username TEXT NOT NULL,
    tag_line TEXT NOT NULL,
    tag_type TEXT NOT NULL CHECK(tag_type IN ('toxic', 'friendly', 'notable', 'duo')),
    note TEXT,
    created_at INTEGER NOT NULL,
    UNIQUE(puuid, tag_type)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_participants_match ON match_participants(match_id);
CREATE INDEX IF NOT EXISTS idx_participants_puuid ON match_participants(puuid);
CREATE INDEX IF NOT EXISTS idx_matches_creation ON matches(game_creation);
CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
CREATE INDEX IF NOT EXISTS idx_players_name_tag ON players(username, tag_line);
CREATE INDEX IF NOT EXISTS idx_player_tags_puuid ON player_tags(puuid);
