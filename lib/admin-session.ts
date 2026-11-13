import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE_ADMIN, tokenValide } from '@/lib/admin-token'

/** À appeler au début de chaque action serveur de l'admin (le middleware ne suffit pas). */
export async function exigerAdmin() {
  const c = await cookies()
  if (!(await tokenValide(c.get(COOKIE_ADMIN)?.value))) redirect('/admin/login')
}
