/**
 * Session admin : cookie signé (HMAC-SHA256) avec Web Crypto.
 * Fonctionne dans le middleware (Edge) comme dans les routes serveur.
 */
export const COOKIE_ADMIN = 'admin_session'
export const DUREE_SESSION_S = 60 * 60 * 24 * 7 // 7 jours

const enc = new TextEncoder()

async function signer(donnee: string, secret: string): Promise<string> {
  const cle = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', cle, enc.encode(donnee))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function egal(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

export async function motDePasseValide(saisi: string): Promise<boolean> {
  const attendu = process.env.ADMIN_PASSWORD
  if (!attendu || !saisi) return false
  // On compare les empreintes : même longueur, temps constant.
  return egal(await signer(saisi, 'cmp'), await signer(attendu, 'cmp'))
}

export async function creerToken(): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret) throw new Error('ADMIN_SESSION_SECRET manquant.')
  const exp = String(Date.now() + DUREE_SESSION_S * 1000)
  return `${exp}.${await signer(exp, secret)}`
}

export async function tokenValide(token: string | undefined): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret || !token) return false
  const [exp, sig] = token.split('.')
  if (!exp || !sig || !(Number(exp) > Date.now())) return false
  return egal(sig, await signer(exp, secret))
}
