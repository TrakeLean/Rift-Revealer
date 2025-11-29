# Development Context

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
- `src/renderer/pages/LobbyAnalysis.tsx` - Main lobby detection UI
- `src/renderer/components/PlayerChip.tsx` - Player card with stats
- `src/renderer/components/ModeStatsRow.tsx` - Mode-specific stat cards
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
❌ **KNOWN BUGS:**
  - "Start on Windows Startup" setting keeps toggling off every time the app opens
  - "Check for Updates" button fails with "Failed to check for updates" error
🎯 **Next task** - Fix the startup setting persistence bug

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
│   │   └── lcuConnector.js          # League Client connector (lockfile)
│   └── renderer/                    # React frontend
│       ├── main.tsx                 # React entry point
│       ├── App.tsx                  # Root component + sidebar
│       ├── components/
│       │   ├── ui/                  # shadcn/ui base components
│       │   ├── PlayerChip.tsx       # Player card with stats
│       │   ├── ModeStatsRow.tsx     # Mode-specific stat cards
│       │   ├── StatsPanel.tsx       # Expandable detailed stats
│       │   ├── MatchCard.tsx        # Single match display
│       │   └── TagPill.tsx          # Player tag badges
│       ├── pages/
│       │   ├── LobbyAnalysis.tsx    # Main lobby detection page
│       │   ├── MatchHistory.tsx     # Match import page
│       │   └── Settings.tsx         # Configuration page
│       ├── types/
│       │   └── index.ts             # TypeScript interfaces
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
  - `user_config` - Summoner name, region, API key
  - `players` - Player PUUIDs and names
  - `matches` - Game records with queue_id
  - `match_participants` - Detailed player stats per game
- **Key queries:**
  - `getPlayerHistory()` - Fetch games with a player, grouped by mode
  - `saveMatch()` - Insert match with participant stats
  - `categorizeQueue()` - Group queue IDs into mode types

### LCU Integration
- **How it works:**
  1. Read `lockfile` from LoL installation
  2. Extract port, password, process info
  3. HTTPS requests to `https://127.0.0.1:{port}/lol-*`
  4. Basic Auth with `riot:{password}`
- **Endpoints:**
  - `/lol-champ-select/v1/session` - Champion select lobby
  - `/lol-gameflow/v1/session` - Active game session
- **Error handling:** Silent failures during auto-monitor (client not always running)

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
