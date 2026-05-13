/**
 * scripts/cleanup-property-scans.js
 * Script para vaciar completamente el bucket 'property_scans'.
 * Uso: node scripts/cleanup-property-scans.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const { createClient } = require('@supabase/supabase-js');

// Forzar ignorar errores de SSL si es necesario
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function cleanupBucket() {
  const BUCKET_NAME = 'property_scans';
  console.log(`\n🧹 Iniciando limpieza del bucket: ${BUCKET_NAME}\n`);

  try {
    async function listAndRemove(folder = '') {
      const { data: files, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .list(folder, { limit: 100, offset: 0 });

      if (error) {
        throw new Error(`Error al listar archivos en "${folder}": ${error.message}`);
      }

      if (!files || files.length === 0) return;

      const filesToRemove = [];
      const subFolders = [];

      for (const file of files) {
        const fullPath = folder ? `${folder}/${file.name}` : file.name;
        if (file.id === null) {
          subFolders.push(fullPath);
        } else {
          filesToRemove.push(fullPath);
        }
      }

      if (filesToRemove.length > 0) {
        console.log(`🗑️  Borrando ${filesToRemove.length} archivos de "${folder || 'root'}"...`);
        const { error: removeErr } = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .remove(filesToRemove);
        
        if (removeErr) {
          console.error(`   ❌ Error al borrar archivos: ${removeErr.message}`);
        } else {
          console.log(`   ✅ Archivos borrados.`);
        }
      }

      for (const subFolder of subFolders) {
        await listAndRemove(subFolder);
      }
    }

    await listAndRemove();
    console.log('\n✨ LIMPIEZA COMPLETADA.\n');

  } catch (err) {
    console.error(`\n❌ ERROR: ${err.message}`);
    process.exit(1);
  }
}

cleanupBucket();
