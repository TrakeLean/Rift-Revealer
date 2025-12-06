import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Filter, Swords, Users, Zap, Trophy, Gamepad2, ChevronDown } from 'lucide-react'
import type { GameMode, AnalysisResult, RosterPlayer, ModeStats } from '../types'

interface ModeFilterProps {
  selectedModes: Set<GameMode>
  onModesChange: (modes: Set<GameMode>) => void
  players?: (AnalysisResult | RosterPlayer)[] // Optional: pass players to show stats in tooltips
}

const MODE_CONFIG: Record<GameMode, { icon: typeof Swords; color: string; label: string }> = {
  'Solo/Duo': {
    icon: Trophy,
    color: 'text-amber-400',
    label: 'Solo/Duo'
  },
  Flex: {
    icon: Trophy,
    color: 'text-yellow-400',
    label: 'Flex'
  },
  Normal: {
    icon: Users,
    color: 'text-blue-400',
    label: 'Normal'
  },
  ARAM: { icon: Zap, color: 'text-purple-400', label: 'ARAM' },
  Arena: { icon: Swords, color: 'text-orange-400', label: 'Arena' },
  Other: { icon: Gamepad2, color: 'text-slate-400', label: 'Other' }
}

const ALL_MODES: GameMode[] = ['Solo/Duo', 'Flex', 'Normal', 'ARAM', 'Arena', 'Other']

export function ModeFilter({ selectedModes, onModesChange, players = [] }: ModeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMode = (mode: GameMode) => {
    const newModes = new Set(selectedModes)
    if (newModes.has(mode)) {
      newModes.delete(mode)
    } else {
      newModes.add(mode)
    }
    onModesChange(newModes)
  }

  const clearAll = () => {
    onModesChange(new Set())
    setIsOpen(false)
  }

  const selectedCount = selectedModes.size

  // Calculate stats for each mode across all players
  const getModeStats = (mode: GameMode) => {
    let totalGames = 0
    let asEnemyGames = 0
    let asAllyGames = 0
    let asEnemyWins = 0
    let asAllyWins = 0

    players.forEach(player => {
      const modeStats = player.byMode?.[mode]
      if (modeStats) {
        if (modeStats.asEnemy) {
          asEnemyGames += modeStats.asEnemy.games
          asEnemyWins += modeStats.asEnemy.wins
        }
        if (modeStats.asAlly) {
          asAllyGames += modeStats.asAlly.games
          asAllyWins += modeStats.asAlly.wins
        }
        totalGames += (modeStats.asEnemy?.games || 0) + (modeStats.asAlly?.games || 0)
      }
    })

    return {
      totalGames,
      asEnemyGames,
      asAllyGames,
      asEnemyWinRate: asEnemyGames > 0 ? Math.round((asEnemyWins / asEnemyGames) * 100) : 0,
      asAllyWinRate: asAllyGames > 0 ? Math.round((asAllyWins / asAllyGames) * 100) : 0
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2"
      >
        <Filter className="h-4 w-4" />
        <span className="text-xs">
          {selectedCount === 0 ? 'All Modes' : `${selectedCount} Mode${selectedCount > 1 ? 's' : ''}`}
        </span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-lg border border-border bg-popover p-3 shadow-lg">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Filter by Mode</span>
                {selectedCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                )}
              </div>

              <div className="space-y-1.5">
                {ALL_MODES.map(mode => {
                  const config = MODE_CONFIG[mode]
                  const Icon = config.icon
                  const isSelected = selectedModes.has(mode)
                  const stats = getModeStats(mode)
                  const hasStats = stats.totalGames > 0

                  return (
                    <div key={mode} className="relative group">
                      <button
                        onClick={() => toggleMode(mode)}
                        className={cn(
                          "w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                          isSelected
                            ? "bg-accent/50 border border-border"
                            : "hover:bg-accent/30"
                        )}
                      >
                        <div className={cn(
                          "h-4 w-4 rounded border flex items-center justify-center flex-shrink-0",
                          isSelected ? "bg-primary border-primary" : "border-border"
                        )}>
                          {isSelected && (
                            <div className="h-2 w-2 rounded-sm bg-primary-foreground" />
                          )}
                        </div>
                        <Icon className={cn('h-3.5 w-3.5', config.color)} />
                        <span className="font-medium">{config.label}</span>
                        {hasStats && (
                          <span className="ml-auto text-xs text-muted-foreground">
                            {stats.totalGames}G
                          </span>
                        )}
                      </button>

                      {/* Tooltip */}
                      {hasStats && (
                        <div className="pointer-events-none absolute left-full ml-2 top-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 w-48">
                          <div className="rounded-lg border border-border bg-popover p-3 shadow-lg text-xs">
                            <div className="font-medium mb-2">{config.label}</div>
                            <div className="space-y-1 text-muted-foreground">
                              <div className="flex justify-between">
                                <span>Total Games:</span>
                                <span className="font-medium text-foreground">{stats.totalGames}</span>
                              </div>
                              {stats.asAllyGames > 0 && (
                                <div className="flex justify-between">
                                  <span>As Teammate:</span>
                                  <span className="font-medium text-emerald-400">
                                    {stats.asAllyGames}G ({stats.asAllyWinRate}%)
                                  </span>
                                </div>
                              )}
                              {stats.asEnemyGames > 0 && (
                                <div className="flex justify-between">
                                  <span>As Opponent:</span>
                                  <span className="font-medium text-red-400">
                                    {stats.asEnemyGames}G ({stats.asEnemyWinRate}%)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                {selectedCount === 0
                  ? 'Showing stats from all modes'
                  : `Combining stats from ${selectedCount} mode${selectedCount > 1 ? 's' : ''}`
                }
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
