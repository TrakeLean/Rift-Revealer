import { Swords, Users, Zap, Trophy, Gamepad2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GameMode, ModeStats } from '../types'

interface ModeStatsRowProps {
  byMode?: Record<GameMode, ModeStats>
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
  ARAM: {
    icon: Zap,
    color: 'text-purple-400',
    label: 'ARAM'
  },
  Arena: {
    icon: Swords,
    color: 'text-orange-400',
    label: 'Arena'
  },
  Other: {
    icon: Gamepad2,
    color: 'text-slate-400',
    label: 'Other'
  }
}

export function ModeStatsRow({ byMode }: ModeStatsRowProps) {
  if (!byMode) return null

  // Filter out modes with no games
  const modesWithGames = Object.entries(byMode).filter(
    ([_, stats]) => stats.asEnemy || stats.asAlly
  )

  if (modesWithGames.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="text-[10px] text-muted-foreground uppercase font-medium tracking-wide">
        By Game Mode
      </div>
      <div className="flex flex-wrap gap-2">
        {modesWithGames.map(([mode, stats]) => {
          const config = MODE_CONFIG[mode as GameMode]
          const Icon = config.icon
          const hasEnemy = stats.asEnemy && stats.asEnemy.games > 0
          const hasAlly = stats.asAlly && stats.asAlly.games > 0

          return (
            <div
              key={mode}
              className="flex-1 min-w-[140px] px-3 py-2 rounded-md border bg-card/50 border-border/50"
            >
              {/* Mode header */}
              <div className="flex items-center gap-1.5 mb-2">
                <Icon className={cn('h-3.5 w-3.5', config.color)} />
                <span className="text-xs font-medium">{config.label}</span>
              </div>

              {/* Stats */}
              <div className="flex gap-2 text-[11px]">
                {hasEnemy && (
                  <div className="flex-1">
                    <div className="text-[9px] text-red-400/70 uppercase mb-0.5">vs</div>
                    <div className={cn(
                      'font-medium',
                      stats.asEnemy!.winRate >= 60 ? 'text-emerald-400' :
                      stats.asEnemy!.winRate <= 40 ? 'text-red-400' :
                      'text-slate-300'
                    )}>
                      {stats.asEnemy!.wins}-{stats.asEnemy!.losses}
                    </div>
                  </div>
                )}
                {hasAlly && (
                  <div className="flex-1">
                    <div className="text-[9px] text-blue-400/70 uppercase mb-0.5">w/</div>
                    <div className={cn(
                      'font-medium',
                      stats.asAlly!.winRate >= 60 ? 'text-emerald-400' :
                      stats.asAlly!.winRate <= 40 ? 'text-red-400' :
                      'text-slate-300'
                    )}>
                      {stats.asAlly!.wins}-{stats.asAlly!.losses}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
