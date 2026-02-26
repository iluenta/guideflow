const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixToken(token) {
    console.log(`Fixing token: ${token}`);

    // 1. Get property details
    const { data: tokenData } = await supabase
        .from('guest_access_tokens')
        .select('property_id, checkout_date')
        .eq('access_token', token)
        .single();

    if (!tokenData) {
        console.error('Token not found');
        return;
    }

    const { data: property } = await supabase
        .from('properties')
        .select('slug, tenant_id')
        .eq('id', tokenData.property_id)
        .single();

    console.log(`Property: ${property?.slug} (Owner Tenant: ${property?.tenant_id})`);

    // 2. Force expiration to yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const expiredDate = yesterday.toISOString();

    const { error } = await supabase
        .from('guest_access_tokens')
        .update({ valid_until: expiredDate })
        .eq('access_token', token);

    if (error) {
        console.error('Update Error:', error.message);
    } else {
        console.log(`Token ${token} has been EXPIRED (set to ${expiredDate})`);
    }
}

const token = process.argv[2] || 'b92xnyzwu9p8vsvmsd8vx2c1';
fixToken(token);
