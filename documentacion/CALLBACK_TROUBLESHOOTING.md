# Troubleshooting: Callback de Autenticación

## Problema: Magic Link no funciona en producción

### Síntomas
- Al hacer clic en el magic link, redirige a `/auth/login` con error
- Los tokens aparecen en el hash (`#access_token=...`) pero no se procesan
- Error: "No se recibió código de autenticación"

### Soluciones

#### 1. Verificar configuración de Supabase

**En Supabase Dashboard > Authentication > URL Configuration:**

1. **Site URL**: Debe ser tu dominio de producción
   ```
   https://guideflowpro.vercel.app
   ```

2. **Redirect URLs**: Debe incluir tu callback URL
   ```
   https://guideflowpro.vercel.app/auth/callback
   http://localhost:3000/auth/callback (para desarrollo)
   ```

#### 2. Verificar variable de entorno

En tu `.env.local` (o variables de entorno de producción):

```env
NEXT_PUBLIC_SITE_URL=https://guideflowpro.vercel.app
```

**⚠️ IMPORTANTE**: Esta variable debe coincidir exactamente con tu dominio de producción.

#### 3. Verificar que el código esté desplegado

1. Verifica que los últimos cambios estén en producción:
   - `app/auth/login/page.tsx` - Debe tener lógica para detectar hash
   - `app/auth/callback/page.tsx` - Debe procesar tokens del hash
   - `app/api/auth/callback/route.ts` - Debe establecer la sesión

2. Verifica el deploy en Vercel:
   - Ve a tu dashboard de Vercel
   - Verifica que el último commit esté desplegado
   - Revisa los logs de build para errores

#### 4. Probar en modo desarrollo local

1. Asegúrate de que `NEXT_PUBLIC_SITE_URL=http://localhost:3000` en `.env.local`
2. Ejecuta `npm run dev`
3. Solicita un magic link
4. Verifica que redirija a `http://localhost:3000/auth/callback#access_token=...`

#### 5. Debugging en producción

Abre la consola del navegador (F12) y verifica:

1. **¿Se detecta el hash?**
   ```javascript
   console.log('Hash:', window.location.hash)
   ```

2. **¿Se hace la petición a `/api/auth/callback`?**
   - Ve a la pestaña "Network" en DevTools
   - Busca la petición POST a `/api/auth/callback`
   - Verifica el status code y la respuesta

3. **¿Se establecen las cookies?**
   - Ve a "Application" > "Cookies" en DevTools
   - Busca cookies de Supabase (deben tener `httpOnly: true`)

#### 6. Verificar logs del servidor

En Vercel Dashboard > Deployments > [Tu deploy] > Functions:

- Busca errores en `/api/auth/callback`
- Verifica que los tokens se reciban correctamente
- Revisa si hay errores de Supabase

### Flujo esperado

1. Usuario hace clic en magic link del email
2. Supabase redirige a: `https://guideflowpro.vercel.app/auth/callback#access_token=...&refresh_token=...`
3. `app/auth/callback/page.tsx` detecta los tokens en el hash
4. Envía POST a `/api/auth/callback` con los tokens
5. `app/api/auth/callback/route.ts` establece la sesión con `setSession()`
6. Las cookies HTTP-only se establecen automáticamente
7. Redirige a `/dashboard`

### Si sigue sin funcionar

1. **Verifica la configuración de Supabase Auth:**
   - Ve a Supabase Dashboard > Authentication > Settings
   - Verifica que "Enable email confirmations" esté activado
   - Verifica que "Enable email change confirmations" esté activado

2. **Verifica que el dominio esté permitido:**
   - En Supabase Dashboard > Authentication > URL Configuration
   - Asegúrate de que tu dominio de producción esté en la lista de "Redirect URLs"

3. **Prueba con el script de desarrollo:**
   ```bash
   npm run dev:admin admin@guideflow.com
   ```
   Esto genera un magic link sin enviar email, útil para testing.

4. **Contacta soporte:**
   - Si nada funciona, puede ser un problema con la configuración de Supabase
   - Verifica los logs de Supabase Dashboard > Logs > Auth Logs
