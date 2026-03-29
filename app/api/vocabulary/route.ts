import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/db'

// GET /api/vocabulary?lesson_id=X أو ?search=term
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(req.url)
  const lessonId = searchParams.get('lesson_id')
  const search = searchParams.get('search')

  try {
    let query = supabase.from('vocabulary').select('*, lessons(name, subjects(name))')

    // إذا كان هناك بحث نصي
    if (search) {
      query = query.or(`word.ilike.%${search}%,meaning.ilike.%${search}%,synonym.ilike.%${search}%`)
    } 
    // إذا كان هناك تصفية حسب الدرس
    else if (lessonId && lessonId !== 'all') {
      query = query.eq('lesson_id', lessonId)
    }

    const { data, error } = await query.order('word')

    if (error) throw error
    return NextResponse.json(data || [])
  } catch (e: any) {
    console.error('Vocabulary GET Error:', e.message)
    return NextResponse.json([], { status: 200 }) // نرسل مصفوفة فارغة لتجنب كسر الواجهة
  }
}

// POST /api/vocabulary — إنشاء كلمة جديدة
export async function POST(req: NextRequest) {
  const supabase = createClient()
  try {
    const body = await req.json()
    const { word, synonym = '', meaning = '', antonym = '', plural = '', singular = '', lesson_id } = body

    if (!word || !lesson_id) {
      return NextResponse.json({ error: 'الكلمة ومعرف الدرس مطلوبان' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('vocabulary')
      .insert({ word, synonym, meaning, antonym, plural, singular, lesson_id })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// PATCH /api/vocabulary — تحديث كلمة
export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  try {
    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'المعرف (ID) مطلوب' }, { status: 400 })

    const allowed = ['word', 'synonym', 'meaning', 'antonym', 'plural', 'singular', 'lesson_id']
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    )

    const { data, error } = await supabase
      .from('vocabulary')
      .update(filtered)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/vocabulary?id=X — حذف كلمة
export async function DELETE(req: NextRequest) {
  const supabase = createClient()
  const id = new URL(req.url).searchParams.get('id')
  
  if (!id) return NextResponse.json({ error: 'المعرف مطلوب' }, { status: 400 })

  try {
    const { error } = await supabase.from('vocabulary').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true, message: 'تم الحذف بنجاح' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}