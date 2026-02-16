'use client'

import { Clock, Shield, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/contexts/auth-context'
import { Button } from '@/components/ui/button'

export default function PendingApproval() {
    const { signOut, profile } = useAuth()

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-[#001a33] to-[#0a0f1a]" />

            {/* Decorative elements */}
            <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] rounded-full bg-[var(--accent)] opacity-[0.05] blur-3xl" />

            {/* Content */}
            <div className="relative z-10 max-w-md w-full text-center space-y-8">
                {/* Animated icon */}
                <div className="relative inline-flex">
                    <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                        <Clock className="w-12 h-12 text-[var(--accent)]" />
                    </div>
                    {/* Pulse ring */}
                    <div className="absolute inset-0 rounded-3xl border-2 border-[var(--accent)]/30 animate-ping" style={{ animationDuration: '2s' }} />
                </div>

                {/* Text */}
                <div className="space-y-3">
                    <h1 className="text-3xl font-bold text-white">
                        Cadastro em Análise
                    </h1>
                    <p className="text-white/60 leading-relaxed">
                        {profile?.full_name ? (
                            <>Olá, <strong className="text-white/80">{profile.full_name}</strong>! </>
                        ) : null}
                        Seu cadastro foi recebido e está sendo analisado pela equipe do CCS.
                    </p>
                </div>

                {/* Info card */}
                <div className="glass rounded-2xl p-5 text-left border-white/10">
                    <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-[var(--accent)] mt-0.5 shrink-0" />
                        <div>
                            <p className="text-white/90 text-sm font-medium">Aprovação necessária</p>
                            <p className="text-white/50 text-xs mt-1 leading-relaxed">
                                Por segurança, todos os novos membros precisam ser aprovados por um administrador antes de acessar a plataforma. Você receberá acesso assim que for aprovado.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status indicator */}
                <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Aguardando aprovação...</span>
                </div>

                {/* Sign out */}
                <Button
                    variant="ghost"
                    onClick={signOut}
                    className="text-white/40 hover:text-white hover:bg-white/5"
                >
                    Sair da conta
                </Button>
            </div>
        </div>
    )
}
