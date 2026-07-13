# Flux Layer 1 Build Plan

Executes build steps 2–15 of `flux-project-brief-v2.md` (step 1 done, step 5 done early).
Branch: `layer-1-build`. One commit per task, message prefix "Layer 1: ".

## Global Constraints (bind every task)

**Verification gate (every task, before commit):**
- `npx tsc --noEmit` → zero errors
- `npx jest` → all tests pass. (Exception: until Task 3 lands, one pre-existing
  streak test fails; Task 3 deletes it. From Task 3 onward the suite must be fully green.)

**Frozen files — never modify:**
`lib/flux-pattern-engine.ts`, `lib/flux-db.ts`, `context/DatabaseContext.tsx`,
`__tests__/flux-test-utils.ts`, `__tests__/flux-pattern-engine.test.ts`, `jest.config.js`,
`lib/flux-types.ts` (already complete incl. BucketState/TierInfo/DropResult/BodyLog/CalorieLog).

**NEVER (from brief §15):**
- Use "fail", "missed", "broke", "skipped" in any user-facing string
- Decrease `lifetime_drops` for any reason except explicit 2-step user reset
- Render a calorie target, deficit, or weight goal anywhere
- Colour-code weight direction
- Make a network request (Layer 1 is fully local)
- Show a spinner (skeleton cards instead) or a blank slate
- Build Layer 2 features (Supabase, social, wearables)

**ALWAYS (from brief §15):**
- Call `invalidatePatternCache` inside `logWorkoutWithTags` and `logCheckIn`
- Call `addDrops` inside `logWorkoutWithTags` after the workout insert
- Deduplicate tagIds before the tag loop: `const uniqueTagIds = [...new Set(tagIds)]`
- Respect reduced-motion in every animated component (components take a
  `reduceMotion?: boolean` prop; screens pass the `reduce_animations` setting)
- Bucket table is a singleton (id=1, exists via seed)
- `logCheckIn` uses ON CONFLICT DO UPDATE (date UNIQUE in check_ins)
- Exactly 4 bottom tabs at all times

**Code conventions:**
- TypeScript strict; typed function components; `StyleSheet.create`; no UI libraries
- All colours come from `constants/colors.ts` (Task 1) — no hex literals in components/screens
- DB access: raw async expo-sqlite API via `getDb()` / `useDatabaseContext()`; no ORM
- Radii: large 18 / medium 14 / small 10 / chip 8. Screen padding 20, card padding 16–18, card gap 16–20.
- Typography: Inter (loaded via `@expo-google-fonts/inter`); headings weight 700–800; labels weight 600 uppercase letter-spacing ~1

**Session decisions (already made — do not re-litigate):**
- Paywall is stubbed: no real RevenueCat calls; mock defaults to FULL access with a
  dev toggle in Settings (settings key `dev_full_access`, missing key = 'true')
- SuggestionCard primary CTA copy: "Start — just 5 min"
- `logWorkoutWithTags` returns `{ workoutId, dropResult }` (Log screen needs the
  DropResult for PostWorkoutNudge)

## Task 1: constants/colors.ts

Create `constants/colors.ts` exporting the full palette as a single `colors` const
(with `as const`) plus named radius/spacing constants.

```ts
export const colors = {
  bg: '#0F0F14',
  surface: '#17171F',
  surfaceHigh: '#1E1E2A',
  border: '#2A2A38',
  accent: '#7B6EF6',
  accentSoft: '#2D2847',
  accentGlow: 'rgba(123,110,246,0.15)',
  green: '#4ECFA0',
  greenSoft: '#1A3329',
  amber: '#F5A623',
  amberSoft: '#2E2310',
  teal: '#38BDF8',
  tealSoft: '#0C2233',
  rose: '#F87171',
  roseSoft: '#2A1010',
  purple: '#C084FC',
  purpleSoft: '#1E1030',
  textPrimary: '#F0EFF8',
  textSecondary: '#8B8AA0',
  textMuted: '#52516A',
} as const;

export const radii = { large: 18, medium: 14, small: 10, chip: 8 } as const;
export const spacing = { screen: 20, cardPadding: 16, cardGap: 16 } as const;
```

No tests required (constants only). Gate: tsc clean, jest unchanged.
Commit: "Layer 1: constants/colors.ts".

