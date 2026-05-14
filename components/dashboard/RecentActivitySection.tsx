'use client'

import Link from 'next/link'
import { CalendarPlus, CalendarCheck, Receipt, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RecentActivity } from '@/types/analytics'

const activityConfig = {
  new_reservation: { icon: CalendarPlus,  color: 'text-landing-navy',      bg: 'bg-landing-navy-tint' },
  checkout:        { icon: CalendarCheck, color: 'text-landing-mint-deep', bg: 'bg-landing-mint-tint' },
  expense:         { icon: Receipt,       color: 'text-landing-amber',     bg: 'bg-landing-amber-tint' },
  guest_message:   { icon: MessageSquare, color: 'text-purple-500',        bg: 'bg-purple-50' },
}

export function RecentActivitySection({ activities }: { activities: RecentActivity[] }) {
  return (
    <div className="bg-white border border-landing-rule-soft rounded-[18px] shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-4 sm:p-6 border-b border-landing-rule-soft">
        <h3 className="font-semibold text-[15px] text-landing-ink tracking-tight">Actividad reciente</h3>
        <p className="text-[12px] text-landing-ink-mute mt-0.5">Últimos eventos</p>
      </div>

      <div className="flex-1 p-4 sm:p-6 space-y-0 divide-y divide-dashed divide-landing-rule-soft">
        {activities.length === 0 && (
          <p className="py-8 text-center text-sm text-landing-ink-mute">Sin actividad reciente</p>
        )}
        {activities.map(activity => {
          const cfg = activityConfig[activity.type]
          const Icon = cfg.icon
          return (
            <Link key={activity.id} href={activity.href} className="flex gap-3 py-3 first:pt-0 last:pb-0 hover:opacity-80 transition-opacity">
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0', cfg.bg, cfg.color)}>
                <Icon className="h-3.5 w-3.5 stroke-[1.75]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-landing-ink leading-snug mb-0.5 font-medium truncate">{activity.title}</p>
                <p className="text-[12px] text-landing-ink-soft truncate">{activity.subtitle}</p>
                <span className="font-jetbrains text-[10px] text-landing-ink-mute tracking-wide uppercase">{activity.time_ago}</span>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="p-4 bg-landing-bg-deep/30 border-t border-landing-rule-soft text-center">
        <Link href="/dashboard/bookings" className="font-jetbrains text-[10px] font-bold text-landing-navy uppercase tracking-widest hover:underline transition-all">
          Ver historial completo
        </Link>
      </div>
    </div>
  )
}
