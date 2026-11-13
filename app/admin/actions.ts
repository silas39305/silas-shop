'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { exigerAdmin } from '@/lib/admin-session'
import { UUID } from '@/lib/validation'
import {
  COOKIE_ADMIN,
  DUREE_SESSION_S,
  creerToken,
  motDePasseValide,
} from '@/lib/admin-token'

// ---------------------------------------------------------------- session

export async function connexion(formData: FormData) {
  const saisi = String(formData.get('mot_de_passe') ?? '')
  if (!(await motDePasseValide(saisi))) {
    await new Promise((r) => setTimeout(r, 1000)) // ralentit les essais en rafale
    redirect('/admin/login?erreur=1')
  }
  const c = await cookies()
  c.set(COOKIE_ADMIN, await creerToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/admin',
    maxAge: DUREE_SESSION_S,
  })
  redirect('/admin')
}

export async function deconnexion() {
  const c = await cookies()
  c.delete({ name: COOKIE_ADMIN, path: '/admin' })
  redirect('/admin/login')
}

// ---------------------------------------------------------------- commandes

/**
 * Change l'état d'une commande, seulement si elle est dans un des statuts
 * attendus (évite un double clic ou un onglet périmé qui écraserait un état).
 */
async function transition(
  formData: FormData,
  depuis: string[],
  champs: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filtre?: (q: any) => any,
) {
  await exigerAdmin()
  const id = String(formData.get('id') ?? '')
  if (!UUID.test(id)) return

  let q = supabaseAdmin().from('commandes').update(champs).eq('id', id).in('statut', depuis)
  if (filtre) q = filtre(q)
  const { error } = await q
  if (error) throw new Error('Mise à jour impossible : ' + error.message)
  revalidatePath('/admin')
}

/** Intérieur du pays : fixe les frais d'expédition et envoie le devis. */
export async function envoyerDevis(formData: FormData) {
  const frais = Math.round(Number(formData.get('frais')))
  if (!Number.isFinite(frais) || frais < 0 || frais > 1_000_000) return

  const maintenant = new Date()
  await transition(
    formData,
    ['en_attente_devis', 'devis_envoye'],
    {
      frais_livraison: frais,
      statut: 'devis_envoye',
      devis_envoye_at: maintenant.toISOString(),
      devis_expire_at: new Date(maintenant.getTime() + 48 * 3600 * 1000).toISOString(),
    },
    (q) => q.eq('zone', 'interieur'),
  )
}

/** Tu as vu l'argent arriver sur ton téléphone. */
export async function validerPaiement(formData: FormData) {
  await transition(formData, ['paiement_a_verifier'], {
    statut: 'validee',
    validee_at: new Date().toISOString(),
  })
}

export async function confirmerLivraison(formData: FormData) {
  await transition(formData, ['validee'], {
    statut: 'livree',
    livree_at: new Date().toISOString(),
  })
}

export async function annuler(formData: FormData) {
  await transition(
    formData,
    ['en_attente_devis', 'devis_envoye', 'paiement_a_verifier', 'validee'],
    { statut: 'annulee' },
  )
}
