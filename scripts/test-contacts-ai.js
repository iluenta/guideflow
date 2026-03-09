const fetch = require('node-fetch');

async function testContacts() {
    const payload = {
        propertyId: '8028f877-66a9-467a-8f13-68f6453d865c', // A valid ID from the database or a mock one if needed
        section: 'contacts',
        existingData: {
            address: 'Calle de Toledo 63, Madrid',
            coordinates: { lat: 40.4103, lng: -3.7078 }
        }
    };

    console.log('Testing contacts generation...');
    try {
        const response = await fetch('http://localhost:3000/api/ai-fill-context', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Response status:', response.status);
        console.log('Emergency Contacts:', JSON.stringify(data.emergency_contacts, null, 2));

        if (data.emergency_contacts) {
            const hasPhone = data.emergency_contacts.some(c => c.phone && c.phone.length > 3);
            const hasMcDonalds = data.emergency_contacts.some(c => c.name.toLowerCase().includes('mcdonald'));

            console.log('\nVerification Results:');
            console.log('- Phone numbers present:', hasPhone ? '✅' : '❌');
            console.log('- McDonald\'s filtered out:', !hasMcDonalds ? '✅' : '❌');
        }
    } catch (error) {
        console.error('Error during test:', error.message);
    }
}

testContacts();
