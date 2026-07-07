# Flux — Complete Project Brief & Build Prompt

You are being asked to build **Flux**, a production-ready React Native (Expo) fitness
tracking app designed specifically for adults with ADHD. This document is the single
source of truth for every product, design, architecture, and code decision made so far.
Read it fully before writing any code.

---

## 1. Product Vision

Flux is a local-first, privacy-forward fitness tracker built around the specific neurology
of ADHD — not adapted from a generic fitness app. It solves two problems most fitness apps
completely ignore for this population:

1. **Starting and sticking to a routine** — ADHD brains struggle with task initiation,
   habit formation, and tolerating the psychological pain of perceived failure (a broken
   streak). Every design decision in Flux reduces friction and removes guilt.

2. **Managing energy crashes and burnout** — ADHD adults experience boom-bust energy cycles.
   Flux tracks these patterns locally and surfaces insights so users can work with their
   energy instead of fighting it.

### What Flux is NOT

- It is not a calorie counter. No food logging. No macros.
- It is not a weight loss app. No body weight fields. No before/after framing.
- It is not a social fitness platform. No leaderboards. No competitive features.
- It is not AI-powered. All intelligence is local rule-based pattern matching on SQLite data.
- It does not use ads. Ever. The privacy promise is foundational to the brand.
- It does not shame users. Missed days, short workouts, and low-energy sessions are all
  treated identically to peak sessions. Showing up is the only win that matters.

---

## 2. Target User

**Primary:** Adults (18–45) diagnosed with or identifying as having ADHD.

**Key behavioural traits to design for:**

- Poor task initiation — needs the smallest possible first step
- Novelty-seeking — routine variety is a feature, rigid plans are failure triggers
- Difficulty connecting cause to effect over time — tagging externalises what the brain
  misses; the app becomes a mirror
- Rejection sensitive dysphoria — any hint of punishment or failure language causes
  immediate disengagement
- Variable energy and focus — what works Monday often cannot be replicated Friday
- Hyperfocus windows after exercise — a real neurological phenomenon, 1–2 hours of
  enhanced concentration that Flux capitalises on with a post-workout nudge
- Often on stimulant medication — an optional medication-timing feature helps schedule
  workouts around peak medication windows

---

## 3. Design System

### Colour Palette (Dark theme, only theme for MVP)

```
bg:           #0F0F14   — page background
surface:      #17171F   — card background
surfaceHigh:  #1E1E2A   — elevated card / input
border:       #2A2A38   — dividers, card borders
accent:       #7B6EF6   — primary purple (CTAs, active nav, highlights)
accentSoft:   #2D2847   — accent background tint
accentGlow:   rgba(123,110,246,0.15)
green:        #4ECFA0   — positive sentiment, success states
greenSoft:    #1A3329   — green tint background
amber:        #F5A623   — warnings, negative tag sentiment
amberSoft:    #2E2310   — amber tint background
teal:         #38BDF8   — wearable/data features
tealSoft:     #0C2233
rose:         #F87171   — destructive / streak reset (used sparingly)
roseSoft:     #2A1010
purple:       #C084FC   — pattern/cache features
purpleSoft:   #1E1030
textPrimary:  #F0EFF8
textSecondary:#8B8AA0
textMuted:    #52516A
```

### Typography

- Font family: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
- Monospace (SQL/code displays): system monospace
- Headings: weight 700–800, letter-spacing -0.03em to -0.04em
- Body: weight 400, line-height 1.5
- Labels/caps: weight 600, letter-spacing 0.06–0.10em, uppercase

### Spacing & Shape

- Card border-radius: 18px (large), 14px (medium), 10px (small), 8px (chip/tag)
- Screen padding: 20px horizontal
- Card padding: 16–18px
- Gap between cards: 16–20px
- Bottom nav height: ~80px including safe area

### Design Principles (Non-Negotiable)

