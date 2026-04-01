# Venture Progression System — Implementation Tracker

## Status: Phase 1 Backend Complete ✅

### Completed (Phase 1: Backend Foundation)
- [x] `convex/ventureConstants.ts` — All static definitions:
  - 34 checkpoint definitions (8 stages × 3-5 checkpoints each)
  - 12 boss definitions with corruption/defeat mechanics
  - 50 level definitions with point thresholds and requirements
  - 62 badge definitions with colors, shapes, rarity
  - Point values for all actions
- [x] `convex/schema.ts` — Extended with 10 new tables:
  - `ventures`, `ventureCheckpoints`, `ventureTasks`, `ventureEvidence`, `ventureBosses`
  - `userLevels`, `flares`, `flareResponses`, `mentorships`
  - `ventureBadges`, `badgeEvaluations`
- [x] `convex/ventures.ts` — Core venture backend:
  - `createVenture` — Creates venture from idea, initializes all checkpoints/tasks, assigns 1-2 random bosses
  - `startCheckpoint` — Transitions checkpoint to in_progress
  - `submitEvidence` — Submits task evidence, updates completion flags, checks gold bonus
  - `advanceCheckpoint` — Advances checkpoint (requires 2/3 tasks), triggers stage advancement
  - `advanceStage` — Advances to next stage (requires all checkpoints complete)
  - `getVenture`, `getUserVentures`, `getCheckpoint`, `getVentureProgress` — Queries
  - Internal helpers: `tryAdvanceStage`, `awardPoints`, `updateBossCorruptionOnProgress`
- [x] `convex/levels.ts` — Level progression:
  - `initializeUserLevel` — Creates level tracking record
  - `awardPoints` — Awards points, updates wallet, checks level up
  - `getUserLevelProgress`, `getAllLevels` — Queries
- [x] `convex/badges.ts` — Extended existing badges.ts:
  - `awardVentureBadge` — Awards venture badge
  - `getVentureBadges`, `getAllVentureBadges`, `getVentureBadgeProgress` — Queries
- [x] `convex/flares.ts` — Flare help system:
  - `fireFlare`, `respondToFlare`, `markResponseHelpful`, `resolveFlare` — Mutations
  - `getOpenFlares`, `getFlareResponses`, `getUserFlares` — Queries
- [x] `convex/mentorship.ts` — Mentor track:
  - `applyForMentorship`, `acceptMentee`, `trackMenteeCheckpoint`, `endMentorship` — Mutations
  - `getMentorDashboard`, `getMentorshipStatus` — Queries

### Pending (Phase 2: UI Components)
- [ ] `src/app/venture/[id]/page.tsx` — Venture detail page
- [ ] `src/app/venture/[id]/stage/[stage]/page.tsx` — Stage view
- [ ] `src/app/venture/[id]/checkpoint/[checkpoint]/page.tsx` — Checkpoint with tools
- [ ] `src/app/venture/create/page.tsx` — Create venture from idea
- [ ] `src/components/venture/` — Stage nav, checkpoint timeline, task selector, progress bar
- [ ] `src/components/tools/` — Write, Table, Link, Upload, Map, Survey, Poll, OAuth, Self-report tools
- [ ] `src/components/levels/` — Level badge, progress bar, requirements
- [ ] `src/components/badges/` — Badge grid, card, tooltip
- [ ] `src/components/flares/` — Flare button, modal, feed, response
- [ ] `src/components/mentorship/` — Mentor card, mentee progress, request

### Pending (Phase 3: Boss System)
- [ ] Boss corruption visual effects (CSS animations)
- [ ] Boss encounter UI component
- [ ] Monument display for slain bosses
- [ ] Boss defeat condition evaluation (slay vs retreat)

### Pending (Phase 4: Polish & Integration)
- [ ] Mobile responsive design
- [ ] Notifications for completions/level ups/badges
- [ ] Profile page integration (level, badges, ventures)
- [ ] Feed integration (venture progress badges)
- [ ] Error handling & edge cases
- [ ] Testing

## System Architecture

```
Ideas → Ventures → Checkpoints → Tasks → Evidence
  │         │           │          │        │
  │         │           │          │        └─ Tool-specific UI
  │         │           │          └─ T1/T2/T3 (write/table/map/etc)
  │         │           └─ 2/3 tasks to advance, all 3 = gold bonus
  │         └─ 8 stages, 34 total checkpoints
  └─ Wrap existing idea with progression

Bosses (1-2 per venture) → Corruption → Defeat → Monument
Levels (1-50) → Points → Requirements → Level Up
Badges (62) → Conditions → Award → Display
Flares → Help Requests → Responses → Resolution
Mentorship → Level 40+ → Mentees → Tracking
```

## Key Design Decisions
1. **Ventures wrap ideas** — Don't replace, extend existing idea system
2. **JSON evidence storage** — Flexible for different tool types
3. **Boss corruption numeric (0-100)** — Easy to scale visual effects
4. **Mentor track separate module** — Only relevant at Lv 40+
5. **Points feed existing gamification** — No separate wallet system needed
