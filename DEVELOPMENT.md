# Development Context

## 🔥 Current Work Session - 2025-12-05

### Rank System Disabled (Development API Key Limitation)

**Status:** ⏸️ DISABLED - Waiting for Production API Key

**Why Disabled:**
The rank fetching system requires access to the `/lol/league/v4/entries/by-summoner/{summonerId}` endpoint, which is **not available with development API keys**. This endpoint requires a production API key.

**What Was Disabled:**
- Rank fetching in `src/renderer/pages/LobbyAnalysis.tsx` (lines 89-124)
- Rank display in `src/renderer/components/PlayerChip.tsx` (line 363-364)
- IPC handler in `src/main.js` (lines 575-636)

**How to Re-Enable When Production Key is Available:**

1. **Uncomment the IPC handler in `src/main.js`:**
   - Find the commented block starting at line 575: `// DISABLED: Rank fetching requires production API key`
   - Remove the `/*` and `*/` comment markers around the `ipcMain.handle('get-player-rank', ...)` handler

2. **Uncomment rank fetching in `src/renderer/pages/LobbyAnalysis.tsx`:**
   - Find the commented block starting at line 89: `// DISABLED: Rank fetching requires production API key`
   - Remove the `/*` and `*/` comment markers around the rank fetching logic

3. **Uncomment rank display in `src/renderer/components/PlayerChip.tsx`:**
   - Find line 363: `{/* DISABLED: Rank display requires production API key - see DEVELOPMENT.md */}`
   - Uncomment line 364: `{/* {rank !== undefined && <RankBadge rank={rank} size="sm" />} */}`
   - Change it to: `{rank !== undefined && <RankBadge rank={rank} size="sm" />}`

4. **Update your API key in Settings:**
   - Open Rift Revealer
   - Navigate to Settings tab
   - Paste your **production** API key
   - Click "Save Configuration"

5. **Test the rank display:**
   - View Last Match Roster
   - Ranks should now display properly (e.g., "Gold II 75 LP")
   - Check console logs for successful rank fetches (look for "[Rank]" prefixed logs)

**What the Rank System Does:**
- Fetches solo queue rank for each player in your last match
- Displays rank badge next to player cards (Gold II, Platinum IV, etc.)
- Caches rank data for 1 hour to reduce API calls
- Shows "Unranked" for players without ranked stats

---

### UI Improvements: Champion Names, Tag System, and Card Layout

**Status:** ✅ COMPLETE - All Changes Implemented

### Session Summary (2025-12-05)

This session focused on UI polish and bug fixes for the Last Match Roster player cards:

**1. Champion Names Display Fix**
- **Issue:** Champion names weren't appearing on player cards
- **Root cause:** `lastSeen` prop was hardcoded to `undefined` in LobbyAnalysis.tsx line 590
- **Fix:** Changed to `lastSeen={player.lastSeen}` to pass the data already being fetched from database
- **File:** `src/renderer/pages/LobbyAnalysis.tsx`

**2. Champion Name Formatting**
- **Issue:** Champion names displayed without spaces (e.g., "MasterYi", "MissFortune")
- **Root cause:** Riot API returns champion names in camelCase format
- **Fix:** Created `formatChampionName()` helper function using regex `.replace(/([A-Z])/g, ' $1').trim()`
- **Result:** "MasterYi" → "Master Yi", "MissFortune" → "Miss Fortune"
- **File:** `src/renderer/components/PlayerChip.tsx` (lines 12-17)

**3. Tag System Enhancement - "Weak" Tag Added**
- **Rationale:** Users wanted to tag unskilled players separately from toxic players
- **Implementation:**
  - Added 'weak' tag type with orange color scheme (warning variant)
  - Icon: TrendingDown (from lucide-react)
  - Description: "Unskilled or poor performance"
- **Files modified:**
  - `src/renderer/components/PlayerTagMenu.tsx` - Added tag definition and interface
  - `src/renderer/components/TagPill.tsx` - Added 'warning' variant styling
  - `src/renderer/components/PlayerChip.tsx` - Updated tag display logic

**Tag System Now Includes:**
- 🔥 Toxic (red) - Difficult or toxic player
- ⚠️ Weak (orange) - Unskilled or poor performance
- 👥 Friendly (green) - Positive teammate
- ⭐ Notable (yellow) - Skilled or noteworthy
- 👥 Duo (blue) - Duo queue partner

**4. User Card UI Cleanup**
- **Issue:** "0 games together" badge displayed on user's own card (always 0)
- **Fix:** Wrapped encounter count badge in `{encounterCount > 0 && (...)}` conditional
- **Result:** Badge only shows for players you've actually played with
- **File:** `src/renderer/components/PlayerChip.tsx` (lines 321-325)

**5. Debug Console Spam Removed**
- **Issue:** Champion data console.log statements printing every ~3 seconds
- **Fix:** Removed debug logging from champion display logic
- **File:** `src/renderer/components/PlayerChip.tsx`

**6. Skin Splash Art Fallback System**
- **Issue:** Some skin IDs returning 403 Forbidden from Riot CDN (e.g., Lux_49, MissFortune_23)
- **Root cause:** Not all skin IDs exist in Riot's CDN - some special skins unavailable
- **Fix:** Implemented automatic fallback chain:
  1. Try to load specific skin using Image() constructor
  2. On error, calculate default skin ID (championId + "000")
  3. Try to load default champion splash (skin 0)
  4. If that fails, set to null (no background)
- **Result:** Players always see champion splash art, even when specific skin unavailable
- **File:** `src/renderer/components/PlayerChip.tsx` (lines 154-205)

**7. Tags Position on User Card**
- **Issue:** Tags appeared inline with champion name on user's card
- **Requested:** Move tags to bottom of card for user's own player card only
- **Implementation:**
  - Split tag rendering into two conditional blocks
  - For non-user cards (`encounterCount > 0`): Tags remain inline in ModeStatsRow
  - For user card (`encounterCount === 0`): Tags render in separate section at bottom with `pt-1` spacing