1. **Zero guilt language** — never "you missed a day", never "get back on track"
2. **Minimal UI by default** — every extra tap is a dropout risk for ADHD users
3. **No weight, calorie, or body composition fields anywhere**
4. **Variable rewards** — not predictable badges on every action
5. **Soft streak system** — streaks pause, never break visibly
6. **Pre-built defaults** — no blank slates anywhere in the app
7. **Maximum 4 bottom navigation items**
8. **Every feature reachable in 2 taps from anywhere**

---

## 4. Navigation Structure

Four bottom tabs only. No nested navigation beyond one level deep.

```
Tab 1: Home     (icon: house)     — daily check-in, today's suggestion, streak, tag insights
Tab 2: Log      (icon: plus)      — log a workout session with activity, mood, and tags
Tab 3: Insights (icon: chart-bar) — pattern engine output: energy rhythm, tag correlations
Tab 4: Settings (icon: cog)       — preferences, privacy controls, account (premium)
```

---

## 5. Screen Specifications

### 5.1 Onboarding (First Launch Only)

Maximum 4 screens. Total time < 2 minutes. No account creation. No mandatory fields.
No credit card. First win must occur before any preference questions.

**Screen 1 — Validation**
- Single bold headline: *"Most fitness apps weren't built for your brain. This one was."*
- Subtext: 1 sentence explaining local, private, ADHD-first
- Single CTA: "Let's start" → Screen 2

**Screen 2 — First check-in**
- Headline: *"How's your energy right now?"*
- 5 emoji orbs (1=😴 2=😑 3=🙂 4=😊 5=⚡), tap one
- No skip. This is the first data point.

**Screen 3 — First suggestion**
- Shows a workout suggestion based on the energy tap
- CTA: "Do 5 minutes" (primary) and "Not today" (secondary, ghost)
- Both advance to Screen 4

**Screen 4 — Notification opt-in**
- Headline: *"Want a nudge tomorrow?"*
- Single toggle: on/off
- If on: time picker defaulting to 8:00 AM
- CTA: "Done — take me to my app"
- Lands on Home screen with all defaults pre-set

### 5.2 Home Screen

Top to bottom order:

**Header row**
- Left: current day + time, below that "How's your brain today?" (h1)
- Right: circular icon button (brain emoji) → reserved for profile/account (Phase 2)

