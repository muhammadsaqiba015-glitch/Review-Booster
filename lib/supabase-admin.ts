import { createClient } from '@supabase/supabase-js'

// Server-only: service role key — never import this in client components.
//
// We override `fetch` with `cache: 'no-store'` because Next.js App Router
// patches the global fetch and caches GET requests by default. The Supabase
// client uses fetch internally for every query, so without this it would
// serve STALE rows (new submissions wouldn't appear until the cache revalidated).
const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: 'no-store' })

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: noStoreFetch },
  }
)
