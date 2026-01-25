# Guía de Solución de Problemas - HostGuide

## Problema: Rate Limit de Supabase (Error 429)

### Síntomas
- Error: `email rate limit exceeded` o `over_email_send_rate_limit`
- No puedes crear cuenta ni iniciar sesión
- El error persiste después de esperar varios minutos

### Causa
Supabase tiene límites estrictos en el plan gratuito:
- **1 email por minuto** por dirección de correo
- **Límites diarios** que pueden bloquear durante horas
- **Límites por IP** si haces muchos intentos

### Soluciones Inmediatas

#### 1. Esperar (Solución Temporal)
- Espera **30-60 minutos** antes de intentar de nuevo
- El bloqueo puede ser diario, no solo por minuto

#### 2. Usar Otro Email
- Prueba con una dirección de correo diferente
- Esto te permite continuar desarrollando mientras esperas

#### 3. Verificar en Supabase Dashboard
1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **Authentication > Settings**
3. Revisa los límites de rate limit configurados
4. En proyectos gratuitos, los límites son muy restrictivos

### Solución Permanente: Configurar SMTP Externo

**RECOMENDADO para desarrollo y producción**

#### Opción A: Usar Resend (Gratis hasta 3,000 emails/mes)

1. Crea una cuenta en [Resend](https://resend.com)
2. Obtén tu API Key
3. En Supabase Dashboard:
   - Ve a **Settings > Auth > SMTP Settings**
   - Configura:
     - **SMTP Host**: `smtp.resend.com`
     - **SMTP Port**: `465` (SSL) o `587` (TLS)
     - **SMTP User**: `resend`
     - **SMTP Password**: Tu API Key de Resend
     - **Sender Email**: Tu email verificado en Resend
     - **Sender Name**: HostGuide (o el nombre que prefieras)
4. Guarda los cambios

#### Opción B: Usar SendGrid

1. Crea una cuenta en [SendGrid](https://sendgrid.com)
2. Crea un API Key
3. En Supabase Dashboard, configura SMTP con las credenciales de SendGrid

#### Opción C: Usar Mailgun

1. Crea una cuenta en [Mailgun](https://mailgun.com)
2. Configura SMTP en Supabase con las credenciales de Mailgun

### Verificar que Funciona

Después de configurar SMTP externo:

1. Reinicia tu servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Intenta crear una cuenta nueva
3. Verifica que recibes el email (revisa spam si no llega)
4. Haz clic en el magic link y verifica que te redirige al dashboard

## Problema: Error al Enviar Email de Confirmación (Error 500)

### Síntomas
- Error: `Error sending confirmation email`
- Código: `500` o `unexpected_failure`
- El email no se envía después de configurar SMTP externo (Resend, SendGrid, etc.)

### Causa
Problema con la configuración de SMTP en Supabase. Posibles causas:
- Email del remitente no verificado en Resend
- API Key incorrecto o expirado
- Puerto incorrecto (debe ser 465 para SSL o 587 para TLS)
- Configuración de seguridad incorrecta

### Solución: Verificar Configuración de Resend

#### Paso 1: Verificar Email en Resend

1. Ve a tu cuenta de [Resend](https://resend.com)
2. Ve a **Domains** o **Emails**
3. Asegúrate de que el email que usas como "Sender Email" esté verificado
4. Si no está verificado:
   - Agrega el dominio o email
   - Verifica siguiendo las instrucciones de Resend

#### Paso 2: Verificar API Key de Resend

1. En Resend Dashboard, ve a **API Keys**
2. Asegúrate de que el API Key esté activo
3. Copia el API Key completo (debe empezar con `re_`)
4. **IMPORTANTE**: Usa el API Key completo, no solo una parte

#### Paso 3: Verificar Configuración en Supabase

1. Ve a **Supabase Dashboard > Settings > Auth > SMTP Settings**
2. Verifica que la configuración sea exactamente así:

   **Para Resend:**
   - **Enable Custom SMTP**: ✅ Activado
   - **SMTP Host**: `smtp.resend.com`
   - **SMTP Port**: `465` (para SSL) **O** `587` (para TLS)
   - **SMTP User**: `resend`
   - **SMTP Password**: Tu API Key completo de Resend (debe empezar con `re_`)
   - **SMTP Sender Email**: El email verificado en Resend (ej: `noreply@tudominio.com`)
   - **SMTP Sender Name**: HostGuide (o el nombre que prefieras)

3. **IMPORTANTE**: 
   - Si usas puerto **465**, asegúrate de que **SSL** esté activado
   - Si usas puerto **587**, asegúrate de que **TLS** esté activado
   - El email del remitente DEBE estar verificado en Resend

#### Paso 4: Probar la Configuración

1. Guarda los cambios en Supabase
2. Espera 1-2 minutos para que los cambios se apliquen
3. Intenta crear una cuenta nueva
4. Revisa los logs en Resend Dashboard > Logs para ver si hay errores

#### Paso 5: Verificar Logs

Si sigue fallando:

1. **En Resend Dashboard**:
   - Ve a **Logs**
   - Busca intentos de envío fallidos
   - Revisa el mensaje de error específico

2. **En Supabase Dashboard**:
   - Ve a **Logs > Auth Logs**
   - Busca errores relacionados con SMTP

3. **En la consola del servidor Next.js**:
   - Revisa los logs detallados que se imprimen cuando hay un error
   - Busca el código de error específico

### Solución Alternativa: Usar SendGrid

Si Resend no funciona, prueba con SendGrid:

1. Crea cuenta en [SendGrid](https://sendgrid.com)
2. Crea un API Key con permisos de "Mail Send"
3. En Supabase, configura:
   - **SMTP Host**: `smtp.sendgrid.net`
   - **SMTP Port**: `587` (TLS)
   - **SMTP User**: `apikey`
   - **SMTP Password**: Tu API Key de SendGrid
   - **Sender Email**: Tu email verificado en SendGrid

## Problema: Magic Link Expirado o Inválido

### Síntomas
- Error: "El enlace ha expirado o es inválido"
- El magic link no funciona al hacer clic

### Soluciones

1. **Solicita un nuevo magic link** (espera 1-2 minutos entre intentos)
2. **Verifica la URL de callback** en Supabase Dashboard:
   - Ve a **Authentication > URL Configuration**
   - Asegúrate de que `http://localhost:3000/auth/callback` esté en la lista
3. **Verifica la variable de entorno** `NEXT_PUBLIC_SITE_URL` en tu `.env.local`

## Problema: Error en el Callback

### Síntomas
- Error 500 en `/auth/callback`
- Redirección a login con error

### Soluciones

1. **Verifica las cookies HTTP-only**:
   - Abre DevTools > Application > Cookies
   - Deberías ver cookies de Supabase con `httpOnly: true`

2. **Verifica el código en la URL**:
   - El callback debe tener `?code=...` en la URL
   - Si no hay código, el magic link no se generó correctamente

3. **Revisa los logs del servidor**:
   - Busca errores en la consola del servidor Next.js
   - Los errores de Supabase aparecerán ahí

## Problema: Usuario No Autenticado en Dashboard

### Síntomas
- Redirección automática a `/auth/login` desde dashboard
- Error: "Auth session missing"

### Soluciones

1. **Verifica que las cookies se están enviando**:
   - En DevTools > Network, revisa las requests a `/api/auth/session`
   - Deberían incluir cookies en los headers

2. **Verifica el proxy**:
   - El proxy debe refrescar la sesión en cada request
   - Revisa `proxy.ts` para asegurarte de que está configurado correctamente

3. **Limpia las cookies y vuelve a iniciar sesión**:
   - Elimina todas las cookies del sitio
   - Solicita un nuevo magic link
   - Inicia sesión de nuevo

## Verificación del Código

El código está correctamente construido. Los problemas comunes son:

1. **Rate limit de Supabase** (más común) → Solución: SMTP externo
2. **Configuración incorrecta en Supabase Dashboard** → Verifica URLs y settings
3. **Variables de entorno faltantes** → Verifica `.env.local`

## Próximos Pasos

1. **Para desarrollo inmediato**: Configura SMTP externo (Resend es la opción más rápida)
2. **Para producción**: Usa un servicio SMTP profesional (SendGrid, Mailgun, etc.)
3. **Para testing**: Considera usar emails de prueba o deshabilitar verificación en desarrollo (solo para testing)

## Contacto

Si después de seguir esta guía el problema persiste:
1. Revisa los logs del servidor para errores específicos
2. Verifica la configuración en Supabase Dashboard
3. Asegúrate de que todas las variables de entorno estén configuradas
