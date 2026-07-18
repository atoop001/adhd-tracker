# Flux Copy Inventory (raw extraction)
Generated 2026-07-18. One section per source file, one bullet per string, in source order.

## app/(onboarding)/index.tsx
- "Fitness apps weren't built for your brain.{'\n'}This one is." — heading
- "No streaks to break. No guilt for resting. Just a bucket that fills up, one honest session at a time." — body text
- "Some days you'll show up big. Some days barely at all. Both count here." — body text
- "Let's go" — button label

## app/(onboarding)/energy.tsx
- "How's your energy right now?" — heading
- "There's no right answer. This just helps us meet you where you are today." — body text
- "Continue" — button label

## app/(onboarding)/notifications.tsx
- "Morning 08:00" — time preset label
- "Midday 12:00" — time preset label
- "Evening 18:00" — time preset label
- "Want a daily nudge?" — heading
- "A single reminder to check in with yourself — nothing more. Change or turn it off anytime in Settings." — body text
- "Remind me" — button label
- "No thanks" — button label

## app/(onboarding)/suggestion.tsx
- "Here's a suggestion" — heading
- "Based on where your energy's at — no pressure to match it exactly." — body text
- "Rest is training too." — message text

## app/(tabs)/_layout.tsx
- "Settings" — accessibilityLabel
- "Home" — tab title and label
- "Log" — tab title and label
- "Insights" — tab title and label
- "Body" — tab title and label
- "Settings" — tab title and label

## app/(tabs)/index.tsx
- "How are you today?" — greeting heading
- "Rest is training too. Your bucket is waiting." — skip message text
- "No entries yet." — empty state text
- "Your energy tends to peak on {day}s." — insight card body template
- "Mood runs {difference}pts higher when well hydrated." — insight card body template
- "Mood runs higher when well hydrated." — insight card body template

## app/(tabs)/log.tsx
- "Walk" — activity chip label
- "Run" — activity chip label
- "Strength" — activity chip label
- "Bodyweight" — activity chip label
- "Yoga" — activity chip label
- "Stretch" — activity chip label
- "Cycle" — activity chip label
- "Swim" — activity chip label
- "Sport" — activity chip label
- "HIIT" — activity chip label
- "Other" — activity chip label
- "Activity" — section label
- "Mood after" — section label
- "Duration (minutes)" — section label
- "Optional" — duration input placeholder
- "~+{dropPreview} drops" — drop preview text
- "Tags" — section label
- "Add a custom tag" — custom tag input placeholder
- "Add" — button label
- "Calories today (optional)" — section label
- "Optional" — calorie input placeholder
- "Done" — button label

## app/(tabs)/insights.tsx
- "Insights" — heading
- "Patterns are still forming" — empty state title
- "Log a few more sessions and your patterns will start to appear. 7 sessions in 30 days unlocks insights." — empty state body
- "More patterns are waiting" — teaser title
- "Unlock your full insights to see everything Flux has found." — teaser body
- "Energy rhythm" — chart title
- "No standout patterns yet beyond your energy rhythm — check back as you log more." — fallback text

## app/(tabs)/body.tsx
- "Body tracking is off. Turn it on in Settings to use this tab." — disabled message
- "Log a couple of entries to see a trend." — empty chart text
- "Log entry" — button label
- "Cancel" — button label
- "Date" — field label
- "YYYY-MM-DD" — date input placeholder
- "Weight ({weightUnit})" — field label
- "Weight in {weightUnit}" — weight input placeholder template
- "Waist (cm)" — field label
- "Optional" — waist input placeholder
- "Chest (cm)" — field label
- "Optional" — chest input placeholder
- "Hips (cm)" — field label
- "Optional" — hips input placeholder
- "Arms (cm)" — field label
- "Optional" — arms input placeholder
- "Notes" — field label
- "Optional" — notes input placeholder
- "Save" — button label
- "No entries yet." — empty history text
- "Calories" — collapsible card title
- "Log entry" — button label
- "Cancel" — button label
- "Date" — field label
- "YYYY-MM-DD" — date input placeholder
- "Total calories" — field label
- "Total for the day" — calorie input placeholder
- "Save" — button label
- "No entries yet." — empty history text

