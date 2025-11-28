import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, Target, Users } from 'lucide-react'
import type { SplitStats } from '../types'

interface StatsPanelProps {
  asEnemy?: SplitStats
  asAlly?: SplitStats
  className?: string
}

export function StatsPanel({ asEnemy, asAlly, className }: StatsPanelProps) {
  // Helper to render recent form badges
  const renderRecentForm = (form: ('W' | 'L')[]) => {
    if (form.length === 0) return null

    return (
      <div className="flex gap-1">
        {form.map((result, idx) => (
          <div
            key={idx}
            className={cn(
              "w-6 h-6 rounded-sm flex items-center justify-center text-[10px] font-bold",
              result === 'W'
                ? "bg-emerald-950/50 text-emerald-400 border border-emerald-900"
                : "bg-red-950/50 text-red-400 border border-red-900"
            )}
          >
            {result}
          </div>
        ))}
      </div>
    )
  }

  // Helper to render performance stats
  const renderPerformance = (stats?: SplitStats) => {
    if (!stats || stats.games === 0) return null

    const kda = stats.performance.avgKDA
    const kdaColor = kda >= 3 ? 'text-emerald-400' : kda >= 2 ? 'text-yellow-400' : 'text-red-400'

    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Avg KDA:</span>
        <span className="font-mono">
          {stats.performance.avgKills.toFixed(1)} / {' '}
          {stats.performance.avgDeaths.toFixed(1)} / {' '}
          {stats.performance.avgAssists.toFixed(1)}
        </span>
        <span className={cn("font-semibold", kdaColor)}>
          ({kda.toFixed(2)})
        </span>
      </div>
    )
  }

  // Helper to render top champions
  const renderTopChampions = (stats?: SplitStats) => {
    if (!stats || stats.topChampions.length === 0) return null

    return (
      <div className="space-y-1.5">
        {stats.topChampions.slice(0, 3).map((champ, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-xs p-2 rounded bg-muted/30"
          >
            <span className="font-medium text-foreground/90">{champ.champion}</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {champ.games}g
              </span>
              <span className={cn(
                "font-semibold",
                champ.winRate >= 60 ? "text-emerald-400" :
                champ.winRate >= 40 ? "text-yellow-400" :
                "text-red-400"
              )}>
                {champ.winRate}%
              </span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Card className={cn("border-l-4 border-l-muted", className)}>
      <CardContent className="p-4 space-y-4">
        {/* Enemy Stats Section */}
        {asEnemy && asEnemy.games > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-red-400" />
              <h4 className="text-sm font-semibold text-red-400 uppercase tracking-wide">
                vs Enemy
              </h4>
              <div className="flex-1 h-px bg-red-900/30" />
            </div>

            {/* Record & Form */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Record:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {asEnemy.wins}W - {asEnemy.losses}L
                  </span>
                  <span className={cn(
                    "text-xs font-semibold",
                    asEnemy.winRate >= 60 ? "text-red-400" :
                    asEnemy.winRate >= 40 ? "text-yellow-400" :
                    "text-emerald-400"
                  )}>
                    ({asEnemy.winRate}% WR)
                  </span>
                </div>
              </div>

              {asEnemy.recentForm.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Recent form:</span>
                  {renderRecentForm(asEnemy.recentForm)}
                </div>
              )}
            </div>

            {/* Performance */}
            {renderPerformance(asEnemy)}

            {/* Top Champions */}
            {asEnemy.topChampions.length > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase mb-2">
                  Most Played vs You
                </div>
                {renderTopChampions(asEnemy)}
              </div>
            )}
          </div>
        )}

        {/* Divider between sections */}
        {asEnemy && asEnemy.games > 0 && asAlly && asAlly.games > 0 && (
          <div className="h-px bg-border" />
        )}

        {/* Ally Stats Section */}
        {asAlly && asAlly.games > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-400" />
              <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">
                as Teammate
              </h4>
              <div className="flex-1 h-px bg-emerald-900/30" />
            </div>

            {/* Record & Form */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Record:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    {asAlly.wins}W - {asAlly.losses}L
                  </span>
                  <span className={cn(
                    "text-xs font-semibold",
                    asAlly.winRate >= 60 ? "text-emerald-400" :
                    asAlly.winRate >= 40 ? "text-yellow-400" :
                    "text-red-400"
                  )}>
                    ({asAlly.winRate}% WR)
                  </span>
                </div>
              </div>

              {asAlly.recentForm.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Recent form:</span>
                  {renderRecentForm(asAlly.recentForm)}
                </div>
              )}
            </div>

            {/* Performance */}
            {renderPerformance(asAlly)}

            {/* Top Champions */}
            {asAlly.topChampions.length > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase mb-2">
                  Most Played with You
                </div>
                {renderTopChampions(asAlly)}
              </div>
            )}
          </div>
        )}

        {/* No data message */}
        {(!asEnemy || asEnemy.games === 0) && (!asAlly || asAlly.games === 0) && (
          <div className="text-center text-muted-foreground py-4 text-xs">
            No detailed stats available
          </div>
        )}
      </CardContent>
    </Card>
  )
}
