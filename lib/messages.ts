import { fcfa } from '@/lib/format'

export type Notif = {
  statut: string
  numero: number
  quantite: number
  total_produits: number
  frais_livraison: number | null
  total: number
  client_nom: string
  client_tel: string
  client_email: string | null
  notification_pref: 'whatsapp' | 'sms' | 'appel' | 'email'
  id: string
  produit: string
}

const BOUTIQUE = process.env.NEXT_PUBLIC_NOM_BOUTIQUE || 'Boutique Gadgets'
const NUMERO_PAIEMENT = process.env.NEXT_PUBLIC_WAVE_NUMERO || '0594568098'
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '')

function texte(c: Notif): { sujet: string; corps: string } | null {
  const ref = `commande n°${c.numero} (${c.produit} x${c.quantite})`
  const lien = SITE ? `${SITE}/commande/${c.id}` : ''

  switch (c.statut) {
    case 'devis_envoye':
      return {
        sujet: `Devis de livraison – commande n°${c.numero}`,
        corps:
          `Bonjour ${c.client_nom}, c'est ${BOUTIQUE}. Pour ta ${ref} : ` +
          `produits ${fcfa(c.total_produits)} + expédition ${fcfa(c.frais_livraison ?? 0)} ` +
          `= ${fcfa(c.total)}. Paie par Wave au ${NUMERO_PAIEMENT}, puis ` +
          (lien
            ? `indique ton numéro de dépôt ici : ${lien}`
            : `réponds-nous avec ton numéro de dépôt`) +
          `. Ce devis est valable 48 h.`,
      }
    case 'validee':
      return {
        sujet: `Commande n°${c.numero} validée`,
        corps: `Bonjour ${c.client_nom}, ton paiement de ${fcfa(c.total)} est bien reçu : ta ${ref} est validée. Nous organisons la livraison et te prévenons à la remise.`,
      }
    case 'livree':
      return {
        sujet: `Commande n°${c.numero} livrée`,
        corps: `Bonjour ${c.client_nom}, ta ${ref} est marquée comme livrée. Merci pour ta confiance ! Un souci ? Réponds simplement à ce message.`,
      }
    case 'annulee':
      return {
        sujet: `Commande n°${c.numero} annulée`,
        corps: `Bonjour ${c.client_nom}, ta ${ref} a été annulée. Si tu as déjà payé, réponds-nous : nous réglons cela avec toi.`,
      }
    default:
      return null // en_attente_devis / paiement_a_verifier : rien à envoyer au client
  }
}

/** Le bouton unique de l'admin : adapté au canal du client, message déjà écrit. */
export function notification(c: Notif) {
  const t = texte(c)
  if (!t) return null
  const tel = `225${c.client_tel}`
  const m = encodeURIComponent(t.corps)

  switch (c.notification_pref) {
    case 'whatsapp':
      return { libelle: 'Envoyer sur WhatsApp', href: `https://wa.me/${tel}?text=${m}`, message: t.corps, externe: true }
    case 'sms':
      return { libelle: 'Envoyer par SMS', href: `sms:+${tel}?body=${m}`, message: t.corps, externe: false }
    case 'appel':
      return { libelle: 'Appeler le client', href: `tel:+${tel}`, message: t.corps, externe: false }
    case 'email':
      if (!c.client_email) return null
      return {
        libelle: 'Envoyer par e-mail',
        href: `mailto:${c.client_email}?subject=${encodeURIComponent(t.sujet)}&body=${m}`,
        message: t.corps,
        externe: false,
      }
  }
}
