import { cn } from '@/lib/utils'
import type { PlayerRank } from '../types'

interface RankBadgeProps {
  rank: PlayerRank | null
  className?: string
  size?: 'sm' | 'md'
}

export function RankBadge({ rank, className, size = 'sm' }: RankBadgeProps) {
  if (!rank) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/40 px-2 py-1',
          size === 'sm' ? 'text-[10px]' : 'text-xs',
          className
        )}
      >
        <span className="text-muted-foreground font-medium">Unranked</span>
      </div>
    )
  }

  // Get tier color
  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      IRON: 'text-zinc-400',
      BRONZE: 'text-amber-700',
      SILVER: 'text-slate-300',
      GOLD: 'text-yellow-400',
      PLATINUM: 'text-teal-400',
      EMERALD: 'text-emerald-400',
      DIAMOND: 'text-blue-400',
      MASTER: 'text-purple-400',
      GRANDMASTER: 'text-red-400',
      CHALLENGER: 'text-cyan-300'
    }
    return colors[tier] || 'text-muted-foreground'
  }

  // Get tier display name (capitalize first letter)
  const tierDisplay = rank.tier.charAt(0) + rank.tier.slice(1).toLowerCase()

  // Format division (I, II, III, IV) - not shown for Master+
  const showDivision = rank.division && !['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(rank.tier)

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-background/80 px-2 py-1',
        size === 'sm' ? 'text-[10px]' : 'text-xs',
        className
      )}
      title={`${tierDisplay} ${showDivision ? rank.division + ' ' : ''}${rank.leaguePoints} LP - ${rank.wins}W ${rank.losses}L`}
    >
      <span className={cn('font-bold', getTierColor(rank.tier))}>
        {tierDisplay}
      </span>
      {showDivision && (
        <span className={cn('font-semibold', getTierColor(rank.tier))}>
          {rank.division}
        </span>
      )}
      <span className="text-muted-foreground">
        {rank.leaguePoints} LP
      </span>
    </div>
  )
}
