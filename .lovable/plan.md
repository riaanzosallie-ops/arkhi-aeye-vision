# ARKHI 2 — Production Hardening Plan

Scope: upgrade existing app only. No redesign, no rebuild.

## 1. Remove Investor Mode
- Delete `src/routes/investor.tsx`.
- Remove all Investor links/buttons/cards from `AppShell`, `FloatingAEye`, bottom nav, home (`index.tsx`), and any "investor" kind in `ai.functions.ts`.
- Add a redirect route at `/investor` → `/` (or `/auth` if unauthenticated) so old links don't 404.
- Remove the `investor` prompt block from `aiAsk` systems map.

## 2. Remove Demo / Sample / Mock Mode
- Grep for `demo`, `sample`, `mock`, `placeholder`, `fakeData`, `testMode`, "Preview investor", "Simulated" across `src/`.
- Strip hardcoded valuation ranges, fake metrics, and any "This is demo data" copy.
- Keep only data sourced from: user input, uploaded images, OCR, AI response, Supabase.
- Owner Analytics keeps live Supabase data only; remove any seeded defaults.

## 3. Real Auth (production)
- Build `/auth` route (login + create account tabs) and `/forgot-password`, `/reset-password` routes.
- Use existing Supabase auth + `profiles` table (already has `display_name`). Add `username` column via migration, unique, no-spaces check, with GRANTs.
- Login: accept username OR email. If username, resolve to email via a public `resolve_username_email` server fn (admin client, returns email only).
- Signup fields: full name, username, email, password, confirm password. Client + server zod validation: username unique/no-spaces, password ≥ 8, confirm matches.
- Forgot password: accept email or username → resolve → `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`.
- `/reset-password` handles `type=recovery` hash and calls `supabase.auth.updateUser({ password })`.
- Enable Google OAuth via the social-auth tool (default per platform rules).

## 4. Preview Access (not "demo")
- Unsigned users can hit `/floor-plan`, upload, run analysis, view report, copy/share.
- Save / Export PDF / Cloud history / My Home / Owner buttons gated. When clicked unauthenticated → toast + redirect CTA: "Create a free account to save and export your Arkhi report."
- Label the entry CTA "Try Preview Access" — never "Demo".

## 5. Live Floor-Plan Analysis (tighten existing pipeline)
- Auto-trigger on file select (already partially done) — verify base64 fallback works for guests with no Supabase Storage access.
- Strict factual report rendering in `floor-plan.tsx`:
  ```
  PROPERTY DETECTION REPORT
  File Received: Yes
  OCR Status: Completed | Failed
  Rooms Detected: N
  Total Internal Area: NN m²
  Confidence: NN%
  ROOM BREAKDOWN — table: Room | Dimensions | Area | Confidence
  ```
- Failure view shows only: Status / Reason / Recommendations (no design filler).
- Extend `BANNED_PHRASES` in `ai.functions.ts` with: "welcome, discerning homeowner", "beautiful canvas", "while we await", "please share your floor plan", "your journey begins", "let's envision", "i propose".
- Floor-plan route never renders generic AI welcome copy after a file is present.

## 6. Copy / Share / Download
- Add to report card:
  - **Copy Report** → `navigator.clipboard.writeText(reportText)`
  - **Share Report** → `navigator.share(...)` with fallback to copy
  - **Download .txt** → blob download
  - **Save to Account** → visible only when signed in; persists to `arkhi_valuation_reports` or a new `arkhi_floor_plan_reports` table (reuse existing).
- `reportText` builder formats the exact spec above with timestamp.

## 7. Mobile Polish
- Ensure floor-plan image uses `max-w-full h-auto`.
- Analysis panel has bottom padding to clear the floating nav.
- Auth + forgot-password forms responsive (single column, full-width inputs).
- Remove investor/demo entries from bottom nav.

## 8. Validation
- Manual: signup → login (username + email) → forgot → reset → preview upload → factual report → copy/share → save gated.
- Build must pass; `/investor` redirects; banned phrases blocked.

## Technical Notes
- DB migration: add `username text unique` to `profiles` + index + check constraint `username ~ '^[A-Za-z0-9_.-]+$'`. Backfill from `split_part(email,'@',1)` with collision suffix. Add GRANTs.
- New server fn `resolveUsernameToEmail` in `src/lib/auth.functions.ts` using `supabaseAdmin` inside handler (per import-graph rules).
- Files touched (est.): `routes/auth.tsx` (rewrite), `routes/forgot-password.tsx` (new), `routes/reset-password.tsx` (new), `routes/investor.tsx` (delete + stub redirect), `routes/floor-plan.tsx`, `routes/index.tsx`, `components/AppShell.tsx`, `components/FloatingAEye.tsx`, `lib/ai.functions.ts`, `lib/auth.functions.ts` (new), `integrations/supabase/types.ts` (regen entry), migration SQL.
