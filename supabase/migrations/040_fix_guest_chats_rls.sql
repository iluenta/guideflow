-- Migration 040: Fix Guest Chats RLS for Analytics Dashboard (v2 - Corregida)
-- Resetea las políticas para asegurar que el dueño (tenant) pueda ver sus propios chats.

-- 1. Asegurar que RLS esté activado
ALTER TABLE public.guest_chats ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas (Limpieza profunda)
DROP POLICY IF EXISTS "Enable read/write for owners" ON public.guest_chats;
DROP POLICY IF EXISTS "Hosts can manage their own guest tokens" ON public.guest_chats;
DROP POLICY IF EXISTS "Hosts can view their own guest chats" ON public.guest_chats;
DROP POLICY IF EXISTS "Allow chat insertion" ON public.guest_chats;
DROP POLICY IF EXISTS "Allow chat updates for owners" ON public.guest_chats;

-- 3. Crear política robusta basada en tenant_id
-- Permite ver los chats si el tenant_id del chat coincide con el del perfil del usuario logueado
CREATE POLICY "Hosts can view their own guest chats"
ON public.guest_chats
FOR SELECT
TO authenticated
USING (
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
);

-- 4. Permitir inserción desde el servidor de IA (que usa sesión de usuario o anon)
CREATE POLICY "Allow chat insertion"
ON public.guest_chats
FOR INSERT
WITH CHECK (true);

-- 5. Permitir actualización si eres el dueño
CREATE POLICY "Allow chat updates for owners"
ON public.guest_chats
FOR UPDATE
USING (
    tenant_id IN (
        SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
);
