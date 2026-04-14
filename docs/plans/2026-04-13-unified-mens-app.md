# Unified Men's App — Migration Plan

**Goal:** One app for men mirroring the women's app: trial → onboarding → in-program at a single URL that follows the player through their entire journey.

**Date:** 2026-04-13
**Canonical reference:** `~/projects/itp-women-app`
**Architectural choice:** Option B — preserve prospect UUID on promotion to `players`

---

## Constraints

- **Live users.** Trial prospects and in-program players are actively using the apps. Zero downtime required.
- **Staff App deep links** must keep working through the migration.
- **Scout Buddy / Showcase Coordinator** reference these apps and must not break.
- **No destructive DB changes.** Keep `trial_prospects` and `players` as separate tables.

---

## Architecture

**Extend** `itp-trial-onboarding` into `itp-men-app`. The Vite-based `ITP-Player-App` is legacy — port features out, then deprecate.

**URL model:**
- `/[id]` → the universal player URL. Looks up `players` first, falls back to `trial_prospects`.
- Same URL works before and after acceptance because the prospect's UUID is preserved as the player's `id` when promoted.

**Data model:**
- `trial_prospects` → pre-acceptance players.
- `players` → accepted/in-program players (with `program='itp_men'`).
- Staff App promotion action is modified to pass the prospect's `id` as the new player's `id` (INSERT, not generate).

---

## Phases

### Phase 0 — Foundation (backwards compatible)

- [ ] Plan file committed
- [ ] Unified player lookup: `lib/getPlayer.ts` returns `{ source: 'prospect' | 'player', data: ... }`
- [ ] Main `[playerId]` route updated to use the lookup, still renders current trial-style UI
- [ ] Staff App promotion action modified to preserve prospect UUID
- [ ] Backfill: any existing accepted prospects manually given a mapping or a forwarding redirect
- [ ] Deploy. Existing trial URLs work identically. New accepted players resolve via `players` table at the same URL.

### Phase 1 — In-program player view

- [ ] Detect `source === 'player'` and render a program view (schedule, wellness, locations, contacts, payment)
- [ ] Port schedule query pattern from women's app (program_start_date/end_date, filter by itp_men)
- [ ] Hide trial-only sections (signing CTA, hotel recommendations for unassigned) when source is `player`
- [ ] Ship behind feature flag; test with one real accepted player

### Phase 2 — Auth & SSO

- [ ] Port SSO exchange route from Vite Player App → `/auth/sso`
- [ ] Match women's app: public UUID for read, magic-link for sensitive actions
- [ ] Update Staff App sidebar `handleOpenPlayerApp()` behind a feature flag
- [ ] Test SSO round-trip end to end

### Phase 3 — Port Vite-only features

Port one feature per day from `ITP-Player-App`. Order by daily usage:

1. Chores
2. Grocery orders (preserve "1 order per player" cleanup rule)
3. Wellness check-ins
4. Physical testing integration (Iker's database)
5. Admin/housing views

Each feature: port → deploy → announce → monitor 48h → move on.

### Phase 4 — Cutover

- [ ] Rename Vercel project: `itp-trial-onboarding` → `itp-men-app`
- [ ] Keep old domain aliased
- [ ] Vite app: 301 redirect every route to new app
- [ ] Update Staff App links to new domain
- [ ] Monitor logs 48h for missed redirects
- [ ] Keep Vite app live, deployed, rollback-ready for 30 days

### Phase 5 — Multi-tenant merge (future)

Once Men's app is stable for 60 days:
- [ ] Move `itp-men-app` + `itp-women-app` into one repo
- [ ] Route by `program` field
- [ ] Shared design system package

---

## Rollback plan

Every phase has a rollback:

- Phase 0-1: unified route uses feature flag, can be disabled
- Phase 2: Staff App SSO target is env var, flip back in 1 minute
- Phase 3: Vite features still live, old URL works
- Phase 4: remove 301 redirects, Vite app becomes primary again

Vite app stays deployed for **30 days minimum** after Phase 4 cutover.

---

## Critical gotchas to not forget

1. **Prospect UUID preservation.** Staff App's existing promotion logic probably `INSERT INTO players (id, ...)` with a fresh UUID. Must be changed to pass the prospect's `id`.
2. **Existing promoted players have mismatched IDs.** For this small population, either send them new links once or add a lookup table `trial_prospect_to_player(prospect_id, player_id)` and handle both in the URL resolver.
3. **Grocery orders "1 per player" rule** lives in Vite app's `supabase-queries.js` — port it exactly.
4. **Physical testing pipeline** depends on player IDs — don't break it during cutover.
5. **SSO password-setup dismissal** — Vite app's `itp_password_setup_dismissed` localStorage key is set before `setSession()`. Must port byte-for-byte if we keep this auth flow.

---

## Progress log

_Updated as phases complete._

- 2026-04-13: Plan committed. Starting Phase 0.
- 2026-04-13: **Phase 0 complete.** DB column `players.prospect_id` added. Staff App promotion now preserves the UUID going forward. `lib/resolvePlayer.ts` shipped. 4 historical players backfilled (Jonah, Conner, Nathaniel, Lucas-pending). Zero user-facing changes.
- 2026-04-13: **Phase 1 complete.** Resolver wired into routes. In-program players visiting their preserved URL now see a `ProgramView` (schedule, payment, locations, contacts, emergency). Prospects see the existing trial flow unchanged. Onboarding page redirects players to the main view. Verified: Jonah's old trial URL resolves 200 → his player record. Jadon's prospect URL still 200 → trial view.
- 2026-04-13: **Phase 1.5 complete.** Three-phase model (`trial` / `committed` / `in-program`) formalized in `lib/resolvePlayer.ts` via `derivePhase()`. New `CommittedView` component renders for accepted/placed prospects: welcome headline, signing status, payment, passport + U18 upload status with CTA to onboarding, housing (assigned or TBC), contacts, emergency. Hotel recs and trial schedule hidden for committed phase. Preseason banner removed from layout (view-specific messaging replaces it).
- 2026-04-13: **Phase 2 complete (simplified).** Staff App Player detail page's "Open Player's Program Page" card now works for both men and women — men link to the unified portal using `prospect_id` when available (so the trial link and program link are the same URL forever). No SSO exchange needed; the unified app uses UUID-based access like the women's app. SSO port from Vite dropped as unnecessary.
