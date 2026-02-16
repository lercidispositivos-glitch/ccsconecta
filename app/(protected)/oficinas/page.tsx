'use client'

import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Handshake, BarChart3, GraduationCap, User, ChevronRight } from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
import type { Workshop } from '@/lib/types/database'

const iconMap: Record<string, typeof Handshake> = {
    handshake: Handshake,
    'bar-chart-3': BarChart3,
    'graduation-cap': GraduationCap,
}

const colorMap: Record<number, { bg: string; text: string; border: string }> = {
    0: {
        bg: 'bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
    },
    1: {
        bg: 'bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
    },
    2: {
        bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
    },
}

export default function OficinasPage() {
    const [workshops, setWorkshops] = useState<Workshop[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        const fetchWorkshops = async () => {
            const { data } = await supabase
                .from('workshops')
                .select('*')
                .order('created_at')
            setWorkshops(data || [])
            setLoading(false)
        }
        fetchWorkshops()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BookOpen className="w-6 h-6 text-primary" />
                    Oficinas
                </h1>
                <p className="text-muted-foreground text-sm">
                    As 3 oficinas que compõem o CCS da ACIM Maringá
                </p>
            </div>

            {/* Workshops */}
            {loading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-muted" />
                                    <div className="space-y-2 flex-1">
                                        <div className="h-5 bg-muted rounded w-1/3" />
                                        <div className="h-4 bg-muted rounded w-2/3" />
                                        <div className="h-3 bg-muted rounded w-1/4" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="space-y-4 stagger-children">
                    {workshops.map((workshop, index) => {
                        const IconComponent = iconMap[workshop.icon] || BookOpen
                        const colors = colorMap[index] || colorMap[0]

                        return (
                            <Card key={workshop.id} className={`overflow-hidden border ${colors.border} hover:shadow-lg transition-all hover:-translate-y-0.5`}>
                                <CardContent className="p-0">
                                    <div className="flex items-stretch">
                                        {/* Icon area */}
                                        <div className={`${colors.bg} w-24 sm:w-32 flex items-center justify-center shrink-0`}>
                                            <IconComponent className={`w-10 h-10 ${colors.text}`} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 p-5 space-y-3">
                                            <div>
                                                <h3 className="font-bold text-lg">{workshop.name}</h3>
                                                <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                                                    {workshop.description}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <User className="w-3.5 h-3.5" />
                                                    <span>Líder:</span>
                                                    <span className="font-medium text-foreground">{workshop.leader_name}</span>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className={`${colors.text} text-xs`}>
                                                +20 pts por participação
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Info card */}
            <Card className="bg-muted/50">
                <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        💡 As oficinas são grupos de trabalho permanentes do CCS. Cada conselheiro pode participar de uma ou mais oficinas para desenvolver competências e contribuir com o conselho.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
