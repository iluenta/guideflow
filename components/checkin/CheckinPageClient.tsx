'use client'

import { useCallback, useState } from 'react'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, ClipboardCheck, Clock, DoorOpen, Loader2, MessageCircle, PenLine, Phone, ScanLine, Users } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { GuestForm } from './GuestForm'
import { telHref, whatsappHref } from '@/lib/phone'
import { calculateAge } from '@/lib/checkin/guest-utils'
import type { GuideThemeClasses } from '@/lib/guide-theme'
import type { SharedGuestContact } from '@/lib/checkin/guest-schema'

interface RegisteredGuest {
  order: number
  isMinor: boolean
}

interface CheckinPageClientProps {
  token: string
  propertyName: string
  propertyCity: string
  propertyImageUrl: string | null
  checkinDate: string
  checkoutDate: string
  guestsCount: number
  registeredGuests: RegisteredGuest[]
  /** Horario de entrada de la ficha de la propiedad (ej. "15:00 - 22:00") */
  checkinTime: string | null
  /** Contacto que se muestra en la guía (soporte si existe, si no el anfitrión) */
  hostContact: { name: string; phone: string } | null
  /** Token de acceso a la guía, generado al completar el check-in */
  guideToken: string | null
  /** Contacto y dirección del primer huésped ya registrado (al reanudar) */
  initialSharedContact: SharedGuestContact | null
  guideTheme: GuideThemeClasses
}

/** "Pedro Ramírez" → "PR" · "Pedro" → "PE" */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

type Step = 'welcome' | 'confirm' | 'guest' | 'done'

const HEADING_FONT = { fontFamily: 'var(--font-heading)' }

/** El formulario del huésped vive en GuestForm, pero su botón de guardar está
 *  en la barra inferior fija — se enlazan con el atributo form=. */
const GUEST_FORM_ID = 'checkin-guest-form'

