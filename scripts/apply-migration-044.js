/**
 * Applies migration 044: adds hash + property_id columns and unique index
 * to translation_cache so that translation upserts actually persist.
 *
 * Usage: node scripts/apply-migration-044.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log('Applying migration 044: fix translation_cache constraint...');

    const steps = [
        {
            label: 'ADD COLUMN hash',
            sql: `ALTER TABLE translation_cache ADD COLUMN IF NOT EXISTS hash VARCHAR(64)`
        },
        {
            label: 'ADD COLUMN property_id',
            sql: `ALTER TABLE translation_cache ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE CASCADE`
        },
        {
            label: 'ADD COLUMN source_lang',
            sql: `ALTER TABLE translation_cache ADD COLUMN IF NOT EXISTS source_lang VARCHAR(5)`
        },
        {
            label: 'ADD COLUMN target_lang',
            sql: `ALTER TABLE translation_cache ADD COLUMN IF NOT EXISTS target_lang VARCHAR(5)`
        },
        {
            label: 'CREATE UNIQUE INDEX idx_translation_cache_hash_property',
            sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_translation_cache_hash_property ON translation_cache(hash, property_id)`
        },
    ];

    for (const step of steps) {
        const { error } = await supabase.rpc('execute_sql_raw', { sql_query: step.sql });
        if (error) {
            // Fallback: try direct query via REST (some DDL may work depending on permissions)
            console.warn(`  [${step.label}] RPC failed: ${error.message}`);
            console.warn(`  → Run manually in Supabase SQL editor:\n    ${step.sql};`);
        } else {
            console.log(`  ✅ ${step.label}`);
        }
    }

    console.log('\nDone. If any steps failed, run the SQL manually in the Supabase dashboard.');
    console.log('SQL file: supabase/migrations/044_fix_translation_cache_constraint.sql');
}

run().catch(console.error);
