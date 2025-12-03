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
        }
      }

      return imported;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = RiotAPI;
