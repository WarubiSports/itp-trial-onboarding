'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { SignatureModal } from './SignatureModal'

interface RequiredDoc {
  type: string
  title: string
}

interface SignedDoc {
  document_type: string
  signed_at: string
  signer_name: string
}

export const DocumentsList = ({
  playerId,
  requiredDocs,
  signedDocs,
  isMinor = false,
  onDocSigned,
}: {
  playerId: string
  requiredDocs: RequiredDoc[]
  signedDocs: SignedDoc[]
  isMinor?: boolean
  onDocSigned?: () => void
}) => {
  const router = useRouter()
  const [activeDoc, setActiveDoc] = useState<RequiredDoc | null>(null)

  const signedMap = new Map(signedDocs.map((d) => [d.document_type, d]))
  const signedCount = requiredDocs.filter((d) => signedMap.has(d.type)).length
  const total = requiredDocs.length
  const allSigned = signedCount === total

  const handleSigned = () => {
    setActiveDoc(null)
    if (onDocSigned) {
      onDocSigned()
    } else {
      router.refresh()
    }
  }

  return (
    <>
      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-sm mb-1.5">
          <span className="font-medium text-[var(--color-text-secondary)]">
            {signedCount} of {total} documents signed
          </span>
          {allSigned && (
            <span className="text-green-400 font-semibold text-xs">All complete</span>
          )}
        </div>
        <div className="w-full h-2 bg-[var(--color-surface-elevated)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(signedCount / total) * 100}%`,
              background: allSigned
                ? '#22C55E'
                : `linear-gradient(to right, var(--color-brand), #22C55E)`,
            }}
          />
        </div>
      </div>

      {/* Document cards */}
      <div className="space-y-3">
        {requiredDocs.map((doc) => {
          const signed = signedMap.get(doc.type)
          return (
            <div
              key={doc.type}
              className="relative overflow-hidden bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 flex items-center justify-between"
            >
              {/* Left accent stripe */}
              <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${signed ? 'bg-green-500' : 'bg-amber-500'}`} />

              <div className="flex items-center gap-3 min-w-0 pl-1.5">
                {signed ? (
                  <CheckCircle2 size={22} className="text-green-400 shrink-0" style={{ filter: 'drop-shadow(0 0 4px rgba(34,197,94,0.3))' }} />
                ) : (
                  <AlertCircle size={22} className="text-amber-400 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-sm text-[var(--color-text)] truncate">{doc.title}</p>
                  {signed ? (
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Signed on{' '}
                      {new Date(signed.signed_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  ) : (
                    <p className="text-xs text-amber-400">Not signed</p>
                  )}
                </div>
              </div>
              {!signed && (
                <button
                  onClick={() => setActiveDoc(doc)}
                  className="shrink-0 ml-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-brand)] text-white hover:shadow-[0_0_12px_var(--color-brand-glow)] transition-shadow"
                >
                  View &amp; Sign
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Signature modal */}
      {activeDoc && (
        <SignatureModal
          playerId={playerId}
          documentType={activeDoc.type}
          documentTitle={activeDoc.title}
          isMinor={isMinor}
          onClose={() => setActiveDoc(null)}
          onSigned={handleSigned}
        />
      )}
    </>
  )
}
