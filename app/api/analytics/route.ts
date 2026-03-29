import { NextResponse } from 'next/server'
import { createClient } from '@/lib/db' // استيراد الدالة الجديدة

export async function GET() {
  const supabase = createClient() // تهيئة العميل

  try {
    // 1. جلب بيانات المستخدم الحالية (آمن وسيرفر سايد)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 })
    }

    const userId = user.id

    // 2. جلب تواريخ الدراسة لحساب السلسلة (Streak)
    const { data: streaks } = await supabase
      .from('study_streaks')
      .select('study_date')
      .eq('user_id', userId)
      .order('study_date', { ascending: false })

    const streakCount = streaks ? streaks.length : 0

    // 3. جلب الكلمات الضعيفة (التي أخطأ فيها الطالب أكثر من غيرها)
    // نستخدم Join لجلب الكلمة ومعناها من جدول vocabulary
    const { data: progress, error: progError } = await supabase
      .from('word_progress')
      .select(`
        times_incorrect,
        times_correct,
        vocabulary:vocabulary_id (
          word,
          meaning
        )
      `)
      .eq('user_id', userId)
      .gt('times_incorrect', 0) // فقط الكلمات التي أخطأ فيها
      .order('times_incorrect', { ascending: false })
      .limit(5)

    // 4. جلب إجمالي النقاط من البروفايل
    const { data: profile } = await supabase
      .from('profiles')
      .select('total_xp')
      .eq('id', userId)
      .single()

    // تنسيق البيانات لتناسب الواجهة العربية
    return NextResponse.json({
      currentStreak: streakCount,
      totalXP: profile?.total_xp || 0,
      totalAnswered: 0, // يمكن ربطها بجدول quiz_sessions لاحقاً
      overallAccuracy: 0, // يمكن حسابها (صح / الكل * 100)
      weakestWords: (progress || []).map((p: any) => ({
        word: p.vocabulary?.word || 'غير معروف',
        meaning: p.vocabulary?.meaning || '-',
        accuracy: Math.round((p.times_correct / (p.times_correct + p.times_incorrect)) * 100) || 0
      }))
    })

  } catch (e: any) {
    console.error('Analytics Error:', e.message)
    return NextResponse.json({ error: 'فشل جلب البيانات الإحصائية' }, { status: 500 })
  }
}