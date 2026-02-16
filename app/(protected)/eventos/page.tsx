'use client'

import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatEventType, getEventTypeBadgeClasses } from '@/lib/gamification'
import { Calendar, MapPin, Clock, QrCode, ChevronRight, Loader2, ExternalLink, Repeat } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
import type { Event, EventTypeConfig } from '@/lib/types/database'
import QrScanner from '@/components/qr-scanner'

export default function EventosPage() {
    const [events, setEvents] = useState<Event[]>([])
    const [eventTypes, setEventTypes] = useState<EventTypeConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [scannerOpen, setScannerOpen] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        const fetchData = async () => {
            const [eventsRes, typesRes] = await Promise.all([
                supabase
                    .from('events')
                    .select('*')
                    .order('date', { ascending: false }),
                supabase
                    .from('event_types')
                    .select('*')
                    .order('created_at', { ascending: true }),
            ])
            setEvents(eventsRes.data || [])
            setEventTypes(typesRes.data || [])
            setLoading(false)
        }
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const upcomingEvents = events.filter(e => new Date(e.date) >= new Date())
    const pastEvents = events.filter(e => new Date(e.date) < new Date())

    const handleCheckin = (event: Event) => {
        setSelectedEvent(event)
        setScannerOpen(true)
    }

    const recurrenceLabels: Record<string, string> = {
        weekly: 'Semanal',
        biweekly: 'Quinzenal',
        monthly: 'Mensal',
    }

    const renderEventCard = (event: Event, isPast: boolean) => (
        <Card key={event.id} className={`hover:shadow-md transition-all ${isPast ? 'opacity-60' : 'hover:-translate-y-0.5'}`}>
            <CardContent className="p-4">
                <div className="flex items-start gap-3">
                    {/* Date badge */}
                    <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${isPast ? 'bg-muted' : 'bg-primary/10'
                        }`}>
                        <span className={`text-lg font-bold ${isPast ? 'text-muted-foreground' : 'text-primary'}`}>
                            {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit' })}
                        </span>
                        <span className={`text-[10px] uppercase ${isPast ? 'text-muted-foreground' : 'text-primary/70'}`}>
                            {new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' })}
                        </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                        <div>
                            <p className="font-semibold text-sm">{event.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {event.maps_url ? (
                                        <a
                                            href={event.maps_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-primary hover:underline flex items-center gap-0.5"
                                        >
                                            {event.location}
                                            <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                    ) : (
                                        event.location
                                    )}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            {event.address && (
                                <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
                                    {event.address}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
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

                    {/* Check-in button */}
                    {!isPast && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckin(event)}
                            className="shrink-0 rounded-xl gap-1.5"
                        >
                            <QrCode className="w-4 h-4" />
                            <span className="hidden sm:inline">Check-in</span>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-primary" />
                        Eventos
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Reuniões, oficinas e ações do CCS
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    {/* Upcoming events */}
                    {upcomingEvents.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Próximos
                            </h2>
                            <div className="space-y-3 stagger-children">
                                {upcomingEvents.map((e) => renderEventCard(e, false))}
                            </div>
                        </div>
                    )}

                    {/* Past events */}
                    {pastEvents.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Anteriores
                            </h2>
                            <div className="space-y-3">
                                {pastEvents.map((e) => renderEventCard(e, true))}
                            </div>
                        </div>
                    )}

                    {events.length === 0 && (
                        <div className="text-center py-12">
                            <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground">Nenhum evento cadastrado.</p>
                        </div>
                    )}
                </>
            )}

            {/* QR Scanner Dialog */}
            {scannerOpen && selectedEvent && (
                <QrScanner
                    event={selectedEvent}
                    open={scannerOpen}
                    onClose={() => { setScannerOpen(false); setSelectedEvent(null) }}
                />
            )}
        </div>
    )
}
