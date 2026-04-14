# ITP Ecosystem Overview — What Exists, What's Missing

**Date:** 2026-04-13
**Purpose:** Map every flow across the 4 apps involved in a player's journey (Trial Portal, Staff App, Player App, Women's App) so we can consolidate intelligently instead of building net-new.

---

## The full player journey

```
[Scout submits]──▶[trial_prospects:requested]──▶[Staff approves]──▶[scheduled]
                                                                        │
                                                                        ▼
                                        [scheduled] ── trial happens ── [in_progress]
                                                                        │
                                                                        ▼
                                                                   [evaluation]
                                                                        │
                                                                        ▼
                                                        ┌──────[accepted]──────┐
                                                        │                      │
                                                  [committed, not yet]    [rejected/withdrawn]
                                                        │
                                                   Staff promotes
                                                        │
                                                        ▼
                                                  [players:pending]
                                                        │
                                                  [players:active] ── in program ──▶ [alumni]
```

## Apps & what they own today

### 1. Staff App (`ITP-Staff-App`, Next.js)
**Owns:** All state transitions. Everything a player experiences is driven by staff actions here.

Key staff actions that should change what the player sees:
- **Set status** on trial_prospects (manual dropdown, no automation)
- **Assign room_id** (prospect or player)
- **Set accommodation_type** (hotel/house/airbnb/family/own_stay)
- **Set payment_link / payment_amount / payment_status**
- **Set housing_notes** (free text shown on player page)
- **Promote prospect → player** via `convertProspectToPlayer()` in `src/app/prospects/actions.ts:47`

