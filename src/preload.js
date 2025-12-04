const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getUserConfig: () => ipcRenderer.invoke('get-user-config'),
  saveUserConfig: (config) => ipcRenderer.invoke('save-user-config', config),
  validateAndSaveConfig: (username, tagLine, region, apiKey) => ipcRenderer.invoke('validate-and-save-config', username, tagLine, region, apiKey),
  importMatchHistory: () => ipcRenderer.invoke('import-match-history'),
  connectLCU: () => ipcRenderer.invoke('connect-lcu'),
  getSkinImage: (skinId, championName) => ipcRenderer.invoke('get-skin-image', skinId, championName),
  getLobbyPlayers: () => ipcRenderer.invoke('get-lobby-players'),
  getPlayerHistory: (username, tagLine, puuid) => ipcRenderer.invoke('get-player-history', username, tagLine, puuid),
  analyzeLobby: () => ipcRenderer.invoke('analyze-lobby'),
  startAutoMonitor: () => ipcRenderer.invoke('start-auto-monitor'),
  stopAutoMonitor: () => ipcRenderer.invoke('stop-auto-monitor'),
  onLobbyUpdate: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('lobby-update', handler);
    return () => ipcRenderer.removeListener('lobby-update', handler);
  },
  onImportProgress: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('import-progress', handler);
    return () => ipcRenderer.removeListener('import-progress', handler);
  },
  cancelImportMatchHistory: () => ipcRenderer.send('cancel-import-match-history'),
  onGameflowStateChange: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('gameflow-state-change', handler);
    return () => ipcRenderer.removeListener('gameflow-state-change', handler);
  },
  onGameflowStatus: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('gameflow-status', handler);
    return () => ipcRenderer.removeListener('gameflow-status', handler);
  },
  onGameAutoImported: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('game-auto-imported', handler);
    return () => ipcRenderer.removeListener('game-auto-imported', handler);
  },
  diagnoseDatabase: () => ipcRenderer.invoke('diagnose-database'),
  getLastMatchRoster: () => ipcRenderer.invoke('get-last-match-roster'),

  // Player tagging API
  addPlayerTag: (puuid, username, tagLine, tagType, note) => ipcRenderer.invoke('add-player-tag', puuid, username, tagLine, tagType, note),
  removePlayerTag: (puuid, tagType) => ipcRenderer.invoke('remove-player-tag', puuid, tagType),
  removeAllPlayerTags: (puuid) => ipcRenderer.invoke('remove-all-player-tags', puuid),
  getPlayerTags: (puuid) => ipcRenderer.invoke('get-player-tags', puuid),
  getAllTaggedPlayers: () => ipcRenderer.invoke('get-all-tagged-players'),

  // Window controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Auto-updater
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  setAutoUpdateCheck: (enabled) => ipcRenderer.invoke('set-auto-update-check', enabled),
  openDownloadUrl: (url) => ipcRenderer.invoke('open-download-url', url),
  onUpdateChecking: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('update-checking', handler);
    return () => ipcRenderer.removeListener('update-checking', handler);
  },
  onUpdateAvailable: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('update-available', handler);
    return () => ipcRenderer.removeListener('update-available', handler);
  },
  onUpdateNotAvailable: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('update-not-available', handler);
    return () => ipcRenderer.removeListener('update-not-available', handler);
  },
  onUpdateDownloadProgress: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('update-download-progress', handler);
    return () => ipcRenderer.removeListener('update-download-progress', handler);
  },
  onUpdateDownloaded: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('update-downloaded', handler);
    return () => ipcRenderer.removeListener('update-downloaded', handler);
  },
  onUpdateError: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('update-error', handler);
    return () => ipcRenderer.removeListener('update-error', handler);
  },

  // Auto-start
  setAutoStart: (enabled) => ipcRenderer.invoke('set-auto-start', enabled),
  getAutoStart: () => ipcRenderer.invoke('get-auto-start')
});
