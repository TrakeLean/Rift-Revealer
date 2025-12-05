import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { TagPill } from './TagPill'
import { cn } from '@/lib/utils'
import { Tag, Flame, Star, Users, X, TrendingDown } from 'lucide-react'

interface PlayerTag {
  tag_type: 'toxic' | 'friendly' | 'notable' | 'duo' | 'weak'
  note: string | null
  created_at: number
}

interface PlayerTagMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  puuid: string
  username: string
  tagLine: string
  existingTags: PlayerTag[]
  onTagsUpdated: () => void
}

const TAG_DEFINITIONS = [
  {
    type: 'toxic' as const,
    label: 'Toxic',
    icon: Flame,
    description: 'Difficult or toxic player',
    variant: 'toxic' as const
  },
  {
    type: 'weak' as const,
    label: 'Weak',
    icon: TrendingDown,
    description: 'Unskilled or poor performance',
    variant: 'warning' as const
  },
  {
    type: 'friendly' as const,
    label: 'Friendly',
    icon: Users,
    description: 'Positive teammate',
    variant: 'positive' as const
  },
  {
    type: 'notable' as const,
    label: 'Notable',
    icon: Star,
    description: 'Skilled or noteworthy',
    variant: 'notable' as const
  },
  {
    type: 'duo' as const,
    label: 'Duo',
    icon: Users,
    description: 'Duo queue partner',
    variant: 'info' as const
  }
]

export function PlayerTagMenu({
  open,
  onOpenChange,
  puuid,
  username,
  tagLine,
  existingTags,
  onTagsUpdated
}: PlayerTagMenuProps) {
  const summonerName = `${username}#${tagLine}`
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Initialize state from existing tags when dialog opens or player changes.
  const lastInitKey = useRef<string | null>(null)

  useEffect(() => {
    if (!open) return;

    const initKey = `${puuid}|${JSON.stringify(existingTags)}`;
    if (lastInitKey.current === initKey) {
      return; // already initialized for this player/tag set
    }

    const tagSet = new Set(existingTags.map(t => t.tag_type));
    const noteMap: Record<string, string> = {};
    existingTags.forEach(t => {
      if (t.note) noteMap[t.tag_type] = t.note;
    });

    setSelectedTags(tagSet);
    setNotes(noteMap);
    lastInitKey.current = initKey;
  }, [open, puuid, existingTags]);

  const toggleTag = (tagType: string) => {
    const newTags = new Set(selectedTags)
    if (newTags.has(tagType)) {
      newTags.delete(tagType)
      // Clear note when tag is removed
      const newNotes = { ...notes }
      delete newNotes[tagType]
      setNotes(newNotes)
    } else {
      newTags.add(tagType)
    }
    setSelectedTags(newTags)
  }

  const handleNoteChange = (tagType: string, value: string) => {
    setNotes({ ...notes, [tagType]: value })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Remove tags that were unchecked
      for (const existingTag of existingTags) {
        if (!selectedTags.has(existingTag.tag_type)) {
          await window.api.removePlayerTag(puuid, existingTag.tag_type)
        }
      }

      // Add or update selected tags
      for (const tagType of selectedTags) {
        const note = notes[tagType] || null
        await window.api.addPlayerTag(puuid, username, tagLine, tagType, note)
      }

      onTagsUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save tags:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Tag Player
          </DialogTitle>
          <DialogDescription>
            Mark <span className="font-medium text-foreground">{summonerName}</span> with tags to remember them in future games
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tag Selection */}
          <div className="space-y-3">
            {TAG_DEFINITIONS.map((tagDef) => {
              const Icon = tagDef.icon
              const isSelected = selectedTags.has(tagDef.type)

              return (
                <div key={tagDef.type} className="space-y-2">
                  {/* Tag Toggle Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTag(tagDef.type)
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-md border transition-all",
                      "hover:bg-muted/30",
                      isSelected
                        ? "border-primary/50 bg-primary/10"
                        : "border-border bg-card"
                    )}
                  >
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                      isSelected
                        ? tagDef.variant === 'toxic' ? "bg-red-950/50 text-red-400" :
                          tagDef.variant === 'warning' ? "bg-orange-950/50 text-orange-400" :
                          tagDef.variant === 'positive' ? "bg-emerald-950/50 text-emerald-400" :
                          tagDef.variant === 'notable' ? "bg-yellow-950/50 text-yellow-400" :
                          "bg-blue-950/50 text-blue-400"
                        : "bg-muted text-muted-foreground"
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium text-sm">{tagDef.label}</div>
                      <div className="text-xs text-muted-foreground">{tagDef.description}</div>
                    </div>
                    {isSelected && (
                      <TagPill label={tagDef.label} variant={tagDef.variant} />
                    )}
                  </button>

                  {/* Note Input (only show if tag is selected) */}
                  {isSelected && (
                    <div className="pl-11 pr-3 space-y-1.5">
                      <Label htmlFor={`note-${tagDef.type}`} className="text-xs text-muted-foreground">
                        Optional note
                      </Label>
                      <Textarea
                        id={`note-${tagDef.type}`}
                        placeholder={`Add a note about this player...`}
                        value={notes[tagDef.type] || ''}
                        onChange={(e) => handleNoteChange(tagDef.type, e.target.value)}
                        className="min-h-[60px] text-xs"
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              onOpenChange(false)
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              handleSave()
            }}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Tags'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
