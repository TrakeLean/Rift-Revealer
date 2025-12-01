import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TagPill } from '@/components/TagPill'
import { PlayerChip } from '@/components/PlayerChip'
import { StatsPanel } from '@/components/StatsPanel'
import type { GameMode, ModeStats, SplitStats, LastMatchRoster, RosterPlayer } from '@/types'

const tagSamples = [
  { label: 'Toxic', variant: 'toxic' as const },
  { label: 'Friendly', variant: 'positive' as const },
  { label: 'Notable', variant: 'notable' as const },
  { label: 'Duo', variant: 'info' as const },
]

type PlayerPreview = {
  puuid: string
  summonerName: string
  encounterCount: number
  wins: number
  losses: number
  tags: { label: string; variant: 'toxic' | 'notable' | 'positive' | 'info' }[]
  asEnemy: SplitStats
  asAlly: SplitStats
  lastSeen: {
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

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000)

const buildSplitStats = (stats: Partial<SplitStats>): SplitStats => {
  const { performance, topChampions, recentForm, ...rest } = stats

  return {
    games: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    recentForm: recentForm ?? [],
    topChampions: topChampions ?? [],
    performance: {
      avgKills: 0,
      avgDeaths: 0,
      avgAssists: 0,
      avgKDA: 0,
      ...(performance ?? {}),
    },
    roleStats: stats.roleStats ?? [],
    ...rest,
  }
}

const getRoleOrder = (player?: RosterPlayer) => {
  const rawRole = (player?.teamPosition || player?.role || player?.lane || '').toUpperCase()
  const orderMap: Record<string, number> = {
    TOP: 0,
    JUNGLE: 1,
    JG: 1,
    MIDDLE: 2,
    MID: 2,
    BOTTOM: 3,
    ADC: 3,
    DUO_CARRY: 3,
    UTILITY: 4,
    SUPPORT: 4
  }
  return orderMap[rawRole] ?? 99
}

const formatRoleLabel = (player?: RosterPlayer) => {
  const rawRole = (player?.teamPosition || player?.role || player?.lane || '').toUpperCase()
  const roleLabelMap: Record<string, string> = {
    TOP: 'Top',
    JUNGLE: 'Jungle',
    JG: 'Jungle',
    MIDDLE: 'Mid',
    MID: 'Mid',
    BOTTOM: 'ADC',
    ADC: 'ADC',
    DUO_CARRY: 'ADC',
    UTILITY: 'Support',
    SUPPORT: 'Support'
  }
  return roleLabelMap[rawRole] || null
}

const buildRosterRows = (players: RosterPlayer[]) => {
  const byTeam: Record<number, RosterPlayer[]> = {}
  players.forEach((p) => {
    const teamKey = typeof p.teamId === 'number' ? p.teamId : 0
    if (!byTeam[teamKey]) byTeam[teamKey] = []
    byTeam[teamKey].push(p)
  })

  const teamIds = Object.keys(byTeam).map(Number).sort((a, b) => a - b)

  if (teamIds.length === 2) {
    const leftTeamId = teamIds.includes(100) ? 100 : teamIds[0]
    const rightTeamId = teamIds.find((id) => id !== leftTeamId) ?? teamIds[1]

    const sortTeam = (teamPlayers: RosterPlayer[]) =>
      [...teamPlayers].sort((a, b) => {
        const roleDiff = getRoleOrder(a) - getRoleOrder(b)
        if (roleDiff !== 0) return roleDiff
        return (a.summonerName || '').localeCompare(b.summonerName || '')
      })

    const leftTeam = sortTeam(byTeam[leftTeamId] || [])
    const rightTeam = sortTeam(byTeam[rightTeamId] || [])
    const rows: Array<{ left?: RosterPlayer; right?: RosterPlayer }> = []
    const rowCount = Math.max(leftTeam.length, rightTeam.length)

    for (let i = 0; i < rowCount; i++) {
      rows.push({
        left: leftTeam[i],
        right: rightTeam[i]
      })
    }

    return { rows, leftLabel: 'Blue Team', rightLabel: 'Red Team' }
  }

  // Fallback for multi-team modes (e.g., Arena) or role-less queues
  const sorted = [...players].sort((a, b) => {
    if ((a.teamId ?? 0) !== (b.teamId ?? 0)) return (a.teamId ?? 0) - (b.teamId ?? 0)
    const roleDiff = getRoleOrder(a) - getRoleOrder(b)
    if (roleDiff !== 0) return roleDiff
    return (a.summonerName || '').localeCompare(b.summonerName || '')
  })

  const rowCount = Math.ceil(sorted.length / 2)
  const rows: Array<{ left?: RosterPlayer; right?: RosterPlayer }> = []
  for (let i = 0; i < rowCount; i++) {
    rows.push({
      left: sorted[i],
      right: sorted[i + rowCount]
    })
  }

  return { rows, leftLabel: 'Left', rightLabel: 'Right' }
}

const mockPlayers: PlayerPreview[] = [
  {
    puuid: 'dev-mock-1',
    summonerName: 'ShadowFang',
    encounterCount: 14,
    wins: 8,
    losses: 6,
    tags: [
      { label: 'Toxic', variant: 'toxic' },
      { label: 'Duo Partner', variant: 'info' },
    ],
    asEnemy: buildSplitStats({
      games: 9,
      wins: 6,
      losses: 3,
      winRate: 67,
      lastPlayed: daysAgo(2),
      recentForm: ['W', 'L', 'W', 'W', 'W'],
      topChampions: [
        { champion: 'Zed', games: 5, wins: 3, losses: 2, winRate: 60 },
        { champion: 'Akali', games: 3, wins: 2, losses: 1, winRate: 67 },
        { champion: 'Yone', games: 2, wins: 1, losses: 1, winRate: 50 },
      ],
      performance: {
        avgKills: 8.2,
        avgDeaths: 5.4,
        avgAssists: 4.1,
        avgKDA: 2.3,
      },
      roleStats: [
        { role: 'Mid', games: 6, wins: 4, losses: 2, winRate: 67 },
        { role: 'Jungle', games: 3, wins: 2, losses: 1, winRate: 67 },
      ],
    }),
    asAlly: buildSplitStats({
      games: 5,
      wins: 2,
      losses: 3,
      winRate: 40,
      lastPlayed: daysAgo(5),
      recentForm: ['L', 'W', 'L', 'L', 'W'],
      topChampions: [
        { champion: 'Ahri', games: 3, wins: 1, losses: 2, winRate: 33 },
        { champion: 'Orianna', games: 1, wins: 1, losses: 0, winRate: 100 },
      ],
      performance: {
        avgKills: 5.3,
        avgDeaths: 6.1,
        avgAssists: 8.4,
        avgKDA: 2.25,
      },
      roleStats: [
        { role: 'Mid', games: 3, wins: 1, losses: 2, winRate: 33 },
        { role: 'Jungle', games: 2, wins: 1, losses: 1, winRate: 50 },
      ],
    }),
    lastSeen: {
      timestamp: daysAgo(3),
      champion: 'Akali',
      role: 'Mid',
      outcome: 'win',
      isAlly: false,
    },
    threatLevel: 'high',
    allyQuality: 'average',
    byMode: {
      Ranked: {
        asEnemy: buildSplitStats({
          games: 6,
          wins: 4,
          losses: 2,
          winRate: 67,
          recentForm: ['W', 'L', 'W', 'W', 'W'],
          performance: { avgKills: 8.8, avgDeaths: 4.9, avgAssists: 4.2, avgKDA: 2.66 },
          roleStats: [
            { role: 'Mid', games: 4, wins: 3, losses: 1, winRate: 75 },
            { role: 'Jungle', games: 2, wins: 1, losses: 1, winRate: 50 },
          ],
        }),
        asAlly: buildSplitStats({
          games: 2,
          wins: 1,
          losses: 1,
          winRate: 50,
          recentForm: ['W', 'L'],
          performance: { avgKills: 6.1, avgDeaths: 5.0, avgAssists: 7.2, avgKDA: 2.66 },
          roleStats: [
            { role: 'Mid', games: 1, wins: 1, losses: 0, winRate: 100 },
            { role: 'Jungle', games: 1, wins: 0, losses: 1, winRate: 0 },
          ],
        }),
      },
      Normal: {
        asEnemy: buildSplitStats({
          games: 2,
          wins: 1,
          losses: 1,
          winRate: 50,
          performance: { avgKills: 7.0, avgDeaths: 6.0, avgAssists: 5.0, avgKDA: 2.0 },
          roleStats: [
            { role: 'Mid', games: 2, wins: 1, losses: 1, winRate: 50 },
          ],
        }),
        asAlly: null,
      },
      ARAM: {
        asEnemy: null,
        asAlly: buildSplitStats({
          games: 1,
          wins: 1,
          losses: 0,
          winRate: 100,
          performance: { avgKills: 9.0, avgDeaths: 5.0, avgAssists: 12.0, avgKDA: 4.2 },
          roleStats: [
            { role: 'Mid', games: 1, wins: 1, losses: 0, winRate: 100 },
          ],
        }),
      },
      Arena: { asEnemy: null, asAlly: null },
      Other: { asEnemy: null, asAlly: null },
    },
    profileIconId: 5417,
  },
  {
    puuid: 'dev-mock-2',
    summonerName: 'RuneScholar',
    encounterCount: 6,
    wins: 4,
    losses: 2,
    tags: [
      { label: 'Friendly', variant: 'positive' },
      { label: 'Notable', variant: 'notable' },
    ],
    asEnemy: buildSplitStats({
      games: 2,
      wins: 1,
      losses: 1,
      winRate: 50,
      lastPlayed: daysAgo(10),
      recentForm: ['W', 'L'],
      topChampions: [
        { champion: 'Viktor', games: 1, wins: 1, losses: 0, winRate: 100 },
        { champion: 'Twisted Fate', games: 1, wins: 0, losses: 1, winRate: 0 },
      ],
      performance: {
        avgKills: 6,
        avgDeaths: 5.5,
        avgAssists: 9,
        avgKDA: 2.73,
      },
      roleStats: [
        { role: 'Mid', games: 2, wins: 1, losses: 1, winRate: 50 },
      ],
    }),
    asAlly: buildSplitStats({
      games: 4,
      wins: 3,
      losses: 1,
      winRate: 75,
      lastPlayed: daysAgo(8),
      recentForm: ['W', 'W', 'L', 'W'],
      topChampions: [
        { champion: 'Janna', games: 2, wins: 2, losses: 0, winRate: 100 },
        { champion: 'Lux', games: 1, wins: 0, losses: 1, winRate: 0 },
      ],
      performance: {
        avgKills: 2.4,
        avgDeaths: 3.1,
        avgAssists: 14.2,
        avgKDA: 5.35,
      },
      roleStats: [
        { role: 'Support', games: 3, wins: 3, losses: 0, winRate: 100 },
        { role: 'Mid', games: 1, wins: 0, losses: 1, winRate: 0 },
      ],
    }),
    lastSeen: {
      timestamp: daysAgo(8),
      champion: 'Janna',
      role: 'Support',
      outcome: 'loss',
      isAlly: true,
    },
    threatLevel: 'low',
    allyQuality: 'good',
    byMode: {
      Ranked: {
        asEnemy: buildSplitStats({
          games: 1,
          wins: 0,
          losses: 1,
          winRate: 0,
          performance: { avgKills: 5, avgDeaths: 6, avgAssists: 7, avgKDA: 2.0 },
          roleStats: [
            { role: 'Support', games: 1, wins: 0, losses: 1, winRate: 0 },
          ],
        }),
        asAlly: buildSplitStats({
          games: 2,
          wins: 2,
          losses: 0,
          winRate: 100,
          performance: { avgKills: 2.0, avgDeaths: 2.5, avgAssists: 15.0, avgKDA: 6.8 },
          roleStats: [
            { role: 'Support', games: 2, wins: 2, losses: 0, winRate: 100 },
          ],
        }),
      },
      Normal: {
        asEnemy: null,
        asAlly: buildSplitStats({
          games: 1,
          wins: 1,
          losses: 0,
          winRate: 100,
          performance: { avgKills: 3.0, avgDeaths: 2.0, avgAssists: 12.0, avgKDA: 7.5 },
          roleStats: [
            { role: 'Support', games: 1, wins: 1, losses: 0, winRate: 100 },
          ],
        }),
      },
      ARAM: {
        asEnemy: null,
        asAlly: buildSplitStats({
          games: 1,
          wins: 0,
          losses: 1,
          winRate: 0,
          performance: { avgKills: 6.0, avgDeaths: 4.0, avgAssists: 10.0, avgKDA: 4.0 },
          roleStats: [
            { role: 'Support', games: 1, wins: 0, losses: 1, winRate: 0 },
          ],
        }),
      },
      Arena: { asEnemy: null, asAlly: null },
      Other: { asEnemy: null, asAlly: null },
    },
    profileIconId: 509,
  },
]

const mockRosterStandard: LastMatchRoster = {
  matchId: 'MOCK-GAME-123',
  queueId: 420,
  gameCreation: Date.now() - 1000 * 60 * 42,
  userTeamId: 100,
  players: [
    { puuid: 'mock-top-blue', summonerName: 'BlueTop', championName: 'Garen', teamId: 100, teamPosition: 'TOP', profileIconId: 23, win: true },
    { puuid: 'mock-jg-blue', summonerName: 'BlueJungle', championName: 'Lee Sin', teamId: 100, teamPosition: 'JUNGLE', profileIconId: 56, win: true },
    { puuid: 'mock-mid-blue', summonerName: 'BlueMid', championName: 'Ahri', teamId: 100, teamPosition: 'MIDDLE', profileIconId: 98, win: true },
    { puuid: 'mock-adc-blue', summonerName: 'BlueADC', championName: 'Jinx', teamId: 100, teamPosition: 'BOTTOM', profileIconId: 321, win: true },
    { puuid: 'mock-sup-blue', summonerName: 'BlueSupport', championName: 'Thresh', teamId: 100, teamPosition: 'UTILITY', profileIconId: 412, win: true },
    { puuid: 'mock-top-red', summonerName: 'RedTop', championName: 'Darius', teamId: 200, teamPosition: 'TOP', profileIconId: 122, win: false },
    { puuid: 'mock-jg-red', summonerName: 'RedJungle', championName: 'Kayn', teamId: 200, teamPosition: 'JUNGLE', profileIconId: 141, win: false },
    { puuid: 'mock-mid-red', summonerName: 'RedMid', championName: 'Syndra', teamId: 200, teamPosition: 'MIDDLE', profileIconId: 134, win: false },
    { puuid: 'mock-adc-red', summonerName: 'RedADC', championName: 'Caitlyn', teamId: 200, teamPosition: 'BOTTOM', profileIconId: 51, win: false },
    { puuid: 'mock-sup-red', summonerName: 'RedSupport', championName: 'Leona', teamId: 200, teamPosition: 'UTILITY', profileIconId: 89, win: false },
  ],
}

const mockRosterArena: LastMatchRoster = {
  matchId: 'MOCK-ARENA-888',
  queueId: 1700,
  gameCreation: Date.now() - 1000 * 60 * 5,
  userTeamId: 2,
  players: Array.from({ length: 16 }).map((_, idx) => ({
    puuid: `arena-${idx}`,
    summonerName: `ArenaPlayer${idx + 1}`,
    championName: ['Teemo', 'Garen', 'Lux', 'Zed', 'Ashe', 'Diana', 'Yasuo', 'Janna'][idx % 8],
    teamId: Math.floor(idx / 2) + 1,
    profileIconId: 500 + idx,
    win: idx < 4, // first two teams "win" for demo
  })),
}

export function DevPlayground() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>TagPill Preview</CardTitle>
          <CardDescription>Quick visual check of the TagPill variants while in dev mode.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {tagSamples.map((tag) => (
              <TagPill key={tag.variant} label={tag.label} variant={tag.variant} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Adjust labels or variants here during development without navigating other screens.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Player Card Preview</CardTitle>
          <CardDescription>Mock data wired into PlayerChip + StatsPanel for fast styling tweaks.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockPlayers.map((player) => (
            <div key={player.puuid} className="space-y-3">
              <PlayerChip
                puuid={player.puuid}
                summonerName={player.summonerName}
                encounterCount={player.encounterCount}
                wins={player.wins}
                losses={player.losses}
                tags={player.tags}
                asEnemy={player.asEnemy}
                asAlly={player.asAlly}
                lastSeen={player.lastSeen}
                threatLevel={player.threatLevel}
                allyQuality={player.allyQuality}
                byMode={player.byMode}
                profileIconId={player.profileIconId}
              />

              <StatsPanel asEnemy={player.asEnemy} asAlly={player.asAlly} />
            </div>
          ))}

          <p className="text-xs text-muted-foreground">
            Tweak the mockPlayers array above to preview different states (ally/enemy heavy, tags, modes).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Last Match Roster Preview (5v5)</CardTitle>
          <CardDescription>Scoreboard-style layout used when idle — tags still available on each card.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Queue: Ranked Solo/Duo • Played {new Date(mockRosterStandard.gameCreation).toLocaleTimeString()}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {buildRosterRows(mockRosterStandard.players).rows.flatMap((row, idx) => [
              <div key={`blue-${idx}`} className="space-y-1">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Blue Team</div>
                <PlayerChip
                  puuid={row.left?.puuid || `empty-blue-${idx}`}
                  summonerName={row.left?.summonerName || 'Empty slot'}
                  encounterCount={row.left ? 1 : 0}
                  wins={row.left?.win ? 1 : 0}
                  losses={row.left && !row.left.win ? 1 : 0}
                  lastSeen={
                    row.left
                      ? {
                          timestamp: new Date(mockRosterStandard.gameCreation),
                          champion: row.left.championName || 'Unknown',
                          role: formatRoleLabel(row.left) || undefined,
                          outcome: row.left.win ? 'win' : 'loss',
                          isAlly: row.left.teamId === mockRosterStandard.userTeamId,
                        }
                      : undefined
                  }
                  profileIconId={row.left?.profileIconId ?? undefined}
                  className="border border-border/70 bg-muted/30"
                />
              </div>,
              <div key={`red-${idx}`} className="space-y-1">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Red Team</div>
                <PlayerChip
                  puuid={row.right?.puuid || `empty-red-${idx}`}
                  summonerName={row.right?.summonerName || 'Empty slot'}
                  encounterCount={row.right ? 1 : 0}
                  wins={row.right?.win ? 1 : 0}
                  losses={row.right && !row.right.win ? 1 : 0}
                  lastSeen={
                    row.right
                      ? {
                          timestamp: new Date(mockRosterStandard.gameCreation),
                          champion: row.right.championName || 'Unknown',
                          role: formatRoleLabel(row.right) || undefined,
                          outcome: row.right.win ? 'win' : 'loss',
                          isAlly: row.right.teamId === mockRosterStandard.userTeamId,
                        }
                      : undefined
                  }
                  profileIconId={row.right?.profileIconId ?? undefined}
                  className="border border-border/70 bg-muted/30"
                />
              </div>,
            ])}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Arena / Multi-Team Roster Preview</CardTitle>
          <CardDescription>Fallback layout for role-less or &gt;10-player queues (e.g., Arena).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Queue: Arena • Played {new Date(mockRosterArena.gameCreation).toLocaleTimeString()}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {buildRosterRows(mockRosterArena.players).rows.flatMap((row, idx) => [
              <div key={`arena-left-${idx}`} className="space-y-1">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Left</div>
                <PlayerChip
                  puuid={row.left?.puuid || `arena-left-${idx}`}
                  summonerName={row.left?.summonerName || 'Empty slot'}
                  encounterCount={row.left ? 1 : 0}
                  wins={row.left?.win ? 1 : 0}
                  losses={row.left && !row.left.win ? 1 : 0}
                  lastSeen={
                    row.left
                      ? {
                          timestamp: new Date(mockRosterArena.gameCreation),
                          champion: row.left.championName || 'Unknown',
                          role: formatRoleLabel(row.left) || undefined,
                          outcome: row.left.win ? 'win' : 'loss',
                          isAlly: row.left.teamId === mockRosterArena.userTeamId,
                        }
                      : undefined
                  }
                  profileIconId={row.left?.profileIconId ?? undefined}
                  className="border border-border/70 bg-muted/30"
                />
              </div>,
              <div key={`arena-right-${idx}`} className="space-y-1">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Right</div>
                <PlayerChip
                  puuid={row.right?.puuid || `arena-right-${idx}`}
                  summonerName={row.right?.summonerName || 'Empty slot'}
                  encounterCount={row.right ? 1 : 0}
                  wins={row.right?.win ? 1 : 0}
                  losses={row.right && !row.right.win ? 1 : 0}
                  lastSeen={
                    row.right
                      ? {
                          timestamp: new Date(mockRosterArena.gameCreation),
                          champion: row.right.championName || 'Unknown',
                          role: formatRoleLabel(row.right) || undefined,
                          outcome: row.right.win ? 'win' : 'loss',
                          isAlly: row.right.teamId === mockRosterArena.userTeamId,
                        }
                      : undefined
                  }
                  profileIconId={row.right?.profileIconId ?? undefined}
                  className="border border-border/70 bg-muted/30"
                />
              </div>,
            ])}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
