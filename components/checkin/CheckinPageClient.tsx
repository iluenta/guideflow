'use client'

import { useState } from 'react'
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { GuestForm } from './GuestForm'
import { calculateAge } from '@/lib/checkin/guest-utils'

interface CheckinPageClientProps {
  token: string
  propertyName: string
  checkinDate: string
  checkoutDate: string
  guestsCount: number
}

interface SavedGuest {
  guestOrder: number
  isMinor: boolean
}

export function CheckinPageClient({ token, propertyName, checkinDate, checkoutDate, guestsCount }: CheckinPageClientProps) {
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [started, setStarted] = useState(false)
  const [savedGuests, setSavedGuests] = useState<SavedGuest[]>([])
  const [openGuest, setOpenGuest] = useState<number | null>(null)

  const allDone = savedGuests.length >= guestsCount
  const hasMinorInGroup = savedGuests.some(g => g.isMinor)

  function handleSaved(guestOrder: number, birthDate: string) {
    const age = calculateAge(birthDate, checkinDate)
    setSavedGuests(prev => [...prev.filter(g => g.guestOrder !== guestOrder), { guestOrder, isMinor: age < 14 }])
    setOpenGuest(null)
  }

  return (
    <div className="min-h-screen bg-white font-sans flex flex-col">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3.5 flex items-center gap-3">
        {openGuest !== null && (
          <button
            type="button"
            onClick={() => setOpenGuest(null)}
            className="text-slate-500 shrink-0 -ml-1 p-1"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex-1 text-center">
          <p className="text-[15px] font-bold text-slate-900 truncate">{propertyName}</p>
          {openGuest !== null && (
            <p className="text-[11px] text-slate-400 uppercase tracking-wide">Huésped {openGuest}</p>
          )}
        </div>
        {openGuest !== null && <div className="w-5 shrink-0" />}
      </header>

      <div className="flex-1 w-full max-w-md mx-auto px-5 py-6">
        {allDone ? (
          <div className="text-center space-y-3 pt-10">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <p className="text-[17px] font-bold text-slate-900">Check-in completado</p>
            <p className="text-[13px] text-slate-500 leading-relaxed">
              Hemos registrado a los {guestsCount} huéspedes. El propietario ha sido notificado.
            </p>
          </div>
        ) : openGuest !== null ? (
          <GuestForm
            token={token}
            guestOrder={openGuest}
            checkinDate={checkinDate}
            hasMinorInGroup={hasMinorInGroup}
            onSaved={(birthDate) => handleSaved(openGuest, birthDate)}
          />
        ) : !started ? (
          <div className="space-y-5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight text-center">
              Check-in online
            </h1>
            <div className="bg-slate-50 rounded-2xl p-4 text-left text-[13px] text-slate-600 space-y-1">
              <p>Entrada: {checkinDate}</p>
              <p>Salida: {checkoutDate}</p>
              <p>Huéspedes: {guestsCount}</p>
            </div>
            <div className="space-y-4 text-left">
              <p className="text-[13px] text-slate-500 leading-relaxed">
                Vamos a pedirte los datos de identidad de cada huésped y, si eres mayor de 14 años, tu firma —
                es obligatorio por ley (RD 933/2021) para comunicarlo al Ministerio del Interior.
              </p>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <Checkbox checked={consentAccepted} onCheckedChange={v => setConsentAccepted(v === true)} className="mt-0.5" />
                <span className="text-[12px] text-slate-600 leading-relaxed">
                  Acepto que estos datos se traten y comuniquen a SES Hospedajes (Ministerio del Interior)
                  según lo exigido por el RD 933/2021.
                </span>
              </label>
              <button
                type="button"
                disabled={!consentAccepted}
                onClick={() => { setStarted(true); setOpenGuest(1) }}
                className="w-full h-12 rounded-full bg-slate-900 text-white text-[14px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShieldCheck className="h-4 w-4" />
                Empezar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[12px] font-mono uppercase tracking-wide text-slate-400">Huéspedes</p>
            {Array.from({ length: guestsCount }, (_, i) => i + 1).map(order => {
              const saved = savedGuests.find(g => g.guestOrder === order)
              return (
                <button
                  key={order}
                  type="button"
                  onClick={() => setOpenGuest(order)}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border border-slate-100 bg-white text-left"
                >
                  <span className="text-[13px] font-medium text-slate-700">Huésped {order}</span>
                  {saved ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <span className="text-[11px] text-slate-400">Rellenar →</span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
