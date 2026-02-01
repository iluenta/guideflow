-- Migración 023: Corrección de Políticas RLS Inseguras
-- Basado en recomendación de seguridad de Supabase (Evitar referenciar user_metadata directamente)

-- 1. Corregir política en guest_access_tokens
-- Primero eliminamos la política antigua (usamos el nombre exacto del reporte)
DROP POLICY IF EXISTS "Hosts can manage their own guest tokens" ON public.guest_access_tokens;

-- Creamos la versión segura usando la función public.tenant_id()
-- Esta función ya está definida en 001_auth_and_tenants y consulta la tabla profiles
CREATE POLICY "Hosts can manage their own guest tokens" ON public.guest_access_tokens
    FOR ALL
    TO authenticated
    USING (tenant_id = public.tenant_id())
    WITH CHECK (tenant_id = public.tenant_id());


-- 2. Corregir política en storage.objects (Bucket property-images)
-- La política original en 004_properties_and_storage también usaba user_metadata
DROP POLICY IF EXISTS "Tenant Image Management" ON storage.objects;

CREATE POLICY "Tenant Image Management" ON storage.objects
    FOR ALL
    TO authenticated
    USING (
        bucket_id = 'property-images' AND 
        (storage.foldername(name))[1] = public.tenant_id()::TEXT
    )
    WITH CHECK (
        bucket_id = 'property-images' AND 
        (storage.foldername(name))[1] = public.tenant_id()::TEXT
    );

-- Nota: Hemos convertido public.tenant_id() a TEXT para que coincida con el nombre de la carpeta en storage.
