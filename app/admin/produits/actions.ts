'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { exigerAdmin } from '@/lib/admin-session'
import { normaliserTel, texte, UUID } from '@/lib/validation'

function retour(message: string): never {
  redirect('/admin/produits?erreur=' + encodeURIComponent(message))
}

function rafraichir() {
  revalidatePath('/admin/produits')
  revalidatePath('/')
  revalidatePath('/produit/[id]', 'page')
}

/** Ajoute un produit (sans champ `id`) ou modifie un produit existant (avec `id`). */
export async function enregistrerProduit(formData: FormData) {
  await exigerAdmin()

  const id = String(formData.get('id') ?? '')
  const nom = texte(formData.get('nom'), 120)
  const description = texte(formData.get('description'), 500)
  const prix = Math.round(Number(formData.get('prix')))
  const prixVendeur = Math.round(Number(formData.get('prix_vendeur')))
  const photo = texte(formData.get('photo_url'), 500)
  const vendeurNom = texte(formData.get('vendeur_nom'), 80)
  const telBrut = texte(formData.get('vendeur_tel'), 30)
  const actif = formData.get('actif') === 'on'

  if (id && !UUID.test(id)) retour('Produit introuvable.')
  if (!nom) retour('Le nom du produit est obligatoire.')
  if (!Number.isFinite(prix) || prix <= 0) retour('Le prix de vente doit être supérieur à 0.')
  if (!Number.isFinite(prixVendeur) || prixVendeur < 0) retour('Le prix vendeur est invalide.')
  if (prix < prixVendeur) retour('Le prix de vente ne peut pas être inférieur au prix vendeur.')
  if (photo && !/^https?:\/\//i.test(photo)) retour('Le lien de la photo doit commencer par https://')

  let vendeurTel: string | null = null
  if (telBrut) {
    vendeurTel = normaliserTel(telBrut)
    if (!vendeurTel) retour('Le téléphone du vendeur doit avoir 10 chiffres.')
  }

  const champs = {
    nom,
    description: description || null,
    prix,
    prix_vendeur: prixVendeur,
    photo_url: photo || null,
    vendeur_nom: vendeurNom || null,
    vendeur_tel: vendeurTel,
    actif: id ? actif : true,
  }

  const db = supabaseAdmin().from('produits')
  const { error } = id ? await db.update(champs).eq('id', id) : await db.insert(champs)
  if (error) retour('Enregistrement impossible : ' + error.message)

  rafraichir()
  redirect('/admin/produits?ok=1')
}

/** Affiche ou masque un produit dans le catalogue (jamais de suppression : des commandes y sont liées). */
export async function basculerProduit(formData: FormData) {
  await exigerAdmin()
  const id = String(formData.get('id') ?? '')
  if (!UUID.test(id)) return
  const actif = formData.get('actif') === 'true'

  const { error } = await supabaseAdmin().from('produits').update({ actif }).eq('id', id)
  if (error) retour('Mise à jour impossible : ' + error.message)
  rafraichir()
}
