import { useState } from "react";

const C = {
  bg: "#0C0C12",
  surface: "#13131B",
  surfaceHigh: "#1A1A25",
  border: "#22223A",
  accent: "#7B6EF6",
  accentSoft: "#1A1640",
  green: "#4ECFA0",
  greenSoft: "#0E2218",
  amber: "#F5A623",
  amberSoft: "#241808",
  teal: "#38BDF8",
  tealSoft: "#091E2E",
  rose: "#F87171",
  roseSoft: "#240E0E",
  purple: "#C084FC",
  purpleSoft: "#1A0E2E",
  text: "#EEEDF8",
  textSub: "#7878A0",
  textMuted: "#3E3E58",
};

const tables = [
  {
    id: "check_ins",
    label: "check_ins",
    phase: "MVP",
    color: C.teal,
    bg: C.tealSoft,
    icon: "🧠",
    description: "One row per day. Primary input for the pattern engine.",
    fields: [
      { name: "id", type: "INTEGER", note: "PK · autoincrement" },
      { name: "date", type: "DATE", note: "UNIQUE · indexed" },
      { name: "energy_level", type: "INTEGER", note: "1–5 · required" },
      { name: "mood", type: "INTEGER", note: "1–5 · required" },
      { name: "sleep_quality", type: "INTEGER", note: "1–3 · nullable" },
      { name: "stress_level", type: "INTEGER", note: "1–3 · nullable" },
      { name: "medication_taken", type: "BOOLEAN", note: "nullable · feature flag" },
      { name: "created_at", type: "TIMESTAMP", note: "default now()" },
    ],
    indices: ["date"],
    queries: ["AVG energy GROUP BY day_of_week", "energy trend last 30 days", "mood after medication = true"],
  },
  {
    id: "workouts",
    label: "workouts",
    phase: "MVP",
    color: C.accent,
    bg: C.accentSoft,
    icon: "💪",
    description: "One row per logged session, manual or wearable-detected.",
    fields: [
      { name: "id", type: "INTEGER", note: "PK · autoincrement" },
      { name: "date", type: "DATE", note: "indexed · FK check_ins.date" },
      { name: "started_at", type: "TIMESTAMP", note: "nullable" },
      { name: "duration_minutes", type: "INTEGER", note: "nullable" },
      { name: "activity_type", type: "TEXT", note: "walk/run/lift/bike..." },
      { name: "mood_after", type: "INTEGER", note: "1–5 · nullable" },
      { name: "notes", type: "TEXT", note: "nullable" },
      { name: "source", type: "TEXT", note: "manual/healthkit/health_connect" },
      { name: "external_id", type: "TEXT", note: "nullable · dedup wearable imports" },
      { name: "created_at", type: "TIMESTAMP", note: "default now()" },
    ],
    indices: ["date", "activity_type", "source"],
    queries: ["mood_after by activity_type", "avg duration by energy_before", "workout gap analysis"],
  },
  {
    id: "tags",
    label: "tags",
    phase: "MVP",
    color: C.amber,
    bg: C.amberSoft,
    icon: "🏷️",
    description: "Preset and user-defined tags in one table. Sentiment drives pattern logic.",
    fields: [
      { name: "id", type: "INTEGER", note: "PK · autoincrement" },
      { name: "label", type: "TEXT", note: "UNIQUE · indexed" },
      { name: "category", type: "TEXT", note: "nutrition/effort/mental/environment/custom" },
      { name: "sentiment", type: "TEXT", note: "positive / negative / neutral" },
      { name: "is_preset", type: "BOOLEAN", note: "default false" },
      { name: "use_count", type: "INTEGER", note: "default 0 · drives quick-access UI" },
      { name: "created_at", type: "TIMESTAMP", note: "default now()" },
    ],
    indices: ["label", "category", "use_count DESC"],
    queries: ["top tags by use_count", "tags WHERE sentiment = negative last 7 sessions"],
  },
  {
    id: "workout_tags",
    label: "workout_tags",
    phase: "MVP",
    color: C.green,
    bg: C.greenSoft,
    icon: "🔗",
    description: "Junction table. One row per tag applied to a workout.",
    fields: [
      { name: "id", type: "INTEGER", note: "PK · autoincrement" },
      { name: "workout_id", type: "INTEGER", note: "FK → workouts.id · indexed" },
      { name: "tag_id", type: "INTEGER", note: "FK → tags.id · indexed" },
      { name: "created_at", type: "TIMESTAMP", note: "default now()" },
    ],
    indices: ["workout_id", "tag_id", "(workout_id, tag_id) UNIQUE"],
    queries: ["tag frequency last 30 days", "mood_after WHERE tag sentiment = positive", "pacing warnings this week"],
  },
  {
    id: "streaks",
    label: "streaks",
    phase: "MVP",
    color: C.rose,
    bg: C.roseSoft,
    icon: "🔥",
    description: "Single logical row. rest_days_banked enables streak forgiveness.",
    fields: [
      { name: "id", type: "INTEGER", note: "PK · always id = 1" },
      { name: "current_streak", type: "INTEGER", note: "default 0" },
      { name: "longest_streak", type: "INTEGER", note: "default 0" },
      { name: "last_active_date", type: "DATE", note: "nullable" },
      { name: "rest_days_banked", type: "INTEGER", note: "default 0 · max 3" },
      { name: "total_workouts", type: "INTEGER", note: "default 0" },
      { name: "updated_at", type: "TIMESTAMP", note: "default now()" },
    ],
    indices: [],
    queries: ["read current_streak on home screen", "check last_active_date on app open", "deduct rest_days_banked on missed day"],
  },
  {
    id: "patterns_cache",
    label: "patterns_cache",
    phase: "MVP",
    color: C.purple,
    bg: C.purpleSoft,
    icon: "💡",
    description: "Pre-computed insight objects. is_stale triggers background recompute.",
    fields: [
      { name: "id", type: "INTEGER", note: "PK · autoincrement" },
      { name: "pattern_type", type: "TEXT", note: "indexed · e.g. day_energy_rhythm" },
      { name: "data", type: "TEXT", note: "JSON blob · insight payload" },
      { name: "computed_at", type: "TIMESTAMP", note: "when last calculated" },
      { name: "is_stale", type: "BOOLEAN", note: "set true on new workout/check-in" },
      { name: "valid_until", type: "TIMESTAMP", note: "nullable · time-sensitive insights" },
    ],
    indices: ["pattern_type", "is_stale"],
    queries: ["SELECT WHERE pattern_type = X AND is_stale = 0", "UPDATE is_stale = 1 on new data"],
  },
  {
    id: "wearable_data",
    label: "wearable_data",
    phase: "Layer 2",
    color: C.teal,
    bg: C.tealSoft,
    icon: "⌚",
    description: "Phase 2. One row per day from HealthKit or Health Connect.",
    fields: [
      { name: "id", type: "INTEGER", note: "PK · autoincrement" },
      { name: "date", type: "DATE", note: "UNIQUE · indexed" },
      { name: "resting_hr", type: "REAL", note: "nullable · bpm" },
      { name: "hrv", type: "REAL", note: "nullable · ms · key burnout signal" },
      { name: "sleep_minutes", type: "INTEGER", note: "nullable" },
      { name: "sleep_score", type: "REAL", note: "nullable · 0–100" },
      { name: "steps", type: "INTEGER", note: "nullable" },
      { name: "active_energy_kcal", type: "REAL", note: "nullable" },
      { name: "source", type: "TEXT", note: "healthkit / health_connect" },
      { name: "created_at", type: "TIMESTAMP", note: "default now()" },
    ],
    indices: ["date"],
    queries: ["HRV trend last 14 days", "sleep_score vs mood_after correlation", "auto-fill energy suggestion"],
  },
  {
    id: "settings",
    label: "settings",
    phase: "MVP",
    color: C.textSub,
    bg: C.surfaceHigh,
    icon: "⚙️",
    description: "Key-value store. Avoids schema migrations for new preferences.",
    fields: [
      { name: "key", type: "TEXT", note: "PK · e.g. notification_time" },
      { name: "value", type: "TEXT", note: "serialised string or JSON" },
      { name: "updated_at", type: "TIMESTAMP", note: "default now()" },
    ],
    indices: [],
    queries: ["SELECT value WHERE key = notification_style", "UPSERT on settings change"],
  },
  {
    id: "sync_log",
    label: "sync_log",
    phase: "Layer 2",
    color: C.amber,
    bg: C.amberSoft,
    icon: "☁️",
    description: "Append-only change log. Powers optional Supabase account sync.",
    fields: [
      { name: "id", type: "INTEGER", note: "PK · autoincrement" },
      { name: "table_name", type: "TEXT", note: "indexed · which table changed" },
      { name: "record_id", type: "TEXT", note: "the changed row's id" },
      { name: "operation", type: "TEXT", note: "insert / update / delete" },
      { name: "payload", type: "TEXT", note: "JSON snapshot of the row" },
      { name: "synced", type: "BOOLEAN", note: "default false · indexed" },
      { name: "created_at", type: "TIMESTAMP", note: "default now()" },
    ],
    indices: ["synced", "table_name", "created_at"],
    queries: ["SELECT WHERE synced = 0 ORDER BY created_at", "UPDATE synced = 1 after push"],
  },
];

