import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="text-center space-y-6">
        <Logo size={56} className="mx-auto" />
        <div>
          <h1 className="text-6xl font-black text-foreground">404</h1>
          <h2 className="text-xl font-semibold text-muted-foreground mt-2">
            Página no encontrada
          </h2>
          <p className="text-muted-foreground mt-1">
            La página que buscas no existe o ha sido movida.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 font-medium text-primary-foreground hover:bg-primary/90"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
