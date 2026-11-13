/** Texte nettoyé : chaîne, sans espaces aux extrémités, longueur limitée. */
export function texte(valeur: unknown, max: number): string {
  if (typeof valeur !== 'string') return ''
  return valeur.trim().slice(0, max)
}

/**
 * Numéro ivoirien à 10 chiffres.
 * Accepte espaces, points, tirets et l'indicatif (+225 ou 00225).
 * Retourne '' si le numéro est invalide.
 */
export function normaliserTel(valeur: unknown): string {
  if (typeof valeur !== 'string') return ''
  let n = valeur.replace(/[\s.\-()]/g, '')
  if (n.startsWith('+225')) n = n.slice(4)
  else if (n.startsWith('00225')) n = n.slice(5)
  return /^\d{10}$/.test(n) ? n : ''
}

export function emailValide(valeur: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valeur)
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
