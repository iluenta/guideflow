/**
 * Applies migration 048: adds has_access_code and access_code columns to properties.
 *
 * Usage: node scripts/apply-migration-048.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log('Applying migration 048: add access_code fields to properties...');

    const steps = [
        {
            label: 'ADD COLUMN has_access_code',
            sql: `ALTER TABLE properties ADD COLUMN IF NOT EXISTS has_access_code BOOLEAN DEFAULT false`
        },
        {
            label: 'ADD COLUMN access_code',
            sql: `ALTER TABLE properties ADD COLUMN IF NOT EXISTS access_code TEXT`
        }
    ];

    for (const step of steps) {
        const { error } = await supabase.rpc('execute_sql_raw', { sql_query: step.sql });
        if (error) {
            console.warn(`  [${step.label}] RPC failed: ${error.message}`);
            console.warn(`  → Run manually in Supabase SQL editor:\n    ${step.sql};`);
        } else {
            console.log(`  ✅ ${step.label}`);
        }
    }

    console.log('\nDone. If any steps failed, run the SQL manually in the Supabase dashboard.');
}

run().catch(console.error);
