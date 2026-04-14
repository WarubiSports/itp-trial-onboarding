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

### Phase 5 — Vite sunset + multi-tenant merge (future)

**Sunset prep (shipped 2026-04-14):**
- [x] Staff App sidebar: "Player App" generic button removed
- [x] Vite app: sunset banner on every page pointing users to Thomas on WhatsApp
- [ ] Set the hard sunset date — suggested: **2026-06-30** (one week before preseason)
- [ ] Between now and sunset date, migrate the ~5 active Vite users off by hand
- [ ] On sunset date: replace Vite app routes with a single redirect page ("Use your new portal — ask Thomas")
- [ ] +30 days: take the Vite Vercel project offline

**Multi-tenant merge (after Men's app stable for 60 days):**
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
- 2026-04-13: **Phase 3.1 (Wellness) complete.** `/[playerId]/wellness` with daily check-in form, 7-day history with readiness score, streak count, prefill from yesterday. TabNav gains a `program` variant (Info / Wellness). Gated on source==='player' and program_start_date.
- 2026-04-13: **Phase 3.2 (Chores + House Competition) complete.** `/[playerId]/chores` route. ChoresList (to-do / done sections, priority coloring, deadline pills, points), HouseLeaderboard (3 houses ranked by total_points, player's house highlighted). POST /api/chores/complete marks chore approved and bumps house total_points. Photo upload skipped for v1 (chore_photos table doesn't exist; no live chores use it). TabNav now: Info / Wellness / Chores.
- 2026-04-13: **Phase 3.3 (Grocery) complete.** `/[playerId]/grocery` route with full cart UX: 8 category filter pills, 51 items with inline +/- quantity controls, sticky bottom bar showing budget progress and delivery date picker (next 4 Tue/Fri with 8 AM Berlin deadlines). POST /api/grocery/submit validates server-side (in-stock check, ≥1 qty, budget enforcement, price snapshot on order_items). Active order view replaces the cart when a pending/submitted order exists; new submissions auto-cancel prior active orders. `lib/groceryDeliveryDates.ts` ports Vite's delivery schedule. TabNav now: Info / Wellness / Chores / Grocery.
- 2026-04-13: **Phase 3.4 (Goals + Drills + Focus notes) deferred.** Production check showed 0 focus notes, 0 drill completions, 1 goal. Porting UI for unused features is premature. Will revisit once there's actual demand.
- 2026-04-13: **Phase 4 (Welcome email cutover) complete.** Staff App's `sendWelcomeEmail` now sends newly-promoted players to the unified portal (`itp-portal.vercel.app/<prospect_id || id>`) instead of the Vite Player App magic-link. Magic-link auth flow removed — unified portal uses UUID-based access with service-role writes, no password needed. Onboarding CTA is gated on the linked prospect's actual onboarding state rather than an email lookup. Vite app remains live as a fallback for existing users; all new acceptances go to the unified portal. **This is the cutover moment — every new accepted player experiences the unified app from here on.**
- 2026-04-14: **Post-cutover polish.** Phase-aware signing (Program Agreement + Housing Living Agreement added for committed players; trial still 3 docs). Alumni view handles `players.status='alumni'` with a thank-you + contacts page; tabs hidden for alumni; wellness/chores/grocery routes redirect alumni to Info. Preseason date extracted to `lib/programCalendar.ts` (single source of truth). Welcome email's "same one from your trial" line is now conditional on `prospect_id` so direct-to-player creations don't lie. Staff App prospect + player detail pages both expose a "View as Player" button opening the unified portal URL.
- 2026-04-14: **Phase 5 sunset prep.** Staff App sidebar's generic "Player App" button removed (staff now use per-player "View as Player"). Vite Player App shows a dismissible banner on every page: "This app is being replaced. Ask Thomas for your new link" with a WhatsApp deep-link. Actual sunset date not yet set — proposed 2026-06-30, one week before preseason.
