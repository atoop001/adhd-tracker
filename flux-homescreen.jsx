import { useState } from "react";

const colors = {
  bg: "#0F0F14",
  surface: "#17171F",
  surfaceHigh: "#1E1E2A",
  border: "#2A2A38",
  accent: "#7B6EF6",
  accentSoft: "#2D2847",
  accentGlow: "rgba(123,110,246,0.15)",
  green: "#4ECFA0",
  greenSoft: "#1A3329",
  amber: "#F5A623",
  amberSoft: "#2E2310",
  red: "#F26B6B",
  textPrimary: "#F0EFF8",
  textSecondary: "#8B8AA0",
  textMuted: "#52516A",
};

const EnergyOrb = ({ level }) => {
  const colors_map = {
    1: ["#3B3B5C", "#52517A"],
    2: ["#3D3060", "#6B5ED4"],
    3: ["#2D3F6B", "#5B82D4"],
    4: ["#1A3F35", "#4ECFA0"],
    5: ["#2D3820", "#8DD44F"],
  };
  const [c1, c2] = colors_map[level] || colors_map[3];
  const labels = ["", "Drained", "Low", "Okay", "Good", "Charged"];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: `radial-gradient(circle at 35% 35%, ${c2}, ${c1})`,
        boxShadow: `0 0 20px ${c2}55`,
        border: `2px solid ${c2}66`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 22
      }}>
        {["", "😴", "😑", "🙂", "😊", "⚡"][level]}
      </div>
      <span style={{ fontSize: 11, color: colors.textSecondary, letterSpacing: "0.05em" }}>
        {labels[level]}
      </span>
    </div>
  );
};

const Tag = ({ label, sentiment, small }) => {
  const bg = sentiment === "positive" ? colors.greenSoft
    : sentiment === "negative" ? colors.amberSoft
    : colors.surfaceHigh;
  const border = sentiment === "positive" ? "#4ECFA033"
    : sentiment === "negative" ? "#F5A62333"
    : colors.border;
  const text = sentiment === "positive" ? colors.green
    : sentiment === "negative" ? colors.amber
    : colors.textSecondary;
  return (
    <span style={{
      background: bg, border: `1px solid ${border}`,
      color: text, borderRadius: 20,
      padding: small ? "3px 10px" : "5px 13px",
      fontSize: small ? 11 : 12,
      fontFamily: "inherit", whiteSpace: "nowrap"
    }}>
      {label}
    </span>
  );
};

const WorkoutCard = ({ type, duration, tags, moodAfter }) => (
  <div style={{
    background: colors.surfaceHigh, border: `1px solid ${colors.border}`,
    borderRadius: 14, padding: "14px 16px", display: "flex",
    flexDirection: "column", gap: 10
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ color: colors.textPrimary, fontSize: 14, fontWeight: 600 }}>{type}</div>
        <div style={{ color: colors.textMuted, fontSize: 12, marginTop: 2 }}>{duration} · 2 days ago</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 11, color: colors.textMuted }}>after</span>
        <span style={{ fontSize: 18 }}>{"😊"}</span>
      </div>
    </div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {tags.map(t => <Tag key={t.label} label={t.label} sentiment={t.sentiment} small />)}
    </div>
  </div>
);

const NavIcon = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} style={{
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    background: "none", border: "none", cursor: "pointer",
    color: active ? colors.accent : colors.textMuted,
    padding: "8px 16px", borderRadius: 12, transition: "color 0.2s",
    minWidth: 60
  }}>
    <span style={{ fontSize: 22 }}>{icon}</span>
    <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, letterSpacing: "0.04em" }}>{label}</span>
  </button>
);

