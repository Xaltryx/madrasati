import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { lessonId, score, total, duration } = await req.json()
    const userId = user.id

    // 1. تسجيل الجلسة
    await supabase.from('quiz_sessions').insert({
      user_id: userId,
      lesson_id: lessonId ?? null,
      score,
      total_questions: total,
      percentage: (score / total) * 100,
      duration_seconds: duration ?? 0,
    })

    // 2. الإحصائيات اليومية
    const today = new Date().toISOString().split('T')[0]
    const { data: ds } = await supabase.from('daily_stats')
      .select('*').eq('user_id', userId).eq('stat_date', today).single()

    if (ds) {
      await supabase.from('daily_stats').update({
        total_questions: ds.total_questions + total,
        correct_answers: ds.correct_answers + score,
        study_time_seconds: ds.study_time_seconds + (duration ?? 0),
      }).eq('id', ds.id)
    } else {
      await supabase.from('daily_stats').insert({
        user_id: userId, stat_date: today, total_questions: total,
        correct_answers: score, study_time_seconds: duration ?? 0
      })
    }

    // 3. منح XP
    const xpEarned = score * 10
    if (xpEarned > 0) {
      const { data: profile, error: fetchErr } = await supabase
        .from('user_profiles')
        .select('xp')
        .eq('id', userId)
        .single()

      console.log('FETCH:', { profile, fetchErr, userId })

      const { error: updateErr } = await supabase
        .from('user_profiles')
        .update({ xp: (profile?.xp ?? 0) + xpEarned })
        .eq('id', userId)

      console.log('UPDATE:', { updateErr })
    }

    return NextResponse.json({ success: true, xpEarned, userId })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}