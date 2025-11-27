import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlayerChip } from '@/components/PlayerChip'
import { MatchCard } from '@/components/MatchCard'
import { Play, Square, RefreshCw } from 'lucide-react'
import type { AnalysisResult } from '../types'

export function LobbyAnalysis() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [detectedPlayers, setDetectedPlayers] = useState<AnalysisResult[]>([])
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null)

  useEffect(() => {
    // Listen for auto-monitor updates
    window.api.onLobbyUpdate((data) => {
      if (data.success && data.data) {
        setDetectedPlayers(data.data.analysis || [])

        if (data.data.analysis.length === 0) {
          setStatus({
            message: 'No previous opponents found in current lobby',
            type: 'info',
          })
        } else {
          const mode = data.data.analysis[0]?.source === 'championSelect' ? 'Champion Select' : 'In-Game'
          setStatus({
            message: `Auto-detected ${data.data.analysis.length} previous opponent(s)! (${mode})`,
            type: 'success',
          })
        }
      }
    })
  }, [])

  const handleToggleMonitor = async () => {
    if (isMonitoring) {
      try {
        await window.api.stopAutoMonitor()
        setIsMonitoring(false)
        setStatus({ message: 'Auto-monitoring stopped', type: 'info' })
      } catch (error) {
        setStatus({ message: `Error stopping monitor: ${error}`, type: 'error' })
      }
    } else {
      try {
        const result = await window.api.startAutoMonitor()
        if (result.success) {
          setIsMonitoring(true)
          setStatus({
            message: 'Auto-monitoring enabled - will detect lobby changes automatically',
            type: 'success',
          })
        } else {
          setStatus({
            message: result.error || 'Failed to start auto-monitor',
            type: 'error',
          })
        }
      } catch (error) {
        setStatus({ message: `Error starting monitor: ${error}`, type: 'error' })
      }
    }
  }

  const handleAnalyzeOnce = async () => {
    setIsAnalyzing(true)
    setStatus({ message: 'Analyzing current lobby...', type: 'info' })

    try {
      const result = await window.api.analyzeLobby()
      if (result.success && result.data) {
        setDetectedPlayers(result.data.analysis || [])

        if (result.data.analysis.length === 0) {
          setStatus({
            message: 'No previous opponents found in current lobby',
            type: 'info',
          })
        } else {
          setStatus({
            message: `Found ${result.data.analysis.length} player(s) from your match history!`,
            type: 'success',
          })
        }
      } else {
        setStatus({ message: result.error || 'Analysis failed', type: 'error' })
      }
    } catch (error) {
      setStatus({ message: `Error: ${error}`, type: 'error' })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const togglePlayerExpansion = (summonerName: string) => {
    setExpandedPlayer(expandedPlayer === summonerName ? null : summonerName)
  }

  return (
    <div className="space-y-6">
      {/* Monitor Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Lobby Monitor</CardTitle>
          <CardDescription>
            Automatically detect and analyze players in your lobby
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <Button
              size="lg"
              variant={isMonitoring ? 'secondary' : 'default'}
              onClick={handleToggleMonitor}
              className="gap-2"
            >
              {isMonitoring ? (
                <>
                  <Square className="h-4 w-4" />
                  Stop Auto-Monitor
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Auto-Monitor
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleAnalyzeOnce}
              disabled={isAnalyzing}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              Analyze Once
            </Button>
          </div>

          {/* Status Message */}
          {status && (
            <div
              className={`flex items-center gap-2 p-3 rounded-md text-sm ${
                status.type === 'success'
                  ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900'
                  : status.type === 'error'
                  ? 'bg-red-950/50 text-red-400 border border-red-900'
                  : 'bg-blue-950/50 text-blue-400 border border-blue-900'
              }`}
            >
              {isMonitoring && status.type === 'success' && (
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
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
                    summonerName={player.player}
                    encounterCount={player.encounterCount}
                    wins={player.wins}
                    losses={player.losses}
                    tags={player.tags}
                    onClick={() => togglePlayerExpansion(player.player)}
                  />

                  {/* Expanded Match History */}
                  {expandedPlayer === player.player && player.games.length > 0 && (
                    <div className="ml-4 pl-4 border-l-2 border-muted space-y-2">
                      <p className="text-xs text-muted-foreground mb-2">
                        Recent games together:
                      </p>
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
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-12">
              <p>No active lobby detected.</p>
              <p className="text-sm mt-2">Start a game or enable auto-monitor to see analysis.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