const HomeScreen = ({ energy, setEnergy, setTab }) => {
  const suggestions = {
    1: { label: "2-min breathing stretch", icon: "🌊", desc: "Gentle. No pressure. Just move a little.", color: colors.accent },
    2: { label: "10-min walk", icon: "🚶", desc: "Low effort, big mood shift. Outside if you can.", color: "#5B82D4" },
    3: { label: "20-min bodyweight flow", icon: "💪", desc: "A solid middle-ground session.", color: colors.green },
    4: { label: "30-min strength circuit", icon: "🔥", desc: "You've got fuel — use it.", color: colors.amber },
    5: { label: "45-min high-intensity", icon: "⚡", desc: "Full charge. Let's go hard today.", color: "#F26B6B" },
  };
  const s = suggestions[energy];
  const streakDays = [true, true, false, true, true, true, false];
  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "0 0 20px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 13, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
            Monday · 8:41 AM
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary, lineHeight: 1.2 }}>
            How's your<br />brain today?
          </div>
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: "50%",
          background: colors.accentSoft, border: `1px solid ${colors.accent}44`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16
        }}>🧠</div>
      </div>

      {/* Energy Check-in */}
      <div style={{
        background: colors.surface, border: `1px solid ${colors.border}`,
        borderRadius: 18, padding: "18px 16px"
      }}>
        <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 14, letterSpacing: "0.04em" }}>
          TAP YOUR ENERGY LEVEL
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setEnergy(n)} style={{
              background: "none", border: "none", cursor: "pointer", padding: 4,
              transform: energy === n ? "scale(1.15)" : "scale(1)",
              transition: "transform 0.2s",
              opacity: energy === n ? 1 : energy ? 0.45 : 1,
            }}>
              <EnergyOrb level={n} />
            </button>
          ))}
        </div>
      </div>

      {/* Suggestion Card */}
      {energy && (
        <div style={{
          background: `linear-gradient(135deg, ${colors.accentSoft}, ${colors.surface})`,
          border: `1px solid ${colors.accent}44`,
          borderRadius: 18, padding: "18px 16px",
          display: "flex", flexDirection: "column", gap: 14
        }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{
              fontSize: 32, width: 52, height: 52, borderRadius: 14,
              background: colors.accentGlow, display: "flex",
              alignItems: "center", justifyContent: "center",
              border: `1px solid ${colors.accent}33`
            }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 11, color: colors.accent, letterSpacing: "0.08em", marginBottom: 4 }}>
                TODAY'S SUGGESTION
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: colors.textPrimary }}>{s.label}</div>
              <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 3 }}>{s.desc}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{
              flex: 1, background: colors.accent, color: "#fff",
              border: "none", borderRadius: 12, padding: "12px 0",
              fontSize: 14, fontWeight: 600, cursor: "pointer", letterSpacing: "0.02em"
            }}>
              Start — 5 min min
            </button>
            <button style={{
              background: colors.surfaceHigh, color: colors.textSecondary,
              border: `1px solid ${colors.border}`, borderRadius: 12,
              padding: "12px 14px", fontSize: 13, cursor: "pointer"
            }}>
              Not today
            </button>
          </div>
        </div>
      )}

      {/* Streak */}
      <div style={{
        background: colors.surface, border: `1px solid ${colors.border}`,
        borderRadius: 18, padding: "16px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>This week</div>
          <div style={{ fontSize: 12, color: colors.accent }}>5 day streak 🔥</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {streakDays.map((active, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: active ? colors.accentSoft : colors.surfaceHigh,
                border: `1px solid ${active ? colors.accent + "66" : colors.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14
              }}>
                {active ? "✓" : i === 2 ? "·" : "·"}
              </div>
              <span style={{ fontSize: 10, color: i === 0 ? colors.textSecondary : colors.textMuted }}>
                {dayLabels[i]}
              </span>
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 12, padding: "8px 12px",
          background: colors.surfaceHigh, borderRadius: 10,
          fontSize: 12, color: colors.textMuted
        }}>
          💜 Wednesday was a rest day — streak preserved
        </div>
      </div>

      {/* Recent Tags Insight */}
      <div style={{
        background: colors.surface, border: `1px solid ${colors.border}`,
        borderRadius: 18, padding: "16px"
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 4 }}>
          What your tags are showing
        </div>
        <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 14 }}>
          Based on your last 7 sessions
        </div>
        <div style={{
          background: colors.greenSoft, border: `1px solid ${colors.green}33`,
          borderRadius: 12, padding: "12px 14px", marginBottom: 10
        }}>
          <div style={{ fontSize: 13, color: colors.green, fontWeight: 600, marginBottom: 3 }}>
            💧 Hydration makes a difference for you
          </div>
          <div style={{ fontSize: 12, color: colors.textSecondary }}>
            Your mood after "well hydrated" sessions averages 1.4 points higher
          </div>
        </div>
        <div style={{
          background: colors.amberSoft, border: `1px solid ${colors.amber}33`,
          borderRadius: 12, padding: "12px 14px"
        }}>
          <div style={{ fontSize: 13, color: colors.amber, fontWeight: 600, marginBottom: 3 }}>
            🏃 Pacing pattern spotted
          </div>
          <div style={{ fontSize: 12, color: colors.textSecondary }}>
            "Went out too hard" appeared 3 times this week — try a slower start today
          </div>
        </div>
      </div>
    </div>
  );
};

const LogScreen = () => {
  const [selected, setSelected] = useState([]);
  const [customTag, setCustomTag] = useState("");
  const [logged, setLogged] = useState(false);
  const [moodAfter, setMoodAfter] = useState(null);

  const presets = [
    { label: "Ate too soon", sentiment: "negative" },
    { label: "Not enough water", sentiment: "negative" },
    { label: "Went out too hard", sentiment: "negative" },
    { label: "Well hydrated", sentiment: "positive" },
    { label: "Locked in", sentiment: "positive" },
    { label: "Good pace", sentiment: "positive" },
    { label: "Distracted", sentiment: "negative" },
    { label: "Had more left", sentiment: "positive" },
    { label: "Stressed beforehand", sentiment: "negative" },
    { label: "Strong finish", sentiment: "positive" },
    { label: "Too noisy", sentiment: "negative" },
    { label: "Good sleep", sentiment: "positive" },
  ];

  const toggle = (label) => setSelected(s =>
    s.includes(label) ? s.filter(x => x !== label) : [...s, label]
  );

  if (logged) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 16, padding: "40px 0" }}>
      <div style={{ fontSize: 52 }}>✅</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: colors.textPrimary }}>Session logged</div>
      <div style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", maxWidth: 240 }}>
        Your tags are added to your pattern tracker
      </div>
      <div style={{
        background: colors.accentSoft, border: `1px solid ${colors.accent}44`,
        borderRadius: 14, padding: "14px 18px", maxWidth: 280, textAlign: "center"
      }}>
        <div style={{ fontSize: 12, color: colors.accent, marginBottom: 6, letterSpacing: "0.06em" }}>FOCUS WINDOW OPEN</div>
        <div style={{ fontSize: 13, color: colors.textSecondary }}>You've got 1–2 hrs of enhanced focus coming. What do you want to use it for?</div>
      </div>
      <button onClick={() => { setLogged(false); setSelected([]); setMoodAfter(null); }}
        style={{
          marginTop: 8, background: colors.surfaceHigh,
          border: `1px solid ${colors.border}`, color: colors.textSecondary,
          borderRadius: 12, padding: "10px 24px", fontSize: 13, cursor: "pointer"
        }}>
        Log another
      </button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "0 0 20px" }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary }}>Log a session</div>
        <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>Quick or detailed — your call</div>
      </div>

      {/* Quick log */}
      <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 18, padding: 16 }}>
        <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12, letterSpacing: "0.06em" }}>ACTIVITY</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Walk", "Run", "Lift", "Bike", "Swim", "Yoga", "Dance", "Other"].map(t => (
            <button key={t} style={{
              background: colors.surfaceHigh, border: `1px solid ${colors.border}`,
              color: colors.textSecondary, borderRadius: 20, padding: "7px 14px",
              fontSize: 13, cursor: "pointer"
            }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Mood after */}
      <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 18, padding: 16 }}>
        <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 12, letterSpacing: "0.06em" }}>HOW DO YOU FEEL NOW?</div>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          {["😩", "😐", "🙂", "😊", "🤩"].map((e, i) => (
            <button key={i} onClick={() => setMoodAfter(i)} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 28, opacity: moodAfter === i ? 1 : moodAfter !== null ? 0.3 : 0.7,
              transform: moodAfter === i ? "scale(1.25)" : "scale(1)",
              transition: "all 0.15s"
            }}>{e}</button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 18, padding: 16 }}>
        <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 4, letterSpacing: "0.06em" }}>TAG THIS SESSION</div>
        <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 14 }}>Pick any that fit — or none</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {presets.map(t => (
            <button key={t.label} onClick={() => toggle(t.label)} style={{
              background: selected.includes(t.label)
                ? (t.sentiment === "positive" ? colors.greenSoft : colors.amberSoft)
                : colors.surfaceHigh,
              border: `1px solid ${selected.includes(t.label)
                ? (t.sentiment === "positive" ? colors.green + "55" : colors.amber + "55")
                : colors.border}`,
              color: selected.includes(t.label)
                ? (t.sentiment === "positive" ? colors.green : colors.amber)
                : colors.textSecondary,
              borderRadius: 20, padding: "7px 13px",
              fontSize: 12, cursor: "pointer", transition: "all 0.15s"
            }}>
              {selected.includes(t.label) ? "✓ " : ""}{t.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input value={customTag} onChange={e => setCustomTag(e.target.value)}
            placeholder="+ Add your own tag"
            style={{
              flex: 1, background: colors.surfaceHigh,
              border: `1px solid ${colors.border}`, color: colors.textPrimary,
              borderRadius: 10, padding: "8px 12px", fontSize: 13,
              outline: "none", fontFamily: "inherit"
            }} />
          <button onClick={() => { if (customTag.trim()) { toggle(customTag.trim()); setCustomTag(""); } }}
            style={{
              background: colors.accentSoft, border: `1px solid ${colors.accent}44`,
              color: colors.accent, borderRadius: 10, padding: "8px 14px",
              fontSize: 13, cursor: "pointer"
            }}>Add</button>
        </div>
      </div>

      <button onClick={() => setLogged(true)} style={{
        background: colors.accent, color: "#fff", border: "none",
        borderRadius: 14, padding: "15px", fontSize: 15,
        fontWeight: 600, cursor: "pointer", letterSpacing: "0.02em"
      }}>
        Done
      </button>
    </div>
  );
};

const InsightsScreen = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 20, padding: "0 0 20px" }}>
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary }}>Your patterns</div>
      <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>Last 30 days · 14 sessions logged</div>
    </div>

    {/* Energy rhythm */}
    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 18, padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 4 }}>Energy rhythm</div>
      <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 16 }}>When you tend to feel most ready</div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 64 }}>
        {[
          { day: "M", h: 75 }, { day: "T", h: 55 }, { day: "W", h: 35 },
          { day: "T", h: 60 }, { day: "F", h: 80 }, { day: "S", h: 85 }, { day: "S", h: 45 }
        ].map(({ day, h }) => (
          <div key={day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{
              width: "100%", height: `${h}%`, borderRadius: 6,
              background: h > 70 ? `linear-gradient(180deg, ${colors.accent}, ${colors.accentSoft})`
                : h > 50 ? colors.surfaceHigh : colors.surface,
              border: `1px solid ${h > 70 ? colors.accent + "44" : colors.border}`,
              minHeight: 8
            }} />
            <span style={{ fontSize: 10, color: colors.textMuted }}>{day}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: colors.textSecondary }}>
        📊 Fridays and Saturdays are your strongest days
      </div>
    </div>

    {/* Tag frequency */}
    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 18, padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 14 }}>Top tags this month</div>
      {[
        { label: "Well hydrated", count: 8, sentiment: "positive", pct: 90 },
        { label: "Good pace", count: 6, sentiment: "positive", pct: 67 },
        { label: "Went out too hard", count: 5, sentiment: "negative", pct: 56 },
        { label: "Distracted", count: 4, sentiment: "negative", pct: 45 },
        { label: "Locked in", count: 3, sentiment: "positive", pct: 33 },
      ].map(({ label, count, sentiment, pct }) => (
        <div key={label} style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <Tag label={label} sentiment={sentiment} small />
            <span style={{ fontSize: 12, color: colors.textMuted }}>{count}x</span>
          </div>
          <div style={{ height: 4, background: colors.surfaceHigh, borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${pct}%`, borderRadius: 4,
              background: sentiment === "positive" ? colors.green : colors.amber,
              opacity: 0.7
            }} />
          </div>
        </div>
      ))}
    </div>

    {/* Insight cards */}
    <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 18, padding: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary, marginBottom: 14 }}>Insights</div>
      {[
        { icon: "💧", color: colors.green, bg: colors.greenSoft, border: colors.green, title: "Hydration is your #1 mood booster", body: "Mood after well-hydrated sessions is 1.4pts higher on average" },
        { icon: "⚡", color: colors.accent, bg: colors.accentSoft, border: colors.accent, title: "Wednesday dip is real", body: "Energy checks on Wednesdays average 1.8 — consider a lighter session or rest" },
        { icon: "🏃", color: colors.amber, bg: colors.amberSoft, border: colors.amber, title: "Pacing needs attention", body: '"Went out too hard" appears in 5 of 9 sessions over 20 mins' },
      ].map(({ icon, color, bg, border, title, body }) => (
        <div key={title} style={{
          background: bg, border: `1px solid ${border}33`,
          borderRadius: 12, padding: "12px 14px", marginBottom: 10,
          display: "flex", gap: 12, alignItems: "flex-start"
        }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color, marginBottom: 3 }}>{title}</div>
            <div style={{ fontSize: 12, color: colors.textSecondary }}>{body}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SettingsScreen = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "0 0 20px" }}>
    <div>
      <div style={{ fontSize: 22, fontWeight: 700, color: colors.textPrimary }}>Settings</div>
      <div style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4 }}>Your app, your rules</div>
    </div>
    {[
      { section: "Check-ins", items: ["Check-in reminder time", "Reminder style", "Medication tracking"] },
      { section: "Streaks", items: ["Streak forgiveness", "Rest day banking", "Weekly goal (days)"] },
      { section: "Display", items: ["Reduce animations", "High contrast mode", "Font size"] },
      { section: "Privacy", items: ["All data stored locally", "Export my data", "Clear all data"] },
    ].map(({ section, items }) => (
      <div key={section} style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 18, overflow: "hidden" }}>
        <div style={{ padding: "12px 16px 8px", fontSize: 11, color: colors.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {section}
        </div>
        {items.map((item, i) => (
          <div key={item} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "13px 16px",
            borderTop: i > 0 ? `1px solid ${colors.border}` : "none"
          }}>
            <span style={{ fontSize: 14, color: colors.textPrimary }}>{item}</span>
            <span style={{ fontSize: 18, color: colors.textMuted }}>›</span>
          </div>
        ))}
      </div>
    ))}

    <div style={{
      background: colors.accentSoft, border: `1px solid ${colors.accent}33`,
      borderRadius: 18, padding: "14px 16px",
      display: "flex", alignItems: "center", gap: 12
    }}>
      <span style={{ fontSize: 22 }}>🔒</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.accent }}>Your data stays on your device</div>
        <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>No cloud, no AI, no servers. Just you.</div>
      </div>
    </div>
  </div>
);

