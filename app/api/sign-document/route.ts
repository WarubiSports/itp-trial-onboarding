import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const signature = formData.get('signature') as File
  const playerId = formData.get('player_id') as string
  const documentType = formData.get('document_type') as string
  const documentTitle = formData.get('document_title') as string
  const signerName = formData.get('signer_name') as string
  const parentSignature = formData.get('parent_signature') as File | null
  const parentSignerName = formData.get('parent_signer_name') as string | null

  // Upload player signature
  const path = `${playerId}/${documentType}_${Date.now()}.png`
  const buffer = Buffer.from(await signature.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('signatures')
    .upload(path, buffer, { contentType: 'image/png' })

  if (uploadError) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  // Upload parent signature if provided
  let parentPath: string | null = null
  if (parentSignature && parentSignerName) {
    parentPath = `${playerId}/${documentType}_parent_${Date.now()}.png`
    const parentBuffer = Buffer.from(await parentSignature.arrayBuffer())

    const { error: parentUploadError } = await supabase.storage
      .from('signatures')
      .upload(parentPath, parentBuffer, { contentType: 'image/png' })

    if (parentUploadError) {
      return NextResponse.json({ error: 'Parent signature upload failed' }, { status: 500 })
    }
  }

  // Save document record
  const record: Record<string, unknown> = {
    player_id: playerId,
    document_type: documentType,
    document_title: documentTitle,
    signature_image_path: path,
    signed_at: new Date().toISOString(),
    signer_name: signerName,
    ip_address: request.headers.get('x-forwarded-for') || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
  }

  if (parentPath && parentSignerName) {
    record.parent_signer_name = parentSignerName
    record.parent_signature_image_path = parentPath
    record.parent_signed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('player_documents')
    .upsert(record, { onConflict: 'player_id,document_type' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
