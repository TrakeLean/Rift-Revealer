---
name: lol-modern-ui
description: Enforce a modern, dark, esports-style UI for the League of Legends social tracker app using React, TypeScript, Tailwind CSS, and shadcn/ui. Prioritize visual hierarchy, quick scanning, and clear threat indicators.
tags: [ui, react, typescript, tailwind, shadcn, design-system, league-of-legends]
---

# LoL Modern UI Skill

## Purpose

This Skill ensures **consistent, high-quality UI development** for the "Have We Meet?" League of Legends lobby analyzer. Every UI component, page, and feature must follow this design system.

---

## Tech Stack

- **React 19** + **TypeScript 5**
- **Tailwind CSS 4** for utility styling
- **shadcn/ui** for base components (owned in `src/renderer/components/ui/`)
- **Framer Motion** for subtle animations
- **lucide-react** for icons
- **Electron** as the desktop framework

---

## Design Philosophy

### Visual Aesthetic
**"Dark, sleek esports client meets modern stats dashboard"**

Think:
- Riot Games' launcher
- Op.gg's clean stat displays
- Modern command centers (not flashy, **functional**)

### Core Principles

1. **Dark-first design** - Background `#020817` (slate-950), subtle borders, no harsh whites
2. **Information density** - Pack data efficiently, but with breathing room
3. **Visual hierarchy** - Most important info (player tags, win/loss) should pop instantly
4. **Color psychology** - Red = toxic/danger, Yellow = notable, Green = positive, Blue = info/duo
5. **Subtle motion** - Hover states, smooth transitions, no distracting animations

---

## Color System

Use **HSL variables** defined in `globals.css`:

### Background & Surface
- `bg-background` - Main app background (`#020817`)
- `bg-card` - Card surfaces (slightly lighter)
- `bg-muted` - Disabled/secondary backgrounds

### Semantic Colors
- `bg-primary` / `text-primary` - Emerald green (`#10b981`) - Success, win states, primary actions
- `bg-destructive` / `text-destructive` - Red (`#991b1b`) - Toxic players, losses, danger
- `bg-secondary` - Muted slate for secondary actions
- `text-muted-foreground` - Low-emphasis text

### Border & Dividers
- `border-border` - Subtle borders (use sparingly)
- Prefer **shadows** over borders when possible

### Custom Player Tag Colors

When creating `<TagPill>` or player indicators:

```tsx
// Toxic/difficult
className="bg-red-950/50 text-red-400 border-red-900"

// Notable/warning
className="bg-yellow-950/50 text-yellow-400 border-yellow-900"

// Positive/friendly
className="bg-emerald-950/50 text-emerald-400 border-emerald-900"

// Info/duo
className="bg-blue-950/50 text-blue-400 border-blue-900"
```

---

## Typography

- **Font family**: System font stack (already in `globals.css`)
- **Headings**: `font-semibold` or `font-bold`
- **Body**: `font-normal`

### Scale
- Page title: `text-3xl font-bold`
- Section header: `text-xl font-semibold`
- Card title: `text-lg font-semibold`
- Body text: `text-sm`
- Captions/meta: `text-xs text-muted-foreground`

---

## Layout Rules

### Max Width
- Main content: `max-w-7xl mx-auto`
- Constrained sections: `max-w-4xl`

### Spacing
- Page padding: `p-6`
- Section gaps: `space-y-6` or `gap-6`
- Card padding: `p-6` (header), `p-6 pt-0` (content)
- Tight spacing: `gap-3` or `space-y-3`

### Grid Layouts
- Match cards: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- Player lists: Vertical stacks with `space-y-2`

---

## Component Catalog

### Base Components (shadcn/ui)

Located in `src/renderer/components/ui/`

#### `<Button>`
```tsx
import { Button } from '@/components/ui/button'

<Button size="lg">Start Auto-Monitor</Button>
<Button variant="outline">Analyze Once</Button>
<Button variant="destructive">Clear History</Button>
<Button variant="ghost" size="icon">
  <Settings />
</Button>
```

**Variants**: `default` (primary green), `destructive`, `outline`, `secondary`, `ghost`, `link`
**Sizes**: `default`, `sm`, `lg`, `icon`

#### `<Card>`
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Lobby Analysis</CardTitle>
    <CardDescription>Players you've encountered</CardDescription>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>
```

**When to use**: Any grouped content, results, settings panels

---

### Custom Components

These must be built following this Skill's rules.

#### `<MatchCard>`
**Purpose**: Display a single game from history

**Required props**:
- `gameId: string`
- `champion: string` (name)
- `outcome: 'win' | 'loss'`
- `kda: { kills: number, deaths: number, assists: number }`
- `timestamp: Date`

**Visual requirements**:
- Left border: Green (win) or Red (loss) - 4px thick
- Champion icon (if available) or name
- K/D/A in format "10 / 3 / 15"
- Relative time "2 days ago"
- Outcome badge (Win/Loss)
- Hover: Subtle lift effect (`hover:scale-[1.02]`)

**Example structure**:
```tsx
<Card className={cn(
  "border-l-4 transition-transform hover:scale-[1.02]",
  outcome === 'win' ? "border-l-emerald-500" : "border-l-red-500"
)}>
  <CardContent className="p-4">
    {/* champion, KDA, time, outcome */}
  </CardContent>
