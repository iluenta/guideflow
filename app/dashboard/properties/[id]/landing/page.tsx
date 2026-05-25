import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/supabase/get-tenant-id';
import { can, type TenantRole } from '@/lib/permissions';
import { LandingEditor } from '@/components/property-landing/LandingEditor';
import type { PropertyLanding } from '@/lib/types/property';

export default async function LandingEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: propertyId } = await params;
  const supabase = await createClient();

  const profile = await requireProfile(supabase).catch(() => null);
  if (!profile) redirect('/auth/login');

  if (!can(profile.tenant_role as TenantRole, 'properties', 'view')) {
    redirect('/dashboard/properties');
  }

  // Minimal select — only columns guaranteed to exist
  // Note: 'description' was removed in migration 033 — do not select it
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('id, name, slug, tenant_id, main_image_url, city, beds, baths, guests')
    .eq('id', propertyId)
    .eq('tenant_id', profile.tenant_id)
    .maybeSingle();

  if (propError) {
    console.error('[landing/page] property query error:', JSON.stringify(propError, Object.getOwnPropertyNames(propError)));
  }

  if (!property) {
    redirect('/dashboard/properties');
  }

  // Subscription check
  const { data: tenant } = await supabase
    .from('tenants')
    .select('package_level')
    .eq('id', profile.tenant_id)
    .maybeSingle();

  if (tenant && tenant.package_level === 'free') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold mb-3">Landings de reserva directa</h1>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Las landings de venta directa están disponibles en los planes Pro y Enterprise.
        </p>
        <Link
          href="/dashboard/settings/billing"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
        >
          Actualizar plan
        </Link>
      </div>
    );
  }

  // Load landing config — null means "use defaults in editor"
  let landingConfig: PropertyLanding | null = null;
  try {
    const { data } = await supabase
      .from('property_landings')
      .select('*')
      .eq('property_id', propertyId)
      .maybeSingle();
    landingConfig = data;
  } catch (err) {
    console.error('[landing/page] landing config query error:', err);
  }

  // Load welcome context for host name/bio defaults
  let welcomeHostName = '';
  let welcomeMessage = '';
  try {
    const { data: ctx } = await supabase
      .from('property_context')
      .select('content')
      .eq('property_id', propertyId)
      .eq('category', 'welcome')
      .maybeSingle();
    if (ctx?.content) {
      welcomeHostName = ctx.content.host_name || '';
      welcomeMessage  = ctx.content.message   || '';
    }
  } catch (err) {
    console.error('[landing/page] welcome context query error:', err);
  }

  return (
    <LandingEditor
      propertyId={propertyId}
      tenantId={profile.tenant_id}
      propertyName={property.name}
      propertySlug={property.slug ?? null}
      propertyDescription={''}
      propertyAmenities={[]}
      initialConfig={landingConfig}
      welcomeHostName={welcomeHostName}
      welcomeMessage={welcomeMessage}
    />
  );
}
