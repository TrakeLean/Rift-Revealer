import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TagPill } from './TagPill'
import { ModeStatsRow } from './ModeStatsRow'
import { PlayerTagMenu } from './PlayerTagMenu'
import { cn } from '@/lib/utils'
import { User, ChevronDown, Tag } from 'lucide-react'
import type { SplitStats, GameMode, ModeStats } from '../types'

interface PlayerTag {
  label: string
  variant: 'toxic' | 'notable' | 'positive' | 'info'
}

interface PlayerChipProps {
  puuid: string
  summonerName: string
  encounterCount: number
  tags?: PlayerTag[]
  wins?: number
  losses?: number
  onClick?: () => void
  className?: string
  onTagsUpdated?: () => void
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
  profileIconId?: number | null
}

export function PlayerChip({
  puuid,
  summonerName,
  encounterCount,
  tags = [],
  wins = 0,
  losses = 0,
  onClick,
  className,
  onTagsUpdated,
  asEnemy,
  asAlly,
  lastSeen,
  threatLevel,
  allyQuality,
  byMode,
  profileIconId,
}: PlayerChipProps) {
  const [tagMenuOpen, setTagMenuOpen] = useState(false)
  const [playerTags, setPlayerTags] = useState<any[]>([])

  // Load tags for this player
  const loadTags = async () => {
    try {
      const result = await window.api.getPlayerTags(puuid)
      if (result.success) {
        setPlayerTags(result.tags)
      }
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }

  const handleTagsUpdated = () => {
    loadTags()
    if (onTagsUpdated) {
      onTagsUpdated()
    }
  }

  const handleTagButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card onClick from firing
    setTagMenuOpen(true)
  }

  // Load tags on mount
  useEffect(() => {
    loadTags()
  }, [puuid])

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
      <CardContent className="p-3">
        <div className="space-y-2.5">
          {/* Header - Player Name & Total Games - Single Line */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Profile Icon */}
              {profileIconId ? (
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/14.23.1/img/profileicon/${profileIconId}.png`}
                  alt={`${summonerName}'s profile icon`}
                  className="h-8 w-8 rounded-full border-2 border-border flex-shrink-0"
                  onError={(e) => {
                    // Fallback to user icon if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <User className={cn("h-4 w-4 text-muted-foreground flex-shrink-0", profileIconId && "hidden")} />
              <span className="text-base font-semibold truncate">{summonerName}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleTagButtonClick}
                title="Tag player"
              >
                <Tag className={cn(
                  "h-3.5 w-3.5",
                  playerTags.length > 0 ? "text-primary" : "text-muted-foreground"
                )} />
              </Button>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {encounterCount} {encounterCount === 1 ? 'game' : 'games'}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Enhanced Stats Row - Horizontal, Larger Text */}
          {(asEnemy || asAlly) && (
            <div className="flex gap-4 text-sm">
              {/* Enemy Stats */}
              {asEnemy && asEnemy.games > 0 && (
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs text-red-400/70 uppercase font-medium">vs Enemy:</span>
                  <span className={cn("font-bold", getThreatColor(threatLevel))}>
                    {asEnemy.wins}-{asEnemy.losses}
                  </span>
                  <span className={cn("text-xs", getThreatColor(threatLevel))}>
                    ({asEnemy.winRate}%)
                  </span>
                </div>
              )}

              {/* Ally Stats */}
              {asAlly && asAlly.games > 0 && (
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs text-emerald-400/70 uppercase font-medium">as Ally:</span>
                  <span className={cn("font-bold", getAllyColor(allyQuality))}>
                    {asAlly.wins}-{asAlly.losses}
                  </span>
                  <span className={cn("text-xs", getAllyColor(allyQuality))}>
                    ({asAlly.winRate}%)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mode-Specific Stats - Compact Badges */}
          <ModeStatsRow byMode={byMode} />

          {/* Tags & Last Seen - Single Row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Tags */}
            {playerTags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {playerTags.map((tag, idx) => (
                  <TagPill
                    key={idx}
                    label={
                      tag.tag_type === 'toxic' ? 'Toxic' :
                      tag.tag_type === 'friendly' ? 'Friendly' :
                      tag.tag_type === 'notable' ? 'Notable' :
                      'Duo'
                    }
                    variant={
                      tag.tag_type === 'toxic' ? 'toxic' :
                      tag.tag_type === 'friendly' ? 'positive' :
                      tag.tag_type === 'notable' ? 'notable' :
                      'info'
                    }
                  />
                ))}
              </div>
            )}

            {/* Last Seen Info */}
            {lastSeen && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                <span>{formatTimeAgo(lastSeen.timestamp)}</span>
                <span>•</span>
                <span className="font-medium text-foreground/80">{lastSeen.champion}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Tag Management Dialog */}
      <PlayerTagMenu
        open={tagMenuOpen}
        onOpenChange={setTagMenuOpen}
        puuid={puuid}
        summonerName={summonerName}
        existingTags={playerTags}
        onTagsUpdated={handleTagsUpdated}
      />
    </Card>
  )
}
