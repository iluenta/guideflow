import { redirect } from 'next/navigation'

// Redirige a la ruta plana que usa query param para evitar problemas con
// rutas dinámicas anidadas en el servidor de desarrollo de Windows.
interface Props {
  params: Promise<{ id: string }>
}

export default async function EditBookingRedirectPage({ params }: Props) {
  const { id } = await params
  redirect(`/dashboard/bookings/new?edit=${id}`)
}