- **Result:** User's card shows tags at bottom, other players show tags inline as before
- **File:** `src/renderer/components/PlayerChip.tsx` (lines 371-450)

### Files Modified This Session:
- `src/renderer/pages/LobbyAnalysis.tsx` - Fixed lastSeen prop passing
- `src/renderer/components/PlayerChip.tsx` - Champion formatting, tag logic, encounter badge, skin fallback, tag positioning
- `src/renderer/components/PlayerTagMenu.tsx` - Added 'weak' tag type
- `src/renderer/components/TagPill.tsx` - Added 'warning' variant

### Testing Status:
✅ Champion names displaying correctly with proper spacing
✅ Weak tag added and functional
✅ User card no longer shows "0 games" badge
✅ Debug console spam eliminated
✅ Skin fallback working for 403 errors
✅ Tags positioned at bottom of user card only

---

## 🔥 Previous Work Session - 2025-12-04

### Feature: Player Rank Display in Last Match Roster

**Status:** ✅ COMPLETE - Ready for Testing with New API Key

### Database Refactor: username + tag_line Split

**Status:** ✅ COMPLETE - All Files Verified and Updated

**Summary:**
The database refactor (splitting `summoner_name` into `username` + `tag_line`) that was started on 2025-12-03 is now **100% complete**. All 10 files have been verified:

- ✅ `database/schema.sql` - Schema updated with split fields
- ✅ `src/database/db.js` - Complete rewrite (970 lines) with helper functions
- ✅ `src/api/riotApi.js` - Already using username/tagLine parameters
- ✅ `src/api/lcuConnector.js` - Already parsing names with parseRiotId()
- ✅ `src/main.js` - All DB calls updated to use split fields
- ✅ `src/preload.js` - IPC signatures updated
- ✅ `src/renderer/types/index.ts` - All TypeScript interfaces updated
- ✅ `src/renderer/pages/Settings.tsx` - Uses username + tag_line
- ✅ `src/renderer/pages/LobbyAnalysis.tsx` - Uses split fields
- ✅ `src/renderer/components/PlayerChip.tsx` - Props are username + tagLine

**App Testing Results (2025-12-04 20:30):**
```
✓ Build successful (2073 modules, 3.13s)
✓ Database schema initialized
✓ Database migrations completed
✓ Last Match Roster loaded (10 players)
✓ Skin resolution working (all CDN URLs generated)
✓ Rank fetching operational (waiting for valid API key)
```

**Pattern Used:**
Components correctly separate storage from display:
```typescript
// Props accept split fields
interface PlayerChipProps {
  username: string
  tagLine: string
}

// Display name created locally when needed
const summonerName = `${username}#${tagLine}`
```

This is the **correct approach** - store split in database, display combined in UI.

**What Was Built:**
We added a comprehensive rank fetching and display system that shows each player's solo queue rank in the Last Match Roster section.

#### Implementation Details:

**1. Backend API Integration (`src/api/riotApi.js`)**
- Added `getSummonerByPuuid(puuid, region)` - Maps PUUID to summonerId (required for rank API)
- Added `getRankedStats(summonerId, region)` - Fetches league entries from Riot API
- Endpoint used: `GET /lol/league/v4/entries/by-summoner/{summonerId}`
- Returns array with RANKED_SOLO_5x5 and RANKED_FLEX_SR entries

**2. Database Caching System**
- Created `player_ranks` table in `database/schema.sql`:
  - Fields: puuid, tier, division, league_points, wins, losses, last_updated
- Added caching methods in `src/database/db.js`:
  - `savePlayerRank(puuid, rank)` - Saves/updates rank in cache
  - `getPlayerRank(puuid, maxAge)` - Retrieves cached rank (default 1-hour TTL)
- Caching prevents excessive API calls and improves performance

**3. IPC Handler (`src/main.js`)**
- Added `get-player-rank` handler with intelligent caching:
  - Checks cache first (1-hour expiration)
  - Fetches from Riot API if cache miss or expired
  - Automatically saves fresh data to cache
  - Returns cached flag to track data source

**4. TypeScript Types (`src/renderer/types/index.ts`)**
```typescript
interface PlayerRank {
  tier: 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'EMERALD' | 'DIAMOND' | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER'
  division?: 'I' | 'II' | 'III' | 'IV'
  leaguePoints: number
  wins: number
  losses: number
}
```

**5. UI Components**
- **RankBadge Component (`src/renderer/components/RankBadge.tsx`)**:
  - Displays tier with color-coded text (Gold=yellow, Platinum=teal, Diamond=blue, etc.)
  - Shows division (I-IV) for non-Master+ ranks
  - Displays LP count
  - Tooltip shows full details: "Gold II 75 LP - 45W 38L"
  - Handles null/unranked state with "Unranked" badge

- **PlayerChip Integration (`src/renderer/components/PlayerChip.tsx`)**:
  - Added `rank` prop to PlayerChipProps
  - Rank badge displays next to encounter count badge
  - Positioned inside card for proper styling

- **LobbyAnalysis Integration (`src/renderer/pages/LobbyAnalysis.tsx`)**:
  - Fetches ranks for all players when Last Match Roster loads
  - Parallel API calls for optimal performance
  - Debug logging added to track rank fetching
  - Stores ranks in `playerRanks` state object

#### Current Issue:
**403 Forbidden Error from Riot API**
- The Riot API is returning "Forbidden" when calling `/lol/league/v4/entries/by-summoner/{summonerId}`
- This indicates an **API key permission issue**, not a code bug
- Error logs show:
  ```
  Failed to fetch player rank: Error: Failed to fetch ranked stats: Forbidden
  ```

#### What Works:
✅ Rank fetching logic is correctly implemented
✅ API calls are being made to the correct endpoint
✅ Rank badge displays inside PlayerChip card (positioning fixed)
✅ Caching system is in place
✅ Shows "Unranked" badge when rank unavailable

#### Next Steps:
1. ✅ **New API key received:** `RGAPI-1b155835-6973-484e-8252-351cb0e58ffa`
2. **Update the API key in app Settings:**
   - Open Rift Revealer
   - Navigate to Settings tab
   - Paste API key in the "Riot API Key" field
   - Click "Save Configuration"
3. **Test rank display:**
   - View Last Match Roster
   - Ranks should display properly (e.g., "Gold II 75 LP")
   - Verify rank badges appear on all player cards
   - Check console logs for successful rank fetches

#### Files Modified:
- `src/api/riotApi.js` - Added rank API methods
- `database/schema.sql` - Added player_ranks table
- `src/database/db.js` - Added rank caching methods
- `src/main.js` - Added get-player-rank IPC handler with caching
- `src/preload.js` - Exposed getPlayerRank API to renderer
- `src/renderer/types/index.ts` - Added PlayerRank interface
- `src/renderer/components/RankBadge.tsx` - New rank badge component
- `src/renderer/components/PlayerChip.tsx` - Integrated rank badge display
- `src/renderer/pages/LobbyAnalysis.tsx` - Added rank fetching and debug logs

#### Testing Commands:
```bash
# Rebuild and test
npm start

