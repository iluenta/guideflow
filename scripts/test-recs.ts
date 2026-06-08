/**
 * Test E2E completo — replica EXACTAMENTE la lógica del servidor route.ts
 * Fase 1: Filtrado, clasificación y balance
 * Fase 2: Llamada a Gemini + verificación de hallucinations + deduplicación
 */
import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(process.cwd(), '.env.local') });

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

// ── SCORE PROFILES ────────────────────────────────────────────────────────────
const SCORE_PROFILES: Record<string, any> = {
  supermercados: { distNorm: 5000,  distWeight: 0.50, chainBoost: ['mercadona','consum','lidl','spar','carrefour','aldi'] },
  hamburguesas:  { distNorm: 8000,  distWeight: 0.45 },
  desayuno:      { distNorm: 8000,  distWeight: 0.45 },
  tapas:         { distNorm: 15000, distWeight: 0.35 },
  restaurantes:  { distNorm: 20000, distWeight: 0.30 },
  italiano:      { distNorm: 12000, distWeight: 0.40 },
  mediterraneo:  { distNorm: 40000, distWeight: 0.25 },
  alta_cocina:   { distNorm: 40000, distWeight: 0.10 },
};
const DEFAULT_PROFILE = { distNorm: 15000, distWeight: 0.4 };

function scoreSimple(place: any, distanceMeters: number, catLabel?: string): number {
  const rating = place.rating ?? 0;
  const reviews = place.user_ratings_total ?? 0;
  const baseScore = (rating * 0.7) + (Math.min(1, reviews / 500) * 1.5);
  const profile = (catLabel && SCORE_PROFILES[catLabel]) ? SCORE_PROFILES[catLabel] : DEFAULT_PROFILE;
  const chainBoost = profile.chainBoost?.some((c: string) => (place.name || '').toLowerCase().includes(c)) ? 0.50 : 0;
  const roadMeters = distanceMeters * 1.4;
  const distScore = Math.max(0, 1 - roadMeters / profile.distNorm);
  return (baseScore + chainBoost) * (1 - profile.distWeight + profile.distWeight * distScore);
}

const haversineMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (meters: number, preferCar: boolean): string => {
  const walkingMeters = meters * 1.35;
  const walkMin = Math.round(walkingMeters / 80);
  const carMin = Math.max(1, Math.round((meters * 1.6) / 600));
  if (meters <= 200) return `${Math.round(meters)} metros andando`;
  if (walkingMeters <= 2200) return `${walkMin} min andando`;
  if (preferCar) return `${carMin} min en coche`;
  if (walkingMeters <= 4000) return `${walkMin} min andando`;
  return `${carMin} min en coche`;
};

function isQualityPlace(place: any, zoneType: string, catLabel: string): boolean {
  const isUtility = ['supermercados','compras','cultura','naturaleza','ocio'].includes(catLabel.toLowerCase());
  if (!isUtility && (!place.photos || place.photos.length === 0)) return false;
  const cat = catLabel.toLowerCase();
  const isNatureOrCulture = ['cultura','naturaleza'].includes(cat);
  let minReviews: number, minRating: number;
  if (!isNatureOrCulture) {
    if (zoneType === 'metropolis')     { minReviews = 80;  minRating = 4.2; }
    else if (zoneType === 'city')      { minReviews = 50;  minRating = 4.1; }
    else                               { minReviews = 15;  minRating = 4.0; }
    if ((place.user_ratings_total || 0) < minReviews) return false;
    if ((place.rating || 0) < minRating) return false;
  }
  const blacklist = ['lodging','establishment','transit_station','bus_station','subway_station','parking','car_parking','atm','bank'];
  const types = (place.types || []) as string[];
  if (types.length > 0 && types.every(t => blacklist.includes(t))) return false;
  return true;
}

function normalizeResult(place: any): any {
  return {
    place_id:           place.id ?? '',
    name:               place.displayName?.text ?? '',
    vicinity:           place.shortFormattedAddress ?? place.formattedAddress ?? '',
    formatted_address:  place.formattedAddress ?? '',
    geometry: { location: { lat: place.location?.latitude ?? null, lng: place.location?.longitude ?? null } },
    rating:             place.rating ?? null,
    user_ratings_total: place.userRatingCount ?? 0,
    types:              place.types ?? [],
    photos:             place.photos ?? [],
  };
}

const normalizeHtml = (s: string) => s.toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