const relationships = [
  { from: "workouts", to: "check_ins", label: "date → date", type: "many-to-one" },
  { from: "workout_tags", to: "workouts", label: "workout_id → id", type: "many-to-one" },
  { from: "workout_tags", to: "tags", label: "tag_id → id", type: "many-to-one" },
  { from: "wearable_data", to: "check_ins", label: "date → date", type: "one-to-one" },
  { from: "patterns_cache", to: "workouts", label: "reads aggregated data", type: "computed" },
  { from: "patterns_cache", to: "check_ins", label: "reads aggregated data", type: "computed" },
  { from: "sync_log", to: "workouts", label: "mirrors changes", type: "log" },
];

const sqlStatements = {
  check_ins: `CREATE TABLE check_ins (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  date        DATE    NOT NULL UNIQUE,
  energy_level INTEGER NOT NULL CHECK (energy_level BETWEEN 1 AND 5),
  mood        INTEGER NOT NULL CHECK (mood BETWEEN 1 AND 5),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 3),
  stress_level  INTEGER CHECK (stress_level BETWEEN 1 AND 3),
  medication_taken BOOLEAN,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_check_ins_date ON check_ins(date);`,

  workouts: `CREATE TABLE workouts (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  date           DATE    NOT NULL,
  started_at     TIMESTAMP,
  duration_minutes INTEGER,
  activity_type  TEXT    NOT NULL,
  mood_after     INTEGER CHECK (mood_after BETWEEN 1 AND 5),
  notes          TEXT,
  source         TEXT    NOT NULL DEFAULT 'manual',
  external_id    TEXT    UNIQUE,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (date) REFERENCES check_ins(date)
);
CREATE INDEX idx_workouts_date ON workouts(date);
CREATE INDEX idx_workouts_activity ON workouts(activity_type);`,

  tags: `CREATE TABLE tags (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  label     TEXT    NOT NULL UNIQUE,
  category  TEXT    NOT NULL,
  sentiment TEXT    NOT NULL DEFAULT 'neutral'
            CHECK (sentiment IN ('positive','negative','neutral')),
  is_preset BOOLEAN NOT NULL DEFAULT 0,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_tags_use_count ON tags(use_count DESC);
CREATE INDEX idx_tags_category  ON tags(category);`,

  workout_tags: `CREATE TABLE workout_tags (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_id INTEGER NOT NULL,
  tag_id     INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (workout_id, tag_id),
  FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)     REFERENCES tags(id)
);
CREATE INDEX idx_wt_workout ON workout_tags(workout_id);
CREATE INDEX idx_wt_tag     ON workout_tags(tag_id);`,

  streaks: `CREATE TABLE streaks (
  id              INTEGER PRIMARY KEY DEFAULT 1,
  current_streak  INTEGER NOT NULL DEFAULT 0,
  longest_streak  INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  rest_days_banked INTEGER NOT NULL DEFAULT 0
                   CHECK (rest_days_banked <= 3),
  total_workouts  INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Insert single row on first launch:
INSERT INTO streaks DEFAULT VALUES;`,

  patterns_cache: `CREATE TABLE patterns_cache (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  pattern_type TEXT    NOT NULL,
  data         TEXT    NOT NULL, -- JSON blob
  computed_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_stale     BOOLEAN NOT NULL DEFAULT 0,
  valid_until  TIMESTAMP
);
CREATE INDEX idx_pc_type   ON patterns_cache(pattern_type);
CREATE INDEX idx_pc_stale  ON patterns_cache(is_stale);`,

  wearable_data: `-- Phase 2: add via migration
CREATE TABLE wearable_data (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  date            DATE    NOT NULL UNIQUE,
  resting_hr      REAL,   -- bpm
  hrv             REAL,   -- ms (key burnout signal)
  sleep_minutes   INTEGER,
  sleep_score     REAL,   -- 0–100
  steps           INTEGER,
  active_energy_kcal REAL,
  source          TEXT    NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_wd_date ON wearable_data(date);`,

  settings: `CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Seed defaults on first launch:
INSERT INTO settings VALUES
  ('notification_enabled', 'true', CURRENT_TIMESTAMP),
  ('notification_time', '08:00', CURRENT_TIMESTAMP),
  ('medication_tracking', 'false', CURRENT_TIMESTAMP),
  ('reduce_animations', 'false', CURRENT_TIMESTAMP),
  ('streak_forgiveness', 'true', CURRENT_TIMESTAMP);`,

  sync_log: `-- Phase 2: add via migration
CREATE TABLE sync_log (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT    NOT NULL,
  record_id  TEXT    NOT NULL,
  operation  TEXT    NOT NULL
             CHECK (operation IN ('insert','update','delete')),
  payload    TEXT    NOT NULL, -- JSON snapshot
  synced     BOOLEAN NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_sl_synced  ON sync_log(synced);
CREATE INDEX idx_sl_created ON sync_log(created_at);`,
};