# Check logs for rank fetch attempts
# Look for "[Rank]" prefixed console logs
```

---

## Project Overview

**Rift Revealer** - A desktop application for League of Legends players that tracks lobby encounters and provides instant analysis of players you've faced before. Monitors the League client in real-time and alerts you when you enter a game with someone from your match history.

**Repository:** https://github.com/TrakeLean/Rift-Revealer

---

## 🔥 Quick Start - Context for Next Session

**What This Project Does:**
Desktop app that automatically monitors League of Legends lobbies and shows your match history with detected players, split by game mode (Ranked, Normal, ARAM, Arena).

**Critical Systems:**
✅ **lol-modern-ui Skill** - ALL UI components MUST follow this design system (`.claude/skills/lol-modern-ui/SKILL.md`)
✅ **Auto-monitoring** - App automatically starts gameflow monitoring on launch (no manual buttons)
✅ **Mode-specific stats** - Player history split by queue type (Ranked, Normal, ARAM, Arena, Other)
✅ **Compact UI** - Redesigned player cards ~40% smaller with larger, more readable stats
✅ **Profile icons** - Riot profile icons displayed next to player names
✅ **Database in writable location** - Uses `app.getPath('userData')` to avoid asar read-only issues
✅ **GitHub Actions** - Automatic builds and releases when tags are pushed

**Key Files:**
- `.claude/skills/lol-modern-ui/SKILL.md` - **MANDATORY** UI design system (dark theme, esports aesthetic)
- `src/main.js` - Electron main process, gameflow monitoring, IPC handlers
- `src/database/db.js` - SQLite operations, player history queries, mode categorization
- `src/api/updateChecker.js` - Update checking logic
- `src/renderer/pages/LobbyAnalysis.tsx` - Main lobby detection UI
- `src/renderer/pages/Settings.tsx` - Configuration and settings page
- `src/renderer/components/PlayerChip.tsx` - Player card with stats
- `src/renderer/components/ModeStatsRow.tsx` - Mode-specific stat cards
- `src/renderer/components/PlayerTagMenu.tsx` - Player tagging dialog
- `src/renderer/components/UpdateNotification.tsx` - Update notification dialog
- `CLAUDE.md` - Project instructions for Claude Code

**Current State:**
✅ Mode-specific stats implemented
✅ Auto-monitoring working
✅ Logo added to sidebar
✅ Enhanced player cards with threat indicators
✅ **v1.4.5 released** - Update notification fixes + single instance lock improvements
✅ GitHub Actions workflow for automatic builds
✅ Profile icon system fully integrated with database migration
✅ Improved logging for better debugging
✅ System tray - runs in background, continues tracking when window closed
✅ Update notification markdown formatting fixed
✅ README.md fully updated with all current features
✅ **Recent bug fixes (uncommitted):**
  - Fixed "Check for Updates" button (now uses custom UpdateChecker, works in dev mode)
  - Fixed "Start on Windows Startup" toggle persistence (syncs with actual Windows registry)
  - Fixed single instance lock (no more blank window freezing)
🎯 **Ready for testing** - All known bugs resolved

---

## 📋 Release Checklist

**⚠️ IMPORTANT: Follow this checklist when creating a new release!**

1. **Update version** in `package.json`
2. **Commit changes** with descriptive commit message
3. **Create git tag**: `git tag vX.X.X`
4. **Push to GitHub**: `git push && git push --tags`
5. **⚠️ UPDATE README.md** - Add new features to the Features section!
   - This is easy to forget but critical for users to know what's new
   - Update the "What's New" or feature descriptions
   - Keep README in sync with actual features
6. **GitHub Actions** will automatically build and create the release

**Why this matters:**
- Users read README.md first to see what the app can do
- Outdated README = confused users who don't know about new features
- Keep it evergreen (don't hardcode version numbers)

---

## Architecture

### Desktop Framework
- **Electron 28** - Desktop wrapper
- **Node.js backend** - Main process for LCU, database, Riot API
- **Build tool:** electron-builder for Windows executables

### Frontend Stack
- **React 19** with **TypeScript 5**
- **Vite 7** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Component library (Radix UI based)
- **Framer Motion** - Subtle animations
- **lucide-react** - Icons

### Data & APIs
- **better-sqlite3** - Local SQLite database (native module)
- **Riot Games API** - Match history and summoner data
- **LCU (League Client Update) API** - Real-time lobby monitoring via lockfile

---

## 🎨 UI Development Rules (CRITICAL)

### MANDATORY: Use lol-modern-ui Skill

**Every UI component MUST follow the design system in `.claude/skills/lol-modern-ui/SKILL.md`**

When building UI:
1. **State:** "Using the `lol-modern-ui` Skill"
2. **Follow 5-step workflow:**
   - Understand the feature
   - Sketch layout in text
   - Identify reusable components
   - Write React/TSX code
   - Self-review against checklist
3. **Use existing components** from catalog (Button, Card, PlayerChip, etc.)
4. **Check design tokens** before adding arbitrary colors

### Design Principles
- **Dark-first:** Background `#020817`, no light mode
- **Esports aesthetic:** Think Riot launcher, op.gg stats
- **Color psychology:** Red=toxic/danger, Yellow=notable, Green=positive, Blue=info
- **Information density:** Pack data efficiently with breathing room
- **Subtle motion:** Smooth transitions, no flashy animations

