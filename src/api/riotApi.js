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

  async getSummonerByName(summonerName, region) {
    try {
      // Check if it's a Riot ID (contains #)
      if (summonerName.includes('#')) {
        const [gameName, tagLine] = summonerName.split('#');
        const account = await this.getAccountByRiotId(gameName, tagLine, region);
        return {
          puuid: account.puuid,
          gameName: account.gameName,
          tagLine: account.tagLine,
          summonerName: `${gameName}#${tagLine}`
        };
      }

      // Otherwise use old summoner name API
      const response = await axios.get(
        `https://${region}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`,
        {
          headers: { 'X-Riot-Token': this.apiKey }
        }
      );
      return response.data;
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
    try {
      const matchIds = await this.getMatchIdsByPuuid(puuid, region, count);
      let imported = 0;

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

          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
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
