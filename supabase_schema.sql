-- ============================================================
-- Arabic Vocabulary App — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Lessons
CREATE TABLE IF NOT EXISTS lessons (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  unit          INTEGER NOT NULL DEFAULT 1,
  lesson_number INTEGER NOT NULL DEFAULT 1,
  subject_id    INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE(subject_id, unit, lesson_number)
);

-- Vocabulary
CREATE TABLE IF NOT EXISTS vocabulary (
  id        SERIAL PRIMARY KEY,
  word      TEXT NOT NULL,
  synonym   TEXT DEFAULT '',
  meaning   TEXT DEFAULT '',
  antonym   TEXT DEFAULT '',
  plural    TEXT DEFAULT '',
  singular  TEXT DEFAULT '',
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE
);

-- Word Progress (single user, user_id always = 1)
CREATE TABLE IF NOT EXISTS word_progress (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL DEFAULT 1,
  vocabulary_id  INTEGER NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  times_correct  INTEGER DEFAULT 0,
  times_incorrect INTEGER DEFAULT 0,
  mastery_level  INTEGER DEFAULT 0,
  last_reviewed  TIMESTAMPTZ,
  UNIQUE(user_id, vocabulary_id)
);

-- Quiz Sessions
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL DEFAULT 1,
  lesson_id        INTEGER REFERENCES lessons(id) ON DELETE SET NULL,
  score            INTEGER NOT NULL,
  total_questions  INTEGER NOT NULL,
  percentage       REAL NOT NULL,
  duration_seconds INTEGER NOT NULL,
  completed_at     TIMESTAMPTZ DEFAULT NOW()
);

-- SM-2 Cards
CREATE TABLE IF NOT EXISTS sm2_cards (
  id             SERIAL PRIMARY KEY,
  user_id        INTEGER NOT NULL DEFAULT 1,
  vocabulary_id  INTEGER NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  ease_factor    REAL DEFAULT 2.5,
  interval       INTEGER DEFAULT 0,
  repetitions    INTEGER DEFAULT 0,
  next_review    TIMESTAMPTZ,
  last_review    TIMESTAMPTZ,
  total_reviews  INTEGER DEFAULT 0,
  UNIQUE(user_id, vocabulary_id)
);

-- Study Streaks
CREATE TABLE IF NOT EXISTS study_streaks (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER NOT NULL DEFAULT 1,
  study_date          DATE NOT NULL,
  questions_answered  INTEGER DEFAULT 0,
  UNIQUE(user_id, study_date)
);

-- Daily Stats
CREATE TABLE IF NOT EXISTS daily_stats (
  id                  SERIAL PRIMARY KEY,
  user_id             INTEGER NOT NULL DEFAULT 1,
  stat_date           DATE NOT NULL,
  total_questions     INTEGER DEFAULT 0,
  correct_answers     INTEGER DEFAULT 0,
  study_time_seconds  INTEGER DEFAULT 0,
  UNIQUE(user_id, stat_date)
);

-- ============================================================
-- Seed default subjects (edit to match your school.sqlite)
-- ============================================================
INSERT INTO subjects (name) VALUES
  ('Arabic'),
  ('English A.L'),
  ('English O.L'),
  ('French'),
  ('Math'),
  ('Science'),
  ('Social Studies')
ON CONFLICT (name) DO NOTHING;