### Color System (HSL Variables)
- `bg-background` - Main app (`#020817`)
- `bg-card` - Card surfaces
- `bg-primary` / `text-primary` - Emerald green success states
- `bg-destructive` / `text-destructive` - Red danger/losses
- `text-muted-foreground` - Low-emphasis text

### Custom Tag Colors
```tsx
// Toxic/difficult
className="bg-red-950/50 text-red-400 border-red-900"

// Notable/warning
className="bg-yellow-950/50 text-yellow-400 border-yellow-900"

// Positive/friendly
className="bg-emerald-950/50 text-emerald-400 border-emerald-900"

// Info/duo
className="bg-blue-950/50 text-blue-400 border-blue-900"
```

### Component Catalog
- **Base (shadcn/ui):** `<Button>`, `<Card>`, `<Input>`
- **Custom:** `<PlayerChip>`, `<MatchCard>`, `<TagPill>`, `<StatsPanel>`, `<ModeStatsRow>`

---

## Development Workflow

### Git Branching Strategy

**ALWAYS use feature branches for new work:**

```bash
# Create feature branch
git checkout -b feature/new-feature-name

# Make changes, commit frequently
git add .
git commit -m "Description of changes"

# Push to GitHub
git push -u origin feature/new-feature-name

# Create pull request on GitHub
# After review, merge to main
```

**Branch naming:**
- `feature/` - New features (e.g., `feature/champion-mastery-display`)
- `fix/` - Bug fixes (e.g., `fix/lobby-detection-timing`)
- `refactor/` - Code refactoring (e.g., `refactor/database-queries`)
- `docs/` - Documentation updates (e.g., `docs/installation-guide`)

### Version Management

**Increment version in `package.json` for releases:**

```json
{
  "version": "1.1.0"  // Update before building release
}
```

**Versioning scheme:**
- `1.0.0` → `1.0.1` - Bug fixes
- `1.0.0` → `1.1.0` - New features
- `1.0.0` → `2.0.0` - Breaking changes

### Build & Release Process

```bash
# 1. Update version in package.json
# 2. Build package
npm run package

# 3. Test executable in dist/
./dist/Rift\ Revealer\ 1.0.0.exe

# 4. Commit and tag
git add package.json
git commit -m "Bump version to 1.1.0"
git tag v1.1.0
git push && git push --tags

# 5. Create GitHub release with executables
```

---

## Context Preservation

### When Starting New Work

**ALWAYS update this file before starting:**

1. **Add to "Current State" section** - What you're working on
2. **Add to "Recent Changes" section** - Track what was done
3. **Update "Future Development Ideas"** - Note any deferred work

### Session Recovery Template

If context is lost, answer these questions:

1. **What was I building?** (Check "Recent Changes")
2. **What files did I modify?** (Check git diff)
3. **What's the current state?** (Check "Current State" section)
4. **What UI rules apply?** (Check lol-modern-ui Skill)
5. **What's next?** (Check "Future Development Ideas")

---

## File Structure

```
Rift-Revealer/
├── src/
│   ├── main.js                      # Electron main process + IPC handlers
│   ├── preload.js                   # IPC bridge (contextBridge)
│   ├── database/
│   │   └── db.js                    # SQLite operations + mode categorization
│   ├── api/
│   │   ├── riotApi.js               # Riot Games API client
│   │   ├── lcuConnector.js          # League Client connector (lockfile)
│   │   └── updateChecker.js         # Update checking logic
│   └── renderer/                    # React frontend
│       ├── main.tsx                 # React entry point
│       ├── App.tsx                  # Root component + top navigation
│       ├── components/
│       │   ├── ui/                  # shadcn/ui base components
│       │   ├── PlayerChip.tsx       # Player card with stats
│       │   ├── ModeStatsRow.tsx     # Mode-specific stat cards
│       │   ├── StatsPanel.tsx       # Expandable detailed stats
│       │   ├── MatchCard.tsx        # Single match display
│       │   ├── TagPill.tsx          # Player tag badges
│       │   ├── PlayerTagMenu.tsx    # Player tagging dialog
│       │   ├── UpdateNotification.tsx  # Update notification dialog
│       │   └── ErrorBoundary.tsx    # Error handling wrapper
│       ├── pages/
│       │   ├── LobbyAnalysis.tsx    # Main lobby detection page
│       │   └── Settings.tsx         # Configuration page
│       ├── types/
│       │   └── index.ts             # TypeScript interfaces
│       ├── lib/
│       │   └── utils.ts             # Utility functions
│       └── styles/
│           └── globals.css          # Tailwind + design tokens
├── database/
│   └── schema.sql                   # Database schema
├── .claude/
│   ├── settings.local.json          # Claude Code config
│   └── skills/
│       └── lol-modern-ui/           # UI design system (MANDATORY)
│           ├── SKILL.md             # Design rules & component catalog
│           ├── tokens.json          # Color/spacing tokens
│           ├── components/          # Component reference files
│           └── examples/            # Reference implementations
├── dist/                            # Built executables (not in git)
├── dist-renderer/                   # Vite build output (not in git)
├── package.json                     # Dependencies + build config
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript config
├── tailwind.config.js               # Tailwind customization
├── CLAUDE.md                        # Project instructions for Claude
├── DEVELOPMENT.md                   # This file
└── README.md                        # User documentation
```

---

## Key Features

