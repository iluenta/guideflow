'use server';

import { createClient } from '@/lib/supabase/server';
import { createServerAdminClient } from '@/lib/supabase/server-admin';
import { PropertyLanding, Property } from '@/lib/types/property';
import { requireProfile } from '@/lib/supabase/get-tenant-id';
import { can, type TenantRole } from '@/lib/permissions';
import type { PricePeriod, PriceException } from '@/lib/types/pricing';

/**
 * Obtener configuración de landing por slug (pública)
 * Sin autenticación requerida
 */
export async function getPropertyLandingBySlug(
  slug: string
): Promise<{ property: Property; landing: PropertyLanding; blockedDates: string[]; pricePeriods: PricePeriod[] } | null> {
  const supabase = await createClient();

  // 1. Obtener propiedad por slug
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (propError || !property) {
    console.error('Error fetching property by slug:', propError);
    return null;
  }

  // 2. Obtener landing config
  const { data: landing, error: landingError } = await supabase
    .from('property_landings')
    .select('*')
    .eq('property_id', property.id)
    .eq('enabled', true)
    .maybeSingle();

  if (landingError || !landing) {
    console.warn(`Landing not found or disabled for property slug: ${slug}`, landingError);
    return null;
  }

  // 3. Obtener fechas bloqueadas (reservas confirmadas/checked_in/checked_out).
  // Usamos el cliente admin (service role) porque la tabla reservations tiene RLS
  // de aislamiento de tenant — un visitante anónimo no tiene sesión y la query
  // con el cliente anon devolvería 0 filas aunque la landing sea pública.
  // Solo seleccionamos los rangos de fechas, sin datos personales del huésped.
  const adminClient = createServerAdminClient();
  const { data: reservations, error: resError } = await adminClient
    .from('reservations')
    .select('checkin_date, checkout_date')
    .eq('property_id', property.id)
    .in('status', ['confirmed', 'checked_in', 'checked_out']);

  if (resError) {
    console.error('Error fetching reservations for blocked dates:', resError);
  }

  // Block checkin_date...(checkout_date - 1) inclusive.
  // checkout_date itself stays free — a guest checking out that morning can be replaced.
  // Pure string arithmetic avoids timezone bugs (new Date("YYYY-MM-DD") is UTC midnight
  // but setDate/getDate use local time, which shifts dates on UTC+ servers).
  function nextDay(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const next = new Date(Date.UTC(y, m - 1, d + 1));
    return next.toISOString().split('T')[0];
  }

  const blockedDates = new Set<string>();
  reservations?.forEach((res) => {
    let current: string = res.checkin_date;      // "2026-06-08"
    const end: string   = res.checkout_date;     // "2026-06-13"
    while (current < end) {                      // string compare works on ISO dates
      blockedDates.add(current);
      current = nextDay(current);
    }
    // end (checkout_date) is intentionally NOT added → available for next check-in
  });

  // 4. Fetch dynamic price periods (admin client — consistente con la query de reservas)
  const { data: periodsData } = await adminClient
    .from('property_price_periods')
    .select('*')
    .eq('property_id', property.id)
    .order('start_date', { ascending: true });

  const pricePeriods: PricePeriod[] = (periodsData ?? []).map(row => ({
    ...row,
    exceptions: (row.exceptions as PriceException[]) ?? [],
  }));

  return {
    property,
    landing,
    blockedDates: Array.from(blockedDates),
    pricePeriods,
  };
}

/**
 * Obtener configuración de landing (autenticado, para editor)
 */
export async function getPropertyLandingConfig(
  propertyId: string
): Promise<PropertyLanding | null> {
  const supabase = await createClient();

  // Verificar autenticación y obtener tenant_id
  const profile = await requireProfile(supabase);

  const { data, error } = await supabase
    .from('property_landings')
    .select('*')
    .eq('property_id', propertyId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching property landing config:', error);
  }

  // Si no existe, pre-rellenar con datos de la propiedad
  if (!data) {
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (propError || !property) {
      console.error('Property not found for seeding landing:', propError);
      return null;
    }

    return {
      property_id: propertyId,
      tenant_id: property.tenant_id,
      enabled: false,
      hero_title: property.name,
      hero_subtitle: property.city || '',
      custom_description: property.description || '',
      contact_email: profile.email || '',
      contact_phone: property.contact_phone || '',
      price_per_night: 100,
      cleaning_fee: 0,
      service_fee_pct: 8,
      tourist_tax_per_night: 0,
      pet_fee_flat: 0,
      palette: 'warm',
      typography: 'modern',
      border_radius: 'soft',
      show_calendar: true,
      show_pricing: true,
      show_location: true,
      show_reviews: true,
      policies: {
        checkIn: "15:00",
        checkOut: "11:00",
        cancellation: "Cancelación gratuita hasta 48h antes",
        minStay: 1
      },
      faqs: [],
      gallery: property.main_image_url ? [property.main_image_url] : [],
    };
  }

  return data;
}

/**
 * Actualizar configuración de landing (con validación de suscripción y permisos)
 */
export async function updatePropertyLandingConfig(
  propertyId: string,
  updates: Partial<PropertyLanding>
) {
  const supabase = await createClient();

  // 1. Obtener usuario autenticado y perfil
  const profile = await requireProfile(supabase);

  // 2. Validar que la propiedad pertenece al tenant del usuario
  const { data: property } = await supabase
    .from('properties')
    .select('tenant_id')
    .eq('id', propertyId)
    .single();

  if (!property) throw new Error('Propiedad no encontrada');
  if (property.tenant_id !== profile.tenant_id) {
    throw new Error('No tienes acceso a esta propiedad');
  }

  // 3. Validar permisos de edición (Canal DIRECT es configurable por owner/admin)
  if (!can(profile.tenant_role as TenantRole, 'properties', 'edit')) {
    throw new Error('No tienes permisos para editar la configuración de propiedades');
  }

  // 4. Validar suscripción (package_level)
  const { data: tenant } = await supabase
    .from('tenants')
    .select('package_level')
    .eq('id', property.tenant_id)
    .single();

  if (!tenant || tenant.package_level === 'free') {
    throw new Error('Landings no disponibles en tu plan');
  }

  // 5. Actualizar (con upsert para crearla si no existía)
  const { data, error } = await supabase
    .from('property_landings')
    .upsert({
      property_id: propertyId,
      tenant_id: property.tenant_id,
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error updating property landing config:', error);
    throw error;
  }
  
  return data;
}
