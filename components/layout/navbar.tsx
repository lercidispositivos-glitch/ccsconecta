'use client'

import { useAuth } from '@/lib/contexts/auth-context'
import { getBadge } from '@/lib/gamification'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Users, LogOut, User, Shield, Moon, Sun } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Navbar() {
    const { profile, signOut } = useAuth()
    const [dark, setDark] = useState(false)

    useEffect(() => {
        const isDark = document.documentElement.classList.contains('dark')
        setDark(isDark)
    }, [])

    const toggleTheme = () => {
        document.documentElement.classList.toggle('dark')
        setDark(!dark)
    }

    const badge = profile ? getBadge(profile.points_balance) : null
    const initials = profile?.full_name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || '?'

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-4 max-w-5xl mx-auto">
                {/* Logo */}
                <Link href="/dashboard" className="flex items-center gap-2.5 group">
                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Users className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="hidden sm:block">
                        <span className="font-bold text-foreground text-sm">CCS Conecta</span>
                        <p className="text-[10px] text-muted-foreground -mt-0.5">ACIM Maringá</p>
                    </div>
                </Link>

                {/* Right side */}
                <div className="flex items-center gap-2">
                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    >
                        {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>

                    {/* Points badge */}
                    {badge && (
                        <Badge variant="secondary" className={`${badge.bgColor} ${badge.color} hidden sm:flex gap-1 text-xs`}>
                            <badge.icon className="w-3 h-3" />
                            {profile?.points_balance} pts
                        </Badge>
                    )}

                    {/* User menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-muted transition-all">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={profile?.photo_url || undefined} />
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate">
                                    {profile?.full_name || 'Usuário'}
                                </span>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                                <Link href="/perfil" className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Meu Perfil
                                </Link>
                            </DropdownMenuItem>
                            {profile?.role === 'admin' && (
                                <DropdownMenuItem asChild>
                                    <Link href="/admin" className="flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        Painel Admin
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                                <LogOut className="w-4 h-4 mr-2" />
                                Sair
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
