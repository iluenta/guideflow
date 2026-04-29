
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkProperty() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    const { data: prop, error: propError } = await supabase
        .from('properties')
        .select('*')
        .eq('slug', 'veratespera')
        .single();
        
    if (propError) {
        console.error('Error fetching property:', propError);
        return;
    }
    
    console.log('--- Property Table ---');
    console.log('ID:', prop.id);
    console.log('Name:', prop.name);
    console.log('Has Parking:', prop.has_parking);
    console.log('Parking Number:', prop.parking_number);
    
    const { data: context, error: ctxError } = await supabase
        .from('property_context')
        .select('*')
        .eq('property_id', prop.id);
        
    if (ctxError) {
        console.error('Error fetching context:', ctxError);
        return;
    }
    
    console.log('\n--- Property Context ---');
    context.forEach(c => {
        console.log(`Category: ${c.category}`);
        console.log('Content:', JSON.stringify(c.content, null, 2));
    });
}

checkProperty();
