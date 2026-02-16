'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, Calendar, BookOpen, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
    { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
    { href: '/membros', label: 'Membros', icon: Users },
    { href: '/eventos', label: 'Eventos', icon: Calendar },
    { href: '/oficinas', label: 'Oficinas', icon: BookOpen },
    { href: '/perfil', label: 'Perfil', icon: User },
]

export default function BottomNav() {
    const pathname = usePathname()

    return (
        <nav className="fixed bottom-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50 sm:hidden">
            <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[56px]',
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            <div className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
                                isActive && 'bg-primary/10'
                            )}>
                                <item.icon className={cn('w-5 h-5', isActive && 'scale-110')} />
                            </div>
                            <span className={cn(
                                'text-[10px] font-medium transition-all',
                                isActive && 'font-semibold'
                            )}>
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
