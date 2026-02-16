'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import PendingApproval from '@/components/pending-approval'
import Navbar from '@/components/layout/navbar'
import BottomNav from '@/components/layout/bottom-nav'
import { Loader2 } from 'lucide-react'

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { profile, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Carregando...</p>
                </div>
            </div>
        )
    }

    if (profile?.status === 'pending') {
        return <PendingApproval />
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-6">
                {children}
            </main>
            <BottomNav />
        </div>
    )
}
