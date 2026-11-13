import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { texte, UUID } from '@/lib/validation'

function erreur(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Intérieur du pays : le client déclare son paiement Wave après avoir reçu le devis.
 * Seule transition permise : devis_envoye -> paiement_a_verifier, devis non expiré.
 */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  if (!UUID.test(id)) return erreur('Commande introuvable.', 404)

  let b: Record<string, unknown>
  try {
    b = await req.json()
  } catch {
    return erreur('Requête invalide.')
  }

  const trx = texte(b.momo_transaction_id, 40)
  if (trx.length < 6) return erreur('Indique le numéro de dépôt Wave reçu par SMS.')

  const maintenant = new Date().toISOString()

  // Mise à jour conditionnelle : un seul clic gagnant, et seulement si le devis est valable.
  const { data, error } = await supabaseAdmin()
    .from('commandes')
    .update({
      momo_transaction_id: trx,
      statut: 'paiement_a_verifier',
      paiement_declare_at: maintenant,
    })
    .eq('id', id)
    .eq('statut', 'devis_envoye')
    .gt('devis_expire_at', maintenant)
    .select('id')
    .maybeSingle()

  if (error) {
    if (error.code === '23505') return erreur('Ce numéro de transaction a déjà été utilisé.', 409)
    return erreur('Le paiement n’a pas pu être enregistré. Réessaie dans un instant.', 500)
  }
  if (!data) {
    return erreur('Cette commande n’attend plus de paiement (devis expiré ou déjà payé).', 409)
  }

  return NextResponse.json({ ok: true })
}
