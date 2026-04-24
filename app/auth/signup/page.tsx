"use client"

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { MagicLinkForm } from '@/components/auth/magic-link-form'
import { Logo } from '@/components/ui/logo'

function SignupForm() {
  const router = useRouter()
  
  useEffect(() => {
    router.push('/auth/login')
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fafbfc]">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1e3a8a] border-r-transparent" />
        <p className="text-[#475569]">Redirigiendo...</p>
      </div>
    </div>
  )
}


export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#f1f4f8]">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#1e3a8a] border-r-transparent" />
          <p className="text-[#475569]">Cargando...</p>
        </div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
