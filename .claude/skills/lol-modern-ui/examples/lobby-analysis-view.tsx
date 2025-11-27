import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlayerChip } from '@/components/PlayerChip'
import { MatchCard } from '@/components/MatchCard'
import { Play, Square } from 'lucide-react'

/**
 * Example: Lobby Analysis View
 *
 * This shows the complete layout when auto-monitor detects players
 * you've encountered before.
 *
 * Layout sections:
 * 1. Monitor controls (start/stop button)
 * 2. Quick summary (# of players detected)
 * 3. Player list with chips showing history
 * 4. Expandable match details
 */

function LobbyAnalysisView() {
  // Mock data
  const isMonitoring = true
  const detectedPlayers = [
    {
      summonerName: 'xXToxicPlayer99Xx',
      encounterCount: 3,
      wins: 1,
      losses: 2,
      tags: [
        { label: 'Toxic', variant: 'toxic' as const },
        { label: 'Rage Quit', variant: 'toxic' as const },
      ],
      matches: [
        {
          gameId: '1',
          champion: 'Yasuo',
          outcome: 'loss' as const,
          kda: { kills: 2, deaths: 12, assists: 1 },
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
        {
          gameId: '2',
          champion: 'Draven',
          outcome: 'loss' as const,
          kda: { kills: 5, deaths: 9, assists: 3 },
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          gameId: '3',
          champion: 'Master Yi',
          outcome: 'win' as const,
          kda: { kills: 18, deaths: 2, assists: 7 },
          timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      ],
    },
    {
      summonerName: 'GoodTeammateJane',
      encounterCount: 5,
      wins: 4,
      losses: 1,
      tags: [
        { label: 'Shotcaller', variant: 'positive' as const },
        { label: 'Friendly', variant: 'positive' as const },
      ],
      matches: [],
    },
    {
      summonerName: 'PossibleDuo123',
      encounterCount: 7,
      wins: 5,
      losses: 2,
      tags: [
        { label: 'Duo Queue', variant: 'info' as const },
      ],
      matches: [],
    },
  ]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Have We Meet?</h1>
            <p className="text-muted-foreground">Track your League of Legends encounters</p>
          </div>
        </div>

        {/* Monitor Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Lobby Monitor</CardTitle>
            <CardDescription>
              Automatically detect and analyze players in your lobby
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Button
              size="lg"
              variant={isMonitoring ? 'secondary' : 'default'}
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
            <Button variant="outline" size="lg">
              Analyze Once
            </Button>
          </CardContent>
        </Card>

        {/* Detection Summary */}
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
              Your history with players in this lobby
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {detectedPlayers.map((player) => (
              <div key={player.summonerName} className="space-y-3">
                <PlayerChip
                  summonerName={player.summonerName}
                  encounterCount={player.encounterCount}
                  wins={player.wins}
                  losses={player.losses}
                  tags={player.tags}
                />

                {/* Match History for this player (optional expansion) */}
                {player.matches.length > 0 && (
                  <div className="ml-4 pl-4 border-l-2 border-muted space-y-2">
                    <p className="text-xs text-muted-foreground mb-2">Recent games together:</p>
                    {player.matches.slice(0, 3).map((match) => (
                      <MatchCard key={match.gameId} {...match} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Empty State (shown when no detections) */}
        {/*
        <Card>
          <CardHeader>
            <CardTitle>Lobby Analysis</CardTitle>
            <CardDescription>
              Players you've encountered before will appear here
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-12">
              <p>No active lobby detected.</p>
              <p className="text-sm mt-2">Start a game to see analysis.</p>
            </div>
          </CardContent>
        </Card>
        */}
      </div>
    </div>
  )
}

export default LobbyAnalysisView
