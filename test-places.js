import 'dotenv/config';

const key = process.env.GOOGLE_PLACES_API_KEY;
const lat = 40.347719; // Aprox near c/ berrocal 1, Madrid
const lng = -3.693457;

if (!key) {
    console.error("NO GOOGLE_PLACES_API_KEY");
    process.exit(1);
}

async function check(type, keyword) {
    let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&type=${type}&language=es&key=${key}`;
    if (keyword) url += `&keyword=${keyword}`;

    const res = await fetch(url);
    const data = await res.json();
    console.log(`\n\n=== Type: ${type} | Keyword: ${keyword || 'None'} ===`);
    console.log(`Found: ${data.results?.length || 0}`);
    if (data.results) {
        console.log(JSON.stringify(data.results.slice(0, 3).map(r => ({ name: r.name, vicinity: r.vicinity, types: r.types })), null, 2));
    }
}

async function run() {
    await check('hospital');
    await check('health');
    await check('hospital', 'urgencias');
    await check('doctor');
}
run();
