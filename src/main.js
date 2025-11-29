const { app, BrowserWindow, ipcMain, dialog, shell, Tray, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const Database = require('./database/db');
const RiotAPI = require('./api/riotApi');
const LCUConnector = require('./api/lcuConnector');

let mainWindow;
let tray = null;
let db;
let riotApi;
let lcuConnector;
let autoMonitorInterval = null;

// Configure auto-updater
autoUpdater.autoDownload = false; // We'll download manually after user confirmation
autoUpdater.autoInstallOnAppQuit = true;

// Gameflow state machine variables
let currentGameflowState = null;
let lastAnalyzedPlayers = null;

// Queue types that anonymize player names until game starts
const ANONYMIZED_QUEUES = [420, 440]; // Ranked Solo/Duo, Ranked Flex

// Queue type mappings
const QUEUE_NAMES = {
  0: 'Custom',
  400: 'Normal Draft',
  420: 'Ranked Solo/Duo',
  430: 'Normal Blind',
  440: 'Ranked Flex',
  450: 'ARAM',
  700: 'Clash',
  720: 'ARAM Clash',
  830: 'Co-op vs AI (Intro)',
  840: 'Co-op vs AI (Beginner)',
  850: 'Co-op vs AI (Intermediate)',
  900: 'URF',
  1020: 'One for All',
  1300: 'Nexus Blitz',
  1400: 'Ultimate Spellbook',
  1700: 'Arena',
  1900: 'Pick URF'
};

// Helper to get queue name
function getQueueName(queueId) {
  return QUEUE_NAMES[queueId] || `Queue ${queueId}`;
}

function createTray() {
  // Get icon path
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.ico')
    : path.join(__dirname, '../icon.ico');

  tray = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Rift Revealer',
      click: () => {
        mainWindow?.show();
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Rift Revealer - Tracking lobbies');
  tray.setContextMenu(contextMenu);

  // Double click to show window
  tray.on('double-click', () => {
    mainWindow?.show();
  });
}

function createWindow() {
  // Get icon path - different locations for dev vs packaged
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.ico')
    : path.join(__dirname, '../icon.ico');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: iconPath,
    frame: false, // Remove default title bar
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();

      // Show notification on first minimize
      if (!mainWindow.hasShownTrayNotification) {
        tray.displayBalloon({
          title: 'Rift Revealer',
          content: 'App is still running in the background and tracking your games!',
          icon: iconPath
        });
        mainWindow.hasShownTrayNotification = true;
      }
    }
  });

  // Debug: Log environment variable
  console.log('VITE_DEV_SERVER_URL:', process.env.VITE_DEV_SERVER_URL);
  console.log('__dirname:', __dirname);
  console.log('app.isPackaged:', app.isPackaged);

  // In development, load from Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    console.log('Loading from Vite dev server:', process.env.VITE_DEV_SERVER_URL);
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    console.log('Loading from production build');
    // In production, load the built files
    // When packaged, __dirname is 'app.asar/src', so we go up one level
    const htmlPath = path.join(__dirname, '../dist-renderer/index.html');
    console.log('Loading HTML from:', htmlPath);
    mainWindow.loadFile(htmlPath)
      .then(() => {
        console.log('HTML file loaded successfully');
      })
      .catch(err => {
        console.error('Failed to load HTML file:', err);
        dialog.showErrorBox('Load Error', `Failed to load application: ${err.message}`);
      });
  }

  // Log any errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    dialog.showErrorBox('Load Failed', `Error ${errorCode}: ${errorDescription}`);
  });

  mainWindow.webContents.on('dom-ready', () => {
    console.log('DOM ready');
  });
}

// ========== Auto-Updater Event Handlers ==========

autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
  mainWindow?.webContents.send('update-checking');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  mainWindow?.webContents.send('update-available', {
    hasUpdate: true,
    latestVersion: info.version,
    currentVersion: app.getVersion(),
    releaseNotes: info.releaseNotes || 'No release notes available.',
    releaseName: `Version ${info.version}`,
    releaseDate: info.releaseDate
  });
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Update not available. Current version:', info.version);
  mainWindow?.webContents.send('update-not-available', {
    currentVersion: app.getVersion()
  });
});

