# Have We Meet? - Claude Code Project Guide

## Project Overview

**Have We Meet?** is a desktop application for League of Legends players that tracks lobby encounters and provides instant analysis of players you've faced before. It monitors the League client in real-time and alerts you when you enter a game with someone from your match history.

## Tech Stack

### Desktop Framework
- **Electron 28** - Desktop application wrapper
- **Node.js backend** - Main process handling LCU connection, database, Riot API

### Frontend
- **React 19** with **TypeScript 5**
- **Vite 7** - Build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Component library (Radix UI based)
- **Framer Motion** - Animations
- **lucide-react** - Icons

### Data & APIs
- **better-sqlite3** - Local SQLite database
- **Riot Games API** - Match history and summoner data
- **LCU (League Client Update) API** - Real-time lobby monitoring via lockfile

## Architecture

```
├── src/
│   ├── main.js              # Electron main process
│   ├── preload.js           # IPC bridge
│   ├── database/
│   │   └── db.js            # SQLite operations
│   ├── api/
│   │   ├── riotApi.js       # Riot Games API client
│   │   └── lcuConnector.js  # League Client connector
│   └── renderer/            # React frontend
│       ├── main.tsx         # React entry point
│       ├── App.tsx          # Root component
│       ├── components/
│       │   └── ui/          # shadcn/ui base components
│       ├── lib/
│       │   └── utils.ts     # Helper functions
│       └── styles/
│           └── globals.css  # Tailwind + design tokens
├── .claude/
│   └── skills/
│       └── lol-modern-ui/   # UI design system Skill
└── database/
    └── history.db           # Player encounter data
```

## Key Features

1. **Auto-Monitor Mode** - Polls LCU every 3 seconds for lobby changes
2. **Match History Import** - Bulk imports past games from Riot API
3. **Player Tagging** - Track toxic/friendly/notable players
4. **Encounter Detection** - Instant alerts when facing known players
5. **Win/Loss Context** - Shows your history against each player

## Development Workflow

### Running the App

```bash
# Development mode (hot reload)
npm run dev

# Production build
npm run build
npm start
```

### IPC Architecture

The app uses Electron IPC for main↔renderer communication:

**Main Process** (`src/main.js`):
- Database operations
- Riot API calls
- LCU monitoring
- Auto-monitor interval management

**Renderer Process** (`src/renderer/`):
- React UI
- User interactions
- Real-time updates via IPC listeners

**IPC Channels**:
- `get-user-config` / `save-user-config`
- `import-match-history`
- `analyze-lobby`
- `start-auto-monitor` / `stop-auto-monitor`
- `lobby-update` (main → renderer event)

## UI Development

**CRITICAL**: All UI work must use the **`lol-modern-ui` Skill**.

### When Working on UI:

1. **Always state**: "Using the `lol-modern-ui` Skill"
2. **Follow the 5-step workflow**:
   - Understand the feature
   - Sketch layout in text
   - Identify reusable components
   - Write React/TSX code
   - Self-review against checklist
3. **Reference components** from `.claude/skills/lol-modern-ui/SKILL.md`
4. **Check design tokens** in `.claude/skills/lol-modern-ui/tokens.json`

### Design Principles
- Dark-first (background `#020817`)
- Esports client aesthetic
- Color-coded player tags (red=toxic, green=positive, yellow=notable, blue=info)
- Quick visual scanning priority
- Subtle animations only

### Component Library
- **Base**: `<Button>`, `<Card>` (shadcn/ui in `src/renderer/components/ui/`)
- **Custom**: `<MatchCard>`, `<PlayerChip>`, `<TagPill>` (documented in Skill)

## Database Schema

### Tables
- **`user_config`** - Summoner name, region, API key
- **`match_history`** - Game records with participants
- **`player_notes`** - User-added tags and notes for players

### Key Operations
- `db.getUserConfig()` - Get current user settings
- `db.saveMatchHistory(matches)` - Bulk insert games
- `db.getPlayerHistory(summonerName)` - Retrieve all games with a player

## Riot API Integration

