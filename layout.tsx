import type { Metadata } from 'next'
import Link from 'next/link'
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google'
import './globals.css'

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const body = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const NOM = process.env.NEXT_PUBLIC_NOM_BOUTIQUE || 'Boutique Gadgets'

export const metadata: Metadata = {
  title: { default: NOM, template: `%s | ${NOM}` },
  description:
    'Des gadgets livrés gratuitement à Abidjan. Paiement MTN Money à l’avance, expédition dans toute la Côte d’Ivoire.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-screen">
        <header className="border-b border-ink/10 bg-white">
          <div className="mx-auto flex max-w-5xl items-center px-4 py-3">
            <Link href="/" className="font-display text-xl font-bold tracking-tight">
              {NOM}
            </Link>
          </div>
        </header>

        {children}

        <footer className="mt-16 border-t border-ink/10 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-ink/70">
            <p>Livraison gratuite partout à Abidjan.</p>
            <p>
              Expédition dans le reste du pays : le prix est communiqué sur devis, avant
              le paiement.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
