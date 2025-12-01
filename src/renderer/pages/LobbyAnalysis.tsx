import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { PlayerChip } from '@/components/PlayerChip'
import { StatsPanel } from '@/components/StatsPanel'
import { MatchCard } from '@/components/MatchCard'
import { Activity, CheckCircle2, Clock, AlertCircle, Gamepad2, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnalysisResult, LastMatchRoster, RosterPlayer } from '../types'

// Map normalized state to a status tone
const getStatusTone = (normalized: string, isAnonymized?: boolean): 'success' | 'error' | 'info' | 'warning' => {
  if (normalized === 'clientclosed') return 'error'
  if (normalized === 'inprogress' || normalized === 'gamestart') return 'success'
  if (normalized === 'endofgame' || normalized === 'waitingforstats' || normalized === 'preendofgame') return 'info'
  if (normalized === 'reconnect' || isAnonymized) return 'warning'
  return 'info'
}

const QUEUE_NAMES: Record<number, string> = {
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
  1900: 'Pick URF',
  2400: 'ARAM Mayhem',
  3140: 'Practice Tool'
}

const LIVE_STATES = ['champselect', 'champ select', 'championselect', 'inprogress', 'gamestart', 'reconnect']

export function LobbyAnalysis() {
  const [detectedPlayers, setDetectedPlayers] = useState<AnalysisResult[]>([])
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null)
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)
  const [gameflowStatus, setGameflowStatus] = useState<{
    state: string
    message: string
    isAnonymized?: boolean
    queueId?: number | string
    queueName?: string
  } | null>(null)
  const [lastRoster, setLastRoster] = useState<LastMatchRoster | null>(null)
  const [rosterError, setRosterError] = useState<string | null>(null)
  const [rosterLoading, setRosterLoading] = useState(false)
  const [bubbleExpanded, setBubbleExpanded] = useState(false)
  const [manualOpen, setManualOpen] = useState(false)
  const bubbleTimer = useRef<NodeJS.Timeout | null>(null)
  const lastStatusKey = useRef<string | null>(null)
  const prevIsLiveRef = useRef<boolean>(false)

  const loadLastRoster = useCallback(async () => {
    if (!window.api?.getLastMatchRoster) {
      return
    }

    setRosterLoading(true)
    try {
      const res = await window.api.getLastMatchRoster()
      if (res.success && res.data) {
        setLastRoster(res.data)
        setRosterError(null)
      } else {
        setLastRoster(null)
        setRosterError(res.error || 'No recent match found. Import matches from Settings to see your last game roster.')
      }
    } catch (error) {
      console.error('Failed to load last match roster:', error)
      setLastRoster(null)
      setRosterError('Unable to load your last match roster.')
    } finally {
      setRosterLoading(false)
    }
  }, [])

  const isLiveState = useCallback((normalized: string) => LIVE_STATES.includes(normalized), [])

  const getQueueName = (queueId?: number | string) => {
    if (queueId === undefined || queueId === null) return 'Unknown Queue'
    const normalizedId = Number(typeof queueId === 'string' ? queueId.trim() : queueId)
    const fallbackKey = typeof queueId === 'string' ? queueId.trim() : String(queueId)
    return QUEUE_NAMES[normalizedId] || QUEUE_NAMES[fallbackKey] || `Queue ${queueId}`
  }

  const getRoleOrder = (player?: RosterPlayer) => {
    const rawRole = (player?.teamPosition || player?.role || player?.lane || '').toUpperCase()
    const orderMap: Record<string, number> = {
      TOP: 0,
      JUNGLE: 1,
      JG: 1,
      MIDDLE: 2,
      MID: 2,
      BOTTOM: 3,
      ADC: 3,
      DUO_CARRY: 3,
      UTILITY: 4,
      SUPPORT: 4
    }
    return orderMap[rawRole] ?? 99
  }

  const formatRoleLabel = (player?: RosterPlayer) => {
    const rawRole = (player?.teamPosition || player?.role || player?.lane || '').toUpperCase()
    const roleLabelMap: Record<string, string> = {
      TOP: 'Top',
      JUNGLE: 'Jungle',
      JG: 'Jungle',
      MIDDLE: 'Mid',
      MID: 'Mid',
      BOTTOM: 'ADC',
      ADC: 'ADC',
      DUO_CARRY: 'ADC',
      UTILITY: 'Support',
      SUPPORT: 'Support'
    }
    return roleLabelMap[rawRole] || null
  }

  const getTeamLabel = (teamId?: number) => {
    if (teamId === 100) return 'Blue Team'
    if (teamId === 200) return 'Red Team'
    if (teamId === undefined || teamId === null) return 'Team ?'
    return `Team ${teamId}`
  }

  const buildRosterRows = (players: RosterPlayer[]) => {
    const byTeam: Record<number, RosterPlayer[]> = {}
    players.forEach((p) => {
      const teamKey = typeof p.teamId === 'number' ? p.teamId : 0
      if (!byTeam[teamKey]) byTeam[teamKey] = []
      byTeam[teamKey].push(p)
    })

    const teamIds = Object.keys(byTeam).map(Number).sort((a, b) => a - b)

    // Standard two-team layout (preferred)
    if (teamIds.length === 2) {
      const leftTeamId = teamIds.includes(100) ? 100 : teamIds[0]
      const rightTeamId = teamIds.find((id) => id !== leftTeamId) ?? teamIds[1]

      const sortTeam = (teamPlayers: RosterPlayer[]) =>
        [...teamPlayers].sort((a, b) => {
          const roleDiff = getRoleOrder(a) - getRoleOrder(b)
          if (roleDiff !== 0) return roleDiff
          return (a.summonerName || '').localeCompare(b.summonerName || '')
        })

      const leftTeam = sortTeam(byTeam[leftTeamId] || [])
      const rightTeam = sortTeam(byTeam[rightTeamId] || [])
      const rows: Array<{ left?: RosterPlayer; right?: RosterPlayer }> = []
      const rowCount = Math.max(leftTeam.length, rightTeam.length)

      for (let i = 0; i < rowCount; i++) {
        rows.push({
          left: leftTeam[i],
          right: rightTeam[i]
        })
      }

      return {
        rows,
        leftLabel: getTeamLabel(leftTeamId),
        rightLabel: getTeamLabel(rightTeamId)
      }
    }

    // Fallback for multi-team / role-less modes (e.g., Arena, ARAM)
    const sorted = [...players].sort((a, b) => {
      if ((a.teamId ?? 0) !== (b.teamId ?? 0)) return (a.teamId ?? 0) - (b.teamId ?? 0)
      const roleDiff = getRoleOrder(a) - getRoleOrder(b)
      if (roleDiff !== 0) return roleDiff
      return (a.summonerName || '').localeCompare(b.summonerName || '')
    })

    const rowCount = Math.ceil(sorted.length / 2)
    const rows: Array<{ left?: RosterPlayer; right?: RosterPlayer }> = []
    for (let i = 0; i < rowCount; i++) {
      rows.push({
        left: sorted[i],
        right: sorted[i + rowCount]
      })
    }

    return {
      rows,
      leftLabel: 'Left',
      rightLabel: 'Right'
    }
  }

  const clearBubbleTimer = () => {
    if (bubbleTimer.current) {
      clearTimeout(bubbleTimer.current)
      bubbleTimer.current = null
    }
  }

  const triggerAutoBubble = () => {
    setManualOpen(false)
    setBubbleExpanded(true)
    clearBubbleTimer()
    bubbleTimer.current = setTimeout(() => {
      setBubbleExpanded(false)
      bubbleTimer.current = null
    }, 5000)
  }

  useEffect(() => {
    // Listen for gameflow status updates
    const cleanupStatus = window.api.onGameflowStatus((data) => {
      setGameflowStatus(data)

      const stateRaw = data.state || ''
      const normalized = stateRaw.trim().toLowerCase()
      const tone = getStatusTone(normalized, data.isAnonymized)
      const queueName = data.queueName || 'queue'
      const defaultMessage =
        data.message ||
        (normalized === 'clientclosed'
          ? 'League client not detected. Open it to start monitoring.'
          : normalized === 'none'
          ? 'League client ready - waiting for lobby or champion select.'
          : normalized === 'matchmaking'
          ? `Searching for a match (${queueName}).`
          : normalized === 'readycheck'
          ? 'Ready check - accept to enter champion select.'
          : normalized === 'champselect'
          ? 'Champion select detected.'
          : normalized === 'inprogress'
          ? 'In game.'
          : normalized === 'lobby'
          ? 'Waiting for champion select.'
          : 'Monitoring lobby and game states.')

      setStatus({
        message: defaultMessage,
        type: tone
      })

      const isLiveNow = isLiveState(normalized)
      if (!isLiveNow && prevIsLiveRef.current) {
        loadLastRoster()
      } else if (isLiveNow && !prevIsLiveRef.current) {
        setLastRoster(null)
        setRosterError(null)
      }
      prevIsLiveRef.current = isLiveNow

      // Auto-show bubble on new status (ignore identical repeats)
      const statusKey = `${normalized}|${defaultMessage}`
      if (statusKey !== lastStatusKey.current) {
        lastStatusKey.current = statusKey
        triggerAutoBubble()
      }
    })

    // Listen for auto-import notifications
    const cleanupAutoImport = window.api.onGameAutoImported((data) => {
      if (data.success) {
        setStatus({
          message: `Game auto-imported! Added ${data.imported} match(es) to your history.`,
          type: 'success'
        })
        // Refresh last roster so the just-finished game shows up
        loadLastRoster()
      }
    })

    // Listen for auto-monitor updates
    const cleanupLobby = window.api.onLobbyUpdate((data) => {
      console.log('📥 Received lobby-update event:', data)
      if (data.success && data.data) {
        console.log('  Setting detected players:', data.data.analysis.length)
        setDetectedPlayers(data.data.analysis || [])

        if (data.data.analysis.length === 0) {
          setStatus({
            message: 'No previous opponents found in current lobby',
            type: 'info',
          })
        } else {
          const mode = data.data.analysis[0]?.source === 'championSelect' ? 'Champion Select' : 'In-Game'
          setStatus({
            message: `Found ${data.data.analysis.length} player(s) from your match history!`,
            type: 'success',
          })
        }
      }
    })

    return () => {
      cleanupStatus()
      cleanupAutoImport()
      cleanupLobby()
    }
  }, [loadLastRoster, isLiveState])

  useEffect(() => {
    return () => clearBubbleTimer()
  }, [])

  useEffect(() => {
    loadLastRoster()
  }, [loadLastRoster])

  const togglePlayerExpansion = (summonerName: string) => {
    setExpandedPlayer(expandedPlayer === summonerName ? null : summonerName)
  }

  // Single source of truth for state info
  const getStateInfo = () => {
    const statusData = gameflowStatus
    if (!statusData) {
      return {
        icon: Clock,
        label: 'Waiting for League Client',
        description: 'Open the League client to start monitoring.',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/20',
        borderColor: 'border-muted',
        pulse: false
      }
    }

    const stateRaw = statusData.state || ''
    const normalized = stateRaw.trim().toLowerCase()

    if (normalized === 'clientclosed') {
      return {
        icon: AlertCircle,
        label: 'League Client Closed',
        description: statusData.message || 'Open the League client to start monitoring.',
        color: 'text-red-400',
        bgColor: 'bg-red-500/15',
        borderColor: 'border-red-500/50',
        pulse: false
      }
    }

    if (normalized === 'champselect' || normalized === 'champ select' || normalized === 'championselect') {
      return {
        icon: Activity,
        label: statusData.isAnonymized
          ? `${statusData.queueName} - Waiting for names...`
          : `Champion Select - ${statusData.queueName}`,
        description: statusData.isAnonymized
          ? 'Names are hidden; analysis will run once the game starts.'
          : 'Names detected; analysis will update as picks lock in.',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/50',
        pulse: true
      }
    }

    if (normalized === 'inprogress' || normalized === 'gamestart') {
      return {
        icon: Gamepad2,
        label: `In Game - ${statusData.queueName || 'Active'}`,
        description: statusData.message || 'Analysis completed for this match.',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20',
        borderColor: 'border-emerald-500/50',
        pulse: false
      }
    }

    if (normalized === 'endofgame' || normalized === 'waitingforstats' || normalized === 'preendofgame') {
      return {
        icon: CheckCircle2,
        label: 'Game Ended - Importing...',
        description: statusData.message || 'Importing the latest match automatically.',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/25',
        borderColor: 'border-yellow-500/50',
        pulse: false
      }
    }

    if (normalized === 'reconnect') {
      return {
        icon: AlertCircle,
        label: 'Reconnecting to Game',
        description: statusData.message || 'Client reconnecting; analysis will resume.',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        borderColor: 'border-red-500/50',
        pulse: true
      }
    }

    const baseDescription = statusData.message || 'League client ready - waiting for lobby or champion select.'
    if (normalized === 'matchmaking') {
      return {
        icon: Activity,
        label: 'Searching for a Match',
        description: baseDescription,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/50',
        pulse: true
      }
    }

    if (normalized === 'readycheck') {
      return {
        icon: AlertCircle,
        label: 'Ready Check',
        description: baseDescription,
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/25',
        borderColor: 'border-yellow-500/50',
        pulse: true
      }
    }

    if (normalized === 'lobby') {
      return {
        icon: Users,
        label: 'Lobby Open',
        description: baseDescription,
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20',
        borderColor: 'border-blue-500/50',
        pulse: false
      }
    }

    return {
      icon: Clock,
      label: 'League Client Ready',
      description: baseDescription,
      color: 'text-muted-foreground',
      bgColor: 'bg-blue-500/15',
      borderColor: 'border-blue-500/40',
      pulse: false
    }
  }

  const stateInfo = getStateInfo()
  const StateIcon = stateInfo.icon
  const bubbleTone = (() => {
    const color = stateInfo.color
    if (color.includes('text-blue')) return { bg: 'bg-blue-500/25' }
    if (color.includes('text-emerald')) return { bg: 'bg-emerald-500/25' }
    if (color.includes('text-yellow')) return { bg: 'bg-yellow-500/30' }
    if (color.includes('text-red')) return { bg: 'bg-red-500/25' }
    if (color.includes('text-muted')) return { bg: 'bg-blue-400/20' }
    return { bg: 'bg-blue-400/20' }
  })()
  const handleBubbleClick = () => {
    if (bubbleExpanded) {
      clearBubbleTimer()
      setBubbleExpanded(false)
      setManualOpen(false)
    } else {
      clearBubbleTimer()
      setBubbleExpanded(true)
      setManualOpen(true) // stay open until clicked or new status arrives
    }
  }

  const normalizedState = (gameflowStatus?.state || '').trim().toLowerCase()
  const isLiveView = isLiveState(normalizedState)
  const rosterLayout = buildRosterRows(lastRoster?.players || [])
  const lastMatchPlayedAt = lastRoster?.gameCreation ? new Date(lastRoster.gameCreation) : null

  const renderRosterCell = (player: RosterPlayer | undefined, sideLabel: string, key: string) => {
    if (!player) {
      return (
        <div key={key} className="rounded-lg border border-dashed border-border/50 bg-muted/10 p-3 text-center text-xs text-muted-foreground">
          Empty slot
        </div>
      )
    }

    const isAlly = lastRoster?.userTeamId ? player.teamId === lastRoster.userTeamId : false
    const lastSeen = lastMatchPlayedAt
      ? {
          timestamp: lastMatchPlayedAt,
          champion: player.championName || 'Unknown',
          role: formatRoleLabel(player) || undefined,
          outcome: player.win ? 'win' as const : 'loss' as const,
          isAlly
        }
      : undefined

    const encounterCount = player.encounterCount ?? 1
    const wins = player.wins ?? (player.win ? 1 : 0)
    const losses = player.losses ?? (player.win ? 0 : 1)
    const hasDetails = Boolean(player.asEnemy || player.asAlly || (player.games && player.games.length > 0))
    const isSelected = expandedPlayer === player.summonerName

    return (
      <div key={key} className="space-y-2 h-full">
        <PlayerChip
          puuid={player.puuid}
          summonerName={player.summonerName}
          encounterCount={encounterCount}
          wins={wins}
          losses={losses}
          asEnemy={player.asEnemy || undefined}
          asAlly={player.asAlly || undefined}
          threatLevel={player.threatLevel || undefined}
          allyQuality={player.allyQuality || undefined}
          lastSeen={lastSeen}
          profileIconId={player.profileIconId ?? undefined}
          skinId={player.skinId ?? undefined}
          championName={player.championName}
          championId={player.championId}
          byMode={player.byMode || undefined}
          onClick={hasDetails ? () => togglePlayerExpansion(player.summonerName) : undefined}
          isExpanded={isSelected}
          className={cn("h-full", isSelected && "ring-1 ring-primary/60")}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {isLiveView ? (
        <>
          {/* Detection Alert */}
          {detectedPlayers.length > 0 && (
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-medium">
                    Detected {detectedPlayers.length} player{detectedPlayers.length !== 1 ? 's' : ''}{' '}from your match history in current lobby!
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Player Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Players You've Met</CardTitle>
              <CardDescription>
                {detectedPlayers.length > 0
                  ? 'Your history with players in this lobby'
                  : 'Players you\'ve encountered before will appear here'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {detectedPlayers.length > 0 ? (
                <div className="space-y-3">
                  {detectedPlayers.map((player) => (
                    <div key={player.player} className="space-y-3">
                      <PlayerChip
                        puuid={player.puuid}
                        summonerName={player.player}
                        encounterCount={player.encounterCount}
                        wins={player.wins}
                        losses={player.losses}
                        tags={player.tags}
                        asEnemy={player.asEnemy}
                        asAlly={player.asAlly}
                        lastSeen={player.lastSeen}
                        threatLevel={player.threatLevel}
                        allyQuality={player.allyQuality}
                        byMode={player.byMode}
                      profileIconId={player.profileIconId}
                      skinId={player.skinId}
                      onClick={() => togglePlayerExpansion(player.player)}
                    />

                      {/* Expanded Stats Panel */}
                      {expandedPlayer === player.player && (
                        <div className="ml-4 space-y-3">
                          {/* Detailed Stats */}
                          <StatsPanel
                            asEnemy={player.asEnemy}
                            asAlly={player.asAlly}
                          />

                          {/* Recent Match History */}
                          {player.games.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                Recent Games
                              </p>
                              <div className="space-y-2">
                                {player.games.slice(0, 5).map((match, idx) => (
                                  <MatchCard
                                    key={idx}
                                    gameId={match.gameId}
                                    champion={match.champion}
                                    outcome={match.outcome}
                                    kda={match.kda}
                                    timestamp={new Date(match.timestamp)}
                                  />
                                ))}
                                {player.games.length > 5 && (
                                  <p className="text-xs text-muted-foreground text-center py-2">
                                    + {player.games.length - 5} more games
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <p>No players detected yet.</p>
                  <p className="text-sm mt-2">Join a lobby or start a game to see your match history with players.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Last Match Roster</CardTitle>
            <CardDescription>
              Tag players from your most recent game when you&apos;re out of lobby or in client idle states.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rosterLoading ? (
              <div className="py-10 text-center text-muted-foreground">Loading your last match...</div>
            ) : lastRoster ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>{getQueueName(lastRoster.queueId)}</span>
                  {lastMatchPlayedAt && (
                    <>
                      <span>•</span>
                      <span>{lastMatchPlayedAt.toLocaleString()}</span>
                    </>
                  )}
                </div>

                {/* Five rows of two cards each to avoid cramped widths */}
                <div className="space-y-3">
                  {Array.from({ length: Math.ceil(rosterLayout.rows.length) }).map((_, idx) => {
                    const left = rosterLayout.rows[idx]?.left
                    const right = rosterLayout.rows[idx]?.right
                    const expandedData =
                      expandedPlayer && [left, right].find(p => p && p.summonerName === expandedPlayer)

                    return (
                      <div key={`row-${idx}`} className="space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {renderRosterCell(left, rosterLayout.leftLabel, `left-${idx}`)}
                          {renderRosterCell(right, rosterLayout.rightLabel, `right-${idx}`)}
                        </div>

                        {expandedData && (
                          <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                            {(expandedData.asEnemy || expandedData.asAlly) && (
                              <StatsPanel
                                asEnemy={expandedData.asEnemy || undefined}
                                asAlly={expandedData.asAlly || undefined}
                              />
                            )}
                            {expandedData.games && expandedData.games.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                                  Recent Games
                                </p>
                                <div className="space-y-2">
                                  {expandedData.games.slice(0, 5).map((match, midx) => (
                                    <MatchCard
                                      key={midx}
                                      gameId={match.gameId}
                                      champion={match.champion}
                                      outcome={match.outcome}
                                      kda={match.kda}
                                      timestamp={new Date(match.timestamp)}
                                    />
                                  ))}
                                  {expandedData.games.length > 5 && (
                                    <p className="text-xs text-muted-foreground text-center py-2">
                                      + {expandedData.games.length - 5} more games
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <p>{rosterError || 'No recent match found.'}</p>
                <p className="text-sm mt-2">Import your match history from Settings to see your last game roster.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}


      {/* Floating status bubble */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleBubbleClick}
          className={cn(
            "flex items-center gap-3 rounded-full shadow-lg transition-all backdrop-blur-sm",
            bubbleExpanded ? "px-3 py-2" : "p-3",
            bubbleTone.bg,
            "hover:border-primary/50",
            !bubbleExpanded && "opacity-95"
          )}
          >
          <div className="flex items-center justify-center h-10 w-10 rounded-full shadow-sm">
            <StateIcon className={cn("h-6 w-6", stateInfo.color)} />
          </div>

          {bubbleExpanded && (
            <div className="flex flex-col text-left min-w-[12rem] max-w-md">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {stateInfo.label}
                </span>
                {stateInfo.pulse && (
                  <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", stateInfo.color.replace("text-", "bg-"))} />
                )}
              </div>
              <span className="text-sm text-foreground">
                {status?.message || stateInfo.description || "Monitoring lobby and game states."}
              </span>
            </div>
          )}
        </button>
      </div>
    </div>
  )
}
