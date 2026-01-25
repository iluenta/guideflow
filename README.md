# GuideFlow

Plataforma SaaS multi-tenant para gestión de propiedades de alquiler vacacional.

> Test deploy automático - $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js 18+ 
- npm o pnpm
- Cuenta de Supabase
- Cuenta de Resend (para emails)

### Instalación

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase

# Ejecutar migraciones de base de datos
# Ver documentacion/supabase_setup.md

# Iniciar servidor de desarrollo
npm run dev
```

## 📁 Estructura del Proyecto

```
├── app/                    # Next.js App Router
│   ├── actions/           # Server Actions
│   ├── api/               # API Routes
│   ├── auth/              # Páginas de autenticación
│   └── dashboard/         # Dashboard de usuario
├── components/            # Componentes React
│   ├── auth/             # Componentes de autenticación
│   └── ui/               # Componentes UI (shadcn/ui)
├── hooks/                 # React Hooks personalizados
├── lib/                   # Utilidades y servicios
│   ├── supabase/        # Clientes de Supabase
│   └── services/        # Servicios de negocio
├── supabase/             # Migraciones de base de datos
│   └── migrations/     # Scripts SQL
├── documentacion/        # Documentación del proyecto
└── __tests__/           # Tests unitarios e integración
```

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env.local` con las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SUPPORT_EMAIL=soporte@hostguide.app
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key  # Solo para scripts de desarrollo
```

### Base de Datos

Las migraciones de Supabase están en `supabase/migrations/`. Ejecútalas en orden:

1. `001_auth_and_tenants.sql` - Autenticación y multi-tenancy
2. `002_fix_rls_recursion.sql` - Corrección de políticas RLS
3. `003_tenant_security_policies.sql` - Políticas de seguridad

Ver `documentacion/SUPABASE_SETUP.md` para más detalles.

## 📚 Documentación

- [Configuración de Supabase](documentacion/SUPABASE_SETUP.md)
- [Configuración de Resend](documentacion/RESEND_SETUP.md)
- [Solución de Problemas](documentacion/TROUBLESHOOTING.md)
- [Expiración de JWT](documentacion/JWT_EXPIRATION.md)

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Tests unitarios
npm run test:unit

# Tests de integración
npm run test:integration

# Modo watch
npm run test:watch
```

## 🏗️ Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run start` - Servidor de producción
- `npm run lint` - Linter de código
- `npm run dev:admin` - Generar magic link para desarrollo (sin enviar email)
- `npm run dev:admin:create` - Crear usuario de desarrollo

### Scripts de Desarrollo

Para evitar rate limits de email en desarrollo, puedes usar estos scripts:

```bash
# Generar magic link sin enviar email (requiere SUPABASE_SERVICE_ROLE_KEY)
npm run dev:admin

# Con email personalizado
npm run dev:admin mi-email@ejemplo.com

# Crear usuario de desarrollo primero
npm run dev:admin:create

# Con email y password personalizados
npm run dev:admin:create mi-email@ejemplo.com MiPassword123!
```

**Nota**: Necesitas agregar `SUPABASE_SERVICE_ROLE_KEY` a tu `.env.local`. Puedes obtenerla en:
Supabase Dashboard > Settings > API > service_role (secret)

## 🔒 Seguridad

- Autenticación con Magic Links (Supabase Auth)
- Cookies HTTP-only para sesiones
- Row Level Security (RLS) en Supabase
- Re-autenticación para acciones sensibles
- Timer de inactividad configurable

## 📝 Licencia

Privado - Todos los derechos reservados
