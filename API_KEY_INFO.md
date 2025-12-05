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

**Last Updated:** 2025-12-04 20:35
