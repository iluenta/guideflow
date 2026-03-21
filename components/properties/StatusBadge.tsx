import { cn } from '@/lib/utils'

export function StatusBadge({ status }: { status?: string }) {
    if (!status) return null
    const map = {
        active: { label: 'Activa', cls: 'bg-emerald-100 text-emerald-700 border-none' },
        draft: { label: 'Borrador', cls: 'bg-amber-100 text-amber-800 border-none' },
        archived: { label: 'Archivada', cls: 'bg-slate-100 text-slate-600 border-none' },
    }
    const s = map[status as keyof typeof map]
    if (!s) return null
    return (
        <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold shadow-sm', s.cls)}>
            {s.label}
        </span>
    )
}
