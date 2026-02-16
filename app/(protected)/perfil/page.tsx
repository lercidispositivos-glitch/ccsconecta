'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { getBadge, getNextBadge, getProgressToNextBadge } from '@/lib/gamification'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, Save, Loader2, Trophy, CheckCircle2 } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import type { Checkin, Event } from '@/lib/types/database'

interface CheckinWithEvent extends Checkin {
    events: Event
}

export default function PerfilPage() {
    const { profile, refreshProfile } = useAuth()
    const [fullName, setFullName] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [whatsapp, setWhatsapp] = useState('')
    const [saving, setSaving] = useState(false)
    const [checkins, setCheckins] = useState<CheckinWithEvent[]>([])
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '')
            setCompanyName(profile.company_name || '')
            setWhatsapp(profile.whatsapp || '')
        }
    }, [profile])

    useEffect(() => {
        const fetchCheckins = async () => {
            if (!profile) return
            const { data } = await supabase
                .from('checkins')
                .select('*, events(*)')
                .eq('user_id', profile.id)
                .order('checked_in_at', { ascending: false })
                .limit(10)
            setCheckins((data as CheckinWithEvent[]) || [])
        }
        fetchCheckins()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile])

    const handleSave = async () => {
        if (!profile) return
        setSaving(true)
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: fullName,
                company_name: companyName,
                whatsapp,
            })
            .eq('id', profile.id)

        if (error) {
            toast.error('Erro ao salvar perfil')
        } else {
            toast.success('Perfil atualizado com sucesso!')
            await refreshProfile()
        }
        setSaving(false)
    }

    if (!profile) return null

    const badge = getBadge(profile.points_balance)
    const nextBadge = getNextBadge(profile.points_balance)
    const progress = getProgressToNextBadge(profile.points_balance)

    const initials = profile.full_name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?'

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <User className="w-6 h-6 text-primary" />
                    Meu Perfil
                </h1>
                <p className="text-muted-foreground text-sm">
                    Gerencie suas informações e acompanhe sua evolução
                </p>
            </div>

            {/* Profile card */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                        <Avatar className="w-20 h-20 ring-4 ring-primary/10">
                            <AvatarImage src={profile.photo_url || undefined} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1.5 flex-1">
                            <h2 className="text-xl font-bold">{profile.full_name || 'Membro'}</h2>
                            {profile.company_name && (
                                <p className="text-sm text-muted-foreground">{profile.company_name}</p>
                            )}
                            <div className="flex items-center gap-2 justify-center sm:justify-start">
                                <Badge variant="secondary" className={`${badge.bgColor} ${badge.color} gap-1`}>
                                    <badge.icon className="w-3 h-3" />
                                    {badge.label}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                    {profile.points_balance} pts
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Progress bar */}
                    {nextBadge && (
                        <div className="mt-5 space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{badge.label}</span>
                                <span>{nextBadge.label}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-primary transition-all duration-1000"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                Faltam {nextBadge.minPoints - profile.points_balance} pontos para {nextBadge.label}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit form */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Nome completo</Label>
                        <Input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Seu nome completo"
                            className="rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="companyName">Empresa</Label>
                        <Input
                            id="companyName"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Nome da sua empresa"
                            className="rounded-xl"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                        <Input
                            id="whatsapp"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            placeholder="(44) 99999-9999"
                            className="rounded-xl"
                        />
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Salvar Alterações
                    </Button>
                </CardContent>
            </Card>

            {/* Recent check-ins */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-accent" />
                        Últimos Check-ins
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {checkins.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum check-in registrado ainda.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {checkins.map((checkin) => (
                                <div key={checkin.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{checkin.events?.title || 'Evento'}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(checkin.checked_in_at).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="text-xs shrink-0">
                                        +{checkin.events?.points_value || 0} pts
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
