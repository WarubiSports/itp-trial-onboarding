import { CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { getDocumentsForPhase, type DocumentPhase } from '@/lib/documents'

export const DocumentStatus = ({
  signedDocs,
  playerId,
  phase = 'trial',
  trialStartDate,
}: {
  signedDocs: { document_type: string; signed_at: string }[]
  playerId: string
  /** Which phase's document set to require. Defaults to 'trial'. */
  phase?: DocumentPhase
  /** Used to respect any doc's effectiveFrom cutoff. */
  trialStartDate?: string | null
}) => {
  const requiredDocs = getDocumentsForPhase(phase, trialStartDate)
  const signedSet = new Set(signedDocs.map((d) => d.document_type))
  const signedCount = requiredDocs.filter((d) => signedSet.has(d.type)).length
  const total = requiredDocs.length
  const allSigned = signedCount === total

  return (
    <section className="px-4 pb-6">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[var(--color-text)]">
            Documents
          </h3>
          <span className={`text-xs font-semibold ${allSigned ? 'text-green-500' : 'text-amber-500'}`}>
            {signedCount}/{total} signed
          </span>
        </div>

        <div className="space-y-2">
          {requiredDocs.map((doc) => {
            const signed = signedSet.has(doc.type)
            return (
              <div key={doc.type} className="flex items-center gap-2">
                {signed ? (
                  <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                ) : (
                  <AlertCircle size={16} className="text-amber-400 shrink-0" />
                )}
                <span className={`text-sm ${signed ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text)]'}`}>
                  {doc.title}
                </span>
              </div>
            )
          })}
        </div>

        {!allSigned && (
          <Link
            href={`/${playerId}/onboarding`}
            className="mt-3 block text-center text-sm font-semibold text-[#ED1C24] hover:underline"
          >
            Complete signing →
          </Link>
        )}
      </div>
    </section>
  )
}
