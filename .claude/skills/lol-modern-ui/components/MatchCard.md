# MatchCard Component

## Location
`src/renderer/components/MatchCard.tsx`

## Purpose
Display a single game from match history with visual outcome indicator and KDA stats.

## Props

```typescript
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
```

## Usage

```tsx
import { MatchCard } from '@/components/MatchCard'

<MatchCard
  gameId="NA1_1234567890"
  champion="Jinx"
  outcome="win"
  kda={{ kills: 10, deaths: 3, assists: 15 }}
  timestamp={new Date('2024-01-15')}
  onClick={() => console.log('View details')}
/>
```

## Visual Features
- **Left border**: 4px thick, green (win) or red (loss)
- **Outcome badge**: Color-coded pill showing "Win" or "Loss"
- **KDA display**: Monospace font with color-coded deaths (red)
- **KDA ratio**: Calculated as (K+A)/D, shown prominently
- **Timestamp**: Relative time format ("2 days ago")
- **Hover effect**: Slight scale-up (`hover:scale-[1.02]`)

## Layout
```
┌─────────────────────────────────────────┐
│  Jinx                 [Win]        2d ago│
│  10 / 3 / 15  KDA: 8.33                 │
└─────────────────────────────────────────┘
```

## When to Use
- Match history lists
- Player encounter details
- Recent games display

## Responsive
- Stacks vertically on mobile
- Full width in grid layouts
