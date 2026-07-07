import { useState } from "react";

const C = {
  bg: "#0C0C12",
  surface: "#13131B",
  surfaceHigh: "#1A1A25",
  border: "#22223A",
  accent: "#7B6EF6",
  accentSoft: "#1E1A40",
  green: "#4ECFA0",
  greenSoft: "#122A20",
  amber: "#F5A623",
  amberSoft: "#281A06",
  teal: "#38BDF8",
  tealSoft: "#0A1E2E",
  rose: "#F87171",
  roseSoft: "#280E0E",
  purple: "#C084FC",
  purpleSoft: "#1E1030",
  text: "#EEEDF8",
  textSub: "#8080A0",
  textMuted: "#44445A",
};

const phases = [
  {
    id: "pre",
    label: "Pre-Dev",
    weeks: "Weeks 1–3",
    span: [0, 3],
    color: C.teal,
    bg: C.tealSoft,
    icon: "🗂️",
    track: "build",
    tasks: [
      "Finalise database schema",
      "Set up Expo + React Native project",
      "Apple & Google developer accounts",
      "Lock design tokens & component system",
      "Wireframe sign-off",
    ],
    gate: null,
  },
  {
    id: "mvp",
    label: "MVP Build",
    weeks: "Weeks 4–18",
    span: [3, 18],
    color: C.accent,
    bg: C.accentSoft,
    icon: "⚡",
    track: "build",
    tasks: [
      "Onboarding flow (4 screens)",
      "Daily energy check-in",
      "Workout logging + tag system",
      "Streak tracker with forgiveness",
      "Local SQLite pattern engine",
      "Basic insights screen",
      "Settings + privacy controls",
    ],
    gate: "MVP feature complete",
  },
  {
    id: "beta",
    label: "Beta Testing",
    weeks: "Weeks 16–22",
    span: [15, 22],
    color: C.purple,
    bg: C.purpleSoft,
    icon: "🧪",
    track: "build",
    tasks: [
      "TestFlight + Google Play Beta",
      "Recruit ADHD testers from waitlist",
      "Bug fixes & UX refinements",
      "App Store assets (screenshots, preview)",
      "ASO keyword finalisation",
      "App Store submission",
    ],
    gate: "App Store approved",
  },
  {
    id: "launch",
    label: "Launch",
    weeks: "Week 23",
    span: [22, 24],
    color: C.green,
    bg: C.greenSoft,
    icon: "🚀",
    track: "build",
    tasks: [
      "Public App Store release",
      "Product Hunt launch post",
      "Reddit AMA on r/ADHD",
      "Waitlist email goes live",
      "Creator content drops",
      "Press & directory submissions",
    ],
    gate: "Public launch",
  },
  {
    id: "layer2",
    label: "Layer 2",
    weeks: "Months 6–9",
    span: [24, 40],
    color: C.amber,
    bg: C.amberSoft,
    icon: "⌚",
    track: "build",
    tasks: [
      "Apple HealthKit integration",
      "Android Health Connect",
      "Enhanced pattern engine",
      "Deeper insight types",
      "Optional account + Supabase sync",
      "January ASO seasonal push",
    ],
    gate: "Wearables live",
  },
  {
    id: "layer3",
    label: "Layer 3",
    weeks: "Months 10–14",
    span: [40, 60],
    color: C.rose,
    bg: C.roseSoft,
    icon: "🌐",
    track: "build",
    tasks: [
      "Web dashboard (Next.js)",
      "Garmin direct API",
      "Body doubling feature",
      "Insights PDF export",
      "Funding deck preparation",
      "Evaluate Series A readiness",
    ],
    gate: "Funding-ready",
  },
];

const marketingPhases = [
  {
    label: "Build in Public",
    weeks: "Weeks 1–22",
    span: [0, 22],
    color: C.teal,
    items: ["Daily/weekly progress posts", "Share design decisions publicly", "Instagram / Threads account live"],
  },
  {
    label: "Waitlist & Community",
    weeks: "Weeks 3–22",
    span: [3, 22],
    color: C.accent,
    items: ["Landing page + email capture", "Reddit community participation", "r/ADHD, r/ADHDers, r/xxADHD"],
  },
  {
    label: "Creator Outreach",
    weeks: "Weeks 14–23",
    span: [14, 24],
    color: C.purple,
    items: ["Identify 15–20 ADHD micro-creators", "Early access to beta", "Authentic content (not paid posts)"],
  },
  {
    label: "ASO & Press",
    weeks: "Weeks 18–26",
    span: [18, 26],
    color: C.green,
    items: ["Keyword research finalised", "Screenshots & preview video", "ADDitude Magazine outreach"],
  },
  {
    label: "Growth & Retention",
    weeks: "Month 6 onwards",
    span: [24, 60],
    color: C.amber,
    items: ["Apple Search Ads (data-informed)", "Referral system launch", "Monthly shareable insight cards"],
  },
];