## Task 2: lib/bucket_service.ts + tests (TDD)

Create `lib/bucket_service.ts` and `__tests__/flux-bucket-service.test.ts`.
Follow TDD: write the test file first, watch it fail, then implement.
Use `createTestDb` from `__tests__/flux-test-utils.ts` (frozen — do not modify) for DB tests,
mirroring how `__tests__/flux-workout-service.test.ts` uses it.
Import types from `lib/flux-types.ts` (BucketState, TierInfo, DropResult — already defined).

### API (exact signatures)

```ts
import type { SQLiteDatabase } from 'expo-sqlite';

// Pure functions (no DB):
export function calculateDrops(durationMinutes: number | null, moodAfter: number | null): number
export function getTierInfo(lifetimeDrops: number): TierInfo

// DB functions:
export async function getBucketState(db: SQLiteDatabase): Promise<BucketState>
export async function addDrops(
  db: SQLiteDatabase,
  workout: { durationMinutes: number | null; moodAfter: number | null }
): Promise<DropResult>
```

### Drop formula

drops = base(10) + duration_bonus + effort_bonus

duration_bonus: null→0 | 0–10→0 | 11–20→3 | 21–30→7 | 31–45→12 | 46–60→18 | >60→25
effort_bonus (moodAfter): null or 1–2→0 | 3→3 | 4→7 | 5→12
Max per session: 47.

### Tier constants (co-locate in bucket_service.ts)

```ts
const TIERS = [
  { tier: 1, name: 'Pail',      start: 0,    size: 100 },
  { tier: 2, name: 'Bucket',    start: 100,  size: 200 },
  { tier: 3, name: 'Barrel',    start: 300,  size: 300 },
  { tier: 4, name: 'Trough',    start: 600,  size: 500 },
  { tier: 5, name: 'Reservoir', start: 1100, size: Infinity },
];
```

fillPct = (lifetimeDrops − tierStart) / tierSize × 100 (0 for Reservoir/Infinity;
clamp 0–100). dropsToNext = null at Reservoir, else (start of next tier − lifetimeDrops).

### addDrops behaviour (exact)

1. Call calculateDrops
2. `UPDATE bucket SET lifetime_drops = lifetime_drops + ?, total_workouts = total_workouts + 1, last_workout_date = date('now'), updated_at = CURRENT_TIMESTAMP WHERE id = 1`
3. Read back lifetime_drops; recalculate tier via getTierInfo
4. If tier changed: `UPDATE bucket SET current_tier = ? WHERE id = 1`
5. Return DropResult { dropsEarned, newTotal, tierAdvanced, newTier? (present when advanced) }

lifetime_drops must never decrease. Bucket row is singleton id=1 (test-utils schema seeds it).

### Required test cases (all from brief §11 — implement every one)

- calculateDrops: null duration + null mood = 10 (base only)
- calculateDrops: each duration bracket returns correct bonus (test all 6 brackets incl. boundary values 10/11, 20/21, 30/31, 45/46, 60/61)
- calculateDrops: each mood_after value (null,1,2,3,4,5) returns correct bonus
- calculateDrops: max possible (60+ min, mood 5) = 47
- getTierInfo: 0 drops → Pail, fillPct 0
- getTierInfo: 99 drops → Pail, fillPct 99
- getTierInfo: 100 drops → Bucket, fillPct 0
- getTierInfo: 300 drops → Barrel, fillPct 0
- getTierInfo: 1100 drops → Reservoir, dropsToNext null
- addDrops: lifetime_drops increases by correct amount
- addDrops: calling twice on same day → both contribute (no date dedup)
- addDrops: tierAdvanced true when crossing 100, 300, 600, 1100
- addDrops: lifetime_drops never decreases under any input (e.g. negative/zero duration, mood null)

Note: `__tests__/flux-test-utils.ts` createTestDb must already contain the bucket table —
verify by reading it; if its schema lacks the bucket table, STOP and report
NEEDS_CONTEXT (do not modify the frozen file).

Gate: tsc clean; new suite green; pattern-engine suite untouched.
Commit: "Layer 1: bucket service + tests".

## Task 3: Convert flux-workout-service from streaks to bucket

