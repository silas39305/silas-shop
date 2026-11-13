import Link from 'next/link'
import { supabase, fcfa, type Produit } from '@/lib/supabase'

export const revalidate = 60 // rafraîchit le catalogue toutes les 60 s

export default async function Catalogue() {
  const { data } = await supabase
    .from('produits')
    .select('id, nom, description, prix, photo_url')
    .order('created_at', { ascending: false })

  const produits = (data ?? []) as Produit[]

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight text-[#12202F]">
        Gadgets livrés chez toi
      </h1>
      <p className="mt-2 max-w-md text-[#12202F]/70">
        Choisis, paie par MTN Money, reçois ta commande.
      </p>

      {produits.length === 0 ? (
        <p className="mt-10 text-[#12202F]/70">
          Aucun produit pour le moment. Ajoute des produits dans Supabase pour les voir ici.
        </p>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {produits.map((p) => (
            <li key={p.id}>
              <Link
                href={`/produit/${p.id}`}
                className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2F5BFF]"
              >
                <div className="aspect-square overflow-hidden rounded-lg bg-[#E9ECEF]">
                  {p.photo_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.photo_url}
                      alt={p.nom}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                <h2 className="mt-2 text-sm font-medium text-[#12202F] group-hover:underline">
                  {p.nom}
                </h2>
                <p className="text-sm font-bold text-[#12202F]">{fcfa(p.prix)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
