'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { getBadge, getNextBadge, getProgressToNextBadge, formatEventType } from '@/lib/gamification'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, Calendar, Star, TrendingUp, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState, useMemo } from 'react'
import type { Event, Profile } from '@/lib/types/database'

export default function DashboardPage() {
    const { profile } = useAuth()
    const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
    const [topMembers, setTopMembers] = useState<Profile[]>([])
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        const fetchData = async () => {
            // Fetch upcoming events
            const { data: events } = await supabase
                .from('events')
                .select('*')
                .gte('date', new Date().toISOString())
                .order('date', { ascending: true })
                .limit(3)
            setUpcomingEvents(events || [])

            // Fetch top members
            const { data: members } = await supabase
                .from('profiles')
                .select('*')
                .eq('status', 'approved')
                .order('points_balance', { ascending: false })
                .limit(5)
            setTopMembers(members || [])
        }
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (!profile) return null

    const badge = getBadge(profile.points_balance)
    const nextBadge = getNextBadge(profile.points_balance)
    const progress = getProgressToNextBadge(profile.points_balance)

    return (
        <div className="space-y-6 stagger-children">
            {/* Welcome header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-foreground">
                    Olá, {profile.full_name?.split(' ')[0] || 'Membro'}! 👋
                </h1>
                <p className="text-muted-foreground text-sm">
                    Confira suas conquistas e próximos eventos do CCS.
                </p>
            </div>

            {/* Points & Badge card */}
            <Card className="overflow-hidden border-0 shadow-lg">
                <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
                    <div className="flex items-start justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <badge.icon className="w-5 h-5" />
                                <span className="text-sm font-medium opacity-90">{badge.label}</span>
                            </div>
                            <div className="space-y-0.5">
                                <p className="text-4xl font-bold">{profile.points_balance}</p>
                                <p className="text-xs opacity-70">pontos acumulados</p>
                            </div>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center badge-pulse">
                            <Sparkles className="w-8 h-8 text-accent" />
                        </div>
                    </div>

                    {/* Progress to next badge */}
                    {nextBadge && (
                        <div className="mt-5 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="opacity-70">Próximo nível</span>
                                <span className="font-medium">{nextBadge.label}</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-accent transition-all duration-1000 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs opacity-60">
                                Faltam {nextBadge.minPoints - profile.points_balance} pontos
                            </p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
                <Link href="/eventos" className="block">
                    <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                <Calendar className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Eventos</p>
                                <p className="text-xs text-muted-foreground">Ver agenda</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/membros" className="block">
                    <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                                <TrendingUp className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Membros</p>
                                <p className="text-xs text-muted-foreground">Networking</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Upcoming events */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Próximos Eventos</CardTitle>
                        <Link href="/eventos" className="text-xs text-primary hover:underline flex items-center gap-1">
                            Ver todos <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {upcomingEvents.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento agendado.</p>
                    ) : (
                        upcomingEvents.map((event) => (
                            <div key={event.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                                    <span className="text-xs font-bold text-primary">
                                        {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit' })}
                                    </span>
                                    <span className="text-[10px] text-primary/70 uppercase">
                                        {new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' })}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{event.title}</p>
                                    <p className="text-xs text-muted-foreground">{event.location}</p>
                                </div>
                                <Badge variant="secondary" className="text-xs shrink-0">
                                    +{event.points_value} pts
                                </Badge>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            {/* Leaderboard */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-accent" />
                            Ranking
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    {topMembers.map((member, index) => {
                        const memberBadge = getBadge(member.points_balance)
                        const isCurrentUser = member.id === profile.id
                        return (
                            <div
                                key={member.id}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isCurrentUser ? 'bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-muted/50'
                                    }`}
                            >
                                <span className={`w-6 text-center text-sm font-bold ${index === 0 ? 'text-amber-500' :
                                    index === 1 ? 'text-gray-400' :
                                        index === 2 ? 'text-amber-700' :
                                            'text-muted-foreground'
                                    }`}>
                                    {index + 1}º
                                </span>
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={member.photo_url || undefined} />
                                    <AvatarFallback className="text-xs bg-muted">
                                        {member.full_name?.charAt(0) || '?'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {member.full_name || 'Membro'}
                                        {isCurrentUser && <span className="text-primary ml-1 text-xs">(você)</span>}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{member.company_name || ''}</p>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <memberBadge.icon className={`w-3.5 h-3.5 ${memberBadge.color}`} />
                                    <span className="text-sm font-semibold">{member.points_balance}</span>
                                </div>
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}
