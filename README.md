# 🏛️ Fantasy Politics

Fantasy football for world politics: you and your friends draft real political leaders, and they score points from real-world activity each week, such as Wikipedia attention, diplomacy, bills signed and elections won.

> **Build status:** Phase 1 of 5 is complete (auth, leagues, invites, player pool and admin panel, deploy).
> Next: Phase 2, the live draft room.

## Tech stack

| Layer | Choice |
| --- | --- |
| Language | TypeScript everywhere |
| Frontend | React 19, Vite, Tailwind v4, TanStack Query, React Router (mobile-first) |
| Backend | Node 22, Express 5, Socket.io (draft room in Phase 2) |
| Database | PostgreSQL with Prisma 6 |
| Hosting | Render: one web service, Render Postgres and a cron job (`render.yaml`) |
| Tests | Vitest |

## Repo layout

```
packages/shared/   Types and rules shared by client and server (positions, lineup slots,
                   league settings validation, scoring config, event types)
server/            Express API, Prisma schema and migrations, player seed, cron job
  prisma/seed/players.ts   ⚠️ seed list of officeholders (needs verification)
web/               React app (served by Express in production)
render.yaml        Render Blueprint
```

In production a single web service serves the API, websockets and the built React app from one origin. That means cookies just work, with no CORS setup.

## Local development

You need Node 20 or newer and a PostgreSQL database.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your env file, then edit `.env` and put your own email in `ADMIN_EMAILS`:

   ```bash
   cp .env.example .env
   ```

3. Create the database tables and seed about 240 players:

   ```bash
   cd server && npx prisma migrate dev && npm run seed && cd ..
   ```

4. Run the API on :3001 and Vite on :5173:

   ```bash
   npm run dev
   ```

Open http://localhost:5173 and sign up with the email you put in `ADMIN_EMAILS`. You'll see an **Admin** tab.

Other commands:

```bash
npm test             # unit tests (shared + server)
```

```bash
npm run typecheck    # TypeScript across all workspaces
```

```bash
npm run build        # production build (web, then server)
```

To test invites on your phone over Wi-Fi, run Vite with `--host` and open `http://<your-computer-ip>:5173`.

## Deploying to Render

1. Push this repo to GitHub.
2. In Render, go to **New → Blueprint**, pick the repo and Render will read `render.yaml`.
3. When prompted, set:
   - **ADMIN_EMAILS**: your email (comma-separate several admins).
   - **PUBLIC_URL**: optional. Your app URL, e.g. `https://fantasy-politics.onrender.com`. Set it after the first deploy if you don't know it yet.
4. Click **Apply**. Render creates:
   - `fantasy-politics-db` (Postgres)
   - `fantasy-politics` (web). Every deploy runs `prisma migrate deploy`, seeds the player pool **only if it's empty**, then starts the server.
   - `fantasy-politics-weekly-scoring` (cron, Mondays 06:00 UTC). It's a placeholder until Phase 3.
5. Open the web service URL, sign up with your admin email, and start verifying players in **Admin → Players**.

**Cost.** The Blueprint uses Starter web ($7/mo), Basic Postgres (about $6/mo), and a cron job billed by the minute (pennies). To try it for free, change `plan` to `free` for the web service and database. Free web services sleep after 15 minutes idle (the first load takes about 30s), and free databases expire after 30 days.

**Custom domain.** Add it in the web service's Settings → Custom Domains, then update `PUBLIC_URL`.

## Playing

1. **Create a league.** You become the commissioner.
2. **Invite friends.** Share the invite link from the league page (or the `XXXX-XXXX` code). Friends sign up, name their team and they're in.
3. **Tune settings** (commissioner, until the draft starts): team count (4–12), lineup slots, bench size, season length, playoff teams, timezone, pick timer (30s–3min), draft order mode, and every scoring value.
4. **Schedule the draft.** Everyone sees the time in their own timezone, with a countdown on the league page.

**Forgot password?** There's no email service in v1. The commissioner (League settings → Members) or an admin (Admin → Users) generates a one-time reset link, valid for 48 hours, and texts it to the friend.

## Admin panel (`/admin`)

Only emails listed in `ADMIN_EMAILS` can see it.

- **Players**: add, edit and delete players, change status tags, and filter by "Needs verification". You can also pull photos and bios from Wikipedia, one at a time or 25 at a time for missing ones.
- **Left office**: removes the player from every roster and draft queue. It optionally logs the Left Office penalty and creates their replacement, who becomes a free agent (and goes on waivers from Phase 5).
  - Lineups already locked for the current week keep the player, so that week's scoring stays fair.
  - Players who have been drafted can't be deleted, because that would break draft history. Mark them left office instead.
- **Event log**: record Diplomacy, Output, Survival and Elections events. You can tag several players at once, e.g. everyone at a summit. The weekly in-office bonus is automatic and doesn't need logging.
- **Users**: generate password reset links.

### ⚠️ The seed data needs verification

`server/prisma/seed/players.ts` was written from an AI model's training data and then spot-checked against news via web search in November 2026. Officeholders change constantly, so **every player starts flagged "Needs verification"**. Rows with known uncertainty have an admin note explaining what to check. Work through them in Admin → Players, then click **Save & mark verified**.

## Scoring (implemented in Phase 3; config is editable now)

Scoring is pluggable. Each category is a module with tunable points per unit, configured per league in `packages/shared/src/scoring/`.

- **Media Share**: weekly Wikipedia pageviews compared with the player's *own* 8-week average. One unit is 10% above baseline, capped at 30 units per week, with no negative points. Optionally adds home-language Wikipedia views.
- **Diplomacy**: foreign trip 3, bilateral 2, summit attended 4, summit hosted 8, agreement signed 5.
- **Output**: bill or budget signed 4, executive order 2, veto 2.
- **Survival**: in office +2 per week (automatic), won confidence vote +10, left office −15.
- **Elections**: won +25, lost −15.

Design rules: score activity and measurable outcomes only, never ideology. Never award points for military action, crackdowns or casualties.

## Roadmap

1. ✅ Auth, leagues, invite links, player pool seed and admin panel, Render deploy
2. ⏳ Live draft room: snake draft, pick timer, queue and autopick, chat, pause/undo, reconnects
3. Rosters and lineups, schedule generation, weekly scoring (pageviews and events), matchups, standings, cron job
4. Playoffs, championship, league history
5. Waivers and trades, with commissioner veto

## Known notes

- `npm audit` reports advisories in the **Prisma CLI's** transitive dependencies (`effect`, `deepmerge-ts`) and in esbuild's Windows-only dev server. None of them run in the request path. They'll go away with a later Prisma upgrade.
- The draft room will keep live state in one server process. That's fine for a friends league, but don't scale the web service beyond one instance.
