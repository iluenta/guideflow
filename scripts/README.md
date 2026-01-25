# Scripts de Desarrollo

Esta carpeta contiene scripts útiles para desarrollo que evitan el uso de rate limits de email.

## 📋 Scripts Disponibles

### `dev-admin-login.js`

Genera un magic link sin enviar email, perfecto para desarrollo.

**Uso:**
```bash
npm run dev:admin
# O con email personalizado:
npm run dev:admin mi-email@ejemplo.com
```

**Qué hace:**
1. Usa la API Admin de Supabase para generar un magic link directamente
2. Extrae el `token_hash` del link generado
3. Construye una URL de callback directa que puedes usar en el navegador
4. Intenta abrir el navegador automáticamente (o muestra la URL para copiar)

**Requisitos:**
- `NEXT_PUBLIC_SUPABASE_URL` en `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`

**Ejemplo de salida:**
```
🔄 Generando magic link sin enviar email...
📧 Email: admin@guideflow.com
🔗 Redirect: http://localhost:3000/auth/callback

✅ MAGIC LINK GENERADO
═══════════════════════════════════════
📧 Email: admin@guideflow.com
🔗 URL: http://localhost:3000/auth/callback?token_hash=xxx&type=magiclink
═══════════════════════════════════════
```

### `create-dev-admin.js`

Crea un usuario de desarrollo con email confirmado automáticamente.

**Uso:**
```bash
npm run dev:admin:create
# O con email y password personalizados:
npm run dev:admin:create mi-email@ejemplo.com MiPassword123!
```

**Qué hace:**
1. Verifica si el usuario ya existe
2. Si existe, actualiza la contraseña y metadata
3. Si no existe, crea un nuevo usuario con `email_confirm: true`
4. Muestra las credenciales para uso posterior

**Requisitos:**
- `NEXT_PUBLIC_SUPABASE_URL` en `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`

## 🔧 Configuración

### Variables de Entorno Requeridas

Asegúrate de tener estas variables en tu `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Obtener SUPABASE_SERVICE_ROLE_KEY

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Settings > API
3. Busca "service_role" key (secret)
4. **⚠️ IMPORTANTE**: Esta clave nunca debe estar en el frontend o en commits públicos

## 💡 Flujo de Trabajo Recomendado

1. **Iniciar el servidor de desarrollo** (en una terminal):
   ```bash
   npm run dev
   ```

2. **Primera vez** (en otra terminal):
   ```bash
   # Crear usuario de desarrollo (usa admin@guideflow.com por defecto)
   npm run dev:admin:create
   
   # O con email personalizado:
   npm run dev:admin:create admin@guideflow.com
   ```

3. **Cada vez que necesites login** (en otra terminal):
   ```bash
   # Generar magic link (sin enviar email, usa admin@guideflow.com por defecto)
   npm run dev:admin
   
   # O con email personalizado:
   npm run dev:admin admin@guideflow.com
   ```

4. El script abrirá automáticamente el navegador con el link, o puedes copiarlo manualmente.

**⚠️ IMPORTANTE**: El servidor de desarrollo (`npm run dev`) debe estar corriendo antes de usar el magic link generado.

## 🐛 Solución de Problemas

### Error: "Faltan variables de entorno"
- Verifica que `.env.local` existe y tiene las variables correctas
- Asegúrate de que `SUPABASE_SERVICE_ROLE_KEY` está configurada

### Error: "Token hash no válido"
- El script intentará un método alternativo automáticamente
- Si persiste, verifica que el usuario existe y tiene email confirmado

### Error: "Usuario ya existe"
- Esto es normal, el script actualizará la contraseña automáticamente
- Puedes usar el magic link generado normalmente

## 🔒 Seguridad

- Estos scripts solo deben usarse en desarrollo
- Nunca commits `SUPABASE_SERVICE_ROLE_KEY` en el repositorio
- La `SUPABASE_SERVICE_ROLE_KEY` tiene acceso completo a tu base de datos
- Úsala solo en entornos locales seguros
