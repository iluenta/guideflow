'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { scanDocument } from '@/app/actions/checkin'
import type { ExtractedGuestDocumentData } from '@/types/checkin'

interface DocumentScannerProps {
  token: string
  onScanned: (data: ExtractedGuestDocumentData) => void
}

const MAX_DIMENSION = 1800 // suficiente para que Gemini lea texto/MRZ, sin disparar el peso del envío

export function DocumentScanner({ token, onScanned }: DocumentScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [scanning, setScanning] = useState(false)

  // Liberar la cámara siempre al desmontar — si no, el indicador de cámara
  // del móvil se queda encendido aunque el huésped haya pasado de pantalla.
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  // El <video> solo existe en el DOM cuando cameraActive es true — engancharle
  // el stream aquí (no con requestAnimationFrame) garantiza que ya está montado,
  // porque los efectos corren después de que React confirma el commit.
  useEffect(() => {
    const video = videoRef.current
    if (cameraActive && video && streamRef.current) {
      video.srcObject = streamRef.current
      video.play().catch(() => {})
    }
  }, [cameraActive])

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Este navegador no permite acceder a la cámara aquí. Rellena los datos manualmente.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      setCameraActive(true)
    } catch {
      toast.error('No se pudo acceder a la cámara. Puedes rellenar los datos manualmente.')
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraActive(false)
  }

  async function handleCapture() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return

    const scale = Math.min(1, MAX_DIMENSION / Math.max(video.videoWidth, video.videoHeight))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1] ?? ''

    stopCamera()
    setScanning(true)
    try {
      const { data, error } = await scanDocument(token, base64, 'image/jpeg')
      if (error || !data) {
        toast.error(error || 'No se pudo leer el documento')
        return
      }
      if (data.confidence === 'low') {
        toast.warning('No se han podido leer bien todos los datos, revísalos antes de continuar')
      }
      onScanned(data)
    } catch {
      toast.error('Error al procesar la imagen')
    } finally {
      setScanning(false)
    }
  }

  if (cameraActive) {
    return (
      <div className="space-y-3">
        <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          {/* Marco guía puramente visual — no recorta ni analiza la imagen */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
            <div className="w-full aspect-[16/10] border-2 border-white/90 rounded-xl shadow-[0_0_0_2000px_rgba(0,0,0,0.35)]" />
          </div>
          <button
            type="button"
            onClick={stopCamera}
            aria-label="Cancelar"
            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-black/50 text-white flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-[13px] text-slate-500 text-center">
          Encuadra el documento dentro del marco y haz la foto.
        </p>
        <Button
          type="button"
          className="w-full rounded-full h-14 gap-2"
          disabled={scanning}
          onClick={handleCapture}
        >
          {scanning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Leyendo documento…
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              Hacer foto
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div>
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-2xl h-14 gap-2"
        disabled={scanning}
        onClick={startCamera}
      >
        <Camera className="h-4 w-4" />
        Escanear DNI / NIE / Pasaporte
      </Button>
      <p className="text-[11px] text-slate-400 text-center mt-2">
        También puedes rellenar los datos a mano si prefieres.
      </p>
    </div>
  )
}
