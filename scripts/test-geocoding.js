/**
 * Test script for geocoding and transport functionality
 */

const { geocodeAddress } = require('../lib/geocoding');
const { discoverNearbyAirports } = require('../lib/discovery/airports');
const { discoverNearbyAirportsFallback } = require('../lib/discovery/airports-fallback');

async function testGeocoding() {
    console.log('🧪 Testing geocoding and transport discovery...\n');

    const testAddresses = [
        'C/ Oso, 10, Madrid',
        'Plaza Cataluña, Barcelona',
        'Calle Larios, Málaga'
    ];

    for (const address of testAddresses) {
        console.log(`📍 Testing address: ${address}`);
        
        try {
            // Test geocoding
            const geo = await geocodeAddress(address);
            console.log(`✅ Geocoding successful:`);
            console.log(`   - City: ${geo.city}`);
            console.log(`   - Country: ${geo.country}`);
            console.log(`   - Coordinates: ${geo.lat}, ${geo.lng}`);
            console.log(`   - Source: ${geo.source}`);
            console.log(`   - Confidence: ${geo.confidence}`);

            // Test airport discovery
            const coords = [geo.lng, geo.lat];
            console.log(`\n✈️ Testing airport discovery...`);
            
            try {
                const airports = await discoverNearbyAirports(coords, 150);
                console.log(`✅ Found ${airports.length} airports:`);
                airports.slice(0, 3).forEach((airport, i) => {
                    console.log(`   ${i + 1}. ${airport.name} (${airport.code}) - ${airport.distance_km}km`);
                });
            } catch (airportError) {
                console.log(`❌ Airport discovery failed: ${airportError.message}`);
                
                // Test fallback
                console.log(`🔄 Testing fallback airports...`);
                const fallbackAirports = await discoverNearbyAirportsFallback(coords, 150);
                console.log(`✅ Fallback found ${fallbackAirports.length} airports:`);
                fallbackAirports.slice(0, 3).forEach((airport, i) => {
                    console.log(`   ${i + 1}. ${airport.name} (${airport.code}) - ${airport.distance_km}km`);
                });
            }

        } catch (error) {
            console.log(`❌ Geocoding failed: ${error.message}`);
        }
        
        console.log('\n' + '='.repeat(60) + '\n');
    }
}

// Run the test
testGeocoding().catch(console.error);