const patternQueries = [
  {
    label: "Day-of-week energy rhythm",
    color: C.teal,
    sql: `SELECT strftime('%w', date) AS dow,
       AVG(energy_level)      AS avg_energy,
       COUNT(*)               AS samples
FROM   check_ins
WHERE  date >= date('now', '-60 days')
GROUP  BY dow
ORDER  BY dow;`,
  },
  {
    label: "Tag → mood_after correlation",
    color: C.amber,
    sql: `SELECT t.label, t.sentiment,
       AVG(w.mood_after) AS avg_mood,
       COUNT(*)          AS sessions
FROM   workout_tags wt
JOIN   workouts w ON wt.workout_id = w.id
JOIN   tags     t ON wt.tag_id     = t.id
WHERE  w.date >= date('now', '-30 days')
  AND  w.mood_after IS NOT NULL
GROUP  BY t.id
ORDER  BY avg_mood DESC;`,
  },
  {
    label: "Burnout precursor: negative tag spike",
    color: C.rose,
    sql: `SELECT COUNT(*) AS neg_tags_this_week
FROM   workout_tags wt
JOIN   workouts w ON wt.workout_id = w.id
JOIN   tags     t ON wt.tag_id     = t.id
WHERE  w.date >= date('now', '-7 days')
  AND  t.sentiment = 'negative';
-- If result > rolling 30-day weekly average * 1.5 → alert`,
  },
  {
    label: "Hydration insight",
    color: C.green,
    sql: `SELECT
  AVG(CASE WHEN t.label = 'Well hydrated'
    THEN w.mood_after END) AS hydrated_mood,
  AVG(CASE WHEN t.label = 'Not enough water'
    THEN w.mood_after END) AS dehydrated_mood
FROM   workout_tags wt
JOIN   workouts w ON wt.workout_id = w.id
JOIN   tags     t ON wt.tag_id     = t.id
WHERE  w.date >= date('now', '-60 days');`,
  },
];

