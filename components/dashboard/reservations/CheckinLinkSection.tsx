'use client'

import { useEffect, useState, useCallback } from 'react'
import { Link2, Copy, RefreshCw, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { generateCheckinLink, getCheckinLinkStatus, type CheckinLinkStatus } from '@/app/actions/checkin'

interface CheckinLinkSectionProps {
  reservationId: string
  canManage: boolean
}

export function CheckinLinkSection({ reservationId, canManage }: CheckinLinkSectionProps) {
  const [status, setStatus] = useState<CheckinLinkStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const loadStatus = useCallback(async () => {
    setLoading(true)
    const { data } = await getCheckinLinkStatus(reservationId)
    if (data) setStatus(data)
    setLoading(false)
  }, [reservationId])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  async function handleGenerate() {
    setGenerating(true)
    const { url, error } = await generateCheckinLink(reservationId)
    setGenerating(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success('Enlace de check-in generado')
    await loadStatus()
    if (url) await copyToClipboard(url)
  }

  async function copyToClipboard(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Enlace copiado al portapapeles')
    } catch {
      toast.error('No se pudo copiar el enlace')
    }
  }

  if (loading) return null

  return (
    <div className="bg-white border border-[#eef2f7] rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400">
          Check-in online
        </p>
        {status?.hasLink && (
          <span className="text-[11px] text-slate-500">
            {status.guestsSubmitted}/{status.guestsExpected} huéspedes registrados
            {status.completedAt && (
              <CheckCircle2 className="inline h-3.5 w-3.5 text-emerald-500 ml-1 -mt-0.5" />
            )}
          </span>
        )}
      </div>

      {status?.hasLink && status.url ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 bg-[#f8fafc] rounded-lg px-3 py-2 text-[12px] text-slate-600 truncate font-mono">
            {status.url}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full h-8 w-8 p-0 shrink-0"
            onClick={() => copyToClipboard(status.url!)}
            title="Copiar enlace"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full h-8 w-8 p-0 shrink-0"
              disabled={generating}
              onClick={handleGenerate}
              title="Regenerar enlace"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ) : canManage ? (
        <Button
          size="sm"
          variant="outline"
          className="rounded-full text-[12px] h-8 gap-1.5"
          disabled={generating}
          onClick={handleGenerate}
        >
          <Link2 className="h-3.5 w-3.5" />
          {generating ? 'Generando…' : 'Generar enlace de check-in'}
        </Button>
      ) : (
        <p className="text-[12px] text-slate-400">Sin enlace de check-in generado.</p>
      )}
    </div>
  )
}
