import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fcfa } from '@/lib/format'
import { notification } from '@/lib/messages'
import {
  annuler,
  confirmerLivraison,
  deconnexion,
  envoyerDevis,
  validerPaiement,
} from './actions'

export const dynamic = 'force-dynamic'

type Commande = {
  id: string
  numero: number
  quantite: number
  prix_unitaire: number
  total_produits: number
  frais_livraison: number | null
  total: number
  commission: number
  client_nom: string
  client_tel: string
  client_email: string | null
  notification_pref: 'whatsapp' | 'sms' | 'appel' | 'email'
  adresse: string
  ville: string
  zone: 'abidjan' | 'interieur'
  momo_transaction_id: string | null
  statut: string
  devis_expire_at: string | null
  created_at: string
  produits: { nom: string; vendeur_nom: string | null; vendeur_tel: string | null } | null
}

const STATUTS: Record<string, { libelle: string; couleur: string }> = {
  en_attente_devis: { libelle: 'Devis à faire', couleur: 'bg-orange-100 text-orange-900' },
  devis_envoye: { libelle: 'Devis envoyé', couleur: 'bg-blue-100 text-blue-900' },
  paiement_a_verifier: { libelle: 'Paiement à vérifier', couleur: 'bg-mtn text-ink' },
  validee: { libelle: 'Validée', couleur: 'bg-green-100 text-green-900' },
  livree: { libelle: 'Livrée', couleur: 'bg-ink/10 text-ink' },
  annulee: { libelle: 'Annulée', couleur: 'bg-red-100 text-red-900' },
}

const ONGLETS: { cle: string; libelle: string; statuts: string[] | null }[] = [
  { cle: 'a_traiter', libelle: 'À traiter', statuts: ['en_attente_devis', 'paiement_a_verifier'] },
  { cle: 'devis', libelle: 'Devis envoyés', statuts: ['devis_envoye'] },
  { cle: 'validee', libelle: 'À livrer', statuts: ['validee'] },
  { cle: 'livree', libelle: 'Livrées', statuts: ['livree'] },
  { cle: 'annulee', libelle: 'Annulées', statuts: ['annulee'] },
  { cle: 'toutes', libelle: 'Toutes', statuts: null },
]

const CANAL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  appel: 'Appel',
  email: 'E-mail',
}

const date = (iso: string) =>
  new Date(iso).toLocaleString('fr-FR', {
    timeZone: 'Africa/Abidjan',
    dateStyle: 'short',
    timeStyle: 'short',
  })

const bouton = 'rounded-md px-4 py-2 text-sm font-bold'

