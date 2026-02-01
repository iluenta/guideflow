const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function auditTokens() {
    const { data, error } = await supabase
        .from('guest_access_tokens')
        .select('*')
        .order('valid_until', { ascending: false });

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    const now = new Date();
    console.log(`Audit at: ${now.toISOString()}\n`);
    console.log(`| Guest Name | Valid Until (UTC) | Status | Days left/since |`);
    console.log(`|------------|-------------------|--------|-----------------|`);

    data.forEach(token => {
        const until = new Date(token.valid_until);
        const diff = (until - now) / (1000 * 60 * 60 * 24);
        const status = now > until ? 'EXPIRED' : 'ACTIVE';
        console.log(`| ${token.guest_name.padEnd(10)} | ${token.valid_until} | ${status.padEnd(7)} | ${diff.toFixed(2).padStart(15)} |`);
    });
}

auditTokens();
