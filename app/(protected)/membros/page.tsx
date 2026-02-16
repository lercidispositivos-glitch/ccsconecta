'use client'

import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getBadge } from '@/lib/gamification'
import { Search, Building2, Phone, Users } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
import type { Profile } from '@/lib/types/database'

export default function MembrosPage() {
    const [members, setMembers] = useState<Profile[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        const fetchMembers = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('status', 'approved')
                .order('full_name')
            setMembers(data || [])
            setLoading(false)
        }
        fetchMembers()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const filteredMembers = useMemo(() => {
        if (!search) return members
        const q = search.toLowerCase()
        return members.filter(
            (m) =>
                m.full_name?.toLowerCase().includes(q) ||
                m.company_name?.toLowerCase().includes(q)
        )
    }, [members, search])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="w-6 h-6 text-primary" />
                    Membros do CCS
                </h1>
                <p className="text-muted-foreground text-sm">
                    {members.length} conselheiros ativos
                </p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nome ou empresa..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-11 rounded-xl"
                />
            </div>

            {/* Members grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-muted" />
                                    <div className="space-y-2 flex-1">
                                        <div className="h-4 bg-muted rounded w-2/3" />
                                        <div className="h-3 bg-muted rounded w-1/2" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="text-center py-12">
                    <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhum membro encontrado.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 stagger-children">
                    {filteredMembers.map((member) => {
                        const badge = getBadge(member.points_balance)
                        const initials = member.full_name
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2) || '?'

                        return (
                            <Card key={member.id} className="hover:shadow-md transition-all hover:-translate-y-0.5 group">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="w-12 h-12 ring-2 ring-border group-hover:ring-primary/30 transition-all">
                                            <AvatarImage src={member.photo_url || undefined} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                                {initials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0 space-y-1.5">
                                            <div>
                                                <p className="font-semibold text-sm truncate">{member.full_name || 'Membro'}</p>
                                                {member.company_name && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                                        <Building2 className="w-3 h-3 shrink-0" />
                                                        {member.company_name}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" className={`${badge.bgColor} ${badge.color} text-xs px-2 py-0`}>
                                                    <badge.icon className="w-3 h-3 mr-1" />
                                                    {member.points_balance} pts
                                                </Badge>
                                                {member.whatsapp && (
                                                    <a
                                                        href={`https://wa.me/55${member.whatsapp.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-500 transition-colors"
                                                    >
                                                        <Phone className="w-3 h-3" />
                                                        WhatsApp
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