### Required API Key
Users must provide their own Riot Games API key (development or production).

### Rate Limits
- Development key: 20 requests/second, 100 requests/2 minutes
- Production key: Higher limits (requires application)

### Endpoints Used
- `/lol/summoner/v4/summoners/by-name/{summonerName}` - Get PUUID
- `/lol/match/v5/matches/by-puuid/{puuid}/ids` - Match history IDs
- `/lol/match/v5/matches/{matchId}` - Detailed match data

## LCU Connector

### How It Works
1. Reads `lockfile` from League of Legends installation
2. Extracts port, password, and process info
3. Makes HTTPS requests to `https://127.0.0.1:{port}/lol-*` endpoints
4. Uses Basic Auth with `riot:{password}`

### Endpoints Used
- `/lol-champ-select/v1/session` - Champion select lobby
- `/lol-gameflow/v1/session` - Active game session

### Connection Handling
- Credentials cached in `lcuConnector.credentials`
- Reset on error (for reconnection attempts)
- Silent failure during auto-monitor (client not always running)

## Auto-Monitor Implementation

Located in `src/main.js:159-217`

### How It Works
1. Tests initial LCU connection
2. Starts 3-second polling interval
3. Hashes lobby player list to detect changes
4. Only analyzes when lobby composition changes
5. Sends `lobby-update` event to renderer
6. Cleans up on app shutdown

### Error Handling
- Silently ignores errors (client closed, no lobby)
- Resets credentials on failure for auto-reconnect

## Code Style

### TypeScript
- Strict mode enabled
- Explicit prop types for components
- Use `interface` for props, `type` for unions

### React Conventions
- Functional components only
- Hooks for state management
- Use `@/` path alias for imports from `src/renderer/`

### Tailwind
- Utility classes only (no custom CSS unless necessary)
- Use design tokens from `globals.css`
- Conditional classes with `cn()` utility

## Common Tasks

### Adding a New UI Component

1. Check if a shadcn/ui component exists
2. If custom, follow `lol-modern-ui` Skill workflow
3. Create in `src/renderer/components/`
4. Document in `.claude/skills/lol-modern-ui/SKILL.md`
5. Export and use in pages

### Adding a New IPC Handler

1. Add handler in `src/main.js` with `ipcMain.handle('name', ...)`
2. Expose in `src/preload.js` via `contextBridge.exposeInMainWorld`
3. Call from renderer with `window.api.name()`

### Modifying Database Schema

1. Update `src/database/db.js` initialization
2. Add new methods for queries
3. Consider migration strategy for existing users

## Testing the App

### Manual Testing Checklist
- [ ] Config save/load works
- [ ] Match history import succeeds
- [ ] Auto-monitor detects lobby changes
- [ ] Player tags display correctly
- [ ] Win/loss colors accurate
- [ ] LCU connection recovers after client restart

### With League Client
1. Start League of Legends
2. Run `npm run dev`
3. Configure summoner name + region + API key
4. Import match history
5. Click "Start Auto-Monitor"
6. Enter a lobby or game
7. Verify analysis appears automatically

## Deployment

### Building for Production
```bash
npm run build    # Builds renderer to dist-renderer/
npm start        # Runs Electron with built files
```

### Packaging (TODO)
Future: Add electron-builder for distributable executables

## Known Issues

- Cache creation errors on Windows (harmless)
- Module type warnings (cosmetic, can be fixed by adding `"type": "module"`)
- Rate limiting if importing too many matches at once

## Resources

- [Riot Games API Docs](https://developer.riotgames.com/docs/lol)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Electron IPC Guide](https://www.electronjs.org/docs/latest/tutorial/ipc)

## Questions or Clarifications?

When implementing new features:
1. Use `AskUserQuestion` for design decisions
2. Propose multiple approaches with trade-offs
3. Reference this guide and the `lol-modern-ui` Skill
4. Prioritize user experience and data accuracy over flashy features

---

**Remember**: This is a utility app for serious players. Functionality and clarity > aesthetics. Every feature should help users make better decisions in champion select.
