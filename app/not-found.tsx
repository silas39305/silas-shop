import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 pt-16">
      <h1 className="text-3xl font-extrabold tracking-tight">Page introuvable</h1>
      <p className="mt-3 text-ink/75">
        Ce produit n’existe plus ou le lien est incorrect.
      </p>
      <Link href="/" className="mt-6 inline-block font-medium text-accent hover:underline">
        Retourner au catalogue
      </Link>
    </main>
  )
}
