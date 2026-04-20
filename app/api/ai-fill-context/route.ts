import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

import { streamGeminiREST } from '@/lib/ai/clients/gemini-rest';
import { logger } from '@/lib/logger';
import { RateLimiter } from '@/lib/security/rate-limiter';
import { logSuspiciousActivity } from '@/lib/security';
import { getTenantId } from '@/app/actions/properties';
import { generateArrivalInstructions } from '@/lib/arrival/generator-final';

const getGenAI = () => {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error('Google AI API Key no configurada');
  return new GoogleGenerativeAI(key);
};

// ═══════════════════════════════════════════════════════════════════════════
// ZONE DETECTION
// BUG FIX: Google Places API no permite rankby=prominence con radius.
// Usamos radius sin rankby para el check de densidad.
// ═══════════════════════════════════════════════════════════════════════════
type ZoneType = 'metropolis' | 'city' | 'town' | 'rural';
interface ZoneInfo {
  type: ZoneType;
  walkRadius: number;
  driveRadius: number;
  label: string;
  preferCar: boolean;
}

async function detectZoneType(lat: number, lng: number, placesKey: string): Promise<ZoneInfo> {
  try {
    // Sin rankby para poder usar radius
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}&radius=800&type=restaurant&key=${placesKey}`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      logger.error(`[ZONE] ❌ Error de Google detectZoneType: ${data.status} - ${data.error_message || 'N/A'}`);
    }
    
    const count: number = data.results?.length ?? 0;

    if (count >= 15) return { type: 'metropolis', walkRadius: 1000, driveRadius: 5000, label: 'gran ciudad', preferCar: false };
    if (count >= 8) return { type: 'city', walkRadius: 1800, driveRadius: 8000, label: 'ciudad', preferCar: false };
    if (count >= 3) return { type: 'town', walkRadius: 4000, driveRadius: 15000, label: 'pueblo', preferCar: true };
    return { type: 'rural', walkRadius: 6000, driveRadius: 30000, label: 'zona rural', preferCar: true };
  } catch (e) {
    logger.warn('[ZONE] Detection failed, defaulting to city:', e);
    return { type: 'city', walkRadius: 2000, driveRadius: 8000, label: 'ciudad', preferCar: false };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CATEGORY MAPS
// ═══════════════════════════════════════════════════════════════════════════
// ── MVP QUOTA: Lo imprescindible para el primer dia del huesped ──────────
// Criterio: gestor de apartamentos turisticos
// 1. Supermercado    → compra del primer dia
// 2. Restaurante     → si no quiere cocinar al llegar
// 3. Cafeteria       → desayuno del dia siguiente
// 4. Farmacia        → necesidad basica de salud
// 5. Transporte/ocio → orientarse en la ciudad
// 6. Tapas/bar       → salir a tomar algo la primera noche (tipico en España)
// 7. Cultura         → que ver cerca sin planificar mucho
// Total: 7 categorias × 2 = 14 recomendaciones, 7 llamadas a Places
const TODOS_QUOTA: Record<string, { quota: number; placeType: string; keywords: string[] }> = {
  supermercados: { quota: 2, placeType: 'supermarket', keywords: ['supermercado', 'supermarket', 'mercadona', 'consum', 'lidl', 'spar'] },
  restaurantes: { quota: 2, placeType: 'restaurant', keywords: ['restaurante popular', 'cocina local'] },
  desayuno: { quota: 2, placeType: 'cafe', keywords: ['cafetería', 'desayuno', 'brunch'] },
  tapas: { quota: 2, placeType: 'bar', keywords: ['bar tapas', 'pinchos', 'vinos'] },
  cultura: { quota: 2, placeType: 'tourist_attraction', keywords: ['monumento', 'museo', 'qué ver'] },
  naturaleza: { quota: 2, placeType: 'park', keywords: ['parque', 'jardín', 'zona verde'] },
  ocio_nocturno: { quota: 2, placeType: 'night_club', keywords: ['bar copas', 'música', 'ocio nocturno'] },
};

const SINGLE_CAT_MAP: Record<string, { placeType: string; keywords: string[] }> = {
  restaurantes: { placeType: 'restaurant', keywords: ['restaurante', 'cocina local', 'gastronomía'] },
  italiano: { placeType: 'restaurant', keywords: ['restaurante italiano', 'pizzería'] },
  mediterraneo: { placeType: 'restaurant', keywords: ['restaurante mediterráneo', 'mariscos'] },
  hamburguesas: { placeType: 'restaurant', keywords: ['hamburguesas', 'burger gourmet'] },
  asiatico: { placeType: 'restaurant', keywords: ['restaurante asiático', 'sushi', 'japonés'] },
  alta_cocina: { placeType: 'restaurant', keywords: ['restaurante gourmet', 'fine dining'] },
  internacional: { placeType: 'restaurant', keywords: ['restaurante mexicano', 'indio', 'árabe'] },
  desayuno: { placeType: 'cafe', keywords: ['cafetería', 'desayuno', 'brunch', 'specialty coffee'] },
  cafe: { placeType: 'cafe', keywords: ['café espresso', 'specialty', 'cafetería'] },
  tapas: { placeType: 'bar', keywords: ['bar tapas', 'pinchos', 'vinos'] },
  compras: { placeType: 'shopping_mall', keywords: ['centro comercial', 'tiendas moda', 'boutique'] },
  supermercados: { placeType: 'supermarket', keywords: ['supermercado', 'mercadona', 'carrefour', 'lidl'] },
  cultura: { placeType: 'museum', keywords: ['museo arte', 'monumento histórico', 'qué ver'] },
  naturaleza: { placeType: 'park', keywords: ['parque', 'jardín', 'naturaleza'] },
  ocio: { placeType: 'tourist_attraction', keywords: ['ocio', 'entretenimiento', 'actividades'] },
  relax: { placeType: 'spa', keywords: ['spa', 'wellness', 'masajes', 'yoga'] },
};

const ALL_SLUGS = 'restaurantes, italiano, mediterraneo, hamburguesas, asiatico, alta_cocina, internacional, desayuno, cafe, tapas, compras, supermercados, cultura, naturaleza, ocio, relax';

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH ENGINE
// BUG FIX: radius y rankby=prominence son mutuamente excluyentes en Places API.
// Usamos radius + type + keyword (sin rankby). Esto es lo correcto.
// ═══════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════
// QUALITY FILTERS
// ═══════════════════════════════════════════════════════════════════════════
function isQualityPlace(place: any, zone: ZoneInfo, catLabel: string): boolean {
  // 1. Fotos obligatorias (señal de lugar documentado) — excepto supermercados y compras
  // cuyas entradas en Nearby Search frecuentemente no incluyen fotos aunque existan en el lugar
  const isUtility = ['supermercados', 'compras'].includes(catLabel.toLowerCase());
  if (!isUtility && (!place.photos || place.photos.length === 0)) return false;

  // 2. Umbrales adaptativos por zona y categoría
  const cat = catLabel.toLowerCase();
  const isNatureOrCulture = ['cultura', 'naturaleza'].includes(cat);

  let minReviews: number;
  let minRating: number;

  switch (zone.type) {
    case 'metropolis':
      minReviews = isNatureOrCulture ? 60 : 100;
      minRating = 4.0;
      break;
    case 'city':
      minReviews = isNatureOrCulture ? 40 : 60;
      minRating = 3.9;
      break;
    case 'town':
      minReviews = isNatureOrCulture ? 15 : 25;
      minRating = 3.7;
      break;
    case 'rural':
    default:
      minReviews = isNatureOrCulture ? 8 : 12;
      minRating = 3.5;
      break;
  }

  if ((place.user_ratings_total || 0) < minReviews) return false;
  if ((place.rating || 0) < minRating) return false;

  // 3. Blacklist de tipos genéricos o no experienciales
  const blacklist = [
    'lodging',           // excluido intencionalmente — no es una experiencia para el huésped
    'point_of_interest', // genérico
    'establishment',     // genérico
    'transit_station',   // transporte
    'bus_station',       // transporte
    'subway_station',    // transporte
    'parking',           // transporte
    'car_parking',       // transporte
    'atm',               // financiero
    'bank'               // financiero
  ];

  // Si solo tiene tipos de la blacklist, descartar
  const types = place.types || [];
  const hasRealType = types.some((t: string) => !blacklist.includes(t));
  if (!hasRealType) return false;

  // 4. Distancia mínima para parques/naturaleza (evita jardines del propio edificio)
  if (isNatureOrCulture && (place.realDistanceMeters || 0) < 150) return false;

  return true;
}

const KNOWN_CHAINS = new Set([
  'mercadona', 'lidl', 'aldi', 'carrefour', 'dia', 'eroski', 'consum',
  'spar', 'eurospar', 'superspar', 'coviran', 'covirán', 'charter',
  'supercor', 'el corte inglés', 'alcampo', 'hipercor', 'simply',
  'primark', 'zara', 'mango', 'h&m', 'ikea', 'leroy merlin',
]);

function scorePlace(place: any, distanceMeters: number): number {
  const rating = place.rating ?? 0;
  const reviews = place.user_ratings_total ?? 0;
  const roadMeters = distanceMeters * 1.6; // road correction for more accurate distance scoring
  const distScore = Math.max(0, 1 - roadMeters / 5000);
  const nameNorm = (place.name || '').toLowerCase().trim();
  const isKnownChain = [...KNOWN_CHAINS].some(c => nameNorm.includes(c));
  const chainBonus = isKnownChain ? 0.08 : 0;
  return (0.40 * (rating / 5)) + (0.40 * (Math.log1p(reviews) / Math.log1p(5000))) + (0.20 * distScore) + chainBonus;
}

async function searchWithFallback(params: {
  placesKey: string;
  lat: number;
  lng: number;
  zone: ZoneInfo;
  placeType: string;
  keywords: string[];
  catLabel: string;
  neededCount: number;
  cityName: string;
  excludeNames?: string[];
  rankMode?: 'prominence' | 'distance';
}): Promise<any[]> {
  const {
    lat, lng, zone, placeType, keywords, catLabel, neededCount,
    placesKey, cityName, excludeNames = [], rankMode = 'prominence'
  } = params;
  const collected: any[] = [];
  const seenIds = new Set<string>();
  const excludeSet = new Set(excludeNames.map(n => n.toLowerCase().trim()));

  // Distancia real en metros entre dos coordenadas
  const haversineMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Convierte metros a texto legible
  // NOTA: haversine da distancia en línea recta. Aplicamos factor 1.35 para
  // aproximar la distancia real caminando por calles (validado vs Google Maps en Madrid).
  const formatDistance = (meters: number, preferCar: boolean, forceCarIfFar?: boolean): string => {
    const walkingMeters = meters * 1.35; // corrección línea recta → calles
    const walkMin = Math.round(walkingMeters / 80); // 80m/min = 4.8 km/h
    const carRoadMeters = meters * 1.6; // straight-line → road distance for car (~60% longer)
    const carMin = Math.max(1, Math.round(carRoadMeters / 600)); // 600m/min ≈ 36 km/h avg urban

    // Usar formato largo para evitar que la IA invente abreviaturas como "M"
    if (meters <= 200) return `${Math.round(meters)} metros andando`;
    // Supermercados/compras: mostrar coche si el trayecto a pie supera 15 min
    if (forceCarIfFar && walkingMeters > 1200) return `${carMin} min en coche`;
    if (walkingMeters <= 2200) return `${walkMin} min andando`;
    if (preferCar) return `${carMin} min en coche`;
    if (walkingMeters <= 4000) return `${walkMin} min andando`;
    return `${carMin} min en coche`;
  };

  const addResults = (results: any[], extra: object = {}) => {
    for (const r of results) {
      if (seenIds.has(r.place_id)) continue;
      seenIds.add(r.place_id);
      const nameKey = (r.name || '').toLowerCase().trim();
      if (excludeSet.has(nameKey)) continue;

      const placeLat = r.geometry?.location?.lat;
      const placeLng = r.geometry?.location?.lng;
      const realDistanceMeters = (placeLat != null && placeLng != null)
        ? haversineMeters(lat, lng, Number(placeLat), Number(placeLng))
        : null;

      if (realDistanceMeters === null) continue;

      const isUtility = ['supermercados', 'compras'].includes(catLabel);
      const realDistance = formatDistance(realDistanceMeters, zone.preferCar, isUtility);
      const isEssential = ['desayuno', 'restaurantes', 'tapas'].includes(catLabel);
      const catLimit = isUtility ? 5000 : isEssential ? 1500 : 2500;

      if (realDistanceMeters > catLimit && !zone.preferCar) {
        logger.debug(`[FILTER:${catLabel}] SKIP_DIST "${r.name}" ${Math.round(realDistanceMeters)}m > ${catLimit}m`);
        continue;
      }

      if (!isQualityPlace(r, zone, catLabel)) {
        logger.debug(`[FILTER:${catLabel}] REJECT "${r.name}" rating=${r.rating} reviews=${r.user_ratings_total} photos=${r.photos?.length ?? 0}`);
        continue;
      }
      logger.debug(`[FILTER:${catLabel}] PASS "${r.name}" rating=${r.rating} reviews=${r.user_ratings_total} dist=${Math.round(realDistanceMeters)}m`);

      collected.push({ ...r, gfCategory: catLabel, realDistanceMeters, realDistance, ...extra });
    }
  };

  // Para supermercados y compras cada keyword es una cadena específica — recorrer todos
  // Para el resto, parar en cuanto hay suficientes resultados (optimización de coste)
  const exhaustAllKeywords = ['supermercados', 'compras'].includes(catLabel);

  for (const keyword of keywords) {
    if (!exhaustAllKeywords && collected.length >= neededCount * 2) break;

    // Nearby - radio andando
    const isDistanceRank = rankMode === 'distance';
    const walkUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}` +
      (isDistanceRank ? `&rankby=distance` : `&radius=${zone.walkRadius}`) +
      `&type=${placeType}&keyword=${encodeURIComponent(keyword)}&language=es&key=${placesKey}`;
    const walkData = await fetch(walkUrl).then(r => r.json());
    if (walkData.status !== 'OK' && walkData.status !== 'ZERO_RESULTS') {
      logger.error(`[PLACES] ❌ Error Nearby(Walk) para "${keyword}": ${walkData.status} - ${walkData.error_message || 'N/A'}`);
    }
    addResults(walkData.results || [], { searchKeyword: keyword, radiusType: isDistanceRank ? 'distance-rank' : 'walk' });

    // Si ya tenemos suficiente con el radio walk, no hacemos mas llamadas (salvo exhaustAllKeywords)
    if (!exhaustAllKeywords && collected.length >= neededCount) break;

    // Nearby - radio coche si no tenemos suficiente
    if (zone.driveRadius > zone.walkRadius) {
      const driveUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
        `?location=${lat},${lng}&radius=${zone.driveRadius}` +
        `&type=${placeType}&keyword=${encodeURIComponent(keyword)}&language=es&key=${placesKey}`;
      const driveData = await fetch(driveUrl).then(r => r.json());
      if (driveData.status !== 'OK' && driveData.status !== 'ZERO_RESULTS') {
        logger.error(`[PLACES] ❌ Error Nearby(Drive) para "${keyword}": ${driveData.status} - ${driveData.error_message || 'N/A'}`);
      }
      addResults(driveData.results || [], { searchKeyword: keyword, radiusType: 'drive' });
    }

    // TextSearch - solo si absolutamente vacio tras todas las keywords
    if (collected.length === 0 && keyword === keywords[keywords.length - 1]) {
      const textQuery = `${keyword} en ${cityName}`;
      const textUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json` +
        `?query=${encodeURIComponent(textQuery)}&location=${lat},${lng}` +
        `&radius=${zone.driveRadius}&language=es&key=${placesKey}`;
      const textData = await fetch(textUrl).then(r => r.json());
      addResults(textData.results || [], { searchKeyword: keyword, radiusType: 'textsearch' });
    }
  }

  // Priorizar los mas cercanos y filtrar por un radio útil
  // Naturaleza/cultura: siempre limitar a distancia peatonal/ciclable (máx 4km) — no tiene sentido
  // recomendar un embalse a 10km cuando hay parques más cercanos.
  const isNatureOrCultureCat = ['naturaleza', 'cultura'].includes(catLabel.toLowerCase());
  const isUtilityCat = ['supermercados', 'compras'].includes(catLabel.toLowerCase());
  const distanceLimit = isNatureOrCultureCat
    ? Math.min(zone.walkRadius, 4000)
    : isUtilityCat
      ? (zone.preferCar ? zone.driveRadius : Math.min(zone.driveRadius, 5000))
      : zone.preferCar ? zone.driveRadius : Math.min(zone.walkRadius, 2000);

  const finalResult = collected
    .filter(r => r.realDistanceMeters != null && r.realDistanceMeters <= distanceLimit)
    .sort((a, b) => scorePlace(b, b.realDistanceMeters ?? 9999) - scorePlace(a, a.realDistanceMeters ?? 9999))
    .slice(0, neededCount * 2);

  logger.warn(`[SCORED:${catLabel}] top${finalResult.length}: ${finalResult.slice(0, 5).map((r: any) => `"${r.name}"(${Math.round(r.realDistanceMeters)}m,${r.rating}★,${r.user_ratings_total}rev,score=${scorePlace(r, r.realDistanceMeters).toFixed(3)})`).join(' | ')}`);

  return finalResult;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { propertyId, section, existingData } = body;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyId);
    if (!isUuid || propertyId === 'address-only') {
      return new Response(JSON.stringify({
        error: 'ID de propiedad inválido o no guardado',
        debug: 'ROUTE_UUID_CHECK_FAIL'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // ── AUTHENTICATION CHECK ─────────────────────────────────────────────────
    const { createClient } = await import('@/lib/supabase/server');
    const supabaseUser = await createClient();
    const { data: { user } } = await supabaseUser.auth.getUser();
    
    if (!user) {
      const ip = req.headers.get('x-forwarded-for') || 'unknown';
      logger.warn(`[ZONE] Unauthorized attempt blocked`);
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    // ── TENANT AUTHORIZATION CHECK ────────────────────────────────────────────
    const tenant_id = await getTenantId(supabaseUser, user);
    if (!tenant_id) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    // ── RATE LIMITING ────────────────────────────────────────────────────────
    const limit = await RateLimiter.checkLimit(`ai-fill:${user.id}`, {
      windowMs: 60 * 1000,
      maxRequests: 20, // Strict limit for AI generation
      message: 'Demasiadas solicitudes de generación IA.'
    });

    if (!limit.allowed) {
      await logSuspiciousActivity(createSupabaseAdmin(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!), 'host-session', {
        type: 'RATE_LIMIT_EXCEEDED_AI_FILL',
        details: { userId: user.id },
        ip: req.headers.get('x-forwarded-for') || 'unknown'
      });
      return new Response(JSON.stringify({ error: limit.message }), { status: 429 });
    }

    const supabase = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('name, city, country, country_code, neighborhood, latitude, longitude')
      .eq('id', propertyId)
      .eq('tenant_id', tenant_id)
      .single();

    if (propError || !property) {
      logger.error('[AI-FILL] Property check failed');
      return new Response(JSON.stringify({
        error: 'Propiedad no encontrada en la base de datos',
        debug: 'PROPERTY_NOT_FOUND'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const fallbackAddress = [property.city, property.neighborhood, property.country]
      .filter(Boolean).join(', ') || 'Dirección no disponible';
    const fullAddress = existingData?.address || fallbackAddress;

    // ── Geo helper ─────────────────────────────────────────────────────────
    const buildManualGeo = () => {
      if (existingData?.coordinates) return existingData.coordinates;
      if (property?.latitude != null && property?.longitude != null) {
        return {
          lat: property.latitude, lng: property.longitude,
          city: property.city || '', country: property.country || '',
          countryCode: property.country_code || 'ES',
          formattedAddress: fallbackAddress, timezone: 'Europe/Madrid',
          confidence: 1, accuracy: 'street' as const, source: 'mapbox' as const
        };
      }
      return undefined;
    };


    // ════════════════════════════════════════════════════════════════════════
    // 1. ARRIVALS / TRANSPORT
    // ════════════════════════════════════════════════════════════════════════
    const transportSections = ['arrival', 'transport', 'plane', 'train', 'road'];
    if (transportSections.includes(section)) {
      try {
        const sectionParam = ['plane', 'train', 'road'].includes(section)
          ? section as 'plane' | 'train' | 'road'
          : undefined;
        const result = await generateArrivalInstructions(
          existingData?.address || fullAddress,
          sectionParam,
          buildManualGeo(),
          existingData?.propertyParking
        );
        return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
      } catch (err) {
        logger.error('[AI-API] Arrival Error:', err);
        return new Response(JSON.stringify({ error: 'Error generando instrucciones de llegada' }), {
          status: 500, headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ════════════════════════════════════════════════════════════════════════
    // 2. DINING / RECOMMENDATIONS
    // ════════════════════════════════════════════════════════════════════════
    if (section === 'dining' || section === 'recommendations') {
      const placesKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
      const selectedCat: string = existingData?.category || 'restaurantes';
      const isTodos = selectedCat === 'todos';

      // Coordenadas: prioridad existingData > propiedad guardada
      let lat: number | null = existingData?.coordinates?.lat ?? property.latitude ?? null;
      let lng: number | null = existingData?.coordinates?.lng ?? property.longitude ?? null;

      // Agrupación de resultados por categoría
      const groupedPlaces: Record<string, any[]> = {};
      let allPlacesResults: any[] = [];
      let zone: ZoneInfo = { type: 'city', walkRadius: 2000, driveRadius: 8000, label: 'ciudad', preferCar: false };

      if (placesKey) {
        try {
          const t0 = Date.now();
          // Geocodificar si no hay coords o si el usuario cambió la dirección
          const addressChanged = existingData?.address && existingData.address !== fallbackAddress;
          if (!lat || !lng || addressChanged) {
            const addressToGeo = existingData?.address || fullAddress;
            const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json` +
              `?address=${encodeURIComponent(addressToGeo)}&key=${placesKey}`;
            const geoData = await fetch(geoUrl).then(r => r.json());
            if (geoData.status === 'OK') {
              lat = geoData.results[0].geometry.location.lat;
              lng = geoData.results[0].geometry.location.lng;
            } else {
              console.warn(`[PLACES] Geocoding failed for "${addressToGeo}": ${geoData.status}`);
            }
          } else {
            logger.debug(`[PLACES] Using coordinates from DB/State: ${lat}, ${lng}`);
          }

          if (lat && lng) {
            // Zona + búsquedas en paralelo — detectZoneType y las búsquedas
            // arrancan a la vez. Las búsquedas usan zona por defecto (city)
            // y si la zona real difiere, es un impacto mínimo en radio.
            const zonePromise = detectZoneType(lat, lng, placesKey);

            if (isTodos) {
              // Arrancar búsquedas con zona por defecto mientras detectamos zona real
              const defaultZone = { type: 'city' as const, walkRadius: 2000, driveRadius: 8000, label: 'ciudad', preferCar: false };
              const searchPromises = Object.entries(TODOS_QUOTA).map(async ([cat, config]) => {
                const resolvedZone = await zonePromise; // ya habrá resuelto para entonces
                const results = await searchWithFallback({
                  lat: lat!, lng: lng!, zone: resolvedZone,
                  placeType: config.placeType,
                  keywords: config.keywords,
                  catLabel: cat,
                  neededCount: Math.max(8, config.quota * 3), // Oversampling para asegurar candidatos tras filtrado
                  placesKey,
                  cityName: property.city || '',
                  excludeNames: existingData?.existingNames || []
                });
                groupedPlaces[cat] = results;
                return results;
              });
              zone = await zonePromise;
              const allResults = await Promise.all(searchPromises);
              allPlacesResults = allResults.flat();

            } else {
              // Búsqueda categoría única — resolver zona real antes de buscar
              zone = await zonePromise;
              const config = SINGLE_CAT_MAP[selectedCat] || SINGLE_CAT_MAP['restaurantes'];

              const existingCount = (existingData?.existingNames || []).length;
              const neededNew = 6;
              // Aumentar pool para rellenos específicos
              const neededCount = Math.max(40, neededNew + existingCount);

              const results = await searchWithFallback({
                lat: lat ?? property.latitude ?? 0,
                lng: lng ?? property.longitude ?? 0,
                zone,
                placeType: config.placeType,
                keywords: config.keywords,
                catLabel: selectedCat,
                neededCount,
                placesKey,
                cityName: property.city || '',
                excludeNames: existingData?.existingNames || [],
                rankMode: 'distance'
              });
              groupedPlaces[selectedCat] = results;
              allPlacesResults = groupedPlaces[selectedCat];
            }

            const tPlaces = Date.now(); logger.debug(`[PLACES] Total collected: ${allPlacesResults.length} (+${tPlaces - t0}ms total)`);
          }
        } catch (err) {
          logger.error('[PLACES] API Error:', err);
        }
      }

      // ── Contexto agrupado para Gemini ──────────────────────────────────
      // ── Contexto agrupado para Gemini ──────────────────────────────────
      const numRequested = isTodos
        ? Object.values(TODOS_QUOTA).reduce((s, c) => s + c.quota, 0)
        : 6;

      const placesContext = isTodos
        ? Object.entries(groupedPlaces)
          .map(([cat, places]) => {
            const quota = TODOS_QUOTA[cat]?.quota ?? 2;
            if (!places.length) {
              return `[${cat.toUpperCase()}]: Sin resultados de Google. Usa conocimiento de ${property.city}.`;
            }
            // Pasar exactamente quota candidatos — ya elegidos por el scorer, Gemini solo genera descripción
            const selected = places.slice(0, quota);
            logger.warn(`[GEMINI_SENDS:${cat}] ${selected.map((r: any) => `"${r.name}"(${Math.round(r.realDistanceMeters)}m)`).join(', ')}`);
            const lines = selected.map((r: any) =>
              `  - ${r.name} (${r.vicinity ?? r.formatted_address ?? ''}) | Rating: ${r.rating ?? 'N/A'} | ${r.realDistance ?? 'desconocida'} | ID: ${r.place_id} | Tipos: ${(r.types || []).slice(0, 3).join(',')} | Abierto ahora: ${r.opening_hours?.open_now ?? 'desconocido'}`
            ).join('\n');
            return `[${cat.toUpperCase()}] — USA EXACTAMENTE estos ${quota} sitios, en este orden, sin sustituir ninguno:\n${lines}`;
          })
          .join('\n\n')
        : allPlacesResults.slice(0, 18).map(r =>
          `- ${r.name} (${r.vicinity ?? r.formatted_address ?? ''}) | Rating: ${r.rating ?? 'N/A'} | ${r.realDistance ?? 'desconocida'} | ID: ${r.place_id} | Tipos: ${(r.types || []).slice(0, 3).join(',')} | Abierto ahora: ${r.opening_hours?.open_now ?? 'desconocido'}`
      ).join('\n');

      const existingNamesStr = (existingData?.existingNames || []).join(', ');

      const todosBlock = isTodos ? `
CUOTAS OBLIGATORIAS — respeta EXACTAMENTE estas cantidades:
┌──────────────────────┬───────┐
│ Slug de salida       │ Cuota │
├──────────────────────┼───────┤
│ supermercados        │   2   │
│ restaurantes         │   2   │
│ desayuno             │   2   │
│ tapas                │   2   │
│ cultura              │   2   │
│ naturaleza           │   2   │
│ ocio (nocturno)      │   2   │
└──────────────────────┴───────┘
TOTAL: ${numRequested} recomendaciones.
` : '';

      const singleCatBlock = !isTodos ? `
⚠️ CATEGORÍA ÚNICA: Solo genera recomendaciones de tipo "${selectedCat}". PROHIBIDO incluir restaurantes, supermercados, cafeterías ni cualquier otro tipo. Si el listado de Places está vacío o tiene pocos sitios relevantes, genera ÚNICAMENTE sitios de la categoría "${selectedCat}" usando tu conocimiento de ${property.city}. Máximo 6 resultados.
` : '';

      const prompt = `Anfitrión experto en ${property.city}. Guía de "${property.name}".

LUGARES GOOGLE PLACES:
${placesContext || `Sin datos. Usa conocimiento de ${property.city}.`}

${todosBlock}${singleCatBlock}

REGLAS CRÍTICAS:
1. OBLIGATORIO: Los sitios listados bajo cada categoría han sido PRE-SELECCIONADOS por el sistema. Debes incluir TODOS y CADA UNO de ellos en el JSON de salida. NO los sustituyas ni los omitas. Tu única tarea es generar description, personal_note, best_time_slots, atmosphere y tags para cada uno.
2. REGLA DEL ID Y NOMBRE: Si usas un sitio del listado de Google, COPIA su "ID" exactamente Y usa el nombre EXACTO tal como aparece en el listado (incluyendo barrio o sufijo). NUNCA uses el nombre genérico de una cadena si el listado muestra la sucursal específica. Ejemplo: si el listado dice "Lateral Paseo de Recoletos", escribe ese nombre completo en el JSON, no solo "Lateral". Si el listado está VACÍO, usa tu conocimiento y pon "google_place_id": null.
3. PROHIBIDO: Inventar IDs. Prohibido añadir "(Inventado)" al nombre.
4. PROHIBIDO usar la palabra "REALDISTANCE".
5. "METROS" significa < 2 min andando. "MIN" son minutos.
6. COMPLIANCE: NO generes ratings, niveles de precio ni horarios detallados. Ponlos como null.

JSON con array "recommendations", cada elemento:
{"name":"nombre real","description":"descripción hospitalaria max 150 chars","personal_note":"CONSEJO CORTITO DEL ANFITRIÓN (ej. 'Ideal para desayunar', 'Pide sus bravas') — infiere el mejor momento de visita según los tipos Google (bar/night_club→noche, cafe/bakery→mañana, restaurant→mediodía o noche) y el campo 'Abierto ahora'","distance":"X MIN o METROS o null","type":"slug de: ${ALL_SLUGS}","google_place_id":"ID de Google o null","rating":null,"price_level":null,"price_range":null,"best_time_slots":["mañana"|"mediodía"|"tarde"|"noche"|"madrugada"] — elige 1-2 valores según tipos y horario Google. Si no hay datos suficientes, usa [],"atmosphere":"vibe en 3-4 palabras","tags": SOLO 0-3 valores de esta lista exacta (array vacío si ninguno aplica): ["vistas al mar","vistas a la montaña","terraza","jardín","romántico","familiar","grupos","económico","premium","local auténtico","turístico","rápido","takeaway","reserva recomendada","abierto tarde","24h","parking","accesible","vista al atardecer","rooftop","interior acogedor","exterior"] — PROHIBIDO inventar tags fuera de esta lista,"availability":null}
SOLO JSON:`;

      // ── Llamada a Gemini ───────────────────────────────────────────────
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });


      let recommendations: any[] = [];

      const parseRecs = (res: any): any[] => {
        try {
          const text = res.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
          const p = JSON.parse(text);
          return Array.isArray(p.recommendations) ? p.recommendations : Array.isArray(p) ? p : [];
        } catch { return []; }
      };

      const generateWithRetry = async (p: string) => {
        let lastErr: any;
        for (let i = 0; i < 3; i++) {
          try {
            return await model.generateContent(p);
          } catch (err: any) {
            lastErr = err;
            if (err.status === 429 || err.message?.includes('429')) {
              logger.warn(`[GEMINI] 429 detected, retry ${i+1}/3...`);
              await new Promise(r => setTimeout(r, 2000 * (i + 1)));
              continue;
            }
            throw err;
          }
        }
        throw lastErr;
      };

      if (isTodos) {
        // Usar prompt completo (definido en linea 459) que ya gestiona todas las categorías
        const result = await generateWithRetry(prompt);
        recommendations = parseRecs(result);
      } else {
        const result = await generateWithRetry(prompt);
        recommendations = parseRecs(result);

        // Descartar cualquier recomendación que no sea del tipo solicitado (Gemini puede colarse)
        // Solo se descarta si claramente es otro tipo — si type es null/undefined lo aceptamos
        const CATEGORY_ALIASES: Record<string, string[]> = {
          naturaleza: ['naturaleza', 'nature', 'park', 'parque'],
          cultura: ['cultura', 'culture', 'museum', 'monumento'],
          ocio: ['ocio', 'ocio_nocturno', 'leisure', 'entertainment'],
          restaurantes: ['restaurantes', 'restaurant'],
          tapas: ['tapas', 'bar', 'tapas_bar'],
          desayuno: ['desayuno', 'cafe', 'breakfast'],
          supermercados: ['supermercados', 'supermarket'],
          compras: ['compras', 'shopping'],
        };
        const validTypes = new Set(CATEGORY_ALIASES[selectedCat] || [selectedCat]);
        recommendations = recommendations.filter(r => {
          if (!r.type) return true; // sin tipo → aceptar
          return validTypes.has(r.type.toLowerCase());
        });

        // Forzar tipo correcto en todos los resultados que quedan
        recommendations = recommendations.map(r => ({ ...r, type: selectedCat }));
      }

      // ── Verificación: real vs inventado ────────────────────────────────
      const normalizeHtml = (s: string) => s.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const realIds = new Set(allPlacesResults.map(p => p.place_id));
      const realNamesMap = new Map(allPlacesResults.map(p => [normalizeHtml(p.name || ''), p]));

      recommendations = await Promise.all(recommendations.map(async rec => {
        const recNameNorm = normalizeHtml(rec.name || '');

        // Limpiamos google_place_id del metadata generado por Gemini (evita conflictos)
        const { google_place_id: _ignored, ...cleanMetadata } = rec.metadata || {};
        let metadata = {
            ...cleanMetadata,
            personal_note: rec.personal_note || cleanMetadata.personal_note || null
        };

        // Verificación: place_id exacto primero, luego nombre más cercano
        let verified = rec.google_place_id ? realIds.has(rec.google_place_id) : false;
        if (!verified) {
            verified = realNamesMap.has(recNameNorm) ||
                      [...realNamesMap.keys()].some(k => k.includes(recNameNorm) || recNameNorm.includes(k));
        }

        // Descartar place_ids alucinados (Gemini pone el nombre en vez de "ChIJ...")
        let placeId: string | null = (rec.google_place_id && realIds.has(rec.google_place_id))
            ? rec.google_place_id
            : null;
        let realPlace: any = null;

        const findClosestByName = (norm: string) => {
            const candidates = allPlacesResults.filter(p => {
                const pNorm = normalizeHtml(p.name || '');
                return pNorm === norm || pNorm.includes(norm) || norm.includes(pNorm);
            });
            return candidates.sort((a, b) => (a.realDistanceMeters || 9999) - (b.realDistanceMeters || 9999))[0] ?? null;
        };

        if (verified || placeId) {
            // Primero: match exacto por place_id verificado
            if (placeId) {
                realPlace = allPlacesResults.find(p => p.place_id === placeId) ?? null;
            }
            // Si no, buscar por nombre y coger el más cercano
            if (!realPlace) {
                realPlace = findClosestByName(recNameNorm);
            }
            if (!placeId && realPlace) {
                placeId = realPlace.place_id;
                verified = true;
            }
        }

        if (!verified && !placeId) {
            // Intento desesperado: buscar por substring, siempre el más cercano
            realPlace = findClosestByName(recNameNorm);
            if (realPlace) {
                verified = true;
                placeId = realPlace.place_id;
            }
        }

        // 3. ENRIQUECIMIENTO DE HORARIO (DESACTIVADO POR COSTE Y CUMPLIMIENTO)
        // Se ha eliminado la llamada a Place Details para ahorrar ~20€/1k req y cumplir con ToS de Google.
        // Solo conservamos el Place ID para el enlace externo.


        // 4. ENRIQUECIMIENTO DE DISTANCIA
        let distance = rec.distance;
        const needsDistFix = !distance || 
                         distance.toLowerCase().includes('distance') || 
                         distance.toLowerCase().includes('realdistance') ||
                         distance.trim() === 'null' ||
                         (verified && /^\d+$/.test(distance));

        if (needsDistFix) {
            if (!realPlace) {
                // Usar place_id exacto si existe, si no el más cercano por nombre
                if (placeId && realIds.has(placeId)) {
                    realPlace = allPlacesResults.find(p => p.place_id === placeId) ?? null;
                }
                if (!realPlace) {
                    realPlace = findClosestByName(recNameNorm);
                }
            }

            if (realPlace?.realDistance) {
                distance = realPlace.realDistance;
            } else if (distance && distance.toLowerCase().includes('distance')) {
                distance = null;
            }
        }

        return {
          ...rec,
          distance,
          google_place_id: placeId, // Guardar el ID recuperado
          metadata,
          _verified: verified,
          _source: verified ? 'google_places' : 'ai_generated',
        };
      }));

      logger.debug(`[AI-FILL] ✅ Final recommendations ready. First 2 distances:`, recommendations.slice(0, 2).map(r => r.distance));

      // Deduplicar: preferido por google_place_id, secundario por nombre
      const seenIds = new Set();
      const seenNames = new Set();
      recommendations = recommendations.filter(rec => {
        const nameKey = (rec.name || '').toLowerCase().trim();
        if (rec.google_place_id) {
          if (seenIds.has(rec.google_place_id)) return false;
          seenIds.add(rec.google_place_id);
          // También registrar el nombre para evitar colisiones id/name
          seenNames.add(nameKey);
          return true;
        }
        if (seenNames.has(nameKey)) return false;
        seenNames.add(nameKey);
        return true;
      });

      // ── Quality Report ─────────────────────────────────────────────────
      const activeQuota = isTodos ? TODOS_QUOTA : { [selectedCat]: { quota: 6, placeType: '', keywords: [] } };
      const quotaFulfillment = Object.entries(activeQuota).reduce((acc, [cat, config]) => ({
        ...acc,
        [cat]: {
          requested: config.quota,
          fromPlaces: (groupedPlaces[cat] ?? []).length,
          inOutput: recommendations.filter(r =>
            r.type === cat ||
            (cat === 'ocio_diurno' && r.type === 'ocio') ||
            (cat === 'ocio_nocturno' && r.type === 'ocio')
          ).length,
        }
      }), {});

      const qualityReport = {
        zone: zone.type,
        zoneLabel: zone.label,
        totalPlacesFound: allPlacesResults.length,
        totalRecommendations: recommendations.length,
        verifiedCount: recommendations.filter(r => r._source === 'google_places').length,
        aiGeneratedCount: recommendations.filter(r => r._source === 'ai_generated').length,
        categoriesWithZeroPlaces: Object.keys(activeQuota).filter(
          cat => !(groupedPlaces[cat]?.length)
        ),
        quotaFulfillment,
      };

      return new Response(JSON.stringify({ recommendations, qualityReport }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ════════════════════════════════════════════════════════════════════════
    // 3. TECH / FAQS
    // ════════════════════════════════════════════════════════════════════════
    if (section === 'tech' || section === 'faqs') {
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      let prompt = '';

      if (section === 'tech') {
        prompt = `Eres un experto anfitrión. Genera detalles técnicos para "${property.name}" en ${property.city}.
Devuelve JSON con: "wifi_name", "wifi_password", "parking_info", "trash_info".
JSON:`;
      } else {
        const { checkin_time, quiet_hours } = existingData || {};
        prompt = `Eres el anfitrión experto de "${property.name}" en ${property.city}. 
Tu objetivo es generar 5 FAQs (Dudas Frecuentes) que den una respuesta profesional, hospitalaria y tranquilizadora al huésped.

TEMAS OBLIGATORIOS (usa estos como base para tus respuestas):
1. PÉRDIDA DE LLAVES: Enfatiza mantener la calma. Recomendar buscar en bolsillos/bolsas. Contactar al anfitrión como paso final. Mencionar que hay repuestos o códigos si aplica.
2. CORTE DE LUZ: Primero revisar el cuadro eléctrico (suele estar en la entrada). Si salta de nuevo, desconectar electrodomésticos. Si es general de la zona, esperar y contactar soporte.
3. BASURA Y RECICLAJE: En España, los contenedores suelen estar en la calle. Indicar que hay que separar residuos y no dejarlos dentro al salir. 
4. CHECK-OUT: Proceso de salida: recoger equipaje, sábanas sucias en un rincón, tirar basura, dejar llaves en el lugar acordado y avisar al anfitrión.
5. DAÑOS: Avisar inmediatamente para reparar. Mencionar que fotos/mensajes ayudan a estar de acuerdo.

REGLAS DE FORMATO:
- Genera EXACTAMENTE 5 FAQs en español.
- En la respuesta (answer), usa un tono servicial pero directo. 
- Si hay varios pasos, usa formato "1) ..., 2) ..." o similar.

Devuelve EXCLUSIVAMENTE un JSON con: {"faqs": [{question, answer, category, priority(1-5)}]}.
Check-in de referencia: ${checkin_time || 'A convenir'}. 
Horas de silencio: ${quiet_hours || '22:00–08:00'}.
JSON:`;
      }

      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      return new Response(text, { headers: { 'Content-Type': 'application/json' } });
    }

    // ════════════════════════════════════════════════════════════════════════
    // 4. CONTACTS / EMERGENCY
    // ════════════════════════════════════════════════════════════════════════
    if (section === 'contact' || section === 'contacts') {
      const placesKey = process.env.GOOGLE_PLACES_API_KEY;
      let lat: number | null = existingData?.coordinates?.lat ?? property.latitude ?? null;
      let lng: number | null = existingData?.coordinates?.lng ?? property.longitude ?? null;

      if ((!lat || !lng) && placesKey) {
        const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json` +
          `?address=${encodeURIComponent(existingData?.address || fullAddress)}&key=${placesKey}`;
        const geoData = await fetch(geoUrl).then(r => r.json());
        if (geoData.status === 'OK') {
          lat = geoData.results[0].geometry.location.lat;
          lng = geoData.results[0].geometry.location.lng;
        }
      }

      const uuid = () => `ec-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      const emergencyContacts: any[] = [
        { id: uuid(), name: 'Emergencias 112', phone: '112', address: 'Servicio Nacional', distance: '0 km', type: 'salud' },
        { id: uuid(), name: 'Policía Nacional', phone: '091', address: 'Servicio Nacional', distance: '0 km', type: 'guardia' },
        { id: uuid(), name: 'Policía Local', phone: '092', address: 'Servicio Local', distance: '0 km', type: 'policia' },
        { id: uuid(), name: 'Bomberos', phone: '080', address: 'Servicio Nacional', distance: '0 km', type: 'bomberos' },
      ];

      if (placesKey && lat && lng) {
        const searchPromises = [
          { keyword: 'Hospital Público SAS Universitario' },
          { keyword: 'Centro de Salud Público SAS' },
          { keyword: 'farmacia pharmacy' },
          { keyword: 'bomberos fire station' },
          { keyword: 'veterinario veterinary' },
          { keyword: 'parada taxi taxi stand' },
        ].map(item => {
          const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
            `?location=${lat},${lng}&rankby=distance&keyword=${encodeURIComponent(item.keyword)}&language=es&key=${placesKey}`;
          return fetch(url).then(r => r.json());
        });

        const searchResults = await Promise.all(searchPromises);
        // Analizamos hasta 10 candidatos para hospitales/salud, y 4 para el resto (incluyendo taxi)
        const candidates = searchResults.flatMap((r, idx) => (r.results || []).slice(0, idx < 2 ? 10 : 4));

        const enriched = await Promise.all(candidates.map(async (c: any) => {
          try {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json` +
              `?place_id=${c.place_id}&fields=name,formatted_phone_number,vicinity,geometry,types&language=es&key=${placesKey}`;
            const dd = await fetch(detailsUrl).then(r => r.json());
            const r = dd.result || {};
            let distance = '';
            let distanceValue = 999;
            if (r.geometry?.location && lat && lng) {
              const R = 6371;
              const dLat = (r.geometry.location.lat - lat) * Math.PI / 180;
              const dLng = (r.geometry.location.lng - lng) * Math.PI / 180;
              const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos(r.geometry.location.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
              const d = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
              distance = `${d.toFixed(1)} km`;
              distanceValue = d;
            }
            return {
              name: r.name || c.name,
              phone: r.formatted_phone_number || '',
              address: r.vicinity || c.vicinity || '',
              distance, 
              distanceValue,
              place_id: c.place_id, 
              google_types: r.types || []
            };
          } catch { return null; }
        }));

        const validCandidates = (enriched.filter(Boolean) as any[])
          .sort((a, b) => a.distanceValue - b.distanceValue);

        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-2.0-flash',
          generationConfig: { temperature: 0 } 
        });

        const contactPrompt = `Eres un experto en hospitalidad y seguridad. Criba estos contactos para ${property.city} (España).
CANDIDATOS GOOGLE (Ordenados por cercanía): ${JSON.stringify(validCandidates, null, 2)}

GUIA DE IDENTIFICACIÓN (ESPAÑA):
- PÚBLICO: "Hospital de la Inmaculada", "Consultorio", "Centro de Salud", "SAS", "Hospital Universitario", "Servicio Andaluz de Salud".
- PRIVADO: "Healthcare", "Clínica", "Sanatorio", "Vithas", "Quirón", "Sanitas".

REGLAS DE SELECCIÓN (MÁXIMO 8 CONTACTOS):
1. OBLIGATORIO: Al menos 1 Hospital General (prioriza el PÚBLICO de referencia aunque esté a 15-20km).
2. OBLIGATORIO: Al menos 1 Centro de Salud / Consultorio (PÚBLICO).
3. OBLIGATORIO: Al menos 1 Farmacia (prioriza 24h).
4. OBLIGATORIO: Al menos 1 Clínica Veterinaria.
5. OBLIGATORIO: Al menos 1 Parada de Taxi o Servicio de Taxis local.
6. PROHIBIDO: NO incluyas "Policía Local" ni "Policía Nacional" ni "Bomberos".
7. PRIORIDAD: 
   a) Centros PÚBLICOS (imprescindible).
   b) Si NO hay público en los candidatos, usa el privado más cercano.
   c) Cercanía.

TIPOS DE SALIDA: "salud", "farmacia", "veterinario", "taxi", "mantenimiento".
JSON con array "emergency_contacts".
JSON:`;

        try {
          const result = await model.generateContent(contactPrompt);
          const rawText = result.response.text();
          const text = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
          const aiContacts = (JSON.parse(text).emergency_contacts || []).map((c: any) => ({ ...c, id: uuid() }));
          const finalContacts = [...emergencyContacts];
          aiContacts.forEach((ac: any) => {
            if (!finalContacts.find(fc => fc.name.toLowerCase() === ac.name.toLowerCase())) {
              finalContacts.push(ac);
            }
          });
          return new Response(JSON.stringify({ emergency_contacts: finalContacts }), {
            headers: { 'Content-Type': 'application/json' }
          });
        } catch {
          return new Response(JSON.stringify({ emergency_contacts: emergencyContacts }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      return new Response(JSON.stringify({ emergency_contacts: emergencyContacts }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Sección no soportada', receivedSection: section }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    logger.error('[AI-API] Global Error:', error);
    return new Response(JSON.stringify({ error: 'Error interno', details: error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}