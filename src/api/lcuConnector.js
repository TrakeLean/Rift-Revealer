const https = require('https');
const fs = require('fs');
const path = require('path');

class LCUConnector {
  constructor() {
    this.credentials = null;
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });
  }

  findLeagueClientCredentials() {
    try {
      // Try multiple possible lockfile locations
      const possiblePaths = [];

      if (process.platform === 'win32') {
        possiblePaths.push(
          // Common installation directories
          'C:\\Riot Games\\League of Legends\\lockfile',
          'D:\\Riot Games\\League of Legends\\lockfile',
          path.join(process.env.LOCALAPPDATA || '', 'Riot Games', 'League of Legends', 'lockfile'),
          path.join(process.env.LOCALAPPDATA || '', 'Riot Games', 'Riot Client', 'Config', 'lockfile'),
          path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'Riot Games', 'League of Legends', 'lockfile')
        );
      } else if (process.platform === 'darwin') {
        possiblePaths.push(
          path.join(process.env.HOME || '', 'Library', 'Application Support', 'Riot Games', 'League of Legends', 'lockfile'),
          '/Applications/League of Legends.app/Contents/LoL/lockfile'
        );
      } else {
        // Linux
        possiblePaths.push(
          path.join(process.env.HOME || '', '.local', 'share', 'Riot Games', 'League of Legends', 'lockfile'),
          path.join(process.env.HOME || '', 'Games', 'league-of-legends', 'drive_c', 'Riot Games', 'League of Legends', 'lockfile')
        );
      }

      for (const lockfilePath of possiblePaths) {
        if (fs.existsSync(lockfilePath)) {
          const lockfileContent = fs.readFileSync(lockfilePath, 'utf8');
          // Lockfile format: processName:processId:port:password:protocol
          const parts = lockfileContent.split(':');

          if (parts.length >= 4) {
            // Check if it's the League Client (not Riot Client)
            const processName = parts[0];
            if (processName.includes('LeagueClient') || processName.includes('Riot Client')) {
              return {
                port: parts[2],
                token: parts[3],
                processName: processName
              };
            }
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async connect() {
    this.credentials = this.findLeagueClientCredentials();
    if (!this.credentials) {
      throw new Error('League Client is not running or credentials not found');
    }
    return true;
  }

  async makeRequest(endpoint) {
    if (!this.credentials) {
      throw new Error('Not connected to League Client. Call connect() first.');
    }

    return new Promise((resolve, reject) => {
      const auth = Buffer.from(`riot:${this.credentials.token}`).toString('base64');

      const options = {
        hostname: '127.0.0.1',
        port: this.credentials.port,
        path: endpoint,
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`
        },
        agent: this.httpsAgent
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(new Error('Failed to parse response'));
            }
          } else if (res.statusCode === 404) {
            resolve(null);
          } else {
            reject(new Error(`Request failed with status ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  async getCurrentSummoner() {
    return this.makeRequest('/lol-summoner/v1/current-summoner');
  }

  async getChampSelect() {
    return this.makeRequest('/lol-champ-select/v1/session');
  }

  async getGameflowSession() {
    return this.makeRequest('/lol-gameflow/v1/session');
  }

  async getActiveGame() {
    return this.makeRequest('/lol-gameflow/v1/session');
  }

  async getLobbyPlayers() {
    // Try champion select first
    const champSelect = await this.getChampSelect();

    if (champSelect && champSelect.myTeam) {
      const players = [];

      for (const team of champSelect.myTeam || []) {
        if (team.summonerId) {
          const summoner = await this.makeRequest(`/lol-summoner/v1/summoners/${team.summonerId}`);
          if (summoner) {
            // Use gameName#tagLine format for Riot ID (post-2023 system)
            let summonerName = 'Unknown';
            if (summoner.gameName && summoner.tagLine) {
              summonerName = `${summoner.gameName}#${summoner.tagLine}`;
            } else if (summoner.displayName) {
              summonerName = summoner.displayName;
            }

        players.push({
          summonerId: team.summonerId,
          puuid: summoner.puuid,
          summonerName: summonerName,
          championId: team.championId,
          cellId: team.cellId,
          profileIconId: summoner.profileIconId || null,
          skinId: team.selectedSkinId || team.skinId || null,
          source: 'championSelect'
        });
      }
    }
      }

      return players;
    }

    // If not in champion select, try active game
    const gameSession = await this.getGameflowSession();

    if (gameSession && gameSession.gameData && gameSession.gameData.teamOne) {
      const players = [];
      const allPlayers = [
        ...(gameSession.gameData.teamOne || []),
        ...(gameSession.gameData.teamTwo || [])
      ];

      for (const player of allPlayers) {
        // Fetch summoner name using summonerId since gameData doesn't include names
        const summoner = await this.makeRequest(`/lol-summoner/v1/summoners/${player.summonerId}`);

        // Use gameName#tagLine format for Riot ID (post-2023 system)
        let summonerName = 'Unknown';
        if (summoner) {
          if (summoner.gameName && summoner.tagLine) {
            summonerName = `${summoner.gameName}#${summoner.tagLine}`;
          } else if (summoner.displayName) {
            summonerName = summoner.displayName;
          }
        }

        players.push({
          summonerId: player.summonerId,
          puuid: summoner ? summoner.puuid : null,
          summonerName: summonerName,
          championId: player.championId,
          teamId: player.teamId,
          profileIconId: summoner ? summoner.profileIconId || null : null,
          skinId: player.skinId || null,
          source: 'inGame'
        });
      }

      return players;
    }

    throw new Error('Not in champion select or active game');
  }
}

module.exports = LCUConnector;
