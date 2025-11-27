import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface MatchCardProps {
  gameId: string
  champion: string
  outcome: 'win' | 'loss'
  kda: {
    kills: number
    deaths: number
    assists: number
  }
  timestamp: Date
  onClick?: () => void
}

export function MatchCard({ champion, outcome, kda, timestamp, onClick }: MatchCardProps) {
  const isWin = outcome === 'win'
  const kdaRatio = kda.deaths === 0 ? kda.kills + kda.assists : ((kda.kills + kda.assists) / kda.deaths).toFixed(2)

  return (
    <Card
      className={cn(
        'border-l-4 transition-transform hover:scale-[1.02] cursor-pointer',
        isWin ? 'border-l-emerald-500' : 'border-l-red-500'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="text-lg font-semibold">{champion}</div>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium',
                  isWin
                    ? 'bg-emerald-950/50 text-emerald-400'
                    : 'bg-red-950/50 text-red-400'
                )}
              >
                {isWin ? 'Win' : 'Loss'}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-4 text-sm">
              <div className="font-mono">
                <span className="text-foreground">{kda.kills}</span>
                <span className="text-muted-foreground"> / </span>
                <span className="text-red-400">{kda.deaths}</span>
                <span className="text-muted-foreground"> / </span>
                <span className="text-foreground">{kda.assists}</span>
              </div>
              <div className="text-muted-foreground">
                KDA: <span className="text-foreground font-medium">{kdaRatio}</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(timestamp, { addSuffix: true })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
