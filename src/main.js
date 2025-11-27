const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Database = require('./database/db');
const RiotAPI = require('./api/riotApi');
const LCUConnector = require('./api/lcuConnector');

let mainWindow;
let db;
let riotApi;
let lcuConnector;
let autoMonitorInterval = null;
let lastLobbyHash = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: path.join(__dirname, '../logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Debug: Log environment variable
  console.log('VITE_DEV_SERVER_URL:', process.env.VITE_DEV_SERVER_URL);

  // In development, load from Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('Loading from Vite dev server:', process.env.VITE_DEV_SERVER_URL);
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    console.log('Loading from production build');
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../dist-renderer/index.html'));
  }
}

app.whenReady().then(() => {
  db = new Database();
  db.initialize();

  riotApi = new RiotAPI(db);
  lcuConnector = new LCUConnector();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Clean up auto-monitor interval
  if (autoMonitorInterval) {
    clearInterval(autoMonitorInterval);
    autoMonitorInterval = null;
    lastLobbyHash = null;
  }
});

// IPC Handlers
ipcMain.handle('get-user-config', async () => {
  return db.getUserConfig();
});

ipcMain.handle('save-user-config', async (event, config) => {
  return db.saveUserConfig(config);
});

ipcMain.handle('validate-and-save-config', async (event, summonerName, region, apiKey) => {
  try {
    riotApi.setApiKey(apiKey);
    const summoner = await riotApi.getSummonerByName(summonerName, region);

    const config = {
      puuid: summoner.puuid,
      summoner_name: summonerName,
      region: region,
      riot_api_key: apiKey
    };

    db.saveUserConfig(config);
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('import-match-history', async (event, count = 20) => {
  try {
    const config = db.getUserConfig();
    if (!config || !config.riot_api_key) {
      throw new Error('Please configure your Riot API key first');
    }

    riotApi.setApiKey(config.riot_api_key);
    const result = await riotApi.importMatchHistory(config.puuid, config.region, count);
    return { success: true, imported: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('connect-lcu', async () => {
  try {
    await lcuConnector.connect();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-lobby-players', async () => {
  try {
    const players = await lcuConnector.getLobbyPlayers();
    return { success: true, players };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-player-history', async (event, summonerName) => {
  try {
    const history = db.getPlayerHistory(summonerName);
    return { success: true, history };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('analyze-lobby', async () => {
  try {
    // Check if user config exists
    const config = db.getUserConfig();
    if (!config || !config.summoner_name) {
      return {
        success: false,
        error: 'No summoner configured. Please configure your settings first.'
      };
    }

    await lcuConnector.connect();
    const lobbyPlayers = await lcuConnector.getLobbyPlayers();

    const analysis = [];
    for (const player of lobbyPlayers) {
      if (player.summonerName !== config.summoner_name) {
        const history = db.getPlayerHistory(player.summonerName);
        if (history.games.length > 0) {
          analysis.push({
            player: player.summonerName,
            source: player.source,
            ...history
          });
        }
      }
    }

    return { success: true, data: { analysis } };
  } catch (error) {
    // Provide more user-friendly error messages
    let userMessage = error.message;

    if (error.message.includes('League Client is not running')) {
      userMessage = 'League of Legends client is not running. Please launch the game first.';
    } else if (error.message.includes('Not in champion select or active game')) {
      userMessage = 'You are not in a lobby or game. Please join a lobby to analyze players.';
    } else if (error.message.includes('credentials not found')) {
      userMessage = 'Could not connect to League Client. Make sure the game is fully loaded.';
    }

    return { success: false, error: userMessage };
  }
});

ipcMain.handle('start-auto-monitor', async () => {
  if (autoMonitorInterval) {
    return { success: true, message: 'Already monitoring' };
  }

  // Check if user config exists
  const config = db.getUserConfig();
  if (!config || !config.summoner_name) {
    return {
      success: false,
      error: 'No summoner configured. Please configure your settings first.'
    };
  }

  // Test initial connection before starting auto-monitor
  try {
    await lcuConnector.connect();
  } catch (error) {
    let userMessage = 'League of Legends client is not running. Please launch the game first.';

    if (error.message.includes('credentials not found')) {
      userMessage = 'Could not connect to League Client. Make sure the game is fully loaded.';
    }

    return { success: false, error: userMessage };
  }

  autoMonitorInterval = setInterval(async () => {
    try {
      // Only connect if not already connected
      if (!lcuConnector.credentials) {
        await lcuConnector.connect();
      }
      const lobbyPlayers = await lcuConnector.getLobbyPlayers();

      // Create a hash of the lobby to detect changes
      const lobbyHash = lobbyPlayers.map(p => p.summonerName).sort().join(',');

      if (lobbyHash !== lastLobbyHash && lobbyPlayers.length > 0) {
        lastLobbyHash = lobbyHash;

        const config = db.getUserConfig();
        const analysis = [];

        for (const player of lobbyPlayers) {
          if (player.summonerName !== config.summoner_name) {
            const history = db.getPlayerHistory(player.summonerName);
            if (history.games.length > 0) {
              analysis.push({
                player: player.summonerName,
                source: player.source,
                ...history
              });
            }
          }
        }

        // Send update to renderer
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('lobby-update', { success: true, analysis });
        }
      }
    } catch (error) {
      // Reset credentials on connection error so we retry connecting next time
      lcuConnector.credentials = null;
      // Silently ignore errors during auto-monitoring (e.g., when client is closed)
    }
  }, 3000); // Check every 3 seconds

  return { success: true, message: 'Auto-monitoring started' };
});

ipcMain.handle('stop-auto-monitor', async () => {
  if (autoMonitorInterval) {
    clearInterval(autoMonitorInterval);
    autoMonitorInterval = null;
    lastLobbyHash = null;
  }
  return { success: true, message: 'Auto-monitoring stopped' };
});
