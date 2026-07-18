# Flux Design Decisions — Evidence Review

**Date:** 2026-07-17 · **Purpose:** map each core Flux design decision to academic
literature; flag where evidence is strong, mixed, or where we should soften claims.
Verdicts: ✅ well supported · 🟡 supported with caveats · ⚠️ mixed / be careful.

---

## 1. ✅ No streaks, no loss-aversion mechanics (the core bet)

**Flux decision:** the bucket only fills; nothing is ever lost; no "broken chain."

**Evidence:**
- Streaks work *because of* loss aversion (Kahneman & Tversky's prospect theory —
  losses feel roughly twice as painful as equivalent gains). That is exactly the
  mechanism that backfires on a miss: after a streak breaks, users report
  disproportionate feelings of failure and frequently abandon both the app and the
  habit ([Cohorty overview](https://blog.cohorty.app/the-psychology-of-streaks-why-they-work-and-when-they-backfire/),
  [Klarity: streaks & ADHD](https://www.helloklarity.com/post/breaking-the-chain-why-streak-features-fail-adhd-users-and-how-to-design-better-alternatives/)).
- The clinical analogue is the **abstinence violation effect** (Marlatt): people prone
  to all-or-nothing thinking interpret one lapse as total failure, converting a lapse
  into full relapse. It is documented for exercise routines specifically, not just
  substance use ([Psychology Today](https://www.psychologytoday.com/us/blog/stigma-addiction-and-mental-health/202309/the-abstinence-violation-effect-and-overcoming-it),
  [NCBI](https://www.ncbi.nlm.nih.gov/sites/books/NBK601489/box/ch2.b9/?report=objectonly)).
  Guilt and shame are the engine of AVE; self-compassion dismantles it.
- For ADHD users the streak problem compounds: rejection sensitivity and
  all-or-nothing cognition make streak-break abandonment more likely, and industry
  reporting on neurodivergent users describes anxiety → avoidance → abandonment as
  the typical streak arc.

**Caveat to keep us honest:** most direct "streaks harm ADHD users" writing is
industry/UX literature, not peer-reviewed RCTs. The peer-reviewed backing comes via
the AVE and loss-aversion mechanisms. That is still a solid chain of evidence, but we
should not claim "studies show streaks harm ADHD users" verbatim in marketing copy.

## 2. 🟡 Accumulation-only bucket with tiers

**Flux decision:** permanent lifetime_drops; tier progression (Pail → Reservoir);
per-workout drops with visible fill percentage.

**Evidence:**
- **Goal-gradient hypothesis** (Hull 1932; Kivetz, Urminsky & Zheng 2006): effort
  increases as visible progress approaches a goal — supports showing fill % toward
  the next tier ([Columbia Business School](https://business.columbia.edu/insights/chazen-global-insights/goal-gradient-hypothesis-resurrected-purchase-acceleration)).
- **Endowed progress effect** (Nunes & Drèze 2006): pre-existing progress increases
  completion (34% vs 19% redemption in the car-wash field experiment). Flux's
  permanent bucket means users *always* re-open the app with endowed progress —
  the design generalizes this effect to every session ([ResearchGate](https://www.researchgate.net/publication/23547282_The_Endowed_Progress_Effect_How_Artificial_Advancement_Increases_Effort)).
- **Gamification RCTs:** meta-analysis of RCTs finds gamified interventions
  significantly increase physical activity (~697 steps/day vs control), with
  **feedback** the single most impactful game element — the bucket is precisely a
  feedback element ([JMIR meta-analysis](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8767479/),
  [BE ACTIVE RCT, Circulation 2024](https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.124.069531)).

**Caveats:** long-term effects of gamification fade after interventions end (very
small to small effect at ~14-week follow-up). The bucket's *permanence* is our
hypothesis for countering that fade — plausible and mechanism-aligned, but not
itself tested in the literature. Tier 5 (Reservoir, ∞) removes the goal gradient at
the top end; worth watching whether late-stage motivation sags (a Layer 2+ question,
not a Layer 1 change).

## 3. 🟡 Exercise as an ADHD intervention (the app's premise)

**Evidence:** meta-analyses find acute exercise produces moderate improvement in
inhibitory control and small but significant improvement in inattention in adults
with ADHD; 12-week aerobic programs show mood and inattention gains
([2026 meta-analysis](https://www.sciencedirect.com/science/article/abs/pii/S1469029226000282),
[JOGH 2025](https://jogh.org/2025/jogh-15-04025),
[adhdevidence.org summary of seven meta-analyses](https://www.adhdevidence.org/blog/seven-new-meta-analyses-suggest-wide-range-of-benefits-from-exercise-for-persons-with-ADHD)).

**Caveat:** chronic (long-term) exercise evidence in adults is mixed and thinner
than the acute evidence. Frame in-app copy as "movement helps you feel better and
focus today," not "exercise treats ADHD."

## 4. ✅ "Start — just 5 min" (low activation threshold)

**Flux decision:** SuggestionCard CTA framed as a tiny first step.

**Evidence:** behavioral activation — acting before motivation, via the smallest
possible step — is an evidence-based approach, and ADHD-specific writing grounds it
in dopaminergic hyposensitivity: task importance alone doesn't trigger initiation,
so the fix is shrinking the required activation energy. Once started, continuation
is neurologically easier than initiation
([Envision ADHD: task-initiation science](https://www.envisionadhd.com/single-post/why-starting-is-hard-the-science-of-task-initiation-in-adult-adhd-and-what-actually-helps),
[Klarity: micro-steps](https://www.helloklarity.com/post/breaking-the-first-step-barrier-how-micro-steps-can-help-adhd-brains-overcome-task-initiation-problems/)).
Also aligns with the "permission to stop without guilt" principle — matches Flux's
no-guilt constraint.

## 5. 🟡 Check-ins + pattern insights (self-monitoring)

**Flux decision:** daily energy/mood check-ins; tag correlations; insight cards.

**Evidence:** self-monitoring alone is a weak-to-mixed behavior change technique,
**but** interventions combining self-monitoring with feedback and goal-related
techniques from control theory are reliably more effective than those without
([meta-regression, Michie et al. tradition](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5370453/),
[meta-review](https://pmc.ncbi.nlm.nih.gov/articles/PMC7429262/)).
Flux's combination — log (self-monitoring) + bucket (feedback) + insights (feedback
on patterns) — is exactly the effective combo. The insights screen's 7-workout
minimum before showing patterns also avoids feedback based on noise.

## 6. ✅ Body metrics off by default; no goals; no direction colour-coding

**Evidence:**
- Prospective cohort data in young adults: more frequent self-weighing predicted
  *greater* weight gain and higher onset of compensatory behaviors, especially with
  binge-eating history ([Pacanowski et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC6061963/)).
- Population-based study: self-weighing affects mood most in exactly the vulnerable
  groups — frequent weighers, higher BMI, those with disordered-eating cognitions;
  53% of young women report mood impact ([J Eat Disord 2021](https://jeatdisord.biomedcentral.com/articles/10.1186/s40337-021-00391-y)).
- Counterpoint for balance: structured self-regulation interventions using daily
  weighing showed no adverse effects in normal-weight/overweight young adults
  ([Eating pathology RCT analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC6447368/)) —
  i.e., weighing is not universally harmful; harm concentrates in vulnerable users.

**Design implication:** off-by-default + opt-in + neutral display (no green/red for
direction) is precisely the right response to a heterogeneous-risk feature. Keep it.

## 7. ✅ Calorie display: daily total only, no targets, no red numbers

**Evidence:** among eating-disorder patients, ~75% used MyFitnessPal and **73% of
those perceived it as contributing to their disorder**; qualitative work singles out
target/deficit framing and red-number feedback as the harmful design elements
([Levinson et al. 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5700836/),
[BJPsych Open qualitative study](https://pmc.ncbi.nlm.nih.gov/articles/PMC8485346/)).
Flux's constraints (no target, no progress bar, no colour coding) remove exactly the
features implicated. This is one of the best-evidenced decisions in the app.

## 8. ✅ No-shame language (banned words: "fail/missed/broke/skipped")

**Evidence:** meta-analysis (N≈29,588, 94 studies): self-compassion positively
associated with health behavior (r = .26), and multi-session self-compassion
interventions *causally* improve health behavior
([Health Psychology Review 2021](https://pubmed.ncbi.nlm.nih.gov/31842689/)).
Physical-activity shame is negatively linked to activity and drives maladaptive
coping ([Applied Psychology Research](https://ojs.acad-pub.com/index.php/APR/article/view/4122)).
The copy constraints are an implementation of the self-compassion literature.

## 9. ⚠️ Local notification nudges

**Evidence:** push reminders increase short-term compliance (steps, medication,
water) but carry annoyance risk and may *hinder* autonomous habit formation if the
behavior becomes notification-dependent ([HabitWalk micro-randomized trial](https://pmc.ncbi.nlm.nih.gov/articles/PMC11635918/),
[npj Science of Learning: reminders as double-edged sword](https://www.nature.com/articles/s41539-024-00253-7)).

**Design implication:** Flux already does the right mitigations — opt-in, user-set
time, low frequency. Recommendation for later: never escalate notification volume,
and consider (Layer 2+) anchoring reminders to user-chosen cues ("after coffee")
rather than clock times, which the habit literature favors.

---

## Summary

| Decision | Verdict |
|---|---|
| No streaks / no loss aversion | ✅ strong mechanistic support (prospect theory + AVE) |
| Accumulation-only bucket + tiers | 🟡 supported (goal gradient, endowed progress, gamification RCTs); permanence untested |
| Exercise for ADHD premise | 🟡 acute effects solid; chronic evidence mixed — keep copy modest |
| "Start — just 5 min" | ✅ behavioral activation, ADHD task-initiation literature |
| Check-ins + insights | 🟡 self-monitoring weak alone, strong combined with feedback — Flux has the combo |
| Body metrics off by default, neutral display | ✅ risk concentrates in vulnerable users; opt-in is correct |
| Calories: total only, no targets | ✅ directly addresses the features implicated in harm |
| No-shame copy | ✅ self-compassion meta-analysis |
| Notification nudges | ⚠️ short-term effective; keep minimal, consider cue-anchoring later |

**Net assessment:** no design decision in Layer 1 contradicts the evidence; two
places to stay modest in claims (chronic ADHD benefits, long-term gamification
effects); one future refinement idea (cue-anchored reminders).