</Card>
```

#### `<PlayerChip>` / `<PlayerRow>`
**Purpose**: Show a player you've met before

**Required props**:
- `summonerName: string`
- `encounterCount: number`
- `tags?: Array<{ label: string, color: 'red' | 'yellow' | 'green' | 'blue' }>`

**Visual requirements**:
- Player name prominent (`text-base font-medium`)
- Encounter count badge `"x3 games"`
- Tags as colored pills (see Color System above)
- Hover: Background highlight

#### `<TagPill>`
**Purpose**: Visual label for player traits

**Props**:
- `label: string`
- `variant: 'toxic' | 'notable' | 'positive' | 'info'`

**Rendering**:
```tsx
<span className={cn(
  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
  variantClasses[variant]
)}>
  {label}
</span>
```

#### `<Layout>`
**Purpose**: Consistent app structure with optional sidebar

**Structure**:
- Topbar with app title
- Optional sidebar (for settings, filters)
- Main content area (`flex-1`)

---

## Workflow: How to Use This Skill

When you receive a UI task, **follow these steps in order**:

### 1. Understand the Feature
Ask yourself:
- What data is displayed?
- What's the primary user action?
- What's the visual priority (what should users see first)?

### 2. Sketch Layout in Text
Before writing code, describe:
- Page sections (header, main content, footer)
- Card hierarchy
- Responsive behavior

Example:
> "Match History page: Header with title and filter button. Main area: grid of MatchCards (3 columns desktop, 1 mobile). Each card shows champion, KDA, outcome."

### 3. Identify Reusable Components
Check this catalog. **Never create a new primitive if a base component exists.**

Use:
- `<Button>` for actions
- `<Card>` for grouped content
- Custom components like `<MatchCard>` if they exist

Only create new components if:
- They'll be reused 3+ times
- They encapsulate complex logic
- They're documented in this Skill

### 4. Write React/TSX Code
Follow conventions:
- TypeScript interfaces for props
- Tailwind classes (no inline styles)
- Import from `@/` alias
- Use `cn()` utility for conditional classes

### 5. Self-Review
Check:
- ✅ Follows color system (no arbitrary colors)
- ✅ Uses semantic spacing (gap-4, p-6, not random values)
- ✅ Typography scale matches spec
- ✅ Dark theme looks good (no light mode needed)
- ✅ Hover states on interactive elements
- ✅ Responsive (works on smaller windows)

---

## Animation Guidelines

Use **Framer Motion** sparingly:

### Allowed Animations
- **List item entry**: Stagger children with `initial`, `animate`, `exit`
- **Card hover**: Scale slightly (`hover:scale-[1.02]`)
- **Page transitions**: Fade in with `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>`

### Forbidden
- Excessive bounce/spring effects
- Looping animations (except loading spinners)
- Anything that distracts from reading data

---

## Responsive Design

### Breakpoints (Tailwind defaults)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Mobile-First Strategy
1. Design for **small windows first** (800x600)
2. Use `md:` and `lg:` for desktop enhancements
3. Test window resizing

---

## Examples

See `.claude/skills/lol-modern-ui/examples/` for:
- `match-history-page.tsx` - Full page layout with grid
- `player-profile-card.tsx` - Detailed player card
- `lobby-analysis-view.tsx` - Real-time lobby results

---

## Common Mistakes to Avoid

❌ **Using arbitrary colors**: `bg-blue-500` instead of semantic tokens
✅ **Use semantic**: `bg-primary`, `bg-destructive`, `text-muted-foreground`

❌ **Creating new button styles**: Custom classes for every button
✅ **Use Button variants**: `<Button variant="outline">`

❌ **Inconsistent spacing**: `px-3 py-2 m-5 gap-7`
✅ **Stick to scale**: `p-4`, `gap-4`, `space-y-6`

❌ **Light mode assumptions**: Using dark text on light backgrounds
✅ **Dark-first**: Always test against `#020817` background

❌ **Over-engineering**: Building a reusable component for one-time use
✅ **Inline first**: Extract only after 3rd use

---

## Integration with Project

This Skill is automatically loaded when working in the `HaveWeMeet` repo if you've created a `CLAUDE.md` file that references it.

When asked to build UI:
1. State: "Using the `lol-modern-ui` Skill"
2. Follow the 5-step workflow above
3. Reference components from this catalog
4. Self-review against the checklist

---

## Maintenance

When adding new custom components:
1. Build them in `src/renderer/components/`
2. Document them in this SKILL.md under "Custom Components"
3. Add an example to `examples/` if complex
4. Update the component catalog table

---

## Questions?

If requirements are unclear or you need to make a design decision not covered here:
- Ask the user via `AskUserQuestion` tool
- Propose 2-3 options with trade-offs
- Wait for approval before implementing

---

**Remember**: This Skill exists to make you faster and more consistent. Every piece of UI should look like it came from the same design system.
