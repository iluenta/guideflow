/**
 * Applies migration 048_guest_link_analytics:
 * - Adds access_token, device_fingerprint, user_agent, ip_address to guide_section_views
 * - Adds first_opened_at, last_seen_at, open_count, device_fingerprint,
 *   ip_first_access, user_agent_first to guest_access_tokens
 *
 * Usage: node scripts/apply-migration-048-link-analytics.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log('Applying migration 048_guest_link_analytics...\n');

    const steps = [
        {
            label: 'guide_section_views: ADD COLUMN access_token',
            sql: `ALTER TABLE guide_section_views ADD COLUMN IF NOT EXISTS access_token TEXT`
        },
        {
            label: 'guide_section_views: ADD COLUMN device_fingerprint',
            sql: `ALTER TABLE guide_section_views ADD COLUMN IF NOT EXISTS device_fingerprint TEXT`
        },
        {
            label: 'guide_section_views: ADD COLUMN user_agent',
            sql: `ALTER TABLE guide_section_views ADD COLUMN IF NOT EXISTS user_agent TEXT`
        },
        {
            label: 'guide_section_views: ADD COLUMN ip_address',
            sql: `ALTER TABLE guide_section_views ADD COLUMN IF NOT EXISTS ip_address TEXT`
        },
        {
            label: 'guide_section_views: CREATE INDEX gsv_token_idx',
            sql: `CREATE INDEX IF NOT EXISTS gsv_token_idx ON guide_section_views(access_token)`
        },
        {
            label: 'guide_section_views: CREATE INDEX gsv_viewed_at_idx',
            sql: `CREATE INDEX IF NOT EXISTS gsv_viewed_at_idx ON guide_section_views(viewed_at DESC)`
        },
        {
            label: 'guest_access_tokens: ADD COLUMN first_opened_at',
            sql: `ALTER TABLE guest_access_tokens ADD COLUMN IF NOT EXISTS first_opened_at TIMESTAMPTZ`
        },
        {
            label: 'guest_access_tokens: ADD COLUMN last_seen_at',
            sql: `ALTER TABLE guest_access_tokens ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ`
        },
        {
            label: 'guest_access_tokens: ADD COLUMN open_count',
            sql: `ALTER TABLE guest_access_tokens ADD COLUMN IF NOT EXISTS open_count INTEGER DEFAULT 0`
        },
        {
            label: 'guest_access_tokens: ADD COLUMN device_fingerprint',
            sql: `ALTER TABLE guest_access_tokens ADD COLUMN IF NOT EXISTS device_fingerprint TEXT`
        },
        {
            label: 'guest_access_tokens: ADD COLUMN ip_first_access',
            sql: `ALTER TABLE guest_access_tokens ADD COLUMN IF NOT EXISTS ip_first_access TEXT`
        },
        {
            label: 'guest_access_tokens: ADD COLUMN user_agent_first',
            sql: `ALTER TABLE guest_access_tokens ADD COLUMN IF NOT EXISTS user_agent_first TEXT`
        },
    ];

    let ok = 0;
    let failed = 0;
    const manualSteps = [];

    for (const step of steps) {
        const { error } = await supabase.rpc('execute_sql_raw', { sql_query: step.sql });
        if (error) {
            console.warn(`  ⚠️  [${step.label}] ${error.message}`);
            manualSteps.push(step.sql);
            failed++;
        } else {
            console.log(`  ✅ ${step.label}`);
            ok++;
        }
    }

    console.log(`\n${ok} steps OK, ${failed} failed.`);

    if (manualSteps.length > 0) {
        console.log('\nRun these manually in the Supabase SQL editor:');
        manualSteps.forEach(sql => console.log(`  ${sql};`));
    } else {
        console.log('Migration applied successfully.');
    }
}

run().catch(console.error);
