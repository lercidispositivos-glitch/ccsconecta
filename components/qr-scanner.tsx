'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QrCode, Camera, CheckCircle2, XCircle, Loader2, Keyboard } from 'lucide-react'
import type { Event } from '@/lib/types/database'
import { toast } from 'sonner'

interface QrScannerProps {
    event: Event
    open: boolean
    onClose: () => void
}

export default function QrScanner({ event, open, onClose }: QrScannerProps) {
    const [mode, setMode] = useState<'choose' | 'camera' | 'manual'>('choose')
    const [manualCode, setManualCode] = useState('')
    const [processing, setProcessing] = useState(false)
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const scannerRef = useRef<any>(null)
    const supabase = createClient()

    const processCheckin = useCallback(async (qrData: string) => {
        setProcessing(true)
        try {
            // Parse QR data: expected format "EVENT_ID:SECRET"
            let eventId = event.id
            let secret = qrData

            if (qrData.includes(':')) {
                const parts = qrData.split(':')
                eventId = parts[0]
                secret = parts[1]
            }

            const { data, error } = await supabase.rpc('process_checkin', {
                p_event_id: eventId,
                p_qr_secret: secret,
            })

            if (error) {
                setResult({ success: false, message: error.message })
            } else if (data && typeof data === 'object') {
                const res = data as { success: boolean; error?: string; points_awarded?: number; event_title?: string }
                if (res.success) {
                    setResult({
                        success: true,
                        message: `Check-in realizado! +${res.points_awarded} pontos em "${res.event_title}"`,
                    })
                    toast.success(`+${res.points_awarded} pontos!`, {
                        description: `Check-in em "${res.event_title}" realizado com sucesso.`,
                    })
                } else {
                    setResult({ success: false, message: res.error || 'Erro desconhecido' })
                }
            }
        } catch {
            setResult({ success: false, message: 'Erro ao processar check-in. Tente novamente.' })
        }
        setProcessing(false)
    }, [event.id, supabase])

    const startCamera = useCallback(async () => {
        setMode('camera')
        try {
            const { Html5Qrcode } = await import('html5-qrcode')
            const scanner = new Html5Qrcode('qr-reader')
            scannerRef.current = scanner

            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    scanner.stop().catch(() => { })
                    processCheckin(decodedText)
                },
                () => { } // ignore errors during scanning
            )
        } catch (err) {
            console.error('Camera error:', err)
            setMode('manual')
            toast.error('Não foi possível acessar a câmera. Use o código manual.')
        }
    }, [processCheckin])

    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => { })
            }
        }
    }, [])

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (manualCode.trim()) {
            processCheckin(manualCode.trim())
        }
    }

    const handleClose = () => {
        if (scannerRef.current) {
            scannerRef.current.stop().catch(() => { })
        }
        setMode('choose')
        setResult(null)
        setManualCode('')
        onClose()
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-primary" />
                        Check-in: {event.title}
                    </DialogTitle>
                    <DialogDescription>
                        Escaneie o QR Code do evento ou insira o código manualmente.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {result ? (
                        /* Result state */
                        <div className="text-center py-6 space-y-4">
                            {result.success ? (
                                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
                            ) : (
                                <XCircle className="w-16 h-16 text-destructive mx-auto" />
                            )}
                            <p className={`font-medium ${result.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                                {result.message}
                            </p>
                            <Button onClick={handleClose} className="rounded-xl">
                                Fechar
                            </Button>
                        </div>
                    ) : processing ? (
                        /* Processing state */
                        <div className="text-center py-8 space-y-3">
                            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                            <p className="text-sm text-muted-foreground">Processando check-in...</p>
                        </div>
                    ) : mode === 'choose' ? (
                        /* Choice state */
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                onClick={startCamera}
                                className="h-24 flex-col gap-2 rounded-xl hover:bg-primary/5 hover:border-primary/30"
                            >
                                <Camera className="w-8 h-8 text-primary" />
                                <span className="text-xs">Escanear QR</span>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setMode('manual')}
                                className="h-24 flex-col gap-2 rounded-xl hover:bg-accent/5 hover:border-accent/30"
                            >
                                <Keyboard className="w-8 h-8 text-accent" />
                                <span className="text-xs">Código Manual</span>
                            </Button>
                        </div>
                    ) : mode === 'camera' ? (
                        /* Camera state */
                        <div className="space-y-3">
                            <div id="qr-reader" className="w-full rounded-xl overflow-hidden" />
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    if (scannerRef.current) scannerRef.current.stop().catch(() => { })
                                    setMode('manual')
                                }}
                                className="w-full text-sm"
                            >
                                Inserir código manualmente
                            </Button>
                        </div>
                    ) : (
                        /* Manual state */
                        <form onSubmit={handleManualSubmit} className="space-y-3">
                            <div className="space-y-2">
                                <Label htmlFor="code">Código do evento</Label>
                                <Input
                                    id="code"
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    placeholder="Cole o código do QR aqui"
                                    className="rounded-xl"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setMode('choose')}
                                    className="flex-1"
                                >
                                    Voltar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={!manualCode.trim()}
                                    className="flex-1 rounded-xl"
                                >
                                    Confirmar
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
