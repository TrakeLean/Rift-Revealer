# Rift Revealer - Production API Key Application

## Project Overview

**Rift Revealer** is a desktop application that helps League of Legends players gain competitive intelligence by automatically analyzing their lobby opponents and teammates. The product is designed to help players make better strategic decisions in champion select by revealing detailed match history and performance patterns with previously encountered players.

## How It Works

The application monitors the League of Legends client in real-time using the LCU (League Client Update) API and automatically detects when players enter champion select or loading screen. When familiar players are detected, it displays comprehensive statistics including:

- **Historical Performance**: Win/loss records from all previous games together, split by role (as teammates vs. opponents)
- **Mode-Specific Stats**: Performance metrics broken down by queue type (Ranked Solo/Duo, Flex, Normal Draft/Blind, ARAM, Arena)
- **Champion Pool Analysis**: Which champions opponents frequently play and their success rates
- **Recent Form**: Performance trends and win streaks to identify players on hot/cold streaks
- **Player Notes**: Tagging system to mark toxic, friendly, skilled, or weak players for future reference
- **Rank Display** *(requires production key)*: Current ranked status (tier, division, LP) for each player

## Privacy & Data Storage

All match data is stored **locally** in a SQLite database on the user's computer for instant access and complete privacy. The application only communicates with:
1. **Riot Games API** - To fetch match history and summoner data
2. **Local League Client (LCU)** - To detect active lobbies and player information

**No external servers are used.** User data never leaves their machine except to make authorized requests to official Riot APIs.

## API Usage & Rate Limiting

The application is designed with responsible API usage in mind:

- **Intelligent Caching**: Match data and player information are cached locally with appropriate TTLs (rank data: 1 hour, match history: permanent unless manually refreshed)
- **Batch Import**: Users manually trigger "Import Last 100 Matches" rather than continuous background fetching
- **Rate Limit Compliance**: Built-in rate limiting respects both 20 req/sec and 100 req/2min limits
- **Minimal Redundancy**: Each match is imported once and stored permanently; player lookups are cached to minimize duplicate API calls

### Estimated API Usage Per User
- **Initial setup**: ~100-120 requests (fetch 100 matches + summoner lookups)
- **Daily usage**: ~10-30 requests (lobby analysis when familiar players detected, rank updates)
- **Peak usage**: ~5-10 requests per game during active play sessions

## Target Audience & Distribution

- **Current Status**: Early alpha testing with development API keys
- **Target Users**: Competitive League of Legends players who want deeper insights into their opponents
- **Distribution**: Free, open-source desktop application available on GitHub
- **Platform**: Windows 10/11 (Electron-based, potential for macOS/Linux in future)
- **Repository**: https://github.com/TrakeLean/Rift-Revealer

## Why Production API Key is Needed

Development API keys have limitations that prevent full feature deployment:

1. **24-hour expiration**: Requires users to regenerate keys daily, creating poor UX
2. **Missing endpoints**: `/lol/league/v4/entries/by-summoner/{summonerId}` (rank data) returns 403 Forbidden with development keys
3. **Production deployment**: Cannot distribute to users without stable API access

With a production API key, Rift Revealer can:
- Provide seamless, uninterrupted service to users
- Display current ranked information alongside match history
- Scale to support more active users without manual key regeneration

## Technical Implementation

- **Tech Stack**: Electron 28, React 19, TypeScript 5, SQLite (better-sqlite3)
- **API Client**: Custom Riot API wrapper with rate limiting and error handling
- **Data Dragon Integration**: Uses CDN for static assets (champion images, profile icons) to minimize API load
- **Code Quality**: Open source, well-documented, follows Riot's API best practices

## Commitment to Terms of Service

Rift Revealer strictly adheres to Riot's API Terms of Service:
- ✅ No monetization or premium features
- ✅ Proper rate limiting implementation
- ✅ User data stored locally, not harvested or shared
- ✅ Riot Games branding used appropriately with disclaimers
- ✅ No automation or unfair gameplay advantages (information only)
- ✅ Open source code available for review

## Contact Information

- **Developer**: TrakeLean
- **GitHub**: https://github.com/TrakeLean/Rift-Revealer
- **Project License**: MIT
- **Current Version**: v1.7.1

---

Thank you for considering this application. Rift Revealer aims to enhance the League of Legends experience by providing players with meaningful insights into their match history, helping them make informed decisions while maintaining the integrity and spirit of fair play.
