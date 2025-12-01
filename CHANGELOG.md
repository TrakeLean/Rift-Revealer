# Changelog

All notable changes to Rift Revealer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Last-match roster avatars now load the correct profile icons by saving `profileIcon`/`profileIconId` from match imports and shipping the top-level `public/profileicon` assets via Vite’s `publicDir`.

## [1.5.1] - 2025-12-01

### Changed
- Simplified database schema: removed unused participant fields (profile icon, roles, gold/CS/damage) and per-player skin_id; user_config now enforces a single row keyed by puuid with replace semantics.
- Skin cache now persists paths in the database and migrations temporarily disable foreign keys to avoid failures during rebuilds.
- Removed external ddragon champion icon fallback; PlayerChip now uses cached skin, local tiles/profile icons, and local logo fallback only.

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
- Read-only database in asar archive (now writable in userData)

## [Unreleased]

### Planned Features


### Changed
- Serve cached skin/champion tiles via a local protocol and strip external fallbacks to avoid blocked resources.
- Added champion tile IPC handler and wiring so roster avatars can resolve without CommunityDragon.
- Enabled Flex analysis in champ select by limiting anonymized queues to Ranked Solo/Duo.

---

## Version History

- **1.1.0** - Player tagging system + logo fixes
- **1.0.0** - Initial release with core features
