import AdminNav from '@/components/AdminNav'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { fcfa } from '@/lib/format'
import { basculerProduit, enregistrerProduit } from './actions'

export const dynamic = 'force-dynamic'

type Produit = {
  id: string
  nom: string
  description: string | null
  prix: number
  prix_vendeur: number
  photo_url: string | null
  vendeur_nom: string | null
  vendeur_tel: string | null
  actif: boolean
}

const champ = 'mt-1 block w-full rounded-md border border-ink/25 bg-white px-3 py-2 text-base'
const libelle = 'block text-sm font-medium'
const bouton = 'rounded-md px-4 py-2 text-sm font-bold'

function Champs({ p }: { p?: Produit }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className={`${libelle} sm:col-span-2`}>
        Nom du produit
        <input name="nom" required maxLength={120} defaultValue={p?.nom} className={champ} />
      </label>
      <label className={`${libelle} sm:col-span-2`}>
        Description
        <textarea
          name="description"
          rows={2}
          maxLength={500}
          defaultValue={p?.description ?? ''}
          className={champ}
        />
      </label>
      <label className={libelle}>
        Prix de vente affiché (FCFA)
        <input
          name="prix"
          type="number"
          required
          min={1}
          step={50}
          defaultValue={p?.prix}
          className={champ}
        />
      </label>
      <label className={libelle}>
        Prix vendeur : ce que tu lui dois (FCFA)
        <input
          name="prix_vendeur"
          type="number"
          required
          min={0}
          step={50}
          defaultValue={p?.prix_vendeur}
          className={champ}
        />
      </label>
      <label className={libelle}>
        Nom du vendeur
        <input name="vendeur_nom" maxLength={80} defaultValue={p?.vendeur_nom ?? ''} className={champ} />
      </label>
      <label className={libelle}>
        Téléphone du vendeur (10 chiffres)
        <input
          name="vendeur_tel"
          inputMode="tel"
          defaultValue={p?.vendeur_tel ?? ''}
          className={champ}
        />
      </label>
      <label className={`${libelle} sm:col-span-2`}>
        Lien de la photo (https://…)
        <input
          name="photo_url"
          type="url"
          maxLength={500}
          defaultValue={p?.photo_url ?? ''}
          placeholder="https://…"
          className={champ}
        />
      </label>
    </div>
  )
}

export default async function Produits({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; ok?: string }>
}) {
  const { erreur, ok } = await searchParams

  const { data, error } = await supabaseAdmin()
    .from('produits')
    .select('id, nom, description, prix, prix_vendeur, photo_url, vendeur_nom, vendeur_tel, actif')
    .order('actif', { ascending: false })
    .order('nom', { ascending: true })

  const produits = (data ?? []) as Produit[]

  return (
    <main>
      <AdminNav actif="produits" />
      <h1 className="text-2xl font-bold">Produits</h1>

      {erreur && (
        <p className="mt-4 rounded-md bg-red-100 p-3 text-sm font-medium text-red-900" role="alert">
          {erreur}
        </p>
      )}
      {ok && (
        <p className="mt-4 rounded-md bg-green-100 p-3 text-sm font-medium text-green-900" role="status">
          Produit enregistré.
        </p>
      )}
      {error && (
        <p className="mt-4 text-red-700" role="alert">
          Impossible de charger les produits : {error.message}
        </p>
      )}

      <details className="mt-6 rounded-lg border border-ink/15 bg-white p-4">
        <summary className="cursor-pointer font-bold">+ Ajouter un produit</summary>
        <form action={enregistrerProduit} className="mt-4 space-y-4">
          <Champs />
          <button className={`${bouton} bg-accent text-white hover:bg-accent-dark`}>
            Ajouter au catalogue
          </button>
        </form>
      </details>

      {!error && produits.length === 0 && (
        <p className="mt-8 text-ink/70">Aucun produit pour le moment.</p>
      )}

      <ul className="mt-6 space-y-4">
        {produits.map((p) => (
          <li
            key={p.id}
            className={`rounded-lg border border-ink/15 bg-white p-4 ${p.actif ? '' : 'opacity-70'}`}
          >
            <div className="flex flex-wrap items-start gap-4">
              {p.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photo_url} alt="" className="h-20 w-20 rounded-md object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-md bg-paper text-xs text-ink/50">
                  Pas de photo
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  {p.nom}{' '}
                  <span
                    className={`ml-1 rounded px-2 py-0.5 text-xs font-bold ${
                      p.actif ? 'bg-green-100 text-green-900' : 'bg-ink/10 text-ink'
                    }`}
                  >
                    {p.actif ? 'Visible' : 'Masqué'}
                  </span>
                </p>
                <p className="text-sm">
                  Vente {fcfa(p.prix)} · Vendeur {fcfa(p.prix_vendeur)} ·{' '}
                  <strong>Marge {fcfa(p.prix - p.prix_vendeur)}</strong>
                </p>
                <p className="text-sm text-ink/70">
                  {p.vendeur_nom ?? 'Vendeur non renseigné'}
                  {p.vendeur_tel ? ` · ${p.vendeur_tel}` : ''}
                </p>
              </div>
              <form action={basculerProduit}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="actif" value={String(!p.actif)} />
                <button className={`${bouton} border border-ink bg-white hover:bg-ink/5`}>
                  {p.actif ? 'Masquer' : 'Afficher'}
                </button>
              </form>
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-accent">Modifier</summary>
              <form action={enregistrerProduit} className="mt-4 space-y-4">
                <input type="hidden" name="id" value={p.id} />
                <Champs p={p} />
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" name="actif" defaultChecked={p.actif} className="accent-accent" />
                  Visible dans le catalogue
                </label>
                <button className={`${bouton} bg-accent text-white hover:bg-accent-dark`}>
                  Enregistrer les modifications
                </button>
              </form>
            </details>
          </li>
        ))}
      </ul>
    </main>
  )
}
