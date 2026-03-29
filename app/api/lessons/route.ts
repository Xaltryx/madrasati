import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/db' // التغيير هنا: استيراد دالة إنشاء العميل

// GET /api/lessons أو ?subject_id=X
export async function GET(req: NextRequest) {
  const supabase = createClient() // إنشاء العميل داخل الدالة
  const subjectId = new URL(req.url).searchParams.get('subject_id')
  
  try {
    // جلب الدروس
    let lessonsQuery = supabase
      .from('lessons')
      .select('id, name, unit, lesson_number, subject_id')
      .order('unit')
      .order('lesson_number')

    if (subjectId) lessonsQuery = lessonsQuery.eq('subject_id', subjectId)

    const { data: lessonsData, error: le } = await lessonsQuery
    if (le) throw le

    // جلب المواد لربط الأسماء بالعربية
    const { data: subjectsData, error: se } = await supabase
      .from('subjects')
      .select('id, name')
    if (se) throw se

    const subjectMap: Record<number, string> = {}
    for (const s of (subjectsData || [])) {
      subjectMap[s.id] = s.name
    }

    const lessons = (lessonsData || []).map((l: any) => ({
      id: l.id,
      name: l.name,
      unit: l.unit,
      lesson_number: l.lesson_number,
      subject_id: l.subject_id,
      subject_name: subjectMap[l.subject_id] ?? 'غير محدد',
      word_count: 0,
    }))

    return NextResponse.json(lessons)
  } catch (e: any) {
    console.error('خطأ في جلب الدروس:', e)
    return NextResponse.json([], { status: 200 }) 
  }
}

// POST /api/lessons
export async function POST(req: NextRequest) {
  const supabase = createClient()
  try {
    const { name, unit, lesson_number, subject_id } = await req.json()
    
    // التحقق من الصلاحيات (اختياري ولكن ينصح به)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'غير مصرح لك' }, { status: 401 })

    if (!name || !subject_id) {
      return NextResponse.json({ error: 'الاسم والمادة مطلوبان' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('lessons')
      .insert({ name, unit: unit ?? 1, lesson_number: lesson_number ?? 1, subject_id })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH /api/lessons
export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  try {
    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'المعرف (ID) مطلوب' }, { status: 400 })

    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/lessons?id=X
export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const id = new URL(req.url).searchParams.get('id')
  
  if (!id) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })
  
  try {
    const { error } = await supabase.from('lessons').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true, message: 'تم الحذف بنجاح' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}