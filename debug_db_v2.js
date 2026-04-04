const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Cargar variables de entorno manualmente de .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').map(line => line.trim()).forEach(line => {
    if (line && !line.startsWith('#')) {
        const parts = line.split('=');
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

async function debug() {
    const email = 'veratespera@gmail.com';
    
    console.log('--- Debugging for', email, '---');
    
    // 1. Check Profile
    const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
    
    if (pError) {
        console.error('Profile Error:', pError.message);
    } else {
        console.log('Profile tenant_id:', profile.tenant_id);
    }

    // 2. Total Guest Chats count
    const { count, error: cError } = await supabase
        .from('guest_chats')
        .select('*', { count: 'exact', head: true });
    
    if (cError) console.error('Total Chats Error:', cError.message);
    else console.log('Total Chats in DB:', count);

    // 4. Check Guest Chats for this tenant
    const { count: tCount, error: tcError } = await supabase
        .from('guest_chats')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', profile.tenant_id);
    
    if (tcError) console.error('Tenant Chats Error:', tcError.message);
    else console.log('TOTAL CHATS FOR THIS TENANT:', tCount);

    // 5. Total count regardless of tenant
    const { count: allCount } = await supabase
        .from('guest_chats')
        .select('*', { count: 'exact', head: true });
    console.log('TOTAL CHATS IN DATABASE:', allCount);
}

debug();
