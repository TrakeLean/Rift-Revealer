// User Configuration
export interface UserConfig {
  username: string
  tag_line: string
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
  username: string
  tagLine: string
  encounterCount: number
  wins: number
  losses: number
  games: MatchData[]
}

// Lobby Player
export interface LobbyPlayer {
  username: string
  tagLine: string
  source: 'championSelect' | 'inGame'
}

export interface RosterPlayer {
  puuid: string
  username: string
  tagLine: string
  championName?: string
  championId?: number
  teamId?: number
  role?: string
  lane?: string
  teamPosition?: string
  profileIconId?: number | null
  win?: boolean
  encounterCount?: number
  wins?: number
  losses?: number
  winRate?: number
  skinId?: number | null
  asEnemy?: SplitStats | null
  asAlly?: SplitStats | null
  lastSeen?: {
    timestamp: Date
    champion: string
    role?: string
    outcome: 'win' | 'loss'
    isAlly: boolean
  } | null
  threatLevel?: 'high' | 'medium' | 'low' | null
  allyQuality?: 'good' | 'average' | 'poor' | null
  byMode?: Record<GameMode, ModeStats> | null
  games?: MatchData[]
}

export interface LastMatchRoster {
  matchId: string
  queueId?: number
  gameCreation?: number
  userTeamId?: number | null
  players: RosterPlayer[]
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
  roleStats: RoleStats[]
}

export interface RoleStats {
  role: string
  games: number
  wins: number
  losses: number
  winRate: number
}

// Mode-specific stats (Ranked, Normal, ARAM, etc.)
export interface ModeStats {
  asEnemy: SplitStats | null
  asAlly: SplitStats | null
}

export type GameMode = 'Ranked' | 'Normal' | 'ARAM' | 'Arena' | 'Other'

// Enhanced Analysis Result
export interface AnalysisResult {
  username: string
  tagLine: string
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
  profileIconId?: number | null // Profile icon from Riot
  skinId?: number | null // Preferred skin ID (from LCU)
   championId?: number | null
   championName?: string | null
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
    username: string,
    tagLine: string,
    region: string,
    apiKey: string
  ) => Promise<IPCResponse>
  importMatchHistory: () => Promise<IPCResponse<{ imported: number }>>
  cancelImportMatchHistory: () => void
  connectLCU: () => Promise<IPCResponse>
  getLobbyPlayers: () => Promise<LobbyPlayer[]>
  getPlayerHistory: (username: string, tagLine: string, puuid?: string) => Promise<PlayerHistory>
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
  addPlayerTag: (puuid: string, username: string, tagLine: string, tagType: string, note: string | null) => Promise<IPCResponse>
  removePlayerTag: (puuid: string, tagType: string) => Promise<IPCResponse>
  removeAllPlayerTags: (puuid: string) => Promise<IPCResponse>
  getPlayerTags: (puuid: string) => Promise<IPCResponse<any[]>>
  getAllTaggedPlayers: () => Promise<IPCResponse<any[]>>
  getLastMatchRoster: () => Promise<IPCResponse<LastMatchRoster>>
  getSkinImage: (skinId: number, championName: string) => Promise<IPCResponse<{ path: string }>>
}

declare global {
  interface Window {
    api: WindowAPI
  }
}
