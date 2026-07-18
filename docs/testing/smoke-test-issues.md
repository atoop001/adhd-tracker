# Smoke Test Issues — Flux Layer 1

Issues found during device testing (Expo Go). Logged as they are found, fixed in
batch after the testing pass is complete. **Do not fix issues at logging time.**

Entries are appended by the `issue-scribe` agent via the `logging-test-issues`
skill. IDs are sequential: ISSUE-001, ISSUE-002, ...

Status values: `open` | `in-progress` | `fixed` | `wont-fix` | `cannot-reproduce`

---

## ISSUE-001: App backgrounds to home screen when setting nudge reminder
- **Status:** open
- **Logged:** 2026-07-17
- **Screen/Area:** Post-workout nudge (after logging a workout)
- **Frequency:** happened once
- **Steps to reproduce:**
  1. Log a workout
  2. On the post-workout nudge prompt, set the nudge reminder
- **Expected:** reminder is set and the app stays in the foreground
- **Actual:** the app went to the phone home screen; Expo Go kept running in the background (visible in recent apps) and the reminder setting was saved correctly
- **Error text / logs:** none captured
- **Verbatim report:** "when setting the nudge reminder the app closed to my phone home screen. the app continued running as normal and the setting was set correctly"
- **Notes / hypothesis:** user observed that no system notification-permission dialog appeared at any point
- **Investigation (2026-07-18, code-side only — fix deferred to batch phase):**
  - Reported location can't be right: `PostWorkoutNudge` renders drops + a Done
    button only; it has no reminder UI. The reminder is set in exactly two
    places: the onboarding "Want a daily nudge?" screen
    (`app/(onboarding)/notifications.tsx`) and the Settings "Daily reminder"
    toggle. The onboarding screen's heading literally says "nudge" — most
    likely the actual location. **Retest must confirm which screen.**
  - Code path is pure JS + `scheduleNotificationAsync` (daily trigger): no
    Linking, no intents, nothing that can background the app. Settings writes
    happen before scheduling, which matches "setting was saved correctly."
  - No permission dialog is consistent with Expo Go already holding
    notification permission (permission belongs to the Expo Go app, not Flux).
  - Local notifications ARE supported in Expo Go on Android (only remote push
    was removed in SDK 53) — not a known-unsupported API.
  - If it happened on the onboarding screen: `handleRemindMe` ends with
    `router.replace('/(tabs)')`; a first-schedule notification-channel
    creation racing that navigation is the only in-app suspect, and it should
    not background the app. No code defect identified yet.
  - Retest plan: reproduce with Metro terminal visible; note exact screen and
    whether it also happens from the Settings "Daily reminder" toggle.
