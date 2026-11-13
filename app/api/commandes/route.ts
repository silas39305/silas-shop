import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { emailValide, normaliserTel, texte, UUID } from '@/lib/validation'

const ZONES = ['abidjan', 'interieur'] as const
const CANAUX = ['whatsapp', 'sms', 'appel', 'email'] as const

function erreur(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(req: Request) {
  let b: Record<string, unknown>
  try {
    b = await req.json()
  } catch {
    return erreur('Requête invalide.')
  }

  // --- Lecture et validation des champs (rien n'est cru sur parole) ---
  const produitId = texte(b.produit_id, 64)
  const quantite = Math.min(Math.max(parseInt(String(b.quantite), 10) || 1, 1), 10)
  const nom = texte(b.client_nom, 80)
  const tel = normaliserTel(b.client_tel)
  const zone = ZONES.find((z) => z === b.zone)
  const canal = CANAUX.find((c) => c === b.notification_pref)
  const ville = texte(b.ville, 80)
  const adresse = texte(b.adresse, 300)
  const email = texte(b.client_email, 120)
  const trx = texte(b.momo_transaction_id, 40)

  if (!UUID.test(produitId)) return erreur('Produit invalide.')
  if (!nom) return erreur('Indique ton nom.')
  if (!tel) return erreur('Le numéro de téléphone doit avoir 10 chiffres.')
  if (!zone) return erreur('Choisis ta zone de livraison.')
  if (!ville) return erreur('Indique ta ville ou ta commune.')
  if (!adresse) return erreur('Indique ton adresse ou un repère pour la livraison.')
  if (!canal) return erreur('Choisis comment tu veux être prévenu.')
  if (canal === 'email' && !emailValide(email)) {
    return erreur('Indique une adresse e-mail valide.')
  }
  // Abidjan : le paiement se fait tout de suite, le numéro de transaction est obligatoire.
  if (zone === 'abidjan' && trx.length < 6) {
    return erreur('Indique le numéro de transaction MTN Money reçu par SMS.')
  }

  const db = supabaseAdmin()

  // --- Le prix vient de la base, jamais du navigateur ---
  const { data: produit } = await db
    .from('produits')
    .select('id, prix, prix_vendeur')
    .eq('id', produitId)
    .eq('actif', true)
    .maybeSingle()

  if (!produit) return erreur('Ce produit n’est plus disponible.', 404)

  // --- Freinage simple contre les fausses commandes en rafale ---
  const depuis = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await db
    .from('commandes')
    .select('id', { count: 'exact', head: true })
    .eq('client_tel', tel)
    .gte('created_at', depuis)

  if ((count ?? 0) >= 5) {
    return erreur('Trop de commandes avec ce numéro. Réessaie dans une heure.', 429)
  }

  const abidjan = zone === 'abidjan'
  const maintenant = new Date().toISOString()

  const { data, error } = await db
    .from('commandes')
    .insert({
      produit_id: produit.id,
      quantite,
      prix_unitaire: produit.prix,
      total_produits: produit.prix * quantite,
      commission: (produit.prix - produit.prix_vendeur) * quantite,
      client_nom: nom,
      client_tel: tel,
      client_email: canal === 'email' ? email : null,
      notification_pref: canal,
      adresse,
      ville,
      zone,
      // Abidjan : livraison gratuite, paiement à vérifier.
      // Intérieur : frais inconnus, la commande attend le devis de l'admin.
      frais_livraison: abidjan ? 0 : null,
      momo_transaction_id: abidjan ? trx : null,
      statut: abidjan ? 'paiement_a_verifier' : 'en_attente_devis',
      paiement_declare_at: abidjan ? maintenant : null,
    })
    .select('id, numero, total, statut')
    .single()

  if (error) {
    // 23505 = violation de la contrainte unique (numéro de transaction déjà utilisé)
    if (error.code === '23505') {
      return erreur('Ce numéro de transaction a déjà été utilisé.', 409)
    }
    return erreur('La commande n’a pas pu être enregistrée. Réessaie dans un instant.', 500)
  }

  return NextResponse.json({
    id: data.id,
    numero: data.numero,
    statut: data.statut,
    total: abidjan ? data.total : null,
  })
}
