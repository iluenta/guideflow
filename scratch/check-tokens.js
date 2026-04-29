const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkTokens() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: prop } = await supabase
        .from('properties')
        .select('id, name')
        .eq('slug', 'veratespera')
        .single();

    if (!prop) { console.error('Property not found'); return; }
    console.log('Property:', prop.name, '(' + prop.id + ')');

    const { data: tokens, error } = await supabase
        .from('guest_access_tokens')
        .select('access_token, guest_name, checkin_date, checkout_date, valid_from, valid_until, is_active, language')
        .eq('property_id', prop.id)
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) { console.error('Error:', error); return; }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    console.log('\n--- Últimos 5 tokens ---');
    tokens.forEach(t => {
        const cin = t.checkin_date ? new Date(t.checkin_date) : null;
        const cout = t.checkout_date ? new Date(t.checkout_date) : null;
        if (cin) cin.setHours(0, 0, 0, 0);
        if (cout) cout.setHours(0, 0, 0, 0);
        const days = cin ? Math.floor((today - cin) / 86400000) : '?';
        const isCheckoutDay = cout && today.getTime() === cout.getTime();

        console.log(`\nGuest: ${t.guest_name}`);
        console.log(`Token: ${t.access_token.substring(0, 8)}...`);
        console.log(`Checkin:  ${t.checkin_date || 'NULL'}`);
        console.log(`Checkout: ${t.checkout_date || 'NULL'}`);
        console.log(`Active: ${t.is_active}, Lang: ${t.language}`);
        console.log(`Days from checkin: ${days}`);
        console.log(`Is checkout day: ${isCheckoutDay}`);
        console.log(`→ checkRowType: ${
            !t.checkin_date ? 'checkout (sin fecha)' :
            days <= 1 ? 'CHECKIN' :
            isCheckoutDay ? 'CHECKOUT-TODAY' :
            'checkout'
        }`);
    });
}

checkTokens();
