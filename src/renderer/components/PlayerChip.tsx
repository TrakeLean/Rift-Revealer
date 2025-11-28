import { Card, CardContent } from '@/components/ui/card'
import { TagPill } from './TagPill'
import { ModeStatsRow } from './ModeStatsRow'
import { cn } from '@/lib/utils'
import { User, ChevronDown } from 'lucide-react'
import type { SplitStats, GameMode, ModeStats } from '../types'

interface PlayerTag {
  label: string
  variant: 'toxic' | 'notable' | 'positive' | 'info'
}

interface PlayerChipProps {
  summonerName: string
  encounterCount: number
  tags?: PlayerTag[]
  wins?: number
  losses?: number
  onClick?: () => void
  className?: string
  // Enhanced stats
  asEnemy?: SplitStats
  asAlly?: SplitStats
  lastSeen?: {
    timestamp: Date
    champion: string
    role?: string
    outcome: 'win' | 'loss'
    isAlly: boolean
  }
  threatLevel?: 'high' | 'medium' | 'low'
  allyQuality?: 'good' | 'average' | 'poor'
  byMode?: Record<GameMode, ModeStats>
}

export function PlayerChip({
  summonerName,
  encounterCount,
  tags = [],
  wins = 0,
  losses = 0,
  onClick,
  className,
  asEnemy,
  asAlly,
  lastSeen,
  threatLevel,
  allyQuality,
  byMode,
}: PlayerChipProps) {
  // Helper to format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  // Get threat color based on level
  const getThreatColor = (level?: 'high' | 'medium' | 'low') => {
    if (!level) return 'text-muted-foreground'
    return {
      high: 'text-red-400',
      medium: 'text-yellow-400',
      low: 'text-emerald-400'
    }[level]
  }

  // Get ally quality color
  const getAllyColor = (quality?: 'good' | 'average' | 'poor') => {
    if (!quality) return 'text-muted-foreground'
    return {
      good: 'text-emerald-400',
      average: 'text-yellow-400',
      poor: 'text-red-400'
    }[quality]
  }

  return (
    <Card
      className={cn(
        'transition-all hover:bg-muted/50 cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header - Player Name & Total Games */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-base font-medium truncate">{summonerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {encounterCount} {encounterCount === 1 ? 'game' : 'games'}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Enhanced Stats Row */}
          {(asEnemy || asAlly) && (
            <div className="flex gap-3 text-xs">
              {/* Enemy Stats */}
              {asEnemy && asEnemy.games > 0 && (
                <div className={cn(
                  "flex-1 px-3 py-2 rounded-md border",
                  "bg-red-950/20 border-red-900/30"
                )}>
                  <div className="text-[10px] text-red-400/70 uppercase font-medium mb-1">
                    vs Enemy
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={cn("font-semibold", getThreatColor(threatLevel))}>
                      {asEnemy.wins}-{asEnemy.losses}
                    </span>
                    <span className={cn("text-[10px]", getThreatColor(threatLevel))}>
                      ({asEnemy.winRate}%)
                    </span>
                  </div>
                </div>
              )}

              {/* Ally Stats */}
              {asAlly && asAlly.games > 0 && (
                <div className={cn(
                  "flex-1 px-3 py-2 rounded-md border",
                  "bg-emerald-950/20 border-emerald-900/30"
                )}>
                  <div className="text-[10px] text-emerald-400/70 uppercase font-medium mb-1">
                    as Ally
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={cn("font-semibold", getAllyColor(allyQuality))}>
                      {asAlly.wins}-{asAlly.losses}
                    </span>
                    <span className={cn("text-[10px]", getAllyColor(allyQuality))}>
                      ({asAlly.winRate}%)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Last Seen Info */}
          {lastSeen && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatTimeAgo(lastSeen.timestamp)}</span>
              <span>•</span>
              <span className="font-medium text-foreground/80">{lastSeen.champion}</span>
              {lastSeen.role && (
                <>
                  <span>•</span>
                  <span className="capitalize">{lastSeen.role}</span>
                </>
              )}
            </div>
          )}

          {/* Mode-Specific Stats */}
          <ModeStatsRow byMode={byMode} />

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {tags.map((tag, idx) => (
                <TagPill key={idx} label={tag.label} variant={tag.variant} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
