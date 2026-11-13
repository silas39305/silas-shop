import Link from 'next/link'
import AdminNav from '@/components/AdminNav'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fcfa } from '@/lib/format'

export const dynamic = 'force-dynamic'

type Ligne = {
  quantite: number
  total_produits: number
  frais_livraison: number | null
  total: number
  commission: number
  zone: 'abidjan' | 'interieur'
  statut: string
  created_at: string
  produits: { nom: string; vendeur_nom: string | null } | null
}

const STATUTS: { cle: string; libelle: string; couleur: string; onglet: string }[] = [
  { cle: 'en_attente_devis', libelle: 'Devis à faire', couleur: 'bg-orange-100 text-orange-900', onglet: 'a_traiter' },
  { cle: 'paiement_a_verifier', libelle: 'Paiement à vérifier', couleur: 'bg-mtn text-ink', onglet: 'a_traiter' },
  { cle: 'devis_envoye', libelle: 'Devis envoyés', couleur: 'bg-blue-100 text-blue-900', onglet: 'devis' },
  { cle: 'validee', libelle: 'À livrer', couleur: 'bg-green-100 text-green-900', onglet: 'validee' },
  { cle: 'livree', libelle: 'Livrées', couleur: 'bg-ink/10 text-ink', onglet: 'livree' },
  { cle: 'annulee', libelle: 'Annulées', couleur: 'bg-red-100 text-red-900', onglet: 'annulee' },
]

// Une commande compte comme « encaissée » dès que tu as validé le paiement.
const ENCAISSE = ['validee', 'livree']

const jourDe = (d: Date) => d.toISOString().slice(0, 10) // Abidjan = UTC
const somme = (l: Ligne[], f: (c: Ligne) => number) => l.reduce((t, c) => t + f(c), 0)

function Carte({ titre, valeur, detail }: { titre: string; valeur: string; detail?: string }) {
  return (
    <div className="rounded-lg border border-ink/15 bg-white p-4">
      <p className="text-sm text-ink/70">{titre}</p>
      <p className="mt-1 text-2xl font-extrabold">{valeur}</p>
      {detail && <p className="mt-1 text-xs text-ink/60">{detail}</p>}
    </div>
  )
}

