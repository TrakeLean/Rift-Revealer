import { ReactNode } from 'react'
import { Swords, Users, Zap, Trophy, Gamepad2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GameMode, ModeStats } from '../types'

interface ModeStatsRowProps {
  byMode?: Record<GameMode, ModeStats>
  children?: ReactNode
}

const MODE_CONFIG: Record<GameMode, { icon: typeof Swords; color: string; label: string }> = {
  Ranked: {
    icon: Trophy,
    color: 'text-amber-400',
    label: 'Ranked'
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

export function ModeStatsRow({ byMode, children }: ModeStatsRowProps) {
  if (!byMode && !children) return null

  // Filter out modes with no games
  const modesWithGames = byMode
    ? Object.entries(byMode).filter(([_, stats]) => stats.asEnemy || stats.asAlly)
    : []

  if (modesWithGames.length === 0 && !children) return null

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {modesWithGames.map(([mode, stats]) => {
        const config = MODE_CONFIG[mode as GameMode]
        const Icon = config.icon
        const hasEnemy = stats.asEnemy && stats.asEnemy.games > 0
        const hasAlly = stats.asAlly && stats.asAlly.games > 0

        return (
          <div
            key={mode}
            className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md border bg-card/50 border-border/50"
          >
            {/* Mode icon & label */}
            <div className="flex items-center gap-1.5">
              <Icon className={cn('h-3.5 w-3.5', config.color)} />
              <span className="text-xs font-medium text-muted-foreground">{config.label}:</span>
            </div>

            {/* Compact stats */}
            <div className="flex items-center gap-2 text-xs font-medium">
              {hasEnemy && (
                <span className={cn(
                  stats.asEnemy!.winRate >= 60 ? 'text-emerald-400' :
                  stats.asEnemy!.winRate <= 40 ? 'text-red-400' :
                  'text-slate-300'
                )}>
                  {stats.asEnemy!.wins}-{stats.asEnemy!.losses}
                </span>
              )}
              {hasEnemy && hasAlly && (
                <span className="text-muted-foreground/50">|</span>
              )}
              {hasAlly && (
                <span className={cn(
                  'opacity-70',
                  stats.asAlly!.winRate >= 60 ? 'text-emerald-400' :
                  stats.asAlly!.winRate <= 40 ? 'text-red-400' :
                  'text-slate-300'
                )}>
                  {stats.asAlly!.wins}-{stats.asAlly!.losses}
                </span>
              )}
            </div>
          </div>
        )
      })}
      {children}
    </div>
  )
}
