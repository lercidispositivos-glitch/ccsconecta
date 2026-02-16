'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types/database'

interface AuthContextType {
    user: User | null
    profile: Profile | null
    loading: boolean
    signOut: () => Promise<void>
    refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    signOut: async () => { },
    refreshProfile: async () => { },
})

// Get the singleton client at module level — safe because it's a singleton
const supabase = createClient()

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) {
                console.error('[Auth] Error fetching profile:', error.message)
                setProfile(null)
            } else {
                setProfile(data as Profile | null)
            }
        } catch (err) {
            console.error('[Auth] Profile fetch failed:', err)
            setProfile(null)
        }
    }, [])

    const refreshProfile = useCallback(async () => {
        if (user) {
            await fetchProfile(user.id)
        }
    }, [user, fetchProfile])

    useEffect(() => {
        let mounted = true

        const initialize = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession()

                if (!mounted) return

                if (error) {
                    console.error('[Auth] getSession error:', error.message)
                }

                const currentUser = session?.user ?? null
                setUser(currentUser)

                if (currentUser) {
                    await fetchProfile(currentUser.id)
                }
            } catch (err) {
                console.error('[Auth] Session check failed:', err)
                if (mounted) {
                    setUser(null)
                    setProfile(null)
                }
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        initialize()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: string, session: { user: User } | null) => {
                if (!mounted) return

                console.log('[Auth] State change:', event)

                const currentUser = session?.user ?? null
                setUser(currentUser)

                if (event === 'SIGNED_OUT') {
                    setProfile(null)
                    setLoading(false)
                    return
                }

                if (currentUser) {
                    await fetchProfile(currentUser.id)
                } else {
                    setProfile(null)
                }

                if (mounted) {
                    setLoading(false)
                }

                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    router.refresh()
                }
            }
        )

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const signOut = async () => {
        setLoading(true)
        try {
            await supabase.auth.signOut()
        } catch (err) {
            console.error('[Auth] Sign out error:', err)
        }
        setUser(null)
        setProfile(null)
        setLoading(false)
        router.push('/login')
        router.refresh()
    }

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
