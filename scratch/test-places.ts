
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function test() {
    const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_AI_API_KEY;
    
    const lat = 40.416492; // Sol, Madrid
    const lng = -3.706036;
    
    const keyword = 'cafetería';
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=2000&keyword=${encodeURIComponent(keyword)}&key=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    
    console.log('Status:', data.status);
    console.log('Results count:', data.results?.length);
    
    data.results?.slice(0, 10).forEach((r: any) => {
        console.log(`- ${r.name} | ${r.vicinity} | Dist: ${haversineMeters(lat, lng, r.geometry.location.lat, r.geometry.location.lng).toFixed(0)}m`);
    });
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

test();
