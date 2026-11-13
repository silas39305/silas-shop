import { connexion } from '../actions'

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>
}) {
  const { erreur } = await searchParams
  return (
    <main className="mx-auto max-w-sm pt-10">
      <h1 className="text-2xl font-bold">Admin</h1>
      <form action={connexion} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">
          Mot de passe
          <input
            type="password"
            name="mot_de_passe"
            required
            autoFocus
            autoComplete="current-password"
            className="mt-1 w-full rounded-md border border-ink/25 bg-white px-3 py-2 text-base"
          />
        </label>
        {erreur && (
          <p className="text-sm font-medium text-red-700" role="alert">
            Mot de passe incorrect.
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-md bg-accent px-4 py-3 font-bold text-white hover:bg-accent-dark"
        >
          Entrer
        </button>
      </form>
    </main>
  )
}
