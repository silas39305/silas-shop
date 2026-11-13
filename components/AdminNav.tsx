import Link from 'next/link'
import { deconnexion } from '@/app/admin/actions'

const LIENS = [
  { href: '/admin/tableau', libelle: 'Tableau de bord', cle: 'tableau' },
  { href: '/admin', libelle: 'Commandes', cle: 'commandes' },
  { href: '/admin/produits', libelle: 'Produits', cle: 'produits' },
]

export default function AdminNav({ actif }: { actif: 'tableau' | 'commandes' | 'produits' }) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-ink/15 pb-4">
      <nav className="flex flex-wrap gap-2" aria-label="Administration">
        {LIENS.map((l) => (
          <Link
            key={l.cle}
            href={l.href}
            className={`rounded-md px-3 py-1.5 text-sm font-bold ${
              l.cle === actif ? 'bg-ink text-white' : 'border border-ink/25 bg-white hover:border-ink'
            }`}
          >
            {l.libelle}
          </Link>
        ))}
      </nav>
      <form action={deconnexion}>
        <button className="text-sm underline">Se déconnecter</button>
      </form>
    </header>
  )
}
