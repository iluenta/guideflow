'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Clock, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PropertyStatus } from '@/types/analytics'

const statusConfig = {
  occupied:  { label: 'OCUPADO',    className: 'bg-landing-navy-tint text-landing-navy',     dot: 'bg-landing-navy' },
  upcoming:  { label: 'PRÓXIMA',    className: 'bg-landing-amber-tint text-landing-amber',   dot: 'bg-landing-amber' },
  available: { label: 'DISPONIBLE', className: 'bg-landing-mint-tint text-landing-mint-deep', dot: 'bg-landing-mint-deep' },
}

function fmtDate(d: string | null): string {
  if (!d) return 'N/A'
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

export function PropertiesSection({ properties }: { properties: PropertyStatus[] }) {
  return (
    <div className="bg-white border border-landing-rule-soft rounded-[18px] shadow-sm overflow-hidden flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 p-4 sm:p-6 border-b border-landing-rule-soft">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[15px] text-landing-ink tracking-tight truncate">Tus propiedades</h3>
          <p className="text-[12px] text-landing-ink-mute mt-0.5 truncate">Gestión de alojamientos</p>
        </div>
        <Link href="/dashboard/properties" className="shrink-0">
          <Button variant="ghost" size="sm" className="text-landing-navy hover:bg-landing-navy-tint rounded-full gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 sm:px-4">
            Ver todas <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>

      <div className="p-4 sm:p-6 pt-2 divide-y divide-landing-rule-soft">
        {properties.length === 0 && (
          <p className="py-8 text-center text-sm text-landing-ink-mute">Sin propiedades activas</p>
        )}
        {properties.map(property => {
          const sc = statusConfig[property.current_status]
          const dateLabel = property.current_status === 'occupied'
            ? `C-Out: ${fmtDate(property.next_checkout)}`
            : property.current_status === 'upcoming'
            ? `C-In: ${fmtDate(property.next_checkin)}`
            : 'Disponible'

          return (
            <div key={property.id} className="flex items-center gap-3 sm:gap-4 py-4 group first:pt-0 last:pb-0">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-landing-bg-deep border border-landing-rule-soft">
                {property.image_url ? (
                  <Image src={property.image_url} alt={property.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full bg-landing-bg-deep flex items-center justify-center text-landing-ink-mute text-xs">{property.name[0]}</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-landing-ink mb-1 truncate tracking-tight">{property.name}</h4>
                <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-[12px] text-landing-ink-soft">
                  {property.location && (
                    <>
                      <div className="flex items-center gap-1 min-w-0">
                        <MapPin className="h-3 w-3 text-landing-ink-mute shrink-0" />
                        <span className="truncate">{property.location}</span>
                      </div>
                      <span className="text-landing-ink-mute text-[10px] shrink-0">•</span>
                    </>
                  )}
                  <div className="flex items-center gap-1 min-w-0">
                    <Clock className="h-3 w-3 text-landing-ink-mute shrink-0" />
                    <span className="truncate">{dateLabel}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <div className={cn('font-jetbrains text-[9px] sm:text-[10px] font-medium tracking-wider uppercase px-2 sm:px-3 py-1 rounded-full flex items-center gap-1.5', sc.className)}>
                  <div className={cn('w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full', sc.dot)} />
                  <span className="hidden min-[420px]:inline">{sc.label}</span>
                </div>
                <Link href={`/dashboard/properties/${property.id}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-landing-ink-mute hover:text-landing-navy hover:bg-landing-bg-deep transition-all">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
