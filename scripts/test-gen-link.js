const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function test() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const email = 'kekacek129@gamening.com';

    console.log('Testing generateLink for magiclink...');
    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: { redirectTo: 'http://localhost:3000/auth/callback' }
    });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Result Data:', JSON.stringify(data, null, 2));
    const link = data.properties?.action_link || data.action_link;
    console.log('Link:', link);
}

test();
