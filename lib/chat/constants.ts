// ─── lib/chat/constants.ts ───────────────────────────────────────────────────
// Constantes de módulo: se inicializan una vez al arrancar el servidor.
// Las regex con flag `g` se exponen como factory functions para evitar el bug
// de `lastIndex` compartido entre requests concurrentes.

export const COMMON_BRANDS = [
    'TEKA', 'BALAY', 'BOSCH', 'SIEMENS', 'NEFF', 'BSH', 'SAMSUNG', 'LG',
    'BEKO', 'WHIRLPOOL', 'CANDY', 'INDESIT', 'HOTPOINT', 'ZANUSSI', 'AEG',
    'ELECTROLUX', 'MIELE', 'LIEBHERR', 'FAGOR', 'EDESA', 'HAIER', 'HISENSE',
    'SHARP', 'PANASONIC', 'PHILIPS', 'ICECOOL',
] as const;

/** Devuelve una nueva instancia de la regex en cada llamada (flag g es stateful) */
export const createBrandRegex = () =>
    new RegExp(`\\b(${COMMON_BRANDS.join('|')})\\b`, 'gi');

/** Captura modelos tipo "WTE 7611 BWR", "EW7F4483", "NA-148XB3", "UE43TU7125K", "UE55AU8000" */
export const createModelNumberRegex = () =>
    /\b[A-Z]{2,6}[-\s]?\d{3,6}[-\s]?[A-Z0-9]{0,5}\b|\b[A-Z]{1,4}\d{1,4}[A-Z]{1,6}\d{2,6}[A-Z0-9]{0,4}\b/g;

// ─── Expansión de query RAG por intent ───────────────────────────────────────

export const FOOD_EXPANSION_MAP: Record<string, string[]> = {
    desayuno: ['desayuno', 'café', 'cafetería', 'brunch', 'tostadas', 'panadería'],
    almuerzo: ['comida', 'almuerzo', 'menú del día', 'mediodía'],
    cena: ['cena', 'cenar', 'noche', 'restaurante'],
    tapas: ['tapas', 'pinchos', 'vinos', 'aperitivo', 'bar'],
    cafe: ['café', 'cafetería', 'cortado', 'espresso'],
    italiano: ['pizza', 'pasta', 'italiano', 'risotto'],
    mediterraneo: ['mediterráneo', 'mariscos', 'pescado', 'griega'],
    hamburguesas: ['hamburguesa', 'burger', 'americano'],
    asiatico: ['asiático', 'japonés', 'chino', 'sushi', 'ramen', 'thai', 'wok'],
    alta_cocina: ['alta cocina', 'gourmet', 'fine dining', 'estrella'],
    internacional: ['internacional', 'fusión', 'variado'],
    general: ['restaurante', 'comer', 'cenar', 'tapas', 'menú', 'cocina'],
};

export const APPLIANCE_PROBLEM_HINTS: Record<string, string[]> = {
    lavadora: ['lavadora', 'ruido', 'vibración', 'tambor', 'centrifugado', 'fuga', 'error', 'avería', 'no arranca', 'no lava', 'goteo'],
    lavavajillas: ['lavavajillas', 'ruido', 'no limpia', 'error', 'avería', 'fuga', 'goteo', 'no arranca'],
    horno: ['horno', 'temperatura', 'no calienta', 'error', 'avería', 'no enciende', 'humo'],
    microondas: ['microondas', 'no calienta', 'error', 'avería', 'ruido', 'chispas'],
    cafetera: ['cafetera', 'no hace café', 'error', 'avería', 'goteo', 'no arranca', 'presión'],
    aire: ['aire acondicionado', 'no enfría', 'no calienta', 'ruido', 'goteo', 'error', 'avería'],
    frigorifico: ['frigorífico', 'nevera', 'no enfría', 'ruido', 'goteo', 'hielo', 'temperatura', 'error'],
    calentador: ['calentador', 'agua fría', 'no calienta', 'goteo', 'presión', 'error', 'avería'],
    tv: ['televisor', 'TV', 'no enciende', 'sin imagen', 'sin sonido', 'error', 'reinicio'],
};

