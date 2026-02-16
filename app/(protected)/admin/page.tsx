'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
    Shield, UserCheck, UserX, Users, Calendar, Plus, MapPin, ExternalLink,
    Loader2, CheckCircle2, Clock, BarChart3, QrCode, Trash2, Copy, Tag,
    Repeat, Palette
} from 'lucide-react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import type { Profile, Event, Checkin, EventTypeConfig } from '@/lib/types/database'
import { formatEventType, getEventTypeBadgeClasses, getEventTypeColorClasses, EVENT_TYPE_COLORS } from '@/lib/gamification'
import { QRCodeSVG } from 'qrcode.react'
import { redirect } from 'next/navigation'

export default function AdminPage() {
    const { profile } = useAuth()
    const [pendingUsers, setPendingUsers] = useState<Profile[]>([])
    const [events, setEvents] = useState<Event[]>([])
    const [eventTypes, setEventTypes] = useState<EventTypeConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const supabase = useMemo(() => createClient(), [])

    // New event form
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: 'ACIM - Maringá',
        address: 'R. Neo Alves Martins, 2169 - Zona 01, Maringá - PR',
        maps_url: 'https://maps.app.goo.gl/acim-maringa',
        type: 'reuniao' as string,
        points_value: 10,
        is_recurring: false,
        recurrence_rule: '' as string,
    })
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [qrDialogEvent, setQrDialogEvent] = useState<Event | null>(null)

    // New event type form
    const [newEventType, setNewEventType] = useState({
        name: '',
        label: '',
        color: 'blue',
        default_points: 10,
    })
    const [createTypeDialogOpen, setCreateTypeDialogOpen] = useState(false)

    // Check admin access
    if (profile && profile.role !== 'admin') {
        redirect('/dashboard')
    }

    const fetchData = useCallback(async () => {
        // Fetch pending users
        const { data: pending } = await supabase
            .from('profiles')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
        setPendingUsers(pending || [])

        // Fetch all events
        const { data: evts } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: false })
        setEvents(evts || [])

        // Fetch event types
        const { data: types } = await supabase
            .from('event_types')
            .select('*')
            .order('created_at', { ascending: true })
        setEventTypes(types || [])

        setLoading(false)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const approveUser = async (userId: string) => {
        setActionLoading(userId)
        const { error } = await supabase
            .from('profiles')
            .update({ status: 'approved' })
            .eq('id', userId)

        if (error) {
            toast.error('Erro ao aprovar membro')
        } else {
            toast.success('Membro aprovado!')
            setPendingUsers((prev) => prev.filter((u) => u.id !== userId))
        }
        setActionLoading(null)
    }

    const createEvent = async () => {
        if (!newEvent.title || !newEvent.date || !newEvent.time) {
            toast.error('Preencha título, data e horário')
            return
        }

        setActionLoading('creating')
        const dateTime = `${newEvent.date}T${newEvent.time}:00`

        console.log('[Admin] Creating event with payload:', {
            title: newEvent.title,
            date: dateTime,
            type: newEvent.type,
            created_by: profile?.id
        })

        const { error } = await supabase.from('events').insert({
            title: newEvent.title,
            description: newEvent.description || null,
            date: dateTime,
            location: newEvent.location,
            address: newEvent.address || null,
            maps_url: newEvent.maps_url || null,
            type: newEvent.type,
            points_value: newEvent.points_value,
            is_recurring: newEvent.is_recurring,
            recurrence_rule: newEvent.is_recurring ? newEvent.recurrence_rule || null : null,
            created_by: profile?.id,
        })

        if (error) {
            console.error('[Admin] Event creation error:', error)
            toast.error(`Erro: ${error.message} (${error.code})`)
            console.log('[Admin] Full error object:', JSON.stringify(error, null, 2))
        } else {
            toast.success('Evento criado com sucesso!')
            setCreateDialogOpen(false)
            setNewEvent({
                title: '', description: '', date: '', time: '',
                location: 'ACIM - Maringá',
                address: 'R. Neo Alves Martins, 2169 - Zona 01, Maringá - PR',
                maps_url: 'https://maps.app.goo.gl/acim-maringa',
                type: eventTypes[0]?.name || 'reuniao',
                points_value: eventTypes[0]?.default_points || 10,
                is_recurring: false,
                recurrence_rule: '',
            })
            fetchData()
        }
        setActionLoading(null)
    }

    const deleteEvent = async (eventId: string) => {
        if (!confirm('Tem certeza que deseja excluir este evento?')) return
        setActionLoading(eventId)
        const { error } = await supabase.from('events').delete().eq('id', eventId)
        if (error) {
            toast.error('Erro ao excluir evento')
        } else {
            toast.success('Evento excluído')
            setEvents((prev) => prev.filter((e) => e.id !== eventId))
        }
        setActionLoading(null)
    }

    const createEventType = async () => {
        if (!newEventType.name || !newEventType.label) {
            toast.error('Preencha o identificador e o nome do tipo')
            return
        }

        // Sanitize name: lowercase, replace spaces with underscores
        const sanitizedName = newEventType.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

        setActionLoading('creating_type')
        const { error } = await supabase.from('event_types').insert({
            name: sanitizedName,
            label: newEventType.label,
            color: newEventType.color,
            default_points: newEventType.default_points,
        })

        if (error) {
            console.error('Event type creation error:', error)
            if (error.code === '23505') {
                toast.error('Já existe um tipo com esse identificador')
            } else {
                toast.error(`Erro ao criar tipo: ${error.message}`)
            }
        } else {
            toast.success('Tipo de evento criado!')
            setCreateTypeDialogOpen(false)
            setNewEventType({ name: '', label: '', color: 'blue', default_points: 10 })
            fetchData()
        }
        setActionLoading(null)
    }

    const deleteEventType = async (typeId: string, typeName: string) => {
        // Check if any events use this type
        const eventsUsingType = events.filter((e) => e.type === typeName)
        if (eventsUsingType.length > 0) {
            toast.error(`Não é possível excluir: ${eventsUsingType.length} evento(s) usam este tipo`)
            return
        }
        if (!confirm('Tem certeza que deseja excluir este tipo de evento?')) return
        setActionLoading(typeId)
        const { error } = await supabase.from('event_types').delete().eq('id', typeId)
        if (error) {
            toast.error('Erro ao excluir tipo')
        } else {
            toast.success('Tipo excluído')
            setEventTypes((prev) => prev.filter((t) => t.id !== typeId))
        }
        setActionLoading(null)
    }

    const copyQrSecret = (event: Event) => {
        const code = `${event.id}:${event.qr_code_secret}`
        navigator.clipboard.writeText(code)
        toast.success('Código copiado!')
    }

    const handleTypeChange = (typeName: string) => {
        const found = eventTypes.find((t) => t.name === typeName)
        setNewEvent({
            ...newEvent,
            type: typeName,
            points_value: found?.default_points || 10,
        })
    }

    const recurrenceLabels: Record<string, string> = {
        weekly: 'Semanal',
        biweekly: 'Quinzenal',
        monthly: 'Mensal',
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="w-6 h-6 text-primary" />
                    Painel Admin
                </h1>
                <p className="text-muted-foreground text-sm">
                    Gerencie membros, eventos e acompanhe as atividades
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                <Card>
                    <CardContent className="p-4 text-center">
                        <Clock className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                        <p className="text-2xl font-bold">{pendingUsers.length}</p>
                        <p className="text-xs text-muted-foreground">Pendentes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
                        <p className="text-2xl font-bold">{events.length}</p>
                        <p className="text-xs text-muted-foreground">Eventos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <BarChart3 className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                        <p className="text-2xl font-bold">
                            {events.filter((e) => new Date(e.date) >= new Date()).length}
                        </p>
                        <p className="text-xs text-muted-foreground">Próximos</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="pending">
                <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="pending" className="gap-1.5">
                        <Users className="w-4 h-4" />
                        <span className="hidden sm:inline">Pendentes</span>
                        {pendingUsers.length > 0 && (
                            <Badge variant="destructive" className="text-xs px-1.5 py-0 ml-1">
                                {pendingUsers.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="events" className="gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span className="hidden sm:inline">Eventos</span>
                    </TabsTrigger>
                    <TabsTrigger value="types" className="gap-1.5">
                        <Tag className="w-4 h-4" />
                        <span className="hidden sm:inline">Tipos</span>
                    </TabsTrigger>
                </TabsList>

                {/* Pending users tab */}
                <TabsContent value="pending" className="space-y-3 mt-4">
                    {pendingUsers.length === 0 ? (
                        <div className="text-center py-8">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500/30 mx-auto mb-3" />
                            <p className="text-muted-foreground">Nenhum membro pendente de aprovação.</p>
                        </div>
                    ) : (
                        pendingUsers.map((user) => (
                            <Card key={user.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-10 h-10">
                                            <AvatarImage src={user.photo_url || undefined} />
                                            <AvatarFallback className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                                                {user.full_name?.charAt(0) || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{user.full_name || 'Sem nome'}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => approveUser(user.id)}
                                            disabled={actionLoading === user.id}
                                            className="rounded-xl gap-1.5"
                                        >
                                            {actionLoading === user.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <UserCheck className="w-4 h-4" />
                                            )}
                                            Aprovar
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                {/* Events tab */}
                <TabsContent value="events" className="space-y-3 mt-4">
                    {/* Create event button */}
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full rounded-xl gap-2">
                                <Plus className="w-4 h-4" />
                                Criar Novo Evento
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Novo Evento</DialogTitle>
                                <DialogDescription>
                                    Preencha os dados para criar um novo evento do CCS.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label>Título</Label>
                                    <Input
                                        value={newEvent.title}
                                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                        placeholder="Ex: Reunião Ordinária Fevereiro"
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Descrição (opcional)</Label>
                                    <Input
                                        value={newEvent.description}
                                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                        placeholder="Detalhes do evento"
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label>Data</Label>
                                        <Input
                                            type="date"
                                            value={newEvent.date}
                                            onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Horário</Label>
                                        <Input
                                            type="time"
                                            value={newEvent.time}
                                            onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                                            className="rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Local</Label>
                                    <Input
                                        value={newEvent.location}
                                        onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                        placeholder="Ex: ACIM - Maringá"
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Endereço</Label>
                                    <Input
                                        value={newEvent.address}
                                        onChange={(e) => setNewEvent({ ...newEvent, address: e.target.value })}
                                        placeholder="Ex: R. Neo Alves Martins, 2169 - Zona 01"
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Link Google Maps (opcional)</Label>
                                    <Input
                                        value={newEvent.maps_url}
                                        onChange={(e) => setNewEvent({ ...newEvent, maps_url: e.target.value })}
                                        placeholder="https://maps.app.goo.gl/..."
                                        className="rounded-xl"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label>Tipo</Label>
                                        <select
                                            value={newEvent.type}
                                            onChange={(e) => handleTypeChange(e.target.value)}
                                            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                                        >
                                            {eventTypes.map((et) => (
                                                <option key={et.name} value={et.name}>
                                                    {et.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label>Pontos</Label>
                                        <Input
                                            type="number"
                                            value={newEvent.points_value}
                                            onChange={(e) => setNewEvent({ ...newEvent, points_value: parseInt(e.target.value) || 0 })}
                                            className="rounded-xl"
                                        />
                                    </div>
                                </div>

                                {/* Recurring event section */}
                                <Separator />
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newEvent.is_recurring}
                                                onChange={(e) => setNewEvent({
                                                    ...newEvent,
                                                    is_recurring: e.target.checked,
                                                    recurrence_rule: e.target.checked ? 'monthly' : '',
                                                })}
                                                className="w-4 h-4 rounded border-input"
                                            />
                                            <Repeat className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Evento Recorrente</span>
                                        </label>
                                    </div>
                                    {newEvent.is_recurring && (
                                        <div className="space-y-1.5">
                                            <Label>Frequência</Label>
                                            <select
                                                value={newEvent.recurrence_rule}
                                                onChange={(e) => setNewEvent({ ...newEvent, recurrence_rule: e.target.value })}
                                                className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm"
                                            >
                                                <option value="weekly">Semanal</option>
                                                <option value="biweekly">Quinzenal</option>
                                                <option value="monthly">Mensal</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    onClick={createEvent}
                                    disabled={actionLoading === 'creating'}
                                    className="w-full rounded-xl"
                                >
                                    {actionLoading === 'creating' ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : null}
                                    Criar Evento
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Events list */}
                    {events.map((event) => (
                        <Card key={event.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0">
                                        <span className="text-sm font-bold text-primary">
                                            {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit' })}
                                        </span>
                                        <span className="text-[9px] text-primary/70 uppercase">
                                            {new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' })}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{event.title}</p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <Badge variant="secondary" className={`text-xs ${getEventTypeBadgeClasses(event.type, eventTypes)}`}>
                                                {formatEventType(event.type, eventTypes)}
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs">
                                                +{event.points_value} pts
                                            </Badge>
                                            {event.is_recurring && (
                                                <Badge variant="outline" className="text-xs gap-1">
                                                    <Repeat className="w-3 h-3" />
                                                    {recurrenceLabels[event.recurrence_rule || ''] || 'Recorrente'}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => setQrDialogEvent(event)}
                                            className="h-8 w-8 rounded-lg"
                                            title="Ver QR Code"
                                        >
                                            <QrCode className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => copyQrSecret(event)}
                                            className="h-8 w-8 rounded-lg"
                                            title="Copiar código"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => deleteEvent(event.id)}
                                            disabled={actionLoading === event.id}
                                            className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                                            title="Excluir"
                                        >
                                            {actionLoading === event.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                {/* Event types tab */}
                <TabsContent value="types" className="space-y-3 mt-4">
                    <Dialog open={createTypeDialogOpen} onOpenChange={setCreateTypeDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full rounded-xl gap-2">
                                <Plus className="w-4 h-4" />
                                Novo Tipo de Evento
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Novo Tipo de Evento</DialogTitle>
                                <DialogDescription>
                                    Crie um novo tipo para categorizar seus eventos.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label>Nome (exibição)</Label>
                                    <Input
                                        value={newEventType.label}
                                        onChange={(e) => {
                                            const label = e.target.value
                                            const name = label.toLowerCase()
                                                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                                                .replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
                                            setNewEventType({ ...newEventType, label, name })
                                        }}
                                        placeholder="Ex: Palestra Especial"
                                        className="rounded-xl"
                                    />
                                    {newEventType.label && (
                                        <p className="text-xs text-muted-foreground">
                                            Identificador: <code className="bg-muted px-1 rounded">{newEventType.name}</code>
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Cor</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {EVENT_TYPE_COLORS.map((color) => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setNewEventType({ ...newEventType, color })}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${getEventTypeColorClasses(color)} ${newEventType.color === color
                                                    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105'
                                                    : 'opacity-70 hover:opacity-100'
                                                    }`}
                                            >
                                                {color}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Pontos padrão</Label>
                                    <Input
                                        type="number"
                                        value={newEventType.default_points}
                                        onChange={(e) => setNewEventType({ ...newEventType, default_points: parseInt(e.target.value) || 0 })}
                                        className="rounded-xl"
                                    />
                                </div>
                                <Button
                                    onClick={createEventType}
                                    disabled={actionLoading === 'creating_type'}
                                    className="w-full rounded-xl"
                                >
                                    {actionLoading === 'creating_type' ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : null}
                                    Criar Tipo
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Event types list */}
                    {eventTypes.map((et) => (
                        <Card key={et.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getEventTypeColorClasses(et.color)}`}>
                                        <Tag className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm">{et.label}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs text-muted-foreground">
                                                <code className="bg-muted px-1 rounded">{et.name}</code>
                                            </span>
                                            <Badge variant="secondary" className="text-xs">
                                                {et.default_points} pts
                                            </Badge>
                                        </div>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => deleteEventType(et.id, et.name)}
                                        disabled={actionLoading === et.id}
                                        className="h-8 w-8 rounded-lg text-destructive hover:text-destructive"
                                        title="Excluir tipo"
                                    >
                                        {actionLoading === et.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {eventTypes.length === 0 && (
                        <div className="text-center py-8">
                            <Tag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground">Nenhum tipo de evento cadastrado.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* QR Code Dialog */}
            {qrDialogEvent && (
                <Dialog open={!!qrDialogEvent} onOpenChange={() => setQrDialogEvent(null)}>
                    <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                            <DialogTitle className="text-center">{qrDialogEvent.title}</DialogTitle>
                            <DialogDescription className="text-center">
                                Apresente este QR Code para os membros fazerem check-in
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="bg-white p-4 rounded-2xl">
                                <QRCodeSVG
                                    value={`${qrDialogEvent.id}:${qrDialogEvent.qr_code_secret}`}
                                    size={200}
                                    level="M"
                                />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-xs text-muted-foreground">
                                    {new Date(qrDialogEvent.date).toLocaleDateString('pt-BR', {
                                        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                                    })}
                                </p>
                                <Badge variant="secondary">+{qrDialogEvent.points_value} pontos</Badge>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => copyQrSecret(qrDialogEvent)}
                                className="gap-2 rounded-xl"
                            >
                                <Copy className="w-4 h-4" />
                                Copiar Código
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
