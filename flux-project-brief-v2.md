# Flux — Complete Project Brief v2
# Single source of truth for all product, design, architecture, and code decisions.
# Read fully before writing any code.

---

## 1. Product Vision

Flux is a local-first, privacy-forward fitness tracker built around the specific neurology
of ADHD. It solves two problems most fitness apps ignore for this population:

1. Starting and sticking to a routine
2. Managing energy crashes and burnout

### What Flux is NOT
- Not a weight loss app. Body metrics are an optional, off-by-default data tool with
  no goal or deficit framing.
- Not a social competition platform. Social features are accountability and collaboration.
- Not AI-powered. All intelligence is local rule-based pattern matching on SQLite.
- No ads. Ever.
- No shame. The bucket only fills. It never empties.

---

## 2. Target User

Primary: Adults (18-45) diagnosed with or identifying as having ADHD.

Key traits to design for:
- Poor task initiation
- Novelty-seeking (variety is a feature, rigid plans are failure triggers)
- Difficulty connecting cause and effect over time (tagging externalises this)
- Rejection sensitive dysphoria (any punishment language causes immediate disengagement)
- Variable energy and focus
- Hyperfocus windows after exercise (1-2hrs enhanced concentration)
- Often on stimulant medication
- Significant comorbidity with eating disorders (body metrics must be neutral data tools)

---

## 3. Design System

### Colour Palette (Dark theme only for MVP)
bg:           #0F0F14
surface:      #17171F
surfaceHigh:  #1E1E2A
border:       #2A2A38
accent:       #7B6EF6
accentSoft:   #2D2847
accentGlow:   rgba(123,110,246,0.15)
green:        #4ECFA0
greenSoft:    #1A3329
amber:        #F5A623
amberSoft:    #2E2310
teal:         #38BDF8
tealSoft:     #0C2233
rose:         #F87171
roseSoft:     #2A1010
purple:       #C084FC
purpleSoft:   #1E1030
textPrimary:  #F0EFF8
textSecondary:#8B8AA0
textMuted:    #52516A

### Typography
Font: Inter, -apple-system, BlinkMacSystemFont, sans-serif
Headings: weight 700-800, letter-spacing -0.03em to -0.04em
Body: weight 400, line-height 1.5
Labels: weight 600, letter-spacing 0.06-0.10em, uppercase

### Shape
Large card radius: 18px | Medium: 14px | Small: 10px | Chip: 8px
Screen padding: 20px | Card padding: 16-18px | Card gap: 16-20px

### Design Principles (Non-Negotiable)
1. Zero guilt language
2. Minimal UI by default
3. Body metrics are neutral data — no goals, no colour-coded trends, no deficit framing
4. Variable rewards — not predictable badges
5. The bucket only fills — progress is permanent
6. Pre-built defaults — no blank slates
7. Maximum 4 bottom navigation items at all times
8. Every feature reachable in 2 taps
9. Social features are collaborative, not competitive

---

## 4. Navigation Structure

Bottom nav always shows exactly 4 tabs. Tab 4 changes based on body metrics setting.

Body metrics DISABLED (default):
  Home | Log | Insights | Settings

Body metrics ENABLED:
  Home | Log | Insights | Body
  (Settings moves to profile icon in top-right header, always visible)

The profile icon is always rendered in the top-right header on all screens.
When body metrics are disabled it links to Settings.
When body metrics are enabled it links to a profile/settings sheet.
Settings is never more than one tap away.

---

## 5. The Bucket Mechanic

The bucket replaces the streak system entirely. Where streaks use loss aversion,
the bucket uses permanent accumulation. The bucket level never decreases. A user
who opens the app after two months sees their bucket exactly where they left it.

### Drop Formula

drops = base(10) + duration_bonus + effort_bonus

duration_bonus:
  Not logged  ->  0
  0-10 min    ->  0
  11-20 min   ->  3
  21-30 min   ->  7
  31-45 min   -> 12
  46-60 min   -> 18
  60+ min     -> 25

effort_bonus (mood_after):
  Not logged or 1-2  ->  0
  3                  ->  3
  4                  ->  7
  5                  -> 12