/** "2026-08-30" → "30/08/26" */
function formatShort(date: string): string {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

function nightsBetween(checkin: string, checkout: string): number {
  const a = new Date(`${checkin}T00:00:00Z`).getTime()
  const b = new Date(`${checkout}T00:00:00Z`).getTime()
  return Math.max(1, Math.round((b - a) / 86_400_000))
}

const STEPS_PREVIEW = [
  { icon: ClipboardCheck, title: 'Confirma tu reserva', subtitle: 'Revisa los detalles de tu estancia.' },
  { icon: ScanLine, title: 'Escanea tu documento', subtitle: 'Captura tu DNI o pasaporte.' },
  { icon: PenLine, title: 'Firma', subtitle: 'Acepta y firma digitalmente.' },
]

// Accesos posteriores al check-in. Ambos entran por /g/{token}, que valida el
// acceso, deja la cookie de invitado y redirige a la guía — así el huésped entra
// identificado y con su visita registrada. Sin token aún, la tarjeta se muestra
// atenuada en vez de llevar a un enlace roto.
function postCheckinLinks(guideToken: string | null) {
  const base = guideToken ? `/g/${guideToken}` : null
  return [
    {
      icon: DoorOpen,
      title: 'Llegada y acceso',
      subtitle: 'Cómo llegar y entrar al apartamento.',
      href: base ? `${base}?screen=checkin` : null,
    },
    {
      icon: BookOpen,
      title: 'Guía del huésped',
      subtitle: 'Wifi, normas, recomendaciones y contacto.',
      href: base,
    },
  ]
}

export function CheckinPageClient({
  token,
  propertyName,
  propertyCity,
  propertyImageUrl,
  checkinDate,
  checkoutDate,
  guestsCount,
  registeredGuests,
  checkinTime,
  hostContact,
  guideToken,
  initialSharedContact,
  guideTheme: t,
}: CheckinPageClientProps) {
  const [saved, setSaved] = useState<RegisteredGuest[]>(registeredGuests)
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [step, setStep] = useState<Step>(saved.length >= guestsCount ? 'done' : 'welcome')
  const [currentGuest, setCurrentGuest] = useState(1)
  const [guestBusy, setGuestBusy] = useState(true)
  // Se siembra del servidor (al reanudar) y se actualiza al guardar dentro de la
  // misma sesión, que es el caso habitual: rellenar los huéspedes uno tras otro.
  const [sharedContact, setSharedContact] = useState<SharedGuestContact | null>(initialSharedContact)

  // useCallback para no reiniciar el efecto de GuestForm en cada render del padre
  const handleBusyChange = useCallback((busy: boolean) => setGuestBusy(busy), [])

  const hasMinorInGroup = saved.some(g => g.isMinor)
  const nights = nightsBetween(checkinDate, checkoutDate)

  /** Primer huésped sin registrar — permite reanudar por donde se dejó. */
  function firstPending(list: RegisteredGuest[]): number | null {
    for (let order = 1; order <= guestsCount; order++) {
      if (!list.some(g => g.order === order)) return order
    }
    return null
  }

  function handleSaved(guestOrder: number, birthDate: string, shared: SharedGuestContact) {
    // El primero manda; si aún no hay nada guardado, siembra el que se guarde antes.
    if (guestOrder === 1 || !sharedContact) setSharedContact(shared)

    const isMinor = calculateAge(birthDate, checkinDate) < 14
    const next = [...saved.filter(g => g.order !== guestOrder), { order: guestOrder, isMinor }]
    setSaved(next)

    const pending = firstPending(next)
    if (pending === null) {
      setStep('done')
    } else {
      setCurrentGuest(pending)
    }
  }

  function startCheckin() {
    const pending = firstPending(saved)
    if (pending === null) {
      setStep('done')
    } else {
      setCurrentGuest(pending)
      setStep('guest')
    }
  }

  // La barra refleja el avance real: 2 pantallas de intro + un paso por huésped.
  const totalSteps = 2 + guestsCount
  const stepIndex =
    step === 'welcome' ? 1
      : step === 'confirm' ? 2
        : step === 'guest' ? 2 + currentGuest
          : totalSteps
  const progressLabel =
    step === 'welcome' ? 'Bienvenida'
      : step === 'confirm' ? 'Tu reserva'
        : step === 'guest' ? `Huésped ${currentGuest} de ${guestsCount}`
          : 'Completado'

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-[var(--ck-surface)] border-b border-[var(--ck-rule)] px-4 py-3.5">
        <p className="text-[15px] font-bold text-[var(--ck-ink)] truncate text-center" style={HEADING_FONT}>
          {propertyName}
        </p>
      </header>

      {step !== 'done' && (
        <div className="bg-[var(--ck-surface)] px-5 pt-3 pb-3.5 border-b border-[var(--ck-rule)]">
          <p className={`text-[10px] mb-2 ${t.sectionLabel}`}>{progressLabel}</p>
          <div className="h-1.5 rounded-full bg-[var(--ck-rule)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${t.chipIconBg}`}
              style={{ width: `${(stepIndex / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 w-full max-w-md mx-auto pb-28">
        {step === 'welcome' && (
          <div>
            <div className="relative h-56 w-full overflow-hidden">
              {propertyImageUrl ? (
                <Image src={propertyImageUrl} alt={propertyName} fill className="object-cover" priority sizes="(max-width: 448px) 100vw, 448px" />
              ) : (
                <div className={`absolute inset-0 ${t.entryCardGradient}`} />
              )}
              <div className={`absolute inset-0 ${t.heroOverlay}`} />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <p className={`text-[10px] mb-1.5 ${t.heroSubLabel}`}>Check-in online</p>
                <p className={`text-4xl leading-none mb-1.5 ${t.heroGreeting}`} style={HEADING_FONT}>Bienvenido</p>
                <p className={`text-sm ${t.heroPropertyName}`}>
                  {propertyName}{propertyCity ? ` · ${propertyCity}` : ''}
                </p>
              </div>
            </div>

            <div className="px-5 pt-6 space-y-3">
              <p className={`text-[10px] ${t.sectionLabel}`}>Qué vamos a hacer</p>
              {STEPS_PREVIEW.map(({ icon: Icon, title, subtitle }) => (
                <div key={title} className={`flex items-center gap-3 px-4 py-3.5 ${t.chipBg}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.chipIconBg}`}>
                    <Icon size={18} className={t.chipIconColor} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${t.chipLabel}`}>{title}</p>
                    <p className="text-[12px] text-[var(--ck-ink-soft)]">{subtitle}</p>
                  </div>
                </div>
              ))}
              <p className="text-[12px] text-[var(--ck-ink-soft)] leading-relaxed pt-1">
                Es obligatorio por ley (RD 933/2021): el alojamiento debe comunicar los datos de
                identidad de cada huésped al Ministerio del Interior.
              </p>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="px-5 pt-6 space-y-4">
            {/* Sin etiqueta de sección: la barra de progreso ya dice "Tu reserva" */}
            <div className={`p-5 ${t.cardBg}`}>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Llegada', value: formatShort(checkinDate) },
                  { label: 'Salida', value: formatShort(checkoutDate) },
                  { label: 'Estancia', value: `${nights} ${nights === 1 ? 'noche' : 'noches'}` },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className={`text-[9px] mb-1 ${t.sectionLabel}`}>{label}</p>
                    <p className={`text-sm ${t.chipLabel}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`flex items-center gap-3 px-4 py-3.5 ${t.chipBg}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.chipIconBg}`}>
                <Users size={18} className={t.chipIconColor} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[9px] mb-0.5 ${t.sectionLabel}`}>Huéspedes</p>
                <p className={`text-sm ${t.chipLabel}`}>{saved.length}/{guestsCount} registrados</p>
              </div>
            </div>

            <div className={`p-4 space-y-3 ${t.cardBg}`}>
              <p className="text-[12px] text-[var(--ck-ink-soft)] leading-relaxed">
                De acuerdo con la normativa vigente en España, es obligatorio completar el registro
                de huéspedes y facilitar determinados datos a las autoridades. Necesitamos la
                información de <strong className={t.chipLabel}>todos los huéspedes</strong> antes de
                tu llegada: nombre completo, número de documento, fecha de nacimiento, nacionalidad
                y datos de contacto.
              </p>
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={consentAccepted}
                  onCheckedChange={v => setConsentAccepted(v === true)}
                  className="mt-0.5 shrink-0"
                />
                <span className="text-[12px] text-[var(--ck-ink-soft)] leading-relaxed">
                  Acepto que estos datos se traten y se comuniquen a SES Hospedajes (Ministerio del
                  Interior) según lo exigido por el RD 933/2021.
                </span>
              </label>
            </div>
          </div>
        )}

        {step === 'guest' && (
          <div className="px-5 pt-6">
            <GuestForm
              key={currentGuest}
              token={token}
              guestOrder={currentGuest}
              checkinDate={checkinDate}
              hasMinorInGroup={hasMinorInGroup}
              onSaved={(birthDate, shared) => handleSaved(currentGuest, birthDate, shared)}
              guideTheme={t}
              formId={GUEST_FORM_ID}
              onBusyChange={handleBusyChange}
              sharedContact={currentGuest === 1 ? null : sharedContact}
            />
          </div>
        )}

        {step === 'done' && (
          <div className="px-5 pt-10 space-y-7">
            <div className="text-center space-y-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${t.chipIconBg}`}>
                <Check size={30} className={t.chipIconColor} aria-hidden="true" />
              </div>
              <p className="text-2xl text-[var(--ck-ink)]" style={HEADING_FONT}>Check-in completado</p>
              <p className="text-[13px] text-[var(--ck-ink-soft)] leading-relaxed">
                Hemos registrado {guestsCount === 1 ? 'al huésped' : `a los ${guestsCount} huéspedes`}.
                Ya no tienes que hacer nada más antes de llegar.
              </p>
            </div>

            <div className="space-y-3">
              <p className={`text-[10px] ${t.sectionLabel}`}>Antes de tu llegada</p>

              <div className={`p-4 space-y-2 ${t.cardBg}`}>
                {checkinTime && (
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-[var(--ck-ink-mute)] shrink-0" aria-hidden="true" />
                    <p className={`text-sm ${t.chipLabel}`}>Horario de entrada: {checkinTime}</p>
                  </div>
                )}
                <p className="text-[12px] text-[var(--ck-ink-soft)] leading-relaxed">
                  Hacemos entrada autónoma: te avisaremos con un mensaje en cuanto el apartamento
                  esté listo, para que puedas acceder lo antes posible. Revisa las instrucciones de
                  acceso antes de llegar y así resolvemos cualquier duda con tiempo.
                </p>
              </div>

              {postCheckinLinks(guideToken).map(({ icon: Icon, title, subtitle, href }) => {
                const content = (
                  <>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.chipIconBg}`}>
                      <Icon size={18} className={t.chipIconColor} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${t.chipLabel}`}>{title}</p>
                      <p className="text-[12px] text-[var(--ck-ink-soft)]">{subtitle}</p>
                    </div>
                    {href
                      ? <ChevronRight className="h-4 w-4 shrink-0 text-[var(--ck-ink-mute)]" />
                      : <span className="text-[10px] shrink-0 text-[var(--ck-ink-mute)] uppercase tracking-wider">Pronto</span>}
                  </>
                )

                return href ? (
                  <a key={title} href={href} className={`flex items-center gap-3 px-4 py-3.5 ${t.chipBg}`}>
                    {content}
                  </a>
                ) : (
                  <div key={title} className={`flex items-center gap-3 px-4 py-3.5 opacity-60 ${t.chipBg}`}>
                    {content}
                  </div>
                )
              })}

              {hostContact && (
                <div className={`p-4 space-y-3 ${t.cardBg}`}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${t.chipIconBg} ${t.chipIconColor}`}
                      aria-hidden="true"
                    >
                      {initials(hostContact.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[9px] mb-0.5 ${t.sectionLabel}`}>¿Alguna duda?</p>
                      <p className={`text-sm truncate ${t.chipLabel}`}>{hostContact.name || 'Tu anfitrión'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={whatsappHref(hostContact.phone) ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`h-11 flex items-center justify-center gap-2 text-sm ${t.chipBg} ${t.chipLabel}`}
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      WhatsApp
                    </a>
                    <a
                      href={telHref(hostContact.phone) ?? undefined}
                      className={`h-11 flex items-center justify-center gap-2 text-sm ${t.actionBtn}`}
                    >
                      <Phone className="h-4 w-4" aria-hidden="true" />
                      Llamar
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {step !== 'done' && (
        <div className="fixed inset-x-0 bottom-0 z-20 bg-[var(--ck-surface)] border-t border-[var(--ck-rule)] px-5 py-3.5">
          <div className="max-w-md mx-auto flex items-center gap-3">
            {step !== 'welcome' && (
              <button
                type="button"
                onClick={() => setStep(step === 'guest' ? 'confirm' : 'welcome')}
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-[var(--ck-ink-soft)]"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </button>
            )}

            {step === 'welcome' && (
              <button
                type="button"
                onClick={() => setStep('confirm')}
                className={`flex-1 h-12 flex items-center justify-center gap-2 text-sm ${t.actionBtn}`}
              >
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {step === 'confirm' && (
              <button
                type="button"
                disabled={!consentAccepted}
                onClick={startCheckin}
                className={`flex-1 h-12 flex items-center justify-center gap-2 text-sm whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${t.actionBtn}`}
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {step === 'guest' && (
              <button
                type="submit"
                form={GUEST_FORM_ID}
                disabled={guestBusy}
                className={`flex-1 h-12 flex items-center justify-center gap-2 text-sm whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${t.actionBtn}`}
              >
                {guestBusy && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
