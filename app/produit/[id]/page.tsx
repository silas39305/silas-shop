import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { supabasePublic, type Produit } from '@/lib/supabase-public'
import { fcfa } from '@/lib/format'
import FormCommande from '@/components/FormCommande'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ id: string }> } // Next 15 : params est une Promise

async function chargerProduit(id: string): Promise<Produit | null> {
  const { data, error } = await supabasePublic()
    .from('produits_publics')
    .select('id, nom, description, prix, photo_url')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  return data as Produit
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const p = await chargerProduit(id)
  return { title: p ? p.nom : 'Produit introuvable' }
}

export default async function PageProduit({ params }: Props) {
  const { id } = await params
  const p = await chargerProduit(id)
  if (!p) notFound()

  return (
    <main className="mx-auto max-w-4xl px-4 pt-8">
      <Link href="/" className="text-sm font-medium text-accent hover:underline">
        Voir tous les gadgets
      </Link>

      <div className="mt-5 grid items-start gap-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-lg bg-ink/5">
          {p.photo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.photo_url} alt={p.nom} className="h-full w-full object-cover" />
          )}
        </div>

        <div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight">{p.nom}</h1>
          <p className="mt-3 inline-block rounded bg-mtn px-3 py-1 text-xl font-bold">
            {fcfa(p.prix)}
          </p>
          {p.description && (
            <p className="mt-5 max-w-prose leading-relaxed text-ink/80">{p.description}</p>
          )}

          <FormCommande produitId={p.id} prixUnitaire={p.prix} />
        </div>
      </div>
    </main>
  )
}
