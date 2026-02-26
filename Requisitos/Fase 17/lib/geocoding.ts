'use server'

export interface GeocodingResult {
    lat: number;
    lng: number;
    city: string;
    country: string;
    countryCode: string;
    postalCode?: string;
    neighborhood?: string;
    timezone: string;
    confidence: number; // 0-1
    accuracy: 'rooftop' | 'street' | 'city' | 'region';
    source: 'google' | 'mapbox' | 'nominatim';
    formattedAddress: string;
}

/**
 * Geocode an address using multiple providers with fallback.
 * Order: Mapbox -> Google (if key exists) -> Nominatim
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult> {
    const mapboxKey = process.env.MAPBOX_API_KEY;
    const googleKey = process.env.GOOGLE_MAPS_API_KEY;

    // 1. Try Mapbox (Preferred for cost/quality ratio)
    if (mapboxKey) {
        try {
            return await geocodeWithMapbox(address, mapboxKey);
        } catch (error) {
            console.warn('Mapbox geocoding failed, trying next...', error);
        }
    }

    // 2. Try Google (Highest quality)
    if (googleKey) {
        try {
            return await geocodeWithGoogle(address, googleKey);
        } catch (error) {
            console.warn('Google geocoding failed, trying next...', error);
        }
    }

    // 3. Try Nominatim (Last resort, free but limited)
    try {
        return await geocodeWithNominatim(address);
    } catch (error) {
        console.error('All geocoding services failed');
        throw new Error('No se pudo geocodificar la dirección');
    }
}

async function geocodeWithMapbox(address: string, apiKey: string): Promise<GeocodingResult> {
    const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${apiKey}&limit=1`
    );

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
        throw new Error('Mapbox geocoding returned no results');
    }

    const result = data.features[0];
    const [lng, lat] = result.center;

    // Extract context
    const context = result.context || [];
    const postcode = context.find((c: any) => c.id.startsWith('postcode'));
    const place = context.find((c: any) => c.id.startsWith('place'));
    const country = context.find((c: any) => c.id.startsWith('country'));
    const neighborhood = context.find((c: any) => c.id.startsWith('neighborhood'));

    return {
        lat,
        lng,
        city: place?.text || '',
        country: country?.text || '',
        countryCode: country?.short_code?.toUpperCase() || '',
        postalCode: postcode?.text,
        neighborhood: neighborhood?.text,
        timezone: await getTimezone(lat, lng),
        confidence: result.relevance || 0.5,
        accuracy: mapMapboxAccuracy(result.place_type),
        source: 'mapbox',
        formattedAddress: result.place_name
    };
}

async function geocodeWithGoogle(address: string, apiKey: string): Promise<GeocodingResult> {
    const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );

    const data = await response.json();

    if (data.status !== 'OK' || !data.results[0]) {
        throw new Error(`Google geocoding failed: ${data.status}`);
    }

    const result = data.results[0];
    const components = result.address_components;

    const extract = (type: string, format: 'long_name' | 'short_name' = 'long_name') => {
        return components.find((c: any) => c.types.includes(type))?.[format] || '';
    };

    return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        city: extract('locality'),
        country: extract('country'),
        countryCode: extract('country', 'short_name'),
        postalCode: extract('postal_code'),
        neighborhood: extract('neighborhood') || extract('sublocality'),
        timezone: await getTimezone(result.geometry.location.lat, result.geometry.location.lng),
        confidence: result.geometry.location_type === 'ROOFTOP' ? 1.0 : 0.8,
        accuracy: result.geometry.location_type === 'ROOFTOP' ? 'rooftop' : 'street',
        source: 'google',
        formattedAddress: result.formatted_address
    };
}

async function geocodeWithNominatim(address: string): Promise<GeocodingResult> {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=1`,
        { headers: { 'User-Agent': 'GuideFlowApp/1.0' } }
    );

    const data = await response.json();

    if (!data || data.length === 0) {
        throw new Error('Nominatim geocoding returned no results');
    }

    const result = data[0];
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    return {
        lat,
        lng,
        city: result.address.city || result.address.town || result.address.village || '',
        country: result.address.country || '',
        countryCode: result.address.country_code?.toUpperCase() || '',
        postalCode: result.address.postcode,
        neighborhood: result.address.neighbourhood || result.address.suburb,
        timezone: await getTimezone(lat, lng),
        confidence: parseFloat(result.importance) || 0.5,
        accuracy: (['house', 'building'].includes(result.type)) ? 'rooftop' : 'street',
        source: 'nominatim',
        formattedAddress: result.display_name
    };
}

async function getTimezone(lat: number, lng: number): Promise<string> {
    // For now, default to European/Spanish or use a free API if needed
    // Mapbox doesn't provide timezone directly in geocoding
    // We can use a simple approximate or leave it for later enhancement
    return 'Europe/Madrid';
}

function mapMapboxAccuracy(placeTypes: string[]): GeocodingResult['accuracy'] {
    if (placeTypes.includes('address')) return 'rooftop';
    if (placeTypes.includes('street')) return 'street';
    if (placeTypes.includes('place')) return 'city';
    return 'region';
}