### Auto-Monitoring System
- **Automatic start:** Monitoring begins on app launch (no manual buttons)
- **Gameflow states:** Lobby → ChampSelect → InProgress → EndOfGame
- **Anonymized queues:** Ranked queues hide names until game starts
- **Auto-import:** Completed games imported automatically after 10s delay
- **File:** `src/main.js` - `startGameflowMonitor()` function (lines 426-630)

### Mode-Specific Stats
- **Queue categorization:** Ranked, Normal, ARAM, Arena, Other
- **Split stats:** Separate enemy/ally records per mode
- **Visual cards:** Color-coded mode indicators with icons
- **Files:**
  - `src/database/db.js` - `categorizeQueue()` method (lines 151-163)
  - `src/renderer/components/ModeStatsRow.tsx` - Mode stat cards
- **Queue mappings:**
  - Ranked: 420 (Solo/Duo), 440 (Flex)
  - Normal: 400 (Draft), 430 (Blind)
  - ARAM: 450
  - Arena: 1700
  - Other: Custom, Clash, URF, etc.

### Database Design
- **Location:** `app.getPath('userData')/database/rift-revealer.db`
  - **Critical:** NOT in asar (read-only) - uses writable user directory

- **Tables:**
  - `user_config` - Single-row table (id=1) with PUUID, summoner name, region, API key, auto-update and auto-start settings
  - `players` - Player PUUIDs, summoner names, region, last seen timestamp, profile icon ID
  - `matches` - Game records with match_id, game_creation, duration, mode, queue_id
  - `match_participants` - Detailed player stats: PUUID, summoner name, champion, skin_id, team, KDA, win, lane
  - `player_tags` - Player tagging system (toxic, friendly, notable, duo) with optional notes
  - `skin_cache` - Cached skin asset paths mapped to skin_id and champion_id

