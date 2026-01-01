# Changelog

All notable changes to Rift Revealer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.8.7] - 2025-12-30

### Fixed
- **Stale lobby data in anonymized queues**: Fixed issue where players from previous game were shown in Ranked Solo/Duo ChampSelect
  - App now properly clears lobby data when entering anonymized queues (Ranked Solo/Duo)
  - Prevents displaying old Flex/ARAM players when names are hidden
  - UI correctly shows "waiting for names" state until game starts

## [1.8.6] - 2025-12-30

### Fixed
- **System tray notification icon**: Removed app icon from system tray balloon notification message body
  - Icon now only appears in notification header, consistent with other notifications
  - Applies to "minimize to tray" notification shown on first window close

## [1.8.5] - 2025-12-30

### Changed
- **Notification timing**: Desktop notifications now only appear when game starts, not during champion select
  - Prevents duplicate notifications for the same lobby
  - Notifications still show when reconnecting to an in-progress game
  - ChampSelect analysis still runs normally (visible in app), just without notifications

## [1.8.4] - 2025-12-30

### Fixed
- **"Install Later" button**: Fixed issue where clicking "Install Later" after update download didn't close the dialog
  - Modified handleClose function to allow closing when update is downloaded
- **Notification icon display**: Fixed inconsistency where real notifications showed app icon in message body
  - Added `timeoutType: 'default'` to player detection notifications to match test notification format
  - App icon now only appears in notification header, not in message body

## [1.8.3] - 2025-12-30

### Fixed
- **Update download URL**: Fixed 404 error when downloading updates
  - Changed artifact naming to match electron-updater expectations
  - Installer now named `rift-revealer-Setup-{version}.exe` instead of `Rift.Revealer.Setup.{version}.exe`

### Added
- **Update notification preferences**: Added user controls for update notifications
  - New "Show Update Notifications" toggle in Settings to completely disable update popups
  - "Skip This Version" button in update notification dialog to skip specific versions
  - Skipped versions won't show notifications until a newer version is released
  - Manual "Check for Updates" always shows popup regardless of skip setting
  - Clicking "Download Update" clears the skip flag, allowing download of previously skipped versions
  - All preferences persist in database

## [1.8.2] - 2025-12-30

### Fixed
- **Update notification changelog display**: Release notes now show full content with scrolling instead of truncating at 400 characters
  - Removed character limit in UpdateNotification component
  - Increased max height to 16rem for better visibility
  - Users can now scroll through complete changelogs
- **Manual update check popup**: "Check for Updates" button now triggers the UpdateNotification popup
  - Previously only automatic startup checks showed the styled popup
  - Manual checks now emit `update-available` event to display the same UI
  - Consistent update notification experience across automatic and manual checks
- **Update download functionality**: Fixed "Please check update first" error when clicking "Download Update"
  - Both automatic and manual update checks now initialize electron-updater properly
  - Calls `autoUpdater.checkForUpdates()` when update is detected to enable download
  - Download button now works correctly from both startup notifications and manual checks

## [1.8.1] - 2025-12-30

### Added
- **Debug log retention cap**: Automatically trims old debug log files to prevent indefinite growth
  - On startup, keeps only the newest 30 log files in `%APPDATA%\rift-revealer\debug-logs`
  - Implemented via `pruneDebugLogs()` function called after session header is written
  - Configurable via `DEBUG_LOG_LIMIT` constant in [main.js](src/main.js)
  - Newest log file is always preserved during pruning
- **Weekly Data Dragon refresh**: Cached DDragon version now auto-refreshes weekly
  - Stores last refresh time in `user_config.ddragon_version_checked_at`
  - Falls back to cached version if refresh fails

## [1.8.0] - 2025-12-30

### Added
- **Test Notification button**: Added button in Settings to preview desktop notifications
  - Located in the Notifications section below tag filters
  - Shows a sample notification with app icon and example message
  - Helps users verify notification settings are working correctly
- **Seamless auto-update system**: Updates now download and install in the background
  - Click "Download Update" to download in the background (no browser opening)
  - Live progress bar shows download status with percentage and file size
  - When complete, click "Install & Restart" to apply the update
  - Fully integrated with electron-updater for reliable auto-updates

### Improved
- **Consistent tag ordering**: Player tags now appear in consistent order across the app
  - Order matches tag dialog: Toxic, Weak, Friendly, Notable, Duo
  - Applied to all player cards throughout the app
- **Mode filter tooltip positioning**: Tooltips now appear on the left side to prevent cutoff
  - Previously extended beyond window edge when dropdown was on right side
  - Now positioned to always stay within visible area

