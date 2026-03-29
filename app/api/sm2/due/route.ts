import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]

  try {
    const { data: cards, error: cardsError } = await supabase
      .from('sm2_cards')
      .select('vocabulary_id')
      .eq('user_id', user.id)
      .lte('next_review', today)

    if (cardsError) throw cardsError

    const dueIds = (cards ?? []).map(c => c.vocabulary_id)

    if (dueIds.length === 0) return NextResponse.json([])

    const { data: vocab, error: vocabError } = await supabase
      .from('vocabulary')
      .select('*')
      .in('id', dueIds)

    if (vocabError) throw vocabError

    return NextResponse.json(vocab ?? [])
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}