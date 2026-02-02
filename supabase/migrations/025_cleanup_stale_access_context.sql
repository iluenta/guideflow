-- Migración para limpiar contextos de acceso contaminados con datos de ejemplo (Las Rozas)
-- Elimina las claves 'location', 'airport_access', 'train_station_access' y 'public_transport'
-- que fueron generadas durante el desarrollo y pruebas de la nueva arquitectura.

UPDATE property_context
SET content = content - 'location' - 'airport_access' - 'train_station_access' - 'public_transport' - 'formattedAddress' - 'postalCode' - 'countryCode'
WHERE category = 'access';

-- También saneamos latitude/longitude si existen como lat/lng duplicados para evitar confusión
UPDATE property_context
SET content = CASE 
    WHEN content ? 'latitude' AND content ? 'lat' THEN content - 'lat'
    ELSE content
END,
updated_at = NOW()
WHERE category = 'access';

UPDATE property_context
SET content = CASE 
    WHEN content ? 'longitude' AND content ? 'lng' THEN content - 'lng'
    ELSE content
END,
updated_at = NOW()
WHERE category = 'access';
