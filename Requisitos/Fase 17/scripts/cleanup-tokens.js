const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupTokens() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    console.log(`Starting cleanup. Today is: ${todayStr}`);

    // Find tokens where checkout_date < today AND valid_until is still in the future
    const { data: oldTokens, error: fetchError } = await supabase
        .from('guest_access_tokens')
        .select('id, guest_name, checkout_date, valid_until')
        .lt('checkout_date', todayStr)
        .gt('valid_until', now.toISOString());

    if (fetchError) {
        console.error('Error fetching tokens:', fetchError.message);
        return;
    }

    if (!oldTokens || oldTokens.length === 0) {
        console.log('No old tokens found that need expiration.');
        return;
    }

    console.log(`Found ${oldTokens.length} tokens to expire.`);

    for (const token of oldTokens) {
        // Set expiration to the end of their checkout day (UTC)
        const checkoutEnd = new Date(token.checkout_date);
        checkoutEnd.setUTCHours(23, 59, 59, 999);

        console.log(`Expiring: ${token.guest_name} (Checkout: ${token.checkout_date}) -> New Valid Until: ${checkoutEnd.toISOString()}`);

        const { error: updateError } = await supabase
            .from('guest_access_tokens')
            .update({
                valid_until: checkoutEnd.toISOString(),
                is_active: false // Explicitly deactivate too for safety
            })
            .eq('id', token.id);

        if (updateError) {
            console.error(`Failed to update token ${token.id}:`, updateError.message);
        }
    }

    console.log('\nCleanup completed successfully.');
}

cleanupTokens();
