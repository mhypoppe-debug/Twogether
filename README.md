# Twogether — Household Budget

A shared budget & savings tracker for couples, running as a real, standalone
website (not a Claude artifact). Data lives in your own Supabase database, so
it doesn't depend on Claude at all once it's deployed.

This project was generated from a Claude conversation. If you're picking this
up with **Claude Code**, just say: *"Set this up and deploy it — walk me
through any accounts you need me to create."* Claude Code can run every
command below for you; it will only ask you to click things in a browser
where a human is genuinely required (creating accounts, clicking "Deploy").

## What you need (both free)

1. A **Supabase** account — this is the database. https://supabase.com
2. A **Vercel** account — this is where the site itself is hosted. https://vercel.com

Neither requires a credit card for this project's scale.

## One-time setup

### 1. Create a Supabase project
- Go to https://supabase.com/dashboard → **New project**.
- Pick any name/region, set a database password (you won't need it again for this app).
- Wait ~2 minutes for it to finish provisioning.

### 2. Create the database table
- In your new project, open **SQL Editor** → **New query**.
- Paste the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and click **Run**.
- This creates the one `households` table the app needs.

### 3. Get your Supabase keys
- Go to **Project Settings** (gear icon) → **API**.
- Copy the **Project URL** and the **`service_role` secret key** (not the "anon public" one).

### 4. Configure environment variables
**For local development:**
```bash
cp .env.local.example .env.local
# then paste your two values into .env.local
```

**For production (Vercel):**
- In your Vercel project → **Settings** → **Environment Variables**, add:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### 5. Install dependencies and run locally (optional, to test first)
```bash
npm install
npm run dev
```
Open http://localhost:3000 — you should see the "Create a new household" screen.

### 6. Deploy to Vercel
Easiest path — Vercel's CLI:
```bash
npm install -g vercel
vercel
```
Follow the prompts (link/create a Vercel project). Then add the two environment
variables in the Vercel dashboard (step 4) if you haven't already, and run:
```bash
vercel --prod
```
You'll get a real URL like `https://twogether-yourname.vercel.app` — that's
the one you and your partner use from now on. No Claude account, no artifact
link, and updates from here on are just: edit code → `vercel --prod` again.

## How login works

There's no traditional "user account" system — instead:
- Creating a household generates a short **Household ID** (e.g. `smith-a1b2c3`) and asks you to set a password.
- Share the ID + password with your partner; that's their "login."
- The browser remembers your session locally, so you won't need to log in every visit (until you explicitly log out).
- Passwords are hashed with bcrypt server-side before ever touching the database — reasonable security for a household budgeting tool, not bank-grade (no 2FA, no rate limiting, no email verification).

## Project structure

```
app/
  page.js                        the whole app (client-rendered)
  layout.js                      HTML shell + font loading
  api/household/create/route.js  create a household (POST)
  api/household/login/route.js   log in to a household (POST)
  api/household/save/route.js    save changes (POST)
components/
  HouseholdBudgetApp.jsx         all the UI — dashboard, income, expenses, reserves, categories
supabase/
  schema.sql                     run this once in Supabase's SQL editor
```

## Making changes later

Bring this project back to Claude (or Claude Code) and describe what you want
changed. Since the database is separate from the code, redeploying
(`vercel --prod`) never touches your existing household data.
