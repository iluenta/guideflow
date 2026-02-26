-- Migración 022: Restricción Única para Property Context
-- Esta restricción es NECESARIA para que el 'upsert' funcione correctamente

-- 1. Limpiar duplicados existentes (mantiene solo el más reciente)
DELETE FROM public.property_context
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY property_id, category
                   ORDER BY updated_at DESC, created_at DESC
               ) as row_num
        FROM public.property_context
    ) t
    WHERE t.row_num > 1
);

-- 2. Añadir la restricción
ALTER TABLE public.property_context 
ADD CONSTRAINT property_context_property_id_category_key UNIQUE(property_id, category);
