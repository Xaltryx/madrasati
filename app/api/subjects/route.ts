import { NextResponse } from 'next/server'
import { createClient } from '@/lib/db'

export async function GET() {
  const supabase = createClient()
  const { data, error } = await supabase.from('subjects').select('*').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