Examples:
  5-min walk, no mood     = 10 drops (base only)
  20-min yoga, mood 3     = 20 drops (10+3+7)
  45-min lift, mood 5     = 34 drops (10+12+12)
  Max possible per session= 47 drops (10+25+12)

### Bucket Tier System

Tier | Name      | Cumulative drops | Drops to next tier
-----|-----------|------------------|-----------
1    | Pail      | 0                | 100
2    | Bucket    | 100              | 200
3    | Barrel    | 300              | 300
4    | Trough    | 600              | 500
5    | Reservoir | 1100             | No ceiling

Fill level display:
  fill_pct = (lifetime_drops - tier_start) / tier_size * 100

Tier transition: celebration animation, bucket morphs into larger vessel.
Always shows lifetime_drops as secondary label ("1,247 total drops").
Water fill colour: accent purple (#7B6EF6) with shimmer.
Never shows a downward trend, broken state, or loss.

### Bucket Database Table
CREATE TABLE IF NOT EXISTS bucket (
  id                INTEGER PRIMARY KEY DEFAULT 1,
  lifetime_drops    INTEGER NOT NULL DEFAULT 0,
  current_tier      INTEGER NOT NULL DEFAULT 1,
  total_workouts    INTEGER NOT NULL DEFAULT 0,
  last_workout_date DATE,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO bucket (id) VALUES (1);

### Bucket Service API (lib/bucket_service.ts)

Pure functions (no DB, unit-testable in isolation):
  calculateDrops(durationMinutes: number | null, moodAfter: number | null): number
  getTierInfo(lifetimeDrops: number): TierInfo

DB functions:
  getBucketState(db): Promise<BucketState>
  addDrops(db, { durationMinutes, moodAfter }): Promise<DropResult>

addDrops must:
1. Call calculateDrops
2. UPDATE bucket SET lifetime_drops = lifetime_drops + drops, total_workouts += 1
3. Recalculate tier from new lifetime_drops
4. If tier changed, UPDATE current_tier
5. Return DropResult (used by PostWorkoutNudge to show celebration)

---

## 6. Social Features

Requires Supabase accounts. Layer 2, but Supabase must be scoped earlier.

### Three Challenge Modes (user chooses per challenge)

1. Accountability Only
   Friends see a presence indicator: "Alex logged a session today."
   No scores, no counts, no comparisons. Leverages body doubling research.

2. Collaborative
   Both contribute toward a single shared goal.
   Example: "Can we hit 12 workouts between us this week?"
   Always additive framing: "You're at 8 of 12 together."
   Never: "Challenge failed."

3. Friendly Competitive
   Both bucket fill progress visible side by side over a set period.
   Not a ranked leaderboard — two buckets filling in parallel.
   No winner/loser language — just a summary of what each person achieved.

### Social Database Tables (in Supabase, not local SQLite)

CREATE TABLE user_profiles (
  id           TEXT PRIMARY KEY,  -- Supabase auth UUID
  username     TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE friendships (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT NOT NULL,
  friend_id  TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending','accepted','blocked')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, friend_id)
);

CREATE TABLE challenges (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  mode       TEXT NOT NULL CHECK (mode IN ('accountability','collaborative','competitive')),
  title      TEXT NOT NULL,
  goal_value INTEGER,   -- null for accountability mode
  goal_unit  TEXT,      -- 'workouts' | 'drops' | null
  starts_at  DATE NOT NULL,
  ends_at    DATE NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE challenge_participants (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge_id INTEGER NOT NULL,
  user_id      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'invited'
               CHECK (status IN ('invited','accepted','declined')),
  progress     INTEGER NOT NULL DEFAULT 0,
  joined_at    TIMESTAMP,
  UNIQUE (challenge_id, user_id),
  FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
);

RLS: Users can only read rows they participate in.

### Social Push Notifications (all off by default)
- Friend request received
- Challenge invite received
- Friend logged a workout in accountability challenge
- Collaborative challenge within 20% of goal
- Challenge completed (summary for all participants)

### Friends Screen (app/friends.tsx, not a tab)
- Accessible from Home header or notification deep link
- If no account: prompt to create one (natural social onramp)
- Friend list with today's presence indicators (Supabase Realtime)
- Active challenge cards with progress
- New challenge button -> creation sheet
- Friend search by username
- Pending friend requests

---

## 7. Optional Body Metrics

Off by default. User explicitly enables in Settings.
When disabled, no body-related UI appears anywhere.

### Safety Guardrails (Non-Negotiable)
- No goal weight field, anywhere, ever
- No calorie deficit framing ("X calories remaining")
- No colour-coding of weight direction
- No congratulations or reactions to weight changes
- Calorie display is a daily total log only, no target, no progress bar toward a limit
- Body tab first visible element is always a permanent banner:
  "Body data is just data. No goals, no judgement."
- First-time calorie tracking enable shows consent notice:
  "Calorie tracking is a neutral log. Flux doesn't set targets or evaluate your intake."

### When Enabled

Navigation: Body tab appears as Tab 4. Settings moves to profile icon header.

Home widget (collapsible): appears below Bucket card.
  - Today's calorie total (if calorie tracking also enabled)
  - Last logged weight + 7-entry neutral monochrome sparkline
  - Collapse chevron (persists per-session, not to DB)

Body tab screens:
  Weight and measurements:
    - Neutral monochrome line chart, no target line
    - Log entry: date (default today), weight, optional notes
    - Optional measurements: waist, chest, hips, arms (all nullable)
    - History list newest first
    - Directional language forbidden: show "changed 2.3kg" not "down 2.3kg"

  Calorie log (only if calorie tracking enabled):
    - 7-day neutral bar chart, no target line, no colour coding
    - Log entry: date, total calories (single field, no macro breakdown in MVP)
    - History list newest first

### Body Metrics Database Tables (local SQLite)

CREATE TABLE IF NOT EXISTS body_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       DATE    NOT NULL,
  weight     REAL,
  waist_cm   REAL,
  chest_cm   REAL,
  hips_cm    REAL,
  arms_cm    REAL,
  notes      TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bl_date ON body_logs(date);

CREATE TABLE IF NOT EXISTS calorie_logs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  date           DATE    NOT NULL UNIQUE,
  total_calories INTEGER NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cl_date ON calorie_logs(date);

---

## 8. Complete Local SQLite Schema

Run on first launch via execAsync. All statements use IF NOT EXISTS.

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

CREATE TABLE IF NOT EXISTS bucket (
  id                INTEGER PRIMARY KEY DEFAULT 1,
  lifetime_drops    INTEGER NOT NULL DEFAULT 0,
  current_tier      INTEGER NOT NULL DEFAULT 1,
  total_workouts    INTEGER NOT NULL DEFAULT 0,
  last_workout_date DATE,
  updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

CREATE TABLE IF NOT EXISTS body_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       DATE    NOT NULL,
  weight     REAL,
  waist_cm   REAL,
  chest_cm   REAL,
  hips_cm    REAL,
  arms_cm    REAL,
  notes      TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bl_date ON body_logs(date);

CREATE TABLE IF NOT EXISTS calorie_logs (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  date           DATE    NOT NULL UNIQUE,
  total_calories INTEGER NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cl_date ON calorie_logs(date);

CREATE TABLE IF NOT EXISTS wearable_data (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  date               DATE    NOT NULL UNIQUE,
  resting_hr         REAL,
  hrv                REAL,
  sleep_minutes      INTEGER,
  sleep_score        REAL,
  steps              INTEGER,
  active_energy_kcal REAL,
  source             TEXT    NOT NULL,
  created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_wd_date ON wearable_data(date);

CREATE TABLE IF NOT EXISTS settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed rows
INSERT OR IGNORE INTO bucket  (id) VALUES (1);

INSERT OR IGNORE INTO settings VALUES
  ('notification_enabled',   'false', CURRENT_TIMESTAMP),
  ('notification_time',      '08:00', CURRENT_TIMESTAMP),
  ('medication_tracking',    'false', CURRENT_TIMESTAMP),
  ('reduce_animations',      'false', CURRENT_TIMESTAMP),
  ('body_metrics_enabled',   'false', CURRENT_TIMESTAMP),
  ('calorie_tracking',       'false', CURRENT_TIMESTAMP),
  ('weight_unit',            'kg',    CURRENT_TIMESTAMP),
  ('weekly_goal',            '3',     CURRENT_TIMESTAMP),
  ('social_notif_checkin',   'false', CURRENT_TIMESTAMP),
  ('social_notif_challenge', 'false', CURRENT_TIMESTAMP),
  ('onboarding_complete',    'false', CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO tags (label, category, sentiment, is_preset) VALUES
  ('Well hydrated',           'nutrition',   'positive', 1),
  ('Not enough water',        'nutrition',   'negative', 1),
  ('Ate well',                'nutrition',   'positive', 1),
  ('Ate too soon',            'nutrition',   'negative', 1),
  ('Ate too late',            'nutrition',   'negative', 1),
  ('Good pace',               'effort',      'positive', 1),
  ('Strong finish',           'effort',      'positive', 1),
  ('Had more left',           'effort',      'positive', 1),
  ('Went out too hard',       'effort',      'negative', 1),
  ('Burned out halfway',      'effort',      'negative', 1),
  ('Locked in',               'mental',      'positive', 1),
  ('Distracted throughout',   'mental',      'negative', 1),
  ('Anxious before starting', 'mental',      'negative', 1),
  ('Good sleep',              'pre_workout', 'positive', 1),
  ('Poor sleep',              'pre_workout', 'negative', 1),
  ('Tired but pushed through','pre_workout', 'neutral',  1),
  ('Stressed beforehand',     'pre_workout', 'negative', 1),
  ('Felt calm',               'pre_workout', 'positive', 1),
  ('Too noisy',               'environment', 'negative', 1),
  ('Had company',             'environment', 'positive', 1),
  ('Worked out alone',        'environment', 'neutral',  1);

---

## 9. TypeScript Types

All types in lib/flux-types.ts. The original file is complete — add these new interfaces:

// Bucket
interface BucketState {
  lifetimeDrops: number;
  currentTier: number;      // 1-5
  totalWorkouts: number;
  lastWorkoutDate: string | null;
}

interface TierInfo {
  tier: number;
  name: 'Pail' | 'Bucket' | 'Barrel' | 'Trough' | 'Reservoir';
  fillPct: number;           // 0-100
  dropsToNext: number | null; // null at Reservoir
  tierStart: number;
}

interface DropResult {
  dropsEarned: number;
  newTotal: number;
  tierAdvanced: boolean;
  newTier?: TierInfo;
}

// Body metrics
interface BodyLog {
  id: number; date: string; weight: number | null;
  waistCm: number | null; chestCm: number | null;
  hipsCm: number | null; armsCm: number | null;
  notes: string | null; createdAt: string;
}

interface CalorieLog {
  id: number; date: string;
  totalCalories: number; notes: string | null; createdAt: string;
}

---

## 10. Code Already Written — Do Not Rewrite

lib/flux-types.ts            COMPLETE — add new types from Section 9
lib/flux-pattern-engine.ts   COMPLETE — do not modify
lib/flux-workout-service.ts  COMPLETE — apply these two changes:
  1. Deduplicate tagIds: const uniqueTagIds = [...new Set(tagIds)]
  2. Remove all streak calls. Replace recordActivityForStreak with:
     await addDrops(db, { durationMinutes: workout.durationMinutes ?? null,
                          moodAfter: workout.moodAfter ?? null })
     Import addDrops from bucket_service.ts
  3. Delete getStreakState and evaluateStreakOnAppOpen — replaced by bucket system

__tests__/flux-test-utils.ts           COMPLETE — do not modify
__tests__/flux-pattern-engine.test.ts  COMPLETE — do not modify
__tests__/flux-workout-service.test.ts COMPLETE — remove all streak-related tests.
                                        They are superseded by bucket tests.
jest.config.js                         COMPLETE

---

## 11. What Needs to Be Built

### lib/flux-db.ts
- openDatabaseAsync, run schema SQL from Section 8
- Export singleton getDb()
- Export DatabaseProvider React context

### lib/bucket_service.ts

export function calculateDrops(
  durationMinutes: number | null,
  moodAfter: number | null
): number

export function getTierInfo(lifetimeDrops: number): TierInfo

export async function getBucketState(db: SQLiteDatabase): Promise<BucketState>

export async function addDrops(
  db: SQLiteDatabase,
  workout: { durationMinutes: number | null; moodAfter: number | null }
): Promise<DropResult>

Tier constants (co-locate with bucket_service.ts):
const TIERS = [
  { tier: 1, name: 'Pail',      start: 0,    size: 100 },
  { tier: 2, name: 'Bucket',    start: 100,  size: 200 },
  { tier: 3, name: 'Barrel',    start: 300,  size: 300 },
  { tier: 4, name: 'Trough',    start: 600,  size: 500 },
  { tier: 5, name: 'Reservoir', start: 1100, size: Infinity },
];

### __tests__/flux-bucket-service.test.ts

Required test cases:
- calculateDrops: null duration + null mood = 10 (base only)
- calculateDrops: each duration bracket returns correct bonus
- calculateDrops: each mood_after value returns correct bonus
- calculateDrops: max possible (60+ min, mood 5) = 47
- getTierInfo: 0 drops -> Pail, fillPct 0
- getTierInfo: 99 drops -> Pail, fillPct 99
- getTierInfo: 100 drops -> Bucket, fillPct 0
- getTierInfo: 300 drops -> Barrel, fillPct 0
- getTierInfo: 1100 drops -> Reservoir, dropsToNext null
- addDrops: lifetime_drops increases by correct amount
- addDrops: calling addDrops on same day twice both contribute (no date dedup)
- addDrops: tierAdvanced true when crossing 100, 300, 600, 1100
- addDrops: lifetime_drops never decreases under any input

### context/DatabaseContext.tsx
React context exposing db instance. DatabaseProvider wraps entire app.
useDatabaseContext() hook for consumption.

### constants/colors.ts
Export all hex values from Section 3 as named constants.

### lib/flux-notifications.ts
scheduleCheckInReminder(time: string): Promise<void>
cancelCheckInReminder(): Promise<void>

Notification copy (rotate randomly, never repeat twice consecutively):
  "Time to check in with Flux ⚡"
  "How's your energy today?"
  "Quick check-in — 5 seconds"
  "Your bucket is waiting 💧"

### components/

EnergyOrb.tsx
  Props: level (1-5), selected (bool), onPress, disabled
  Animated orb with radial gradient, emoji, label, glow shadow
  Level colour map: 1->blue-grey, 2->muted purple, 3->blue, 4->green, 5->bright green
  Selected: scale 1.15x via Reanimated
  Non-selected when one is chosen: opacity 0.45

TagChip.tsx
  Props: label, sentiment, selected, onPress, small?
  Selected positive: greenSoft background, green border, green text
  Selected negative: amberSoft background, amber border, amber text
  Unselected: surfaceHigh background, border, textSecondary

InsightCard.tsx
  Props: icon, title, body, sentiment ('positive' | 'negative' | 'neutral')
  Positive: greenSoft background, green border, green title
  Negative: amberSoft background, amber border, amber title
  Neutral: surfaceHigh background

BucketWidget.tsx
  Props: lifetimeDrops, animateFill (bool), onTierAdvance callback
  SVG bucket that fills via clip-path animation
  Fill colour: accent (#7B6EF6) with animated shimmer overlay
  Shows tier name above, "lifetime_drops total drops" below
  Shows "N drops to [next tier]" as subtext
  onTierAdvance fires when a new tier threshold is crossed
  Respect reduce_animations: skip animation if enabled, jump to final fill level

SuggestionCard.tsx
  Props: energyLevel (1-5), onStart, onSkip
  Derives activity, description, icon from energyLevel:
    1 -> ("2-min breathing stretch", "Gentle. No pressure. Just move a little.", "🌊")
    2 -> ("10-min walk", "Low effort, big mood shift. Outside if you can.", "🚶")
    3 -> ("20-min bodyweight flow", "A solid middle-ground session.", "💪")
    4 -> ("30-min strength circuit", "You've got fuel — use it.", "🔥")
    5 -> ("45-min high-intensity", "Full charge. Let's go hard today.", "⚡")
  Primary CTA: "Start — 5 min min" (accent bg, white text)
  Secondary CTA: "Not today" (ghost)

PatternBarChart.tsx
  Props: data ({ day: string; avgEnergy: number; samples: number }[])
  7 columns, Mon-Sun, bar height proportional to avgEnergy (max 5)
  High bars: accent gradient. Low bars: surfaceHigh.
  Day labels below each bar.

PostWorkoutNudge.tsx
  Props: dropResult (DropResult), onDone
  Shows drops earned: "⚡ +{dropsEarned} drops · {newTotal} total"
  If tierAdvanced: full celebration — bucket grows animation, tier name reveal
  Focus window nudge card (accentSoft background):
    "FOCUS WINDOW OPEN" label
    "You've got 1-2 hrs of enhanced focus. What do you want to use it for?"
  "Done" button -> onDone

BodyMetricsBanner.tsx
  Props: none
  Static banner, always rendered, never dismissible
  Text: "Body data is just data. No goals, no judgement."
  Style: textMuted, small font, surfaceHigh background, subtle border

CollapsibleCard.tsx
  Props: title, children, defaultCollapsed? (bool)
  Chevron rotates on collapse. Collapse state in useState (not persisted to DB).

### App screens

app/_layout.tsx
  Wraps entire app in DatabaseProvider
  Reads onboarding_complete from settings
  If 'false' -> router.replace('/(onboarding)')
  If 'true'  -> router.replace('/(tabs)')

app/(onboarding)/_layout.tsx
  Stack navigator, no header

app/(onboarding)/index.tsx     Screen 1: validation statement + CTA
app/(onboarding)/energy.tsx    Screen 2: first check-in (5 energy orbs)
app/(onboarding)/suggestion.tsx Screen 3: first suggestion based on energy
app/(onboarding)/notifications.tsx Screen 4: notification opt-in + "Done" writes
                                   onboarding_complete='true' to settings

app/(tabs)/_layout.tsx
  Reads body_metrics_enabled from settings (re-reads on settings change via context)
  Renders 4 tabs dynamically:
    If body_metrics_enabled='false': Home | Log | Insights | Settings
    If body_metrics_enabled='true':  Home | Log | Insights | Body
  Profile icon always rendered in header, routes to Settings or profile sheet

app/(tabs)/index.tsx  HOME SCREEN
  On mount:
    Load today's check-in (pre-fill orbs if already logged)
    Load bucket state -> BucketWidget
    Load body_metrics_enabled and last body log -> collapsible widget
    getPattern(db,'day_energy_rhythm') + getPattern(db,'hydration_insight') -> preview chips
  Energy orb tap:
    Call logCheckIn(db, { date: today, energyLevel, mood: energyLevel })
    Show SuggestionCard (fade in via Reanimated)
  "Start — 5 min min":
    Navigate to Log tab with activityType param pre-filled
  "Not today":
    Dismiss SuggestionCard
    Show inline text: "Rest is training too. Your bucket is waiting."
  Tab top-to-bottom: header, EnergyOrb row, SuggestionCard, BucketWidget,
                     body widget (conditional), tag insights preview

app/(tabs)/log.tsx  LOG SCREEN
  Activity chip row (single select, required)
  Mood after emoji row (nullable)
  Duration input with live drop bonus preview: "~+N bonus drops"
  Tag chips: getQuickAccessTags(db, 6) for quick access + expandable preset categories
  Custom tag input
  Calorie field (only if calorie_tracking='true')
  Done button:
    const uniqueTagIds = [...new Set(selectedTagIds)]
    const workoutId = await logWorkoutWithTags(db, workout, uniqueTagIds)
    If calorie value entered: INSERT OR REPLACE INTO calorie_logs
    Navigate to PostWorkoutNudge with DropResult
  Handle activityType navigation param (from Home "Start" button)

app/(tabs)/insights.tsx  INSIGHTS SCREEN
  Load session count: SELECT COUNT(*) FROM workouts WHERE date >= date('now','-30 days')
  If count < 7: empty state message only, no fake data
  If count >= 7:
    Promise.all all 4 patterns
    Loading: skeleton cards (no spinners)
    Render: PatternBarChart, tag frequency list, conditional InsightCards

app/(tabs)/body.tsx  BODY TAB (only rendered when body_metrics_enabled='true')
  BodyMetricsBanner always at top (never dismissible)
  Weight section: chart + log entry CTA
  Calorie section (conditional on calorie_tracking): chart + log entry CTA
  No goal fields, no colour-coded trends, no directional language

app/(tabs)/settings.tsx  SETTINGS (tab or profile sheet depending on nav state)
  Sections: Check-ins | Body & Nutrition | Friends & Challenges | Progress | Display | Privacy | Account
  body_metrics_enabled toggle: on change, trigger tab navigator re-render immediately
  calorie_tracking toggle: show consent notice first time
  Reset bucket: two-step confirmation, sets lifetime_drops=0 current_tier=1 total_workouts=0
  Clear all data: drops + recreates all tables, returns to onboarding

app/friends.tsx  FRIENDS SCREEN (push navigated, not a tab)
  Gate: if no Supabase account, show account creation prompt
  Friend list with Realtime presence indicators
  Challenge cards
  New challenge creation sheet (mode, friends, goal, dates)
  Friend search by username
  Pending requests

---

## 12. Tech Stack

Framework:       React Native + Expo SDK 52+, Expo Router, TypeScript strict mode
Local DB:        expo-sqlite, raw async API only, no ORM
State:           React Context, no Redux or Zustand
Animations:      React Native Reanimated, always respect reduce_animations setting
Notifications:   expo-notifications (local) + Supabase Edge Functions (social, Layer 2)
Billing:         RevenueCat (react-native-purchases)
Cloud (Layer 2): Supabase — PostgreSQL, Auth, RLS, Realtime, Edge Functions
Sync (Layer 2):  Turso or PowerSync for local SQLite <-> Supabase
Wearables (L2):  react-native-health (HealthKit) + react-native-health-connect
Testing:         Jest + ts-jest + better-sqlite3

---

## 13. Monetization

Free tier (Flux Core):
  Daily check-in | Workout logging | Tag system | 7-day history
  Bucket widget (visible but limited history) | Focus window nudge
  Single insight preview card on Home | No body metrics

Paid tier (Flux Full) — $7.99/month or $54.99/year:
  Full Insights screen | 12-month history | Body metrics + calorie tracking
  Social features + challenges | Wearable integration (Phase 2)
  Cloud backup + account (Phase 2) | Medication timing toggle
  Insights PDF export (alternatively $4.99 one-time in-app purchase)

Trial: 30-day free trial of Flux Full, no credit card required. RevenueCat manages.

Paywall triggers (bottom sheet, never full-screen interrupt):
  Full Insights tab | Body metrics toggle | Add a friend | History scroll past 7 days
  Copy: "Your patterns are ready. Unlock them." Never: "Upgrade to Premium."

---

## 14. Build Order

Layer 1 — MVP:
  1. lib/flux-db.ts + DatabaseProvider context
  2. constants/colors.ts
  3. lib/bucket_service.ts + unit tests
  4. Update lib/flux-workout-service.ts (dedup fix + swap streak calls for addDrops)
  5. Update lib/flux-types.ts (add new interfaces from Section 9)
  6. All components (Section 11)
  7. Expo Router navigation structure with dynamic tab logic
  8. Onboarding flow (4 screens)
  9. Home screen
  10. Log screen
  11. Insights screen
  12. Body tab
  13. Settings screen
  14. lib/flux-notifications.ts
  15. RevenueCat paywall integration

Layer 2 — Post-launch:
  1. Supabase project + RLS policies
  2. Auth flow (magic link, no password)
  3. Social tables + Friends screen
  4. Challenge creation and progress
  5. Supabase Realtime for presence
  6. Push notifications for social
  7. Apple HealthKit integration
  8. Android Health Connect integration
  9. Wearable data -> automatic duration_bonus in drop calculation
  10. Sync (Turso or PowerSync)

Layer 3 — Growth:
  1. Web dashboard (Next.js, reads Supabase)
  2. Garmin direct API (Body Battery)
  3. Weekly digest screen
  4. Insights PDF export
  5. Localisation (Spanish, French first)

---

## 15. Critical Constraints

NEVER:
- Use "fail", "missed", "broke", "skipped" in any user-facing string
- Decrease lifetime_drops for any reason except explicit 2-step user reset
- Render a calorie target, deficit, or weight goal
- Colour-code weight direction (green=down, red=up is forbidden)
- Make a network request without explicit user consent (account opt-in)
- Request more than minimum required permissions
- Show a spinner (use skeleton cards instead)
- Show a blank slate (always seed with defaults or empty-state messaging)

ALWAYS:
- Call invalidatePatternCache inside logWorkoutWithTags and logCheckIn
- Call addDrops inside logWorkoutWithTags after the workout insert
- Deduplicate tagIds before the tag loop in logWorkoutWithTags
- Respect reduce_animations in every animated component
- Render BodyMetricsBanner as the first and permanent element in the Body tab
- Re-render the tab navigator immediately when body_metrics_enabled changes
- Treat the bucket table as a singleton (id=1 always, always exists)
- Use patterns_cache UNIQUE on pattern_type (ON CONFLICT upsert depends on it)
- Use ON CONFLICT DO UPDATE in logCheckIn (date is UNIQUE)
- Keep the bottom nav at exactly 4 tabs at all times

---

## 16. File Structure

/
├── app/
│   ├── _layout.tsx
│   ├── friends.tsx
│   ├── (onboarding)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── energy.tsx
│   │   ├── suggestion.tsx
│   │   └── notifications.tsx
│   └── (tabs)/
│       ├── _layout.tsx        dynamic tab rendering
│       ├── index.tsx          Home
│       ├── log.tsx            Log
│       ├── insights.tsx       Insights
│       ├── body.tsx           Body (conditional)
│       └── settings.tsx       Settings (conditional tab or profile sheet)
├── components/
│   ├── EnergyOrb.tsx
│   ├── TagChip.tsx
│   ├── InsightCard.tsx
│   ├── BucketWidget.tsx
│   ├── SuggestionCard.tsx
│   ├── PatternBarChart.tsx
│   ├── PostWorkoutNudge.tsx
│   ├── BodyMetricsBanner.tsx
│   └── CollapsibleCard.tsx
├── lib/
│   ├── flux-types.ts           COMPLETE + add types from Section 9
│   ├── flux-db.ts              BUILD
│   ├── flux-pattern-engine.ts  COMPLETE — do not modify
│   ├── flux-workout-service.ts COMPLETE — apply fixes from Section 10
│   ├── bucket_service.ts       BUILD
│   └── flux-notifications.ts   BUILD
├── context/
│   └── DatabaseContext.tsx     BUILD
├── constants/
│   └── colors.ts               BUILD
├── __tests__/
│   ├── flux-test-utils.ts           COMPLETE — do not modify
│   ├── flux-pattern-engine.test.ts  COMPLETE — do not modify
│   ├── flux-workout-service.test.ts COMPLETE — remove streak tests
│   └── flux-bucket-service.test.ts  BUILD
├── jest.config.js              COMPLETE
├── app.json
├── tsconfig.json               strict: true
└── package.json

---

## 17. App Identity

Name:      Flux
Tagline:   "Built for your brain."
Logo:      Rounded rectangle, gradient accent (#7B6EF6) to green (#4ECFA0), lightning bolt inside
Wordmark:  "flux" lowercase, weight 800, letter-spacing -0.04em, same gradient
Tone:      Warm, direct, non-clinical. Supportive friend who gets ADHD.
           Never motivational-poster. Never medical. Never condescending.
Bundle ID: com.fluxapp.flux (update before App Store submission)
