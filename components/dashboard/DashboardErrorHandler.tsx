'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export function DashboardErrorHandler() {
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      toast({ title: 'Aviso', description: error, variant: 'destructive' })
      const url = new URL(window.location.href)
      url.searchParams.delete('error')
      window.history.replaceState(null, '', url.toString())
    }
  }, [searchParams, toast])

  return null
}
