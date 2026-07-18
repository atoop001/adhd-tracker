# RevenueCat Integration Runbook (M4)

**Status:** not started — blocked only on account creation. Everything below is
sequenced so M4 becomes a follow-the-list job. The code seam is
`lib/flux-purchases.ts`; its three function signatures stay identical, only the
bodies change.

**Hard prerequisite to know up front:** react-native-purchases is a native
module that does NOT run in Expo Go. Testing the real integration requires a
development build (`npx expo run:android` locally with Android Studio, or an
EAS build in the cloud). The stub keeps working in Expo Go until then — do not
wire the SDK in until a dev-build workflow exists.

## Phase 0 — Accounts (user, ~1-2 hrs + store review wait times)

1. **Google Play Console** — one-time $25 fee. Create the app entry
   (`com.fluxapp.flux`). Needed before Play billing products can exist.
2. **App Store Connect** (if shipping iOS) — Apple Developer Program $99/yr.
   Create the app with bundle id `com.fluxapp.flux`.
3. **RevenueCat account** — free tier is fine (no fee until $2.5k MTR).
   Create one Project ("Flux") with an Android app and (optionally) iOS app.

## Phase 1 — Store products

Product ids (keep these exact ids so dashboards and code agree):
- `flux_full_monthly` — auto-renewing subscription, $7.99/month, 30-day free trial
- `flux_full_annual` — auto-renewing subscription, $54.99/year, 30-day free trial

⚠️ Prices/trial pending sign-off — see flag 2 in `docs/testing/copy-audit.md`,
including whether "12 months of history" stays in the paywall copy.

Create these in Play Console (Monetize → Subscriptions; trial = "free offer"
phase) and App Store Connect (Subscriptions, one subscription group,
introductory offer = 30-day free trial).

## Phase 2 — RevenueCat dashboard

1. Connect store credentials (Play service account JSON / App Store Connect
   API key) per RevenueCat's setup wizard.
2. Create **Entitlement** `full` — must be exactly this string; it maps to
   `EntitlementTier = 'full'` in code.
3. Attach both products to the `full` entitlement.
4. Create **Offering** `default` with packages `$rc_monthly` and `$rc_annual`.
5. Copy the per-platform **public API keys** (Settings → API Keys).

## Phase 3 — Code wiring

1. `npx expo install react-native-purchases` is already in package.json
   (^10.4.1) — verify it matches SDK 57 expectations at wiring time
   (`npx expo install --check`).
2. API keys via app config: put keys in `app.json` → `expo.extra.revenuecat`
   (public API keys are safe to ship in the binary; they are not secrets).
3. Rewrite `lib/flux-purchases.ts` bodies (signatures unchanged):
   - Module-level lazy init guard: `Purchases.configure({ apiKey })` on first
     call, keyed by `Platform.OS`.
   - `getEntitlement(db)`: dev override first — if settings
     `dev_full_access` = 'false' return 'free' (keeps the dev toggle working);
     otherwise `(await Purchases.getCustomerInfo()).entitlements.active['full']`
     → 'full' if present, else 'free'. On any SDK error return 'full'
     (default-open — never lock a user out on a network hiccup; matches the
     tested corrupted-value behavior).
   - `purchaseFull(db)`: `getOfferings()` → present `current` packages →
     `purchasePackage(pkg)` → return tier from the resulting customerInfo.
     Catch `PurchasesError` with `userCancelled` → return current tier quietly.
4. `components/PaywallSheet.tsx`: replace the hardcoded price line with prices
   from `getOfferings()` (`pkg.product.priceString`) so store and UI can never
   disagree. Add a "Restore purchases" link — App Store review requires it
   (`Purchases.restorePurchases()`).
5. Keep every RevenueCat import inside function bodies (dynamic import like
   flux-notifications) so jest and Expo Go never load the native module.

## Phase 4 — Testing

1. Build a dev client: `eas build --profile development --platform android`
   (needs a free Expo account + `eas.json`; can also `npx expo run:android`
   locally with Android Studio).
2. Play: add a **license tester** (Play Console → Settings → License testing)
   so purchases are sandboxed. iOS: create a **Sandbox Apple ID** in App Store
   Connect.
3. Test matrix: fresh install → paywall shows store prices → start trial →
   entitlement flips to 'full' → uninstall/reinstall → restore purchases →
   'full' again. Then: cancel trial in store UI → entitlement expires (use
   RevenueCat dashboard "Grant/Revoke" to fast-forward).
4. Jest gate is unaffected: the stub tests keep passing because the dev
   override path stays first.

## Phase 5 — Cleanup before release

- Hide the Settings DEV section behind `__DEV__`.
- Confirm the paywall never blocks the core loop (brief: check-in, logging,
  bucket are free forever — only insights depth, body metrics, history are
  gated).
- Re-run the copy audit on final paywall strings.
