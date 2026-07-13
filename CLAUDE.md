# Flux — Project Quick Reference
> Full spec: `flux-project-brief-v2.md`. This file is a compressed reference. When in doubt, the brief wins.

## Project Summary
Flux is a local-first ADHD fitness tracker. It replaces streak mechanics with a permanent "bucket" that only fills. No guilt, no loss aversion, no social competition.
**NOT**: a weight loss app, an AI app, a social platform, ad-supported, or shame-based.

## Current State
- Expo config initialized: `package.json`, `tsconfig.json`, `app.json`, `babel.config.js`, `metro.config.js` created
- Run `npm install` to install dependencies (node_modules not yet present)
- Source files moved to target directories — do NOT look for them at root
- Next build step: **Step 1** — `lib/flux-db.ts` + `context/DatabaseContext.tsx`

### Files in place (do not rewrite)
- `lib/flux-types.ts` — COMPLETE + new types added (BucketState, TierInfo, DropResult, BodyLog, CalorieLog)
- `lib/flux-pattern-engine.ts` — COMPLETE, no modifications ever
- `lib/flux-workout-service.ts` — needs 3 fixes from brief §10 (do at build step 4, after bucket_service exists)
- `__tests__/flux-test-utils.ts` — COMPLETE, no modifications ever
- `__tests__/flux-pattern-engine.test.ts` — COMPLETE, no modifications ever
- `__tests__/flux-workout-service.test.ts` — needs streak tests removed (do at build step 4)
- `jest.config.js` — COMPLETE at root, no modifications

## Tech Stack
- Framework: React Native + Expo SDK 52+, Expo Router, TypeScript strict mode
- Local DB: expo-sqlite (raw async API, no ORM)
- State: React Context only (no Redux, no Zustand)
- Animations: React Native Reanimated (always check `reduce_animations` setting)
- Notifications: expo-notifications (local only in Layer 1)
- Billing: RevenueCat (react-native-purchases)
- Testing: Jest + ts-jest + better-sqlite3
- Cloud (Layer 2 — deferred): Supabase — Auth, RLS, Realtime, Edge Functions
- Sync (Layer 2 — deferred): Turso or PowerSync

## Layer 1 Build Order
1. `lib/flux-db.ts` + `context/DatabaseContext.tsx`
2. `constants/colors.ts`
3. `lib/bucket_service.ts` + `__tests__/flux-bucket-service.test.ts`
4. Update `lib/flux-workout-service.ts` (tag dedup + replace streak calls with addDrops)
5. Update `lib/flux-types.ts` (add BucketState, TierInfo, DropResult, BodyLog, CalorieLog)
6. All components (EnergyOrb, TagChip, InsightCard, BucketWidget, SuggestionCard, PatternBarChart, PostWorkoutNudge, BodyMetricsBanner, CollapsibleCard)
7. Expo Router navigation structure + dynamic tab logic (`app/_layout.tsx`, `app/(tabs)/_layout.tsx`)
8. Onboarding flow (4 screens under `app/(onboarding)/`)
9. Home screen (`app/(tabs)/index.tsx`)
10. Log screen (`app/(tabs)/log.tsx`)
11. Insights screen (`app/(tabs)/insights.tsx`)
12. Body tab (`app/(tabs)/body.tsx`)
13. Settings screen (`app/(tabs)/settings.tsx`)
14. `lib/flux-notifications.ts`
15. RevenueCat paywall integration

## Critical Constraints

### NEVER
- Use "fail", "missed", "broke", "skipped" in any user-facing string
- Decrease `lifetime_drops` for any reason except explicit 2-step user reset
- Render a calorie target, deficit, or weight goal anywhere
- Colour-code weight direction (green=down, red=up is forbidden)
- Make a network request without explicit user consent (account opt-in)
- Request more than minimum required permissions
- Show a spinner — use skeleton cards instead
- Show a blank slate — always seed with defaults or empty-state messaging
- Build any Layer 2 feature (Supabase, social, wearables) during Layer 1

