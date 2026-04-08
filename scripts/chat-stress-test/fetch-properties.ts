/**
 * fetch-properties.ts
 * Genera properties.json con todas tus propiedades desde Supabase.
 * Ejecútalo una vez antes del stress test.
 *
 * Uso:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... TENANT_ID=... npx ts-node fetch-properties.ts
 *
 * O con .env.stress en la raíz:
 *   npx dotenv -e ../../.env.stress -- ts-node fetch-properties.ts
 */

import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";

config({ path: path.resolve(__dirname, "../../.env.stress") });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const TENANT_ID = process.env.TENANT_ID!;

if (!SUPABASE_URL || !SUPABASE_KEY || !TENANT_ID) {
  console.error("❌ Faltan variables: SUPABASE_URL, SUPABASE_SERVICE_KEY, TENANT_ID");
  process.exit(1);
}

async function main() {
  console.log("🔍 Obteniendo propiedades de Supabase...");

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/properties?tenant_id=eq.${TENANT_ID}&select=id,name`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );

  if (!res.ok) {
    console.error("❌ Error al obtener propiedades:", await res.text());
    process.exit(1);
  }

  const data: any[] = await res.json();

  // Obtener un token activo por propiedad desde guest_access_tokens
  const now = new Date().toISOString();
  const tokensRes = await fetch(
    `${SUPABASE_URL}/rest/v1/guest_access_tokens?is_active=eq.true&valid_from=lte.${now}&valid_until=gte.${now}&select=property_id,access_token&limit=200`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
  );

  // Token activo por propiedad (el primero que encontremos sirve)
  const tokenByProperty: Record<string, string> = {};
  if (tokensRes.ok) {
    const tokens: { property_id: string; access_token: string }[] = await tokensRes.json();
    tokens.forEach((t) => {
      if (!tokenByProperty[t.property_id]) tokenByProperty[t.property_id] = t.access_token;
    });
    console.log(`   ${Object.keys(tokenByProperty).length} propiedades con token activo encontrado`);
  } else {
    console.warn("   ⚠ No se pudieron obtener tokens — el test usará propertyId (requiere sesión host)");
  }

  const properties = data.map((p) => ({
    id: p.id,
    name: p.name,
    accessToken: tokenByProperty[p.id] || undefined,
  }));

  const outPath = path.join(__dirname, "properties.json");
  fs.writeFileSync(outPath, JSON.stringify(properties, null, 2));

  console.log(`\n✅ ${properties.length} propiedades guardadas en properties.json`);
  const withToken = properties.filter((p) => p.accessToken).length;
  console.log(`   ${withToken} con accessToken | ${properties.length - withToken} sin token (solo propertyId)\n`);
  console.table(
    properties.map((p) => ({
      id: p.id.slice(0, 8) + "...",
      name: p.name,
    }))
  );

  // Detectar propiedades poco configuradas (pocas secciones en guide_sections)
  console.log("\n🔍 Detectando propiedades poco configuradas...");
  const guideRes = await fetch(
    `${SUPABASE_URL}/rest/v1/guide_sections?tenant_id=eq.${TENANT_ID}&select=property_id`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );

  if (guideRes.ok) {
    const guideSections: { property_id: string }[] = await guideRes.json();
    const countByProperty: Record<string, number> = {};
    guideSections.forEach((s) => {
      countByProperty[s.property_id] = (countByProperty[s.property_id] || 0) + 1;
    });

    const values = Object.values(countByProperty);
    const avg = values.length
      ? values.reduce((a, b) => a + b, 0) / values.length
      : 0;

    const lowConfigured = properties
      .filter((p) => (countByProperty[p.id] || 0) < avg * 0.5)
      .map((p) => p.id);

    const lowPath = path.join(__dirname, "low-configured-ids.json");
    fs.writeFileSync(lowPath, JSON.stringify(lowConfigured, null, 2));
    console.log(
      `   Media de secciones por propiedad: ${avg.toFixed(1)}`
    );
    console.log(
      `   ${lowConfigured.length} propiedades con <50% del promedio → low-configured-ids.json`
    );
  } else {
    console.warn("   ⚠ No se pudo acceder a guide_sections — low-configured-ids.json no generado");
  }
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