export default function FluxSchema() {
  const [selected, setSelected] = useState("check_ins");
  const [tab, setTab] = useState("fields");

  const table = tables.find(t => t.id === selected);

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", color: C.text,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: "40px 20px 60px",
    }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${C.accent}, ${C.green})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
          }}>⚡</div>
          <span style={{
            fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em",
            background: `linear-gradient(135deg, ${C.accent}, ${C.green})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>flux</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Database Schema</div>
        <div style={{ fontSize: 13, color: C.textSub, marginTop: 6 }}>
          SQLite · Local-first · 9 tables · Click any table to explore
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          {[
            { label: "MVP tables", value: "7", color: C.accent },
            { label: "Layer 2 additions", value: "2", color: C.amber },
            { label: "Core relationships", value: "4", color: C.green },
            { label: "Pattern query types", value: "4+", color: C.purple },
          ].map(p => (
            <div key={p.label} style={{
              background: C.surfaceHigh, border: `1px solid ${C.border}`,
              borderRadius: 20, padding: "5px 14px",
              display: "flex", gap: 8, alignItems: "center"
            }}>
              <span style={{ fontSize: 11, color: C.textSub }}>{p.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 980, margin: "0 auto" }}>

        {/* Table grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 10, marginBottom: 20
        }}>
          {tables.map(t => (
            <button key={t.id} onClick={() => setSelected(t.id)} style={{
              background: selected === t.id ? t.bg : C.surface,
              border: `1.5px solid ${selected === t.id ? t.color + "88" : C.border}`,
              borderRadius: 14, padding: "14px 12px",
              cursor: "pointer", textAlign: "left",
              transition: "all 0.15s",
              boxShadow: selected === t.id ? `0 0 16px ${t.color}22` : "none",
            }}>
              <div style={{ fontSize: 18, marginBottom: 6 }}>{t.icon}</div>
              <div style={{
                fontSize: 12, fontWeight: 700,
                color: selected === t.id ? t.color : C.text,
                marginBottom: 4, fontFamily: "monospace"
              }}>{t.label}</div>
              <div style={{
                display: "inline-block",
                background: t.phase === "MVP" ? C.accentSoft : C.amberSoft,
                border: `1px solid ${t.phase === "MVP" ? C.accent + "44" : C.amber + "44"}`,
                borderRadius: 8, padding: "2px 7px",
                fontSize: 9, color: t.phase === "MVP" ? C.accent : C.amber,
                fontWeight: 600, letterSpacing: "0.06em"
              }}>{t.phase}</div>
              <div style={{ marginTop: 6, fontSize: 10, color: C.textMuted }}>
                {t.fields.length} fields
              </div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div style={{
          background: C.surface,
          border: `1.5px solid ${table.color}55`,
          borderRadius: 20, padding: "22px 24px",
          marginBottom: 20,
          boxShadow: `0 0 24px ${table.color}11`
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: table.bg, border: `1px solid ${table.color}55`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
            }}>{table.icon}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace", color: table.color }}>{table.label}</div>
              <div style={{ fontSize: 12, color: C.textSub, marginTop: 2, maxWidth: 480 }}>{table.description}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              {["fields", "sql", "queries"].map(t2 => (
                <button key={t2} onClick={() => setTab(t2)} style={{
                  background: tab === t2 ? table.bg : C.surfaceHigh,
                  border: `1px solid ${tab === t2 ? table.color + "66" : C.border}`,
                  color: tab === t2 ? table.color : C.textSub,
                  borderRadius: 8, padding: "6px 12px",
                  fontSize: 11, fontWeight: 600, cursor: "pointer",
                  textTransform: "uppercase", letterSpacing: "0.06em"
                }}>{t2}</button>
              ))}
            </div>
          </div>

          {tab === "fields" && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Field", "Type", "Notes"].map(h => (
                      <th key={h} style={{
                        textAlign: "left", padding: "8px 12px",
                        fontSize: 10, color: C.textMuted, letterSpacing: "0.1em",
                        textTransform: "uppercase", borderBottom: `1px solid ${C.border}`
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.fields.map((f, i) => (
                    <tr key={f.name} style={{ background: i % 2 === 0 ? "transparent" : C.surfaceHigh + "44" }}>
                      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 13, color: table.color }}>{f.name}</td>
                      <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12, color: C.teal }}>{f.type}</td>
                      <td style={{ padding: "10px 12px", fontSize: 12, color: C.textSub }}>{f.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {table.indices.length > 0 && (
                <div style={{ marginTop: 14, padding: "10px 12px", background: C.surfaceHigh, borderRadius: 10 }}>
                  <span style={{ fontSize: 10, color: C.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Indices: </span>
                  {table.indices.map(idx => (
                    <span key={idx} style={{
                      display: "inline-block", marginLeft: 8,
                      fontFamily: "monospace", fontSize: 11, color: C.amber,
                      background: C.amberSoft, borderRadius: 6, padding: "2px 8px"
                    }}>{idx}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "sql" && (
            <pre style={{
              background: C.surfaceHigh, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: "16px", margin: 0,
              fontSize: 11.5, lineHeight: 1.7, color: C.textSub,
              overflowX: "auto", fontFamily: "monospace",
              whiteSpace: "pre-wrap"
            }}>
              <span style={{ color: C.accent }}>{sqlStatements[table.id]?.replace(/CREATE TABLE|CREATE INDEX|INSERT INTO|PRIMARY KEY|NOT NULL|DEFAULT|UNIQUE|CHECK|FOREIGN KEY|REFERENCES|ON DELETE CASCADE|AUTOINCREMENT|CURRENT_TIMESTAMP/g,
                match => `\u001b[${match}]`)}</span>
              {sqlStatements[table.id]}
            </pre>
          )}

          {tab === "queries" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {table.queries.map((q, i) => (
                <div key={i} style={{
                  background: C.surfaceHigh, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: "10px 14px",
                  display: "flex", alignItems: "center", gap: 10
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: table.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: C.textSub }}>{q}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Relationships */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 20, padding: "20px 24px", marginBottom: 20
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>Relationships</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {relationships.map((r, i) => {
              const fromTable = tables.find(t => t.id === r.from);
              const toTable = tables.find(t => t.id === r.to);
              const typeColor = r.type === "many-to-one" ? C.accent : r.type === "one-to-one" ? C.green : r.type === "computed" ? C.purple : C.amber;
              return (
                <div key={i} style={{
                  background: C.surfaceHigh, border: `1px solid ${C.border}`,
                  borderRadius: 12, padding: "12px 14px",
                  display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap"
                }}>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: fromTable?.color || C.textSub }}>{r.from}</span>
                  <span style={{ fontSize: 14, color: typeColor }}>→</span>
                  <span style={{ fontFamily: "monospace", fontSize: 12, color: toTable?.color || C.textSub }}>{r.to}</span>
                  <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <span style={{
                      background: typeColor + "22", border: `1px solid ${typeColor}44`,
                      borderRadius: 6, padding: "2px 7px", fontSize: 9,
                      color: typeColor, fontWeight: 600, letterSpacing: "0.06em"
                    }}>{r.type}</span>
                    <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>{r.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pattern queries */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 20, padding: "20px 24px"
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>Pattern Engine Queries</div>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 16 }}>
            The SQL that powers Flux's insight cards — all local, no AI
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {patternQueries.map((q, i) => (
              <div key={i} style={{
                background: C.surfaceHigh, border: `1px solid ${q.color}33`,
                borderRadius: 14, overflow: "hidden"
              }}>
                <div style={{
                  padding: "10px 16px", borderBottom: `1px solid ${q.color}22`,
                  background: q.color + "11",
                  display: "flex", alignItems: "center", gap: 8
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: q.color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: q.color }}>{q.label}</span>
                </div>
                <pre style={{
                  margin: 0, padding: "14px 16px",
                  fontSize: 11, lineHeight: 1.7,
                  color: C.textSub, fontFamily: "monospace",
                  overflowX: "auto", whiteSpace: "pre-wrap"
                }}>{q.sql}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
