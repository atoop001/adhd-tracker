export default function FluxInfoGraphic() {
  const palette = {
    bg: "#0C0C12",
    surface: "#14141C",
    surfaceHigh: "#1C1C27",
    border: "#26263A",
    accent: "#7B6EF6",
    accentSoft: "#221E42",
    green: "#4ECFA0",
    greenSoft: "#162B22",
    amber: "#F5A623",
    amberSoft: "#2A1E08",
    teal: "#38BDF8",
    tealSoft: "#0C2233",
    rose: "#F87171",
    roseSoft: "#2A1010",
    text: "#EEEDF8",
    textSub: "#8888A8",
    textMuted: "#4A4A6A",
  };

  const sections = [
    {
      id: "onboarding",
      icon: "🚀",
      label: "Onboarding",
      color: palette.teal,
      bg: palette.tealSoft,
      border: palette.teal,
      features: [
        "Under 2 minutes, 4 screens max",
        "First win before any account setup",
        "Pre-built defaults — no blank slates",
        "Zero guilt, validation-first language",
        "No credit card required for trial",
        "Contextual help introduced in-app, not upfront",
      ],
    },
    {
      id: "checkin",
      icon: "🧠",
      label: "Daily Check-In",
      color: palette.accent,
      bg: palette.accentSoft,
      border: palette.accent,
      features: [
        "5-tap energy level (1–5 scale)",
        "Mood check via emoji spectrum",
        "Optional: sleep quality & stress level",
        "Optional: medication taken toggle",
        "Adaptive suggestion based on today's input",
        "\"Start — 5 min min\" low-friction CTA",
      ],
    },
    {
      id: "logging",
      icon: "➕",
      label: "Workout Logging",
      color: palette.green,
      bg: palette.greenSoft,
      border: palette.green,
      features: [
        "One-tap activity type selection",
        "Post-workout mood (emoji scale)",
        "Preset tag chips — no typing required",
        "Custom tag input with reuse memory",
        "Tags auto-promoted after 3+ uses",
        "Focus window nudge after every session",
      ],
    },
    {
      id: "tags",
      icon: "🏷️",
      label: "Tag System",
      color: palette.amber,
      bg: palette.amberSoft,
      border: palette.amber,
      features: [
        "Nutrition: hydration, food timing, caffeine",
        "Effort: pacing, burnout, strong finish",
        "Mental: focus, anxiety, distraction",
        "Pre-workout: sleep, stress, rushed start",
        "Environment: noise, temp, crowd, solo",
        "User-defined: free text, saved for reuse",
      ],
    },
    {
      id: "streaks",
      icon: "🔥",
      label: "Streaks & Habits",
      color: palette.rose,
      bg: palette.roseSoft,
      border: palette.rose,
      features: [
        "Soft streak forgiveness — pauses, never breaks",
        "Rest day banking system",
        "Weekly visual day tracker",
        "No punishment messaging for missed days",
        "Variable reward surprises (not predictable badges)",
        "\"If-then\" external cue builder",
      ],
    },
    {
      id: "patterns",
      icon: "📊",
      label: "Local Pattern Engine",
      color: palette.teal,
      bg: palette.tealSoft,
      border: palette.teal,
      features: [
        "All processing on-device — no AI, no cloud",
        "Personal rolling averages vs. your own baseline",
        "Day-of-week energy rhythm detection",
        "Tag accumulation & burnout precursor signals",
        "Workout-to-mood correlation over time",
        "Negative tag spike alerts before crashes occur",
      ],
    },
    {
      id: "insights",
      icon: "💡",
      label: "Insights",
      color: palette.accent,
      bg: palette.accentSoft,
      border: palette.accent,
      features: [
        "Energy rhythm bar chart (weekly view)",
        "Tag frequency tracker with sentiment bars",
        "Plain-language insight cards",
        "Mood-after correlation by workout type",
        "Hydration, pacing & pattern spotting",
        "No weight, calories, or body metrics",
      ],
    },
    {
      id: "wearables",
      icon: "⌚",
      label: "Wearable Integration",
      color: palette.green,
      bg: palette.greenSoft,
      border: palette.green,
      features: [
        "Phase 2: Apple HealthKit (iOS)",
        "Phase 2: Android Health Connect",
        "Covers Apple Watch, Garmin, Fitbit, Oura & more",
        "Auto-fills energy from HRV & sleep data",
        "Reduces manual check-in friction",
        "Phase 3: Garmin direct API (Body Battery)",
      ],
    },
    {
      id: "privacy",
      icon: "🔒",
      label: "Privacy & Design",
      color: palette.amber,
      bg: palette.amberSoft,
      border: palette.amber,
      features: [
        "All data stored locally on device",
        "No servers, no AI APIs, no cloud sync",
        "Reduce animations toggle (ADHD-friendly)",
        "High contrast & calm UI modes",
        "Minimal UI by default, detail on request",
        "Full data export anytime",
      ],
    },
    {
      id: "monetization",
      icon: "💜",
      label: "Monetization",
      color: palette.rose,
      bg: palette.roseSoft,
      border: palette.rose,
      features: [
        "Free: check-ins, logging, tags, 7-day history",
        "Flux Full: $7.99/mo or $54.99/yr",
        "30-day free trial — no credit card",
        "Premium: pattern insights & full history",
        "Premium: wearable integration",
        "Future: one-time Insights Export ($4.99)",
      ],
    },
  ];

  return (
    <div style={{
      background: palette.bg,
      minHeight: "100vh",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: "48px 24px 64px",
      color: palette.text,
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: `linear-gradient(135deg, ${palette.accent}, ${palette.green})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, boxShadow: `0 0 24px ${palette.accent}55`
          }}>⚡</div>
          <span style={{
            fontSize: 36, fontWeight: 800, letterSpacing: "-0.04em",
            background: `linear-gradient(135deg, ${palette.accent}, ${palette.green})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>flux</span>
        </div>
        <div style={{ fontSize: 15, color: palette.textSub, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
          Feature Overview
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: palette.text, lineHeight: 1.3 }}>
          A fitness tracker built for the ADHD brain
        </div>
        <div style={{ fontSize: 14, color: palette.textSub, marginTop: 8, maxWidth: 440, margin: "8px auto 0" }}>
          Routine-building + energy management + burnout prevention — all local, private, and designed around how ADHD actually works
        </div>

        {/* Pill stats */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
          {[
            { label: "No AI required", icon: "🧩" },
            { label: "100% on-device", icon: "🔒" },
            { label: "30-day free trial", icon: "🎁" },
            { label: "ADHD-first design", icon: "🧠" },
          ].map(p => (
            <div key={p.label} style={{
              display: "flex", alignItems: "center", gap: 6,
              background: palette.surfaceHigh, border: `1px solid ${palette.border}`,
              borderRadius: 20, padding: "6px 14px", fontSize: 12, color: palette.textSub
            }}>
              <span>{p.icon}</span><span>{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 16,
        maxWidth: 980,
        margin: "0 auto",
      }}>
        {sections.map(s => (
          <div key={s.id} style={{
            background: palette.surface,
            border: `1px solid ${palette.border}`,
            borderRadius: 20,
            overflow: "hidden",
          }}>
            {/* Card header */}
            <div style={{
              background: s.bg,
              borderBottom: `1px solid ${s.border}22`,
              padding: "16px 18px",
              display: "flex", alignItems: "center", gap: 10
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${s.color}22`,
                border: `1px solid ${s.color}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, flexShrink: 0
              }}>{s.icon}</div>
              <span style={{
                fontSize: 14, fontWeight: 700, color: s.color,
                letterSpacing: "0.01em"
              }}>{s.label}</span>
            </div>

            {/* Features list */}
            <div style={{ padding: "14px 18px 18px" }}>
              {s.features.map((f, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 9,
                  marginBottom: i < s.features.length - 1 ? 10 : 0
                }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: s.color, opacity: 0.7,
                    marginTop: 7, flexShrink: 0
                  }} />
                  <span style={{ fontSize: 13, color: palette.textSub, lineHeight: 1.5 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Phase timeline */}
      <div style={{ maxWidth: 980, margin: "40px auto 0" }}>
        <div style={{
          background: palette.surface, border: `1px solid ${palette.border}`,
          borderRadius: 20, padding: "24px 28px"
        }}>
          <div style={{ fontSize: 13, color: palette.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
            Build Roadmap
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {[
              {
                phase: "MVP",
                color: palette.green,
                label: "Ship First",
                items: ["Energy check-in", "Workout logging", "Tag system", "Streak forgiveness", "Local pattern engine", "Focus window nudge"]
              },
              {
                phase: "Layer 2",
                color: palette.accent,
                label: "Post-Launch",
                items: ["Full insights screen", "Wearable integration", "Energy rhythm tracking", "Burnout precursor alerts", "Medication timing toggle", "Cue builder"]
              },
              {
                phase: "Layer 3",
                color: palette.amber,
                label: "Growth / Funding",
                items: ["Garmin direct API", "Body doubling feature", "Weekly digest screen", "Insights PDF export", "Localized pricing", "Corporate wellness path"]
              },
            ].map(p => (
              <div key={p.phase}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{
                    background: `${p.color}22`, border: `1px solid ${p.color}55`,
                    borderRadius: 8, padding: "3px 10px",
                    fontSize: 11, fontWeight: 700, color: p.color, letterSpacing: "0.06em"
                  }}>{p.phase}</div>
                  <span style={{ fontSize: 12, color: palette.textMuted }}>{p.label}</span>
                </div>
                {p.items.map((item, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 8, marginBottom: 7
                  }}>
                    <div style={{
                      width: 4, height: 4, borderRadius: "50%",
                      background: p.color, opacity: 0.6, flexShrink: 0
                    }} />
                    <span style={{ fontSize: 12, color: palette.textSub }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer tagline */}
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <div style={{ fontSize: 13, color: palette.textMuted }}>
          No cloud · No AI · No guilt · Built for your brain
        </div>
      </div>
    </div>
  );
}
