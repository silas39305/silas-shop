import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fcfa } from '@/lib/format'
import { UUID } from '@/lib/validation'
import FormPaiement from '@/components/FormPaiement'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Suivi de commande',
  robots: { index: false, follow: false },
}

const NUMERO_WAVE = process.env.NEXT_PUBLIC_WAVE_NUMERO || '0594568098'
const NOM_WAVE = process.env.NEXT_PUBLIC_WAVE_NOM

const CANAL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  appel: 'appel',
  email: 'e-mail',
}

export default async function SuiviCommande({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID.test(id)) notFound()

  // Seuls les champs utiles au client : ni commission, ni infos vendeur.
  const { data: c } = await supabaseAdmin()
    .from('commandes')
    .select(
      `numero, quantite, total_produits, frais_livraison, total, ville, zone,
       notification_pref, statut, devis_expire_at, produits ( nom )`,
    )
    .eq('id', id)
    .maybeSingle()

  if (!c) notFound()

  const produit = (c.produits as unknown as { nom: string } | null)?.nom ?? 'Produit'
  const canal = CANAL[c.notification_pref]
  const devisExpire =
    c.statut === 'devis_envoye' &&
    !!c.devis_expire_at &&
    new Date(c.devis_expire_at).getTime() <= Date.now()

  let titre: string
  let message: React.ReactNode

  switch (c.statut) {
    case 'en_attente_devis':
      titre = 'Nous calculons ton expédition'
      message = `Nous chiffrons l’expédition vers ${c.ville} et te l’envoyons par ${canal}. Tu ne paies qu’après l’avoir reçu.`
      break
    case 'devis_envoye':
      titre = devisExpire ? 'Ce devis a expiré' : 'Ton devis est prêt'
      message = devisExpire
        ? 'Le devis n’est plus valable. Contacte-nous pour en obtenir un nouveau.'
        : 'Paie le total ci-dessous par Wave, puis indique le numéro de dépôt.'
      break
    case 'paiement_a_verifier':
      titre = 'Paiement en cours de vérification'
      message = `Nous vérifions ton paiement de ${fcfa(c.total)}. Dès qu’il est validé, nous te prévenons par ${canal}.`
      break
    case 'validee':
      titre = 'Commande validée'
      message = `Ton paiement est confirmé. Nous organisons la livraison et te prévenons par ${canal}.`
      break
    case 'livree':
      titre = 'Commande livrée'
      message = 'Ta commande a été livrée. Merci pour ta confiance !'
      break
    default:
      titre = 'Commande annulée'
      message = 'Cette commande a été annulée. Si tu as déjà payé, contacte-nous.'
  }

  return (
    <main className="mx-auto max-w-xl px-4 pt-10">
      <p className="text-sm text-ink/70">Commande n°{c.numero}</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{titre}</h1>
      <p className="mt-3 leading-relaxed text-ink/80">{message}</p>

      <section className="mt-6 rounded-lg border border-ink/15 bg-white p-4 text-sm">
        <p className="font-semibold">
          {produit} × {c.quantite}
        </p>
        <p className="mt-2">Produits : {fcfa(c.total_produits)}</p>
        <p>
          Livraison :{' '}
          {c.frais_livraison === null
            ? 'à chiffrer'
            : c.frais_livraison === 0
              ? 'gratuite'
              : fcfa(c.frais_livraison)}
        </p>
        {c.frais_livraison !== null && <p className="mt-1 font-bold">Total : {fcfa(c.total)}</p>}
        <p className="mt-2 text-ink/70">Livraison à : {c.ville}</p>
      </section>

      {c.statut === 'devis_envoye' && !devisExpire && (
        <section className="mt-6">
          <div className="rounded-lg bg-wave p-4">
            <p className="font-bold">Paie {fcfa(c.total)} par Wave</p>
            <p className="mt-1 text-sm">
              Envoie le montant au <strong>{NUMERO_WAVE}</strong>
              {NOM_WAVE ? <> (nom : {NOM_WAVE})</> : null}, puis recopie ci-dessous le numéro de
              dépôt Wave.
            </p>
          </div>
          <FormPaiement commandeId={id} />
        </section>
      )}
    </main>
  )
}
