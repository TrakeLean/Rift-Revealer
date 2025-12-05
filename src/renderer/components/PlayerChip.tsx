import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TagPill } from './TagPill'
import { ModeStatsRow } from './ModeStatsRow'
import { PlayerTagMenu } from './PlayerTagMenu'
import { RankBadge } from './RankBadge'
import { cn } from '@/lib/utils'
import { User, ChevronDown, ChevronUp, Tag } from 'lucide-react'
import type { SplitStats, GameMode, ModeStats } from '../types'

// Global cache for validated image URLs (persists across component remounts)
const imageValidationCache = new Map<string, boolean>()

// Format champion names by adding spaces before capital letters
const formatChampionName = (name: string): string => {
  if (!name) return name
  // Add space before capital letters (except the first one)
  return name.replace(/([A-Z])/g, ' $1').trim()
}

interface PlayerTag {
  label: string
  variant: 'toxic' | 'notable' | 'positive' | 'info'
}

interface PlayerRank {
  tier: 'IRON' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'EMERALD' | 'DIAMOND' | 'MASTER' | 'GRANDMASTER' | 'CHALLENGER'
  division?: 'I' | 'II' | 'III' | 'IV'
  leaguePoints: number
  wins: number
  losses: number
  lastUpdated?: number
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
  rank?: PlayerRank | null
  ddragonVersion?: string // Optional prop from parent to avoid re-fetching
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
  rank,
  ddragonVersion: ddragonVersionProp,
}: PlayerChipProps) {
  const summonerName = `${username}#${tagLine}`
  const [tagMenuOpen, setTagMenuOpen] = useState(false)
  const [playerTags, setPlayerTags] = useState<any[]>(tagsProp || [])
  const [skinImageSrc, setSkinImageSrc] = useState<string | null>(null)
  const [ddragonVersion, setDdragonVersion] = useState<string>(ddragonVersionProp || '15.24.1') // Use prop or fallback
  const isClickable = Boolean(onClick)

  const debugSkin = (label: string, detail?: unknown) => {
    // Limit noisy debug logging to non-production builds
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mode = (import.meta as any)?.env?.MODE
    if (mode && mode !== 'production') {
      console.debug(`[SkinDebug] ${summonerName}: ${label}`, detail ?? '')
    }
  }

  // Fetch Data Dragon version on mount (only if not provided as prop)
  useEffect(() => {
    if (ddragonVersionProp) {
      // Version provided by parent, no need to fetch
      return
    }

    const fetchVersion = async () => {
      try {
        const result = await window.api.getDDragonVersion()
        if (result.success && result.version) {
          setDdragonVersion(result.version)
        }
      } catch (error) {
        // Keep using fallback version - silent fail
      }
    }
    fetchVersion()
  }, [ddragonVersionProp])

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

  // Load skin image from main process (Data Dragon CDN)
  useEffect(() => {
    let cancelled = false
    async function loadSkinImage() {
      if (!window.api?.getSkinImage || skinId === null || skinId === undefined || !championName) {
        debugSkin('skip skin fetch', { reason: 'missing params', skinId, championName, hasApi: Boolean(window.api?.getSkinImage) })
        if (!cancelled) setSkinImageSrc(null)
        return
      }
      try {
        const result = await window.api.getSkinImage(skinId, championName)
        debugSkin('skin fetch result', { skinId, championName, success: result?.success, path: result?.path })
        if (!cancelled) {
          if (result?.success && result.path) {
            // Test if the URL is accessible by trying to load it
            const img = new Image()
            img.onload = () => {
              if (!cancelled) setSkinImageSrc(result.path)
            }
            img.onerror = () => {
              // If skin image fails, fall back to default champion splash (skin 0)
              debugSkin('skin image load failed, falling back to default', { skinId, championName })
              const defaultSkinId = parseInt(String(championId || 0) + '000')
              if (!cancelled && skinId !== defaultSkinId) {
                // Try loading default skin
                window.api.getSkinImage(defaultSkinId, championName).then(fallbackResult => {
                  if (!cancelled && fallbackResult?.success && fallbackResult.path) {
                    setSkinImageSrc(fallbackResult.path)
                  } else {
                    setSkinImageSrc(null)
                  }
                }).catch(() => {
                  if (!cancelled) setSkinImageSrc(null)
                })
              } else {
                setSkinImageSrc(null)
              }
            }
            img.src = result.path
          } else {
            setSkinImageSrc(null)
          }
        }
      } catch (err) {
        debugSkin('skin fetch error', { skinId, championName, error: (err as Error)?.message })
        if (!cancelled) setSkinImageSrc(null)
      }
    }
    loadSkinImage()
    return () => {
      cancelled = true
    }
  }, [skinId, championName, championId])


  const hasProfileIcon = profileIconId !== null && profileIconId !== undefined

  // Use Data Dragon CDN for profile icons (no local storage needed)
  // Using dynamic version fetched from Riot's API
  // useMemo ensures URLs update when ddragonVersion changes
  const avatarSources = useMemo(() => {
    const defaultProfileIcon = `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/profileicon/0.png`
    const sources = [
      hasProfileIcon ? `https://ddragon.leagueoflegends.com/cdn/${ddragonVersion}/img/profileicon/${profileIconId}.png` : null,
      defaultProfileIcon,
      'logo.png'
    ].filter(Boolean) as string[]
    return sources
  }, [ddragonVersion, hasProfileIcon, profileIconId])

  // Preload and validate avatar image to prevent 403 console spam
  const [validatedAvatar, setValidatedAvatar] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const validateImage = async (url: string): Promise<boolean> => {
      // Check cache first
      const cached = imageValidationCache.get(url)
      if (cached !== undefined) {
        return cached
      }

      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          imageValidationCache.set(url, true)
          resolve(true)
        }
        img.onerror = () => {
          imageValidationCache.set(url, false)
          resolve(false)
        }
        img.src = url
      })
    }

    const findValidImage = async () => {
      for (const src of avatarSources) {
        if (cancelled) break

        // Logo.png is always valid, no need to validate
        if (src === 'logo.png') {
          setValidatedAvatar(src)
          break
        }

        const isValid = await validateImage(src)
        if (isValid && !cancelled) {
          setValidatedAvatar(src)
          break
        }
      }
    }

    findValidImage()

    return () => {
      cancelled = true
    }
  }, [avatarSources])

  const backgroundSrc = skinImageSrc // Skin background from Community Dragon CDN
  const currentSrc = validatedAvatar

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
        backgroundPosition: 'center 20%'
      }
    : undefined
  const sectionTone = backgroundSrc ? 'bg-black/30' : 'bg-muted/20'
  const sectionClass = cn('w-fit max-w-full rounded-md px-2 py-1', sectionTone)

  return (
    <Card
      data-encounters={encounterCount}
      className={cn(
        'transition-all relative overflow-visible h-full',
        isClickable && 'cursor-pointer',
        className
      )}
      style={backgroundStyle}
      onClick={onClick}
    >
      {backgroundSrc && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/45 to-black/30 pointer-events-none" />
      )}
      <CardContent className="p-2 relative z-10 h-full">
        <div className="space-y-1.5 h-full flex flex-col">
          {/* Header - Player Name & Total Games - Single Line */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Profile/Skin/Champion Icon */}
              {currentSrc ? (
                <img
                  src={currentSrc}
                  alt={`${summonerName}'s avatar`}
                  className="h-8 w-8 rounded-md border border-border flex-shrink-0 object-cover"
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
                onClick={handleTagButtonClick}
                title="Tag player"
              >
                <Tag className={cn(
                  "h-4 w-4",
                  playerTags.length > 0 ? "text-primary" : "text-muted-foreground"
                )} />
              </Button>
              {encounterCount > 0 && (
                <span className="text-[11px] font-medium text-muted-foreground bg-background/80 border border-border/60 rounded-md px-2 py-1 leading-none">
                  {encounterCount} {encounterCount === 1 ? 'game' : 'games'}
                </span>
              )}
              {/* DISABLED: Rank display requires production API key - see DEVELOPMENT.md */}
              {/* {rank !== undefined && <RankBadge rank={rank} size="sm" />} */}
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
                  <div className="flex items-center gap-1">
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
                  <div className="flex items-center gap-1">
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
          {encounterCount > 0 ? (
            <ModeStatsRow byMode={byMode}>
              {/* For non-user cards (encounterCount > 0), show tags inline */}
              {playerTags.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {playerTags.map((tag, idx) => (
                    <div key={idx} className="relative group">
                      <TagPill
                        label={
                          tag.tag_type === 'toxic' ? 'Toxic' :
                          tag.tag_type === 'weak' ? 'Weak' :
                          tag.tag_type === 'friendly' ? 'Friendly' :
                          tag.tag_type === 'notable' ? 'Notable' :
                          'Duo'
                        }
                        variant={
                          tag.tag_type === 'toxic' ? 'toxic' :
                          tag.tag_type === 'weak' ? 'warning' :
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

              {/* Show champion name for non-user cards */}
              {(() => {
                const champToShow = lastSeen?.champion || championName
                return champToShow ? (
                  <div className="flex items-center gap-1.5 text-xs ml-auto">
                    <span className="font-medium text-foreground/80">{formatChampionName(champToShow)}</span>
                  </div>
                ) : null
              })()}
            </ModeStatsRow>
          ) : (
            /* Empty spacer for user card to match visual spacing of other cards */
            <div className="flex-1" />
          )}

          {/* For user card (encounterCount === 0), show champion name and tags together in same row */}
          {encounterCount === 0 && (playerTags.length > 0 || championName || lastSeen?.champion) && (
            <div className="flex flex-wrap gap-2 items-center">
              {/* Tags first (left side) */}
              {playerTags.map((tag, idx) => (
                <div key={idx} className="relative group">
                  <TagPill
                    label={
                      tag.tag_type === 'toxic' ? 'Toxic' :
                      tag.tag_type === 'weak' ? 'Weak' :
                      tag.tag_type === 'friendly' ? 'Friendly' :
                      tag.tag_type === 'notable' ? 'Notable' :
                      'Duo'
                    }
                    variant={
                      tag.tag_type === 'toxic' ? 'toxic' :
                      tag.tag_type === 'weak' ? 'warning' :
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

              {/* Champion name last (right side) */}
              {(() => {
                const champToShow = lastSeen?.champion || championName
                return champToShow ? (
                  <div className="flex items-center gap-1.5 text-xs ml-auto">
                    <span className="font-medium text-foreground/80">{formatChampionName(champToShow)}</span>
                  </div>
                ) : null
              })()}
            </div>
          )}
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
