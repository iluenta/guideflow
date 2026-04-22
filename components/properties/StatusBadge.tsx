import { cn } from '@/lib/utils'

export function StatusBadge({ status, className }: { status?: string, className?: string }) {
    if (!status) return null
    
    const map = {
        active: { 
            label: 'Activa', 
            cls: 'bg-landing-mint-tint text-landing-mint-deep px-3 py-1.5' 
        },
        draft: { 
            label: 'Borrador', 
            cls: 'bg-landing-amber-tint text-landing-amber px-3 py-1.5' 
        },
        archived: { 
            label: 'Archivada', 
            cls: 'bg-landing-bg-deep text-landing-ink-mute px-3 py-1.5' 
        },
    }

    const s = map[status as keyof typeof map]
    if (!s) return null

    return (
        <span className={cn(
            'inline-flex items-center rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm border border-black/5', 
            s.cls, 
            className
        )}>
            <div className={cn(
                "w-1.5 h-1.5 rounded-full mr-2",
                status === 'active' ? "bg-landing-mint-deep" : 
                status === 'draft' ? "bg-landing-amber" : 
                "bg-landing-ink-mute"
            )}></div>
            {s.label}
        </span>
    )
}
