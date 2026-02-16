import { Award, Star, Trophy } from 'lucide-react'
import type { EventTypeConfig } from '@/lib/types/database'

// Points awarded per action type
export const POINTS = {
    REUNIAO: 10,
    OFICINA: 20,
    ACAO_SOCIAL: 30,
    INDICACAO: 50,
} as const

export type BadgeLevel = 'iniciante' | 'engajado' | 'embaixador'

export interface Badge {
    level: BadgeLevel
    label: string
    minPoints: number
    maxPoints: number | null
    color: string
    bgColor: string
    icon: typeof Award
}

export const BADGES: Badge[] = [
    {
        level: 'iniciante',
        label: 'Membro Iniciante',
        minPoints: 0,
        maxPoints: 99,
        color: 'text-zinc-600 dark:text-zinc-400',
        bgColor: 'bg-zinc-100 dark:bg-zinc-800',
        icon: Award,
    },
    {
        level: 'engajado',
        label: 'Membro Engajado',
        minPoints: 100,
        maxPoints: 499,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-950',
        icon: Star,
    },
    {
        level: 'embaixador',
        label: 'Embaixador CCS',
        minPoints: 500,
        maxPoints: null,
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-50 dark:bg-amber-950',
        icon: Trophy,
    },
]

export function getBadge(points: number): Badge {
    if (points >= 500) return BADGES[2]
    if (points >= 100) return BADGES[1]
    return BADGES[0]
}

export function getNextBadge(points: number): Badge | null {
    if (points >= 500) return null
    if (points >= 100) return BADGES[2]
    return BADGES[1]
}

export function getProgressToNextBadge(points: number): number {
    const next = getNextBadge(points)
    if (!next) return 100
    const current = getBadge(points)
    const range = next.minPoints - current.minPoints
    const progress = points - current.minPoints
    return Math.round((progress / range) * 100)
}

// Hardcoded fallback map for when event_types aren't loaded
const FALLBACK_LABELS: Record<string, string> = {
    reuniao: 'Reunião Ordinária',
    oficina: 'Oficina',
    acao_social: 'Ação Social',
}

const FALLBACK_POINTS: Record<string, number> = {
    reuniao: 10,
    oficina: 20,
    acao_social: 30,
}

export function formatEventType(type: string, eventTypes?: EventTypeConfig[]): string {
    if (eventTypes) {
        const found = eventTypes.find((et) => et.name === type)
        if (found) return found.label
    }
    return FALLBACK_LABELS[type] || type
}

export function getPointsForEventType(type: string, eventTypes?: EventTypeConfig[]): number {
    if (eventTypes) {
        const found = eventTypes.find((et) => et.name === type)
        if (found) return found.default_points
    }
    return FALLBACK_POINTS[type] || POINTS.REUNIAO
}

// Color map for event type badges
const FALLBACK_COLORS: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    cyan: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
    orange: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    pink: 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
}

export const EVENT_TYPE_COLORS = Object.keys(FALLBACK_COLORS)

export function getEventTypeColorClasses(color: string): string {
    return FALLBACK_COLORS[color] || FALLBACK_COLORS.blue
}

export function getEventTypeBadgeClasses(type: string, eventTypes?: EventTypeConfig[]): string {
    if (eventTypes) {
        const found = eventTypes.find((et) => et.name === type)
        if (found) return getEventTypeColorClasses(found.color)
    }
    // Fallback for legacy hardcoded types
    const legacy: Record<string, string> = {
        reuniao: FALLBACK_COLORS.blue,
        oficina: FALLBACK_COLORS.purple,
        acao_social: FALLBACK_COLORS.emerald,
    }
    return legacy[type] || FALLBACK_COLORS.blue
}
