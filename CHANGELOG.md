# Changelog

All notable changes to Rift Revealer will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.9] - 2025-12-01

### Added
- Settings page now includes an Import Last 100 Matches action with progress details and a cancel flow that reaches down to the Riot API import loop.
- Role breakdowns were added to stats and the mock data now mirrors them for Dev Playground previews.

### Changed
- Lobby status UI rebuilt with a floating bubble that auto-expands on new gameflow events, collapses after 5 seconds, and uses state-specific tinting and labels.
- Gameflow states are normalized (client closed, lobby, matchmaking, ready check, champ select, in-progress, end of game, reconnect) with consistent messaging and Practice Tool queue naming.
- Navigation moved to the top bar, the sidebar was removed, Settings is now a tab, and the Match History tab was removed.
- Player tag UX on player cards improved with a clearer tag button, hover notes, and better tooltip sizing.

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
- Champion mastery display
- Duplicate account detection
- Export match history to CSV/JSON
- Discord Rich Presence integration
- Multi-account support
- Rank display per mode
- Champion pool analysis
- Win streak indicators
- Performance trend charts

---

## Version History

- **1.1.0** - Player tagging system + logo fixes
- **1.0.0** - Initial release with core features