export default async function Tableau() {
  const { data, error } = await supabaseAdmin()
    .from('commandes')
    .select(
      `quantite, total_produits, frais_livraison, total, commission, zone, statut, created_at,
       produits ( nom, vendeur_nom )`,
    )
    .order('created_at', { ascending: false })
    .limit(5000)

  const toutes = (data ?? []) as unknown as Ligne[]
  const encaissees = toutes.filter((c) => ENCAISSE.includes(c.statut))

  const maintenant = new Date()
  const depuis = (jours: number) => {
    const d = new Date(maintenant)
    d.setUTCDate(d.getUTCDate() - jours)
    return d.toISOString()
  }
  const sur30 = encaissees.filter((c) => c.created_at >= depuis(30))
  const sur7 = encaissees.filter((c) => c.created_at >= depuis(7))

  // Argent à reverser aux vendeurs pour les commandes déjà encaissées
  const aReverser = somme(encaissees, (c) => c.total_produits - c.commission)

  // Ventes des 14 derniers jours (commandes encaissées)
  const jours: { jour: string; montant: number; nb: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(maintenant)
    d.setUTCDate(d.getUTCDate() - i)
    jours.push({ jour: jourDe(d), montant: 0, nb: 0 })
  }
  for (const c of encaissees) {
    const j = jours.find((x) => x.jour === c.created_at.slice(0, 10))
    if (j) {
      j.montant += c.total
      j.nb += 1
    }
  }
  const maxJour = Math.max(1, ...jours.map((j) => j.montant))

  // Meilleurs produits
  const parProduit = new Map<string, { qte: number; ca: number; marge: number }>()
  for (const c of encaissees) {
    const nom = c.produits?.nom ?? 'Produit supprimé'
    const p = parProduit.get(nom) ?? { qte: 0, ca: 0, marge: 0 }
    p.qte += c.quantite
    p.ca += c.total_produits
    p.marge += c.commission
    parProduit.set(nom, p)
  }
  const top = [...parProduit.entries()].sort((a, b) => b[1].marge - a[1].marge).slice(0, 5)

  const abidjan = encaissees.filter((c) => c.zone === 'abidjan').length
  const interieur = encaissees.length - abidjan

  return (
    <main>
      <AdminNav actif="tableau" />
      <h1 className="text-2xl font-bold">Tableau de bord</h1>

      {error && (
        <p className="mt-4 text-red-700" role="alert">
          Impossible de charger les données : {error.message}
        </p>
      )}

      {/* À faire maintenant */}
      <section className="mt-6" aria-labelledby="t-statuts">
        <h2 id="t-statuts" className="text-lg font-bold">
          Où en sont les commandes
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STATUTS.map((s) => (
            <Link
              key={s.cle}
              href={`/admin?onglet=${s.onglet}`}
              className="rounded-lg border border-ink/15 bg-white p-3 hover:border-ink"
            >
              <p className="text-3xl font-extrabold">{toutes.filter((c) => c.statut === s.cle).length}</p>
              <p className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-bold ${s.couleur}`}>
                {s.libelle}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Argent */}
      <section className="mt-8" aria-labelledby="t-argent">
        <h2 id="t-argent" className="text-lg font-bold">
          Argent (paiements validés)
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Carte
            titre="Encaissé au total"
            valeur={fcfa(somme(encaissees, (c) => c.total))}
            detail={`${encaissees.length} commande${encaissees.length > 1 ? 's' : ''}`}
          />
          <Carte
            titre="Ta marge totale"
            valeur={fcfa(somme(encaissees, (c) => c.commission))}
            detail="Commission sur les produits"
          />
          <Carte titre="À reverser aux vendeurs" valeur={fcfa(aReverser)} detail="Produits moins ta marge" />
          <Carte
            titre="Frais de livraison encaissés"
            valeur={fcfa(somme(encaissees, (c) => c.frais_livraison ?? 0))}
            detail="Intérieur du pays"
          />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Carte
            titre="7 derniers jours"
            valeur={fcfa(somme(sur7, (c) => c.total))}
            detail={`Marge ${fcfa(somme(sur7, (c) => c.commission))} · ${sur7.length} commande${sur7.length > 1 ? 's' : ''}`}
          />
          <Carte
            titre="30 derniers jours"
            valeur={fcfa(somme(sur30, (c) => c.total))}
            detail={`Marge ${fcfa(somme(sur30, (c) => c.commission))} · ${sur30.length} commande${sur30.length > 1 ? 's' : ''}`}
          />
        </div>
      </section>

      {/* Courbe 14 jours */}
      <section className="mt-8" aria-labelledby="t-jours">
        <h2 id="t-jours" className="text-lg font-bold">
          Ventes des 14 derniers jours
        </h2>
        <div className="mt-3 rounded-lg border border-ink/15 bg-white p-4">
          <div className="flex h-40 items-end gap-1">
            {jours.map((j) => (
              <div
                key={j.jour}
                className="flex h-full flex-1 flex-col justify-end"
                title={`${j.jour} : ${fcfa(j.montant)} (${j.nb} commande${j.nb > 1 ? 's' : ''})`}
              >
                <div
                  className="w-full rounded-t bg-accent"
                  style={{ height: `${Math.max(j.montant ? 4 : 0, (j.montant / maxJour) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1 flex gap-1 text-[10px] text-ink/60">
            {jours.map((j) => (
              <span key={j.jour} className="flex-1 text-center">
                {j.jour.slice(8, 10)}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Produits + zones */}
      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold">Produits qui rapportent le plus</h2>
          {top.length === 0 ? (
            <p className="mt-3 text-sm text-ink/70">Pas encore de vente validée.</p>
          ) : (
            <table className="mt-3 w-full rounded-lg border border-ink/15 bg-white text-sm">
              <thead className="text-left text-ink/70">
                <tr>
                  <th className="p-3">Produit</th>
                  <th className="p-3">Vendus</th>
                  <th className="p-3">Chiffre</th>
                  <th className="p-3">Marge</th>
                </tr>
              </thead>
              <tbody>
                {top.map(([nom, p]) => (
                  <tr key={nom} className="border-t border-ink/10">
                    <td className="p-3 font-medium">{nom}</td>
                    <td className="p-3">{p.qte}</td>
                    <td className="p-3">{fcfa(p.ca)}</td>
                    <td className="p-3 font-bold">{fcfa(p.marge)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div>
          <h2 className="text-lg font-bold">Où tu livres</h2>
          <div className="mt-3 rounded-lg border border-ink/15 bg-white p-4 text-sm">
            <p>
              Abidjan : <strong>{abidjan}</strong>
            </p>
            <p className="mt-1">
              Intérieur du pays : <strong>{interieur}</strong>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
