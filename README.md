# 📖 مدرستي (Madrasati) — v2.0

> **Arabic Vocabulary Learning Platform** — A full-stack web app for students to master Arabic vocabulary through smart quizzes, spaced repetition, analytics, and a competitive leaderboard.

---

## ✨ Features

- **📝 Smart Quiz** — Quiz system that tests synonym, meaning, antonym, plural, and singular forms of vocabulary words.
- **🔁 SM2 Spaced Repetition** — Flashcard review system powered by the SM2 algorithm. Cards are scheduled based on performance so students review at the optimal time.
- **📊 Analytics Dashboard** — Personal stats including current streak, weakest words, accuracy trends, and total XP earned.
- **🏆 Leaderboard** — Global ranking of students by XP score (calculated from correct answers and study streaks).
- **⭐ Word of the Day** — A daily rotating vocabulary word shown on the homepage.
- **⚙️ Content Management** — Admin interface to create, edit, and delete subjects, lessons, and vocabulary words.
- **🔔 Admin Notifications** — Email alerts sent to the admin via Resend when a user registers or logs in.
- **🔐 Auth** — Supabase-powered authentication (email/password). Protected routes via Next.js middleware.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| Styling | Tailwind CSS + Custom CSS |
| Charts | Recharts |
| Icons | Lucide React |
| Email | Resend |
| Deployment | Vercel |

---

## 📁 Project Structure

```
school-main/
├── app/
│   ├── admin/          # Admin stats dashboard
│   ├── analytics/      # Student analytics page
│   ├── auth/           # Login / Register page
│   ├── leaderboard/    # Global student ranking
│   ├── manage/         # Content management (subjects, lessons, vocab)
│   ├── quiz/           # Quiz interface
│   ├── sm2/            # Spaced repetition review
│   ├── components/
│   │   └── NavAuth.tsx # Auth-aware navigation component
│   ├── globals.css
│   ├── layout.tsx      # Root layout with RTL support
│   └── page.tsx        # Homepage (Word of the Day + nav cards)
├── app/api/
│   ├── admin/stats/    # GET  — Platform-wide statistics
│   ├── analytics/      # GET  — Personal user analytics & streaks
│   ├── leaderboard/    # GET  — XP-ranked student list
│   ├── lessons/        # GET, POST, PATCH, DELETE
│   ├── notify/         # POST — Admin email notifications (Resend)
│   ├── quiz/           # POST — Save quiz session & award XP
│   ├── sm2/due/        # GET  — Cards due for review today
│   ├── subjects/       # GET  — All subjects
│   └── vocabulary/
│       ├── route.ts    # GET, POST, PATCH, DELETE — Vocabulary CRUD
│       └── random/     # GET  — Random/daily word
├── lib/
│   ├── answer_matcher.ts  # Answer comparison logic
│   ├── db.ts              # Supabase client factory
│   ├── sm2.ts             # SM2 algorithm implementation
│   └── types.ts           # Shared TypeScript interfaces
└── middleware.ts           # Route protection
```

---

## 🗄 Database Schema (Supabase)

The app expects the following tables in your Supabase project:

| Table | Description |
|---|---|
| `subjects` | School subjects (e.g. Arabic, Islamic Studies) |
| `lessons` | Lessons belonging to a subject, organized by unit and lesson number |
| `vocabulary` | Words with `word`, `synonym`, `meaning`, `antonym`, `plural`, `singular` |
| `quiz_sessions` | Records of completed quiz sessions per user |
| `daily_stats` | Daily aggregated question counts and accuracy per user |
| `word_progress` | Per-word correct/incorrect tallies per user |
| `sm2_cards` | SM2 card state: `easiness`, `interval`, `repetitions`, `next_review` |
| `study_streaks` | One row per user per study date |
| `user_profiles` | Extended profile: `username`, `xp`, `avatar_color`, `role` |

---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/school-main.git
cd school-main
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root of the project:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_api_key
```

> ⚠️ **Never commit `.env.local` to version control.** The `.env.example` file is provided as a template.

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys |

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deploying to Vercel

1. Push your project to GitHub.
2. Go to [vercel.com](https://vercel.com) and import the repository.
3. In the Vercel project settings, add the following **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `RESEND_API_KEY`
4. Click **Deploy**. Vercel auto-detects Next.js — no build configuration needed.

---

## 🧹 Files Safe to Delete Before Deploying

| File | Reason |
|---|---|
| `directory_tree.txt` | Local reference only, not used by the app |
| `vitest.config.ts` | Testing config — delete this since you removed the tests |

> The `.git/` folder is automatically ignored by Vercel and does not need to be deleted.

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |

---

## 🔐 Authentication & Authorization

- Authentication is handled by **Supabase Auth** (email/password).
- `middleware.ts` protects routes server-side, redirecting unauthenticated users to `/auth`.
- The `user_profiles` table stores a `role` field for distinguishing admin users.
- Admin email notifications are sent via **Resend** on register and login events.

---

## 📄 License

Private project — All rights reserved © مدرستي v2.0