### ALWAYS
- Call `invalidatePatternCache` inside `logWorkoutWithTags` and `logCheckIn`
- Call `addDrops` inside `logWorkoutWithTags` after the workout insert
- Deduplicate tagIds before the tag loop: `const uniqueTagIds = [...new Set(tagIds)]`
- Respect `reduce_animations` setting in every animated component
- Render `BodyMetricsBanner` as the first and permanent element in the Body tab
- Re-render the tab navigator immediately when `body_metrics_enabled` changes
- Treat the bucket table as a singleton (id=1, always exists via seed INSERT OR IGNORE)
- Use `ON CONFLICT DO UPDATE` in `logCheckIn` (date is UNIQUE in check_ins)
- Keep the bottom nav at exactly 4 tabs at all times

## Design System

### Colors
```ts
bg:            '#0F0F14'
surface:       '#17171F'
surfaceHigh:   '#1E1E2A'
border:        '#2A2A38'
accent:        '#7B6EF6'
accentSoft:    '#2D2847'
accentGlow:    'rgba(123,110,246,0.15)'
green:         '#4ECFA0'
greenSoft:     '#1A3329'
amber:         '#F5A623'
amberSoft:     '#2E2310'
teal:          '#38BDF8'
tealSoft:      '#0C2233'
rose:          '#F87171'
roseSoft:      '#2A1010'
purple:        '#C084FC'
purpleSoft:    '#1E1030'
textPrimary:   '#F0EFF8'
textSecondary: '#8B8AA0'
textMuted:     '#52516A'
```

### Typography
- Font: Inter, -apple-system, BlinkMacSystemFont, sans-serif
- Headings: weight 700–800, letter-spacing -0.03em to -0.04em
- Body: weight 400, line-height 1.5
- Labels: weight 600, letter-spacing 0.06–0.10em, uppercase

### Shape & Spacing
- Radii: large 18px | medium 14px | small 10px | chip 8px
- Screen padding: 20px | Card padding: 16–18px | Card gap: 16–20px

## Bucket Mechanic Quick Reference

### Drop Formula
```
drops = 10 (base) + duration_bonus + effort_bonus

duration_bonus:  0–10 min → 0 | 11–20 → 3 | 21–30 → 7 | 31–45 → 12 | 46–60 → 18 | 60+ → 25
effort_bonus:    mood 1–2 → 0 | mood 3 → 3 | mood 4 → 7 | mood 5 → 12

Max per session: 47 drops (10 + 25 + 12)
```

### Tier Thresholds
| Tier | Name      | Starts at | Size |
|------|-----------|-----------|------|
| 1    | Pail      | 0         | 100  |
| 2    | Bucket    | 100       | 200  |
| 3    | Barrel    | 300       | 300  |
| 4    | Trough    | 600       | 500  |
| 5    | Reservoir | 1100      | ∞    |

Fill %: `(lifetime_drops - tier_start) / tier_size * 100`

## Key Code Invariants
- Bucket table always has exactly one row (id=1). Never insert a second row.
- `patterns_cache` has UNIQUE on `pattern_type` — upsert with ON CONFLICT DO UPDATE.
- `logCheckIn` uses ON CONFLICT DO UPDATE (date is UNIQUE in check_ins).
- `logWorkoutWithTags` must: (1) dedup tagIds, (2) call addDrops, (3) call invalidatePatternCache.
- Body metrics are OFF by default. When disabled, zero body UI renders anywhere.
- Calorie display: daily total only. No target, no progress bar, no colour coding.
- Navigation: exactly 4 bottom tabs. Tab 4 = Settings (body off) or Body (body on).
- Settings is never more than 1 tap away — profile icon always visible in header.
- Insights screen: show empty state if < 7 workouts in last 30 days. Never show fake data.
- Social features (Supabase, friends, challenges) = Layer 2. Do not build during Layer 1.
