import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { PlayerChip } from '@/components/PlayerChip'
import { StatsPanel } from '@/components/StatsPanel'
import { MatchCard } from '@/components/MatchCard'
import { Activity, CheckCircle2, Clock, AlertCircle, Gamepad2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnalysisResult } from '../types'

export function LobbyAnalysis() {
  const [detectedPlayers, setDetectedPlayers] = useState<AnalysisResult[]>([])
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null)
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)
  const [gameflowStatus, setGameflowStatus] = useState<{
    state: string
    message: string
    isAnonymized?: boolean
    queueId?: number
    queueName?: string
  } | null>(null)

  useEffect(() => {
    // Listen for gameflow status updates
    const cleanupStatus = window.api.onGameflowStatus((data) => {
      setGameflowStatus(data)

      // Update status message based on gameflow
      if (data.isAnonymized) {
        setStatus({
          message: data.message,
          type: 'warning'
        })
      } else if (data.state === 'InProgress') {
        setStatus({
          message: data.message,
          type: 'success'
        })
      } else if (data.state === 'EndOfGame') {
        setStatus({
          message: data.message,
          type: 'info'
        })
      }
    })

    // Listen for auto-import notifications
    const cleanupAutoImport = window.api.onGameAutoImported((data) => {
      if (data.success) {
        setStatus({
          message: `Game auto-imported! Added ${data.imported} match(es) to your history.`,
          type: 'success'
        })
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
  }, [])

  const togglePlayerExpansion = (summonerName: string) => {
    setExpandedPlayer(expandedPlayer === summonerName ? null : summonerName)
  }

  // Helper to get state info
  const getStateInfo = () => {
    if (!gameflowStatus) {
      return {
        icon: Clock,
        label: 'Waiting for League Client',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/20',
        borderColor: 'border-muted',
        pulse: false
      }
    }

    const state = gameflowStatus.state

    if (state === 'ChampSelect') {
      return {
        icon: Activity,
        label: gameflowStatus.isAnonymized
          ? `${gameflowStatus.queueName} - Waiting for names...`
          : `Champion Select - ${gameflowStatus.queueName}`,
        color: 'text-blue-400',
        bgColor: 'bg-blue-950/20',
        borderColor: 'border-blue-900/30',
        pulse: true
      }
    }

    if (state === 'InProgress') {
      return {
        icon: Gamepad2,
        label: `In Game - ${gameflowStatus.queueName || 'Active'}`,
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-950/20',
        borderColor: 'border-emerald-900/30',
        pulse: false
      }
    }

    if (state === 'EndOfGame') {
      return {
        icon: CheckCircle2,
        label: 'Game Ended - Importing...',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-950/20',
        borderColor: 'border-yellow-900/30',
        pulse: false
      }
    }

    if (state === 'Reconnect') {
      return {
        icon: AlertCircle,
        label: 'Reconnecting to Game',
        color: 'text-red-400',
        bgColor: 'bg-red-950/20',
        borderColor: 'border-red-900/30',
        pulse: true
      }
    }

    // Lobby, Matchmaking, ReadyCheck, etc.
    return {
      icon: Clock,
      label: 'In Lobby - Waiting for game...',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/20',
      borderColor: 'border-muted',
      pulse: false
    }
  }

  const stateInfo = getStateInfo()
  const StateIcon = stateInfo.icon

  return (
    <div className="space-y-6">
      {/* Status Dashboard */}
      <Card className={cn("border-l-4", stateInfo.borderColor)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-lg",
              stateInfo.bgColor
            )}>
              <StateIcon className={cn("h-6 w-6", stateInfo.color)} />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{stateInfo.label}</h3>
                {stateInfo.pulse && (
                  <div className={cn(
                    "h-2 w-2 rounded-full animate-pulse",
                    stateInfo.color.replace('text-', 'bg-')
                  )} />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Automatic monitoring active • Analysis runs when lobby detected
              </p>
            </div>

            {detectedPlayers.length > 0 && (
              <div className={cn(
                "px-4 py-2 rounded-md border",
                "bg-primary/10 border-primary/30"
              )}>
                <div className="text-2xl font-bold text-primary">
                  {detectedPlayers.length}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase">
                  Detected
                </div>
              </div>
            )}
          </div>

          {/* Status Message */}
          {status && (
            <div
              className={cn(
                "flex items-center gap-2 p-3 rounded-md text-sm mt-4",
                status.type === 'success' && 'bg-emerald-950/50 text-emerald-400 border border-emerald-900',
                status.type === 'error' && 'bg-red-950/50 text-red-400 border border-red-900',
                status.type === 'warning' && 'bg-yellow-950/50 text-yellow-400 border border-yellow-900',
                status.type === 'info' && 'bg-blue-950/50 text-blue-400 border border-blue-900'
              )}
            >
              <span>{status.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detection Alert */}
      {detectedPlayers.length > 0 && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium">
                Detected {detectedPlayers.length} player{detectedPlayers.length !== 1 ? 's' : ''}
                {' '}from your match history in current lobby!
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
    </div>
  )
}
