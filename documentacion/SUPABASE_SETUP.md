# Configuración de Supabase - HostGuide

## Pasos para configurar Supabase

### 1. Crear proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com) y crea una cuenta o inicia sesión
2. Crea un nuevo proyecto
3. Espera a que el proyecto esté completamente inicializado

### 2. Configurar Magic Link

1. En el Dashboard de Supabase, ve a **Authentication > Providers**
2. Selecciona **Email**
3. Configura:
   - ✅ **Enable email confirmations**: Activado
   - ❌ **Enable email signup**: Desactivado (solo magic link)
   - ✅ **Secure email change**: Activado (recomendado)

### 2.1 Configurar Refresh Token Expiry (CRÍTICO)

1. En el Dashboard de Supabase, ve a **Authentication > Settings**
2. Busca la sección **JWT Settings**
3. Configura **Refresh Token Expiry** a **7 días** (604800 segundos)
   - Esto endurece la seguridad reduciendo el tiempo de validez del refresh token
   - Complementa el timer de inactividad de 24h implementado en la aplicación

### 3. Configurar Redirect URLs

1. Ve a **Authentication > URL Configuration**
2. Agrega las siguientes URLs en **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (desarrollo)
   - `https://tu-dominio.com/auth/callback` (producción)

### 4. Obtener credenciales

1. Ve a **Settings > API**
2. Copia los siguientes valores:
   - **Project URL** (ej: `https://xxxxx.supabase.co`)
   - **anon public** key

### 5. Configurar variables de entorno

1. Copia el archivo `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edita `.env.local` y reemplaza los valores:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
   ```

### 6. Ejecutar migraciones SQL

Tienes dos opciones:

#### Opción A: Usando el Dashboard de Supabase

1. Ve a **SQL Editor** en el Dashboard
2. Crea una nueva query
3. Ejecuta las migraciones en orden:
   - Copia y pega el contenido de `supabase/migrations/001_auth_and_tenants.sql`
   - Ejecuta la query
   - Copia y pega el contenido de `supabase/migrations/002_fix_rls_recursion.sql`
   - Ejecuta la query
   - Copia y pega el contenido de `supabase/migrations/003_tenant_security_policies.sql`
   - Ejecuta la query

#### Opción B: Usando Supabase CLI

```bash
# Instalar Supabase CLI (si no lo tienes)
npm install -g supabase

# Iniciar sesión
supabase login

# Vincular proyecto
supabase link --project-ref tu-project-ref

# Ejecutar todas las migraciones
supabase db push
```

### 7. Verificar la configuración

1. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Ve a `http://localhost:3000/auth/signup`
3. Intenta registrarte con un email
4. Verifica que recibes el magic link en tu correo
5. Haz clic en el enlace y verifica que te redirige al dashboard

## Estructura de la base de datos

Después de ejecutar las migraciones, tendrás:

- **tenants**: Tabla de organizaciones (una por usuario registrado)
- **profiles**: Tabla de perfiles de usuario (extiende auth.users)
- **tenant_security_policies**: Tabla de políticas de seguridad por tenant
- Funciones automáticas para crear tenant al registrar usuario
- Políticas RLS para aislamiento multi-tenant
- Funciones helper para obtener políticas de seguridad del tenant

## Notas importantes

- Cada usuario que se registre obtendrá automáticamente un `tenant_id` único
- Los usuarios por defecto tienen `role: 'user'` y `package_level: 'basic'`
- Los administradores tienen `role: 'admin'` y `package_level: null`
- El `tenant_id` y `role` se incluyen automáticamente en el JWT del usuario
- Cada tenant tiene políticas de seguridad configurables (timeout de inactividad, re-autenticación, etc.)
- Las políticas de seguridad se crean automáticamente al crear un nuevo tenant

## Mejoras de Seguridad Implementadas

### Cookies HTTP-Only
- Los tokens de autenticación se almacenan en cookies HTTP-only (no accesibles desde JavaScript)
- Protección contra ataques XSS
- Cookies con flags `secure` y `sameSite: 'lax'` en producción

### Timer de Inactividad
- Sesión se cierra automáticamente después de 24 horas de inactividad
- Timer se resetea con cualquier interacción del usuario (clicks, teclas, scroll)

### Re-autenticación para Acciones Sensibles
- Acciones críticas requieren código de 6 dígitos por email
- Código válido por 10 minutos
- Token temporal válido por 5 minutos para ejecutar la acción

### Políticas de Seguridad por Tenant
- Cada organización puede configurar sus propias políticas de seguridad
- Timeout de inactividad configurable
- Requisito de re-autenticación configurable
- Límite de sesiones concurrentes (futuro)