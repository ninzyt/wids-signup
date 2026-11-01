# WiDS exec space — local MVP

An event and shift sign-up board for UBC Women in Data Science. Everyone can
create events, archive/restore them, and sign up by name. There are no admin/exec
permission levels or authentication in this version.

## Run on this computer

Use Node 24 (`nvm use`), then:

```sh
npm ci
npm run dev
```

Open the local URL Vite prints. No Supabase project or environment keys are needed.
If you have an existing `.env.local`, keep `VITE_BASE_PATH=/` for local development.
The Supabase variables are currently unused.

1. Open the top-right menu → **Event dashboards** → **+ Add event**.
2. Enter an event name, date and start time. Location and details are optional.
3. Add one or more roles, each with a name, start/end time and number of people.
   Shifts use the event date. Check **Ends next day** for an overnight shift.
   Setup roles can start before the event itself. Dates/times use your browser's
   local time zone and are stored as ISO timestamps.
4. Select **Create event**. Its compact block appears on the dashboard, and its
   sign-up card appears on the home page and calendar.
5. Use **+** on a dashboard block to expand its schedule and people; **−** minimizes
   it again. Compact blocks have equal heights; expanded blocks also have equal
   heights with internally scrollable schedules. **Full details** opens its own page.
6. On the home page, select **Sign up**, enter a name, choose an open role, and save.
7. **Archive event** removes it from active dashboards, home, and calendar. The
   **Archived** filter preserves the event and people; **Restore event** brings it back.

## What “local” means

Events, role times, signups and archive state are saved in this browser's
`localStorage` under `wids.events.v1`. Refreshing keeps the data. Tabs on the same
origin/browser profile update each other. Different browsers, computers, private
windows, localhost ports, and published URLs have separate storage. Clearing site
data removes these local events. Minimize/expand is a temporary view preference.

The app does not read or write Supabase right now, even if its environment values
exist. Existing remote data is left untouched and is not automatically imported.
For shared team use, reconnect the storage layer to a database in a later step.

All local writes validate again before saving. Duplicate names are rejected per
role, ignoring case and repeated whitespace; full roles and archived events reject
signups. Web Locks serialize writes between tabs where supported. This is local
prototype validation, not a server-side security boundary. Corrupt or blocked
storage shows an error instead of silently replacing saved data.

## Checks

```sh
npm run build       # TypeScript and production build
npm run preview     # Preview dist/
npm run test:ui     # Local storage flows in installed Google Chrome
npm test            # Legacy SQL migration checks for future Supabase integration
```

Browser tests cover creation with multiple roles, time validation, overnight
shifts, signups, duplicates, capacity across two tabs, persistence, archive/restore,
mobile layout and corrupt storage. They use isolated browser storage on port 5174.

## Structure

- `src/App.tsx`: shared header/menu, notepad, home page and footer.
- `src/features/events/data.ts`: local storage boundary, types and validation.
- `src/features/events/useEvents.ts`: cached reads and same-tab/cross-tab refresh.
- `src/features/events/CreateEventForm.tsx`: event and timed-role creation.
- `src/features/events/ManageEvents.tsx`: compact/expanded blocks and archive actions.
- `src/features/events/EventBoard.tsx`: home sign-up cards and forms.
- `src/features/events/EventPages.tsx`: calendar and event dashboard pages.
- `src/components/EventModal.tsx`: accessible dialog with focus handling.
- `src/router.tsx`: all route definitions, using hash routing for GitHub Pages.
- `src/index.css`: pixel styling, dark theme, cursor and animation.

Set `ANIMATE_SPARKLES=false` in `src/App.tsx` to stop twinkling, or
`CUSTOM_CURSOR=false` in `src/main.tsx` to restore standard cursors. Reduced-motion
settings automatically keep sparkles still.

## GitHub Pages

The app remains a static Vite build. To deploy:

1. Push this project to a GitHub repository's `main` branch.
2. Select **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. Under **Settings → Secrets and variables → Actions → Variables**, set
   `VITE_BASE_PATH` to `/your-repository-name/` (or `/` for a custom domain or an
   `OWNER.github.io` repository).
4. Run **Actions → Deploy to GitHub Pages → Run workflow**, or push to `main`.
5. After both jobs pass, open **Settings → Pages → Visit site**.

Publishing this local MVP does NOT share events: each visitor has their own browser
storage. No Supabase variables are required for this build. `VITE_BASE_PATH` is
read via `loadEnv` in Vite config; generated assets work beneath the repository
path. All application routes remain in `src/router.tsx`.

For Vercel, select Vite, Node 24, `npm run build`, `dist`, and `VITE_BASE_PATH=/`.
Hash routes work unchanged. If switching to `createBrowserRouter`, add an SPA
rewrite to serve `index.html` for application routes.

## Future shared database

The previous Supabase client, migration, seed data and SQL tests remain in the
repository for future integration; they are not part of the running local MVP.
The previous schema does not yet include role time frames or event archiving, and
its browser permissions do not allow event creation. Do not assume that simply
setting Supabase keys enables the new workflow. A later integration should add
migrations for these fields, an atomic event-and-roles creation operation, and the
chosen access policies, then replace the functions in `data.ts` with shared writes.
Never expose a Supabase secret/service-role key in browser code.
