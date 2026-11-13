import { createClient } from '@supabase/supabase-js'

/**
 * Produit tel que visible par le public (vue `produits_publics`).
 * Le prix vendeur et le téléphone du vendeur n'en font volontairement pas partie.
 */
export type Produit = {
  id: string
  nom: string
  description: string | null
  prix: number
  photo_url: string | null
}

/**
 * Client Supabase avec la clé "anon" (lecture seule, vue publique uniquement).
 * Créé à la demande : le build ne plante pas si les variables manquent.
 */
export function supabasePublic() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Variables Supabase manquantes (URL ou clé anon).')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}
