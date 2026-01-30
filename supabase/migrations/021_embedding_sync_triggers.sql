-- Migración 021: Sincronización de Embeddings (Legacy -> Fase 3)
-- Este trigger asegura que los manuales guardados en la tabla antigua (manual_embeddings)
-- se reflejen automáticamente en context_embeddings para que el chat pueda encontrarlos.

-- 1. Función de sincronización
CREATE OR REPLACE FUNCTION public.sync_manual_to_context()
RETURNS TRIGGER AS $$
DECLARE
    v_property_id UUID;
    v_tenant_id UUID;
    v_source_id UUID;
BEGIN
    -- Obtener property_id y tenant_id del manual original
    SELECT property_id, tenant_id INTO v_property_id, v_tenant_id
    FROM public.property_manuals
    WHERE id = NEW.manual_id;

    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO public.context_embeddings (
            property_id, 
            tenant_id, 
            source_type, 
            source_id, 
            content, 
            embedding, 
            metadata
        )
        VALUES (
            v_property_id,
            v_tenant_id,
            'manual',
            NEW.manual_id,
            NEW.content,
            NEW.embedding,
            jsonb_build_object('sync_at', NOW(), 'legacy_id', NEW.id)
        )
        ON CONFLICT (id) DO UPDATE SET
            content = EXCLUDED.content,
            embedding = EXCLUDED.embedding,
            metadata = context_embeddings.metadata || EXCLUDED.metadata;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM public.context_embeddings 
        WHERE source_id = OLD.manual_id AND source_type = 'manual';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger
DROP TRIGGER IF EXISTS tr_sync_manual_embeddings ON public.manual_embeddings;
CREATE TRIGGER tr_sync_manual_embeddings
AFTER INSERT OR UPDATE OR DELETE ON public.manual_embeddings
FOR EACH ROW EXECUTE FUNCTION public.sync_manual_to_context();

-- 3. Sincronización inicial (para datos existentes)
INSERT INTO public.context_embeddings (property_id, tenant_id, source_type, source_id, content, embedding, metadata)
SELECT 
    pm.property_id, 
    pm.tenant_id, 
    'manual', 
    me.manual_id, 
    me.content, 
    me.embedding, 
    jsonb_build_object('sync_at', NOW(), 'legacy_id', me.id)
FROM public.manual_embeddings me
JOIN public.property_manuals pm ON me.manual_id = pm.id
ON CONFLICT DO NOTHING;
