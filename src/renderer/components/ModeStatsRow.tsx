import { ReactNode } from 'react'
import { Swords, Users, Zap, Trophy, Gamepad2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { GameMode, ModeStats } from '../types'

interface ModeStatsRowProps {
  byMode?: Record<GameMode, ModeStats>
  children?: ReactNode
  selectedMode?: GameMode | 'all'
  onModeSelect?: (mode: GameMode | 'all') => void
  onBadgeClick?: () => void // Callback to expand dropdown if collapsed
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

export function ModeStatsRow({ byMode, children, selectedMode = 'all', onModeSelect, onBadgeClick }: ModeStatsRowProps) {
  if (!byMode && !children) return null

  // Show modes with any recorded games
  const modesWithGames = byMode
    ? Object.entries(byMode).filter(([_, stats]) => {
        const totalGames = (stats.asEnemy?.games || 0) + (stats.asAlly?.games || 0)
        return totalGames > 0
      })
    : []

  if (modesWithGames.length === 0 && !children) return null

  const handleModeClick = (mode: GameMode | 'all', e: React.MouseEvent) => {
    e.stopPropagation()
    if (onModeSelect) {
      onModeSelect(mode)
    }
    if (onBadgeClick) {
      onBadgeClick()
    }
  }

  // Calculate total games across all modes
  const totalGames = modesWithGames.reduce((sum, [_, stats]) => {
    return sum + (stats.asEnemy?.games || 0) + (stats.asAlly?.games || 0)
  }, 0)

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {modesWithGames.map(([mode, stats]) => {
        const config = MODE_CONFIG[mode as GameMode]
        const Icon = config.icon
        const totalModeGames = (stats.asEnemy?.games || 0) + (stats.asAlly?.games || 0)
        const totalWins = (stats.asEnemy?.wins || 0) + (stats.asAlly?.wins || 0)
        const winRate = totalModeGames > 0 ? Math.round((totalWins / totalModeGames) * 100) : 0
        const isSelected = selectedMode === mode

        return (
          <div key={mode} className="relative group">
            <Badge
              variant={isSelected ? 'default' : 'outline'}
              className={cn(
                'cursor-pointer transition-all hover:scale-105 gap-1',
                isSelected && 'ring-1 ring-border bg-accent/50'
              )}
              onClick={(e) => handleModeClick(mode as GameMode, e)}
            >
              <Icon className={cn('h-3 w-3', config.color)} />
              <span className="text-xs font-medium">{config.label}: {winRate}%</span>
            </Badge>

            {/* Tooltip */}
            <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 w-48">
              <div className="rounded-lg border border-border bg-popover p-3 shadow-lg text-xs">
                <div className="font-medium mb-2">{config.label}</div>
                <div className="space-y-1 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Total Games:</span>
                    <span className="font-medium text-foreground">{totalModeGames}</span>
                  </div>
                  {stats.asAlly && stats.asAlly.games > 0 && (
                    <div className="flex justify-between">
                      <span>As Teammate:</span>
                      <span className="font-medium text-emerald-400">
                        {stats.asAlly.wins}-{stats.asAlly.losses} ({stats.asAlly.winRate}%)
                      </span>
                    </div>
                  )}
                  {stats.asEnemy && stats.asEnemy.games > 0 && (
                    <div className="flex justify-between">
                      <span>As Opponent:</span>
                      <span className="font-medium text-red-400">
                        {stats.asEnemy.wins}-{stats.asEnemy.losses} ({stats.asEnemy.winRate}%)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
      {children}
    </div>
  )
}