async function run() {
  const propertyId = '94b0ec95-47ba-4843-801f-97015ea1f22b';
  const selectedCat = 'mediterraneo';

  const supabase = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: property, error } = await supabase.from('properties').select('*').eq('id', propertyId).single();
  if (error || !property) { console.error('Property not found:', error); return; }
  console.log(`\n[TEST] ${property.name} | ${property.latitude}, ${property.longitude}\n`);

  const lat = Number(property.latitude);
  const lng = Number(property.longitude);
  const placesKey = process.env.GOOGLE_PLACES_API_KEY || '';
  const zoneType = 'town';

  const keywords = ['paella arroces','marisqueria pescados','chiringuito playa','restaurante mediterraneo','espeto fritura','mariscos frescos pescado'];
  const FIELD_MASK = ['places.id','places.displayName','places.location','places.rating','places.userRatingCount','places.types','places.photos','places.formattedAddress','places.shortFormattedAddress'].join(',');
  const BLACKLISTED_PRIMARY = ['food_store','grocery_or_supermarket','store','market','wholesaler','establishment'];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FASE 1: RECOLECCIÓN Y FILTRADO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const collected: any[] = [];
  const seenIds = new Set<string>();

  for (const keyword of keywords) {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': placesKey, 'X-Goog-FieldMask': FIELD_MASK },
      body: JSON.stringify({
        textQuery: `${keyword} Vera`,
        locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: 40000 } },
        maxResultCount: 20, languageCode: 'es'
      })
    });
    const data = await res.json();
    for (const r of (data.places || []).map(normalizeResult)) {
      if (seenIds.has(r.place_id)) continue;
      seenIds.add(r.place_id);
      const types = r.types as string[];
      if (BLACKLISTED_PRIMARY.includes(types[0] || '')) continue;
      if (!types.some(t => ['restaurant','bar','cafe'].includes(t))) continue;
      if (!isQualityPlace(r, zoneType, selectedCat)) continue;
      const placeLat = r.geometry?.location?.lat;
      const placeLng = r.geometry?.location?.lng;
      if (!placeLat || !placeLng) continue;
      const realDistanceMeters = haversineMeters(lat, lng, Number(placeLat), Number(placeLng));
      if (realDistanceMeters > 65000) continue;
      const sk = keyword.toLowerCase();
      const nameLower = (r.name || '').toLowerCase();
      const gfMedSubcat = (sk.includes('chiringuito') || nameLower.includes('chiringuito')) ? 'chiringuito' : 'restaurant';
      const score = scoreSimple(r, realDistanceMeters, selectedCat);
      collected.push({ ...r, realDistanceMeters, realDistance: formatDistance(realDistanceMeters, true), gfMedSubcat, score });
    }
  }

  console.log(`FASE 1 — Recolectados: ${collected.length} candidatos`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FASE 2: BALANCE Y SELECCIÓN
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const numRequested = 6;
  const allPlacesResults = collected;
  const sortedByScore = [...allPlacesResults].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const chiringuitos = sortedByScore.filter(r => r.gfMedSubcat === 'chiringuito');
  const restaurants  = sortedByScore.filter(r => r.gfMedSubcat !== 'chiringuito');

  const targetTotal = numRequested * 2;
  let finalSelection = [...chiringuitos.slice(0, 5), ...restaurants.slice(0, 7)];
  if (finalSelection.length < Math.min(targetTotal, sortedByScore.length)) {
    if (chiringuitos.length > 5 && finalSelection.length < targetTotal)
      finalSelection.push(...chiringuitos.slice(5, 5 + (targetTotal - finalSelection.length)));
    if (restaurants.length > 7 && finalSelection.length < targetTotal)
      finalSelection.push(...restaurants.slice(7, 7 + (targetTotal - finalSelection.length)));
  }
  const preSelected = finalSelection.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  console.log(`FASE 2 — Pool para Gemini: ${preSelected.length} candidatos`);
  preSelected.forEach((r, i) =>
    console.log(`  [${i}] ${r.gfMedSubcat === 'chiringuito' ? '🏖️' : '🍽️'} ${r.name} | score=${r.score.toFixed(3)} | ${r.realDistance}`)
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FASE 3: LLAMADA A GEMINI
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const placesContext = preSelected.map(r =>
    `- ${r.name} (${r.vicinity}) | Rating: ${r.rating ?? 'N/A'} | ${r.realDistance} | ID: ${r.place_id} | Tipos: ${(r.types || []).slice(0,3).join(',')}`
  ).join('\n');

  const ALL_SLUGS = 'restaurantes,italiano,mediterraneo,hamburguesas,asiatico,alta_cocina,internacional,desayuno,cafe,tapas,compras,supermercados,cultura,naturaleza,ocio,relax';
  const prompt = `Anfitrión experto en ${property.city}. Guía de "${property.name}".

LUGARES GOOGLE PLACES:
${placesContext}

⚠️ Categoría: "mediterraneo". INCLUYE TODOS los del listado EN EL MISMO ORDEN. NO omitas ninguno.
⛔ PROHIBIDO inventar sitios que no estén en el listado.

JSON con array "recommendations", cada elemento:
{"name":"nombre real","description":"max 150 chars","personal_note":"consejo corto","distance":"X MIN o METROS","type":"slug de: ${ALL_SLUGS}","google_place_id":"ID exacto","rating":null,"price_level":null,"price_range":null,"best_time_slots":["mediodía"],"atmosphere":"vibe 3-4 palabras","tags":[],"availability":null}
SOLO JSON:`;

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: 'application/json' } });

  console.log(`\nFASE 3 — Llamando a Gemini...`);
  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/```json/g,'').replace(/```/g,'').trim();

  let recommendations: any[] = [];
  try { recommendations = JSON.parse(text).recommendations || []; }
  catch { console.error('JSON parse error:', text.slice(0, 200)); return; }
  console.log(`FASE 3 — Gemini devolvió: ${recommendations.length} recomendaciones`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // FASE 4: VERIFICACIÓN (hallucinations filter)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const realIds = new Set(allPlacesResults.map(p => p.place_id));
  const realNamesMap = new Map(allPlacesResults.map(p => [normalizeHtml(p.name || ''), p]));

  const findClosestByName = (norm: string) => {
    const candidates = allPlacesResults.filter(p => {
      const pNorm = normalizeHtml(p.name || '');
      return pNorm === norm || pNorm.includes(norm) || norm.includes(pNorm);
    });
    return candidates.sort((a, b) => (a.realDistanceMeters || 9999) - (b.realDistanceMeters || 9999))[0] ?? null;
  };

  recommendations = recommendations.map(rec => {
    const recNameNorm = normalizeHtml(rec.name || '');
    let verified = rec.google_place_id ? realIds.has(rec.google_place_id) : false;
    if (!verified) {
      verified = realNamesMap.has(recNameNorm) ||
        [...realNamesMap.keys()].some(k => k.includes(recNameNorm) || recNameNorm.includes(k));
    }
    let placeId: string | null = (rec.google_place_id && realIds.has(rec.google_place_id)) ? rec.google_place_id : null;
    let realPlace: any = null;
    if (verified || placeId) {
      if (placeId) realPlace = allPlacesResults.find(p => p.place_id === placeId) ?? null;
      if (!realPlace) realPlace = findClosestByName(recNameNorm);
      if (!placeId && realPlace) { placeId = realPlace.place_id; verified = true; }
    }
    if (!verified && !placeId) {
      realPlace = findClosestByName(recNameNorm);
      if (realPlace) { verified = true; placeId = realPlace.place_id; }
    }
    return { ...rec, google_place_id: placeId, _verified: verified };
  });

  const beforeFilter = recommendations.length;
  recommendations = recommendations.filter(r => r._verified);
  const dropped = beforeFilter - recommendations.length;

  // Deduplicación
  const seenIdsFinal = new Set<string>();
  const seenNamesFinal = new Set<string>();
  recommendations = recommendations.filter(rec => {
    const nameKey = (rec.name || '').toLowerCase().trim();
    if (rec.google_place_id) {
      if (seenIdsFinal.has(rec.google_place_id)) return false;
      seenIdsFinal.add(rec.google_place_id);
      seenNamesFinal.add(nameKey);
      return true;
    }
    if (seenNamesFinal.has(nameKey)) return false;
    seenNamesFinal.add(nameKey);
    return true;
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // RESULTADO FINAL
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log(`\n════════════════════════════════════════════════`);
  console.log(`RESULTADO FINAL: ${recommendations.length} recomendaciones`);
  if (dropped > 0) console.log(`  ⚠️  Descartadas por hallucination filter: ${dropped}`);
  console.log(`════════════════════════════════════════════════`);
  recommendations.forEach((r, i) => {
    console.log(`  [${i}] ✅ ${r.name} | distance="${r.distance}" | id=${r.google_place_id}`);
  });

  // ── DIAGNÓSTICO: ¿Qué pasó con cada candidato del pool? ─────────────────
  console.log(`\n── Diagnóstico por candidato del pool ──────────────────────`);
  for (const candidate of preSelected) {
    const inResult = recommendations.find(r =>
      r.google_place_id === candidate.place_id ||
      normalizeHtml(r.name || '').includes(normalizeHtml(candidate.name || '').substring(0, 8))
    );
    if (inResult) {
      console.log(`  ✅ ${candidate.name}`);
    } else {
      // Buscar si Gemini lo devolvió pero fue filtrado
      const raw = JSON.parse(text).recommendations || [];
      const inGemini = raw.find((r: any) => normalizeHtml(r.name || '').includes(normalizeHtml(candidate.name || '').substring(0, 8)));
      if (inGemini) {
        const norm = normalizeHtml(inGemini.name || '');
        const verifiedById = inGemini.google_place_id && realIds.has(inGemini.google_place_id);
        const verifiedByName = realNamesMap.has(norm) || [...realNamesMap.keys()].some(k => k.includes(norm) || norm.includes(k));
        console.log(`  ❌ ${candidate.name}`);
        console.log(`     → Gemini lo devolvió como: "${inGemini.name}"`);
        console.log(`     → Verificado por ID: ${verifiedById} | Por nombre: ${verifiedByName}`);
        console.log(`     → Name normalizado: "${norm}"`);
      } else {
        console.log(`  ❌ ${candidate.name} → Gemini NO lo incluyó en el JSON`);
      }
    }
  }
}

run().catch(console.error);
