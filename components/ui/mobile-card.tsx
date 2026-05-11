import { cn } from '@/lib/utils'

interface MobileCardProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export function MobileCard({ children, onClick, className }: MobileCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-slate-100 p-4 shadow-sm',
        'active:bg-slate-50 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