- **Key Features:**
  - **Single-row user_config:** Enforced by PRIMARY KEY CHECK(id = 1) constraint
  - **Skin tracking:** Skins stored per match participant, not per player (players can use different skins)
  - **Profile icons:** Stored in players table, fetched from Riot API during match import
  - **Lane inference:** Automatically fills missing/INVALID lane assignments per team (TOP, JUNGLE, MIDDLE, BOTTOM, SUPPORT)
  - **Name normalization:** Handles Riot ID format (GameName#TAG), legacy summoner names, and space variations
  - **Live skin caching:** In-memory cache (liveSkinSelections) maps PUUIDs and names to skin IDs from gameflow

- **Key Methods:**
  - `getPlayerHistory()` - Fetch games with a player, grouped by mode (PUUID or name fallback)
  - `saveMatch()` - Insert match with participant stats, infer missing lanes, resolve skin IDs from live cache
  - `categorizeQueue()` - Group queue IDs into mode types (Ranked, Normal, ARAM, Arena, Other)
  - `setLiveSkinSelections()` - Cache skin selections from live lobby/gameflow
  - `getMostRecentMatchRoster()` - Get last match roster with full encounter stats
  - `addPlayerTag()` / `getPlayerTags()` - Player tagging operations
  - `getSkinCacheEntry()` / `upsertSkinCacheEntry()` - Skin asset caching

- **Migrations:**
  - Automatic migrations handle schema updates (adding columns, rebuilding tables)
  - Foreign keys disabled during destructive migrations to avoid violations

### LCU Integration
- **How it works:**
  1. Search multiple possible lockfile locations (C:\Riot Games, D:\Riot Games, LocalAppData, ProgramData)
  2. Read `lockfile` content: `processName:processId:port:password:protocol`
  3. Extract port and password token from lockfile
  4. HTTPS requests to `https://127.0.0.1:{port}/lol-*` with self-signed cert (rejectUnauthorized: false)
  5. Basic Auth with `riot:{password}` in base64

- **Key Endpoints:**
  - `/lol-summoner/v1/current-summoner` - Get current user summoner info
  - `/lol-champ-select/v1/session` - Champion select lobby (both teams in draft)
  - `/lol-gameflow/v1/session` - Active game session (in-game state)
  - `/lol-summoner/v1/summoners/{id}` - Fetch summoner details by ID

- **Enhanced Features:**
  - **Name caching:** Three-level cache (PUUID, summonerId, cellId) to persist names across gameflow phases
  - **Name resolution:** Fallback chain through multiple fields (gameName#tagLine, riotIdGameName, displayName, summonerName, obfuscatedSummonerName, cached values, PUUID)
  - **Skin resolution:** Derives skin_id from selectedSkinId, skinId, or selectedSkinIndex * 1000 + championId
  - **Skin index mapping:** Builds map from gameData.playerChampionSelections to track skin choices
  - **Dual source support:** Works in both champion select (myTeam/theirTeam) and in-game (teamOne/teamTwo)

- **Error handling:**
  - Silent failures during auto-monitor (client not always running)
  - Best-effort summoner lookups (continues if summoner API fails)
  - Graceful fallback when no lobby/game detected

---

## Recent Changes (2025-01-28)

### Mode-Specific Stats Implementation
- **Added:** Queue categorization system to group games by mode type
- **Files modified:**
  - `src/database/db.js` - Added `categorizeQueue()`, `calculateModeStats()`, `byMode` grouping
  - `src/main.js` - Pass `byMode` data to renderer
  - `src/renderer/types/index.ts` - Added `ModeStats`, `GameMode` types
  - `src/renderer/components/PlayerChip.tsx` - Accept and display `byMode` prop
- **New component:** `src/renderer/components/ModeStatsRow.tsx` - Displays mode-specific stat cards
- **Visual design:** Color-coded icons per mode (Trophy=Ranked, Users=Normal, Zap=ARAM, etc.)

### Auto-Monitoring System
- **Extracted:** `startGameflowMonitor()` as standalone function (was inline in IPC handler)
- **Auto-start:** Monitoring now starts automatically on app launch
- **UI update:** Removed manual "Start Auto-Monitor" button, replaced with live status dashboard
- **Gameflow status:** Real-time display of current state (Lobby, ChampSelect, InProgress, etc.)

### Database Path Fix
- **Issue:** App tried to write SQLite database in read-only asar archive
- **Fix:** Changed database path to `app.getPath('userData')/database/`
- **Location:** `C:\Users\{Username}\AppData\Roaming\rift-revealer\database\`

### Packaging Fixes
- **Added:** `database/schema.sql` to build files array in package.json
- **Fix:** Window not showing on launch (removed `show: false`, deleted broken event handler)
- **Added:** Comprehensive error logging and dialogs for debugging

### UI Enhancements
- **Logo:** Added Rift Revealer logo to sidebar footer
- **Status dashboard:** Live gameflow state with colored indicators
- **Mode cards:** Horizontal mode-specific stat cards within PlayerChip
- **Color coding:** Win rate based colors (60%+ green, 40%- red)

### Code Cleanup
- **Removed:** `lastLobbyHash` variable (replaced with `lastAnalyzedPlayers`)
- **Updated:** Stop-auto-monitor handler to use correct state variable
- **Fixed:** Outdated UI messages mentioning "enable auto-monitor"

---

## Recent Changes (v1.6.0 - 2025-12-03) ⚠️ BREAKING CHANGE

### Database Schema Refactor - Riot ID Split
- **BREAKING:** Database now stores Riot IDs as separate `username` and `tag_line` fields instead of combined `summoner_name`
- **Migration required:** Users must delete database and re-import match history
- **Rationale:** Riot API returns `gameName` and `tagLine` separately - storing split eliminates parsing overhead and improves query performance

### Files Refactored (970+ lines in db.js)
- `database/schema.sql` - Split summoner_name into username + tag_line across all tables
- `src/database/db.js` - Complete rewrite of all 20+ methods to use split fields
- `src/api/riotApi.js` - Updated to pass username/tagLine separately
- `src/api/lcuConnector.js` - Updated parseRiotId() integration
- `src/main.js` - Updated IPC handlers and lobby analysis
- `src/preload.js` - Updated IPC signatures
- `src/renderer/types/index.ts` - Updated all TypeScript interfaces
- All React components: Settings.tsx, LobbyAnalysis.tsx, PlayerChip.tsx, PlayerTagMenu.tsx, DevPlayground.tsx

### New Features
- **Helper functions:** `formatRiotId(username, tagLine)` and `parseRiotId(fullName)` for consistent formatting
- **Unique constraint:** Added `UNIQUE(match_id, puuid)` to prevent duplicate match imports
- **Database migration:** Automatic duplicate removal when upgrading
- **Enhanced logging:** Debug logging for lobby player analysis
- **Name normalization:** Case-insensitive comparison with space removal

### Bug Fixes
- **Skin/champion cache:** Now clears properly when entering ChampSelect, InProgress, or Reconnect states
- **Wrong champion names:** Fixed players showing champions from previous games (e.g., Braum instead of Nautilus)
- **SQL quote escaping:** Fixed template literal quote escaping in database queries
- **Unknown player warnings:** Skip saving cosmetic info for anonymized/unknown players

### Settings UI Changes
- **Two separate inputs:** "Riot ID Username" and "Riot ID Tag" (e.g., "YourName" + "NA1")
- **Old format:** Previously used combined "YourName#NA1" in single input
- **Validation:** Both username and tag_line are now required (NOT NULL)

---

## Recent Changes (v1.5.x - 2025-12)

### UI Restructure (v1.5.0)
- **Removed:** Match History page (functionality moved to Settings)
- **Added:** Top navigation bar (removed sidebar navigation)
- **Changed:** Settings now a dedicated tab instead of modal

### DevPlayground Removal (v1.7.2)
- **Removed:** DevPlayground.tsx development testing page
- **Reason:** Not needed for production users, simplified navigation

### New Components Added
- **UpdateNotification.tsx** - Custom update notification dialog
- **PlayerTagMenu.tsx** - Player tagging system dialog
- **ErrorBoundary.tsx** - Error handling wrapper component
- **updateChecker.js** - Update checking logic module

### Enhanced Features (v1.5.4)
- **Skin system:** Player cards now show champion/skin backgrounds with fallbacks
- **Auto-start fixes:** Windows auto-start now works correctly with proper registry entries
- **Lane/role improvements:** Better lane detection and ordering in match data
- **Live lobby persistence:** Player names cached across gameflow phases
- **Skin tracking:** Skin IDs now properly saved and displayed from live lobbies

---

## Running the Application

### Prerequisites
1. **Node.js 18+** and npm
2. **League of Legends** installed (for LCU monitoring)
3. **Riot API Key** (development or production)

### Installation
```bash
npm install
```

### Development Mode
```bash
npm run dev
# Starts Vite dev server + Electron with hot reload
# Vite: http://localhost:5173
```

### Production Build
```bash
npm run build    # Build renderer with Vite
npm start        # Run Electron with built files
```

### Package for Distribution
```bash
npm run package
# Creates:
# - dist/Rift Revealer Setup 1.0.0.exe (NSIS installer)
# - dist/Rift Revealer 1.0.0.exe (portable)
```

---

## Git Commit History

1. `eb221f6` - Initial commit - Rift Revealer v1.0.0
2. `bac4729` - Add mode-specific stats and auto-monitoring features (2025-01-28)

---

## Important Implementation Details

### IPC Architecture

**Main → Renderer Events:**
- `lobby-update` - Analysis results when players detected
- `gameflow-state-change` - Raw gameflow state transitions
- `gameflow-status` - Formatted status with queue info
- `game-auto-imported` - Notification when game imported

**Renderer → Main Handlers:**
- `get-user-config` / `save-user-config` - User settings
- `import-match-history` - Bulk import past games
- `analyze-lobby` - Manual lobby analysis
- `start-auto-monitor` / `stop-auto-monitor` - Control monitoring

### Player Name Matching

**Priority order:**
1. **PUUID matching** (most reliable, when available)
2. **Riot ID format** (GameName#TAG)
3. **Legacy summoner name** (older accounts)

**Database query logic:**
```sql
WHERE LOWER(opponent.summoner_name) = LOWER(?)           -- Exact Riot ID
   OR LOWER(opponent.summoner_name) = LOWER(?)           -- Game name only
   OR LOWER(opponent.summoner_name) LIKE LOWER(? || '#%') -- Partial match
```

### Queue Anonymization

**Ranked queues (420, 440) hide player names until game starts:**
- During ChampSelect: Show "Waiting for names..." message
- State transition to InProgress: Trigger analysis with revealed names
- Detection: `ANONYMIZED_QUEUES` constant in `src/main.js:19`

### Native Module Handling

**better-sqlite3 requires rebuild for Electron:**
```bash
npm run rebuild  # Rebuild for current Electron version
```

**electron-builder auto-rebuilds during packaging:**
- Configured in package.json build section
- Unpacked from asar: `asarUnpack: ["node_modules/better-sqlite3/**/*"]`

---

## Design Decisions

### Why English Output Only?
- Not applicable (this is a desktop app, not translation tool)

### Why Mode-Specific Stats?
- **Context matters:** Meeting someone in ARAM vs Ranked is very different
- **Threat assessment:** 10-0 against you in Ranked is more concerning than ARAM
- **Quick scanning:** See at a glance which modes you've faced them in
- **Data density:** Efficient use of space within player cards

### Why Auto-Monitoring?
- **User experience:** No manual button clicks needed
- **Instant detection:** Analysis happens as soon as lobby forms
- **Reliability:** Automatic recovery if client restarts
- **Seamless:** Works in background, no user intervention

### Why Dark Theme Only?
- **Target audience:** Gamers expect dark UIs (matches LoL client aesthetic)
- **Esports aesthetic:** Professional, focused, not casual
- **Reduced eye strain:** Better for extended use
- **Design system:** lol-modern-ui Skill mandates dark-first approach

---

## Critical Constraints

### ✅ DO:

**UI Development:**
- Use `lol-modern-ui` Skill for ALL UI work
- Follow 5-step workflow (understand → sketch → identify → write → review)
- Use existing shadcn/ui components before creating new ones
- Apply semantic color tokens (bg-primary, text-destructive, etc.)
- Dark-first design (`#020817` background)

**Git Workflow:**
- Create feature branches for new work
- Write descriptive commit messages
- Update version in package.json before releases
- Tag releases with `v1.x.x` format
- Push to GitHub after major features

**Development:**
- Update DEVELOPMENT.md before starting new features
- Test in dev mode before packaging
- Rebuild better-sqlite3 after dependency changes
- Use writable locations for database (app.getPath)
- Handle LCU connection errors gracefully

**Database:**
- Store database in `app.getPath('userData')`
- Validate queue IDs against known mappings
- Use PUUID for player matching when available
- Categorize queues into modes (Ranked, Normal, ARAM, Arena, Other)

### ❌ DON'T:

**UI Development:**
- Create arbitrary colors (use design tokens)
- Add light mode (dark-only by design)
- Use generic chatbot aesthetics
- Ignore lol-modern-ui component catalog
- Add flashy animations (subtle transitions only)

**Git Workflow:**
- Commit directly to main (use feature branches)
- Forget to bump version for releases
- Push without testing packaged app
- Skip writing commit messages

**Development:**
- Store database in asar archive (read-only!)
- Assume LCU is always running (handle errors)
- Use synchronous file operations in main process
- Forget to rebuild native modules after install
- Hardcode League client paths (read lockfile)

**Database:**
- Write to read-only locations
- Assume summoner names are unique (use PUUID)
- Ignore queue_id for mode categorization
- Query without rate limit handling

---

## Troubleshooting

### Build Errors

**"better-sqlite3 not found":**
```bash
npm run rebuild
```

**"schema.sql missing":**
- Check package.json build.files includes `"database/schema.sql"`

**Window not showing:**
- Remove `show: false` from BrowserWindow options
- Check for errors in console

### Runtime Errors

**Database "unable to open":**
- Ensure database path uses `app.getPath('userData')`
- Check directory exists and is writable

**LCU connection fails:**
- League client must be running
- Check lockfile exists at standard location
- Credentials cached in `lcuConnector.credentials`

**No lobby detection:**
- Check auto-monitor started (console logs)
- Verify gameflow state transitions
- Ensure players have been imported to database

### Development Issues

**Hot reload not working:**
- Check Vite dev server running on correct port
- Verify `VITE_DEV_SERVER_URL` environment variable
- Restart dev mode

**TypeScript errors:**
- Run `npm run build` to see full error list
- Check type definitions in `src/renderer/types/index.ts`

---

## Known Bugs

### UI Issues

**1. Tag Button Click Propagation**
- **Issue**: When clicking the tag button on a player card, it opens the tag menu but also expands/collapses the card dropdown in the background
- **Impact**: When closing the tag menu, the card dropdown also closes, creating a messy visual experience
- **Root Cause**: Click event is propagating from the tag button down to the parent card's onClick handler
- **Expected Behavior**: Tag button click should not trigger card expansion/collapse
- **Files Affected**:
  - `src/renderer/components/PlayerChip.tsx` - Tag button onClick handler (lines ~342-357)
  - Need to add `e.stopPropagation()` to prevent event bubbling
- **Fix**: Add proper event stopping in the tag button's onClick handler (currently using `onPointerDown` with stopPropagation, but may need to also handle `onClick`)
- **Priority**: Medium - UX issue but not breaking functionality

**2. Dev Tab Visible in Production Builds** ✅ FIXED (v1.7.2)
- **Issue**: The "Dev" tab (DevPlayground) is showing for all users who download the packaged app
- **Impact**: Confusing for end users, exposes development/testing features
- **Solution**: Completely removed DevPlayground component and all references
- **Files Changed**:
  - `src/renderer/App.tsx` - Removed DevPlayground import, removed 'dev' from Page type, removed navigation item
  - `src/renderer/pages/DevPlayground.tsx` - DELETED
- **Status**: ✅ Fixed - DevPlayground completely removed from codebase

**3. Excessive Console Logging - DDragon Avatar URLs** ✅ FIXED (v1.7.2)
- **Issue**: Console is spammed with repeated `[DDragon] Building avatar URLs...` and `[DDragon] Avatar sources: Array(3)...` messages
- **Impact**: Console becomes unusable, performance impact from excessive logging
- **Solution**: Removed all debug console.log statements from PlayerChip.tsx
- **Files Changed**:
  - `src/renderer/components/PlayerChip.tsx` - Removed 7 debug log statements (lines 117-127, 247, 254)
  - Kept only error logging for actual failures
- **Status**: ✅ Fixed - Console no longer spammed with DDragon logs

**4. 403 Forbidden Errors - Profile Icons & Champion Splashes** ✅ FIXED (v1.7.2)
- **Issue**: Repeated 403 (Forbidden) errors when loading images from Riot DDragon CDN
- **Impact**: Missing profile icons and champion splash images, console spam
- **Root Cause**: Old/invalid profile icon IDs from match data that no longer exist on Riot's CDN
- **Solution**: Implemented pre-validation using JavaScript Image() API
- **How it Works**:
  1. Images are tested silently using `new Image()` before rendering
  2. Only successfully loaded images are displayed
  3. Falls back through chain: profile icon → default icon (0.png) → logo.png
  4. All validation happens in memory, no console errors
- **Files Changed**:
  - `src/renderer/components/PlayerChip.tsx`:
    - Added `validatedAvatar` state with async validation
    - Removed `imageIndex` state (no longer needed)
    - Removed `onError` handler (validation happens before render)
    - Added `findValidImage()` function to test each source
- **Status**: ✅ Fixed - 403 errors no longer spam console, images load cleanly

---

## Future Development Ideas

### Features
- [ ] Champion mastery display (show if opponent is M7 one-trick)
- [ ] Player tagging system (mark toxic/friendly/notable players)
- [ ] Export match history to CSV/JSON
- [ ] Duplicate detection (same person, different account)
- [ ] Discord Rich Presence integration
- [ ] Multi-account support
- [ ] Rank display (current rank per mode)
- [ ] Champion pool analysis
- [ ] Duo detection (players who often play together)
- [ ] Win streak indicators
- [ ] Performance trends (getting better/worse over time)

### UI Improvements
- [ ] Champion icons in match cards
- [ ] Interactive charts (win rate over time)
- [ ] Filter by date range
- [ ] Search players by name
- [ ] Dark/darker theme variants
- [ ] Customizable stat priorities

### Technical
- [ ] Database backup/restore
- [ ] Migration system for schema changes
- [ ] Error reporting to developer
- [ ] Analytics (anonymous usage stats)
- [ ] Auto-updater for releases
- [ ] Linux/Mac support
- [ ] Logging system with rotation

### Performance
- [ ] Virtual scrolling for large match lists
- [ ] Lazy loading of match details
- [ ] Database query optimization
- [ ] Caching layer for Riot API

---

## Development Commands

```bash
# Development
npm run dev                 # Start Vite + Electron with hot reload
npm run build              # Build renderer with Vite
npm start                  # Run Electron with built files

# Dependencies
npm install                # Install dependencies
npm run rebuild            # Rebuild better-sqlite3 for Electron

# Packaging
npm run package            # Build Windows executables (NSIS + portable)
npm run package:all        # Build for Windows, macOS, Linux

# Git
git checkout -b feature/name    # Create feature branch
git add .                       # Stage changes
git commit -m "message"         # Commit with message
git push -u origin feature/name # Push branch to GitHub
git tag v1.1.0                  # Tag release
git push --tags                 # Push tags

# Database
sqlite3 <database_path>    # Open database in CLI
.schema                    # Show schema
.tables                    # List tables
```

---

## Quick Reference

### Important Files to Edit

| File | Purpose | When to Edit |
|------|---------|--------------|
| `.claude/skills/lol-modern-ui/SKILL.md` | UI design system | NEVER (read-only reference) |
| `src/main.js` | Main process logic | Add IPC handlers, modify gameflow |
| `src/database/db.js` | Database queries | Change stats calculations, add queries |
| `src/renderer/pages/LobbyAnalysis.tsx` | Main UI page | Modify lobby detection display |
| `src/renderer/components/PlayerChip.tsx` | Player card | Change player card appearance |
| `src/renderer/types/index.ts` | TypeScript types | Add new interfaces |
| `package.json` | Dependencies & version | Update version before releases |
| `DEVELOPMENT.md` | This file | Document changes, track context |

### Critical System Paths

| Path | Description |
|------|-------------|
| `app.getPath('userData')` | Writable data directory |
| `{LoL Install}/lockfile` | LCU connection credentials |
| `dist-renderer/` | Vite build output |
| `dist/` | electron-builder output (executables) |

### Mode Categories

| Mode | Queue IDs | Icon | Color |
|------|-----------|------|-------|
| Ranked | 420, 440 | Trophy | Amber |
| Normal | 400, 430 | Users | Blue |
| ARAM | 450, 100 | Zap | Purple |
| Arena | 1700 | Swords | Orange |
| Other | 0, 700, 900, etc. | Gamepad2 | Slate |

---

## Contact & Support

- Repository: https://github.com/TrakeLean/Rift-Revealer
- Developer: TrakeLean
- Issues: https://github.com/TrakeLean/Rift-Revealer/issues

---

## Notes

This file is the **single source of truth** for development context. Update it whenever:
- Starting new features
- Making architectural decisions
- Discovering important constraints
- Losing context between sessions
- Onboarding new developers (AI or human)

Remember: **All UI work MUST use the lol-modern-ui Skill** - no exceptions!
