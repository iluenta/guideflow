const VALID_TOKEN_A = 'y0anfwgtphgbhplc3a5e1x3d';
const PROP_A = '8b16ae1d-d061-4b9d-8fe8-06a1b058c580';
const PROP_B = '37159afd-0eb0-498f-a756-38eb487527e7';
const BASE_URL = 'http://localhost:3000';

async function runTests() {
    console.log('🚀 Starting Phase 22 Security Isolation Tests...\n');

    // TEST 1: Valid Match
    console.log('TEST 1: Valid Token + Matching PropertyId...');
    try {
        const res1 = await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            body: JSON.stringify({
                accessToken: VALID_TOKEN_A,
                propertyId: PROP_A,
                messages: [{ role: 'user', content: 'test matching' }]
            })
        });
        console.log(`Result: ${res1.status} ${res1.statusText}`);
        if (res1.status === 200) console.log('✅ PASS'); else console.log('❌ FAIL');
    } catch (e) { console.error('Error in Test 1:', e.message); }

    // TEST 2: Property Mismatch
    console.log('\nTEST 2: Valid Token A + Attempting to query Property B...');
    try {
        const res2 = await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            body: JSON.stringify({
                accessToken: VALID_TOKEN_A,
                propertyId: PROP_B, // Mismatch!
                messages: [{ role: 'user', content: 'test theft attempt' }]
            })
        });
        console.log(`Result: ${res2.status} ${res2.statusText}`);
        const data2 = await res2.json();
        console.log('Reason:', data2.reason);
        if (res2.status === 403 && data2.reason === 'invalid_token') console.log('✅ PASS: Blocked as expected'); 
        else console.log('❌ FAIL: Should have been blocked with 403');
    } catch (e) { console.error('Error in Test 2:', e.message); }

    // TEST 3: Translation API Isolation
    console.log('\nTEST 3: Translation API - Token A + Property B mismatch...');
    try {
        const res3 = await fetch(`${BASE_URL}/api/translate-guide`, {
            method: 'POST',
            body: JSON.stringify({
                accessToken: VALID_TOKEN_A,
                propertyId: PROP_B, // Mismatch!
                text: 'hola',
                targetLanguage: 'en'
            })
        });
        console.log(`Result: ${res3.status} ${res3.statusText}`);
        if (res3.status === 401) console.log('✅ PASS: Unauthorized as expected');
        else console.log('❌ FAIL: Should have been 401/403');
    } catch (e) { console.error('Error in Test 3:', e.message); }

    console.log('\nTests completed.');
}

runTests();