### Fixed
- **Update notification consistency**: Manual "Check for Updates" now uses the same beautiful UpdateNotification popup as automatic checks
  - Previously used a basic confirm() dialog
  - Now shows styled popup with changelog, version comparison, and download button
- **Mode filter in Last Match Roster**: Player stats now update correctly when toggling game mode filters
  - Previously the filter dropdown didn't update the displayed stats in player cards
  - Now applies selected mode filters to stats shown in Last Match Roster
- **Windows taskbar icon**: Fixed taskbar showing default Electron icon in production builds
  - Removed `signAndEditExecutable: false` from package.json which was preventing icon embedding
  - electron-builder now properly embeds custom icon into the .exe file
  - Added `setAppUserModelId()` to properly associate app with its icon on Windows
- **Notification icons**: Removed redundant icon parameter from notifications
  - Windows already displays app icon automatically from system
  - Cleaner notification appearance without duplicate icons

### Changed
- **Product name formatting**: Changed from "RiftRevealer" to "Rift Revealer" (with space)

### Documentation
- Added ARAM Mayhem API limitation to documentation
  - ARAM Mayhem (queue 2400) is not available via Riot API ([GitHub Issue #1109](https://github.com/RiotGames/developer-relations/issues/1109))

## [1.7.5] - 2025-12-30

### Fixed
- **Duplicate player bug resolved**: Players no longer appear twice in lobby analysis UI
  - Root cause: LCU API sends duplicate player entries (with and without PUUIDs) during ChampSelect
  - Solution: Enhanced deduplication using database PUUID (`matchedPuuid`) instead of LCU PUUID
  - Handles PUUID encryption differences between LCU API (unencrypted) and Riot Match API (encrypted per API key)
  - Works correctly across name changes - same player tracked even after username/tag change
- **Icon files restored**: System tray and taskbar icons now display correctly
  - Regenerated `icon.ico` from current `logo.png` using png-to-ico
  - Both files properly configured in package.json extraResources

### Added
- **Comprehensive debug logging system**:
  - Session-based log files with timestamps (e.g., `lobby-2025-12-30T12-34-56.log`)
  - Logs saved to dedicated `debug-logs/` folder in app data directory
  - Tracks LCU PUUID vs database PUUID mismatches for debugging
  - Logs deduplication decisions (added vs skipped duplicates)
  - Backend and frontend events logged with full context

### Changed
- Database lookup now returns `matchedPuuid` (the PUUID that actually found matches in database)
- Deduplication logic enhanced to use both database PUUID and name-based fallback
- Player tags now try database PUUID first, then LCU PUUID as fallback
- Auto-import retry strategy improved: 6 attempts over 90 seconds (was 3 attempts over 25 seconds)
- Auto-import now distinguishes between "already imported" vs "successfully imported new match"
- Added ARAM Mayhem queue (2400) to queue name mapping
- Queue name lookup now handles both string and number queue IDs

### Technical Details
- **PUUID Architecture**:
  - LCU returns unencrypted UUIDs (e.g., `ab47b7c8-892b-5f7b-a154-54fc018bbf38`)
  - Match API returns encrypted PUUIDs unique per API key (e.g., `O62OV7TIAInDkjD72coj0ov0KvRoNAg1UTnLojZBvNLZfGvhzstokAjFrWxBhrxSLFv-cuZgciLFEg`)
  - Deduplication now uses database PUUID to handle this mismatch
- **Files Updated**:
  - `src/main.js`: Enhanced deduplication logic, debug logging, auto-import improvements
  - `src/database/db.js`: Returns `matchedPuuid` from `getPlayerHistory()`
  - `src/preload.js`: Added `debugLog` IPC handler
  - `src/renderer/pages/LobbyAnalysis.tsx`: Frontend debug logging
- **Race Condition Fixes**: Added mutex (`analysisInProgress`) to prevent concurrent lobby analyses
- **Memory Leak Fixes**: Proper cleanup of intervals in `startGameflowMonitor()` and `stop-auto-monitor`

## [1.7.4] - 2025-12-07

### Changed
- Live status bubble now shows the app logo in the background with a slow, subtle pulse when expanded.

## [1.7.3] - 2025-12-07

### Changed
- Players You've Met now relies on a single deduplication layer at the LCU connector; backend and frontend deduplication were removed.
- Live lobby cache lifecycle clarified: live cache clears only when exiting live states, roster stays cached when entering live, and skin cache clears on new lobbies or when the client closes.
- Structured logging aligned around lobby analysis with `[LCU]`, `[Backend]`, `[Frontend]`, `[Cache]`, and `[LastRoster]` lifecycle messages.
- Auto-import now skips already imported matches to avoid duplicate UNIQUE constraint errors and log noise; import counts reflect only newly saved matches.
- End-of-game auto-import fetches the latest 3 matches and retries if nothing new imports, then retries again if the newest match ID did not change, reducing chances of serving a stale or already-imported match as the "last" game.

## [1.7.1] - 2025-12-05

### Changed
- **Rank display temporarily disabled**: Rank fetching requires production API key (not available with development key)
- Player card stats section background now properly fits content width instead of stretching full width
- Updated README.md to include "Weak" tag in player tagging system documentation

### Fixed
- Player stats background (`bg-black/30`) no longer stretches across full horizontal space when displaying teammate/opponent stats
- Changed from `inline-block` to `w-fit` for proper content-fitting behavior
- Removed `flex-1` from stat containers to prevent unnecessary expansion

### Technical Details
- Rank system fully commented out in preparation for production API key:
  - `src/main.js` - IPC handler for `get-player-rank` disabled (lines 575-636)
  - `src/renderer/pages/LobbyAnalysis.tsx` - Rank fetching logic disabled (lines 89-124)
  - `src/renderer/components/PlayerChip.tsx` - Rank badge display hidden (line 363-364)
- Added comprehensive re-enable instructions in `DEVELOPMENT.md`
- Updated GitHub Actions workflow with better debugging and error handling (v2 of release action)

## [1.7.0] - 2025-12-04

### Changed
- **Skin system massively simplified**: Removed all disk caching (~230 lines of code removed)
- Skin images now load directly from Riot's Data Dragon CDN
- **Profile icons now load from CDN**: Eliminated 542MB of bundled profile icon images (4,840 files)
- Profile icons load from `https://ddragon.leagueoflegends.com/cdn/14.23.1/img/profileicon/{iconId}.png`
- Removed custom `local://` protocol and file I/O operations
- Removed 30-line champion ID mapping - now uses `championName` directly from database
- IPC signature changed: `getSkinImage(skinId, championName)` instead of `getSkinImage(skinId, championId)`
- Chromium's built-in HTTP cache now handles image caching automatically

### Removed
- Disk-based skin cache system (functions: `getSkinCacheDir`, `toLocalSkinUrl`, `registerLocalProtocol`, `findCachedSkinFile`)
- `getChampionTile` IPC handler and associated logic
- LCU-based skin fetching (except as fallback for unreleased champions)
- `CHAMPION_ID_TO_KEY` hardcoded mapping object
- `skin_cache` database table usage
- `skin-cache/` directory creation and management
- **public/profileicon/ directory**: Removed 542MB of local profile icon files

### Technical Details
- **Code reduction**: ~230 lines removed (92% reduction in skin-related code)
- **Asset reduction**: 542MB profile icons eliminated from app bundle
- **New approach**: Direct CDN URLs via `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/{ChampionName}_{SkinNumber}.jpg`
- **Caching**: Relies on Chromium's automatic HTTP cache (transparent to application code)
- **Simplification**: Skin URL generation now just ~20 lines total

## [1.6.0] - 2025-12-03 - BREAKING CHANGE

### ⚠️ BREAKING CHANGES
- **Database schema refactored**: `summoner_name` field split into `username` + `tag_line` across all tables
- **Existing database incompatible**: Users must delete `~/AppData/Roaming/rift-revealer/database/` folder and re-import match history
- **Settings UI updated**: Now requires separate inputs for username and tag (e.g., "YourName" + "NA1" instead of "YourName#NA1")

### Added
- Enhanced logging for lobby player analysis to help debug detection issues
- Unique constraint on `(match_id, puuid)` in `match_participants` table to prevent duplicate imports

### Changed
- Database now stores Riot IDs as separate `username` and `tag_line` fields, aligning with Riot API format
- All database queries updated to use split fields for cleaner SQL and better indexing
- Added compound index on `(username, tag_line)` for faster player lookups
- Settings page now has two input fields: "Riot ID Username" and "Riot ID Tag"
- All IPC method signatures updated to accept `username` and `tagLine` as separate parameters
- Created helper functions `formatRiotId(username, tagLine)` and `parseRiotId(fullName)` for consistent formatting
- Updated TypeScript interfaces across all components (`UserConfig`, `AnalysisResult`, `RosterPlayer`, etc.)
- Improved name matching logic with normalized case-insensitive comparison

### Fixed
- Skin/champion cache now clears properly when entering ChampSelect, InProgress, or Reconnect states
- Players no longer show with wrong champion names from previous games (e.g., Braum when playing Nautilus)
- SQL template literal quote escaping fixed in database queries
- Duplicate match participant entries prevented by unique constraint

### Technical Details
- **Files Updated**: schema.sql, db.js (970 lines rewritten), riotApi.js, lcuConnector.js, main.js, preload.js, types/index.ts
- **React Components Updated**: Settings.tsx, LobbyAnalysis.tsx, PlayerChip.tsx, PlayerTagMenu.tsx, DevPlayground.tsx
- **Database Methods**: All 20+ methods updated with new signatures (`savePlayer`, `getPlayerHistory`, `addPlayerTag`, etc.)
- **Helper Functions**: Exported `formatRiotId` and `parseRiotId` from db.js for use across the app

### Why This Change?
- Riot API returns `gameName` and `tagLine` separately - storing them split eliminates parsing overhead
- Better query performance with direct field access instead of string operations
- Cleaner data model that matches the source format
- Enables future features like tag-specific filtering or username-only searches

## [Unreleased (1.5.4)]

### Changed
- Player card backgrounds now fall back to champion tiles until a fetched skin image is available; skins are derived solely from `selectedSkinIndex` in gameflow data.
- Mode stats row can render extra content; tags and last-seen info were moved into the same block for a tighter layout.
- Champ select analysis now runs even in anonymized queues when player IDs are present, so familiar players surface sooner.
- Database no longer stores `last_skin_id` on players; skin tracking lives on match participants only.
- Added skin fetch debug logging (renderer + main) to trace missing/failed skin downloads and cache population.
- Fixed renderer debug logging to avoid `process` access (which is undefined in the browser context).
- Live skin selections from gameflow are cached and applied during match import so `match_participants.skin_id` is populated when available.
- Match imports now persist the champion/skin pairing from gameflow (`championId` + `selectedSkinIndex`) into `match_participants` so the exact skin can be rendered later.

### Fixed
- Windows auto-start now writes the correct login item (including dev args) and rewrites bad entries so the app launches instead of the bare Electron shell on startup.
- Lane/role capture now prefers teamPosition → individualPosition → role → lane, improving scoreboard-style ordering with more aliases (Top/Jungle/Mid/Bot/Support).
- Added resilient migrations that always create `players.last_skin_id` and `match_participants.skin_id`, preventing missing-column crashes after updates.
- Persist skin IDs from live lobbies into player records so cached skin/champion backgrounds render even when the client is closed.
- Skin capture now uses `selectedSkinId`/`skinId` with champ-select and in-game fallbacks so the chosen skin carries through into last-match rosters (no more default tiles after a game).
- Live lobby names are cached across phases and fall back through multiple session fields to avoid players reverting to "Unknown".
- Match imports now infer missing/INVALID lanes per team (Top/Jungle/Mid/Bot/Support) to keep roster/scoreboard ordering consistent.

## [1.5.3] - 2025-12-02

### Changed
- CI workflow now builds on version tags only, uploads installer/portable plus `latest.yml`/blockmaps, and publishes releases automatically so no local packaging is needed.
- Lightweight `verify` job added for PRs/main pushes to keep CI fast while still validating the renderer build.

### Fixed
- Lobby analysis falls back to name-based history lookup when PUUIDs differ between LCU and match data, restoring familiar-player detection in live lobbies.
- Player tag notes now render above surrounding UI (higher z-index and overflow visible) so long notes are fully readable.

## [1.5.2] - 2025-12-02

### Changed
- Player cards use skin/champion art as backgrounds with lightweight overlays, tighter padding, and smaller avatars for a more compact roster layout.
- Tag button restyled to an unobtrusive ghost icon and prevented from toggling card expansion when clicked.

### Fixed
- Last-match roster avatars now load the correct profile icons by saving `profileIcon`/`profileIconId` from match imports (now loaded from Data Dragon CDN).

## [1.5.1] - 2025-12-01

### Changed
- Simplified database schema: removed unused participant fields (profile icon, roles, gold/CS/damage) and per-player skin_id; user_config now enforces a single row keyed by puuid with replace semantics.
- Skin cache now persists paths in the database and migrations temporarily disable foreign keys to avoid failures during rebuilds.
- Removed external ddragon champion icon fallback; PlayerChip now uses CDN skins, CDN profile icons, and local logo fallback only.

## [1.5.0] - 2025-12-01

### Added
- Settings page now includes an Import Last 100 Matches action with progress details and a cancel flow that reaches down to the Riot API import loop.
- Skin support for players in live lobbies and last-match roster: skins saved from LCU, matched to `public/tiles`, and used as avatars with profile/champion fallbacks.
- Last-match roster shows full encounter stats (ally/enemy splits, mode badges, recent games) using the same PlayerChip styling as live cards.

### Changed
- Lobby status UI rebuilt with a floating bubble that auto-expands on new gameflow events, collapses after 5 seconds, and uses state-specific tinting and labels.
- Gameflow states are normalized (client closed, lobby, matchmaking, ready check, champ select, in-progress, end of game, reconnect) with consistent messaging and Practice Tool queue naming.
- Navigation moved to the top bar, the sidebar was removed, Settings is now a tab, and the Match History tab was removed.
- Player tag UX on player cards improved with a clearer tag button, hover notes, and better tooltip sizing.
- Lobby analysis player cards now display more info in a clearer, easier-to-scan layout.

### Fixed
- Player tagging now correctly saves tags (including notes) for players you have encountered.
- Gameflow detection logic is more reliable at identifying lobby, champ select, in-game, and other states.
- Last-match roster expansion now renders inline with rows at full width, avoiding cramped layouts and keeping card heights consistent.

## [1.4.8] - 2025-01-29

### Fixed
- Update notification now uses custom UpdateNotification dialog instead of electron-updater default
- Update checker on startup properly displays custom notification UI
- Download button now opens browser to GitHub release page for manual download

## [1.4.7] - 2025-01-29

### Fixed
- Taskbar icon now correctly displays app icon instead of Electron default icon in packaged builds

## [1.4.6] - 2025-01-29

### Fixed
- "Check for Updates" button now works in both dev and packaged modes using custom UpdateChecker
- "Start on Windows Startup" toggle now correctly reflects actual Windows registry setting
- Single instance lock no longer creates blank window or freezes when launching second instance
- Added missing openDownloadUrl IPC handler for opening browser to download updates

## [1.4.5] - 2025-01-29

### Fixed
- Update notification now downloads the correct installer file (Rift.Revealer.Setup.X.X.X.exe) instead of the portable version
- Release notes now show actual changes from CHANGELOG.md instead of generic template
- GitHub Actions workflow now extracts version-specific changelog entries for releases

## [1.1.1] - 2025-01-28

### Fixed
- GitHub Actions build workflow now uses Node.js 20 (required for Vite 7)
- Added package-lock.json to repository for npm caching in CI/CD

## [1.1.0] - 2025-01-28

### Added
- **Player Tagging System**
  - Tag players with 4 types: Toxic (red), Friendly (green), Notable (yellow), Duo (blue)
  - Add optional notes to each tag for context
  - Tags persist across all future games
  - Visual tag indicators on player cards
- **UI Components**
  - PlayerTagMenu dialog with modern design
  - Dialog, Label, and Textarea shadcn/ui components
  - Tag button on player cards with visual feedback
- **GitHub Actions**
  - Automated build workflow on push to main
  - Automatic release creation on version tags

### Fixed
- Taskbar icon now displays correctly in packaged app
- Sidebar logo displays correctly (changed path from `/logo.png` to `./logo.png`)
- Logo.png now properly included in extraResources for packaging

### Changed
- Version bumped to 1.1.0
- Updated README with comprehensive documentation
- Removed deprecated CLAUDE.md (consolidated into DEVELOPMENT.md)
- Enhanced player cards with tag management

## [1.0.0] - 2025-01-27

### Added
- **Core Features**
  - Automatic lobby detection and monitoring
  - Real-time gameflow state tracking
  - Match history import from Riot API
  - Player encounter detection
  - Comprehensive statistics display
- **Mode-Specific Statistics**
  - Stats split by game mode (Ranked, Normal, ARAM, Arena, Other)
  - Queue categorization system
  - Separate enemy/ally records per mode
- **UI Features**
  - Modern dark theme with esports aesthetic
  - PlayerChip component with expandable stats
  - ModeStatsRow for mode-specific display
  - StatsPanel for detailed metrics
  - MatchCard for game history
- **Database**
  - SQLite database for local storage
  - Efficient player history queries
  - Match participant tracking
- **Auto-Monitoring**
  - Automatic start on app launch
  - 3-second polling interval
  - Handles anonymized queues (Ranked)
  - Auto-import completed games
- **Technical**
  - Electron 28 desktop framework
  - React 19 + TypeScript 5 frontend
  - Vite 7 build system
  - Tailwind CSS 4 styling
  - LCU API integration
  - Riot Games API integration

### Security
- All data stored locally (no external servers)
- API key stored securely in local database