const milestones = [
  { week: 3, label: "Schema locked", color: C.teal },
  { week: 18, label: "MVP complete", color: C.accent },
  { week: 22, label: "App Store approved", color: C.purple },
  { week: 23, label: "🚀 Public launch", color: C.green },
  { week: 32, label: "Jan fitness spike", color: C.amber },
  { week: 40, label: "Wearables live", color: C.amber },
  { week: 52, label: "Funding metrics", color: C.rose },
];

const TOTAL_WEEKS = 60;

function Bar({ span, color, bg, label, sublabel, onClick, active }) {
  const left = `${(span[0] / TOTAL_WEEKS) * 100}%`;
  const width = `${((span[1] - span[0]) / TOTAL_WEEKS) * 100}%`;
  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute", left, width,
        height: 36, borderRadius: 8,
        background: active ? color + "33" : bg,
        border: `1.5px solid ${active ? color : color + "55"}`,
        cursor: "pointer",
        display: "flex", alignItems: "center",
        padding: "0 10px", gap: 6,
        transition: "all 0.15s",
        boxShadow: active ? `0 0 12px ${color}33` : "none",
        overflow: "hidden",
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, color: active ? color : color + "CC", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {label}
      </span>
    </div>
  );
}

function MilestoneMarker({ week, label, color }) {
  const left = `${(week / TOTAL_WEEKS) * 100}%`;
  return (
    <div style={{ position: "absolute", left, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}88` }} />
      <div style={{ fontSize: 9, color, whiteSpace: "nowrap", textAlign: "center", maxWidth: 72, lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

function WeekLabel({ week }) {
  const left = `${(week / TOTAL_WEEKS) * 100}%`;
  const display = week < 24 ? `W${week}` : `M${Math.round(week / 4.3)}`;
  return (
    <div style={{ position: "absolute", left, transform: "translateX(-50%)", fontSize: 9, color: C.textMuted }}>{display}</div>
  );
}

export default function FluxTimeline() {
  const [activePhase, setActivePhase] = useState("mvp");

  const selected = phases.find(p => p.id === activePhase) || phases[1];

  const weekLabels = [0, 4, 8, 12, 16, 20, 24, 32, 40, 52, 60];

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", color: C.text,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: "40px 24px 60px",
    }}>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            background: `linear-gradient(135deg, ${C.accent}, ${C.green})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
          }}>⚡</div>
          <span style={{
            fontSize: 30, fontWeight: 800, letterSpacing: "-0.04em",
            background: `linear-gradient(135deg, ${C.accent}, ${C.green})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>flux</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Development Roadmap</div>
        <div style={{ fontSize: 13, color: C.textSub, marginTop: 6 }}>
          Solo / small team · ~14 months to Layer 3 · Two parallel tracks
        </div>
      </div>

      {/* Summary pills */}
      <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap", marginBottom: 36 }}>
        {[
          { label: "MVP ships", value: "Week 23", color: C.green },
          { label: "Wearables", value: "Month 9", color: C.amber },
          { label: "Web dashboard", value: "Month 12", color: C.rose },
          { label: "Funding-ready", value: "Month 14", color: C.purple },
        ].map(p => (
          <div key={p.label} style={{
            background: C.surfaceHigh, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: "6px 16px",
            display: "flex", gap: 8, alignItems: "center"
          }}>
            <span style={{ fontSize: 12, color: C.textSub }}>{p.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.value}</span>
          </div>
        ))}
      </div>

      {/* Main timeline */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 20, padding: "24px 20px 28px", marginBottom: 16,
        maxWidth: 960, margin: "0 auto 16px"
      }}>

        {/* Timeline axis labels */}
        <div style={{ position: "relative", height: 18, marginBottom: 16, marginLeft: 96 }}>
          {weekLabels.map(w => <WeekLabel key={w} week={w} />)}
        </div>

        {/* BUILD TRACK */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            Build Track
          </div>
          <div style={{ position: "relative", height: 44 }}>
            <div style={{ marginLeft: 96, position: "relative", height: "100%" }}>
              {phases.map(p => (
                <Bar
                  key={p.id}
                  span={p.span}
                  color={p.color}
                  bg={p.bg}
                  label={`${p.icon} ${p.label}`}
                  active={activePhase === p.id}
                  onClick={() => setActivePhase(p.id)}
                />
              ))}
            </div>
            <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: C.textSub, width: 88 }}>
              Development
            </div>
          </div>
        </div>

        {/* MARKETING TRACK */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
            Marketing Track
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {marketingPhases.map((mp, i) => (
              <div key={i} style={{ position: "relative", height: 32 }}>
                <div style={{ marginLeft: 96, position: "relative", height: "100%" }}>
                  <div style={{
                    position: "absolute",
                    left: `${(mp.span[0] / TOTAL_WEEKS) * 100}%`,
                    width: `${((mp.span[1] - mp.span[0]) / TOTAL_WEEKS) * 100}%`,
                    height: "100%", borderRadius: 6,
                    background: mp.color + "18",
                    border: `1px solid ${mp.color}44`,
                    display: "flex", alignItems: "center", padding: "0 10px",
                    overflow: "hidden",
                  }}>
                    <span style={{ fontSize: 10, color: mp.color + "CC", whiteSpace: "nowrap", fontWeight: 500 }}>
                      {mp.label}
                    </span>
                  </div>
                </div>
                <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: C.textMuted, width: 88, lineHeight: 1.2 }}>
                  {mp.label.split(" ").slice(0, 2).join(" ")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestone markers */}
        <div>
          <div style={{ fontSize: 10, color: C.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
            Key Milestones
          </div>
          <div style={{ marginLeft: 96, position: "relative", height: 44 }}>
            <div style={{ position: "absolute", left: 0, right: 0, top: 10, height: 1, background: C.border }} />
            {milestones.map(m => (
              <MilestoneMarker key={m.label} week={m.week} label={m.label} color={m.color} />
            ))}
          </div>
        </div>
      </div>

      {/* Phase detail panel */}
      <div style={{
        maxWidth: 960, margin: "0 auto 24px",
        background: C.surface, border: `1.5px solid ${selected.color}44`,
        borderRadius: 20, padding: "22px 24px",
        boxShadow: `0 0 24px ${selected.color}11`
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11,
            background: selected.bg, border: `1px solid ${selected.color}55`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
          }}>{selected.icon}</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: selected.color }}>{selected.label}</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>{selected.weeks}</div>
          </div>
          {selected.gate && (
            <div style={{
              marginLeft: "auto",
              background: selected.bg, border: `1px solid ${selected.color}55`,
              borderRadius: 20, padding: "5px 14px",
              fontSize: 11, color: selected.color, fontWeight: 600
            }}>
              ✓ Gate: {selected.gate}
            </div>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
          {selected.tasks.map((t, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              background: C.surfaceHigh, borderRadius: 10, padding: "10px 12px"
            }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: selected.color, opacity: 0.7, marginTop: 5, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: C.textSub, lineHeight: 1.4 }}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: C.textMuted }}>
          Click any phase bar above to explore its tasks ↑
        </div>
      </div>

      {/* Phase cards row */}
      <div style={{
        maxWidth: 960, margin: "0 auto 24px",
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10
      }}>
        {phases.map(p => (
          <button key={p.id} onClick={() => setActivePhase(p.id)} style={{
            background: activePhase === p.id ? p.bg : C.surface,
            border: `1px solid ${activePhase === p.id ? p.color + "88" : C.border}`,
            borderRadius: 14, padding: "14px 12px", cursor: "pointer", textAlign: "left",
            transition: "all 0.15s",
          }}>
            <div style={{ fontSize: 18, marginBottom: 6 }}>{p.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: activePhase === p.id ? p.color : C.text, marginBottom: 2 }}>{p.label}</div>
            <div style={{ fontSize: 10, color: C.textMuted }}>{p.weeks}</div>
            <div style={{ marginTop: 8, fontSize: 10, color: p.color + "99" }}>
              {p.tasks.length} tasks
            </div>
          </button>
        ))}
      </div>

      {/* Risk callouts */}
      <div style={{ maxWidth: 960, margin: "0 auto 24px" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.textSub, marginBottom: 12 }}>⚠️ Timeline risks to plan for</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
          {[
            { icon: "🍎", title: "App Store review", risk: "Apple's first submission can take 1–3 weeks. Build this buffer into Week 19–22. Submit early.", color: C.rose },
            { icon: "📐", title: "Schema changes", risk: "Changing the local SQLite schema after beta testers have data is painful. Lock it in Week 3.", color: C.amber },
            { icon: "⌚", title: "Wearable APIs", risk: "HealthKit requires an Apple entitlement review. Apply during beta — don't wait until Layer 2 starts.", color: C.teal },
            { icon: "📅", title: "January window", risk: "Fitness apps spike in January. A late October launch gives you time for reviews before the wave hits.", color: C.green },
          ].map(r => (
            <div key={r.title} style={{
              background: C.surface, border: `1px solid ${r.color}33`,
              borderRadius: 14, padding: "14px 16px",
              display: "flex", gap: 12, alignItems: "flex-start"
            }}>
              <span style={{ fontSize: 20 }}>{r.icon}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: r.color, marginBottom: 4 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: C.textSub, lineHeight: 1.5 }}>{r.risk}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", color: C.textMuted, fontSize: 12, marginTop: 12 }}>
        Solo / 2-person team · Full-time development · Calendar time assumes no major pivots
      </div>
    </div>
  );
}
