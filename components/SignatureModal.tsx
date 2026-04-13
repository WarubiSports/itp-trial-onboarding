'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { DOCUMENT_CONTENT } from '@/lib/documents'

function useSignatureCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const [hasSignature, setHasSignature] = useState(false)

  const init = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    isDrawing.current = true
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => { isDrawing.current = false }

  const clear = useCallback(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }, [])

  const toBlob = (): Promise<Blob> => {
    const canvas = canvasRef.current!
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/png'))
  }

  return { canvasRef, hasSignature, init, startDrawing, draw, stopDrawing, clear, toBlob }
}

export const SignatureModal = ({
  playerId,
  documentType,
  documentTitle,
  isMinor = false,
  onClose,
  onSigned,
}: {
  playerId: string
  documentType: string
  documentTitle: string
  isMinor?: boolean
  onClose: () => void
  onSigned: () => void
}) => {
  const playerSig = useSignatureCanvas()
  const parentSig = useSignatureCanvas()

  const [agreed, setAgreed] = useState(false)
  const [signerName, setSignerName] = useState('')
  const [parentName, setParentName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const content = DOCUMENT_CONTENT[documentType]

  const canSubmit = agreed
    && signerName.trim().length > 0
    && playerSig.hasSignature
    && (!isMinor || (parentName.trim().length > 0 && parentSig.hasSignature))
    && !submitting

  useEffect(() => {
    playerSig.init()
    if (isMinor) parentSig.init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)

    try {
      const playerBlob = await playerSig.toBlob()
      const formData = new FormData()
      formData.append('signature', playerBlob, 'signature.png')
      formData.append('player_id', playerId)
      formData.append('document_type', documentType)
      formData.append('document_title', documentTitle)
      formData.append('signer_name', signerName.trim())

      if (isMinor) {
        const parentBlob = await parentSig.toBlob()
        formData.append('parent_signature', parentBlob, 'parent_signature.png')
        formData.append('parent_signer_name', parentName.trim())
      }

      const res = await fetch('/api/sign-document', { method: 'POST', body: formData })
      if (res.ok) {
        onSigned()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to sign document. Please try again.')
        setSubmitting(false)
      }
    } catch {
      alert('Failed to sign document. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--color-bg)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
        <h2 className="text-base font-bold text-[var(--color-text)] font-[family-name:var(--font-outfit)] truncate pr-2">{documentTitle}</h2>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]"
          aria-label="Close"
        >
          <X size={22} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {content?.sections.map((section, i) => (
          <div key={i} className="mb-4">
            <h3 className="font-semibold text-sm text-[var(--color-text)] mb-1">{section.heading}</h3>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{section.body}</p>
          </div>
        ))}

        <hr className="my-5 border-[var(--color-border)]" />

        {/* Agreement */}
        <div className="space-y-4 pb-4">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-brand)]"
            />
            <span className="text-sm text-[var(--color-text-secondary)]">
              I have read and agree to the terms above
            </span>
          </label>

          {/* Player signature */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
              Player&apos;s full name
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Player&apos;s signature
              </label>
              {playerSig.hasSignature && (
                <button onClick={playerSig.clear} className="text-xs text-[var(--color-brand)] font-medium">Clear</button>
              )}
            </div>
            <canvas
              ref={playerSig.canvasRef}
              className="w-full border border-[var(--color-border)] rounded-xl bg-white cursor-crosshair"
              style={{ height: 150, touchAction: 'none' }}
              onMouseDown={playerSig.startDrawing}
              onMouseMove={playerSig.draw}
              onMouseUp={playerSig.stopDrawing}
              onMouseLeave={playerSig.stopDrawing}
              onTouchStart={playerSig.startDrawing}
              onTouchMove={playerSig.draw}
              onTouchEnd={playerSig.stopDrawing}
            />
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Draw your signature above using your finger or mouse
            </p>
          </div>

          {/* Parent/Guardian signature (U18 only) */}
          {isMinor && (
            <>
              <hr className="my-4 border-[var(--color-border)]" />
              <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-3 mb-2">
                <p className="text-sm font-medium text-amber-300">
                  Parent / Guardian Signature Required
                </p>
                <p className="text-xs text-amber-400/80 mt-0.5">
                  As the player is under 18, a parent or legal guardian must also sign this document.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Parent / Guardian full name
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Enter parent or guardian's full name"
                  className="w-full px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                    Parent / Guardian signature
                  </label>
                  {parentSig.hasSignature && (
                    <button onClick={parentSig.clear} className="text-xs text-[var(--color-brand)] font-medium">Clear</button>
                  )}
                </div>
                <canvas
                  ref={parentSig.canvasRef}
                  className="w-full border border-[var(--color-border)] rounded-xl bg-white cursor-crosshair"
                  style={{ height: 150, touchAction: 'none' }}
                  onMouseDown={parentSig.startDrawing}
                  onMouseMove={parentSig.draw}
                  onMouseUp={parentSig.stopDrawing}
                  onMouseLeave={parentSig.stopDrawing}
                  onTouchStart={parentSig.startDrawing}
                  onTouchMove={parentSig.draw}
                  onTouchEnd={parentSig.stopDrawing}
                />
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Parent or guardian draws their signature above
                </p>
              </div>
            </>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-[var(--color-brand)] transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_20px_var(--color-brand-glow)] active:bg-[var(--color-brand-dark)]"
          >
            {submitting ? 'Signing...' : 'Sign Document'}
          </button>
        </div>
      </div>
    </div>
  )
}
