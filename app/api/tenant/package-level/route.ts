import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = user.user_metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({ packageLevel: 'basic' })
    }

    const { data: tenant } = await supabase
      .from('tenants')
      .select('package_level')
      .eq('id', tenantId)
      .single()

    return NextResponse.json({ packageLevel: tenant?.package_level ?? 'basic' })
  } catch {
    return NextResponse.json({ packageLevel: 'basic' })
  }
}