**Gaps:**
- No preview of what the player sees
- Payment fields are recorded but don't trigger any email or player-visible change (other than the payment section appearing)
- No feedback-to-scout on trial outcome (scout submits prospect, never learns if they're accepted)

### 2. Trial Portal (`itp-trial-onboarding`, Next.js)
**Owns:** Everything a prospect sees before becoming a player. Recently extended (Phase 0+1) to also render an in-program view for promoted players at the same URL.

**What works:**
- Document signing (3 docs)
- Travel form (now collapses to summary when submitted)
- Schedule, locations, contacts, hotels, emergency info
- Phase-aware onboarding (trial = 4 steps, program = 5-6 steps)

**The "disconnection" the user spotted:**

The info page (`app/[playerId]/page.tsx`) is still _trial-styled_ even for `accepted`/`placed` prospects (committed but not yet promoted). That means:

- A committed player sees **"Recommended Hotels"** (they don't need those — they have housing)
- They see the **full signing CTA** (they signed during trial)
- Their **trial dates** are shown even though the trial is over
- The preseason banner is the only thing that shifts between trial-vs-committed

So for the `scheduled → accepted → promoted` journey, the app only has 2 real states (prospect vs player). It needs **3**: trial, committed, in-program.

### 3. Player App (`ITP-Player-App`, Vite/React, legacy)
**Owns:** The entire in-program experience for committed men's players.

17.5k LOC. Daily-use features we'd have to port:
- **Chores + House competition** (photo uploads, staff approval, real-time leaderboard)
- **Grocery ordering** (€35 budget, cart, delivery dates)
- **Wellness check-in** (5-metric daily log, streaks, milestone celebrations)
- **Dashboard "Mission Control"** (readiness gauge, smart guidance)
- **Goals** (player-created, progress tracking, celebrations)
- **Focus notes + Drills** (staff-assigned, weekly drill completion)
- **Calendar** (read-only)
- **Pathway** (college/club targets, read-only)
- **Physical Testing** (benchmarks by age group, read-only)

Dead / abandoned:
- Messages page (demo only, no DB writes)
- XP/Level system (scaffolded, never wired)

Fragile bits:
- SSO via URL hash fragment tokens
- Demo mode fallback in localStorage (silent)
- Berlin-timezone scattered across files
- Email → player linking (silent failure if no match)
- Password-setup-dismissed tracking in localStorage per user

### 4. Women's App (`itp-women-app`, Next.js)
**Canonical pattern.** Covers trial → onboarding → in-program in one codebase.

**Phase detection**: `onboarding_completed_at` on the `players` row.
- `null` → show onboarding CTA banner, hide TabNav
- Set → show TabNav (Schedule/Wellness/Testing), hide onboarding banner

**Section visibility**:
- `PaymentSection`: only if `payment_link && payment_status !== 'received'`
- `HotelRecommendations`: only if `!room_id && !house_id` (unhoused)
- `HousingSection`: always, adapts copy to state
- `WeeklySchedule`: only if `program_start_date` is set
- `TabNav`: only if onboarded

**Does not have**: chores, grocery, goals, drills, focus notes, physical tests, pathway. These are the Vite-app-only features men would need.

---

## The disconnection, named plainly

**Today the men's journey is fragmented across 3 URLs, 3 stacks, 3 visual languages:**

1. Trial portal URL (`itp-trial-onboarding.vercel.app/<prospect-uuid>`) — prospect phase
2. Trial portal URL also → prospect's post-acceptance "waiting room" (but visually still trial)
3. Vite app URL (`itp-player-app.vercel.app`) — after promotion, entirely different app

**Staff App behavior accentuates this:**
- Email 1 sent on scheduling → trial portal link
- Email 2 sent on promotion → Vite app magic link
- No other URLs tracked; staff can't preview

**Data model reflects it:** `trial_prospects` and `players` are two tables. Promotion copies _some_ fields, leaves others behind. Resolver now bridges the URL gap (Phase 0), but the UX doesn't yet bridge the phase gap.

---

## The three phases the unified app needs

### Phase A — Trial (`trial_prospects.status ∈ {requested, inquiry, scheduled, in_progress, evaluation, decision_pending}`)
- Hero: "Welcome, X — trial: Apr 16–22"
- Sections: trial schedule, trial locations, travel form, signing (3 docs), hotel recs, emergency
- Onboarding tab: 4 steps (sign, travel, equipment, confirm)
- **Hide**: preseason banner, payment (unless payment_link is set — then show; it's used for trial fees too)

### Phase B — Committed (`trial_prospects.status ∈ {accepted, placed}`)
- Hero: "You're in. Here's what's left before preseason"
- Sections: preseason banner, payment CTA (if link set), passport upload CTA, U18 legal form CTA (if minor), signing status (should be complete), housing TBC or assigned
- **Hide**: hotel recs (they'll have housing), trial schedule (trial is over)
- Onboarding tab: full 5–6 steps

### Phase C — In-program (`players.*`, regardless of sub-status)
- Hero: "Welcome, X — program: Jul 6 – …"
- Sections: full ProgramView (schedule, locations, contacts, payment, housing, emergency)
- Eventually: chores, grocery, wellness, goals, drills (ported from Vite app)
- Onboarding tab: hidden (already done)

---

## Gaps to fill (ordered by impact:effort)

**High-impact, low-effort:**
1. **Split info page by sub-phase.** Committed prospects see a different layout than trial prospects. One `if` in `page.tsx`. (~1–2h)
2. **Hide hotel recs for committed prospects.** Same commit as above.
3. **Staff App preview.** "View as player" button on the prospect/player detail page opens the actual player URL in a new tab. (~30min)

**High-impact, medium-effort:**
4. **Port SSO from Vite → unified app.** So Staff App sidebar can open one app regardless of phase. Needs `/auth/sso` route + magic link redirect. (~1 day)
5. **Add housing/room assignment display** on prospect page for committed players (not just on players table). Or copy room_id to players on promotion (already does). (~2h)
6. **Payment event loop.** When staff sets `payment_status='received'`, send a confirmation email. When they create payment_link, notify player via WhatsApp/email. (~half day)

**High-impact, high-effort (the port):**
7. **Port Wellness** — daily, high-value, ~1.5 days
8. **Port Chores + House competition** — real-time, photo upload, staff approval — ~3 days
9. **Port Grocery** — ~2 days
10. **Port Goals + Drills + Focus notes** — ~2 days
11. **Port Calendar + Pathway + Testing** (read-only) — ~1 day

**Cut as dead weight:**
- Messages page (demo only, no writes)
- XP/Level scaffolding (never wired)

**Broken feedback loops to address later:**
- Scout → outcome feedback (on rejection or placement)
- Wellness trends → visible to player
- Focus note → improvement visualization

---

## Recommended next step (concrete)

Before continuing the full port (Phase 2+ of the migration plan), **fix the committed-prospect info page first**. That's the specific dissonance you spotted. It's a ~2-hour job and eliminates the visible disconnection.

Steps:
1. Introduce a `phase` derivation in the layout: `'trial' | 'committed' | 'in-program'`
2. Pass to info page; render a different section list per phase
3. Pass to onboarding page; drive step count off it (already done)
4. Commit, deploy, verify with Jadon (trial) + any accepted/placed prospect + Jonah (in-program)

Then resume Phase 2 (SSO migration) with confidence that the phase model is solid.
