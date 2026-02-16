'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
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

// Module-level singleton — never recreated by React
const supabase = createClient()

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) {
            console.warn('[Auth] Profile fetch error:', error.message)
            return null
        }
        return data as Profile
    }, [])

    // Single effect that handles everything
    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(async ({ data: { session } }: { data: { session: Session | null } }) => {
            const currentUser = session?.user ?? null
            setUser(currentUser)

            if (currentUser) {
                const p = await fetchProfile(currentUser.id)
                setProfile(p)
            }

            setLoading(false)
        }).catch(() => {
            setLoading(false)
        })

        // 2. Listen for auth changes (login, logout, token refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event: string, session: Session | null) => {
                const currentUser = session?.user ?? null
                setUser(currentUser)

                if (currentUser) {
                    const p = await fetchProfile(currentUser.id)
                    setProfile(p)
                } else {
                    setProfile(null)
                }

                setLoading(false)
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [fetchProfile])

    const signOut = useCallback(async () => {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        router.push('/login')
        router.refresh()
    }, [router])

    const refreshProfile = useCallback(async () => {
        if (user) {
            const p = await fetchProfile(user.id)
            setProfile(p)
        }
    }, [user, fetchProfile])

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
