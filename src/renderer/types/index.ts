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
  role?: string
  outcome: 'win' | 'loss'
  kda: KDA
  timestamp: Date
  isAlly: boolean // true if teammate, false if enemy
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

// Champion Stats
export interface ChampionStats {
  champion: string
  games: number
  wins: number
  losses: number
  winRate: number
}

// Performance Stats
export interface PerformanceStats {
  avgKills: number
  avgDeaths: number
  avgAssists: number
  avgKDA: number
}

// Split Stats (Enemy vs Ally)
export interface SplitStats {
  games: number
  wins: number
  losses: number
  winRate: number
  lastPlayed?: Date
  recentForm: ('W' | 'L')[] // Last 5 games
  topChampions: ChampionStats[]
  performance: PerformanceStats
}

// Mode-specific stats (Ranked, Normal, ARAM, etc.)
export interface ModeStats {
  asEnemy: SplitStats | null
  asAlly: SplitStats | null
}

export type GameMode = 'Ranked' | 'Normal' | 'ARAM' | 'Arena' | 'Other'

// Enhanced Analysis Result
export interface AnalysisResult {
  player: string
  puuid: string
  source: string
  encounterCount: number
  wins: number
  losses: number
  winRate: number
  games: MatchData[]
  tags?: PlayerTag[]

  // Enhanced stats
  asEnemy: SplitStats
  asAlly: SplitStats
  lastSeen: {
    timestamp: Date
    champion: string
    role?: string
    outcome: 'win' | 'loss'
    isAlly: boolean
  }
  threatLevel?: 'high' | 'medium' | 'low' // Based on enemy WR
  allyQuality?: 'good' | 'average' | 'poor' // Based on ally WR
  byMode?: Record<GameMode, ModeStats> // Stats grouped by game mode
}

// IPC Response Types
export interface IPCResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Progress Data
export interface ImportProgress {
  current: number
  total: number
  imported: number
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
  importMatchHistory: () => Promise<IPCResponse<{ imported: number }>>
  connectLCU: () => Promise<IPCResponse>
  getLobbyPlayers: () => Promise<LobbyPlayer[]>
  getPlayerHistory: (summonerName: string) => Promise<PlayerHistory>
  analyzeLobby: () => Promise<IPCResponse<{ analysis: AnalysisResult[] }>>
  startAutoMonitor: () => Promise<IPCResponse>
  stopAutoMonitor: () => Promise<IPCResponse>
  onLobbyUpdate: (callback: (data: IPCResponse<{ analysis: AnalysisResult[] }>) => void) => () => void
  onImportProgress: (callback: (progress: ImportProgress) => void) => () => void
  onGameflowStateChange: (callback: (data: { state: string; timestamp: number }) => void) => () => void
  onGameflowStatus: (callback: (data: {
    state: string
    message: string
    isAnonymized?: boolean
    queueId?: number
    queueName?: string
    canAnalyze?: boolean
  }) => void) => () => void
  onGameAutoImported: (callback: (data: { success: boolean; imported: number }) => void) => () => void

  // Player tagging methods
  addPlayerTag: (puuid: string, summonerName: string, tagType: string, note: string | null) => Promise<IPCResponse>
  removePlayerTag: (puuid: string, tagType: string) => Promise<IPCResponse>
  removeAllPlayerTags: (puuid: string) => Promise<IPCResponse>
  getPlayerTags: (puuid: string) => Promise<IPCResponse<any[]>>
  getAllTaggedPlayers: () => Promise<IPCResponse<any[]>>
}

declare global {
  interface Window {
    api: WindowAPI
  }
}
