'use client'

import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'

interface ResponsiveModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  children: React.ReactNode
  className?: string
  overlayClassName?: string
  drawerClassName?: string
}

export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  children,
  className,
  overlayClassName,
  drawerClassName,
}: ResponsiveModalProps) {
  const isMobile = useIsMobile()

  // No renderizar hasta que el hook haya resuelto el viewport en cliente.
  // Evita hydration mismatch: SSR produce undefined, cliente produce true/false.
  if (isMobile === undefined) return null

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={cn('max-h-[92vh]', drawerClassName)}>
          {title && (
            <DrawerHeader className="text-left border-b border-slate-100 px-6 pt-5 pb-4">
              <DrawerTitle className="text-[18px] font-bold text-[#1e3a8a]">
                {title}
              </DrawerTitle>
            </DrawerHeader>
          )}
          <div className="overflow-y-auto">{children}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className} overlayClassName={overlayClassName}>
        {title && (
          <DialogHeader>
            <DialogTitle className="text-[20px] font-bold text-[#1e3a8a]">
              {title}
            </DialogTitle>
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </Dialog>
  )
}
