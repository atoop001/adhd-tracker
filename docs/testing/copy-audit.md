# Flux Copy Audit

**Date:** 2026-07-18 · **Scope:** all 142 user-facing strings (raw list in
`copy-inventory.md`) checked against: the banned-word rule (fail/missed/broke/
skipped), the no-shame/no-guilt tone constraints, the no-targets rules for
calories and body data, and the evidence review's "keep claims modest" findings
(`docs/research/evidence-review.md`).

## Verdict: compliant, with 2 flags needing your decision and 3 minor notes

Automated banned-word scan: **zero user-facing hits** (all "fail" matches are
internal `console.warn` strings). Destructive flows are two-step. Empty states
are friendly everywhere ("Patterns are still forming", "No entries yet").
Calorie and body copy is neutral ("Body data is just data. No goals, no
judgement.") — no targets, no evaluation anywhere.

---

## 🚩 Flags for your decision

### 1. "You've got 1-2 hrs of enhanced focus." (PostWorkoutNudge)
States a specific focus window as established fact. The evidence review found
acute exercise reliably improves inhibitory control and inattention, but a
precise "1-2 hrs of enhanced focus" is stronger than the literature supports —
this is exactly the kind of claim the review said to keep modest.
**Suggested rewrite:** "Post-workout is prime focus time for a lot of ADHD
brains. Want to point it at something?" (keeps the actionable nudge, drops the
clinical-sounding precision). Needs your call — it's on the happy path users
see after every workout.

### 2. PaywallSheet pricing + feature copy
"$7.99/month or $54.99/year · 30-day free trial" and "…complete insights, body
metrics tracking, and 12 months of history."
- The prices were review-flagged as original (not from the brief). They must
  match the real store products when RevenueCat lands — until then this is a
  placeholder shown whenever entitlement is 'free'. Sign off or change now.
- "12 months of history" describes a history limit that Layer 1 does not
  enforce anywhere — free tier currently keeps full history. Either the copy
  overpromises the paid tier or a free-tier limit is planned for later; verify
  against the brief's monetization section before launch.

## 🟡 Minor notes (no action required unless you care)

3. **"No streaks to break."** (onboarding) — contains "break", adjacent to the
   banned "broke". It's self-referential brand copy (there are no streaks), not
   user-blaming, so it honors the rule's intent. Recommend keeping.
4. **"judgement"** (BodyMetricsBanner) — British spelling; US convention is
   "judgment". Pick one for consistency with the rest of the copy (which is US).
5. **"Mood runs {difference}pts higher when well hydrated."** (Home insight) —
   "pts" reads cramped; "points" (or a space before "pts") is friendlier. Also
   mildly causal phrasing for what is correlation, but it's the user's own
   data and the hydration framing is the app's core insight — acceptable.

## ✅ Everything else

All remaining strings pass: onboarding (invitational, zero pressure), Home
("Rest is training too"), Log (neutral labels), Insights (no fake data, honest
empty/fallback states), Body (neutral, optional-everything), Settings (clear,
two-step destructive confirms, honest privacy copy), notifications (light,
never guilt-based), SuggestionCard (effort-matched, "Not today" as a
first-class choice), BucketWidget ("No ceiling. Keep pouring.").
