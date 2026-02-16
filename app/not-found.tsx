import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
            <div className="text-center space-y-4 max-w-md">
                <h1 className="text-6xl font-bold text-primary">404</h1>
                <h2 className="text-xl font-semibold text-foreground">Página não encontrada</h2>
                <p className="text-muted-foreground text-sm">
                    A página que você procura não existe ou foi movida.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                >
                    Voltar ao início
                </Link>
            </div>
        </div>
    )
}
