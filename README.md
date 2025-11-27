# Have We Meet

A League of Legends desktop application that analyzes your current lobby and shows your match history with players you've faced before.

## Features

- **Automatic Lobby Detection**: Detects when you're in champion select
- **Match History Analysis**: Shows detailed stats from previous games with lobby players
- **Comprehensive Stats**:
  - Win/Loss record against each player
  - Champion matchup history
  - Detailed performance metrics (KDA, damage, CS)
  - Game-by-game breakdown

## Prerequisites

- Node.js (v16 or higher)
- League of Legends client installed
- Riot Games Developer API Key

## Getting Your Riot API Key

1. Go to [https://developer.riotgames.com](https://developer.riotgames.com)
2. Sign in with your Riot account
3. Register a new application (Personal API Key is fine for testing)
4. Copy your API key

**Note**: Development API keys expire after 24 hours. You'll need to regenerate and update it daily.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Run the application:
```bash
npm start
```

## How to Use

### First Time Setup

1. **Configure Your Account**:
   - Enter your summoner name
   - Select your region
   - Paste your Riot API key
   - Click "Save Configuration"

2. **Import Match History**:
   - Click "Import Match History" to download your recent 20 games
   - This builds the database of players you've played against
   - You can run this multiple times to import more games

### Analyzing a Lobby

1. Start League of Legends and enter champion select
2. In the Have We Meet app, click "Analyze Current Lobby"
3. The app will show detailed stats for any players you've faced before:
   - Overall win rate against them
   - Champion matchups (which champs you both played)
   - Recent game details with full stats

## Project Structure

```
HaveWeMeet/
├── src/
│   ├── main.js              # Electron main process
│   ├── preload.js           # Secure IPC bridge
│   ├── database/
│   │   └── db.js            # SQLite database manager
│   ├── api/
│   │   ├── riotApi.js       # Riot Games API integration
│   │   └── lcuConnector.js  # League Client API connector
│   └── ui/
│       ├── index.html       # Main UI
│       ├── styles.css       # Styling
│       └── renderer.js      # UI logic
├── database/
│   ├── schema.sql           # Database schema
│   └── havewemeet.db        # SQLite database (created on first run)
└── package.json
```

## How It Works

1. **Match History Import**: Uses the Riot Games API to fetch your recent matches and stores all participants and their stats in a local SQLite database

2. **Lobby Detection**: Connects to the League Client Update (LCU) API to detect when you're in champion select and identifies all players in your lobby

3. **Historical Analysis**: Queries the local database to find all previous games where you played against any of the lobby players

4. **Stats Display**: Shows comprehensive statistics including win rates, champion matchups, and detailed game-by-game performance

## API Rate Limits

The Riot API has rate limits:
- Development keys: 20 requests per second, 100 requests per 2 minutes
- The app includes built-in delays to respect these limits

## Troubleshooting

### "League Client is not running"
- Make sure League of Legends is open and you're logged in
- The app can only detect lobbies when you're in champion select

### "Failed to fetch summoner"
- Verify your summoner name is spelled correctly
- Ensure your API key is valid and not expired
- Check that you selected the correct region

### No matches found
- Make sure you've imported your match history first
- You can only see stats for players you've played against in imported games

## Privacy

All data is stored locally on your computer in a SQLite database. No information is sent to any external servers except the official Riot Games API for fetching match data.

## License

MIT
