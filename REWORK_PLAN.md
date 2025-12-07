# Lobby & Roster System Rework Plan

## Current Problems

1. **Over-defensive deduplication** - Multiple layers filtering out valid players
2. **Unclear data flow** - Hard to trace where data comes from and when it updates
3. **Excessive re-renders** - Component rebuilds unnecessarily
4. **Confusing logs** - Too much noise, hard to debug
5. **Race conditions** - Cache clearing at wrong times

## Core Principles

### Last Match Roster (Static Data)
- **Purpose**: Show the 10 players from your most recent game
- **Data Source**: Database query - ONE match, ONE time
- **No Deduplication Needed**: Database guarantees uniqueness per match
- **Update Trigger**: Only when a new game is imported

### Players You've Met (Dynamic Data)
- **Purpose**: Show players from current lobby that you've played with before
- **Data Source**: Compare live lobby against database history
- **Deduplication**: Only at source (LCU API) - ONE layer only
- **Update Trigger**: When lobby changes (ChampSelect/InProgress states)

## Implementation Plan

### Phase 1: Clean Up Last Match Roster

#### Step 1.1: Remove Frontend Deduplication
- **File**: `src/renderer/pages/LobbyAnalysis.tsx`
- **Action**: Remove deduplication in `buildRosterRows` for roster data
- **Reason**: Database already guarantees unique players per match
- **Log**: `[LastRoster] Displaying {count} players from match {matchId}`

#### Step 1.2: Simplify Database Query
- **File**: `src/database/db.js`
- **Action**: Keep existing deduplication (prevents database corruption edge cases)
- **Log**: `[DB] Retrieved {count} players for match {matchId}`

#### Step 1.3: Add Match ID Tracking
- **File**: `src/renderer/pages/LobbyAnalysis.tsx`
- **Action**: Track `lastLoadedMatchId` to prevent unnecessary reloads
- **Log**: `[LastRoster] Loading match {matchId}` (only when ID changes)

### Phase 2: Clean Up Players You've Met

#### Step 2.1: Single Deduplication Layer
- **File**: `src/api/lcuConnector.js`
- **Action**: Keep ONLY this deduplication (already implemented)
- **Reason**: League Client API sometimes returns duplicates
- **Log**: `[LCU] Retrieved {count} unique players from lobby`

#### Step 2.2: Remove Backend Deduplication
- **File**: `src/main.js`
- **Action**: Remove deduplication in `analyzeLobbyPlayers`
- **Reason**: LCU connector already handles this
- **Log**: `[Backend] Analyzing {count} players from LCU`

#### Step 2.3: Remove Frontend Deduplication
- **File**: `src/renderer/pages/LobbyAnalysis.tsx`
- **Action**: Remove deduplication in `onLobbyUpdate` handler
- **Reason**: Backend already has clean data
- **Log**: `[Frontend] Received {count} players with history`

### Phase 3: Smart Cache Management

#### Step 3.1: Define Clear Cache Lifecycle

**Last Match Roster Cache:**
- **Load**: On app launch, after game import
- **Clear**: Never (until new game imported)
- **Trigger**: `lastLoadedMatchId !== newMatchId`

**Players You've Met Cache:**
- **Load**: When entering ChampSelect/InProgress
- **Clear**: When exiting to Lobby/None state
- **Trigger**: Gameflow state changes

#### Step 3.2: Remove Aggressive Clearing
- **File**: `src/renderer/pages/LobbyAnalysis.tsx`
- **Action**: Only clear detected players when exiting live states
- **Remove**: Clearing on entering live state (causes race conditions)

### Phase 4: Structured Logging

#### Step 4.1: Logging Conventions

**Format**: `[Component] Action: details`

**Components**:
- `[DB]` - Database operations
- `[LCU]` - League Client API
- `[Backend]` - Main process (analyzeLobbyPlayers)
- `[Frontend]` - React components
- `[LastRoster]` - Last Match Roster specific
- `[LiveLobby]` - Players You've Met specific
- `[Cache]` - Cache operations

**Levels**:
- Regular log: Normal operations
- `⚠️` Warning: Unexpected but handled
- `❌` Error: Something wrong
- `✅` Success: Important completion
- `🔄` Update: State change

#### Step 4.2: Log Only Important Events

**Last Match Roster**:
```
[LastRoster] Loading match EUW1_xxx (10 players)
[LastRoster] ✅ Displayed 10 players
```

**Players You've Met**:
```
[LCU] Retrieved 10 players from champion select
[Backend] Found 3 players with history
[Frontend] ✅ Displaying 3 players
```

**Cache Events**:
```
[Cache] 🔄 Clearing live lobby cache (exited to Lobby)
[Cache] 🔄 Loading last match roster (match ID changed)
```

### Phase 5: Data Flow Diagram

```
┌─────────────────────┐
│  LAST MATCH ROSTER  │
└─────────────────────┘
         │
         ├─ App Launch ──────────────┐
         │                           │
         └─ Game Import ─────────────┤
                                     ▼
                        ┌────────────────────────┐
                        │  DB: getMostRecent()   │
                        │  Returns: 10 players   │
                        └────────────────────────┘
                                     │
                                     ▼
                        ┌────────────────────────┐
                        │  Frontend: Display All │
                        │  No Deduplication      │
                        └────────────────────────┘

┌─────────────────────┐
│ PLAYERS YOU'VE MET  │
└─────────────────────┘
         │
         └─ Enter ChampSelect/InProgress
                   │
                   ▼
         ┌──────────────────────┐
         │ LCU: getLobbyPlayers │
         │ Dedupe: BY PUUID     │
         │ Returns: 10 unique   │
         └──────────────────────┘
                   │
                   ▼
         ┌──────────────────────┐
         │ Backend: Lookup DB   │
         │ No Deduplication     │
         │ Returns: 3 with hist │
         └──────────────────────┘
                   │
                   ▼
         ┌──────────────────────┐
         │ Frontend: Display    │
         │ No Deduplication     │
         │ Cache until exit     │
         └──────────────────────┘
```

## Implementation Steps

1. ✅ Create this plan
2. Review and approve plan
3. Implement Phase 1 (Last Match Roster cleanup)
4. Test Last Match Roster
5. Implement Phase 2 (Players You've Met cleanup)
6. Test Players You've Met
7. Implement Phase 3 (Cache management)
8. Test cache lifecycle
9. Implement Phase 4 (Structured logging)
10. Test full flow end-to-end
11. Remove all debug/temporary logs
12. Final testing

## Success Criteria

- [ ] Last Match Roster shows all 10 players every time
- [ ] No duplicate players in either view
- [ ] No unnecessary re-renders (check with React DevTools)
- [ ] Logs are clear and actionable
- [ ] Cache clears at appropriate times only
- [ ] No race conditions
- [ ] Performance is smooth (no lag when switching tabs)
