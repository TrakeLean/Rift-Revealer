# Rift Revealer

<div align="center">

<img src="./logo.png" alt="Rift Revealer Logo" width="300">

**Never forget a face in the Rift**

A League of Legends desktop application that automatically detects lobby players and reveals your match history with them.

[![Latest Release](https://img.shields.io/github/v/release/TrakeLean/Rift-Revealer?style=for-the-badge)](https://github.com/TrakeLean/Rift-Revealer/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/TrakeLean/Rift-Revealer/total?style=for-the-badge)](https://github.com/TrakeLean/Rift-Revealer/releases)
[![License](https://img.shields.io/github/license/TrakeLean/Rift-Revealer?style=for-the-badge)](LICENSE)

[Download Latest Release](https://github.com/TrakeLean/Rift-Revealer/releases/latest) • [Report Bug](https://github.com/TrakeLean/Rift-Revealer/issues) • [Request Feature](https://github.com/TrakeLean/Rift-Revealer/issues)

</div>

---

## 📥 Download

**[⬇️ Download Latest Version](https://github.com/TrakeLean/Rift-Revealer/releases/latest)**

Choose your preferred version:
- **Installer** (`Rift Revealer Setup.exe`) - Recommended for most users
- **Portable** (`Rift Revealer.exe`) - No installation required

---

## ✨ Features

### 🎯 Automatic Lobby Detection
- Monitors League client in real-time
- Instant analysis when players are detected
- Works in Champion Select and In-Game
- **Runs in background** - Minimizes to system tray, keeps tracking 24/7

### 📊 Comprehensive Match History
- Detailed stats from all previous games together
- Win/Loss records split by game mode (Ranked, Normal, ARAM, Arena)
- Champion matchup history
- Performance metrics (KDA, damage, CS)
- Threat level indicators
- **Champion skin splash arts** displayed as player card backgrounds (from Riot's Data Dragon CDN)

### 🏷️ Player Tagging System
- Tag players as **Toxic** (red), **Friendly** (green), **Notable** (yellow), or **Duo** (blue)
- Add optional notes to remember specific details
- Tags persist across all future games
- Visual indicators on player cards

### 📈 Mode-Specific Statistics
- Separate stats for Ranked, Normal, ARAM, Arena, and Other modes
- See your performance against each player per queue type
- Identify which modes you struggle or excel in against specific opponents
- **Compact inline badges** for quick scanning

### 🎨 Modern Compact UI
- Sleek esports-style dark interface
- **40% more compact** player cards with larger, bolder text
- Color-coded threat indicators
- Quick visual scanning for important info
- Responsive design that adapts to your screen
- Last-match roster view mirrors live cards with full encounter stats, mode badges, skins, and expandable recent games

### 🔄 Auto-Update System
- Automatic update notifications
- One-click download of new versions
- Never miss new features or bug fixes

### 🚀 Auto-Start on Windows
- Optional auto-start with Windows
- Always ready when you launch League
- Runs silently in the background

---

## 🚀 Quick Start

### Prerequisites
- **Windows 10/11** (64-bit)
- **League of Legends** installed
- **Riot Games Developer API Key** ([Get one here](https://developer.riotgames.com))

### Installation

1. **Download** the latest release from [here](https://github.com/TrakeLean/Rift-Revealer/releases/latest)
2. **Run** the installer or portable exe
3. **Launch** Rift Revealer

### First-Time Setup

1. **Configure Your Account**:
   - Enter your **Riot ID Username** (e.g., "YourName")
   - Enter your **Riot ID Tag** (e.g., "NA1")
   - Select your region (NA, EUW, EUNE, KR, etc.)
   - Paste your Riot API key
   - Click "Save Configuration"

2. **Import Match History**:
   - Click "Import Last 100 Matches"
   - Wait for the import to complete (downloads your last 100 games)
   - Progress is shown with cancel option

3. **Start Playing**:
   - The app automatically monitors your League client
   - Enter a lobby or game
   - See instant analysis of detected players!
   - When idle (not in champ select/in-game), see your last match roster with skins, tags, and expandable stats

---

## 📖 How to Use

### Analyzing Players

Once configured, Rift Revealer runs automatically in the background:

1. **Join a lobby** in League of Legends
2. **View detected players** in the Rift Revealer window
3. **Click on a player** to see detailed stats:
   - Overall win/loss record
   - Stats split by game mode
   - Champion matchups
   - Recent games timeline
   - Recent form (last 5 games)

### Running in Background

Rift Revealer can run silently in the system tray:

1. **Close the window** - App minimizes to system tray (doesn't quit)
2. **Continues tracking** games even when hidden
3. **Double-click tray icon** to restore the window
4. **Right-click tray icon** for options:
   - "Show Rift Revealer" - Opens the window
   - "Quit" - Fully closes the app

### Tagging Players

Mark players for future reference:

1. Click the **tag icon** (🏷️) on any player card
2. Select tag type(s):
   - **Toxic** - Difficult or toxic players
   - **Friendly** - Positive teammates
   - **Notable** - Skilled or noteworthy players
   - **Duo** - Duo queue partners
3. Add optional notes (e.g., "One-trick Yasuo", "Always feeds")
4. Click **Save Tags**

Tags will appear on player cards in all future games!

---

## 🔧 Development

### Tech Stack

- **Electron 28** - Desktop framework
- **React 19** + **TypeScript 5** - UI
- **Vite 7** - Build tool
- **Tailwind CSS 4** - Styling
- **shadcn/ui** - Component library
- **better-sqlite3** - Local database
- **Riot Games API** - Match data
- **LCU API** - League client integration

### Building from Source

```bash
# Clone the repository
git clone https://github.com/TrakeLean/Rift-Revealer.git
cd Rift-Revealer

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Package as executable
npm run package
```

### Project Structure

```
Rift-Revealer/
├── src/
│   ├── main.js                    # Electron main process
│   ├── preload.js                 # IPC bridge
│   ├── database/
│   │   └── db.js                  # SQLite operations
│   ├── api/
│   │   ├── riotApi.js             # Riot API client
│   │   └── lcuConnector.js        # LCU connector
│   └── renderer/                  # React frontend
│       ├── App.tsx                # Root component
│       ├── components/            # UI components
│       ├── pages/                 # Page components
│       └── types/                 # TypeScript types
├── database/
│   └── schema.sql                 # Database schema
└── .github/
    └── workflows/
        └── build.yml              # Auto-build workflow
```

---

## 🔒 Privacy & Security

- **All data is stored locally** on your computer in a SQLite database
- **No external servers** - Only communicates with official Riot Games API
- **Your API key** is stored locally and never transmitted anywhere except Riot's servers
- **Open source** - Audit the code yourself!

---

## 📝 API Key Information

### Getting Your API Key

1. Visit [https://developer.riotgames.com](https://developer.riotgames.com)
2. Sign in with your Riot account
3. Click "REGISTER PRODUCT" or use your existing key
4. Copy the "Development API Key"

### Important Notes

- **Development keys expire after 24 hours** - You'll need to regenerate daily
- **Production keys** are available after submitting an application
- **Rate limits**: 20 requests/second, 100 requests/2 minutes (development)
- The app respects these limits automatically

---

## 🐛 Troubleshooting

### League Client Not Detected
- Ensure League of Legends is **running and logged in**
- The app can only detect lobbies in **Champion Select** or **In-Game**
- Try restarting both the League client and Rift Revealer

### API Errors
- **"Invalid API key"**: Your key may have expired (development keys last 24 hours)
- **"Rate limit exceeded"**: Wait a few minutes before importing more matches
- **"Summoner not found"**: Check spelling and region selection

### No Players Detected
- You must **import match history first** to build the database
- You can only see stats for players you've **previously played with/against**
- Import more matches if you want a larger database

### Database Issues
- Database is stored in: `C:\Users\{YourName}\AppData\Roaming\rift-revealer\database\`
- If corrupted, delete the database folder and re-import your match history

### After Updating to v1.6.0
- **Database incompatibility**: v1.6.0 uses a new database schema
- **Action required**: Delete `C:\Users\{YourName}\AppData\Roaming\rift-revealer\database\` folder
- Re-import your match history after updating
- Settings page now requires separate username and tag inputs (e.g., "YourName" + "NA1" instead of "YourName#NA1")

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Riot Games** for the API, Data Dragon CDN, and League of Legends
- **shadcn/ui** for the beautiful component library
- **Electron** for making desktop apps with web technologies possible

---

## ⚠️ Disclaimer

Rift Revealer is not endorsed by Riot Games and does not reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games and all associated properties are trademarks or registered trademarks of Riot Games, Inc.

---

<div align="center">

**Made with ❤️ by [TrakeLean](https://github.com/TrakeLean)**

⭐ Star this repo if you find it useful!

</div>
