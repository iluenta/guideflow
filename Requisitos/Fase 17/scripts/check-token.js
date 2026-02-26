const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkToken(token) {
    console.log(`Checking token: ${token}`);
    const { data, error } = await supabase
        .from('guest_access_tokens')
        .select('*')
        .eq('access_token', token)
        .single();

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    if (!data) {
        console.log('Token not found');
        return;
    }

    console.log('Token Data:');
    console.log(JSON.stringify(data, null, 2));

    const now = new Date();
    const until = new Date(data.valid_until);
    console.log(`\nNow (UTC): ${now.toISOString()}`);
    console.log(`Valid Until (UTC): ${until.toISOString()}`);
    console.log(`Is Expired: ${now > until}`);
}

const token = process.argv[2] || 'b92xnyzwu9p8vsvmsd8vx2c1';
checkToken(token);