export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<{ onglet?: string }>
}) {
  const { onglet: demande } = await searchParams
  const onglet = ONGLETS.find((o) => o.cle === demande) ?? ONGLETS[0]

  const { data, error } = await supabaseAdmin()
    .from('commandes')
    .select(
      `id, numero, quantite, prix_unitaire, total_produits, frais_livraison, total, commission,
       client_nom, client_tel, client_email, notification_pref, adresse, ville, zone,
       momo_transaction_id, statut, devis_expire_at, created_at,
       produits ( nom, vendeur_nom, vendeur_tel )`,
    )
    .order('created_at', { ascending: false })
    .limit(300)

  const toutes = (data ?? []) as unknown as Commande[]
  const compte = (s: string[] | null) =>
    s ? toutes.filter((c) => s.includes(c.statut)).length : toutes.length
  const commandes = onglet.statuts
    ? toutes.filter((c) => onglet.statuts!.includes(c.statut))
    : toutes

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Commandes</h1>
        <form action={deconnexion}>
          <button className="text-sm underline">Se déconnecter</button>
        </form>
      </div>

      <nav className="mt-5 flex flex-wrap gap-2" aria-label="Filtrer par statut">
        {ONGLETS.map((o) => (
          <Link
            key={o.cle}
            href={`/admin?onglet=${o.cle}`}
            className={`rounded-full border px-3 py-1 text-sm ${
              o.cle === onglet.cle
                ? 'border-ink bg-ink text-white'
                : 'border-ink/25 bg-white hover:border-ink'
            }`}
          >
            {o.libelle} ({compte(o.statuts)})
          </Link>
        ))}
      </nav>

      {error && (
        <p className="mt-6 text-red-700" role="alert">
          Impossible de charger les commandes : {error.message}
        </p>
      )}

      {!error && commandes.length === 0 && (
        <p className="mt-8 text-ink/70">Rien dans cette liste.</p>
      )}

      <ul className="mt-6 space-y-4">
        {commandes.map((c) => {
          const st = STATUTS[c.statut] ?? { libelle: c.statut, couleur: 'bg-ink/10' }
          const notif = notification({
            ...c,
            produit: c.produits?.nom ?? 'produit',
          })
          const finale = c.statut === 'livree' || c.statut === 'annulee'

          return (
            <li key={c.id} className="rounded-lg border border-ink/15 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">
                  N°{c.numero} · {c.produits?.nom ?? 'Produit supprimé'} × {c.quantite}
                </p>
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${st.couleur}`}>
                  {st.libelle}
                </span>
              </div>
              <p className="text-xs text-ink/60">{date(c.created_at)}</p>

              <div className="mt-3 grid gap-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="font-semibold">{c.client_nom}</p>
                  <p>{c.client_tel}</p>
                  <p className="text-ink/70">
                    {c.ville} · {c.zone === 'abidjan' ? 'Abidjan' : 'Intérieur'}
                  </p>
                  <p className="text-ink/70">{c.adresse}</p>
                  <p className="text-ink/70">Prévenir par : {CANAL[c.notification_pref]}</p>
                </div>
                <div>
                  <p>Produits : {fcfa(c.total_produits)}</p>
                  <p>
                    Livraison :{' '}
                    {c.frais_livraison === null
                      ? 'à chiffrer'
                      : c.frais_livraison === 0
                        ? 'gratuite'
                        : fcfa(c.frais_livraison)}
                  </p>
                  <p className="font-semibold">
                    Total : {c.frais_livraison === null ? '—' : fcfa(c.total)}
                  </p>
                  <p className="text-ink/70">Ta commission : {fcfa(c.commission)}</p>
                  <p className="text-ink/70">
                    À reverser au vendeur : {fcfa(c.total_produits - c.commission)}
                    {c.produits?.vendeur_nom ? ` (${c.produits.vendeur_nom}` : ''}
                    {c.produits?.vendeur_tel ? ` ${c.produits.vendeur_tel}` : ''}
                    {c.produits?.vendeur_nom ? ')' : ''}
                  </p>
                </div>
                <div>
                  {c.momo_transaction_id ? (
                    <>
                      <p className="text-ink/70">N° de transaction</p>
                      <p className="break-all font-mono text-base font-bold">
                        {c.momo_transaction_id}
                      </p>
                    </>
                  ) : (
                    <p className="text-ink/70">Pas encore de paiement déclaré</p>
                  )}
                  {c.statut === 'devis_envoye' && c.devis_expire_at && (
                    <p className="mt-1 text-ink/70">Devis valable jusqu’au {date(c.devis_expire_at)}</p>
                  )}
                </div>
              </div>

              {/* ----- Actions ----- */}
              <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-ink/10 pt-4">
                {(c.statut === 'en_attente_devis' || c.statut === 'devis_envoye') && (
                  <form action={envoyerDevis} className="flex items-end gap-2">
                    <input type="hidden" name="id" value={c.id} />
                    <label className="text-sm font-medium">
                      Frais d’expédition (FCFA)
                      <input
                        type="number"
                        name="frais"
                        required
                        min={0}
                        max={1000000}
                        step={100}
                        defaultValue={c.frais_livraison ?? undefined}
                        className="mt-1 block w-36 rounded-md border border-ink/25 px-3 py-2"
                      />
                    </label>
                    <button className={`${bouton} bg-accent text-white hover:bg-accent-dark`}>
                      {c.statut === 'devis_envoye' ? 'Modifier le devis' : 'Enregistrer le devis'}
                    </button>
                  </form>
                )}

                {c.statut === 'paiement_a_verifier' && (
                  <form action={validerPaiement}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className={`${bouton} bg-green-700 text-white hover:bg-green-800`}>
                      J’ai reçu {fcfa(c.total)} : valider
                    </button>
                  </form>
                )}

                {c.statut === 'validee' && (
                  <form action={confirmerLivraison}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className={`${bouton} bg-accent text-white hover:bg-accent-dark`}>
                      Confirmer la livraison
                    </button>
                  </form>
                )}

                {notif && (
                  <a
                    href={notif.href}
                    {...(notif.externe ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className={`${bouton} border border-ink bg-white hover:bg-ink/5`}
                  >
                    {notif.libelle}
                  </a>
                )}

                {!finale && (
                  <details className="ml-auto text-sm">
                    <summary className="cursor-pointer text-red-700">Annuler</summary>
                    <form action={annuler} className="mt-2">
                      <input type="hidden" name="id" value={c.id} />
                      <button className={`${bouton} bg-red-700 text-white`}>
                        Oui, annuler la commande n°{c.numero}
                      </button>
                    </form>
                  </details>
                )}
              </div>

              {notif && (
                <details className="mt-3 text-sm" open={c.notification_pref === 'appel'}>
                  <summary className="cursor-pointer text-ink/70">
                    {c.notification_pref === 'appel' ? 'Message à dire au téléphone' : 'Voir le message'}
                  </summary>
                  <p className="mt-2 rounded-md bg-paper p-3 leading-relaxed">{notif.message}</p>
                </details>
              )}
            </li>
          )
        })}
      </ul>
    </main>
  )
}
