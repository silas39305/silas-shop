import Link from 'next/link'
import { supabasePublic, type Produit } from '@/lib/supabase-public'
import { fcfa } from '@/lib/format'

export const dynamic = 'force-dynamic'

export default async function Catalogue() {
  const { data, error } = await supabasePublic()
    .from('produits_publics')
    .select('id, nom, description, prix, photo_url')
    .order('nom', { ascending: true })

  const produits = (data ?? []) as Produit[]

  return (
    <main className="mx-auto max-w-5xl px-4 pt-10">
      <section className="max-w-xl">
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Des gadgets, livrés gratuitement à Abidjan.
        </h1>
        <ul className="mt-5 space-y-1 text-ink/75">
          <li>Tu paies d’abord par MTN Money, sans compte à créer.</li>
          <li>Nous validons ta commande puis te prévenons comme tu préfères.</li>
          <li>Hors d’Abidjan, nous t’envoyons le prix de l’expédition avant que tu paies.</li>
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="titre-catalogue">
        <h2 id="titre-catalogue" className="text-2xl font-bold tracking-tight">
          Les gadgets du moment
        </h2>

        {error ? (
          <p className="mt-6 text-red-700" role="alert">
            Les produits ne peuvent pas être affichés pour le moment. Réessaie dans un
            instant.
          </p>
        ) : produits.length === 0 ? (
          <p className="mt-6 max-w-md text-ink/70">
            Aucun gadget en ligne pour l’instant. Reviens bientôt.
          </p>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {produits.map((p) => (
              <li key={p.id}>
                <Link href={`/produit/${p.id}`} className="group block">
                  <div className="aspect-square overflow-hidden rounded-lg bg-ink/5">
                    {p.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.photo_url}
                        alt={p.nom}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <h3 className="mt-3 text-base font-semibold leading-snug group-hover:underline">
                    {p.nom}
                  </h3>
                  <p className="mt-1 inline-block rounded bg-mtn px-2 py-0.5 text-sm font-bold">
                    {fcfa(p.prix)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
