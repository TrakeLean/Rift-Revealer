# Enhanced Player Stats Proposal

## Current Display
```
▸ yingman#ying (51 games, 55% WR)
```

## Proposed Enhanced Display

### Option A: Compact View (Default)
```
┌─────────────────────────────────────────────────────────────┐
│ yingman#ying                                      51 games  │
├─────────────────────────────────────────────────────────────┤
│ As Enemy:  30 games • 60% WR • Last: 2 days ago            │
│ As Ally:   21 games • 48% WR • Avg KDA: 4.2                │
│ Recent:    Milio (Support) • W-L-W-W-L (3-2)               │
│ ⚠️  Wins 65% when playing Milio against you                 │
└─────────────────────────────────────────────────────────────┘
```

### Option B: Detailed View (Expandable)
```
┌─────────────────────────────────────────────────────────────┐
│ yingman#ying                                     ▼ 51 games │
├─────────────────────────────────────────────────────────────┤
│ VS ENEMY                                                    │
│ • Record: 12W - 18L (40% WR) 🔴                            │
│ • Last played: 2 days ago (Loss)                           │
│ • Recent form: L-L-W-L-L (1-4 last 5)                      │
│ • Most played: Milio (15 games, 67% WR vs you)             │
│ • Avg performance: 3/5/12 (4.0 KDA)                        │
│                                                             │
│ AS TEAMMATE                                                 │
│ • Record: 18W - 3L (86% WR) 🟢                             │
│ • Last played: 5 days ago (Win)                            │
│ • Recent form: W-W-W-W-L (4-1 last 5)                      │
│ • Most played: Thresh (8 games, 88% WR with you)           │
│                                                             │
│ RECENT GAMES (Last 5)                                       │
│ • 2 days ago  - Enemy - Milio   - Loss  - 1/2/8            │
│ • 3 days ago  - Enemy - Milio   - Loss  - 0/4/6            │
│ • 4 days ago  - Ally  - Thresh  - Win   - 2/1/15           │
│ • 5 days ago  - Ally  - Thresh  - Win   - 1/0/18           │
│ • 6 days ago  - Enemy - Milio   - Win   - 3/3/10           │
└─────────────────────────────────────────────────────────────┘
```

## Recommended: Hybrid Approach

**Default:** Show compact summary with key decision-making info
**Click to expand:** Show detailed stats

```tsx
<PlayerCard>
  <Header>
    yingman#ying • 51 encounters
  </Header>

  <QuickStats>
    {/* Color coded by threat level */}
    <StatBadge color="red">
      Enemy: 12-18 (40% WR)
    </StatBadge>
    <StatBadge color="green">
      Ally: 18-3 (86% WR)
    </StatBadge>
    <LastSeen>
      2d ago • Milio (Support)
    </LastSeen>
  </QuickStats>

  {/* Click to expand */}
  {isExpanded && (
    <DetailedStats>
      <Section title="Recent Form">
        Last 5 vs Enemy: L-L-W-L-L (1-4)
        Last 5 as Ally: W-W-W-W-L (4-1)
      </Section>

      <Section title="Champion Pool">
        Most played vs you: Milio (15g, 67% WR)
        Most played with you: Thresh (8g, 88% WR)
      </Section>

      <Section title="Performance">
        Avg KDA vs you: 1.3/3.2/8.7 (3.1 KDA)
        Avg KDA with you: 1.5/2.1/16.2 (8.4 KDA)
      </Section>
    </DetailedStats>
  )}
</PlayerCard>
```

## Key Stats Priority

### Tier 1 (Always Show):
1. Total encounters
2. Win rate as enemy
3. Win rate as ally
4. Last seen (time + champion + role)
5. Color-coded threat indicator

### Tier 2 (Show on Expand):
6. Recent form (last 5 games)
7. Most played champion against/with you
8. Last game result
9. Average performance (KDA)
10. Streak info

### Tier 3 (Optional):
11. Role preference
12. Best matchup
13. Time-of-day patterns
14. Dodge recommendation

## Color Coding System

```javascript
// Enemy WR against you
> 60% WR: 🔴 Red (Dangerous)
40-60%:   🟡 Yellow (Even)
< 40%:    🟢 Green (Easy)

// Ally WR with you
> 60% WR: 🟢 Green (Good teammate)
40-60%:   🟡 Yellow (Average)
< 40%:    🔴 Red (Avoid)
```

## Implementation Plan

1. **Update Database Query** - Calculate all stats
2. **Update AnalysisResult Type** - Add new fields
3. **Update PlayerChip Component** - Show compact stats
4. **Create StatsPanel Component** - Expandable detailed view
5. **Add Color Coding Logic** - Threat indicators

---

## Which approach do you prefer?

A. **Compact only** - Show 1-2 lines of key stats
B. **Hybrid** - Compact by default, click to expand
C. **Always detailed** - Show everything all the time

My recommendation: **B (Hybrid)** - Quick scanning + deep dive when needed
