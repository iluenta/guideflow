import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

import { streamGeminiREST } from '@/lib/ai/clients/gemini-rest';
import { logger } from '@/lib/logger';
import { RateLimiter } from '@/lib/security/rate-limiter';
import { logSuspiciousActivity } from '@/lib/security';
import { getTenantId } from '@/app/actions/properties';
import { generateArrivalInstructions } from '@/lib/arrival/generator-final';
import { logAiUsage } from '@/lib/services/ai-usage-logger';
import { after } from 'next/server';

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
    
    logger.debug(`[ZONE] detectZoneType status: ${data.status}, results: ${data.results?.length ?? 0}`);

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      logger.error(`[ZONE] ❌ Error de Google detectZoneType: ${data.status} - ${data.error_message || 'N/A'}`);
      // Fallback to city instead of proceeding with count=0 (which would lead to 'rural')
      return { type: 'city', walkRadius: 2000, driveRadius: 8000, label: 'ciudad', preferCar: false };
    }
    
    const count: number = data.results?.length ?? 0;

    if (count >= 15) return { type: 'metropolis', walkRadius: 1000, driveRadius: 5000, label: 'gran ciudad', preferCar: false };
    if (count >= 8) return { type: 'city', walkRadius: 1800, driveRadius: 8000, label: 'ciudad', preferCar: false };
    if (count >= 3) return { type: 'town', walkRadius: 4000, driveRadius: 15000, label: 'pueblo', preferCar: true };

    // ZERO_RESULTS in 800m = not a walkable dense area (preferCar always true here).
    // Re-check at 3km to pick the right zone type (affects review thresholds) but
    // never set preferCar=false — if you can't walk to a restaurant in 800m, you drive.
    if (count === 0) {
      try {
        const url2 = `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
          `?location=${lat},${lng}&radius=3000&type=restaurant&key=${placesKey}`;
        const data2 = await fetch(url2).then(r => r.json());
        const count2: number = data2.results?.length ?? 0;
        // preferCar: true in both cases — area is not walkable (failed 800m test)
        if (count2 >= 10) return { type: 'city', walkRadius: 2000, driveRadius: 10000, label: 'ciudad costera', preferCar: true };
        if (count2 >= 4)  return { type: 'town', walkRadius: 4000, driveRadius: 15000, label: 'pueblo turístico', preferCar: true };
      } catch { /* ignore, fall through to rural */ }
    }

    // ZERO_RESULTS in both 800m and 3km = small town or coastal area with sparse restaurants
    // (common for beach towns like Vera). Default to 'town' with coastal profile, not 'rural'.
    logger.debug('[ZONE] ZERO_RESULTS in both checks → defaulting to town_coastal');
    return { type: 'town', walkRadius: 4000, driveRadius: 15000, label: 'pueblo costero', preferCar: true };
  } catch (e) {
    logger.warn('[ZONE] Detection failed, defaulting to town_coastal:', e);
    return { type: 'town', walkRadius: 4000, driveRadius: 15000, label: 'pueblo costero', preferCar: true };
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
  tapas: { quota: 2, placeType: 'bar', keywords: ['bar tapas', 'taberna bodega', 'chiringuito', 'tapas raciones'] },
  cultura: { quota: 2, placeType: 'tourist_attraction', keywords: ['museo', 'castillo monumento', 'qué ver visitar'] },
  naturaleza: { quota: 2, placeType: 'tourist_attraction', keywords: ['playa', 'sierra montaña', 'parque natural', 'cueva gruta', 'mirador panoramico'] },
  ocio_nocturno: { quota: 2, placeType: 'night_club', keywords: ['bar copas', 'música', 'ocio nocturno'] },
};

const SINGLE_CAT_MAP: Record<string, { placeType: string; keywords: string[] }> = {
  restaurantes: { placeType: 'restaurant', keywords: ['restaurante', 'cocina local', 'gastronomía'] },
  italiano: { placeType: 'restaurant', keywords: ['restaurante italiano', 'pizzería', 'pizzeria', 'trattoria', 'ristorante'] },
  // 'mediterraneo': strictly specialised in Mediterranean cuisine — paella, fresh fish,
  // seafood, chiringuitos. The BEST paella at 60km is worth the trip (destination dining).
  mediterraneo: { placeType: 'restaurant', keywords: [
    'paella arroces',          // rice specialists — core of Mediterranean cuisine
    'marisqueria pescados',    // seafood restaurants
    'chiringuito playa',       // beach chiringuitos with fresh fish
    'restaurante mediterraneo', // explicit Mediterranean label
    'espeto fritura',          // grilled sardines / fried fish — Andalusian coast specialty
    'mariscos frescos pescado', // fresh seafood — finds port restaurants like Escánez
  ]},
  hamburguesas: { placeType: 'restaurant', keywords: [
    'hamburgueseria',   // hamburguesería (without accent for broader match)
    'burger',           // catches "Burger House", "Smash Burger", etc.
    'smash burger',     // artisan smash burgers
    'grill house',      // grill houses often specialise in burgers
    'burger gastrobar', // gastro burger variant
    'hamburguesas gourmet', // gourmet burger variant
  ]},
  asiatico: { placeType: 'restaurant', keywords: ['restaurante asiático', 'sushi', 'japonés', 'comida china', 'thai food', 'comida tailandesa', 'vietnamita', 'cocina asiática', 'ramen'] },
  alta_cocina: { placeType: 'restaurant', keywords: ['restaurante gourmet', 'fine dining'] },
  internacional: { placeType: 'restaurant', keywords: ['restaurante mexicano', 'indio', 'árabe'] },
  desayuno: { placeType: 'cafe', keywords: ['cafetería', 'desayuno', 'brunch', 'specialty coffee'] },
  cafe: { placeType: 'cafe', keywords: ['café espresso', 'specialty', 'cafetería'] },
  tapas: { placeType: 'bar', keywords: [
    'bar tapas',           // classic tapas bar
    'tapas',               // tapas specialist
    'taberna',             // traditional tavern
    'bodega',              // wine bar / traditional bodega
    'tasca',               // classic Spanish tasca
    'raciones',            // local raciones bars
    'bar raciones',        // raciones bar
    'chiringuito',         // beach bar with tapas (key for coastal areas)
    'pinchos pintxos',     // Basque-style tapas
    'raciones mariscos',   // seafood raciones — typical Almería specialty
    'bar local tradicional', // authentic local bars
  ]},
  compras: { placeType: 'shopping_mall', keywords: ['centro comercial', 'tiendas moda', 'boutique'] },
  supermercados: { placeType: 'supermarket', keywords: ['supermercado', 'mercadona', 'carrefour', 'lidl'] },
  cultura: { placeType: 'tourist_attraction', keywords: [
    'museo',                   // museums of all types
    'monumento',               // monuments
    'castillo fortaleza',      // castles, fortresses
    'patrimonio historico',    // heritage sites
    'yacimiento arqueologico', // archaeological sites
    'iglesia catedral',        // churches, cathedrals (when historically significant)
    'qué ver visitar',         // generic "what to see" — catches local highlights
  ]},
  // 'naturaleza': natural wonders a tourist visits for the landscape or geological phenomenon,
  // whether freely accessible (beach, cape) or via guided visit (geode, cave system).
  // Geological wonders like La Geoda de Pulpí or Las Cuevas de Sorbas are nature, not ocio —
  // the tourist goes to SEE a natural phenomenon, not to DO an activity.
  // 'naturaleza': ALL types of natural spaces — coastal, mountain, inland, desert.
  // The tourist experience is visiting/contemplating a natural phenomenon,
  // not doing an activity in it (activities → ocio).
  // Ski resorts → ocio (you go TO SKI). Sierra Nevada as a mountain → naturaleza.
  naturaleza: { placeType: 'tourist_attraction', keywords: [
    // ── Coastal / water ──────────────────────────────────────────────────
    'playa',                      // beaches
    'cabo punta cala',            // capes, headlands, coves
    'salinas laguna lago',        // salt flats, lagoons, lakes
    'cascada rio nacimiento',     // waterfalls, rivers, springs
    // ── Mountain / inland ────────────────────────────────────────────────
    'sierra montaña',             // mountain ranges, peaks
    'bosque pinar',               // forests, pine woods
    'desierto badlands',          // desert landscapes (Tabernas, Bardenas)
    'volcan caldera',             // volcanic landscapes (Canarias, etc.)
    'embalse pantano',            // reservoirs, lakes
    'parque nacional natural',    // national and natural parks
    'reserva natural biosfera',   // nature reserves, biosphere reserves
    // ── Geological / underground ─────────────────────────────────────────
    'cueva gruta',                // caves, cave systems
    'geoda formacion geologica',  // geological wonders
    // ── Viewpoints / trails ──────────────────────────────────────────────
    'mirador panoramico',         // scenic viewpoints
    'senda sendero naturaleza',   // nature trails (non-guided)
  ]},
  // 'ocio': split into specific activity types so Google returns real leisure venues.
  // Generic keywords like "ocio" or "entretenimiento" return town halls, offices and parks.
  // Each keyword targets a distinct activity cluster:
  //   - Facilities: bowling, karting, paintball, escape rooms, water parks, theme parks
  //   - Water experiences: kayak, boat trips, diving, surfing
  //   - Outdoor experiences: zip line, hiking tours, horse riding
  // placeType: 'tourist_attraction' is the closest Google type for most of these;
  // amusement_park covers theme/water parks; we run both via multiple keywords.
  // ocio keywords are tagged with a tier:
  //   commodity  → tourist goes to the NEAREST one (bowling, karting, escape room)
  //                nobody drives 70km to bowl when there's one 15km away
  //   destination → the SPECIFIC PLACE justifies the trip (boat trip along Cabo de Gata
  //                calas, Oasys MiniHollywood, kayak in a unique coastal park)
  // The tier controls distance cap and scoring — see OCIO_COMMODITY_KEYWORDS below.
  ocio: { placeType: 'tourist_attraction', keywords: [
    // ── COMMODITY: go to the nearest one ─────────────────────────────────
    'bolera bowling',                  // bowling
    'karting',                         // karting
    'escape room',                     // escape rooms
    'paintball',                       // paintball
    'minigolf',                        // mini golf
    'parque acuatico',                 // water parks (local)
    'estacion esqui pistas ski',       // ski resorts (nearest to property)
    // ── DESTINATION: the place itself is the reason for the trip ─────────
    'parque tematico atracciones',     // unique theme parks (Oasys MiniHollywood)
    'excursion barco',                 // boat trips along specific coastlines
    'kayak',                           // kayak in specific natural areas
    'buceo submarinismo',              // diving in specific spots
    'surf',                            // surf schools
    'actividades nauticas acuaticas',  // nautical activity companies
    'turismo activo aventura',         // adventure tourism
    'rutas a caballo equitacion',      // horse riding routes
    'tirolina aventura',               // adventure parks
  ]},
  // 'relax': keywords must be specific enough to avoid hotels, hair salons and gyms.
  // "masajes" alone pulls beauty salons; "spa" alone pulls hotels with spa amenity.
  // Pairing with "terapeutico/centro/thalasso" forces dedicated wellness establishments.
  relax: { placeType: 'spa', keywords: ['spa thalasso', 'centro spa', 'masajes terapeuticos', 'hammam baño arabe', 'centro bienestar wellness', 'termas'] },
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
function isQualityPlace(place: any, zone: ZoneInfo, catLabel: string, forceRelaxed?: boolean): boolean {
  // 1. Fotos obligatorias (señal de lugar documentado)
  // Exento: utilidades, cultura, naturaleza (monumentos/parques sin foto son normales)
  // Exento: ocio (pequeñas empresas locales como Karting Garrucha o VeraSurfing
  //         raramente tienen fotos en Nearby Search aunque sean negocios legítimos)
  const isUtility = ['supermercados', 'compras', 'cultura', 'naturaleza', 'ocio'].includes(catLabel.toLowerCase());
  if (!isUtility && (!place.photos || place.photos.length === 0)) return false;

  // 2. Umbrales adaptativos por zona y categoría
  const cat = catLabel.toLowerCase();
  const isNatureOrCulture = ['cultura', 'naturaleza'].includes(cat);

  let minReviews: number;
  let minRating: number;

  // For nature/culture: relax review count requirements since beaches, monuments and parks
  // often have null or sparse ratings in Google Places.
  // BUT: if a place has enough reviews to be statistically meaningful (≥50) and still
  // scores below 3.5★, it's genuinely poor — reject it (e.g. a tourist train with 2.3★).
  if (!isNatureOrCulture) {
    // DYNAMIC THRESHOLDS based on zone density
    if (zone.type === 'metropolis') {
      // High competition → high bar
      minReviews = 80;
      minRating  = 4.2;
    } else if (zone.type === 'city') {
      minReviews = 50;
      minRating  = 4.1;
    } else if (zone.type === 'town' || zone.type === 'rural') {
      // Low density → lower bar (fewer locals leave reviews)
      minReviews = 15;
      minRating  = 4.0;
    } else {
      // Default
      minReviews = 30;
      minRating  = 4.1;
    }

    // RESCUE MODE: if few results in niche categories (asiatica, internacional),
    // relax thresholds to show *something* rather than blank screen
    if (forceRelaxed && ['asiatica', 'internacional'].includes(cat)) {
      minReviews = 15;
      minRating  = 4.0;
    }

    if ((place.user_ratings_total || 0) < minReviews) return false;
    if ((place.rating || 0) < minRating) return false;
  } else {
    // Nature/culture: only apply rating floor when there's enough evidence
    const reviewCount = place.user_ratings_total || 0;
    const rating = place.rating || 0;
    if (reviewCount >= 50 && rating > 0 && rating < 3.5) return false;
  }

  // 3. Blacklist de tipos genéricos o no experienciales
  const blacklist = [
    'lodging',           
    'establishment',     
    'transit_station',   
    'bus_station',       
    'subway_station',    
    'parking',           
    'car_parking',       
    'atm',               
    'bank'               
  ];

  // Si solo tiene tipos de la blacklist, descartar.
  // point_of_interest: permitido para naturaleza/cultura (monumentos, playas) Y para ocio,
  // porque la API de Google asigna solo ['point_of_interest','establishment'] a muchos
  // negocios de actividades legítimos: kartings, escuelas de surf, clubs de buceo, etc.
  const types = place.types || [];
  const isOcio = cat === 'ocio';
  const hasRealType = types.some((t: string) => !blacklist.includes(t) && (isNatureOrCulture || isOcio || t !== 'point_of_interest'));
  if (!hasRealType) return false;

  // 4. Distancia mínima para parques/naturaleza (evita jardines del propio edificio)
  // Only apply min-distance check when the distance is actually known
  // (place.realDistanceMeters is undefined when called from addResults before enrichment)
  if (isNatureOrCulture && place.realDistanceMeters != null && place.realDistanceMeters < 150) return false;

  return true;
}

// ── Índice Google-Michelin 2.0 (Tourism-adapted) ─────────────────────────────
// Designed for tourist destinations where review volume ≠ local population.
// Key insight: 300 reviews = statistical critical mass for a coastal resort.
//   <100 reviews → still low evidence; 300+ → high confidence

// ── Scoring profiles per category ────────────────────────────────────────────
// Each profile encodes what a tourist actually cares about in that category.
//
//  distNorm   : distance at which the score penalty reaches maximum (meters road-adjusted).
//               Higher = more tolerant of distant places.
//  distWeight : how much distance affects the final score (0 = ignore, 1 = only distance).
//               Cultura/Naturaleza → tourist drives 40min for a castle; proximity irrelevant.
//               Supermercados → nearest full-stock store wins almost always.
//  excellenceBonus : whether the rating-excellence bump (4.6–4.8★) applies.
//               Suppressed for supermarkets (chains are structurally rated lower due to
//               volume; a 4.2★ Mercadona serves tourists better than a 4.6★ cooperative).
//  chainBoost : name fragments of known brands that warrant an extra boost.
//               Only meaningful for supermercados where brand = product range guarantee.
//
const SCORE_PROFILES: Record<string, {
  distNorm: number; distWeight: number; excellenceBonus: boolean; chainBoost?: string[];
}> = {
  // ── Utilities: proximity wins, no excellence bias ─────────────────────────
  supermercados: {
    distNorm: 6_000, distWeight: 0.50, excellenceBonus: false,
    chainBoost: ['mercadona', 'consum', 'lidl', 'carrefour', 'aldi', 'eroski', 'dia ', 'suma ', 'hipercor', 'el corte ingles'],
  },
  compras: {
    // Tourists will drive ~15 min for a good market or outlet; quality matters more than proximity.
    distNorm: 12_000, distWeight: 0.25, excellenceBonus: true,
  },
  // ── Food: each category has its own distance logic based on tourist behaviour ──
  //
  // DESTINATION food: tourist plans the meal, drives for the experience/quality.
  // COMMODITY food:   tourist picks the best nearby option, won't drive 30km for it.
  //
  alta_cocina: {
    // Pure destination: a tourist books a fine-dining or Michelin-starred experience
    // regardless of distance — same logic as a famous museum.
    // A great restaurant in Carboneras (35km) absolutely beats a mediocre one in Vera.
    distNorm: 45_000, distWeight: 0.10, excellenceBonus: true,
  },
  mediterraneo: {
    // DESTINATION dining: the best paella or espeto restaurant at 60km is worth the trip.
    // Same logic as naturaleza — you go for the specific place, not the nearest option.
    // A chiringuito in Carboneras, the best arroz con bogavante in the province — these
    // are planned experiences regardless of distance.
    distNorm: 45_000, distWeight: 0.10, excellenceBonus: true,
  },
  restaurantes: {
    // Quality-driven: tourists on holiday choose the best available, will drive 25-30km.
    // A great restaurant in a nearby town beats a mediocre one next door.
    distNorm: 25_000, distWeight: 0.15, excellenceBonus: true,
  },
  tapas: {
    // Commodity-local: tourists pick the best tapas bar within walking distance.
    // Nobody drives 15-20km for tapas when there's a good bar nearby.
    // distNorm=5km, distWeight=0.40: proximity is critical, but quality still matters.
    distNorm: 5_000, distWeight: 0.40, excellenceBonus: false,
  },
  asiatico: {
    // A good Asian restaurant (sushi, Thai) in a nearby city may justify 25km.
    // Less destination than alta_cocina but more than pizza — a specific cuisine
    // that tourists may actively seek out.
    distNorm: 20_000, distWeight: 0.20, excellenceBonus: true,
  },
  internacional: {
    // Commodity-ish: Mexican, Indian, Arab — tourists pick the nearest decent option.
    distNorm: 15_000, distWeight: 0.25, excellenceBonus: true,
  },
  italiano: {
    // Semi-commodity: a good gourmet pizza or tratoria can justify 8km.
    // distNorm=8km, distWeight=0.30: moderate distance penalty, quality still matters.
    distNorm: 8_000, distWeight: 0.30, excellenceBonus: true,
  },
  hamburguesas: {
    // Pure commodity: tourists want the best burger within walking distance or quick drive.
    // distNorm=4km, distWeight=0.50: proximity wins. A 4.6★ burger 12km away loses to 4.3★ at 800m.
    distNorm: 4_000, distWeight: 0.50, excellenceBonus: false,
  },
  desayuno: {
    // Commodity: morning coffee/breakfast — tourists want something close.
    // A nice terrace café 5km away is fine; 20km is too far for breakfast.
    distNorm: 10_000, distWeight: 0.30, excellenceBonus: true,
  },
  cafe: {
    distNorm: 10_000, distWeight: 0.30, excellenceBonus: true,
  },
  ocio_nocturno: {
    // Tourists need to get home safely — distance matters most of all food categories.
    distNorm: 8_000, distWeight: 0.35, excellenceBonus: true,
  },
  // ── Experiential: quality/fame dominates, tourists drive for these ─────────
  cultura: {
    // Everything that survives the cultura filters (museums, castles, monuments) IS a
    // destination — tourists drive 60min for a famous castle regardless of distance.
    // distWeight=0.08: fame/reviews (N_CRITICAL=500) dominate; minor plaques with few
    // reviews naturally score low even if they're nearby.
    // distNorm=40km: gentle curve — a famous landmark at 35km barely loses to one at 5km.
    distNorm: 40_000, distWeight: 0.08, excellenceBonus: true,
  },
  naturaleza: {
    // All surviving naturaleza is destination: beaches, caves, geological wonders, capes.
    // Nobody picks the nearest beach over Playa de los Muertos (40km, 5★).
    // distWeight=0.10: quality/spectacle wins; distance barely penalizes.
    // distNorm=45km: Playa de los Muertos (40km), Cala de Enmedio (45km) stay competitive.
    distNorm: 45_000, distWeight: 0.10, excellenceBonus: true,
  },
  ocio: {
    // Destination experiences: the specific place justifies the trip.
    // Boat trips along Cabo de Gata, kayak in unique calas, Oasys MiniHollywood.
    // Quality/uniqueness wins; distance is secondary (distWeight=0.12).
    distNorm: 40_000, distWeight: 0.12, excellenceBonus: true,
  },
  ocio_commodity: {
    // Commodity leisure: bowling, karting, escape room, paintball, minigolf.
    // Tourist goes to the NEAREST acceptable option — same logic as supermercados.
    // distWeight=0.50, distNorm=20km: Karting Garrucha at 8km beats Bowling Lorca at 46km.
    distNorm: 20_000, distWeight: 0.50, excellenceBonus: false,
  },
  relax: {
    // Spa/wellness is closer to commodity than destination: you go to the best nearby one,
    // not to a specific spa 60km away. BUT a good hammam or thalasso at 25km is worth it.
    // distNorm=25km: clear penalty beyond 25km. distWeight=0.25: proximity matters
    // but quality still wins between comparable options (4.5★ spa 20km > 3.8★ spa 2km).
    distNorm: 25_000, distWeight: 0.25, excellenceBonus: true,
  },
};

const DEFAULT_PROFILE: { distNorm: number; distWeight: number; excellenceBonus: boolean; chainBoost?: string[] } = {
  distNorm: 12_000, distWeight: 0.20, excellenceBonus: true
};

// ── Scoring formula ──────────────────────────────────────────────────────────
// Score = (Rating × 0.7) + (min(1, reviews/500) × 1.5) × distance_modifier
//
// Base score range: 0–5
//   Rating contributes 70%  → max 3.5 (at 5★)
//   Volume contributes 30%  → max 1.5 (at ≥500 reviews), capped to avoid
//                             high-volume chains crushing good local restaurants
//
// Distance modifier: per-category profile (distNorm + distWeight).
//   Each category defines how much distance penalizes the score.
//   supermercados: 50% weight (proximity wins)
//   alta_cocina:   10% weight (quality wins, distance barely penalizes)
//
// Chain boost (supermercados only): +0.5 for known full-stock chains (Mercadona,
//   Consum, Lidl...) to offset the structural rating disadvantage of large chains.
function scoreSimple(place: any, distanceMeters: number, catLabel?: string): number {
  const rating = place.rating ?? 0;
  const reviews = place.user_ratings_total ?? 0;

  // Base score: rating-led, with review volume as a minor confidence bonus
  // (capped at 500 reviews, scaled 0–0.5). A 4.5★ spot with few reviews should
  // still be able to outrank a 4.3★ spot that simply has more volume — a high
  // rating with modest reviews is a strong signal, not noise to be discounted.
  const baseScore = (rating * 1.0) + (Math.min(1, reviews / 500) * 0.5);

  const profile = (catLabel && SCORE_PROFILES[catLabel]) ? SCORE_PROFILES[catLabel] : DEFAULT_PROFILE;

  // Chain boost for supermercados only
  const chainBoost = profile.chainBoost?.some(c => (place.name || '').toLowerCase().includes(c)) ? 0.50 : 0;

  const roadMeters = distanceMeters * 1.4;
  const distScore = Math.max(0, 1 - roadMeters / profile.distNorm);

  return (baseScore + chainBoost) * (1 - profile.distWeight + profile.distWeight * distScore);
}

// ── Google Places (New) API — response normalizer ─────────────────────────────
// Text Search (New) returns a different field schema than the legacy Nearby Search.
// This adapter converts the new format to the shape our downstream code expects,
// so all filters, scoring and Gemini context building work unchanged.
function normalizeTextSearchResult(place: any): any {
  return {
    place_id:           place.id ?? '',
    name:               place.displayName?.text ?? '',
    vicinity:           place.shortFormattedAddress ?? place.formattedAddress ?? '',
    formatted_address:  place.formattedAddress ?? '',
    geometry: {
      location: {
        lat: place.location?.latitude  ?? null,
        lng: place.location?.longitude ?? null,
      }
    },
    rating:              place.rating ?? null,
    user_ratings_total:  place.userRatingCount ?? 0,
    types:               place.types ?? [],
    photos:              place.photos ?? [],
    opening_hours: place.currentOpeningHours
      ? { open_now: place.currentOpeningHours.openNow }
      : undefined,
  };
}

// ── UTILS ───────────────────────────────────────────────────────────────────

/**
 * Distancia real en metros entre dos coordenadas (Haversine)
 */
const haversineMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Convierte metros a texto legible con corrección de caminata/coche
 */
const formatDistance = (meters: number, preferCar: boolean, forceCarIfFar?: boolean): string => {
  const walkingMeters = meters * 1.35; 
  const walkMin = Math.round(walkingMeters / 80); 
  const carRoadMeters = meters * 1.6; 
  const carMin = Math.max(1, Math.round(carRoadMeters / 600)); 

  if (meters <= 200) return `${Math.round(meters)} metros andando`;
  if (forceCarIfFar && walkingMeters > 1200) return `${carMin} min en coche`;
  if (walkingMeters <= 2200) return `${walkMin} min andando`;
  if (preferCar) return `${carMin} min en coche`;
  if (walkingMeters <= 4000) return `${walkMin} min andando`;
  return `${carMin} min en coche`;
};

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
  neighborhood?: string;
  excludeNames?: string[];
  rankMode?: 'prominence' | 'distance';
}): Promise<any[]> {
  const {
    lat, lng, zone, placeType, keywords, catLabel, neededCount,
    placesKey, cityName, neighborhood, excludeNames = [], rankMode = 'prominence'
  } = params;
  const collected: any[] = [];
  const seenIds = new Set<string>();
  const excludeSet = new Set(excludeNames.map(n => n.toLowerCase().trim()));

  // RESCUE MODE: Niche cuisines in rural areas often have few options.
  // We'll enable relaxed quality thresholds for asiatica/internacional to avoid blank screens.
  const isNicheCuisine = ['asiatica', 'internacional'].includes(catLabel.toLowerCase());
  const allowRelaxedQuality = isNicheCuisine;

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
      // ── Distance filtering moved to final ranking (distanceLimit per category) ──
      // Don't prematurely reject here. Let quality/scoring gates work first.

      // ── CATEGORY-SPECIFIC TAGGING — KEYWORD-BASED ONLY ────────────────────────
      // Text Search classified places semantically. We trust that completely.
      // We ONLY use Google types to filter structurally wrong places (nightclub vs food).
      // We NEVER analyze place names. We tag ONLY for Gemini balance (which keyword found this).

      if (catLabel === 'naturaleza') {
        const types = (r.types || []) as string[];
        const NON = new Set(['amusement_park', 'bowling_alley', 'lodging', 'restaurant', 'cafe', 'bar', 'store', 'supermarket', 'shopping_mall', 'gym', 'spa']);
        if (types.some(t => NON.has(t))) {
          logger.debug(`[FILTER:naturaleza] SKIP_STRUCTURE "${r.name}"`);
          continue;
        }
      }

      if (catLabel === 'relax') {
        const types = (r.types || []) as string[];
        const WELLNESS = new Set(['spa', 'beauty_salon', 'health', 'physiotherapist']);
        if (!types.some(t => WELLNESS.has(t))) {
          logger.debug(`[FILTER:relax] SKIP_NOT_WELLNESS "${r.name}"`);
          continue;
        }
      }

      if (catLabel === 'ocio') {
        const types = (r.types || []) as string[];
        const LEISURE = new Set(['amusement_park', 'bowling_alley', 'aquarium', 'zoo', 'campground', 'tourist_attraction', 'point_of_interest']);
        if (!types.some(t => LEISURE.has(t)) && !types.some(t => ['restaurant', 'bar', 'cafe', 'food'].includes(t))) {
          logger.debug(`[FILTER:ocio] SKIP_NOT_LEISURE "${r.name}"`);
          continue;
        }
        const sk = ((extra as any).searchKeyword || '').toLowerCase();
        (r as any).gfActivityTier = OCIO_COMMODITY_KEYWORDS.has(sk) ? 'commodity' : 'destination';
      }

      if (catLabel === 'mediterraneo') {
        const types = (r.types || []) as string[];

        // ═══════════════════════════════════════════════════════════════════════════
        // FILTRADO ESTRICTO POR CATEGORÍA PRINCIPAL
        // Google ordena los types por relevancia. El primero (index 0) es el negocio real.
        // ═══════════════════════════════════════════════════════════════════════════
        const primaryType = types[0] || '';

        // Lista negra: si el negocio es principalmente una tienda, RECHAZAR inmediatamente
        const BLACKLISTED_PRIMARY_TYPES = [
          'food_store',
          'grocery_or_supermarket',
          'store',
          'market',
          'wholesaler',
          'establishment'
        ];

        if (BLACKLISTED_PRIMARY_TYPES.includes(primaryType)) {
          logger.debug(`[FILTER:mediterraneo] SKIP_STORE "${r.name}" (primary type: ${primaryType})`);
          continue;
        }

        // Comprobación obligatoria: debe ser restaurante, bar, o café
        const isRealFoodService = types.includes('restaurant') || types.includes('bar') || types.includes('cafe');

        if (!isRealFoodService) {
          logger.debug(`[FILTER:mediterraneo] SKIP_NOT_FOOD "${r.name}" types=[${types.slice(0,2).join(',')}]`);
          continue;
        }

        // Clasificación de subcategoría: usa el keyword de búsqueda que lo encontró Y el nombre del lugar
        const sk = ((extra as any).searchKeyword || '').toLowerCase();
        const nameLower = (r.name || '').toLowerCase();
        (r as any).gfMedSubcat = (sk.includes('chiringuito') || nameLower.includes('chiringuito')) ? 'chiringuito' : 'restaurant';
      }

      if (catLabel === 'italiano') {
        const sk = ((extra as any).searchKeyword || '').toLowerCase();
        const nameLower = (r.name || '').toLowerCase();
        (r as any).gfItalianoSubcat = (sk.includes('pizz') || sk.includes('pizza') || nameLower.includes('pizz') || nameLower.includes('pizza')) ? 'pizza' : 'italian';
      }

      if (catLabel === 'tapas') {
        const sk = ((extra as any).searchKeyword || '').toLowerCase();
        const nameLower = (r.name || '').toLowerCase();
        const isSpecialistByNameOrKeyword = ['tapas', 'pintxos', 'taberna', 'bodega', 'chiringuito', 'tasca'].some(kw => 
          sk.includes(kw) || nameLower.includes(kw)
        );
        (r as any).gfTapasSpecialist = isSpecialistByNameOrKeyword;
      }

      if (!isQualityPlace(r, zone, catLabel, allowRelaxedQuality)) {
        logger.debug(`[FILTER:${catLabel}] REJECT "${r.name}" quality check failed`);
        continue;
      }

      // ── CITY/NEIGHBORHOOD FILTER ──────────────────────────────────────────
      const rAddress = (r.vicinity || r.formatted_address || '').toLowerCase();
      const cityLower = cityName.toLowerCase();
      
      // Blacklist of nearby cities to avoid "bleeding" when radius is large
      const MADRID_SURROUNDINGS = ['alcorcon', 'mostoles', 'leganes', 'getafe', 'fuenlabrada', 'alcobendas', 'pozuelo', 'majadahonda', 'coslada', 'las rozas', 'rivas'];
      
      // Si la ciudad es Madrid, ser muy estricto con los satélites
      const isIncorrectCity = MADRID_SURROUNDINGS.some(other => {
        const regex = new RegExp(`\\b${other}\\b`, 'i');
        return regex.test(rAddress) && other !== cityLower && !rAddress.includes(cityLower);
      });

      if (isIncorrectCity) {
        logger.debug(`[FILTER:${catLabel}] REJECT "${r.name}" wrong city: ${rAddress}`);
        continue;
      }

      logger.debug(`[FILTER:${catLabel}] PASS "${r.name}" rating=${r.rating} dist=${Math.round(realDistanceMeters)}m`);

      // Tag ocio places with their tier based on which keyword found them
      const gfActivityTier = (catLabel === 'ocio' && (extra as any).searchKeyword)
        ? (OCIO_COMMODITY_KEYWORDS.has((extra as any).searchKeyword) ? 'commodity' : 'destination')
        : undefined;

      const catForScore = (catLabel === 'ocio' && gfActivityTier === 'commodity') ? 'ocio_commodity' : catLabel;
      const score = scoreSimple(r, realDistanceMeters, catForScore);

      // Collect all subcategory tags that were assigned in category-specific blocks
      const subCategoryTags = {
        gfMedSubcat: (r as any).gfMedSubcat,
        gfItalianoSubcat: (r as any).gfItalianoSubcat,
        gfTapasSpecialist: (r as any).gfTapasSpecialist,
      };

      collected.push({
        ...r,
        gfCategory: catLabel,
        realDistanceMeters,
        realDistance,
        gfActivityTier,
        score,
        ...subCategoryTags,
        ...extra
      });
    }
  };

  // Para supermercados y compras cada keyword es una cadena específica — recorrer todos
  // Para el resto, parar en cuanto hay suficientes resultados (optimización de coste)
  const exhaustAllKeywords = ['supermercados', 'compras'].includes(catLabel);

  // Ocio tier: commodity activities (bowling, karting, escape room...) → nearest wins.
  // Destination activities (boat trips, kayak, unique parks) → quality/uniqueness wins.
  const OCIO_COMMODITY_KEYWORDS = new Set([
    // Activities where you go to the nearest acceptable option
    'bolera bowling', 'karting', 'escape room', 'paintball', 'minigolf', 'parque acuatico',
    // Ski: you go to the nearest/best resort, not to a specific slope 200km away
    // (unless it's THE famous resort of the region, which scoring will surface naturally)
    'estacion esqui', 'pistas de ski', 'esqui ski',
  ]);

  // ── Google Places Text Search (New API) ──────────────────────────────────────
  // Uses semantic matching: searches name + reviews + editorial descriptions.
  // This finds "Restaurante Lua Puerto Rey" as Mediterranean because its reviews
  // mention "arroces", "pescado fresco" — even though its name doesn't say so.
  //
  // locationRestriction = strict radius (commodity: burger, pizza, supermarket)
  // locationBias        = soft bias (destination: Mediterranean, naturaleza, ocio)
  //                       Allows results beyond the radius when highly relevant.
  //
  // Per-category radius matches our distanceLimit caps so irrelevant distant
  // results are filtered before they even reach addResults.
  const SEARCH_RADIUS_BY_CAT: Record<string, number> = {
    // Commodity food — proximity wins, strict radius
    supermercados:  15_000,
    hamburguesas:   15_000,
    desayuno:       12_000,
    cafe:           12_000,
    ocio_nocturno:   8_000,
    italiano:       18_000,
    internacional:  20_000,
    compras:        20_000,
    // Quality food — willing to drive, soft bias
    tapas:          25_000,
    asiatico:       25_000,
    restaurantes:   30_000,
    relax:          30_000,
    // Destination food/experience — quality dominates, wide soft bias
    alta_cocina:    50_000,
    mediterraneo:   65_000,
    cultura:        40_000,
    naturaleza:     50_000,
    ocio:           50_000,
  };
  // Text Search (New) API hard cap: 50,000m. Categories with larger distanceLimits
  // (mediterraneo 65km, ocio_commodity 25km override) rely on our post-search filters.
  const searchRadius = Math.min(SEARCH_RADIUS_BY_CAT[catLabel] ?? 20_000, 50_000);

  // Note: Places API (New) searchText only allows a `circle` shape inside `locationBias` —
  // `locationRestriction` requires a `rectangle` (viewport). The hard distanceLimit filter
  // below (line ~837) already enforces strict proximity downstream, so locationBias is safe here.
  const locationKey = 'locationBias';

  const TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
  const TEXT_SEARCH_FIELD_MASK = [
    'places.id', 'places.displayName', 'places.location',
    'places.rating', 'places.userRatingCount', 'places.types',
    'places.photos', 'places.formattedAddress', 'places.shortFormattedAddress',
  ].join(',');

  for (const keyword of keywords) {
    if (!exhaustAllKeywords && collected.length >= neededCount * 2) break;

    // Build a natural language query: keyword + city for geographic context
    const textQuery = cityName ? `${keyword} ${cityName}` : keyword;

    const requestBody = {
      textQuery,
      [locationKey]: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: searchRadius,
        }
      },
      maxResultCount: 20,
      languageCode: 'es',
    };

    try {
      const res = await fetch(TEXT_SEARCH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': placesKey,
          'X-Goog-FieldMask': TEXT_SEARCH_FIELD_MASK,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      if (data.error) {
        logger.error(`[PLACES] ❌ TextSearch "${keyword}": ${data.error.status} — ${data.error.message}`);
        continue;
      }

      const normalized = (data.places || []).map(normalizeTextSearchResult);
      logger.debug(`[PLACES] Keyword "${keyword}" found ${normalized.length} results`);
      addResults(normalized, { searchKeyword: keyword, radiusType: 'textsearch_new' });

    } catch (err) {
      logger.error(`[PLACES] ❌ TextSearch fetch error for "${keyword}":`, err);
    }
  }

  // ── Distance cap per category (final hard filter before scoring) ──────────
  // Each cap reflects the maximum useful radius for a tourist in that category.
  // Scoring profiles already penalize far places; this cap prevents absurd outliers
  // (e.g. a beach 80km away ranking above a local park).
  const cat = catLabel.toLowerCase();
  const distanceLimit = (() => {
    if (cat === 'supermercados') return zone.preferCar ? Math.min(zone.driveRadius, 15_000) : 5_000;
    if (cat === 'compras')       return 20_000;  // tourists drive for markets/outlets
    if (cat === 'cultura')       return 40_000;  // museum or castle up to ~40 min drive
    if (cat === 'naturaleza')    return 45_000;  // geological wonders/caves can be 35-40km away (Cuevas de Sorbas, Geoda de Pulpí)
    if (cat === 'ocio') {
      // Commodity (bowling, karting, escape room): 25km max — nobody drives 70km to bowl
      // Destination (boat trips, kayak, unique parks): 65km — the specific place justifies it
      // Applied per-place after scoring using gfActivityTier tag
      return 65_000; // hard cap; per-place commodity cap applied in post-filter below
    }
    if (cat === 'relax')         return 30_000;
    // ── Food: per-category distance caps reflecting tourist behaviour ────────────
    if (cat === 'alta_cocina')   return 50_000;  // destination dining — worth the full drive
    if (cat === 'mediterraneo')  return 65_000;  // destination: best paella at 60km is worth the trip
    if (cat === 'restaurantes')  return 30_000;  // quality destination, willing to drive
    if (cat === 'tapas')         return 25_000;  // historic village bars worth 20-25km
    if (cat === 'asiatico')      return 25_000;  // specific cuisine, moderate drive
    if (cat === 'internacional') return 20_000;  // commodity-ish
    if (cat === 'italiano')      return 18_000;  // nearest good pizza
    if (cat === 'hamburguesas')  return 15_000;  // pure commodity
    if (['desayuno','cafe'].includes(cat)) {
      return zone.preferCar ? 12_000 : Math.min(zone.walkRadius, 2_000);
    }
    if (cat === 'ocio_nocturno') {
      return zone.preferCar ? Math.min(zone.driveRadius, 8_000) : Math.min(zone.walkRadius, 2_000);
    }
    return zone.preferCar ? zone.driveRadius : Math.min(zone.walkRadius, 2_000);
  })();

  const finalResult = collected
    .filter(r => {
      if (r.realDistanceMeters == null) return false;
      // Ocio commodity (bowling, karting...): hard cap 25km — nobody drives 70km to bowl
      if (cat === 'ocio' && r.gfActivityTier === 'commodity' && r.realDistanceMeters > 25_000) return false;
      return r.realDistanceMeters <= distanceLimit;
    })
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, neededCount * 2);

  logger.warn(`[SCORED:${catLabel}] top${finalResult.length}: ${finalResult.slice(0, 5).map((r: any) => `"${r.name}"(${Math.round(r.realDistanceMeters)}m,${r.rating}★,${r.user_ratings_total}rev,Score=${scoreSimple(r, r.realDistanceMeters, catLabel).toFixed(3)})`).join(' | ')}`);

  return finalResult;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════
export const maxDuration = 60; // Google Places + Gemini can take 20-40s

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
      .select('name, city, country, country_code, neighborhood, latitude, longitude, full_address')
      .eq('id', propertyId)
      .eq('tenant_id', tenant_id)
      .single();

    if (propError || !property) {
      logger.error('[AI-FILL] Property check failed');
      return new Response(JSON.stringify({
        error: 'Propiedad no encontrada en la base de datos',
        debug: 'PROPERTY_NOT_FOUND'
      }), { status: 404 });
    }

    logger.debug(`[AI-FILL] DB Property Check: ${property.name} | Lat: ${property.latitude}, Lng: ${property.longitude} | City: ${property.city}`);

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
          existingData?.propertyParking,
          { propertyId, tenantId: tenant_id }
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
      logger.debug(`[AI-FILL] Dining/Recs requested for property: ${propertyId}, city: ${property.city}`);
      const placesKey = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
      const selectedCat: string = existingData?.category || 'restaurantes';
      const isTodos = selectedCat === 'todos';

      // Coordenadas: Prioridad DB, pero permitir cambio si el front manda algo nuevo
      let lat: number | null = property.latitude ? Number(property.latitude) : null;
      let lng: number | null = property.longitude ? Number(property.longitude) : null;

      // Geocodificar si el usuario cambió la dirección en el Wizard
      const addressToGeo = existingData?.address || property.full_address || fallbackAddress;
      const addressChanged = existingData?.address && property.full_address && 
                           existingData.address.toLowerCase().trim() !== property.full_address.toLowerCase().trim();

      if (placesKey && (!lat || !lng || addressChanged)) {
        try {
          logger.debug(`[AI-FILL] Geocoding address: "${addressToGeo}" (Changed: ${addressChanged})`);
          
          // Reforzar con ciudad/país para evitar "leaks" a otras ciudades
          let biasedAddress = addressToGeo;
          if (property.city && !biasedAddress.toLowerCase().includes(property.city.toLowerCase())) {
            biasedAddress += `, ${property.city}`;
          }
          if (property.country && !biasedAddress.toLowerCase().includes(property.country.toLowerCase())) {
            biasedAddress += `, ${property.country}`;
          }

          const countryFilter = property.country_code ? `&components=country:${property.country_code}` : '';
          const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json` +
            `?address=${encodeURIComponent(biasedAddress)}${countryFilter}&key=${placesKey}`;
          
          const geoData = await fetch(geoUrl).then(r => r.json());
          if (geoData.status === 'OK') {
            lat = geoData.results[0].geometry.location.lat;
            lng = geoData.results[0].geometry.location.lng;
            logger.debug(`[AI-FILL] New coords: ${lat}, ${lng} (from: ${geoData.results[0].formatted_address})`);
          }
        } catch (e) {
          logger.error('[AI-FILL] Geocoding error:', e);
        }
      } else {
        logger.debug(`[PLACES] Using stable coordinates: ${lat}, ${lng}`);
      }

      // Agrupación de resultados por categoría
      const groupedPlaces: Record<string, any[]> = {};
      let allPlacesResults: any[] = [];
      let zone: ZoneInfo = { type: 'city', walkRadius: 2000, driveRadius: 8000, label: 'ciudad', preferCar: false };

      if (placesKey) {
        try {
          const t0 = Date.now();
          // Geocodificar si no hay coords o si el usuario cambió la dirección sustancialmente
          const addressToGeo = existingData?.address || property.full_address || fallbackAddress;
          const addressChanged = existingData?.address && property.full_address && 
                               existingData.address.toLowerCase().trim() !== property.full_address.toLowerCase().trim();
          
          if (!lat || !lng || addressChanged) {
            logger.debug(`[AI-FILL] Geocoding required. Address: "${addressToGeo}" | Changed: ${addressChanged}`);
            
            // Reforzar la dirección con la ciudad/país para evitar falsos positivos (ej. Alcorcón)
            let biasedAddress = addressToGeo;
            if (property.city && !biasedAddress.toLowerCase().includes(property.city.toLowerCase())) {
              biasedAddress += `, ${property.city}`;
            }
            if (property.country && !biasedAddress.toLowerCase().includes(property.country.toLowerCase())) {
              biasedAddress += `, ${property.country}`;
            }

            const countryFilter = property.country_code ? `&components=country:${property.country_code}` : '';
            const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json` +
              `?address=${encodeURIComponent(biasedAddress)}${countryFilter}&key=${placesKey}`;
            
            const geoData = await fetch(geoUrl).then(r => r.json());
            if (geoData.status === 'OK') {
              lat = geoData.results[0].geometry.location.lat;
              lng = geoData.results[0].geometry.location.lng;
              logger.debug(`[AI-FILL] Geocoding success: ${lat}, ${lng} (Source: ${geoData.results[0].formatted_address})`);
            } else {
              console.warn(`[PLACES] Geocoding failed for "${biasedAddress}": ${geoData.status}`);
            }
          } else {
            logger.debug(`[PLACES] Using coordinates from DB: ${lat}, ${lng}`);
          }

          if (lat && lng) {
            logger.debug(`[PLACES] SEARCH CENTER: ${lat}, ${lng} (City: ${property.city}, Neighborhood: ${property.neighborhood})`);
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
                  neighborhood: property.neighborhood || '',
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
                neighborhood: property.neighborhood || '',
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
      const numRequested = isTodos
        ? Object.values(TODOS_QUOTA).reduce((s, c) => s + c.quota, 0)
        : 6;

      // Track place_ids already assigned to a category to avoid cross-category duplicates
      // (e.g. "OH LA LA" appearing in both desayuno and ocio_nocturno → dedup kills 1 slot)
      const selectedAcrossCategories = new Set<string>();

      const placesContext = isTodos
        ? Object.entries(groupedPlaces)
          .map(([cat, places]) => {
            const quota = TODOS_QUOTA[cat]?.quota ?? 2;
            if (!places.length) {
              return `[${cat.toUpperCase()}]: Sin resultados de Google. NO incluyas ningún sitio de esta categoría.`;
            }
            // Select quota places that haven't been used in a prior category
            const selected: any[] = [];
            for (const place of places) {
              if (selected.length >= quota) break;
              if (!selectedAcrossCategories.has(place.place_id)) {
                selected.push(place);
                selectedAcrossCategories.add(place.place_id);
              }
            }
            // Fallback: if not enough unique places, fill from remaining (allows dup as last resort)
            if (selected.length < quota) {
              for (const place of places) {
                if (selected.length >= quota) break;
                if (!selected.some((s: any) => s.place_id === place.place_id)) {
                  selected.push(place);
                  selectedAcrossCategories.add(place.place_id);
                }
              }
            }
            logger.warn(`[GEMINI_SENDS:${cat}] ${selected.map((r: any) => `"${r.name}"(${Math.round(r.realDistanceMeters)}m)`).join(', ')}`);
            const lines = selected.map((r: any) =>
              `  - ${r.name} (${r.vicinity ?? r.formatted_address ?? ''}) | Rating: ${r.rating ?? 'N/A'} | ${r.realDistance ?? 'desconocida'} | ID: ${r.place_id} | Tipos: ${(r.types || []).slice(0, 3).join(',')} | Abierto ahora: ${r.opening_hours?.open_now ?? 'desconocido'}`
            ).join('\n');
            return `[${cat.toUpperCase()}] — USA EXACTAMENTE estos ${quota} sitios, en este orden, sin sustituir ninguno:\n${lines}`;
          })
          .join('\n\n')
        // For single-category: send ALL candidates so Gemini can pick the
        // Single-category: pre-select the top numRequested*2 by IGM (already sorted).
        // For 'italiano': balance pizza vs italian-restaurant subcategories so Gemini
        // doesn't receive 12 pizzerias and return 6 pizza-only recommendations.
        : (() => {
            let preSelected: any[];

            if (selectedCat === 'mediterraneo') {
              // CORRECCIÓN: ORDENACIÓN MATEMÁTICA INAPELABLE Y CONTROL DE CALIDAD
              // 1. Ordenar estrictamente por Score (el algoritmo técnico determina la prioridad)
              const sortedByScore = [...allPlacesResults]
                .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0));

              // 2. Balance de subcategorías MANTENIENDO la calidad: tomar mejores de cada tipo de todo el pool
              const chiringuitos = sortedByScore.filter((r: any) => r.gfMedSubcat === 'chiringuito');
              const restaurants  = sortedByScore.filter((r: any) => r.gfMedSubcat !== 'chiringuito');

              // Split slots: prefer 5 best chiringuitos + 7 best restaurants
              const targetTotal = numRequested * 2;
              const targetChiring = 5;
              const targetRest = 7;

              const selectedChiring = chiringuitos.slice(0, targetChiring);
              const selectedRest = restaurants.slice(0, targetRest);

              let finalSelection = [...selectedChiring, ...selectedRest];

              // Si falta de alguna de las categorías, rellenamos con la otra para alcanzar el target
              if (finalSelection.length < Math.min(targetTotal, sortedByScore.length)) {
                if (selectedChiring.length < chiringuitos.length && finalSelection.length < targetTotal) {
                  const remainingChiring = chiringuitos.slice(targetChiring);
                  const needed = targetTotal - finalSelection.length;
                  finalSelection.push(...remainingChiring.slice(0, needed));
                }
                if (selectedRest.length < restaurants.length && finalSelection.length < targetTotal) {
                  const remainingRest = restaurants.slice(targetRest);
                  const needed = targetTotal - finalSelection.length;
                  finalSelection.push(...remainingRest.slice(0, needed));
                }
              }

              // Re-order by technical merit (Score descending)
              preSelected = finalSelection.sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0));

              logger.debug(`[MEDITERRANEO_BALANCE] ${selectedChiring.length} chiringuito + ${selectedRest.length} restaurant (filled to ${preSelected.length}) → candidates (sorted by Score)`);

            } else if (selectedCat === 'tapas') {
              // Prioritise tapas specialists (taberna, bodega, chiringuito, etc.)
              // but include high-quality generic bars too — "Bar Pepe" can be the best
              // tapas bar in town. Strategy: fill first half with specialists, rest with top IGM.
              const specialists = allPlacesResults.filter((r: any) => r.gfTapasSpecialist);
              const generics    = allPlacesResults.filter((r: any) => !r.gfTapasSpecialist);
              const specialistSlots = Math.min(specialists.length, Math.ceil(numRequested * 0.6));
              const genericSlots    = (numRequested * 2) - specialistSlots;
              preSelected = [
                ...specialists.slice(0, specialistSlots),
                ...generics.slice(0, genericSlots),
              ];
              logger.debug(`[TAPAS_BALANCE] ${specialistSlots} specialist + ${Math.min(generics.length, genericSlots)} generic → ${preSelected.length} candidates`);

            } else if (selectedCat === 'italiano') {
              // Split into pizza specialists and full Italian restaurants
              const pizzas   = allPlacesResults.filter((r: any) => r.gfItalianoSubcat === 'pizza');
              const italians = allPlacesResults.filter((r: any) => r.gfItalianoSubcat !== 'pizza');
              const slotsEach = Math.ceil(numRequested * 0.6); // up to 60% from each pool
              const topPizzas   = pizzas.slice(0, slotsEach);
              const topItalians = italians.slice(0, slotsEach);
              // Interleave: pizza, italian, pizza, italian...
              const interleaved: any[] = [];
              const maxLen = Math.max(topPizzas.length, topItalians.length);
              for (let i = 0; i < maxLen; i++) {
                if (i < topPizzas.length)   interleaved.push(topPizzas[i]);
                if (i < topItalians.length) interleaved.push(topItalians[i]);
              }
              preSelected = interleaved.slice(0, numRequested * 2);
              logger.debug(`[ITALIANO_BALANCE] ${topPizzas.length} pizza + ${topItalians.length} italian → ${preSelected.length} candidates`);
            } else {
              preSelected = allPlacesResults.slice(0, numRequested * 2);
            }

            logger.debug(`[GEMINI_SENDS:${selectedCat}] ${preSelected.map((r: any) => `"${r.name}"(Score=${scoreSimple(r, r.realDistanceMeters, selectedCat).toFixed(2)})`).join(', ')}`);
            return preSelected.map((r: any) =>
                `- ${r.name} (${r.vicinity ?? r.formatted_address ?? ''}) | Rating: ${r.rating ?? 'N/A'} | ${r.realDistance ?? 'desconocida'} | ID: ${r.place_id} | Tipos: ${(r.types || []).slice(0, 3).join(',')}`
            ).join('\n');
        })();

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

      // Variety hints for specific categories only
      const VARIETY_HINTS: Record<string, string> = {
        italiano:     'Máximo 3 pizzerías; incluye también restaurantes italianos de cocina variada (pasta, carnes, mariscos).',
        hamburguesas: 'Variedad de estilos: smash burgers, artesanas, diferentes propuestas.',
        asiatico:     'Variedad: sushi, cocina china, tailandesa o vietnamita si hay opciones.',
        mediterraneo: 'IMPORTANTÍSIMO: La lista ya está ordenada por calidad/confianza. MANTÉN EL ORDEN EXACTO. Incluye todos los del listado: chiringuitos restaurantes de pescado y cocina mediterránea. Ignora cualquier impulso de reordenar por nombre trendy o "Sea Club".',
      };
      const varietyHint = VARIETY_HINTS[selectedCat] ?? '';

      const singleCatBlock = !isTodos ? `
⚠️ Categoría: "${selectedCat}". Los candidatos del listado son los mejores pre-seleccionados para esta categoría.
${varietyHint ? `Variedad: ${varietyHint}` : ''}
⛔ PROHIBIDO inventar o añadir sitios que no estén en el listado. Si está vacío, devuelve {"recommendations":[]}.
` : '';

      const prompt = `Anfitrión experto en ${property.city}. Guía de "${property.name}".

LUGARES GOOGLE PLACES:
${placesContext || `Sin datos de Google Places. Devuelve {"recommendations":[]}.`}

${todosBlock}${singleCatBlock}

REGLAS CRÍTICAS:
1. OBLIGATORIO: Los sitios listados han sido PRE-SELECCIONADOS Y ORDENADOS POR CALIDAD/CONFIANZA. Debes incluir TODOS en el JSON **EN EL MISMO ORDEN EXACTO**. Tu única tarea es generar description, personal_note, best_time_slots, atmosphere y tags para cada uno. NO omitas, NO reordenes, NO sustituyas. Si una categoría no tiene lista o está vacía, omite esa categoría completamente.
2. REGLA DEL ID Y NOMBRE: COPIA el "ID" y el nombre EXACTAMENTE tal como aparecen en el listado de Google Places (incluyendo barrio o sufijo). NUNCA uses el nombre genérico de una cadena. Si el listado de una categoría está VACÍO o marcado como "Sin resultados", OMITE esa categoría completamente — NO inventes sitios de tu conocimiento general.
3. PROHIBIDO: Inventar IDs. Prohibido añadir "(Inventado)" al nombre. Prohibido reordenar por criterios como "nombre trendy" o "parece más moderno".
4. PROHIBIDO usar la palabra "REALDISTANCE".
5. "METROS" significa < 2 min andando. "MIN" son minutos.
6. COMPLIANCE: NO generes ratings, niveles de precio ni horarios detallados. Ponlos como null.

JSON con array "recommendations", cada elemento:
{"name":"nombre real","description":"descripción hospitalaria max 150 chars. NUNCA menciones platos que no conozcas.","personal_note":"CONSEJO CORTITO (ej. 'Ideal para una cena tranquila', 'Perfecto para un café rápido'). PROHIBIDO inventar platos/bebidas.","distance":"X MIN o METROS o null","type":"slug de: ${ALL_SLUGS}","google_place_id":"ID de Google o null","rating":null,"price_level":null,"price_range":null,"best_time_slots":["mañana"|"mediodía"|"tarde"|"noche"|"madrugada"],"atmosphere":"vibe en 3-4 palabras","tags": SOLO 0-3 valores de: ["vistas al mar","vistas a la montaña","terraza","jardín","romántico","familiar","grupos","económico","premium","local auténtico","turístico","rápido","takeaway","reserva recomendada","abierto tarde","24h","parking","accesible","vista al atardecer","rooftop","interior acogedor","exterior"],"availability":null}
SOLO JSON:`;

      // ── Llamada a Gemini ───────────────────────────────────────────────
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: 'application/json' } });

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

        // Log tokens and cost
        after(logAiUsage({
            operation: 'dining',
            model: 'gemini-2.5-flash',
            usage: result?.response?.usageMetadata ? {
                prompt_tokens: result.response.usageMetadata.promptTokenCount,
                candidates_tokens: result.response.usageMetadata.candidatesTokenCount,
                total_tokens: result.response.usageMetadata.totalTokenCount
            } : undefined,
            propertyId,
            tenantId: tenant_id
        }));

        recommendations = parseRecs(result);
      } else {
        const result = await generateWithRetry(prompt);

        // Log tokens and cost
        after(logAiUsage({
            operation: 'dining',
            model: 'gemini-2.5-flash',
            usage: result?.response?.usageMetadata ? {
                prompt_tokens: result.response.usageMetadata.promptTokenCount,
                candidates_tokens: result.response.usageMetadata.candidatesTokenCount,
                total_tokens: result.response.usageMetadata.totalTokenCount
            } : undefined,
            propertyId,
            tenantId: tenant_id
        }));

        recommendations = parseRecs(result);
        logger.warn(`[AI-FILL:${selectedCat}] Gemini devolvió ${recommendations.length} recomendaciones (parseadas)`);

        // Type filter for specific categories only.
        // Generic categories (restaurantes, tapas, desayuno) don't filter — Gemini assigns
        // cuisine-specific subtypes (mexicano, asiatico) that are correct but not in validTypes.
        // Note: 'restaurantes' candidates are already filtered upstream by name keywords,
        // so cuisine leakage is prevented before Gemini even sees them.
        const GENERIC_CATS = new Set(['restaurantes', 'mediterraneo', 'tapas', 'desayuno', 'ocio_nocturno', 'ocio', 'supermercados', 'compras']);
        if (!GENERIC_CATS.has(selectedCat)) {
          const SPECIFIC_TYPE_ALIASES: Record<string, string[]> = {
            italiano:     ['italiano', 'italiana', 'italian', 'pizza', 'mediterráneo'],
            hamburguesas: ['hamburguesas', 'hamburguesa', 'burger'],
            asiatico:     ['asiatico', 'asiático', 'asian', 'sushi', 'japones'],
            alta_cocina:  ['alta_cocina', 'alta cocina', 'gourmet'],
            internacional:['internacional', 'international'],
            naturaleza:   ['naturaleza', 'nature', 'park', 'parque', 'tourist_attraction'],
            cultura:      ['cultura', 'culture', 'museum', 'monumento', 'tourist_attraction'],
          };
          const validTypes = new Set(SPECIFIC_TYPE_ALIASES[selectedCat] || [selectedCat]);
          recommendations = recommendations.filter(r => !r.type || validTypes.has(r.type.toLowerCase()));
        }

        // Normalize type to the selected category slug
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

      // ── Reject hallucinated places ─────────────────────────────────────
      // If Gemini received few candidates it sometimes invents places from its training
      // knowledge (e.g. returning bars when asked for ocio because it "knows" the area).
      // Hard rule: any recommendation not verified against our Google Places results is dropped.
      // Exception: isTodos mode is more lenient because category leakage is rare there.
      if (!isTodos) {
        const beforeHallucFilter = recommendations.length;
        recommendations = recommendations.filter(r => r._verified);
        const dropped = beforeHallucFilter - recommendations.length;
        if (dropped > 0) logger.warn(`[AI-FILL] 🚫 Dropped ${dropped} hallucinated recommendation(s) not found in Places results: ${recommendations.length} quedan`);
      }

      logger.debug(`[AI-FILL] ✅ Final recommendations ready (${recommendations.length}). First 2 distances:`, recommendations.slice(0, 2).map(r => r.distance));

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
      logger.warn(`[AI-FILL:${selectedCat}] Tras dedup: ${recommendations.length} recomendaciones finales`);

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
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig: { responseMimeType: 'application/json' } });
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

      // Log tokens and cost
      after(logAiUsage({
          operation: section === 'tech' ? 'tech_info' : 'faqs',
          model: 'gemini-2.5-flash',
          usage: result?.response?.usageMetadata ? {
              prompt_tokens: result.response.usageMetadata.promptTokenCount,
              candidates_tokens: result.response.usageMetadata.candidatesTokenCount,
              total_tokens: result.response.usageMetadata.totalTokenCount
          } : undefined,
          propertyId,
          tenantId: tenant_id
      }));

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
        const fetchWithTimeout = async (url: string, ms = 8000) => {
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), ms);
          try {
            const r = await fetch(url, { signal: ctrl.signal });
            return await r.json();
          } catch {
            return { status: 'TIMEOUT', results: [] };
          } finally {
            clearTimeout(timer);
          }
        };

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
          return fetchWithTimeout(url);
        });

        const searchResults = await Promise.all(searchPromises);
        // Analizamos hasta 10 candidatos para hospitales/salud, y 4 para el resto (incluyendo taxi)
        const candidates = searchResults.flatMap((r, idx) => (r.results || []).slice(0, idx < 2 ? 10 : 4));

        const enriched = await Promise.all(candidates.map(async (c: any) => {
          try {
            const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json` +
              `?place_id=${c.place_id}&fields=name,formatted_phone_number,vicinity,geometry,types&language=es&key=${placesKey}`;
            const dd = await fetchWithTimeout(detailsUrl, 6000);
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
          model: 'gemini-2.5-flash',
          generationConfig: { temperature: 0, responseMimeType: 'application/json' }
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

          // Log tokens and cost
          after(logAiUsage({
              operation: 'contacts',
              model: 'gemini-2.5-flash',
              usage: result?.response?.usageMetadata ? {
                  prompt_tokens: result.response.usageMetadata.promptTokenCount,
                  candidates_tokens: result.response.usageMetadata.candidatesTokenCount,
                  total_tokens: result.response.usageMetadata.totalTokenCount
              } : undefined,
              propertyId,
              tenantId: tenant_id
          }));

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
        } catch (err: any) {
          logger.error('[AI-API] Contacts AI error:', err.message);
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