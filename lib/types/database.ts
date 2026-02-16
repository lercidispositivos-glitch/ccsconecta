export type UserRole = 'admin' | 'member'
export type UserStatus = 'pending' | 'approved'

export interface EventTypeConfig {
    id: string
    name: string
    label: string
    color: string
    default_points: number
    created_at: string
}

export interface Profile {
    id: string
    full_name: string | null
    company_name: string | null
    whatsapp: string | null
    photo_url: string | null
    role: UserRole
    status: UserStatus
    points_balance: number
    created_at: string
    updated_at: string
}

export interface Workshop {
    id: string
    name: string
    description: string
    leader_name: string
    icon: string
    created_at: string
}

export interface Event {
    id: string
    title: string
    description: string | null
    date: string
    location: string
    address: string | null
    maps_url: string | null
    type: string
    is_recurring: boolean
    recurrence_rule: string | null
    workshop_id: string | null
    qr_code_secret: string
    points_value: number
    created_by: string
    created_at: string
}

export interface Checkin {
    id: string
    user_id: string
    event_id: string
    checked_in_at: string
}

// Join types
export interface EventWithWorkshop extends Event {
    workshops?: Workshop | null
}

export interface CheckinWithEvent extends Checkin {
    events?: Event | null
}

export interface CheckinWithProfile extends Checkin {
    profiles?: Profile | null
}
