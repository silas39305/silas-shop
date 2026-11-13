'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function FormPaiement({ commandeId }: { commandeId: string }) {
  const router = useRouter()
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (envoi) return
    setErreur('')
    setEnvoi(true)
    const f = new FormData(e.currentTarget)
    try {
      const res = await fetch(`/api/commandes/${commandeId}/paiement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ momo_transaction_id: f.get('momo_transaction_id') }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErreur(json.error ?? 'Le paiement n’a pas pu être envoyé. Réessaie dans un instant.')
        return
      }
      router.refresh() // la page se recharge avec le nouveau statut
    } catch {
      setErreur('Connexion impossible. Vérifie ton réseau et réessaie.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form onSubmit={envoyer} className="mt-4 space-y-3" noValidate>
      <label className="block text-sm font-medium">
        Numéro du dépôt Wave
        <input
          name="momo_transaction_id"
          required
          minLength={6}
          maxLength={40}
          autoComplete="off"
          className="mt-1 w-full rounded-md border border-ink/25 bg-white px-3 py-2 text-base text-ink"
        />
      </label>
      {erreur && (
        <p className="text-sm font-medium text-red-700" role="alert">
          {erreur}
        </p>
      )}
      <button
        type="submit"
        disabled={envoi}
        className="w-full rounded-md bg-accent px-4 py-3 text-base font-bold text-white hover:bg-accent-dark disabled:opacity-60"
      >
        {envoi ? 'Envoi en cours…' : 'J’ai payé : envoyer le numéro'}
      </button>
    </form>
  )
}
