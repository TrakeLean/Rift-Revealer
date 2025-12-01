import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TagPill } from './TagPill'
import { ModeStatsRow } from './ModeStatsRow'
import { PlayerTagMenu } from './PlayerTagMenu'
import { cn } from '@/lib/utils'
import { User, ChevronDown, ChevronUp, Tag } from 'lucide-react'
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
  skinId?: number | null
  championName?: string
  championId?: number
  isExpanded?: boolean
}

export function PlayerChip({
  puuid,
  summonerName,
  encounterCount,
  tags: tagsProp,
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
  skinId,
  championName,
  championId,
  isExpanded = false,
}: PlayerChipProps) {
  const [tagMenuOpen, setTagMenuOpen] = useState(false)
  const [playerTags, setPlayerTags] = useState<any[]>(tagsProp || [])
  const [imageIndex, setImageIndex] = useState(0)
  const [skinImageSrc, setSkinImageSrc] = useState<string | null>(null)
  const isClickable = Boolean(onClick)

  // Load tags for this player
  const loadTags = async () => {
    try {
      if (!window.api?.getPlayerTags) {
        return
      }
      const result = await window.api.getPlayerTags(puuid)
      if (result.success) {
        setPlayerTags(result.tags)
      }
    } catch (error) {
      console.error('Failed to load tags:', error)
    }
  }

  // Keep local tag state in sync with provided props (useful for mock/dev data)
  useEffect(() => {
    if (!tagsProp) return
    const isSame =
      tagsProp.length === playerTags.length &&
      tagsProp.every((t, idx) => {
        const cur = playerTags[idx]
        return cur?.label === t.label && cur?.variant === t.variant
      })
    if (!isSame) {
      setPlayerTags(tagsProp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagsProp])

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

  // Load cached/fetched skin image from main process
  useEffect(() => {
    let cancelled = false
    async function loadSkinImage() {
      if (!window.api?.getSkinImage || skinId === null || skinId === undefined || championId === null || championId === undefined) {
        if (!cancelled) setSkinImageSrc(null)
        return
      }
      try {
        const result = await window.api.getSkinImage(skinId, championId)
        if (!cancelled) {
          if (result?.success && result.path) {
            setSkinImageSrc(result.path)
          } else {
            setSkinImageSrc(null)
          }
        }
      } catch (err) {
        if (!cancelled) setSkinImageSrc(null)
      }
    }
    loadSkinImage()
    return () => {
      cancelled = true
    }
  }, [skinId, championId])

  // Reset image fallback when source set changes
  useEffect(() => {
    setImageIndex(0)
  }, [skinId, profileIconId, championName, championId, skinImageSrc])

  const skinNum = typeof skinId === 'number' ? skinId % 1000 : undefined
  const champFromSkin = typeof skinId === 'number' ? Math.floor(skinId / 1000) : undefined
  const tileSources: string[] = []
  if (skinId !== null && skinId !== undefined) {
    tileSources.push(`/tiles/${skinId}.png`)
    if (champFromSkin !== undefined) {
      tileSources.push(`/tiles/${champFromSkin}_${skinNum ?? 0}.png`)
    }
    if (championId !== undefined && championId !== null) {
      tileSources.push(`/tiles/${championId}_${skinNum ?? 0}.png`)
    }
  }
  // Base champion tile fallbacks (no remote calls)
  if ((skinId === null || skinId === undefined) && championId !== undefined && championId !== null) {
    tileSources.push(`/tiles/${championId}_0.png`)
    tileSources.push(`/tiles/${championId}.png`)
  }
  const hasProfileIcon = profileIconId !== null && profileIconId !== undefined
  const defaultProfileIcon = '/profileicon/0.png' // Local fallback
  const sources = [
    skinImageSrc, // Cached/fetched skin tile from LCU assets
    ...tileSources, // Pre-bundled tiles if available
    hasProfileIcon ? `/profileicon/${profileIconId}.png` : defaultProfileIcon, // Profile icon fallback
    '/logo.png' // Final local placeholder
  ].filter(Boolean) as string[]
  const currentSrc = sources[imageIndex]

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
        'transition-all',
        isClickable && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="space-y-2.5">
          {/* Header - Player Name & Total Games - Single Line */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Profile/Skin/Champion Icon */}
              {currentSrc ? (
                <img
                  src={currentSrc}
                  alt={`${summonerName}'s avatar`}
                  className="h-10 w-10 rounded-md border border-border flex-shrink-0 object-cover"
                  onError={() => setImageIndex(i => i + 1)}
                />
              ) : null}
              <User className={cn("h-4 w-4 text-muted-foreground flex-shrink-0", currentSrc && "hidden")} />
              <span className="text-base font-semibold truncate">{summonerName}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 flex items-center gap-1.5"
                onClick={handleTagButtonClick}
                title="Tag player"
              >
                <Tag className={cn(
                  "h-3.5 w-3.5",
                  playerTags.length > 0 ? "text-primary" : "text-muted-foreground"
                )} />
                <span className="text-xs font-medium hidden sm:inline">Tag</span>
              </Button>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {encounterCount} {encounterCount === 1 ? 'game' : 'games'}
              </span>
              {isClickable && (
                isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )
              )}
            </div>
          </div>

          {/* Enhanced Stats Row - Horizontal, Larger Text */}
          {(asEnemy || asAlly) && (
            <div className="flex gap-4 text-sm flex-wrap">
              {/* Ally Stats (shown first) */}
              {asAlly && asAlly.games > 0 && (
                <div className="flex items-center gap-2 flex-1 min-w-[170px]">
                  <span className="text-xs text-emerald-400/70 uppercase font-medium">As Teammate:</span>
                  <span className={cn("font-bold", getAllyColor(allyQuality))}>
                    {asAlly.wins}-{asAlly.losses}
                  </span>
                  <span className={cn("text-xs", getAllyColor(allyQuality))}>
                    ({asAlly.winRate}%)
                  </span>
                </div>
              )}

              {/* Enemy Stats */}
              {asEnemy && asEnemy.games > 0 && (
                <div className="flex items-center gap-2 flex-1 min-w-[170px]">
                  <span className="text-xs text-red-400/70 uppercase font-medium">As Opponent:</span>
                  <span className={cn("font-bold", getThreatColor(threatLevel))}>
                    {asEnemy.wins}-{asEnemy.losses}
                  </span>
                  <span className={cn("text-xs", getThreatColor(threatLevel))}>
                    ({asEnemy.winRate}%)
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
                  <div key={idx} className="relative group">
                    <TagPill
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
                      className="cursor-default"
                    />
                    {tag.note && (
                      <div
                        className="pointer-events-none absolute left-0 top-full mt-1 inline-block rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-muted-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 whitespace-pre-wrap break-words"
                        style={{ width: 'max-content', maxWidth: '18rem' }}
                      >
                        {tag.note}
                      </div>
                    )}
                  </div>
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
