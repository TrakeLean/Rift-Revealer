# Database Refactor Progress: `username` + `tag_line` Split

## 🎯 Goal
Split `summoner_name` field into `username` + `tag_line` for cleaner data model aligned with Riot API.

**Example:**
- **Before:** `summoner_name = "ProPlayer#NA1"`
- **After:** `username = "ProPlayer"`, `tag_line = "NA1"`

---

## ✅ COMPLETED (Session 2025-12-03)

### 1. ✅ Database Schema (`database/schema.sql`)
**Status:** COMPLETE

**Changes:**
- Renamed `summoner_name` → `username` + `tag_line` in all tables:
  - `user_config`
  - `players`
  - `match_participants`
  - `player_tags`
- Added compound index: `CREATE INDEX idx_players_name_tag ON players(username, tag_line)`
- Renamed `idx_players_game_name` → `idx_players_username`

**Migration:** User deleted database, so fresh start (no migration needed)

---

### 2. ✅ Database Manager (`src/database/db.js`)
**Status:** COMPLETE (Complete rewrite, 970 lines)

**Backup:** `src/database/db.js.backup` (original file preserved)

**New Helper Functions:**
```javascript
formatRiotId(username, tagLine)       // "ProPlayer" + "NA1" → "ProPlayer#NA1"
parseRiotId(fullName)                 // "ProPlayer#NA1" → {username, tagLine}
normalizeForComparison(str)           // Case-insensitive, no spaces
isConfiguredUser(config, puuid, username, tagLine)  // Updated signature
```

**Updated Methods:**
- ✅ `getUserConfig()` - Returns `username` + `tag_line`
- ✅ `saveUserConfig(config)` - Expects `username` + `tag_line`
- ✅ `savePlayer(puuid, username, tagLine, region, profileIconId)` - New signature
- ✅ `setLiveSkinSelections(players, clearFirst)` - Uses `username` + `tagLine` for cache keys
- ✅ `getLiveSkinSelection(puuid, username, tagLine)` - New signature
- ✅ `saveMatch(matchData)` - Parses Riot API `riotIdGameName` + `riotIdTagline`
- ✅ `getPlayerHistory(username, tagLine, puuid)` - New signature with split fields
- ✅ `getMostRecentMatchRoster()` - Returns `username` + `tagLine` per player
- ✅ `addPlayerTag(puuid, username, tagLine, tagType, note)` - New signature
- ✅ All other tagging methods updated

**Key Improvements:**
- Cleaner SQL queries (direct field access)
- Better name matching logic
- Removed all legacy `summoner_name` references
- Exported helper functions for use in other modules

---

### 3. ✅ Other Improvements Made This Session

**Bug Fixes:**
- ✅ Fixed duplicate lane assignment in `saveMatch()` (removed lines 413-421)
- ✅ Fixed `expectedRoles` array: `'UTILITY'` → `'SUPPORT'` for consistency
- ✅ Removed redundant `rawLane` property

**Skin Cache Improvements:**
- ✅ Implemented merge-based caching (no longer clears on every call)
- ✅ Added `clearFirst` parameter to `setLiveSkinSelections()`
- ✅ Cache now persists across state transitions (ChampSelect → InGame → EndOfGame)
- ✅ Fixed auto-import timing issue

**Documentation:**
- ✅ Updated `DEVELOPMENT.md`:
  - Database Design section (new schema documented)
  - LCU Integration section (skin/name caching documented)
  - File structure section (added new files, removed MatchHistory.tsx)
  - Recent changes section (v1.5.x features)

---

## ⏳ REMAINING WORK

### Phase 1: API Layer Updates

#### 4. ⏳ `src/api/riotApi.js`
**Status:** PENDING (minimal changes needed)

**What to do:**
- Already returns `riotIdGameName` and `riotIdTagline` separately from Riot API
- May need minor updates in `getSummonerByName()` method
- Check if any methods concatenate names that shouldn't

**Estimated effort:** 10 minutes

---

#### 5. ⏳ `src/api/lcuConnector.js`
**Status:** PENDING (moderate changes)

**What to do:**
- Update `getLobbyPlayers()` to return `username` + `tagLine` separately
- Currently returns objects with `summonerName` - split this into two fields
- Parse LCU response fields into separate username/tagLine
- Update name resolution fallback chain

**Current code (~line 231):**
```javascript
players.push({
  summonerName: resolveName(player, summoner),  // ← Split this
  // ...
});
```

**Target code:**
```javascript
const { username, tagLine } = parsePlayerName(player, summoner);
players.push({
  username: username,
  tagLine: tagLine,
  // ...
});
```

**Estimated effort:** 30 minutes

---

### Phase 2: Main Process Updates

#### 6. ⏳ `src/main.js`
**Status:** PENDING (extensive changes)

**What to do:**
- Update all `db.savePlayer()` calls (new signature)
- Update all `db.getPlayerHistory()` calls (new signature)
- Update all `db.addPlayerTag()` calls (new signature)
- Update `analyzeLobbyPlayers()` function
- Update lobby analysis results sent to renderer
- Update auto-import logic
- Search for all `summonerName` references and update

**Key locations:**
- Line ~900: `analyzeLobbyPlayers()` function
- Line ~1090: ChampSelect analysis
- Line ~1150: Auto-import after game
- Any IPC handlers that pass player data

**Estimated effort:** 1 hour

---

#### 7. ⏳ `src/preload.js`
**Status:** PENDING (minor changes)

