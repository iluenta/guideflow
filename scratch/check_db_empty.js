const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Disable SSL verification for development if needed
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
        const parts = trimmed.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
            env[key] = value;
        }
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key not found in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
    'tenants',
    'profiles',
    'properties',
    'guide_sections',
    'guide_items',
    'guest_chats',
    'guest_chat_messages',
    'appliance_manuals',
    'property_inventory',
    'recommendations',
    'translation_cache',
    'beta_signups',
    'analytics_page_views',
    'analytics_events'
];

async function checkDatabase() {
    console.log('--- Verificando estado de la base de datos ---');
    console.log('URL:', supabaseUrl);
    
    let totalRows = 0;
    const results = [];

    for (const table of tables) {
        try {
            const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                if (error.code === '42P01') {
                    results.push({ table, status: 'NO EXISTE', count: '-' });
                } else {
                    results.push({ table, status: 'ERROR', count: error.message });
                }
            } else {
                results.push({ table, status: 'OK', count });
                totalRows += (count || 0);
            }
        } catch (e) {
            results.push({ table, status: 'EXCEPCIÓN', count: e.message });
        }
    }

    console.table(results);
    console.log('\nTOTAL DE FILAS ENCONTRADAS:', totalRows);
    
    if (totalRows === 0) {
        console.log('\n✅ LA BASE DE DATOS ESTÁ COMPLETAMENTE VACÍA.');
    } else {
        console.log('\n⚠️ LA BASE DE DATOS CONTIENE DATOS.');
    }
}

checkDatabase();
