const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getUserConfig: () => ipcRenderer.invoke('get-user-config'),
  saveUserConfig: (config) => ipcRenderer.invoke('save-user-config', config),
  validateAndSaveConfig: (summonerName, region, apiKey) => ipcRenderer.invoke('validate-and-save-config', summonerName, region, apiKey),
  importMatchHistory: (count) => ipcRenderer.invoke('import-match-history', count),
  connectLCU: () => ipcRenderer.invoke('connect-lcu'),
  getLobbyPlayers: () => ipcRenderer.invoke('get-lobby-players'),
  getPlayerHistory: (summonerName) => ipcRenderer.invoke('get-player-history', summonerName),
  analyzeLobby: () => ipcRenderer.invoke('analyze-lobby'),
  startAutoMonitor: () => ipcRenderer.invoke('start-auto-monitor'),
  stopAutoMonitor: () => ipcRenderer.invoke('stop-auto-monitor'),
  onLobbyUpdate: (callback) => ipcRenderer.on('lobby-update', (event, data) => callback(data))
});