## app/(tabs)/settings.tsx
- "Settings" — screen title
- "Check-ins" — settings section title
- "Daily reminder" — toggle label
- "Reminder time" — preset row label
- "Medication tracking" — toggle label
- "Body & Nutrition" — settings section title
- "Body metrics" — toggle label
- "Calorie tracking" — toggle label
- "Friends & Challenges" — settings section title
- "Friends & challenges — coming soon" — static text
- "Progress" — settings section title
- "Weekly goal" — preset row label
- "Reset bucket" — action row label
- "Display" — settings section title
- "Reduce animations" — toggle label
- "Privacy" — settings section title
- "All data stays on this device. No account, no tracking." — static text
- "Clear all data" — action row label
- "Account" — settings section title
- "Flux is local-first. Accounts arrive with sync + social." — static text
- "DEV" — settings section title
- "Current entitlement: {entitlement}" — static text template
- "Full entitlement (dev)" — toggle label
- "Reset bucket" — Alert.alert title
- "This sets your bucket back to zero. Your workout history stays." — Alert.alert message
- "Cancel" — Alert button label
- "Continue" — Alert button label
- "Really reset?" — Alert.alert title
- "This can't be undone." — Alert.alert message
- "Cancel" — Alert button label
- "Reset" — Alert button label (destructive)
- "Calorie tracking" — Alert.alert title
- "Calorie tracking is a neutral log. Flux doesn't set targets or evaluate your intake." — Alert.alert message
- "Cancel" — Alert button label
- "Continue" — Alert button label
- "Clear all data" — Alert.alert title
- "This permanently erases all logged data on this device. Your settings and preset tags stay." — Alert.alert message
- "Cancel" — Alert button label
- "Continue" — Alert button label
- "Really clear all data?" — Alert.alert title
- "This can't be undone." — Alert.alert message
- "Cancel" — Alert button label
- "Clear" — Alert button label (destructive)

## components/EnergyOrb.tsx
- "Drained" — energy level 1 label
- "Low" — energy level 2 label
- "Steady" — energy level 3 label
- "Good" — energy level 4 label
- "Charged" — energy level 5 label

## components/BucketWidget.tsx
- "{formatDrops(lifetimeDrops)} total drops" — drops display template
- "{formatDrops(tierInfo.dropsToNext)} drops to {nextTierName}" — progress text template
- "No ceiling. Keep pouring." — final tier subtext

## components/SuggestionCard.tsx
- "2-min breathing stretch" — suggestion title for energy level 1
- "Gentle. No pressure. Just move a little." — suggestion body for energy level 1
- "10-min walk" — suggestion title for energy level 2
- "Low effort, big mood shift. Outside if you can." — suggestion body for energy level 2
- "20-min bodyweight flow" — suggestion title for energy level 3
- "A solid middle-ground session." — suggestion body for energy level 3
- "30-min strength circuit" — suggestion title for energy level 4
- "You've got fuel — use it." — suggestion body for energy level 4
- "45-min high-intensity" — suggestion title for energy level 5
- "Full charge. Let's go hard today." — suggestion body for energy level 5
- "Start — just 5 min" — button label
- "Not today" — button label

## components/PostWorkoutNudge.tsx
- "⚡ +{formatDrops(dropsEarned)} drops · {formatDrops(newTotal)} total" — headline template
- "Your bucket grew: {newTier.name}" — celebration message template
- "FOCUS WINDOW OPEN" — focus card label
- "You've got 1-2 hrs of enhanced focus. What do you want to use it for?" — focus card body
- "Done" — button label

## components/BodyMetricsBanner.tsx
- "Body data is just data. No goals, no judgement." — banner text

## components/PaywallSheet.tsx
- "Your patterns are ready. Unlock them." — headline
- "Flux Full includes complete insights, body metrics tracking, and 12 months of history." — body text
- "$7.99/month or $54.99/year · 30-day free trial" — price text
- "Start free trial" — button label
- "Not now" — button label

## lib/flux-notifications.ts
- "Flux" — notification title
- "Time to check in with Flux ⚡" — reminder message
- "How's your energy today?" — reminder message
- "Quick check-in — 5 seconds" — reminder message
- "Your bucket is waiting 💧" — reminder message