export const APPLIANCE_HINTS: Record<string, string[]> = {
    tv: ['televisor', 'TV', 'tele', 'pantalla', 'mando', 'canales', 'streaming', 'netflix', 'disney', 'prime', 'youtube', 'hdmi', 'apps', 'aplicaciones'],
    lavadora: ['lavadora', 'lavar', 'centrifugar', 'ciclo', 'programa', 'tambor', 'centrifugado'],
    lavavajillas: ['lavavajillas', 'fregar', 'vajilla', 'programa', 'pastilla', 'detergente'],
    horno: ['horno', 'temperatura', 'cocinar', 'precalentar', 'bandeja', 'pizza', 'pirólisis', 'grill'],
    microondas: ['microondas', 'calentar', 'descongelar', 'potencia', 'segundos', 'plato giratorio'],
    cafetera: ['cafetera', 'café', 'espresso', 'cápsula', 'depósito', 'vapor', 'molinillo'],
    calentador: ['calentador', 'agua caliente', 'boiler', 'termo', 'temperatura', 'presión'],
    aire: ['aire acondicionado', 'climatizador', 'frío', 'calor', 'temperatura', 'mando', 'ventilador'],
    hervidor: ['hervidor', 'hervir', 'agua', 'temperatura', 'ebullición'],
    frigorifico: ['frigorífico', 'nevera', 'congelador', 'temperatura', 'frío'],
};

export const FOOD_TO_APPLIANCE: Record<string, string> = {
    'pizza': 'horno',
    'pasta': 'horno vitrocerámica cocina',
    'cafe': 'cafetera',
    'café': 'cafetera',
    'tostada': 'tostadora',
    'arroz': 'vitrocerámica microondas cocina',
    'huevo': 'vitrocerámica cocina sartén',
    'carne': 'horno cocina vitrocerámica',
    'pescado': 'horno cocina vitrocerámica',
};

// ─── Categorías de recomendaciones ───────────────────────────────────────────

export const ALL_FOOD_TYPES = [
    'restaurant', 'restaurante', 'restaurantes', 'food', 'comida',
    'italiano', 'italiana', 'italian',
    'mediterraneo', 'mediterráneo', 'mediterranean',
    'hamburguesas', 'hamburguesa', 'burger',
    'asiatico', 'asiático', 'asian', 'chino', 'japonés',
    'alta_cocina', 'alta cocina', 'gourmet',
    'internacional', 'international',
    'desayuno', 'cafe',
    'tapas', 'taberna', 'tapas_bar', 'bar_restaurante',
] as const;

/** Nombre legible de cada categoría para mostrar al huésped */
export const CATEGORY_LABEL_NAMES: Record<string, string> = {
    'restaurant': 'Restaurantes', 'restaurante': 'Restaurantes', 'restaurantes': 'Restaurantes',
    'food': 'Restaurantes', 'comida': 'Restaurantes',
    'italiano': 'Italiana', 'italiana': 'Italiana', 'italian': 'Italiana',
    'mediterraneo': 'Mediterránea', 'mediterráneo': 'Mediterránea', 'mediterranean': 'Mediterránea',
    'hamburguesas': 'Hamburguesas', 'hamburguesa': 'Hamburguesas', 'burger': 'Hamburguesas',
    'asiatico': 'Asiática', 'asiático': 'Asiática', 'asian': 'Asiática', 'chino': 'Asiática', 'japonés': 'Asiática',
    'alta_cocina': 'Alta cocina', 'alta cocina': 'Alta cocina', 'gourmet': 'Alta cocina',
    'internacional': 'Internacional', 'international': 'Internacional',
    'desayuno': 'Desayunos', 'cafe': 'Cafeterías',
    'tapas': 'Tapas', 'taberna': 'Tapas', 'tapas_bar': 'Tapas', 'bar_restaurante': 'Restaurantes',
};

/** Etiqueta para el bloque de contexto enviado a Gemini */
export const CATEGORY_LABEL_MAP: Record<string, string> = {
    'restaurant': 'RESTAURANTES_GENERALES', 'restaurante': 'RESTAURANTES_GENERALES', 'restaurantes': 'RESTAURANTES_GENERALES',
    'italiano': 'RESTAURANTES_ITALIANOS', 'mediterraneo': 'RESTAURANTES_MEDITERRANEOS',
    'hamburguesas': 'HAMBURGUESAS_Y_AMERICANO', 'asiatico': 'COCINA_ASIATICA',
    'alta_cocina': 'ALTA_COCINA', 'internacional': 'COCINA_INTERNACIONAL',
    'desayuno': 'CAFETERIAS_Y_DESAYUNOS', 'cafe': 'CAFETERIAS', 'tapas': 'TAPAS',
    'ocio': 'LUGARES_DE_OCIO', 'activity': 'LUGARES_DE_OCIO',
    'compras': 'TIENDAS_Y_COMPRAS', 'supermercados': 'SUPERMERCADOS',
    'shop': 'TIENDAS_Y_COMPRAS', 'service': 'SERVICIOS_LOCALES',
    'naturaleza': 'NATURALEZA_Y_PARQUES', 'cultura': 'CULTURA_Y_VISITAS', 'relax': 'RELAX_Y_BIENESTAR',
};
