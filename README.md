# INSIDE ZAHMA

Internal testing HQ for **Zahma O La** — employee participation, feedback triage, missions, leaderboard, analytics, and weekly reports.

## Demo mode

If `NEXT_PUBLIC_SUPABASE_URL` is missing, contains `YOUR_PROJECT`, or `SEED_DEMO_DATA=true`, the app runs in **demo mode**:

- Reads from seeded demo data in `src/lib/demo/data.ts`
- Writes are disabled (server actions return a read-only error)
- A banner appears in the dashboard: *Demo mode — connect Supabase to persist data*

You can explore the full UI with `npm run dev` and no Supabase project.

## Setup (production / persistent data)

### 1. Create a Supabase project

Create a project at [supabase.com](https://supabase.com) and note the **Project URL** and **anon public** key.

### 2. Environment variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Do not set `SEED_DEMO_DATA=true` when using a real project.

### 3. Apply the database migration

Run the initial schema migration against your Supabase database (SQL editor or CLI):

`supabase/migrations/20260322120000_initial_schema.sql`

This creates tables, RLS policies, storage bucket policies, and default settings.

Optional sample rows (after an admin exists): `supabase/seed.sql`

### 4. Create an admin user

1. In Supabase **Authentication**, create a user (email + password).
2. Copy the user’s UUID from **Authentication → Users**.
3. Insert a row into `admins`:

```sql
insert into admins (user_id, display_name, email)
values ('YOUR_USER_UUID', 'Your Name', 'you@company.com');
```

### 5. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you’ll be redirected to `/overview`. Sign in at `/login` with your admin credentials.

## Scripts

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start dev server         |
| `npm run build`| Production build         |
| `npm run start`| Start production server  |
| `npm run lint` | ESLint                   |

## Stack

Next.js App Router, Supabase (Auth + Postgres), Tailwind CSS v4, Recharts, Geist font.