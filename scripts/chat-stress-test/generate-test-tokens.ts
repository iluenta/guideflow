/**
 * generate-test-tokens.ts
 * Crea un token de acceso temporal (24h) para cada propiedad del tenant.
 * Esto permite que el stress test funcione sin errores 401.
 */

import { generateSecureToken } from "../../lib/security";

// Desactivar validación TLS para entornos con proxies/VPNs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!;
const TENANT_ID = process.env.TENANT_ID!;

if (!SUPABASE_URL || !SUPABASE_KEY || !TENANT_ID) {
  console.error("❌ Faltan variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TENANT_ID");
  process.exit(1);
}

async function main() {
  console.log("🔍 Obteniendo propiedades para generar tokens...");

  // 1. Obtener propiedades
  const propRes = await fetch(
    `${SUPABASE_URL}/rest/v1/properties?tenant_id=eq.${TENANT_ID}&select=id,name`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );

  if (!propRes.ok) {
    console.error("❌ Error al obtener propiedades:", await propRes.text());
    process.exit(1);
  }

  const properties: any[] = await propRes.json();
  console.log(`   Encontradas ${properties.length} propiedades.`);

  // 2. Generar tokens
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  const todayStr = now.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const tokens = properties.map(p => ({
    property_id: p.id,
    access_token: `test-${generateSecureToken(20)}`,
    valid_from: now.toISOString(),
    valid_until: tomorrow.toISOString(),
    checkin_date: todayStr,
    checkout_date: tomorrowStr,
    is_active: true
  }));

  console.log(`🚀 Insertando ${tokens.length} tokens de prueba...`);

  const insRes = await fetch(
    `${SUPABASE_URL}/rest/v1/guest_access_tokens`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
      },
      body: JSON.stringify(tokens),
    }
  );

  if (!insRes.ok) {
    console.error("❌ Error al insertar tokens:", await insRes.text());
    process.exit(1);
  }

  console.log("✅ Tokens generados con éxito. Ahora puedes ejecutar fetch-properties.ts de nuevo.");
}

main().catch(err => {
  console.error("❌ Error fatal:", err);
  process.exit(1);
});
