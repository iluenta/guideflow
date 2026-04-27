/**
 * scripts/delete-property.js
 * Script para borrar una propiedad y toda su información relacionada en cascada manual.
 * Uso: node scripts/delete-property.js <PROPERTY_ID>
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const useInsecure = process.env.DEV_ALLOW_INSECURE_SSL === '1' || process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

function makeInsecureFetch() {
  const agent = new https.Agent({ rejectUnauthorized: false });
  return function insecureFetch(input, init) {
    const urlStr = typeof input === 'string' ? input : (input && input.url);
    if (!urlStr) return Promise.reject(new Error('Invalid fetch input'));
    const u = new URL(urlStr);
    const options = init || {};
    const method = (options.method || 'GET').toUpperCase();
    const headers = options.headers || {};
    const headerObj = headers instanceof Headers ? Object.fromEntries(headers) : headers;
    
    return new Promise((resolve, reject) => {
      const opts = {
        hostname: u.hostname,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        path: u.pathname + u.search,
        method,
        headers: headerObj,
        agent: u.protocol === 'https:' ? agent : undefined
      };
      const mod = u.protocol === 'https:' ? https : require('http');
      const req = mod.request(opts, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const body = (res.statusCode === 204 || res.statusCode === 205 || res.statusCode === 304) 
            ? null 
            : Buffer.concat(chunks);
          
          resolve(new Response(body, {
            status: res.statusCode,
            statusText: res.statusMessage,
            headers: new Headers(res.headers)
          }));
        });
      });
      req.on('error', reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  };
}

const propertyId = process.argv[2];
if (!propertyId) {
  console.error('❌ Error: ID de propiedad requerido.');
  console.log('Uso: node scripts/delete-property.js <PROPERTY_ID>');
  process.exit(1);
}

const clientOptions = {
  auth: { autoRefreshToken: false, persistSession: false }
};

if (useInsecure) {
  console.log('⚠️  Usando modo insecure fetch...');
  clientOptions.global = { fetch: makeInsecureFetch() };
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, clientOptions);

async function deletePropertyData() {
  console.log(`\n🧹 Iniciando borrado total para propiedad: ${propertyId}\n`);

  try {
    // 1. Verificar que la propiedad existe
    const { data: prop, error: fetchErr } = await supabaseAdmin
      .from('properties')
      .select('name')
      .eq('id', propertyId)
      .single();

    if (fetchErr) {
      console.error(`❌ Error de conexión o consulta: ${fetchErr.message}`);
      if (fetchErr.hint) console.log(`   Hint: ${fetchErr.hint}`);
      process.exit(1);
    }

    if (!prop) {
      console.error('❌ Propiedad no encontrada.');
      process.exit(1);
    }

    console.log(`🏠 Propiedad encontrada: "${prop.name}"`);
    console.log('--------------------------------------------------');

    // TABLAS RELACIONADAS POR OTROS IDs (Dependencias indirectas)
    
    // manual_embeddings (via property_manuals)
    console.log('🔄 Borrando manual_embeddings...');
    const { data: manuals } = await supabaseAdmin.from('property_manuals').select('id').eq('property_id', propertyId);
    if (manuals && manuals.length > 0) {
      const manualIds = manuals.map(m => m.id);
      await supabaseAdmin.from('manual_embeddings').delete().in('manual_id', manualIds);
    }

    // suspicious_activities (via guest_access_tokens)
    console.log('🔄 Borrando suspicious_activities...');
    const { data: tokens } = await supabaseAdmin.from('guest_access_tokens').select('access_token').eq('property_id', propertyId);
    if (tokens && tokens.length > 0) {
      const tokenStrings = tokens.map(t => t.access_token);
      await supabaseAdmin.from('suspicious_activities').delete().in('access_token', tokenStrings);
    }

    // TABLAS DIRECTAS (por property_id)
    const tables = [
      'ai_usage_log',
      'appliance_images',
      'context_embeddings',
      'guest_access_tokens',
      'guest_chats',
      'guide_section_views',
      'guide_sections',
      'property_branding',
      'property_context',
      'property_faqs',
      'property_manuals',
      'property_recommendations',
      'translation_cache',
      'unanswered_questions'
    ];

    for (const table of tables) {
      console.log(`🔄 Borrando de ${table}...`);
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq('property_id', propertyId);
      
      if (error) {
        console.warn(`   ⚠️ Advertencia en ${table}: ${error.message}`);
      }
    }

    // FINAL: La propiedad misma
    console.log('🚨 Borrando registro principal en "properties"...');
    const { error: finalErr } = await supabaseAdmin
      .from('properties')
      .delete()
      .eq('id', propertyId);

    if (finalErr) {
      throw new Error(`Error al borrar la propiedad: ${finalErr.message}`);
    }

    console.log('\n✅ BORRADO COMPLETADO CON ÉXITO.');
    console.log(`La propiedad ${propertyId} y todos sus datos asociados han sido eliminados.\n`);

  } catch (err) {
    console.error(`\n❌ ERROR FATAL: ${err.message}`);
    process.exit(1);
  }
}

deletePropertyData();
