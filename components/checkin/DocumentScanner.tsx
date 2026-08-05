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

// Parámetros del auto-disparo: heurística, no detección real de documento.
// Solo mira si la imagen lleva un rato quieta y si hay suficiente detalle
// (texto/bordes) dentro del marco — no comprueba que sea realmente un DNI.
const SAMPLE_INTERVAL_MS = 150
const STABLE_DURATION_MS = 1200
const MOVEMENT_THRESHOLD = 8 // diferencia media de brillo (0-255) entre muestras para considerarlo "quieto"
const MIN_CONTRAST = 18 // desviación típica de brillo mínima para descartar apuntar a una superficie lisa

export function DocumentScanner({ token, onScanned }: DocumentScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [aligning, setAligning] = useState(false)

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

  // Auto-disparo: cada SAMPLE_INTERVAL_MS compara la imagen actual con la
  // anterior en una miniatura barata de procesar. Si lleva STABLE_DURATION_MS
  // sin apenas cambiar Y hay contraste suficiente (no es una superficie lisa),
  // dispara la captura sola. Es una aproximación, no detección real del
  // documento — por eso el botón manual sigue ahí como alternativa siempre.
  useEffect(() => {
    if (!cameraActive) {
      setAligning(false)
      return
    }

    const sampleCanvas = document.createElement('canvas')
    sampleCanvas.width = 48
    sampleCanvas.height = 36
    const ctx = sampleCanvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    let lastGray: Float32Array | null = null
    let stableSince: number | null = null
    let fired = false

    const intervalId = window.setInterval(() => {
      const video = videoRef.current
      if (fired || !video || !video.videoWidth) return

      ctx.drawImage(video, 0, 0, sampleCanvas.width, sampleCanvas.height)
      const { data } = ctx.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height)
      const pixelCount = sampleCanvas.width * sampleCanvas.height
      const gray = new Float32Array(pixelCount)
      for (let i = 0, p = 0; p < pixelCount; i += 4, p++) {
        gray[p] = (data[i] + data[i + 1] + data[i + 2]) / 3
      }

      let sum = 0
      for (let p = 0; p < pixelCount; p++) sum += gray[p]
      const mean = sum / pixelCount
      let variance = 0
      for (let p = 0; p < pixelCount; p++) variance += (gray[p] - mean) ** 2
      const contrast = Math.sqrt(variance / pixelCount)

      let movement = 0
      if (lastGray) {
        let diffSum = 0
        for (let p = 0; p < pixelCount; p++) diffSum += Math.abs(gray[p] - lastGray[p])
        movement = diffSum / pixelCount
      }
      lastGray = gray

      const steadyAndDetailed = movement < MOVEMENT_THRESHOLD && contrast > MIN_CONTRAST
      if (!steadyAndDetailed) {
        stableSince = null
        setAligning(false)
        return
      }

      if (stableSince === null) stableSince = Date.now()
      setAligning(true)
      if (Date.now() - stableSince >= STABLE_DURATION_MS) {
        fired = true
        setAligning(false)
        handleCapture()
      }
    }, SAMPLE_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
    // handleCapture no cambia su comportamiento entre renders (usa refs para
    // todo lo mutable) — omitirla evita reiniciar el temporizador de estabilidad.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <div
              className={`w-full aspect-[16/10] border-[3px] rounded-xl shadow-[0_0_0_2000px_rgba(0,0,0,0.35)] transition-colors duration-200 ${
                aligning ? 'border-emerald-400' : 'border-white/90'
              }`}
            />
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
        <p className={`text-[13px] text-center font-medium ${aligning ? 'text-emerald-600' : 'text-slate-500'}`}>
          {aligning ? 'Quieto… capturando' : 'Encuadra el documento dentro del marco'}
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
