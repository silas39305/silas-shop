import { createClient } from '@supabase/supabase-js'

/**
 * Client Supabase avec la clé "service_role" : accès complet à la base.
 * À utiliser UNIQUEMENT dans les routes API et composants serveur.
 * Ne jamais l'importer dans un composant 'use client'.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Variables Supabase serveur manquantes (URL ou service_role).')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}
