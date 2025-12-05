const axios = require('axios');

class RiotAPI {
  constructor(db) {
    this.db = db;
    this.apiKey = null;
    this.regionRoutes = {
      'na1': 'americas',
      'br1': 'americas',
      'la1': 'americas',
      'la2': 'americas',
      'euw1': 'europe',
      'eun1': 'europe',
      'tr1': 'europe',
      'ru': 'europe',
      'kr': 'asia',
      'jp1': 'asia',
      'oc1': 'sea',
      'ph2': 'sea',
      'sg2': 'sea',
      'th2': 'sea',
      'tw2': 'sea',
      'vn2': 'sea'
    };
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }

  getRegionalRoute(region) {
    return this.regionRoutes[region.toLowerCase()] || 'americas';
  }

  async getAccountByRiotId(gameName, tagLine, region) {
    try {
      const regionalRoute = this.getRegionalRoute(region);
      const response = await axios.get(
        `https://${regionalRoute}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
        {
          headers: { 'X-Riot-Token': this.apiKey }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch account: ${error.response?.data?.status?.message || error.message}`);
    }
  }

  async getSummonerByRiotId(username, tagLine, region) {
    try {
      const account = await this.getAccountByRiotId(username, tagLine, region);
      return {
        puuid: account.puuid,
        username: account.gameName,
        tagLine: account.tagLine
      };
    } catch (error) {
      throw new Error(`Failed to fetch summoner: ${error.response?.data?.status?.message || error.message}`);
    }
  }

  async getSummonerByPuuid(puuid, region) {
    try {
      const response = await axios.get(
        `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
        {
          headers: { 'X-Riot-Token': this.apiKey }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch summoner by PUUID: ${error.response?.data?.status?.message || error.message}`);
    }
  }

  async getRankedStats(summonerId, region) {
    try {
      const response = await axios.get(
        `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
        {
          headers: { 'X-Riot-Token': this.apiKey }
        }
      );
      // Returns array of ranked entries (RANKED_SOLO_5x5, RANKED_FLEX_SR, etc.)
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch ranked stats: ${error.response?.data?.status?.message || error.message}`);
    }
  }

  async getLatestDDragonVersion() {
    // Try to fetch from API with retries
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json', {
          timeout: 5000
        });
        // Returns array like ["15.24.1", "15.23.1", ...] - first is latest
        return response.data[0];
      } catch (error) {
        console.error(`[DDragon] Fetch attempt ${attempt}/3 failed:`, error.message);
        if (attempt === 3) {
          // All retries failed - check database as fallback
          const cachedVersion = this.db.getDDragonVersion();
          if (cachedVersion) {
            console.log(`[DDragon] Using cached version from database: ${cachedVersion}`);
            return cachedVersion;
          }
          // Last resort fallback
          console.warn('[DDragon] No cached version, using fallback: 14.23.1');
          return '14.23.1';
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  async getMatchIdsByPuuid(puuid, region, count = 20) {
    try {
      const regionalRoute = this.getRegionalRoute(region);
      const response = await axios.get(
        `https://${regionalRoute}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids`,
        {
          headers: { 'X-Riot-Token': this.apiKey },
          params: { count }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch match IDs: ${error.response?.data?.status?.message || error.message}`);
    }
  }

  async getMatchDetails(matchId, region) {
    try {
      const regionalRoute = this.getRegionalRoute(region);
      const response = await axios.get(
        `https://${regionalRoute}.api.riotgames.com/lol/match/v5/matches/${matchId}`,
        {
          headers: { 'X-Riot-Token': this.apiKey }
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch match details: ${error.response?.data?.status?.message || error.message}`);
    }
  }

  async importMatchHistory(puuid, region, count = 20, progressCallback = null, isCancelled = () => false) {
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const getDelayMs = (idx) => {
      // Keep well below 20 req/sec and under 100 req/2min average.
      // Use a shorter delay for the first 50, then slow down.
      return idx < 50 ? 700 : 1500;
    };

    try {
      const matchIds = await this.getMatchIdsByPuuid(puuid, region, count);
      let imported = 0;
      let rateLimitBackoff = 1000; // starts at 1s, grows on repeated 429s

      for (let i = 0; i < matchIds.length; i++) {
        if (isCancelled()) {
          break;
        }
        const matchId = matchIds[i];
        try {
          const matchData = await this.getMatchDetails(matchId, region);
          this.db.saveMatch(matchData);
          imported++;

          // Send progress update
          if (progressCallback) {
            progressCallback({
              current: i + 1,
              total: matchIds.length,
              imported: imported
            });
          }

          // Rate limit to avoid hitting Riot thresholds
          await sleep(getDelayMs(i));
        } catch (error) {
          // Handle Riot 429 with Retry-After if available
          const retryAfter = Number(error?.response?.headers?.['retry-after'] || 0);
          const status = error?.response?.status;
          const isRateLimited = status === 429 || /rate limit/i.test(error?.message || '');
          if (isRateLimited) {
            const delay = retryAfter > 0
              ? Math.ceil(retryAfter * 1000)
              : Math.min(10000, rateLimitBackoff); // cap at 10s
            console.warn(`Rate limited on ${matchId}. Waiting ${delay}ms before retry...`);
            await sleep(delay);
            rateLimitBackoff = Math.min(10000, rateLimitBackoff + 500);
            i--; // retry same match
            continue;
          }

          console.error(`Failed to import match ${matchId}:`, error.message);

          // Send progress update even on failure (for already-existing matches)
          if (progressCallback) {
            progressCallback({
              current: i + 1,
              total: matchIds.length,
              imported: imported
            });
          }
        }
      }

      return imported;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = RiotAPI;
