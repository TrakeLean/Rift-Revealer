# Riot API Key Information
## API Key Endpoints Used

This app requires access to the following Riot API endpoints:

### ACCOUNT-V1 (Riot Account API)
- `GET /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}`
- Used for: Getting player PUUID from Riot ID

### SUMMONER-V4 (Summoner API)
- `GET /lol/summoner/v4/summoners/by-puuid/{puuid}`
- Used for: Getting summoner details and summonerId

### LEAGUE-V4 (League API) **← Required for Rank Display**
- `GET /lol/league/v4/entries/by-summoner/{summonerId}`
- Used for: Getting player rank information (tier, division, LP, wins, losses)

### MATCH-V5 (Match API)
- `GET /lol/match/v5/matches/by-puuid/{puuid}/ids`
- `GET /lol/match/v5/matches/{matchId}`
- Used for: Match history import

---

## Troubleshooting API Errors

### "Unknown apikey"
- API key not set or expired
- Solution: Update API key in Settings

### "Forbidden" (403)
- API key lacks permissions for specific endpoint
- Solution: Regenerate API key at https://developer.riotgames.com/
- Ensure all endpoints are enabled

### "Rate limit exceeded" (429)
- Too many requests in short time
- App automatically handles rate limiting with delays
- Wait a few minutes before retrying

### "Not Found" (404)
- Player/match doesn't exist
- Summoner name spelled incorrectly
- Region mismatch

---

## Getting a New API Key

### Development API Key (Free, 24-hour expiration)

1. Visit https://developer.riotgames.com/
2. Sign in with your Riot account
3. Click "REGENERATE API KEY" or "REGISTER PRODUCT"
4. Copy the generated key
5. Key format: `RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

**Rate Limits (Development):**
- 20 requests per second
- 100 requests per 2 minutes

### Production API Key (Requires Application)

1. Go to https://developer.riotgames.com/
2. Click "Apps" → "Register Product"
3. Fill out application form:
   - App name
   - Description
   - Use case
   - Expected API usage
4. Wait for approval (can take several days)
5. Production keys don't expire but have rate limits

**Rate Limits (Production):**
- Varies based on approval tier
- Typically higher than development

---

## API Key Storage

**Location:** SQLite database
- Path: `C:\Users\{Username}\AppData\Roaming\rift-revealer\database\rift-revealer.db`
- Table: `user_config`
- Column: `riot_api_key`

**Security:**
- Stored locally only (not transmitted except to Riot API)
- No encryption (local app, trusted environment)
- Not committed to git (database in .gitignore)

---

## Development Notes

### API Key in Code
The API key is loaded and used in:
- `src/main.js` - Loads from database, passes to RiotAPI instance
- `src/api/riotApi.js` - Uses key in HTTP request headers

### Caching Strategy
To minimize API calls and avoid rate limits:
- **Player rank data:** 1-hour TTL cache in `player_ranks` table
- **Match data:** Permanent storage (doesn't change)
- **Summoner data:** Stored in `players` table

---

## PUUID Encryption (Important!)

### The Problem
Riot API encrypts PUUIDs differently per API key, but the LCU (League Client Update) API returns unencrypted PUUIDs. This creates a mismatch:

- **LCU API** (localhost): Returns **unencrypted** UUIDs
  - Format: `ab47b7c8-892b-5f7b-a154-54fc018bbf38` (standard UUID)
  - Always the same for a given player

- **Riot Match API**: Returns **encrypted** PUUIDs
  - Format: `O62OV7TIAInDkjD72coj0ov0KvRoNAg1UTnLojZBvNLZfGvhzstokAjFrWxBhrxSLFv-cuZgciLFEg` (Base64-like)
  - **Unique per API key** - same player has different encrypted PUUID for each developer

### Impact on This App

**Database stores encrypted PUUIDs** from match imports (Match API)
**Lobby detection uses unencrypted PUUIDs** from LCU

This means:
- ✅ **Name-based fallback is essential** - `getPlayerHistory()` tries PUUID first, falls back to username#tagLine
- ⚠️ **Switching API keys breaks PUUID lookups** - When you switch from dev key to production key:
  - All encrypted PUUIDs in database become invalid
  - Must clear database and re-import match history
  - OR rely on name-based matching (works but slower)

### Development Key → Production Key Migration

When you get a production API key, you have two options:

**Option 1: Clear & Re-import (Recommended)**
1. Delete database: `C:\Users\{Username}\AppData\Roaming\rift-revealer\database\`
2. Update API key in app Settings
3. Re-import match history with new key
4. All PUUIDs will be encrypted with production key

**Option 2: Keep Dev Database (Fallback to Names)**
1. Update API key in app Settings
2. Keep existing database
3. App will fallback to username#tagLine matching
4. Slower lookups, but no data loss

### Why This Matters

- **Deduplication:** App uses database PUUID (`matchedPuuid`) for deduplication, not LCU PUUID
- **Name Changes:** If player changes name, PUUID matching still works (if using same API key)
- **Cross-Developer:** Same player appears as different PUUID to different developers

### References
- [Riot PUUID Documentation](https://www.riotgames.com/en/DevRel/player-universally-unique-identifiers-and-a-new-security-layer)
- [LCU API Docs](https://riot-api-libraries.readthedocs.io/en/latest/lcu.html)

---

**Last Updated:** 2025-12-30
