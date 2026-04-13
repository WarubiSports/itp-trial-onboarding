import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const playerId = request.nextUrl.searchParams.get('player_id')

  if (!playerId) {
    return NextResponse.json({ error: 'player_id required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('player_documents')
    .select('document_type, document_title, signed_at, signer_name')
    .eq('player_id', playerId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