Modify `lib/flux-workout-service.ts` and `__tests__/flux-workout-service.test.ts` only.

In `lib/flux-workout-service.ts`:
1. Delete `getStreakState` and `evaluateStreakOnAppOpen` and all streak helper code /
   `streaks` table queries. (The app schema in flux-db.ts has no streaks table —
   this code would crash at runtime today.)
2. In `logWorkoutWithTags`: deduplicate tag ids before the tag loop:
   `const uniqueTagIds = [...new Set(tagIds)]` and use it in the loop.
3. Replace the streak update call with:
   `const dropResult = await addDrops(db, { durationMinutes: workout.durationMinutes ?? null, moodAfter: workout.moodAfter ?? null });`
   placed AFTER the workout insert. Import addDrops from `./bucket_service`.
4. Change the return value of `logWorkoutWithTags` to
   `{ workoutId: number; dropResult: DropResult }` (import DropResult type).
5. Keep `invalidatePatternCache` calls in both `logWorkoutWithTags` and `logCheckIn` intact.
6. Update the file header comment (it mentions streaks).

In `__tests__/flux-workout-service.test.ts`:
- Remove all streak-related tests (the whole "streak forgiveness" describe block and
  any other streak assertions) — they are superseded by the bucket tests from Task 2.
- Update assertions on logWorkoutWithTags' return value to the new
  `{ workoutId, dropResult }` shape.
- Add one test: logWorkoutWithTags with duplicate tag ids in the input array creates
  only one workout_tags row per unique tag.
- Add one test: logWorkoutWithTags increases bucket lifetime_drops (verifies addDrops wiring).
- Keep all other existing tests (check-in upsert, tag promotion, quick access tags, etc.).

Do NOT modify `__tests__/flux-test-utils.ts` (frozen) even though it still creates a
streaks table — harmless leftover.

Gate: tsc clean; ENTIRE suite green from this task forward.
Commit: "Layer 1: workout service uses bucket, streak system removed".

## Task 4: Components A — TagChip, InsightCard, BodyMetricsBanner, CollapsibleCard

Create four presentational components in `components/`. All colours/radii from
`constants/colors.ts`. No tests required (jest is node-env; components verified by tsc).

**TagChip.tsx** — Props: `label: string; sentiment: 'positive'|'negative'|'neutral'; selected: boolean; onPress: () => void; small?: boolean`
- Selected positive: greenSoft bg, green border, green text
- Selected negative: amberSoft bg, amber border, amber text
- Selected neutral: accentSoft bg, accent border, accent-ish text
- Unselected: surfaceHigh bg, border colour border, textSecondary text
- Chip radius 8; `small` renders tighter padding/font. Pressable with hitSlop.

**InsightCard.tsx** — Props: `icon: string; title: string; body: string; sentiment: 'positive'|'negative'|'neutral'`
- Positive: greenSoft bg, green border, green title
- Negative: amberSoft bg, amber border, amber title
- Neutral: surfaceHigh bg, border border, textPrimary title
- Radius 14, padding 16; icon is an emoji string rendered large-ish; body textSecondary.

**BodyMetricsBanner.tsx** — no props. Static, never dismissible.
Text exactly: "Body data is just data. No goals, no judgement."
Style: textMuted small font, surfaceHigh background, subtle border, radius 10.

