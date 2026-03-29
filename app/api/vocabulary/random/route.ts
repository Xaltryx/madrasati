import { NextResponse } from 'next/server'
import { createClient } from '@/lib/db'

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const lessonId = searchParams.get('lesson_id')
  const limit = parseInt(searchParams.get('limit') || '10')

  let query = supabase.from('vocabulary').select('*')

  if (lessonId && lessonId !== 'all') {
    query = query.eq('lesson_id', lessonId)
  }

  const { data, error } = await query.limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ترتيب عشوائي بسيط للكلمات
  const shuffled = data?.sort(() => 0.5 - Math.random())

  return NextResponse.json(shuffled)
}