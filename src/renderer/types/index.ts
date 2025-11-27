// User Configuration
export interface UserConfig {
  summoner_name: string
  region: string
  riot_api_key: string
  puuid?: string
}

// Match Data
export interface KDA {
  kills: number
  deaths: number
  assists: number
}

export interface MatchData {
  gameId: string
  champion: string
  outcome: 'win' | 'loss'
  kda: KDA
  timestamp: Date
}

// Player History
export interface PlayerHistory {
  summonerName: string
  encounterCount: number
  wins: number
  losses: number
  games: MatchData[]
}

// Lobby Player
export interface LobbyPlayer {
  summonerName: string
  source: 'championSelect' | 'inGame'
}

// Player Tag
export interface PlayerTag {
  label: string
  variant: 'toxic' | 'notable' | 'positive' | 'info'
}

// Analysis Result
export interface AnalysisResult {
  player: string
  source: string
  encounterCount: number
  wins: number
  losses: number
  games: MatchData[]
  tags?: PlayerTag[]
}

// IPC Response Types
export interface IPCResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Window API types (for preload bridge)
export interface WindowAPI {
  getUserConfig: () => Promise<UserConfig | null>
  saveUserConfig: (config: UserConfig) => Promise<IPCResponse>
  validateAndSaveConfig: (
    summonerName: string,
    region: string,
    apiKey: string
  ) => Promise<IPCResponse>
  importMatchHistory: (count: number) => Promise<IPCResponse<{ imported: number }>>
  connectLCU: () => Promise<IPCResponse>
  getLobbyPlayers: () => Promise<LobbyPlayer[]>
  getPlayerHistory: (summonerName: string) => Promise<PlayerHistory>
  analyzeLobby: () => Promise<IPCResponse<{ analysis: AnalysisResult[] }>>
  startAutoMonitor: () => Promise<IPCResponse>
  stopAutoMonitor: () => Promise<IPCResponse>
  onLobbyUpdate: (callback: (data: IPCResponse<{ analysis: AnalysisResult[] }>) => void) => void
}

declare global {
  interface Window {
    api: WindowAPI
  }
}