**Energy Check-In Card**
- Label: "TAP YOUR ENERGY LEVEL" (small caps)
- 5 EnergyOrb components in a row
- Each orb: coloured radial-gradient circle with glow, emoji inside, label below
- Energy 1 (Drained) → cool blue-grey palette
- Energy 2 (Low) → muted purple palette
- Energy 3 (Okay) → blue palette
- Energy 4 (Good) → green palette
- Energy 5 (Charged) → bright green/yellow palette
- Tapping an orb dims others to 45% opacity, scales selected to 1.15x
- Persists for the day (re-opening the app shows today's selection pre-filled)

**Suggestion Card** (appears after energy tap, animated fade-in)
- Background: linear gradient from accentSoft to surface
- Border: accent at 44% opacity
- Large activity emoji + "TODAY'S SUGGESTION" label (accent colour, small caps)
- Activity name (h2) + one-line description
- Suggestion logic by energy level:
  - 1 → "2-min breathing stretch" — "Gentle. No pressure. Just move a little."
  - 2 → "10-min walk" — "Low effort, big mood shift. Outside if you can."
  - 3 → "20-min bodyweight flow" — "A solid middle-ground session."
  - 4 → "30-min strength circuit" — "You've got fuel — use it."
  - 5 → "45-min high-intensity" — "Full charge. Let's go hard today."
- Primary CTA: "Start — 5 min min" (accent background, white text)
- Secondary CTA: "Not today" (surfaceHigh background, muted text)

**Streak Card**
- Title: "This week" + "{n} day streak 🔥" right-aligned (accent colour)
- 7 day squares (M–S), active days filled with accentSoft + accent border + "✓"
- Missed days show "·" in surfaceHigh — never red, never an X
- Below the squares: a soft-forgiveness message when a rest day was used
  e.g. "💜 Wednesday was a rest day — streak preserved"
- Never displays "Streak broken" language

**Tag Insights Preview Card**
- Title: "What your tags are showing"
- Subtitle: "Based on your last 7 sessions"
- Shows 1–2 pre-computed insight chips:
  - Positive insight: greenSoft background, green text
  - Warning insight: amberSoft background, amber text
- Tapping the card navigates to the full Insights tab

### 5.3 Log Screen

**Activity selector**
- Horizontal chip row: Walk / Run / Lift / Bike / Swim / Yoga / Dance / Other
- Chips: surfaceHigh background, tap to select (accent border + accentSoft background)

**Mood after**
- Label: "HOW DO YOU FEEL NOW?"
- 5 emoji in a row: 😩 😐 🙂 😊 🤩
- Tap to select, others dim to 30% opacity, selected scales to 1.25x

**Tag section**
- Label: "TAG THIS SESSION" + "Pick any that fit — or none"
- Chip grid of preset tags (see Section 7 for full list)
- Selected tags: sentiment-coloured (green or amber), with "✓ " prefix
- Unselected: surfaceHigh with muted text
- Custom tag input: text field + "Add" button
  - Custom tags saved to DB on add
  - Added to the chip grid immediately
- All fields optional — tapping "Done" with nothing selected is valid

**Done button**
- Full-width, accent background, "Done" label
- On tap: insert workout + tags, update streak, invalidate cache
- Then navigate to a post-log celebration screen:
  - Large "✅" + "Session logged"
  - Focus window nudge card (accentSoft background):
    "FOCUS WINDOW OPEN" (small caps, accent)
    "You've got 1–2 hrs of enhanced focus coming. What do you want to use it for?"
  - Secondary button: "Log another" → resets the log form

### 5.4 Insights Screen

**Header:** "Your patterns" + "Last 30 days · {n} sessions logged"

**Energy Rhythm Card**
- Title: "Energy rhythm"
- Subtitle: "When you tend to feel most ready"
- 7-column bar chart (Mon–Sun)
- Bar fill: accent gradient for high-energy days, surfaceHigh for low
- Below chart: plain-language summary e.g. "📊 Fridays and Saturdays are your strongest days"
- Sourced from `day_energy_rhythm` pattern

**Tag Frequency Card**
- Title: "Top tags this month"
- List of top 5 tags by use_count, each with:
  - Tag chip (sentiment-coloured)
  - Use count right-aligned
  - Progress bar (green for positive sentiment, amber for negative)

**Insight Cards**
- One card per computed insight (hydration, burnout precursor, etc.)
- Each: emoji icon + title (sentiment-coloured) + plain-language body text
- amberSoft/greenSoft backgrounds depending on positive/negative signal
- Do not show insight cards until hasEnoughData = true

**Empty state** (fewer than 7 sessions logged)
- Illustration placeholder + "Log a few more sessions and we'll start finding patterns"
- No fake data, no generic graphs

### 5.5 Settings Screen

Sections (each as a grouped list card):

**Check-ins**
- Check-in reminder time (time picker)
- Reminder style: Encouraging / Informational / None
- Medication tracking: toggle (off by default)

**Streaks**
- Streak forgiveness: toggle (on by default, cannot be turned off in MVP — consider making it permanent)
- Rest day banking: display only, shows "X days banked"
- Weekly goal: stepper (1–7 days)

**Display**
- Reduce animations: toggle
- High contrast mode: toggle (increases border opacity, removes gradients)
- Font size: Small / Default / Large

**Privacy**
- "All data stored locally on your device" — display-only, with 🔒 icon
- Export my data: triggers JSON export of all tables
- Clear all data: destructive action with confirmation dialog

**Account** (Premium only — shows upgrade prompt if free tier)
- Sign in / Create account
- Sync status

**Privacy badge** (always visible at bottom of settings):
- accentSoft background, 🔒 icon
- "Your data never leaves your device. No cloud, no AI, no servers. Just you."

---

## 6. Tech Stack

### Framework
**React Native + Expo SDK 52+**
- Use Expo Router (file-based navigation) for all routing
- TypeScript throughout — strict mode enabled
- No class components — functional components with hooks only

### Local Database
**expo-sqlite** (built-in with Expo)
- All data stored in SQLite on-device
- Pattern engine runs as SQL queries against this database
- No ORM — raw SQL via the async API (`runAsync`, `getFirstAsync`, `getAllAsync`)

### State Management
- **React Context** for lightweight global state (current check-in, streak state)
- No Redux. No Zustand. The database is the source of truth; UI state is derived from it.

### Animations
- **React Native Reanimated** for the energy orb scale transitions and card fade-ins
- Respect the "Reduce animations" setting — wrap all animations in a check against this setting
- Never auto-play looping animations

### Notifications
- **expo-notifications** for the optional daily check-in nudge
- No default notifications — user opts in during onboarding or Settings
- Notification copy must never use guilt language

### Testing
- **Jest + ts-jest** for unit tests
- **better-sqlite3** as the Node-compatible SQLite adapter in tests
- Tests live in `__tests__/` directory

### Phase 2 additions (do not build in MVP)
- **react-native-health** — Apple HealthKit bridge
- **react-native-health-connect** — Android Health Connect bridge
- **Supabase** — optional cloud account sync (PostgreSQL, auth, RLS)
- Turso or PowerSync for the local ↔ cloud sync bridge

---

## 7. Database Schema

Run this exact SQL on first app launch (via `expo-sqlite` `execAsync`):

```sql
CREATE TABLE IF NOT EXISTS check_ins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  date          DATE    NOT NULL UNIQUE,
  energy_level  INTEGER NOT NULL CHECK (energy_level BETWEEN 1 AND 5),
  mood          INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 3),
  stress_level  INTEGER CHECK (stress_level BETWEEN 1 AND 3),
  medication_taken BOOLEAN,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ci_date ON check_ins(date);

CREATE TABLE IF NOT EXISTS workouts (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  date             DATE    NOT NULL,
  started_at       TIMESTAMP,
  duration_minutes INTEGER,
  activity_type    TEXT    NOT NULL,
  mood_after       INTEGER CHECK (mood_after BETWEEN 1 AND 5),
  notes            TEXT,
  source           TEXT    NOT NULL DEFAULT 'manual',
  external_id      TEXT    UNIQUE,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (date) REFERENCES check_ins(date)
);
CREATE INDEX IF NOT EXISTS idx_w_date     ON workouts(date);
CREATE INDEX IF NOT EXISTS idx_w_activity ON workouts(activity_type);

CREATE TABLE IF NOT EXISTS tags (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  label      TEXT    NOT NULL UNIQUE,
  category   TEXT    NOT NULL,
  sentiment  TEXT    NOT NULL DEFAULT 'neutral'
             CHECK (sentiment IN ('positive','negative','neutral')),
  is_preset  BOOLEAN NOT NULL DEFAULT 0,
  use_count  INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_t_use_count ON tags(use_count DESC);
CREATE INDEX IF NOT EXISTS idx_t_category  ON tags(category);

CREATE TABLE IF NOT EXISTS workout_tags (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id INTEGER NOT NULL,
  tag_id     INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (workout_id, tag_id),
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)     REFERENCES tags(id)
);
CREATE INDEX IF NOT EXISTS idx_wt_workout ON workout_tags(workout_id);
CREATE INDEX IF NOT EXISTS idx_wt_tag     ON workout_tags(tag_id);

CREATE TABLE IF NOT EXISTS streaks (
  id               INTEGER PRIMARY KEY DEFAULT 1,
  current_streak   INTEGER NOT NULL DEFAULT 0,
  longest_streak   INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  rest_days_banked INTEGER NOT NULL DEFAULT 0 CHECK (rest_days_banked <= 3),
  total_workouts   INTEGER NOT NULL DEFAULT 0,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patterns_cache (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern_type TEXT    NOT NULL UNIQUE,
  data         TEXT    NOT NULL,
  computed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_stale     BOOLEAN NOT NULL DEFAULT 0,
  valid_until  TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pc_type  ON patterns_cache(pattern_type);
CREATE INDEX IF NOT EXISTS idx_pc_stale ON patterns_cache(is_stale);

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed rows (safe to run multiple times due to INSERT OR IGNORE)
INSERT OR IGNORE INTO streaks (id) VALUES (1);

INSERT OR IGNORE INTO settings VALUES
  ('notification_enabled', 'false', CURRENT_TIMESTAMP),
  ('notification_time',    '08:00', CURRENT_TIMESTAMP),
  ('medication_tracking',  'false', CURRENT_TIMESTAMP),
  ('reduce_animations',    'false', CURRENT_TIMESTAMP),
  ('streak_forgiveness',   'true',  CURRENT_TIMESTAMP),
  ('weekly_goal',          '3',     CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO tags (label, category, sentiment, is_preset) VALUES
  ('Well hydrated',         'nutrition',    'positive', 1),
  ('Not enough water',      'nutrition',    'negative', 1),
  ('Ate well',              'nutrition',    'positive', 1),
  ('Ate too soon',          'nutrition',    'negative', 1),
  ('Ate too late',          'nutrition',    'negative', 1),
  ('Good pace',             'effort',       'positive', 1),
  ('Strong finish',         'effort',       'positive', 1),
  ('Had more left',         'effort',       'positive', 1),
  ('Went out too hard',     'effort',       'negative', 1),
  ('Burned out halfway',    'effort',       'negative', 1),
  ('Locked in',             'mental',       'positive', 1),
  ('Distracted throughout', 'mental',       'negative', 1),
  ('Anxious before starting','mental',      'negative', 1),
  ('Good sleep',            'pre_workout',  'positive', 1),
  ('Poor sleep',            'pre_workout',  'negative', 1),
  ('Tired but pushed through','pre_workout','neutral',  1),
  ('Stressed beforehand',   'pre_workout',  'negative', 1),
  ('Felt calm',             'pre_workout',  'positive', 1),
  ('Too noisy',             'environment',  'negative', 1),
  ('Had company',           'environment',  'positive', 1),
  ('Worked out alone',      'environment',  'neutral',  1);
```

---

## 8. Code Already Written

The following files are complete and should be used as-is. Do not rewrite them.

### `flux-types.ts`

Contains all shared TypeScript interfaces mirroring the schema: `CheckIn`, `Workout`, `Tag`,
`StreakState`, and all pattern result shapes (`EnergyRhythmResult`, `TagMoodCorrelationRow`,
`BurnoutPrecursorResult`, `HydrationInsightResult`, `PatternResult<T>`, `PatternType`).

### `flux-pattern-engine.ts`

The read path. Public API:
- `getPattern<T>(db, type)` — returns a cached or freshly computed `PatternResult<T>`
- `invalidatePatternCache(db)` — marks all cached patterns stale; call after every write

Implements four pattern computations internally:
1. `computeEnergyRhythm` — day-of-week energy averages, min 3 samples to trust a day
2. `computeTagMoodCorrelation` — tag → avg mood_after, min 2 sessions to include a tag
3. `computeBurnoutPrecursor` — flags when this week's negative tags exceed 1.5× trailing average
4. `computeHydrationInsight` — mood difference between hydrated/dehydrated sessions,
   requires 3+ hydrated and 2+ dehydrated sessions before surfacing

### `flux-workout-service.ts`

The write path. Public API:
- `logCheckIn(db, input)` — upserts a check-in, invalidates cache
- `logWorkoutWithTags(db, workout, tagIds)` — inserts workout, links tags, bumps use_count,
  updates streak, invalidates cache. Returns the new workout's id.
- `getStreakState(db)` — reads the single streaks row
- `evaluateStreakOnAppOpen(db, today)` — call once on every app open before user interaction;
  silently spends banked rest days for missed days, or resets streak if too many missed
- `getOrCreateTag(db, label)` — finds existing tag by label or creates custom one
- `getQuickAccessTags(db, limit?)` — returns top tags by use_count for the Log screen

**Known issue to fix:** In `logWorkoutWithTags`, `bumpTagUseCount` fires once per entry in
the `tagIds` array regardless of whether the INSERT OR IGNORE actually inserted a new row.
Deduplicate `tagIds` at the start of the function with
`const uniqueTagIds = [...new Set(tagIds)]` before the loop.

### `__tests__/flux-test-utils.ts`

Test harness wrapping `better-sqlite3` behind the expo-sqlite async interface.
Exports: `createTestDb()`, `daysAgo(n)`, `weekdayLabel(dateStr)`, `seedTag()`,
`seedWorkout()`, `tagWorkout()`.

### `__tests__/flux-workout-service.test.ts` and `__tests__/flux-pattern-engine.test.ts`

Full test suites covering the write path (check-ins, streaks, tags, orchestration) and
read path (cache hit/miss/invalidate, all four pattern computations with data sufficiency
guards). Run with `jest`.

---

## 9. What Needs to Be Built

Everything in Section 8 is done. The remaining work is:

### 9.1 Database initialisation module (`flux-db.ts`)

- Open the SQLite database using `expo-sqlite`'s `openDatabaseAsync`
- Run the full schema SQL from Section 7 on first launch
- Export a singleton `getDb()` function used everywhere
- Wrap in a React context (`DatabaseProvider`) so the db instance is available
  to all screens without prop drilling

### 9.2 App entry point and navigation (`app/`)

Using Expo Router file-based routing:

```
app/
  _layout.tsx          — root layout, wraps DatabaseProvider, handles onboarding redirect
  (onboarding)/
    _layout.tsx
    index.tsx           — screen 1: validation
    energy.tsx          — screen 2: first check-in
    suggestion.tsx      — screen 3: first suggestion
    notifications.tsx   — screen 4: notification opt-in
  (tabs)/
    _layout.tsx         — bottom tab navigator (4 tabs)
    index.tsx           — Home screen
    log.tsx             — Log screen
    insights.tsx        — Insights screen
    settings.tsx        — Settings screen
```

On first launch (no `onboarding_complete` in settings), redirect to `(onboarding)/index`.
After onboarding completes, write `onboarding_complete = 'true'` to settings and redirect
to `(tabs)/`.

### 9.3 Reusable components (`components/`)

Build these as standalone components, each in its own file:

- `EnergyOrb.tsx` — animated circular orb with emoji, label, colour by level (1–5),
  accepts `level`, `selected`, `onPress`, `disabled` props
- `TagChip.tsx` — tappable chip with sentiment-coloured selected state; props:
  `label`, `sentiment`, `selected`, `onPress`, `small?`
- `InsightCard.tsx` — coloured insight block with icon, title, body; props:
  `icon`, `title`, `body`, `sentiment` ('positive' | 'negative' | 'neutral')
- `StreakGrid.tsx` — 7-day grid with soft forgiveness display; props: `days`
  (array of `{ date: string; active: boolean; forgiven: boolean }`), `restDaysBanked`
- `SuggestionCard.tsx` — today's workout suggestion; props: `energyLevel`, `onStart`,
  `onSkip`; derives activity name, description, and icon from energyLevel internally
- `PatternBarChart.tsx` — simple 7-column bar chart for energy rhythm; props: `data`
  (array of `{ day: string; avgEnergy: number; samples: number }`)
- `PostWorkoutNudge.tsx` — the focus window celebration screen; props: `onDone`

### 9.4 Home screen (`app/(tabs)/index.tsx`)

Wire up:
1. On mount: call `evaluateStreakOnAppOpen(db, today)` then load streak state
2. Load today's check-in from DB to pre-fill energy orbs if already checked in
3. Energy orb tap → `logCheckIn(db, ...)` with the selected level → show SuggestionCard
4. Streak state → `StreakGrid` component
5. `getPattern(db, 'day_energy_rhythm')` and `getPattern(db, 'hydration_insight')`
   → preview insight chips at bottom of home screen
6. "Start — 5 min min" → navigate to Log tab with activity type pre-filled
7. "Not today" → dismiss SuggestionCard, show a soft affirmation ("Rest is training too.")

### 9.5 Log screen (`app/(tabs)/log.tsx`)

Wire up:
1. Activity type chip selection (single select)
2. Mood after emoji selection (nullable — user can skip)
3. Tag chip grid loaded from `getQuickAccessTags(db, 6)` + all presets in scrollable area
4. Custom tag input → `getOrCreateTag(db, label)` → add to selected set
5. Done button → deduplicate selectedTagIds → `logWorkoutWithTags(db, workout, tagIds)`
6. Navigate to `PostWorkoutNudge` component
7. Handle pre-filled activity type from Home screen navigation params

### 9.6 Insights screen (`app/(tabs)/insights.tsx`)

Wire up:
1. Session count query: `SELECT COUNT(*) FROM workouts WHERE date >= date('now','-30 days')`
2. If count < 7: show empty state (no fake data)
3. If count >= 7:
   - `getPattern(db, 'day_energy_rhythm')` → `PatternBarChart` + plain-language summary
   - `getPattern(db, 'tag_mood_correlation')` → tag frequency list with sentiment bars
   - `getPattern(db, 'burnout_precursor')` → show amber `InsightCard` if `isElevated`
   - `getPattern(db, 'hydration_insight')` → show green `InsightCard` if `hasEnoughData`
4. All patterns loaded in parallel with `Promise.all`
5. Loading state: skeleton cards (no spinners — they are too stimulating for ADHD users)

### 9.7 Settings screen (`app/(tabs)/settings.tsx`)

Wire up:
1. Load all settings from DB on mount
2. Each toggle/picker: writes immediately to settings table on change
3. Notification time picker: reschedules expo-notifications on change
4. "Export my data": queries all tables, serialises to JSON, triggers share sheet
5. "Clear all data": confirmation alert → `DELETE FROM` all tables → re-seed defaults
   → navigate to onboarding (treat as new user)
6. Privacy badge always visible at bottom

### 9.8 Notification service (`flux-notifications.ts`)

- `scheduleCheckInReminder(time: string)` — schedules a daily repeating local notification
- `cancelCheckInReminder()` — cancels it
- Notification titles must use non-guilt language:
  - "Time to check in with Flux ⚡"
  - "How's your energy today?"
  - "Quick check-in — 5 seconds"

---

## 10. Monetization

### Free tier ("Flux Core")
- Daily energy check-in
- Workout logging
- Preset + custom tags
- 7-day session history visible
- Streak tracker with forgiveness
- Focus window nudge
- Basic insight preview on Home (single card only)

### Paid tier ("Flux Full") — $7.99/month or $54.99/year
- Full Insights screen (all patterns, full history)
- 12-month history
- Wearable integration (Phase 2)
- Optional account + cloud backup (Phase 2)
- Medication timing toggle

### Paywall implementation
- 30-day free trial of Flux Full on signup — no credit card required
- Gate the full Insights screen behind a paywall check
- Show a single "teaser" insight on the free tier to demonstrate value
- When the paywall triggers: bottom sheet, not a full-screen interrupt
- Copy: "30 days of your check-ins are ready to show you something. Unlock your patterns."
- Use RevenueCat (`react-native-purchases`) for subscription management — it handles
  App Store and Google Play billing with a unified API

---

## 11. Build Priorities

Build in this order. Do not build Layer 2 items until Layer 1 is complete and tested.

**Layer 1 (MVP — build now)**
1. Database initialisation + DatabaseProvider context
2. Expo Router navigation structure
3. All reusable components
4. Onboarding flow (4 screens)
5. Home screen fully wired
6. Log screen fully wired
7. Insights screen fully wired
8. Settings screen fully wired
9. Notification service
10. Paywall integration (RevenueCat)

**Layer 2 (Post-launch)**
- Apple HealthKit integration
- Android Health Connect integration
- Supabase account + sync
- Wearable data ingestion into `wearable_data` table
- Upgrade pattern engine to incorporate HRV and sleep score from wearable data

---

## 12. Critical Constraints

- **Never** render a number on screen that implies body weight, BMI, or calories
- **Never** use the word "fail", "missed", "broke", "skipped" in any user-facing string
- **Never** show a streak as broken — if forgiveness is spent, the number just stays the same
- **Never** request more than the minimum required permissions
- **Never** make a network request without explicit user consent (account opt-in)
- **Always** respect the `reduce_animations` setting in every animated component
- **Always** call `evaluateStreakOnAppOpen` before rendering the Home screen
- **Always** call `invalidatePatternCache` inside `logWorkoutWithTags` and `logCheckIn`
  (already implemented — do not remove these calls)
- **Always** deduplicate `tagIds` before passing to `logWorkoutWithTags`
- The `streaks` table always has exactly one row (id = 1). Treat it as a singleton.
- `patterns_cache.pattern_type` must be UNIQUE (already in schema above) — the upsert
  in `getPattern` depends on it
- `check_ins.date` is UNIQUE — one check-in per calendar day. The upsert in `logCheckIn`
  handles this correctly; do not INSERT without ON CONFLICT handling.

---

## 13. File Structure

```
/
├── app/
│   ├── _layout.tsx
│   ├── (onboarding)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── energy.tsx
│   │   ├── suggestion.tsx
│   │   └── notifications.tsx
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── index.tsx
│       ├── log.tsx
│       ├── insights.tsx
│       └── settings.tsx
├── components/
│   ├── EnergyOrb.tsx
│   ├── TagChip.tsx
│   ├── InsightCard.tsx
│   ├── StreakGrid.tsx
│   ├── SuggestionCard.tsx
│   ├── PatternBarChart.tsx
│   └── PostWorkoutNudge.tsx
├── lib/
│   ├── flux-types.ts           ← COMPLETE, do not modify
│   ├── flux-db.ts              ← needs to be built
│   ├── flux-pattern-engine.ts  ← COMPLETE, do not modify
│   ├── flux-workout-service.ts ← COMPLETE (fix use_count dedup bug)
│   └── flux-notifications.ts   ← needs to be built
├── context/
│   └── DatabaseContext.tsx     ← needs to be built
├── constants/
│   └── colors.ts               ← extract palette from Section 3
├── __tests__/
│   ├── flux-test-utils.ts      ← COMPLETE, do not modify
│   ├── flux-pattern-engine.test.ts ← COMPLETE, do not modify
│   └── flux-workout-service.test.ts ← COMPLETE, do not modify
├── jest.config.js              ← COMPLETE
├── app.json
├── tsconfig.json
└── package.json
```

---

## 14. App Identity

- **Name:** Flux
- **Tagline:** "Built for your brain."
- **Logo:** A small rounded rectangle with a lightning bolt (⚡) inside, filled with a
  linear gradient from accent (#7B6EF6) to green (#4ECFA0)
- **Wordmark:** "flux" lowercase, weight 800, letter-spacing -0.04em, same gradient as logo
- **Tone of voice:** Warm, direct, non-clinical. Like a supportive friend who gets ADHD.
  Never motivational-poster energy. Never medical. Never condescending.
- **Bundle ID:** com.fluxapp.flux (placeholder — update before App Store submission)
