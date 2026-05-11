import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireProfile } from '@/lib/supabase/get-tenant-id'

export async function GET() {
  try {
    const supabase = await createClient()
    const { tenant_id } = await requireProfile(supabase)

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('package_level')
      .eq('id', tenant_id)
      .single()

    if (error) {
      return NextResponse.json({ packageLevel: 'basic' })
    }

    return NextResponse.json({ packageLevel: tenant?.package_level ?? 'basic' })
  } catch (error) {
    return NextResponse.json({ packageLevel: 'basic' })
  }
}