export default function App() {
  const [tab, setTab] = useState("home");
  const [energy, setEnergy] = useState(null);

  const screens = {
    home: <HomeScreen energy={energy} setEnergy={setEnergy} setTab={setTab} />,
    log: <LogScreen />,
    insights: <InsightsScreen />,
    settings: <SettingsScreen />,
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#080810",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: "20px 16px"
    }}>
      <div style={{
        width: "100%", maxWidth: 390,
        background: colors.bg, borderRadius: 44,
        overflow: "hidden", position: "relative",
        boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
        minHeight: 780, display: "flex", flexDirection: "column"
      }}>
        {/* Status bar */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 24px 4px", fontSize: 12, color: colors.textMuted
        }}>
          <span>9:41</span>
          <div style={{
            width: 100, height: 28, background: "#000",
            borderRadius: 20, position: "absolute", left: "50%", transform: "translateX(-50%)", top: 0
          }} />
          <span>●●●</span>
        </div>

        {/* Wordmark */}
        <div style={{ padding: "8px 24px 0", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: `linear-gradient(135deg, ${colors.accent}, #4ECFA0)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14
          }}>⚡</div>
          <span style={{ fontSize: 18, fontWeight: 800, color: colors.textPrimary, letterSpacing: "-0.03em" }}>
            flux
          </span>
        </div>

        {/* Screen content */}
        <div style={{ flex: 1, padding: "16px 20px 0", overflowY: "auto" }}>
          {screens[tab]}
        </div>

        {/* Bottom nav */}
        <div style={{
          background: colors.surface,
          borderTop: `1px solid ${colors.border}`,
          display: "flex", justifyContent: "space-around",
          padding: "8px 0 20px"
        }}>
          <NavIcon icon="🏠" label="Home" active={tab === "home"} onClick={() => setTab("home")} />
          <NavIcon icon="➕" label="Log" active={tab === "log"} onClick={() => setTab("log")} />
          <NavIcon icon="📊" label="Insights" active={tab === "insights"} onClick={() => setTab("insights")} />
          <NavIcon icon="⚙️" label="Settings" active={tab === "settings"} onClick={() => setTab("settings")} />
        </div>
      </div>
    </div>
  );
}
