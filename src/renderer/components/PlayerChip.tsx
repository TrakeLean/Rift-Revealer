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
  username: string
  tagLine: string
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
  username,
  tagLine,
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
  const summonerName = `${username}#${tagLine}`
  const [tagMenuOpen, setTagMenuOpen] = useState(false)
  const [playerTags, setPlayerTags] = useState<any[]>(tagsProp || [])
  const [imageIndex, setImageIndex] = useState(0)
  const [skinImageSrc, setSkinImageSrc] = useState<string | null>(null)
  const [championImageSrc, setChampionImageSrc] = useState<string | null>(null)
  const isClickable = Boolean(onClick)

  const debugSkin = (label: string, detail?: unknown) => {
    // Limit noisy debug logging to non-production builds
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mode = (import.meta as any)?.env?.MODE
    if (mode && mode !== 'production') {
      console.debug(`[SkinDebug] ${summonerName}: ${label}`, detail ?? '')
    }
  }

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
    e.preventDefault()
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
        debugSkin('skip skin fetch', { reason: 'missing api or ids', skinId, championId, hasApi: Boolean(window.api?.getSkinImage) })
        if (!cancelled) setSkinImageSrc(null)
        return
      }
      try {
        const result = await window.api.getSkinImage(skinId, championId)
        debugSkin('skin fetch result', { skinId, championId, success: result?.success, path: result?.path })
        if (!cancelled) {
          if (result?.success && result.path) {
            setSkinImageSrc(result.path)
          } else {
            setSkinImageSrc(null)
          }
        }
      } catch (err) {
        debugSkin('skin fetch error', { skinId, championId, error: (err as Error)?.message })
        if (!cancelled) setSkinImageSrc(null)
      }
    }
    loadSkinImage()
    return () => {
      cancelled = true
    }
  }, [skinId, championId])

  // Load champion tile when no explicit skin is provided
  useEffect(() => {
    let cancelled = false
    async function loadChampTile() {
      if (!window.api?.getChampionTile || championId === null || championId === undefined) {
        if (!cancelled) setChampionImageSrc(null)
        return
      }
      try {
        const result = await window.api.getChampionTile(championId)
        if (!cancelled) {
          if (result?.success && result.path) {
            setChampionImageSrc(result.path)
          } else {
            setChampionImageSrc(null)
          }
        }
      } catch (err) {
        if (!cancelled) setChampionImageSrc(null)
      }
    }
    loadChampTile()
    return () => {
      cancelled = true
    }
  }, [championId, skinId])

  // Reset image fallback when source set changes
  useEffect(() => {
    setImageIndex(0)
    // If the champion tile finishes loading after we already fell back (e.g., to the logo),
    // retry from the top of the source list so the new tile can render.
  }, [skinId, profileIconId, championName, championId, skinImageSrc, championImageSrc])

  const skinNum = typeof skinId === 'number' ? skinId % 1000 : undefined
  const champFromSkin = typeof skinId === 'number' ? Math.floor(skinId / 1000) : undefined
  const champSlug = championName ? championName.toLowerCase().replace(/[^a-z0-9]/g, '') : null
  const tileSources: string[] = []
  // Base champion tile fallbacks (no remote calls); used until skin art is fetched
  if (championId !== undefined && championId !== null) {
    tileSources.push(`/tiles/${championId}_0.png`)
    tileSources.push(`/tiles/${championId}.png`)
  }
  const hasProfileIcon = profileIconId !== null && profileIconId !== undefined
  // Use relative paths so they resolve in both dev (http://localhost) and packaged file:// builds
  const defaultProfileIcon = 'profileicon/0.png'
  // Avatar should stay as a profile icon (never fall back to champion art)
  const avatarSources = [
    hasProfileIcon ? `profileicon/${profileIconId}.png` : null,
    defaultProfileIcon,
    'logo.png'
  ].filter(Boolean) as string[]
  const backgroundSrc = skinImageSrc || championImageSrc || tileSources[0] || null
  const currentSrc = avatarSources[imageIndex]

  // Helper to format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes} min ago`
    if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    const weeks = Math.floor(diffDays / 7)
    if (weeks < 5) return `${weeks} wk${weeks === 1 ? '' : 's'} ago`
    const months = Math.floor(diffDays / 30)
    return `${months} mo${months === 1 ? '' : 's'} ago`
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

  const backgroundStyle = backgroundSrc
    ? {
        backgroundImage: `url(${backgroundSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }
    : undefined
  const sectionTone = backgroundSrc ? 'bg-black/30' : 'bg-muted/20'
  const sectionClass = cn('inline-block max-w-full rounded-md px-2 py-1', sectionTone)

  return (
    <Card
      data-encounters={encounterCount}
      className={cn(
        'transition-all relative overflow-visible',
        isClickable && 'cursor-pointer',
        className
      )}
      style={backgroundStyle}
      onClick={onClick}
    >
      {backgroundSrc && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/45 to-black/30 pointer-events-none" />
      )}
      <CardContent className="p-2 relative z-10">
        <div className="space-y-1.5">
          {/* Header - Player Name & Total Games - Single Line */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Profile/Skin/Champion Icon */}
              {currentSrc ? (
                <img
                  src={currentSrc}
                  alt={`${summonerName}'s avatar`}
                  className="h-8 w-8 rounded-md border border-border flex-shrink-0 object-cover"
                  onError={() => setImageIndex(i => i + 1)}
                />
              ) : null}
              <User className={cn("h-4 w-4 text-muted-foreground flex-shrink-0", currentSrc && "hidden")} />
              <span className="text-sm font-semibold truncate leading-tight">{summonerName}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary/80 hover:bg-white/5"
                onPointerDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                onClick={handleTagButtonClick}
                title="Tag player"
              >
                <Tag className={cn(
                  "h-4 w-4",
                  playerTags.length > 0 ? "text-primary" : "text-muted-foreground"
                )} />
              </Button>
              <span className="text-[11px] font-medium text-muted-foreground bg-background/80 border border-border/60 rounded-md px-2 py-1 leading-none">
                {encounterCount} {encounterCount === 1 ? 'game' : 'games'} together
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
            <div className={sectionClass}>
              <div className="flex gap-2 text-[11px] flex-wrap items-center">
                {/* Ally Stats (shown first) */}
                {asAlly && asAlly.games > 0 && (
                  <div className="flex items-center gap-1 flex-1 min-w-[140px]">
                    <span className="text-[11px] text-emerald-400/70 uppercase font-medium">Teammate:</span>
                    <span className={cn("font-bold", getAllyColor(allyQuality))}>
                      {asAlly.wins}-{asAlly.losses}
                    </span>
                    <span className={cn("text-[11px]", getAllyColor(allyQuality))}>
                      ({asAlly.winRate}%)
                    </span>
                  </div>
                )}

                {/* Enemy Stats */}
                {asEnemy && asEnemy.games > 0 && (
                  <div className="flex items-center gap-1 flex-1 min-w-[140px]">
                    <span className="text-[11px] text-red-400/70 uppercase font-medium">Opponent:</span>
                    <span className={cn("font-bold", getThreatColor(threatLevel))}>
                      {asEnemy.wins}-{asEnemy.losses}
                    </span>
                    <span className={cn("text-[11px]", getThreatColor(threatLevel))}>
                      ({asEnemy.winRate}%)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mode-specific stats and meta row combined */}
          <ModeStatsRow byMode={byMode}>
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
                        className="pointer-events-none absolute left-0 top-full mt-1 inline-block rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-muted-foreground opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 whitespace-pre-wrap break-words z-50"
                        style={{ width: 'max-content', maxWidth: '18rem' }}
                      >
                        {tag.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {lastSeen && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-auto">
                <span>{formatTimeAgo(lastSeen.timestamp)}</span>
                <span>•</span>
                <span className="font-medium text-foreground/80">{lastSeen.champion}</span>
              </div>
            )}
          </ModeStatsRow>
        </div>
      </CardContent>

      {/* Tag Management Dialog */}
      <PlayerTagMenu
        open={tagMenuOpen}
        onOpenChange={setTagMenuOpen}
        puuid={puuid}
        username={username}
        tagLine={tagLine}
        existingTags={playerTags}
        onTagsUpdated={handleTagsUpdated}
      />
    </Card>
  )
}