autoUpdater.on('error', (error) => {
  console.error('Update error:', error);
  mainWindow?.webContents.send('update-error', {
    error: error.message
  });
});

autoUpdater.on('download-progress', (progressObj) => {
  console.log(`Download progress: ${progressObj.percent}%`);
  mainWindow?.webContents.send('update-download-progress', {
    percent: progressObj.percent,
    transferred: progressObj.transferred,
    total: progressObj.total,
    bytesPerSecond: progressObj.bytesPerSecond
  });
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded:', info.version);
  mainWindow?.webContents.send('update-downloaded', {
    version: info.version
  });
});

app.whenReady().then(() => {
  console.log('=== APP READY ===');
  console.log('App path:', app.getAppPath());
  console.log('User data:', app.getPath('userData'));
  console.log('Is packaged:', app.isPackaged);

  try {
    console.log('Initializing database...');
    db = new Database();
    console.log('Database object created');

    db.initialize();
    console.log('Database initialized');

    riotApi = new RiotAPI(db);
    console.log('RiotAPI initialized');

    lcuConnector = new LCUConnector();
    console.log('LCUConnector initialized');

    console.log('Creating system tray...');
    createTray();
    console.log('System tray created');

    console.log('Creating window...');
    createWindow();
    console.log('Window created');

    // Auto-start the gameflow monitor
    console.log('Starting gameflow monitor...');
    startGameflowMonitor();

    // Check for updates on startup (if enabled)
    checkForUpdatesOnStartup();
  } catch (error) {
    console.error('ERROR during initialization:', error);
    dialog.showErrorBox('Initialization Error', `Failed to start app: ${error.message}\n\nStack: ${error.stack}`);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch(err => {
  console.error('ERROR in app.whenReady:', err);
  dialog.showErrorBox('Startup Error', `App failed to start: ${err.message}`);
});

app.on('window-all-closed', () => {
  // Don't quit the app - keep running in tray
  // Users can quit from the tray menu
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

// Window control handlers
ipcMain.handle('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.handle('window-close', () => {
  mainWindow?.close();
});

ipcMain.handle('get-user-config', async () => {
  return db.getUserConfig();
});

ipcMain.handle('diagnose-database', async () => {
  try {
    const config = db.getUserConfig();

    const matchCount = db.db.prepare('SELECT COUNT(*) as count FROM matches').get();
    const participantCount = db.db.prepare('SELECT COUNT(*) as count FROM match_participants').get();
    const uniquePlayers = db.db.prepare('SELECT COUNT(DISTINCT summoner_name) as count FROM match_participants').get();
    const sampleNames = db.db.prepare('SELECT DISTINCT summoner_name FROM match_participants LIMIT 20').all();

    let yourMatches = null;
    let recentGames = null;
    if (config) {
      yourMatches = db.db.prepare('SELECT COUNT(*) as count FROM match_participants WHERE puuid = ?').get(config.puuid);
      if (yourMatches.count > 0) {
        recentGames = db.db.prepare(`
          SELECT m.match_id, mp.champion_name, mp.kills, mp.deaths, mp.assists
          FROM matches m
          JOIN match_participants mp ON m.match_id = mp.match_id
          WHERE mp.puuid = ?
          ORDER BY m.game_creation DESC
          LIMIT 5
        `).all(config.puuid);
      }
    }

    return {
      success: true,
      data: {
        config,
        matchCount: matchCount.count,
        participantCount: participantCount.count,
        uniquePlayers: uniquePlayers.count,
        sampleNames: sampleNames.map(p => p.summoner_name),
        yourMatches: yourMatches?.count || 0,
        recentGames
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-user-config', async (event, config) => {
  return db.saveUserConfig(config);
});

ipcMain.handle('validate-and-save-config', async (event, summonerName, region, apiKey) => {
  try {
    riotApi.setApiKey(apiKey);
    const summoner = await riotApi.getSummonerByName(summonerName, region);

    // Use the Riot ID format if available from the API response
    let finalSummonerName = summonerName;
    if (summoner.summonerName) {
      finalSummonerName = summoner.summonerName; // This will be "gameName#tagLine" for Riot IDs
    }

    const config = {
      puuid: summoner.puuid,
      summoner_name: finalSummonerName,
      region: region,
      riot_api_key: apiKey
    };

    db.saveUserConfig(config);
    return { success: true, config };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('import-match-history', async (event, count = 100) => {
  try {
    const config = db.getUserConfig();
    if (!config || !config.riot_api_key) {
      throw new Error('Please configure your Riot API key first');
    }

    riotApi.setApiKey(config.riot_api_key);

    // Progress callback that sends updates to renderer
    const progressCallback = (progress) => {
      event.sender.send('import-progress', progress);
    };

    const result = await riotApi.importMatchHistory(config.puuid, config.region, count, progressCallback);
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

    console.log('=== LOBBY ANALYSIS DEBUG ===');
    console.log('Your summoner name:', config.summoner_name);
    console.log('Lobby players:', lobbyPlayers.map(p => p.summonerName));

    const analysis = [];
    for (const player of lobbyPlayers) {
      // Case-insensitive comparison to avoid missing your own name due to capitalization
      if (player.summonerName.toLowerCase() !== config.summoner_name.toLowerCase()) {
        console.log(`Checking history for: ${player.summonerName}`);
        console.log(`  LCU PUUID: ${player.puuid}`);
        // Note: Match API and LCU return different PUUID formats, so we must use name matching
        const history = db.getPlayerHistory(player.summonerName, null);
        console.log(`  Found ${history.games.length} games`);
        if (history.games.length > 0 && history.stats) {
          // Transform games to include isAlly flag
          const transformedGames = history.games.map(g => ({
            gameId: g.match_id,
            champion: g.opponent_champion,
            role: g.team_position,
            outcome: g.user_win === 1 ? 'win' : 'loss',
            kda: {
              kills: g.opponent_kills,
              deaths: g.opponent_deaths,
              assists: g.opponent_assists
            },
            timestamp: new Date(g.game_creation),
            isAlly: g.user_team === g.opponent_team
          }));

          analysis.push({
            player: player.summonerName,
            puuid: player.puuid,
            source: player.source,
            encounterCount: history.stats.totalGames,
            wins: history.stats.asEnemy.wins + history.stats.asTeammate.wins,
            losses: history.stats.asEnemy.losses + history.stats.asTeammate.losses,
            winRate: Math.round(((history.stats.asEnemy.wins + history.stats.asTeammate.wins) / history.stats.totalGames) * 100),
            games: transformedGames,
            // Enhanced stats
            asEnemy: history.stats.enhanced.asEnemy,
            asAlly: history.stats.enhanced.asAlly,
            lastSeen: history.stats.enhanced.lastSeen,
            threatLevel: history.stats.enhanced.threatLevel,
            allyQuality: history.stats.enhanced.allyQuality,
            byMode: history.stats.enhanced.byMode,
            profileIconId: history.stats.enhanced.profileIconId
          });
        }
      }
    }

    console.log(`Total players with history: ${analysis.length}`);
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

// Helper function to analyze lobby players
async function analyzeLobbyPlayers(lobbyPlayers) {
  const config = db.getUserConfig();
  if (!config || !config.summoner_name) {
    console.log('⚠️  Cannot analyze: No user configuration found. Please configure your summoner name in Settings.');
    return;
  }

  console.log('Lobby players:', lobbyPlayers.map(p => p.summonerName));
  console.log('Your summoner name (from config):', config.summoner_name);

  const analysis = [];

  for (const player of lobbyPlayers) {
    // Case-insensitive comparison to avoid missing your own name due to capitalization
    if (player.summonerName.toLowerCase() !== config.summoner_name.toLowerCase()) {
      console.log(`Checking history for: ${player.summonerName}`);
      // Note: Match API and LCU return different PUUID formats, so we must use name matching
      const history = db.getPlayerHistory(player.summonerName, null);
      console.log(`  Found ${history.games.length} games`);
      if (history.games.length > 0 && history.stats) {
        // Transform games to include isAlly flag
        const transformedGames = history.games.map(g => ({
          gameId: g.match_id,
          champion: g.opponent_champion,
          role: g.team_position,
          outcome: g.user_win === 1 ? 'win' : 'loss',
          kda: {
            kills: g.opponent_kills,
            deaths: g.opponent_deaths,
            assists: g.opponent_assists
          },
          timestamp: new Date(g.game_creation),
          isAlly: g.user_team === g.opponent_team
        }));

        analysis.push({
          player: player.summonerName,
          puuid: player.puuid,
          source: player.source,
          encounterCount: history.stats.totalGames,
          wins: history.stats.asEnemy.wins + history.stats.asTeammate.wins,
          losses: history.stats.asEnemy.losses + history.stats.asTeammate.losses,
          winRate: Math.round(((history.stats.asEnemy.wins + history.stats.asTeammate.wins) / history.stats.totalGames) * 100),
          games: transformedGames,
          // Enhanced stats
          asEnemy: history.stats.enhanced.asEnemy,
          asAlly: history.stats.enhanced.asAlly,
          lastSeen: history.stats.enhanced.lastSeen,
          threatLevel: history.stats.enhanced.threatLevel,
          allyQuality: history.stats.enhanced.allyQuality,
          byMode: history.stats.enhanced.byMode,  // Add mode-specific stats
          profileIconId: history.stats.enhanced.profileIconId  // Add profile icon
        });
      }
    }
  }

  console.log(`Total players with history: ${analysis.length}`);

  if (analysis.length === 0) {
    console.log('ℹ️  No players from your match history found in this lobby');
    console.log('   Make sure you have imported your match history from the Match History page');
  }

  // Send update to renderer
  if (mainWindow && !mainWindow.isDestroyed()) {
    console.log('📤 Sending lobby-update event to renderer with', analysis.length, 'players');
    mainWindow.webContents.send('lobby-update', {
      success: true,
      data: { analysis }
    });
  } else {
    console.log('⚠️  Cannot send lobby-update: mainWindow not ready');
  }

  return analysis;
}

// Function to start gameflow monitoring
async function startGameflowMonitor() {
  if (autoMonitorInterval) {
    console.log('Gameflow monitor already running');
    return { success: true, message: 'Already monitoring' };
  }

  console.log('Starting gameflow monitor...');

  // Don't require config check - just start monitoring silently
  // The app can monitor gameflow even without user configuration

  // Gameflow state machine - polls every 3 seconds
  autoMonitorInterval = setInterval(async () => {
    try {
      // Only connect if not already connected
      if (!lcuConnector.credentials) {
        await lcuConnector.connect();
      }

      // Get current gameflow state
      const gameflowSession = await lcuConnector.getGameflowSession();
      const newState = gameflowSession?.phase || 'None';

      // Log state transitions
      if (newState !== currentGameflowState) {
        console.log(`\n=== GAMEFLOW STATE CHANGE: ${currentGameflowState} -> ${newState} ===`);
        currentGameflowState = newState;

        // Send state update to renderer
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('gameflow-state-change', {
            state: newState,
            timestamp: Date.now()
          });
        }
      }

      // State machine logic
      switch (currentGameflowState) {
        case 'None':
        case 'Lobby':
        case 'Matchmaking':
        case 'ReadyCheck':
          // Waiting for champion select - clear any previous analysis
          lastAnalyzedPlayers = null;
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('gameflow-status', {
              state: currentGameflowState,
              message: 'Waiting for champion select...',
              canAnalyze: false
            });
          }
          break;

        case 'ChampSelect': {
          // In champion select - check if queue is anonymized
          const champSelect = await lcuConnector.getChampSelect();
          const queueId = champSelect?.queue?.id || 0;
          const queueName = getQueueName(queueId);
          const isAnonymized = ANONYMIZED_QUEUES.includes(queueId);

          if (isAnonymized) {
            // Ranked queue - names hidden until game starts
            console.log(`${queueName} (${queueId}) is anonymized - waiting for InProgress state`);
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('gameflow-status', {
                state: 'ChampSelect',
                message: `${queueName} - names will appear when game starts`,
                isAnonymized: true,
                queueId: queueId,
                queueName: queueName
              });
            }
          } else {
            // Normal queue - analyze immediately
            const lobbyPlayers = await lcuConnector.getLobbyPlayers();
            const playerHash = JSON.stringify(lobbyPlayers.map(p => p.puuid || p.summonerName).sort());

            // Only analyze if players changed
            if (playerHash !== lastAnalyzedPlayers) {
              lastAnalyzedPlayers = playerHash;
              console.log(`=== ANALYZING LOBBY (ChampSelect - ${queueName}) ===`);
              await analyzeLobbyPlayers(lobbyPlayers);
            }

            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('gameflow-status', {
                state: 'ChampSelect',
                message: `In champion select - ${queueName}`,
                canAnalyze: true,
                queueId: queueId,
                queueName: queueName
              });
            }
          }
          break;
        }

        case 'InProgress': {
          // Game has started - analyze if we haven't yet (for ranked queues)
          if (!lastAnalyzedPlayers) {
            console.log('=== ANALYZING LOBBY (InProgress - Ranked) ===');
            const lobbyPlayers = await lcuConnector.getLobbyPlayers();
            const playerHash = JSON.stringify(lobbyPlayers.map(p => p.puuid || p.summonerName).sort());
            lastAnalyzedPlayers = playerHash;
            await analyzeLobbyPlayers(lobbyPlayers);
          }

          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('gameflow-status', {
              state: 'InProgress',
              message: 'In game - analysis complete',
              canAnalyze: false
            });
          }
          break;
        }

        case 'EndOfGame':
          // Game ended - auto-import the game
          console.log('=== GAME ENDED - AUTO-IMPORTING ===');

          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('gameflow-status', {
              state: 'EndOfGame',
              message: 'Game ended - importing match...',
              canAnalyze: false
            });
          }

          // Auto-import the completed game (import 1 match to get the latest)
          try {
            const config = db.getUserConfig();
            if (config && config.riot_api_key) {
              riotApi.setApiKey(config.riot_api_key);

              // Wait 10 seconds for Riot to process the game
              await new Promise(resolve => setTimeout(resolve, 10000));

              console.log('Importing completed game...');
              const result = await riotApi.importMatchHistory(config.puuid, config.region, 1);

              if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('gameflow-status', {
                  state: 'EndOfGame',
                  message: `Game imported! (${result} matches)`,
                  canAnalyze: false
                });

                // Notify user
                mainWindow.webContents.send('game-auto-imported', {
                  success: true,
                  imported: result
                });
              }

              console.log(`✅ Auto-imported ${result} match(es)`);
            }
          } catch (error) {
            console.error('Auto-import failed:', error.message);
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('gameflow-status', {
                state: 'EndOfGame',
                message: 'Game ended (auto-import failed)',
                canAnalyze: false
              });
            }
          }

          lastAnalyzedPlayers = null;
          break;

        case 'Reconnect':
          // Player needs to reconnect to game - try to analyze if we haven't
          console.log('=== RECONNECT STATE ===');

          if (!lastAnalyzedPlayers) {
            try {
              const lobbyPlayers = await lcuConnector.getLobbyPlayers();
              const playerHash = JSON.stringify(lobbyPlayers.map(p => p.puuid || p.summonerName).sort());
              lastAnalyzedPlayers = playerHash;
              console.log('=== ANALYZING LOBBY (Reconnect) ===');
              await analyzeLobbyPlayers(lobbyPlayers);
            } catch (error) {
              console.error('Failed to analyze during reconnect:', error.message);
            }
          }

          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('gameflow-status', {
              state: 'Reconnect',
              message: 'Reconnecting to game - analysis available',
              canAnalyze: true
            });
          }
          break;
      }
    } catch (error) {
      // Reset credentials on connection error so we retry connecting next time
      lcuConnector.credentials = null;
      // Silently ignore errors during auto-monitoring (e.g., when client is closed)
    }
  }, 3000); // Check every 3 seconds

  return { success: true, message: 'Auto-monitoring started' };
}

// IPC handler now calls the standalone function
ipcMain.handle('start-auto-monitor', async () => {
  return await startGameflowMonitor();
});

ipcMain.handle('stop-auto-monitor', async () => {
  if (autoMonitorInterval) {
    clearInterval(autoMonitorInterval);
    autoMonitorInterval = null;
    lastAnalyzedPlayers = null;
  }
  return { success: true, message: 'Auto-monitoring stopped' };
});

// ========== Player Tagging IPC Handlers ==========

ipcMain.handle('add-player-tag', async (event, puuid, summonerName, tagType, note) => {
  try {
    db.addPlayerTag(puuid, summonerName, tagType, note);
    return { success: true, message: 'Tag added successfully' };
  } catch (error) {
    console.error('Failed to add player tag:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remove-player-tag', async (event, puuid, tagType) => {
  try {
    db.removePlayerTag(puuid, tagType);
    return { success: true, message: 'Tag removed successfully' };
  } catch (error) {
    console.error('Failed to remove player tag:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('remove-all-player-tags', async (event, puuid) => {
  try {
    db.removeAllPlayerTags(puuid);
    return { success: true, message: 'All tags removed successfully' };
  } catch (error) {
    console.error('Failed to remove all player tags:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-player-tags', async (event, puuid) => {
  try {
    const tags = db.getPlayerTags(puuid);
    return { success: true, tags };
  } catch (error) {
    console.error('Failed to get player tags:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-all-tagged-players', async () => {
  try {
    const taggedPlayers = db.getAllTaggedPlayers();
    return { success: true, taggedPlayers };
  } catch (error) {
    console.error('Failed to get tagged players:', error);
    return { success: false, error: error.message };
  }
});

// ========== Auto-Updater IPC Handlers ==========

/**
 * Check for updates on startup if enabled
 */
async function checkForUpdatesOnStartup() {
  try {
    const config = db.getUserConfig();
    const autoUpdateCheckEnabled = config?.auto_update_check !== 0; // Default to true if not set

    if (autoUpdateCheckEnabled && app.isPackaged) {
      console.log('Checking for updates on startup...');
      autoUpdater.checkForUpdates();
    } else {
      console.log('Auto-update check is disabled or running in dev mode');
    }
  } catch (error) {
    console.error('Error checking for updates on startup:', error);
  }
}

ipcMain.handle('check-for-updates', async () => {
  try {
    if (!app.isPackaged) {
      return {
        success: false,
        error: 'Updates are only available in packaged builds'
      };
    }
    await autoUpdater.checkForUpdates();
    return { success: true };
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('set-auto-update-check', async (event, enabled) => {
  try {
    db.setAutoUpdateCheck(enabled);
    return { success: true, message: 'Auto-update setting saved' };
  } catch (error) {
    console.error('Failed to save auto-update setting:', error);
    return { success: false, error: error.message };
  }
});

// Download the update (called when user clicks "Download Update")
ipcMain.handle('download-update', async () => {
  try {
    if (!app.isPackaged) {
      return {
        success: false,
        error: 'Updates are only available in packaged builds'
      };
    }
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (error) {
    console.error('Failed to download update:', error);
    return { success: false, error: error.message };
  }
});

// Install the downloaded update and restart
ipcMain.handle('install-update', async () => {
  try {
    autoUpdater.quitAndInstall(false, true);
    return { success: true };
  } catch (error) {
    console.error('Failed to install update:', error);
    return { success: false, error: error.message };
  }
});

// ========== Auto-Start IPC Handlers ==========

ipcMain.handle('set-auto-start', async (event, enabled) => {
  try {
    // Save to database
    db.setAutoStart(enabled);

    // Update Windows auto-start setting
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: false,
      args: []
    });

    return { success: true, message: 'Auto-start setting saved' };
  } catch (error) {
    console.error('Failed to save auto-start setting:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-auto-start', async () => {
  try {
    const enabled = db.getAutoStart();
    return { success: true, enabled };
  } catch (error) {
    console.error('Failed to get auto-start setting:', error);
    return { success: false, error: error.message };
  }
});