**CollapsibleCard.tsx** — Props: `title: string; children: React.ReactNode; defaultCollapsed?: boolean`
- Collapse state in useState (NOT persisted). Chevron rotates when collapsed
  (simple text chevron '▾' with transform, or Reanimated rotation honouring nothing —
  no reduceMotion prop needed here since it's trivial; instant toggle is fine).
- Card: surface bg, border, radius 18, padding 16–18. Title = label style
  (weight 600, uppercase, letter-spacing, textSecondary).

Gate: tsc clean, jest green. Commit: "Layer 1: components A (chips, cards, banner)".

## Task 5: Components B — EnergyOrb, SuggestionCard, PatternBarChart

Create three components in `components/`. Colours from `constants/colors.ts`.
Animated pieces use react-native-reanimated and MUST accept `reduceMotion?: boolean`
(default false) — when true, skip/shorten animations (jump to final state).

**EnergyOrb.tsx** — Props: `level: 1|2|3|4|5; selected: boolean; onPress: () => void; disabled?: boolean; reduceMotion?: boolean`
- Circular orb (~56px) with soft radial-ish gradient look (nested Views or
  react-native-svg RadialGradient), emoji + label below, glow shadow when selected.
- Level → colour/emoji/label map (define locally):
  1 blue-grey `#5A6478` 😴 "Drained" | 2 muted purple `#8B7BD8` 🌙 "Low" |
  3 blue (teal) 🙂 "Steady" | 4 green ⚡ "Good" | 5 bright green `#5EE6B0` 🔥 "Charged"
  (labels are user-facing: keep them neutral/supportive, never judgmental)
- Selected: scale 1.15 via Reanimated spring (or instantly if reduceMotion).
- When any orb is selected, non-selected orbs render opacity 0.45.

**SuggestionCard.tsx** — Props: `energyLevel: 1|2|3|4|5; onStart: () => void; onSkip: () => void`
- Derive locally:
  1 → ("2-min breathing stretch", "Gentle. No pressure. Just move a little.", "🌊")
  2 → ("10-min walk", "Low effort, big mood shift. Outside if you can.", "🚶")
  3 → ("20-min bodyweight flow", "A solid middle-ground session.", "💪")
  4 → ("30-min strength circuit", "You've got fuel — use it.", "🔥")
  5 → ("45-min high-intensity", "Full charge. Let's go hard today.", "⚡")
- Primary CTA exact copy: "Start — just 5 min" (accent bg, white text, radius 14)
- Secondary CTA: "Not today" (ghost: transparent bg, textSecondary)

**PatternBarChart.tsx** — Props: `data: { day: string; avgEnergy: number; samples: number }[]`
- 7 columns Mon–Sun; bar height proportional to avgEnergy (max 5, e.g. 100px max).
- High bars (avgEnergy >= 3.5): accent colour (gradient feel via overlay or solid accent).
  Low bars: surfaceHigh. Day labels below each bar (textMuted, small).
- Plain Views are fine; no chart library.

Gate: tsc clean, jest green. Commit: "Layer 1: components B (orb, suggestion, chart)".

## Task 6: Components C — BucketWidget, PostWorkoutNudge

Create two components in `components/`. These use react-native-svg (installed) and
Reanimated; both accept `reduceMotion?: boolean` (skip animations → final state).

**BucketWidget.tsx** — Props: `lifetimeDrops: number; animateFill?: boolean; onTierAdvance?: (tier: TierInfo) => void; reduceMotion?: boolean`
- Use `getTierInfo` from `lib/bucket_service.ts` for tier/name/fillPct/dropsToNext.
- SVG bucket/vessel shape whose water fill level = fillPct, fill implemented via a
  clipped rect animating height (Reanimated or SVG props). Water colour accent
  `#7B6EF6` (from colors.accent) with a subtle lighter shimmer overlay bar that
  translates when not reduceMotion.
- Above: tier name (e.g. "Barrel") heading style. Below: "{lifetimeDrops} total drops"
  (format with thousands separator, e.g. "1,247 total drops").
- Subtext: "N drops to {next tier name}" — omit at Reservoir (show "No ceiling. Keep pouring." instead).
- If animateFill and the fill crosses a tier threshold, call onTierAdvance(newTierInfo).
- Never renders a downward/broken/loss state.

**PostWorkoutNudge.tsx** — Props: `dropResult: DropResult; onDone: () => void; reduceMotion?: boolean`
- Headline: "⚡ +{dropsEarned} drops · {newTotal} total"
- If dropResult.tierAdvanced: celebration block — tier name reveal ("Your bucket grew:
  {newTier.name}") with a scale/fade-in via Reanimated (instant if reduceMotion).
- Focus window card (accentSoft bg, radius 14):
  - Label (uppercase small): "FOCUS WINDOW OPEN"
  - Body: "You've got 1-2 hrs of enhanced focus. What do you want to use it for?"
- "Done" button (accent bg) → onDone.
- No guilt language anywhere.

Gate: tsc clean, jest green. Commit: "Layer 1: components C (bucket widget, post-workout nudge)".

## Task 7: Paywall stub — lib/flux-purchases.ts + components/PaywallSheet.tsx

RevenueCat is NOT integrated yet (no account). Build a local stub with the same seam
the real SDK will fill later. Do NOT import 'react-native-purchases' anywhere.

**lib/flux-purchases.ts**
```ts
import type { SQLiteDatabase } from 'expo-sqlite';

export type EntitlementTier = 'free' | 'full';

// Reads settings key 'dev_full_access'. Missing key or 'true' -> 'full'; 'false' -> 'free'.
export async function getEntitlement(db: SQLiteDatabase): Promise<EntitlementTier>

// Dev-only override used by the Settings dev toggle. Upserts the settings row.
export async function setDevEntitlement(db: SQLiteDatabase, tier: EntitlementTier): Promise<void>

// Stub purchase flow: sets dev_full_access='true' and resolves. Real RevenueCat later.
export async function purchaseFull(db: SQLiteDatabase): Promise<EntitlementTier>
```
Include a short header comment: this module is the single seam where
react-native-purchases gets wired in later; keep the function signatures stable.

**components/PaywallSheet.tsx** — Props: `visible: boolean; onClose: () => void; onUnlock: () => void`
- Bottom sheet feel: RN `Modal` (transparent, slide) with a bottom-anchored card
  (surface bg, radius 18 top corners, padding 20).
- Headline exact copy: "Your patterns are ready. Unlock them."
- Body: short neutral description of Flux Full (full insights, body metrics,
  12-month history). Price line: "$7.99/month or $54.99/year · 30-day free trial".
- Primary button "Start free trial" → onUnlock. Ghost button "Not now" → onClose.
- NEVER the word "Upgrade" or "Premium". Never a full-screen interrupt.

No tests required beyond gate. Gate: tsc clean, jest green.
Commit: "Layer 1: paywall stub (purchases seam + sheet)".

## Task 8: lib/flux-notifications.ts

Create `lib/flux-notifications.ts` using expo-notifications (already installed). Local
notifications only — no push, no network.

```ts
export async function scheduleCheckInReminder(time: string): Promise<void> // "HH:MM"
export async function cancelCheckInReminder(): Promise<void>
```

- scheduleCheckInReminder: request permission if needed (bail silently if denied),
  cancel any existing reminder, then schedule a DAILY repeating local notification at
  the given time.
- Notification copy: rotate randomly among these, never the same one twice in a row
  (persist the last-used index in the settings table under key `last_notification_copy`
  — upsert, key may not exist):
  - "Time to check in with Flux ⚡"
  - "How's your energy today?"
  - "Quick check-in — 5 seconds"
  - "Your bucket is waiting 💧"
- Store the scheduled notification id in settings key `checkin_notification_id` so
  cancelCheckInReminder can cancel precisely.
- Functions take `db: SQLiteDatabase` as first param for the settings reads/writes
  (adjust signatures: `scheduleCheckInReminder(db, time)`, `cancelCheckInReminder(db)`).
- Guard: expo-notifications APIs must not run under jest — this file is only imported
  by screens, never by tested services. Keep it free of side effects at import time.

Gate: tsc clean, jest green. Commit: "Layer 1: local check-in notifications".

## Task 9: Navigation shell — root layout, settings context, tab layout, placeholder screens

Create the Expo Router structure. This task establishes SettingsContext, which every
later screen task consumes — its API is a contract:

**context/SettingsContext.tsx**
```ts
interface SettingsContextValue {
  settings: Record<string, string>;      // all rows from settings table
  loading: boolean;
  setSetting: (key: string, value: string) => Promise<void>; // upsert DB + update state
}
export function SettingsProvider({ children }): JSX.Element  // loads settings once on mount
export function useSettings(): SettingsContextValue          // throws outside provider
```
`setSetting` writes `INSERT INTO settings (key, value, updated_at) VALUES (?,?,CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP`
then updates React state — this is what makes the tab navigator re-render immediately
when `body_metrics_enabled` changes.

**app/_layout.tsx**
- Load Inter fonts (`@expo-google-fonts/inter`: Inter_400Regular, Inter_600SemiBold,
  Inter_700Bold, Inter_800ExtraBold) — render nothing until loaded (return null; no spinner).
- Wrap: DatabaseProvider (from `context/DatabaseContext.tsx`, frozen — read it first
  to match its exported API exactly) → SettingsProvider → Stack.
- Redirect: once settings load, if `onboarding_complete !== 'true'` →
  `router.replace('/(onboarding)')` else `/(tabs)`. Dark theme: bg colour from palette,
  status bar light.

**app/(onboarding)/_layout.tsx** — Stack with headerShown: false.

**app/(tabs)/_layout.tsx**
- Reads `body_metrics_enabled` from useSettings().
- Exactly 4 tabs always:
  - 'false': Home (index) | Log | Insights | Settings
  - 'true':  Home (index) | Log | Insights | Body
- Implement with expo-router `<Tabs>`; hide the non-active 4th screen via
  `options={{ href: null }}` so the tab bar always shows exactly 4 items.
- Tab bar: bg surface, border top border colour, active tint accent, inactive textMuted.
  Icons: emoji or simple glyphs are acceptable for MVP.
- Header on every tab: title + profile icon (👤 glyph button) top-right, always visible.
  Body metrics off → icon routes to the Settings tab; on → `router.push('/settings')`
  (settings screen remains routable even when not a tab — ensure a route exists:
  when body metrics are on, settings stays a hidden tab via `href: null`, still pushable).
- Settings must never be more than one tap away.

**Placeholder screens** (minimal, replaced by Tasks 10–15): `app/(onboarding)/index.tsx`,
`app/(tabs)/index.tsx`, `app/(tabs)/log.tsx`, `app/(tabs)/insights.tsx`,
`app/(tabs)/body.tsx`, `app/(tabs)/settings.tsx` — each a dark screen with the screen
name in textSecondary (no blank white screens).

Gate: tsc clean, jest green. Commit: "Layer 1: navigation shell + settings context".

## Task 10: Onboarding flow (4 screens)

Replace `app/(onboarding)/index.tsx` placeholder and add `energy.tsx`, `suggestion.tsx`,
`notifications.tsx` under `app/(onboarding)/`. Dark bg, screen padding 20, Inter fonts.
Use useSettings() + useDatabaseContext(). No skips into guilt language.

**index.tsx — Screen 1: validation**
- Big heading (validation statement, e.g. "Fitness apps weren't built for your brain.
  This one is.") + 2–3 short supportive lines (no medical claims, no hype).
- CTA "Let's go" → router.push('/(onboarding)/energy').

**energy.tsx — Screen 2: first check-in**
- "How's your energy right now?" + row of 5 EnergyOrb components.
- On select: `logCheckIn(db, { date: today, energyLevel: level, mood: level })`
  (import from lib/flux-workout-service; today = local YYYY-MM-DD).
- Continue → `/(onboarding)/suggestion?energy={level}`.

**suggestion.tsx — Screen 3: first suggestion**
- Reads `energy` param (useLocalSearchParams). Renders SuggestionCard.
- Both onStart and onSkip advance to `/(onboarding)/notifications` (onStart may set a
  flag param; the real Log handoff exists post-onboarding). onSkip shows brief line
  "Rest is training too." before/while advancing.

**notifications.tsx — Screen 4: opt-in + done**
- Explain the daily check-in reminder (neutral copy). Time picker can be a simple
  preset choice row ("Morning 08:00 / Midday 12:00 / Evening 18:00") — writes
  `notification_time`.
- "Remind me" → setSetting('notification_enabled','true') +
  `scheduleCheckInReminder(db, time)` (Task 8). "No thanks" → leave disabled. Neither
  path guilt-trips.
- Both paths then: setSetting('onboarding_complete','true') → router.replace('/(tabs)').

Gate: tsc clean, jest green. Commit: "Layer 1: onboarding flow".

## Task 11: Home screen

Replace `app/(tabs)/index.tsx` placeholder. Data via useDatabaseContext(), settings via
useSettings(). reduce_animations setting → reduceMotion props.

On mount (async, skeleton cards while loading — simple pulsing surface blocks, NO spinner):
- Today's check-in (`SELECT * FROM check_ins WHERE date = ?` today) → pre-select orb if logged
- Bucket state via getBucketState → BucketWidget
- If body_metrics_enabled='true': last body log + today's calorie total → collapsible
  body widget (CollapsibleCard): last weight + "changed X.Xkg" phrasing if ≥2 entries
  (NEVER "down/up", NEVER colour-coded) + today's calories if calorie_tracking='true'
- getPattern(db,'day_energy_rhythm') and getPattern(db,'hydration_insight') from
  lib/flux-pattern-engine → small preview chips/cards if data present (skip silently if not)

Layout top→bottom: header greeting, EnergyOrb row (5 orbs), SuggestionCard (only after
today's energy selected — fade in via Reanimated, instant if reduce_animations),
BucketWidget, body widget (conditional), insights preview.

Interactions:
- Orb tap: `logCheckIn(db, { date: today, energyLevel, mood: energyLevel })` → show
  SuggestionCard for that level
- SuggestionCard onStart: `router.push({ pathname: '/(tabs)/log', params: { activityType: <suggested> } })`
  (map energy level → suggested activity type string used by Log's chips, e.g.
  1 'Stretch', 2 'Walk', 3 'Bodyweight', 4 'Strength', 5 'HIIT')
- onSkip: dismiss card, show inline text: "Rest is training too. Your bucket is waiting."

Gate: tsc clean, jest green. Commit: "Layer 1: home screen".

## Task 12: Log screen

Replace `app/(tabs)/log.tsx` placeholder.

Form elements (top→bottom, scrollable):
- Activity chip row (single select, REQUIRED): preset list
  ['Walk','Run','Strength','Bodyweight','Yoga','Stretch','Cycle','Swim','Sport','HIIT','Other']
  rendered with TagChip (sentiment 'neutral'). Handle `activityType` navigation param
  (from Home) by pre-selecting the matching chip (useLocalSearchParams).
- Mood after: 5-emoji row (😖 😕 😐 🙂 🤩 for 1–5), nullable (tap again to deselect).
- Duration: numeric TextInput (minutes, optional) with live bonus preview using
  `calculateDrops` from lib/bucket_service: show "~+{calculateDrops(duration, mood)} drops"
  updating as they type.
- Tags: `getQuickAccessTags(db, 6)` (from flux-workout-service) as quick chips +
  an expandable section listing preset tags grouped by category (query
  `SELECT * FROM tags WHERE is_preset = 1 ORDER BY category`), CollapsibleCard per
  category. Multi-select via TagChip.
- Custom tag input: TextInput + add button → `getOrCreateTag(db, label)` (check its
  real signature in flux-workout-service first) → adds to selected.
- Calorie field: only if calorie_tracking='true' — plain numeric input labelled
  "Calories today (optional)". NO target, NO progress bar, NO evaluation.
- Done button (disabled until activity selected):
  ```ts
  const uniqueTagIds = [...new Set(selectedTagIds)];
  const { dropResult } = await logWorkoutWithTags(db, workout, uniqueTagIds);
  // workout: { date: today, activityType, durationMinutes: duration ?? null, moodAfter: mood ?? null, source: 'manual' } — match the service's actual param type
  if (calorieValue) await db.runAsync(`INSERT INTO calorie_logs (date, total_calories) VALUES (?,?) ON CONFLICT(date) DO UPDATE SET total_calories = excluded.total_calories`, [today, calorieValue]);
  setNudge(dropResult); // render <PostWorkoutNudge dropResult onDone={reset + navigate Home}/> as overlay/modal
  ```
- After Done: form resets; PostWorkoutNudge onDone → router back to Home.

Gate: tsc clean, jest green. Commit: "Layer 1: log screen".

## Task 13: Insights screen

Replace `app/(tabs)/insights.tsx` placeholder.

- Entitlement gate first: `getEntitlement(db)` (Task 7). If 'free': render the single
  preview InsightCard (first available pattern) + a locked section teaser; tapping it
  opens PaywallSheet ("Your patterns are ready. Unlock them."). onUnlock →
  `purchaseFull(db)` → re-render unlocked. If 'full': full screen below.
- Load `SELECT COUNT(*) FROM workouts WHERE date >= date('now','-30 days')`.
- count < 7 → empty state ONLY (no fake data): friendly copy like "Log a few more
  sessions and your patterns will start to appear. 7 sessions in 30 days unlocks
  insights." (never "you haven't", "missed", etc.)
- count >= 7 → `Promise.all` the 4 patterns via getPattern(db, ...) with the four
  pattern type names used in lib/flux-pattern-engine (READ that file's exported
  pattern-type union first and use its exact strings):
  - Skeleton cards while loading (pulsing surface blocks, no spinner)
  - PatternBarChart for day_energy_rhythm data
  - Tag-mood correlation → list of InsightCards (positive/negative sentiment per row)
  - Burnout precursor + hydration insight → conditional InsightCards only when the
    pattern returns something meaningful (respect each PatternResult's shape)

Gate: tsc clean, jest green. Commit: "Layer 1: insights screen".

## Task 14: Body tab

Replace `app/(tabs)/body.tsx` placeholder. This screen renders only when
body_metrics_enabled='true' (nav handles that; screen may also guard).

- FIRST element, permanent, never dismissible: `<BodyMetricsBanner />`.
- Weight & measurements section:
  - Neutral monochrome line chart of last ~30 weight entries (react-native-svg
    polyline, single colour textSecondary; NO target line, NO green/red).
  - "Log entry" CTA → inline form/modal: date (default today), weight, optional
    waist/chest/hips/arms (cm), notes. INSERT into body_logs.
  - History list newest first: "{date} · {weight} kg" + measurements if present.
    If ≥2 entries show "changed {abs delta} kg" — NEVER "down"/"up", NEVER coloured.
- Calorie section (only if calorie_tracking='true'):
  - 7-day bar chart, single neutral colour (surfaceHigh bars, textSecondary values),
    NO target line, NO colour coding.
  - Log entry: date + total calories (single field). `INSERT ... ON CONFLICT(date) DO UPDATE`.
  - History list newest first.
- Weight unit label from settings `weight_unit`.
- No goal fields anywhere. No praise/consolation copy about values.

Gate: tsc clean, jest green. Commit: "Layer 1: body tab".

## Task 15: Settings screen

Replace `app/(tabs)/settings.tsx` placeholder. Sections (SectionList or mapped views),
each row: label + control. All reads/writes via useSettings().setSetting.

- **Check-ins**: notification_enabled toggle (on: `scheduleCheckInReminder(db, notification_time)`;
  off: `cancelCheckInReminder(db)`), notification_time preset row (08:00/12:00/18:00 —
  reschedules if enabled), medication_tracking toggle.
- **Body & Nutrition**:
  - body_metrics_enabled toggle. If turning ON and entitlement is 'free' → open
    PaywallSheet instead (toggle stays off until unlocked). On change the tab bar
    re-renders immediately (SettingsContext already guarantees this — just setSetting).
  - calorie_tracking toggle (only visible when body metrics on). FIRST time enabling
    (track via settings key `calorie_consent_shown`): show consent notice (Alert or
    inline card) with exact copy: "Calorie tracking is a neutral log. Flux doesn't set
    targets or evaluate your intake." with Continue/Cancel.
- **Friends & Challenges**: single static row "Friends & challenges — coming soon"
  (textMuted). No network, no account UI in Layer 1.
- **Progress**:
  - weekly_goal preset row (2/3/4/5 per week — neutral framing, informational only).
  - "Reset bucket" row (rose text): two-step confirmation (Alert "This sets your
    bucket back to zero. Your workout history stays." → second Alert "Really reset?
    This can't be undone.") → `UPDATE bucket SET lifetime_drops=0, current_tier=1,
    total_workouts=0 WHERE id=1`. The ONLY place lifetime_drops may decrease.
- **Display**: reduce_animations toggle.
- **Privacy**: static copy — all data stays on this device; no account, no tracking.
  "Clear all data" (rose): two-step confirm → delete rows from all user tables
  (workouts, workout_tags, check_ins non-preset tags, bucket reset, body_logs,
  calorie_logs, patterns_cache) → setSetting('onboarding_complete','false') →
  router.replace('/(onboarding)').
- **Account**: static row: "Flux is local-first. Accounts arrive with sync + social."
- **Developer** (temporary section, clearly labelled "DEV"): entitlement toggle —
  switch between 'full'/'free' via setDevEntitlement (Task 7) so gating can be
  previewed. Show current entitlement.

Gate: tsc clean, jest green. Commit: "Layer 1: settings screen".
