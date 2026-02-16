import { createBrowserClient } from '@supabase/ssr'

// Module-level singleton — ensures only ONE Supabase client is ever created,
// avoiding lock conflicts from React StrictMode double-rendering.
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
    if (!supabaseInstance) {
        supabaseInstance = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    }
    return supabaseInstance
}
