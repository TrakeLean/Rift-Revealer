const https = require('https');
const fs = require('fs');
const path = require('path');
const { parseRiotId } = require('../database/db');

class LCUConnector {
  constructor() {
    this.credentials = null;
    this.httpsAgent = new https.Agent({
      rejectUnauthorized: false
    });
    this.nameCache = {
      puuid: new Map(),
      summonerId: new Map(),
      cellId: new Map()
    };
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
    // Fetch gameflow session once to derive selectedSkinIndex mapping
    const gameflowSession = await this.getGameflowSession().catch(() => null);
    const selectionMap = new Map();
    const isNumber = (val) => typeof val === 'number' && !Number.isNaN(val);
    const nameCache = this.nameCache || { puuid: new Map(), summonerId: new Map(), cellId: new Map() };

    const nameFromCache = (player, summoner) => {
      if (summoner?.puuid && nameCache.puuid.has(summoner.puuid)) return nameCache.puuid.get(summoner.puuid);
      if (player?.puuid && nameCache.puuid.has(player.puuid)) return nameCache.puuid.get(player.puuid);
      if (player?.summonerId && nameCache.summonerId.has(player.summonerId)) return nameCache.summonerId.get(player.summonerId);
      if (player?.cellId !== undefined && nameCache.cellId.has(player.cellId)) return nameCache.cellId.get(player.cellId);
      return null;
    };

    const rememberName = (name, player, summoner) => {
      if (!name) return;
      if (summoner?.puuid) nameCache.puuid.set(summoner.puuid, name);
      if (player?.puuid) nameCache.puuid.set(player.puuid, name);
      if (player?.summonerId) nameCache.summonerId.set(player.summonerId, name);
      if (player?.cellId !== undefined) nameCache.cellId.set(player.cellId, name);
    };

    const resolveName = (player, summoner) => {
      const candidates = [];
      if (summoner?.gameName && summoner?.tagLine) candidates.push(`${summoner.gameName}#${summoner.tagLine}`);
      if (player?.riotIdGameName && player?.riotIdTagline) candidates.push(`${player.riotIdGameName}#${player.riotIdTagline}`);
      if (player?.gameName && player?.tagLine) candidates.push(`${player.gameName}#${player.tagLine}`);
      if (player?.displayName) candidates.push(player.displayName);
      if (player?.summonerName) candidates.push(player.summonerName);
      if (player?.summonerInternalName) candidates.push(player.summonerInternalName);
      if (player?.obfuscatedSummonerName) candidates.push(player.obfuscatedSummonerName);
      if (player?.alias) candidates.push(player.alias);

      const cached = nameFromCache(player, summoner);
      if (cached) candidates.push(cached);

      if (player?.puuid) candidates.push(player.puuid);
      if (summoner?.puuid) candidates.push(summoner.puuid);

      const name = candidates.find(n => typeof n === 'string' && n.trim().length > 0) || 'Unknown';
      rememberName(name, player, summoner);
      return name;
    };

    const deriveSkinId = (player) => {
      // Prefer explicit skin id if provided by LCU
      if (isNumber(player.selectedSkinId)) return player.selectedSkinId;
      if (isNumber(player.skinId)) return player.skinId;

      // Fall back to selectedSkinIndex * 1000 scheme
      const mappedIndex = player.puuid ? selectionMap.get(player.puuid) : undefined;
      const selectedIndex = isNumber(player.selectedSkinIndex) ? player.selectedSkinIndex : mappedIndex;
      if (isNumber(selectedIndex) && isNumber(player.championId)) {
        return player.championId * 1000 + selectedIndex;
      }
      return null;
    };

    for (const sel of gameflowSession?.gameData?.playerChampionSelections || []) {
      if (sel.puuid !== undefined && sel.puuid !== null) {
        selectionMap.set(sel.puuid, sel.selectedSkinIndex);
      }
    }

    // Try champion select first
    const champSelect = await this.getChampSelect();

    if (champSelect && (champSelect.myTeam || champSelect.theirTeam)) {
      const players = [];
      const allTeams = [...(champSelect.myTeam || []), ...(champSelect.theirTeam || [])];
      const seenPlayers = new Set(); // Track unique players by summonerId or puuid

      console.log(`[LCU] Processing ${allTeams.length} players from champ select (myTeam: ${champSelect.myTeam?.length || 0}, theirTeam: ${champSelect.theirTeam?.length || 0})`);

      for (const player of allTeams) {
        // Create unique identifier for deduplication
        const playerId = player.summonerId || player.puuid || player.cellId;
        if (playerId && seenPlayers.has(playerId)) {
          console.log(`[LCU] Skipping duplicate player with ID: ${playerId}`);
          continue; // Skip duplicate
        }
        if (playerId) {
          seenPlayers.add(playerId);
          console.log(`[LCU] Adding player with ID: ${playerId}`);
        }

        // Enrich selection map with champ select indices (works for both teams)
        if (isNumber(player.selectedSkinIndex) && player.puuid) {
          selectionMap.set(player.puuid, player.selectedSkinIndex);
        }

        let summoner = null;
        if (player.summonerId) {
          try {
            summoner = await this.makeRequest(`/lol-summoner/v1/summoners/${player.summonerId}`);
          } catch (err) {
            // Best-effort; keep null
          }
        }

        const summonerName = resolveName(player, summoner);
        const { username, tagLine } = parseRiotId(summonerName);

        const skinId = deriveSkinId({
          ...player,
          puuid: player.puuid || summoner?.puuid || null
        });

        players.push({
          summonerId: player.summonerId,
          puuid: summoner ? summoner.puuid : player.puuid || null,
          username: username,
          tagLine: tagLine,
          championId: player.championId,
          cellId: player.cellId,
          teamId: player.teamId,
          profileIconId: summoner ? summoner.profileIconId || null : null,
          skinId,
          source: 'championSelect'
        });
      }

      console.log(`[LCU] Returning ${players.length} unique players from champ select`);
      return players;
    }

    // If not in champion select, try active game
    const gameSession = gameflowSession || await this.getGameflowSession();

    if (gameSession && gameSession.gameData && gameSession.gameData.teamOne) {
      const players = [];
      const seenPlayers = new Set(); // Track unique players by summonerId or puuid

      const allPlayers = [
        ...(gameSession.gameData.teamOne || []),
        ...(gameSession.gameData.teamTwo || [])
      ];

      for (const player of allPlayers) {
        // Create unique identifier for deduplication
        const playerId = player.summonerId || player.puuid;
        if (playerId && seenPlayers.has(playerId)) {
          continue; // Skip duplicate
        }
        if (playerId) {
          seenPlayers.add(playerId);
        }

        // Capture any selectedSkinIndex from live game snapshot
        if (isNumber(player.selectedSkinIndex) && player.puuid) {
          selectionMap.set(player.puuid, player.selectedSkinIndex);
        }

        // Fetch summoner name using summonerId since gameData doesn't include names
        const summoner = await this.makeRequest(`/lol-summoner/v1/summoners/${player.summonerId}`);

        const summonerName = resolveName(player, summoner);
        const { username, tagLine } = parseRiotId(summonerName);

        // Derive skinId from any available source (selectedSkinId, skinId, or selectedSkinIndex)
        const skinId = deriveSkinId({
          ...player,
          puuid: player.puuid || summoner?.puuid || null
        });

        players.push({
          summonerId: player.summonerId,
          puuid: summoner ? summoner.puuid : null,
          username: username,
          tagLine: tagLine,
          championId: player.championId,
          teamId: player.teamId,
          profileIconId: summoner ? summoner.profileIconId || null : null,
          skinId,
          source: 'inGame'
        });
      }

      return players;
    }

    throw new Error('Not in champion select or active game');
  }
}

module.exports = LCUConnector;