**What to do:**
- Update IPC method signatures
- Ensure exposed API methods match new db.js signatures
- Update any type documentation/comments

**Estimated effort:** 15 minutes

---

### Phase 3: Frontend Updates

#### 8. ⏳ `src/renderer/types/index.ts`
**Status:** PENDING (important!)

**What to do:**
- Find all TypeScript interfaces with `summonerName`
- Split into `username` + `tagLine`
- Update `Player`, `LobbyPlayer`, `MatchParticipant`, etc.

**Example:**
```typescript
// Before
interface Player {
  puuid: string;
  summonerName: string;
  // ...
}

// After
interface Player {
  puuid: string;
  username: string;
  tagLine: string;
  // ...
}
```

**Estimated effort:** 20 minutes

---

#### 9. ⏳ React Components
**Status:** PENDING (moderate changes)

**Files likely affected:**
- `src/renderer/pages/Settings.tsx` - User config input
- `src/renderer/pages/LobbyAnalysis.tsx` - Display player names
- `src/renderer/components/PlayerChip.tsx` - Display player names
- `src/renderer/components/PlayerTagMenu.tsx` - Display/save tags
- Any component that displays summoner names

**What to do:**
- Import `formatRiotId` helper from db.js
- Update all display logic: `formatRiotId(player.username, player.tagLine)`
- Update form inputs (Settings page needs two fields)
- Update any filtering/searching logic

**Example:**
```typescript
// Before
<div>{player.summonerName}</div>

// After
import { formatRiotId } from '../../../database/db';
<div>{formatRiotId(player.username, player.tagLine)}</div>
```

**Estimated effort:** 45 minutes

---

## 🧪 TESTING CHECKLIST

Once all updates are complete, test these flows:

### Initial Setup
- [ ] Open app for first time
- [ ] Enter username and tag separately in Settings
- [ ] Save configuration
- [ ] Verify database has `username` + `tag_line` fields populated

### Match Import
- [ ] Import match history
- [ ] Verify participants saved with split fields
- [ ] Check database manually: `SELECT username, tag_line FROM match_participants LIMIT 5`

### Lobby Analysis
- [ ] Join a lobby
- [ ] Verify player names display correctly as "Username#TAG"
- [ ] Check encounter stats show up
- [ ] Verify skin images load

### Player Tagging
- [ ] Tag a player
- [ ] Verify tag saves with `username` + `tag_line`
- [ ] Check tag displays correctly
- [ ] Verify tag persists across sessions

### Last Match Roster
- [ ] After a game, check last-match roster
- [ ] Verify names display correctly
- [ ] Verify stats show up

---

## 📝 IMPORTANT NOTES

### Database Migration Strategy
- **No migration needed** - User deleted database
- Fresh schema will be created on first run
- All new data will use `username` + `tag_line` format

### Name Matching Logic
The new system uses:
1. **PUUID matching** (primary, most reliable)
2. **Username + TagLine matching** (fallback)
   - Normalized comparison (case-insensitive, no spaces)
   - Can match username alone if tagLine missing

### Helper Functions Available
```javascript
const { formatRiotId, parseRiotId } = require('./database/db');

// Usage
const displayName = formatRiotId('ProPlayer', 'NA1');  // "ProPlayer#NA1"
const { username, tagLine } = parseRiotId('ProPlayer#NA1');  // Split
```

### Backward Compatibility
- **NONE** - This is a breaking change
- Old database schema incompatible
- User must re-import match history
- Acceptable since app is in early development

---

## 🚀 NEXT SESSION TASKS

### Priority 1: Complete Remaining Files
1. Start with `riotApi.js` (easiest)
2. Then `lcuConnector.js` (moderate)
3. Then `main.js` (most complex)
4. Then `preload.js` (quick)
5. Then TypeScript types (important for compile)
6. Finally React components (many files)

### Priority 2: Testing
1. Delete existing database (if any)
2. Launch app
3. Configure settings (enter username + tag separately)
4. Import matches
5. Join lobby and verify everything works

### Priority 3: Documentation
1. Update DEVELOPMENT.md with new method signatures
2. Update README if user-facing changes
3. Create migration notes in CHANGELOG.md

---

## 💾 BACKUP FILES

If you need to revert:
- **Original db.js:** `src/database/db.js.backup`
- **Git:** Uncommitted changes can be reverted with `git checkout src/database/db.js`

---

## ⚡ QUICK COMMANDS

```bash
# Start development
npm run dev

# Check database schema
sqlite3 ~/AppData/Roaming/rift-revealer/database/rift-revealer.db
.schema

# View players table
SELECT username, tag_line FROM players LIMIT 5;

# Revert db.js if needed
cp src/database/db.js.backup src/database/db.js

# Search for remaining summonerName references
grep -r "summonerName" src/
```

---

## 📊 PROGRESS SUMMARY

**Total Estimated Time:** ~4 hours
**Completed:** ~1.5 hours (35%)
**Remaining:** ~2.5 hours (65%)

**Files Complete:** 3 / 10
- ✅ schema.sql
- ✅ db.js
- ✅ DEVELOPMENT.md

**Files Remaining:** 7
- ⏳ riotApi.js
- ⏳ lcuConnector.js
- ⏳ main.js
- ⏳ preload.js
- ⏳ types/index.ts
- ⏳ React components (multiple files)
- ⏳ Testing

---

**Last Updated:** 2025-12-03 19:45
**Status:** Paused for testing - Schema & db.js complete, ready to continue with API layer
