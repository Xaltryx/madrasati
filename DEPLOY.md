# 🚀 Deployment Guide — Arabic Vocab App

## Step 1 — Set up Supabase (10 min)

1. Go to https://supabase.com → New project (free tier)
2. Choose a name, region (closest to you), and password
3. Wait ~2 minutes for it to provision
4. Go to **SQL Editor → New Query**
5. Paste the contents of `supabase_schema.sql` and click **Run**
6. Go to **Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 2 — Migrate your existing data (optional)

To migrate words from your existing `school.sqlite`:

```bash
pip install sqlite3 supabase --break-system-packages

python migrate.py  # See migrate.py in this folder
```

Or you can manually re-enter lessons and words in the web app's **Manage** page.

## Step 3 — Run locally

```bash
# Install dependencies
npm install

# Create your .env.local
cp .env.example .env.local
# Fill in your Supabase URL and anon key

# Start dev server
npm run dev
# → Open http://localhost:3000
```

## Step 4 — Deploy to Vercel

### Option A: Via Vercel CLI
```bash
npm install -g vercel
vercel
# Follow prompts — it auto-detects Next.js
```

### Option B: Via GitHub (recommended)
1. Push this folder to a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/arabic-vocab-app
   git push -u origin main
   ```
2. Go to https://vercel.com → New Project → Import from GitHub
3. Select your repo → click **Deploy**

### Step 4b — Add Environment Variables to Vercel
In Vercel dashboard → your project → **Settings → Environment Variables**, add:
- `NEXT_PUBLIC_SUPABASE_URL` = your project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key

Then **Redeploy** (Deployments → 3-dot menu → Redeploy).

---

## Project Structure

```
arabic-vocab-app/
├── app/
│   ├── page.tsx              ← Home dashboard
│   ├── quiz/page.tsx         ← Quiz (Normal/Reverse/MCQ/Timed)
│   ├── sm2/page.tsx          ← Spaced repetition review
│   ├── analytics/page.tsx    ← Progress dashboard
│   ├── manage/page.tsx       ← Add/Edit/Delete vocab
│   └── api/
│       ├── subjects/route.ts
│       ├── lessons/route.ts
│       ├── vocabulary/route.ts
│       ├── quiz/route.ts
│       ├── sm2/route.ts
│       └── analytics/route.ts
├── lib/
│   ├── db.ts                 ← Supabase client
│   ├── answer_matcher.ts     ← Arabic fuzzy matching
│   ├── sm2.ts                ← SM-2 algorithm
│   └── types.ts              ← Shared TypeScript types
├── supabase_schema.sql       ← Run this in Supabase
├── .env.example              ← Copy to .env.local
└── DEPLOY.md                 ← This file
```

## Features

- ✅ **4 Quiz Modes**: Normal, Reverse, MCQ, Timed (15s)
- ✅ **SM-2 Spaced Repetition**: Cards due for review, Easy/Good/Hard/Forgot buttons
- ✅ **Analytics**: Streak tracking, accuracy trend chart, weakest words
- ✅ **Full CRUD**: Add/edit/delete lessons and vocabulary
- ✅ **Arabic fuzzy matching**: Tashkeel normalization, typo tolerance, order-independent
- ✅ **Pipe-separated multiple answers**: `يتجاوز | يتعدى` both accepted
- ✅ **RTL Arabic support**: Cairo font, right-to-left text
- ✅ **Dark theme**: Professional dark UI

## Troubleshooting

**"No vocabulary in this lesson"** — Make sure you've added words in Manage → Vocabulary tab.

**Quiz answer always wrong** — Check that the word has at least one of: synonym, meaning, antonym, plural, singular filled in.

**Supabase error 401** — Check your env variables are set correctly in `.env.local`.

**Vercel build fails** — Make sure environment variables are set in Vercel dashboard before deploying.
