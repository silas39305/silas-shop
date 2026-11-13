'use client'

import { useState } from 'react'
import { fcfa } from '@/lib/format'

type Zone = 'abidjan' | 'interieur'
type Canal = 'whatsapp' | 'sms' | 'appel' | 'email'

const CANAUX: { valeur: Canal; libelle: string }[] = [
  { valeur: 'whatsapp', libelle: 'WhatsApp' },
  { valeur: 'sms', libelle: 'SMS' },
  { valeur: 'appel', libelle: 'Appel' },
  { valeur: 'email', libelle: 'E-mail' },
]

const NUMERO_WAVE = process.env.NEXT_PUBLIC_WAVE_NUMERO || '0594568098'
const NOM_WAVE = process.env.NEXT_PUBLIC_WAVE_NOM

type Confirmation = { numero: number; zone: Zone; total: number | null; canal: Canal }

export default function FormCommande({
  produitId,
  prixUnitaire,
}: {
  produitId: string
  prixUnitaire: number
}) {
  const [quantite, setQuantite] = useState(1)
  const [zone, setZone] = useState<Zone>('abidjan')
  const [canal, setCanal] = useState<Canal>('whatsapp')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)

  const totalProduits = prixUnitaire * quantite
  const abidjan = zone === 'abidjan'

  async function envoyer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (envoi) return
    setErreur('')
    setEnvoi(true)

    const f = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/commandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          produit_id: produitId,
          quantite,
          zone,
          notification_pref: canal,
          client_nom: f.get('client_nom'),
          client_tel: f.get('client_tel'),
          client_email: f.get('client_email') ?? '',
          ville: f.get('ville'),
          adresse: f.get('adresse'),
          momo_transaction_id: f.get('momo_transaction_id') ?? '',
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErreur(json.error ?? 'La commande n’a pas pu être envoyée. Réessaie dans un instant.')
        return
      }
      setConfirmation({ numero: json.numero, zone, total: json.total, canal })
    } catch {
      setErreur('Connexion impossible. Vérifie ton réseau et réessaie.')
    } finally {
      setEnvoi(false)
    }
  }

  if (confirmation) {
    const libelleCanal = CANAUX.find((c) => c.valeur === confirmation.canal)?.libelle
    return (
      <div className="mt-8 rounded-lg border border-ink/15 bg-white p-5" role="status">
        <h2 className="text-xl font-bold">Commande n°{confirmation.numero} reçue</h2>
        {confirmation.zone === 'abidjan' ? (
          <p className="mt-2 leading-relaxed text-ink/80">
            Nous vérifions ton paiement de {fcfa(confirmation.total ?? 0)}. Dès qu’il est
            validé, nous te prévenons par {libelleCanal}. La livraison est gratuite.
          </p>
        ) : (
          <p className="mt-2 leading-relaxed text-ink/80">
            Nous calculons le prix de l’expédition vers ta ville et te l’envoyons par{' '}
            {libelleCanal}. Tu ne paies qu’après l’avoir reçu.
          </p>
        )}
        <p className="mt-3 text-sm text-ink/70">
          Garde ce numéro de commande : il permet de retrouver ta commande.
        </p>
      </div>
    )
  }

  const champ =
    'mt-1 w-full rounded-md border border-ink/25 bg-white px-3 py-2 text-base text-ink'
  const libelle = 'block text-sm font-medium'
  const choix =
    'flex cursor-pointer items-center gap-2 rounded-md border border-ink/25 bg-white px-3 py-2 text-sm'

  return (
    <form onSubmit={envoyer} className="mt-8 space-y-5" noValidate>
      <h2 className="text-xl font-bold">Commander</h2>

      <label className={libelle}>
        Quantité
        <select
          value={quantite}
          onChange={(e) => setQuantite(Number(e.target.value))}
          className={champ}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <label className={libelle}>
        Ton nom
        <input name="client_nom" required maxLength={80} autoComplete="name" className={champ} />
      </label>

      <label className={libelle}>
        Numéro de téléphone (10 chiffres)
        <input
          name="client_tel"
          required
          inputMode="tel"
          autoComplete="tel"
          placeholder="07 00 00 00 00"
          className={champ}
        />
      </label>

      <fieldset>
        <legend className={libelle}>Où veux-tu être livré ?</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          <label className={choix}>
            <input
              type="radio"
              name="zone"
              checked={abidjan}
              onChange={() => setZone('abidjan')}
              className="accent-accent"
            />
            Abidjan (livraison gratuite)
          </label>
          <label className={choix}>
            <input
              type="radio"
              name="zone"
              checked={!abidjan}
              onChange={() => setZone('interieur')}
              className="accent-accent"
            />
            Intérieur du pays
          </label>
        </div>
      </fieldset>

      <label className={libelle}>
        {abidjan ? 'Commune ou quartier' : 'Ville'}
        <input name="ville" required maxLength={80} className={champ} />
      </label>

      <label className={libelle}>
        Adresse ou repère pour la livraison
        <textarea name="adresse" required rows={2} maxLength={300} className={champ} />
      </label>

      <fieldset>
        <legend className={libelle}>Comment veux-tu être prévenu ?</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          {CANAUX.map((c) => (
            <label key={c.valeur} className={choix}>
              <input
                type="radio"
                name="canal"
                checked={canal === c.valeur}
                onChange={() => setCanal(c.valeur)}
                className="accent-accent"
              />
              {c.libelle}
            </label>
          ))}
        </div>
      </fieldset>

      {canal === 'email' && (
        <label className={libelle}>
          Ton adresse e-mail
          <input
            name="client_email"
            type="email"
            required
            maxLength={120}
            autoComplete="email"
            className={champ}
          />
        </label>
      )}

      {abidjan ? (
        <>
          <div className="rounded-lg bg-mtn p-4">
            <p className="font-bold">Paie {fcfa(totalProduits)} par MTN Money</p>
            {NUMERO_MOMO ? (
              <p className="mt-1 text-sm">
                Envoie le montant au <strong>{NUMERO_MOMO}</strong>
                {NOM_MOMO ? <> (nom : {NOM_MOMO})</> : null}, puis recopie ci-dessous le
                numéro de transaction reçu par SMS. La livraison est gratuite.
              </p>
            ) : (
              <p className="mt-1 text-sm font-medium text-red-800">
                Le numéro de paiement n’est pas encore configuré.
              </p>
            )}
          </div>

          <label className={libelle}>
            Numéro de transaction MTN Money
            <input
              name="momo_transaction_id"
              required
              minLength={6}
              maxLength={40}
              autoComplete="off"
              className={champ}
            />
          </label>
        </>
      ) : (
        <div className="rounded-lg border border-ink/15 bg-white p-4 text-sm leading-relaxed">
          <p className="font-bold">Pas de paiement pour l’instant</p>
          <p className="mt-1 text-ink/80">
            Produits : {fcfa(totalProduits)}. Nous calculons l’expédition vers ta ville et
            te l’envoyons. Tu paies ensuite le total.
          </p>
        </div>
      )}

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
        {envoi
          ? 'Envoi en cours…'
          : abidjan
            ? `Commander (${fcfa(totalProduits)})`
            : 'Demander le prix de l’expédition'}
      </button>
    </form>
  )
}
