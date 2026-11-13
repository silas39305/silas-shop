/** 8500 -> "8 500 FCFA" */
export function fcfa(n: number): string {
  const nombre = new Intl.NumberFormat('fr-FR')
    .format(n)
    .replace(/[\u202f\u00a0]/g, ' ')
  return `${nombre} FCFA`
}
