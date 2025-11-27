import { Card, CardContent } from '@/components/ui/card'
import { TagPill } from './TagPill'
import { cn } from '@/lib/utils'
import { User } from 'lucide-react'

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
}

export function PlayerChip({
  summonerName,
  encounterCount,
  tags = [],
  wins = 0,
  losses = 0,
  onClick,
  className,
}: PlayerChipProps) {
  const totalGames = wins + losses
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0

  return (
    <Card
      className={cn(
        'transition-colors hover:bg-muted/50 cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Player Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-base font-medium truncate">{summonerName}</span>
            </div>

            {/* Encounter Badge */}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">
                {encounterCount} {encounterCount === 1 ? 'game' : 'games'}
              </span>
              {totalGames > 0 && (
                <span className="text-xs">
                  <span className="text-emerald-400">{wins}W</span>
                  <span className="text-muted-foreground"> - </span>
                  <span className="text-red-400">{losses}L</span>
                  <span className="text-muted-foreground"> • </span>
                  <span className={cn(
                    winRate >= 60 ? "text-emerald-400" :
                    winRate >= 40 ? "text-foreground" :
                    "text-red-400"
                  )}>
                    {winRate}%
                  </span>
                </span>
              )}
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="mt-2 flex gap-1.5 flex-wrap">
                {tags.map((tag, idx) => (
                  <TagPill key={idx} label={tag.label} variant={tag.variant} />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
