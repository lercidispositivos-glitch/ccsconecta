import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Do NOT run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it
    // very hard to debug issues with users being randomly logged out.

    let user = null
    try {
        const { data, error } = await supabase.auth.getUser()
        if (error) {
            // If the refresh token is invalid/expired, clear the auth cookies
            // so the user can start fresh
            console.error('[Middleware] Auth error:', error.message)

            // Clear all supabase auth cookies to prevent the error loop
            const response = NextResponse.next({ request })
            request.cookies.getAll().forEach((cookie) => {
                if (cookie.name.startsWith('sb-')) {
                    response.cookies.delete(cookie.name)
                }
            })

            // If trying to access protected routes, redirect to login
            if (
                !request.nextUrl.pathname.startsWith('/login') &&
                !request.nextUrl.pathname.startsWith('/auth') &&
                request.nextUrl.pathname !== '/'
            ) {
                const url = request.nextUrl.clone()
                url.pathname = '/login'
                const redirectResponse = NextResponse.redirect(url)
                request.cookies.getAll().forEach((cookie) => {
                    if (cookie.name.startsWith('sb-')) {
                        redirectResponse.cookies.delete(cookie.name)
                    }
                })
                return redirectResponse
            }

            return response
        }
        user = data.user
    } catch (err) {
        console.error('[Middleware] Unexpected auth error:', err)
    }

    // If user is not logged in and trying to access protected routes
    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/auth') &&
        request.nextUrl.pathname !== '/'
    ) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // If user is logged in and on login page, redirect to dashboard
    if (user && request.nextUrl.pathname === '/login') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
