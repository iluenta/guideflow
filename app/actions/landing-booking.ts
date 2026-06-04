'use server';

import { createClient } from '@/lib/supabase/server';
import { createServerAdminClient } from '@/lib/supabase/server-admin';
import { ReservationRequest } from '@/lib/types/property';
import { sendReservationConfirmation } from '@/lib/email/resend';
import { calculateDynamicBreakdown } from '@/lib/pricing/calculator';
import type { PricePeriod, PriceException } from '@/lib/types/pricing';

/**
 * Crear reserva desde landing pública
 * Validaciones:
 * - Disponibilidad (sin race conditions)
 * - Cálculo de precios en servidor (seguro)
 * - Comisiones (si aplican)
 */
export async function createPublicBooking(
  input: ReservationRequest
): Promise<{ success: boolean; reservationId?: string; error?: string }> {
  try {
    const supabase = await createClient();

    // 1. Obtener propiedad y landing config
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('id, tenant_id, name')
      .eq('id', input.propertyId)
      .single();

    if (propError || !property) {
      return { success: false, error: 'Propiedad no encontrada' };
    }

    const { data: landing, error: landingError } = await supabase
      .from('property_landings')
      .select('*')
      .eq('property_id', input.propertyId)
      .eq('enabled', true)
      .single();

    if (landingError || !landing) {
      return { success: false, error: 'La landing no está disponible o activa' };
    }

    // Convertir fechas a string YYYY-MM-DD
    const checkInDate = new Date(input.checkIn);
    const checkOutDate = new Date(input.checkOut);
    const checkInStr = checkInDate.toISOString().split('T')[0];
    const checkOutStr = checkOutDate.toISOString().split('T')[0];

    // 2. Validar disponibilidad (Protección estricta de solapamiento)
    // Incluir todas las reservas activas; excluir sólo cancelled y no_show.
    const { data: conflicts, error: conflictError } = await supabase
      .from('reservations')
      .select('id')
      .eq('property_id', input.propertyId)
      .in('status', ['confirmed', 'checked_in', 'checked_out', 'pending'])
      .lt('checkin_date', checkOutStr)
      .gt('checkout_date', checkInStr);

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError);
      return { success: false, error: 'Error al verificar la disponibilidad de fechas' };
    }

    if (conflicts && conflicts.length > 0) {
      return { success: false, error: 'Las fechas seleccionadas ya no están disponibles' };
    }

    // 2b. Validar que no hay períodos bloqueados por el host en el rango
    const adminClient = createServerAdminClient();
    const { data: blockedConflicts } = await adminClient
      .from('property_blocked_periods')
      .select('id, reason')
      .eq('property_id', input.propertyId)
      .lt('start_date', checkOutStr)
      .gt('end_date', checkInStr);      // end_date inclusive → gt en lugar de gte

    if (blockedConflicts && blockedConflicts.length > 0) {
      return { success: false, error: 'La propiedad no está disponible en las fechas seleccionadas' };
    }

    // 3. Calcular precios en SERVIDOR (nunca confiar en el cliente)
    const nights = Math.floor(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (nights <= 0) {
      return { success: false, error: 'La estancia debe ser de al menos 1 noche' };
    }

    const minStay = landing.policies?.minStay ?? 1;
    if (nights < minStay) {
      return {
        success: false,
        error: `La estancia mínima es de ${minStay} noche${minStay !== 1 ? 's' : ''}`,
      };
    }

    // Fetch dynamic price periods for accurate base price calculation
    const { data: periodsData } = await adminClient
      .from('property_price_periods')
      .select('*')
      .eq('property_id', input.propertyId)
      .order('start_date', { ascending: true });

    const activePeriods: PricePeriod[] = (periodsData ?? []).map(row => ({
      ...row,
      exceptions: (row.exceptions as PriceException[]) ?? [],
    }));

    const basePrice = activePeriods.length > 0
      ? calculateDynamicBreakdown(checkInDate, checkOutDate, activePeriods, landing.price_per_night).baseTotal
      : landing.price_per_night * nights;
    const cleaningFee = Number(landing.cleaning_fee || 0);
    const serviceFee = Math.round(basePrice * (Number(landing.service_fee_pct || 8) / 100));
    const touristTax = nights * (input.guests.adults + input.guests.children) * Number(landing.tourist_tax_per_night || 0);
    const petFee = input.guests.pets * Number(landing.pet_fee_flat || 0);

    const grossAmount = basePrice + cleaningFee + serviceFee + touristTax + petFee;

    // 4. Obtener channel_id para "DIRECT"
    const { data: channel, error: channelError } = await supabase
      .from('channel_settings')
      .select('id')
      .eq('code', 'DIRECT')
      .eq('tenant_id', property.tenant_id)
      .maybeSingle();

    if (channelError || !channel) {
      console.error('Error fetching DIRECT channel settings:', channelError);
      return { success: false, error: 'El canal de venta directa no está configurado para este alojamiento' };
    }

    // 5. Crear reserva
    const { data: reservation, error: insertError } = await supabase
      .from('reservations')
      .insert({
        tenant_id: property.tenant_id,
        property_id: input.propertyId,
        channel_id: channel.id,
        guest_name: input.contact.name,
        guest_email: input.contact.email,
        guest_phone: input.contact.phone,
        guest_country: input.contact.country || null,
        guests_count: input.guests.adults + input.guests.children + input.guests.infants,
        checkin_date: checkInStr,
        checkout_date: checkOutStr,
        gross_amount: grossAmount,
        currency: 'EUR',
        total_sale_commission: 0,
        total_sale_commission_vat: 0,
        total_pay_commission: 0,
        total_pay_commission_vat: 0,
        status: 'pending',
        notes: `Pre-reserva directa | ${input.guests.adults}A ${input.guests.children}N ${input.guests.infants}B ${input.guests.pets}M`,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creando reserva:', insertError);
      return { success: false, error: 'Error al procesar el registro de la reserva' };
    }

    // 6. Insertar los desgloses en reservation_charges para historial detallado
    const baseCharge = (name: string, charge_type: string, amount: number, sort_order: number) => ({
      tenant_id: property.tenant_id,
      reservation_id: reservation.id,
      name,
      charge_type,
      amount,
      vat_pct: 0,
      vat_amount: 0,
      is_refundable: false,
      included_in_gross: true,
      beneficiary: 'owner',
      sort_order,
    })

    const chargesToInsert = [
      baseCharge(`Hospedaje (${nights} noches)`, 'accommodation', basePrice, 1),
      baseCharge('Gastos de limpieza', 'cleaning', cleaningFee, 2),
    ];

    if (serviceFee > 0) {
      chargesToInsert.push(baseCharge('Gastos de gestión', 'custom', serviceFee, 3));
    }

    if (touristTax > 0) {
      chargesToInsert.push(baseCharge('Tasa turística', 'custom', touristTax, 4));
    }

    if (petFee > 0) {
      chargesToInsert.push(baseCharge('Suplemento de mascota', 'custom', petFee, 5));
    }

    const { error: chargesError } = await supabase
      .from('reservation_charges')
      .insert(chargesToInsert.filter(c => c.amount > 0));

    if (chargesError) {
      console.error('Error inserting reservation charges:', chargesError);
    }

    // 7. Enviar email de pre-reserva al huésped
    try {
      await sendReservationConfirmation({
        reservation: { ...reservation, guest_phone: reservation.guest_phone ?? undefined },
        property,
        landing,
        guests: input.guests,
        checkin: checkInDate,
        checkout: checkOutDate,
        total: grossAmount,
      });
    } catch (emailError) {
      console.error('Error enviando email:', emailError);
      // No fallar la reserva si el servicio de email no está configurado (e.g. sin API key de Resend)
    }

    return {
      success: true,
      reservationId: reservation.id,
    };

  } catch (error) {
    console.error('Error en createPublicBooking:', error);
    return { success: false, error: 'Error interno en el servidor' };
  }
}

/**
 * Obtener fechas bloqueadas (para el calendario de la landing)
 */
export async function getBlockedDates(propertyId: string): Promise<string[]> {
  try {
    const supabase = await createClient();
    const { data: reservations } = await supabase
      .from('reservations')
      .select('checkin_date, checkout_date')
      .eq('property_id', propertyId)
      .in('status', ['confirmed', 'checked_in', 'checked_out', 'pending']);

    const blocked = new Set<string>();

    reservations?.forEach((res) => {
      let cursor = new Date(res.checkin_date);
      const end = new Date(res.checkout_date);
      
      while (cursor < end) {
        blocked.add(cursor.toISOString().split('T')[0]);
        cursor.setDate(cursor.getDate() + 1);
      }
    });

    return Array.from(blocked);
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    return [];
  }
}
