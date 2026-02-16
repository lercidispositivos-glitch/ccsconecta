'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Mail, Chrome, Loader2, CheckCircle2, Users, Trophy, QrCode, ArrowRight } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [magicLinkSent, setMagicLinkSent] = useState(false)
    const [error, setError] = useState('')
    const supabase = useMemo(() => createClient(), [])

    const handleGoogleLogin = async () => {
        setLoading(true)
        setError('')
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) {
            setError(error.message)
            setLoading(false)
        }
    }

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setLoading(true)
        setError('')
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) {
            setError(error.message)
        } else {
            setMagicLinkSent(true)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)] via-[#001a33] to-[#0a0f1a]" />

            {/* Decorative circles */}
            <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[var(--accent)] opacity-[0.07] blur-3xl" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full bg-[var(--primary)] opacity-[0.1] blur-3xl" />

            {/* Content */}
            <div className="relative z-10 w-full max-w-md space-y-8">
                {/* Logo & Brand */}
                <div className="text-center space-y-3 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
                        <Users className="w-10 h-10 text-[var(--accent)]" />
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">
                        CCS Conecta
                    </h1>
                    <p className="text-white/60 text-sm max-w-xs mx-auto">
                        Conselho de Comércio e Serviços — ACIM Maringá
                    </p>
                </div>

                {/* Features row */}
                <div className="flex justify-center gap-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    {[
                        { icon: Users, label: 'Networking' },
                        { icon: QrCode, label: 'Check-in' },
                        { icon: Trophy, label: 'Gamificação' },
                    ].map((feature) => (
                        <div key={feature.label} className="flex flex-col items-center gap-1.5">
                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                                <feature.icon className="w-5 h-5 text-white/70" />
                            </div>
                            <span className="text-xs text-white/50">{feature.label}</span>
                        </div>
                    ))}
                </div>

                {/* Login card */}
                <Card className="glass border-white/10 shadow-2xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-white text-xl">Acesse sua conta</CardTitle>
                        <CardDescription className="text-white/50">
                            Entre com Google ou receba um link por e-mail
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {error && (
                            <Alert variant="destructive" className="bg-red-500/10 border-red-500/30">
                                <AlertDescription className="text-red-300 text-sm">{error}</AlertDescription>
                            </Alert>
                        )}

                        {magicLinkSent ? (
                            <div className="text-center py-6 space-y-3">
                                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                                <div>
                                    <p className="text-white font-medium">Link enviado!</p>
                                    <p className="text-sm text-white/50 mt-1">
                                        Verifique sua caixa de entrada em <strong className="text-white/80">{email}</strong>
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    className="text-white/60 hover:text-white hover:bg-white/10 mt-2"
                                    onClick={() => { setMagicLinkSent(false); setEmail(''); }}
                                >
                                    Usar outro e-mail
                                </Button>
                            </div>
                        ) : (
                            <>
                                {/* Google button */}
                                <Button
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="w-full h-12 bg-white hover:bg-gray-100 text-gray-800 font-medium text-sm rounded-xl transition-all duration-200 hover:shadow-lg"
                                >
                                    {loading ? (
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    ) : (
                                        <Chrome className="w-5 h-5 mr-2" />
                                    )}
                                    Continuar com Google
                                </Button>

                                {/* Divider */}
                                <div className="flex items-center gap-3">
                                    <Separator className="flex-1 bg-white/10" />
                                    <span className="text-xs text-white/40 uppercase tracking-wider">ou</span>
                                    <Separator className="flex-1 bg-white/10" />
                                </div>

                                {/* Magic link form */}
                                <form onSubmit={handleMagicLink} className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-white/70 text-sm">E-mail</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="seu@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-[var(--accent)] focus:ring-[var(--accent)]/20"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={loading || !email}
                                        className="w-full h-12 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-[#1a1207] font-medium text-sm rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[var(--accent)]/20"
                                    >
                                        {loading ? (
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        ) : (
                                            <Mail className="w-5 h-5 mr-2" />
                                        )}
                                        Enviar Magic Link
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </form>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-xs text-white/30 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    Ao entrar, você aceita os termos de uso do CCS Conecta.
                </p>
            </div>
        </div>
    )
}
