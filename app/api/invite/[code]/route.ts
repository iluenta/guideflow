import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Usa el service_role key — nunca el anon key — para poder llamar a la función
// SQL y saltarse RLS. Esta ruta es server-side, la clave nunca llega al cliente.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APK_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/app-releases/recetarioai.apk`

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  // Extraer IP real (Vercel pone la IP real en x-forwarded-for)
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  const { code: rawCode } = await params
  const code = rawCode.toUpperCase().trim()

  const { data: valid, error } = await supabase.rpc('use_invitation', {
    p_code: code,
    p_ip:   ip,
  })

  if (error) {
    console.error('use_invitation error:', error)
    return NextResponse.json(
      { error: 'Error interno. Inténtalo de nuevo.' },
      { status: 500 }
    )
  }

  if (!valid) {
    return NextResponse.json(
      { error: 'Este enlace ya fue utilizado o no es válido.' },
      { status: 410 }
    )
  }

  return NextResponse.json({ url: APK_URL })
}
