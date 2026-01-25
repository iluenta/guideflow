# Guía de Configuración de Resend con Supabase

## Problema: Error 500 "Error sending confirmation email"

Este error indica que Supabase no puede enviar emails a través de Resend. Sigue estos pasos para resolverlo.

## ⚡ Configuración Rápida (Sin Dominio - Solo Desarrollo)

**Si NO tienes un dominio propio**, puedes usar el email de prueba de Resend:

### Configuración en Supabase Dashboard > Settings > Auth > SMTP Settings:

```
✅ Enable Custom SMTP: ACTIVADO

SMTP Host: smtp.resend.com
SMTP Port: 465
SMTP User: resend
SMTP Password: [Tu API Key de Resend - empieza con re_]
SMTP Sender Email: onboarding@resend.dev  ← EMAIL DE PRUEBA (no requiere verificación)
SMTP Sender Name: HostGuide
```

**Pasos rápidos:**
1. Obtén tu API Key de Resend (Dashboard > API Keys)
2. Configura SMTP en Supabase con los valores de arriba
3. Usa `onboarding@resend.dev` como remitente
4. **¡Listo!** No necesitas verificar ningún dominio

**Nota**: Este email solo funciona para desarrollo. Para producción necesitarás verificar tu dominio.

## Paso 1: Verificar Email en Resend

### 1.1 Si NO tienes un dominio propio (Desarrollo)

**✅ SOLUCIÓN RÁPIDA: Usar email de prueba de Resend**

Resend permite usar un email de prueba sin verificar dominio:

1. **No necesitas verificar ningún dominio**
2. **Usa este email como remitente**: `onboarding@resend.dev`
3. Este email funciona automáticamente sin configuración adicional
4. **LIMITACIONES**: 
   - Solo para desarrollo/testing
   - Los emails pueden llegar a spam
   - No recomendado para producción

**Configuración en Supabase:**
```
SMTP Sender Email: onboarding@resend.dev
```

### 1.2 Si tienes un dominio (Producción)

**Opción A: Verificar un dominio (Recomendado para producción)**
1. En Resend, ve a **Domains**
2. Haz clic en **Add Domain**
3. Ingresa tu dominio (ej: `tudominio.com`)
4. Agrega los registros DNS que Resend te proporciona
5. Espera a que se verifique (puede tardar unos minutos)
6. Usa cualquier email de tu dominio como remitente (ej: `noreply@tudominio.com`)

**Opción B: Verificar un email específico**
1. En Resend, ve a **Emails**
2. Agrega y verifica tu email personal
3. Usa ese email como remitente

## Paso 2: Obtener API Key de Resend

1. En Resend Dashboard, ve a **API Keys**
2. Haz clic en **Create API Key**
3. Dale un nombre (ej: "Supabase SMTP")
4. Selecciona los permisos necesarios (generalmente "Sending access")
5. Copia el API Key completo
   - Debe empezar con `re_`
   - Ejemplo: `re_1234567890abcdefghijklmnopqrstuvwxyz`
6. **IMPORTANTE**: Guárdalo en un lugar seguro, solo se muestra una vez

## Paso 3: Configurar SMTP en Supabase

### 3.1 Acceder a la Configuración

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **Settings** (icono de engranaje en el menú lateral)
4. En el menú izquierdo, busca **Auth**
5. Expande **Auth** y haz clic en **SMTP Settings**

### 3.2 Configuración Exacta para Resend

Activa y configura los siguientes campos:

```
✅ Enable Custom SMTP: ACTIVADO

SMTP Host: smtp.resend.com
SMTP Port: 465
SMTP User: resend
SMTP Password: [Pega aquí tu API Key completo de Resend]
SMTP Sender Email: [Tu email verificado en Resend]
SMTP Sender Name: HostGuide
```

### 3.3 Configuración Alternativa (Puerto 587)

Si el puerto 465 no funciona, prueba con:

```
SMTP Host: smtp.resend.com
SMTP Port: 587
SMTP User: resend
SMTP Password: [Tu API Key completo de Resend]
SMTP Sender Email: [Tu email verificado en Resend]
SMTP Sender Name: HostGuide
```

**IMPORTANTE**: 
- Si usas puerto **465**, asegúrate de que **SSL** esté activado
- Si usas puerto **587**, asegúrate de que **TLS** esté activado
- El campo "SMTP Password" debe contener tu API Key completo, no una contraseña

## Paso 4: Verificar la Configuración

### 4.1 Checklist de Verificación

Antes de probar, verifica:

- [ ] El email del remitente está verificado en Resend
- [ ] El API Key está completo y correcto (empieza con `re_`)
- [ ] El puerto es 465 (SSL) o 587 (TLS)
- [ ] El campo "SMTP User" es exactamente `resend` (en minúsculas)
- [ ] El campo "SMTP Password" contiene el API Key completo
- [ ] Has guardado los cambios en Supabase

### 4.2 Probar la Configuración

1. **Guarda los cambios** en Supabase
2. **Espera 1-2 minutos** para que los cambios se apliquen
3. Intenta crear una cuenta nueva en tu aplicación
4. Revisa tu bandeja de entrada (y spam) para el magic link

## Paso 5: Diagnosticar Problemas

### 5.1 Revisar Logs en Resend

1. Ve a Resend Dashboard > **Logs**
2. Busca intentos de envío recientes
3. Si hay errores, verás el mensaje específico:
   - **"Invalid API key"**: El API Key es incorrecto
   - **"Unauthorized"**: El API Key no tiene permisos
   - **"Domain not verified"**: El dominio/email no está verificado
   - **"Rate limit exceeded"**: Has excedido el límite de emails

### 5.2 Revisar Logs en Supabase

1. Ve a Supabase Dashboard > **Logs** > **Auth Logs**
2. Busca errores relacionados con SMTP
3. Los errores te darán más detalles sobre qué está fallando

### 5.3 Errores Comunes y Soluciones

#### Error: "Invalid API key"
- **Solución**: Verifica que el API Key esté completo y correcto
- Copia el API Key nuevamente desde Resend Dashboard
- Asegúrate de que no haya espacios antes o después

#### Error: "Domain not verified"
- **Solución**: Verifica el email/dominio en Resend
- Asegúrate de que el email del remitente esté verificado
- Si usas un dominio, verifica que los registros DNS estén correctos

#### Error: "Connection timeout"
- **Solución**: Verifica el puerto y la configuración SSL/TLS
- Prueba cambiar de puerto 465 a 587 (o viceversa)
- Asegúrate de que SSL/TLS esté activado según el puerto

#### Error: "Authentication failed"
- **Solución**: Verifica que "SMTP User" sea exactamente `resend`
- Verifica que el API Key esté en el campo "SMTP Password"
- Asegúrate de que el API Key tenga permisos de envío

## Paso 6: Configuración Rápida para Desarrollo (Sin Dominio)

Si estás en desarrollo y **NO tienes un dominio propio**, usa esta configuración:

### Configuración Completa para Desarrollo:

En **Supabase Dashboard > Settings > Auth > SMTP Settings**:

```
✅ Enable Custom SMTP: ACTIVADO

SMTP Host: smtp.resend.com
SMTP Port: 465
SMTP User: resend
SMTP Password: [Tu API Key completo de Resend]
SMTP Sender Email: onboarding@resend.dev  ← ESTE ES EL EMAIL DE PRUEBA
SMTP Sender Name: HostGuide
```

**IMPORTANTE**: 
- ✅ No necesitas verificar ningún dominio
- ✅ Funciona inmediatamente con solo el API Key
- ⚠️ Solo para desarrollo/testing
- ⚠️ Los emails pueden llegar a spam
- ⚠️ Para producción, necesitarás verificar tu dominio

## Paso 7: Alternativas si Resend No Funciona

### Opción A: SendGrid

1. Crea cuenta en [SendGrid](https://sendgrid.com)
2. Crea un API Key con permisos de "Mail Send"
3. En Supabase, configura:
   ```
   SMTP Host: smtp.sendgrid.net
   SMTP Port: 587
   SMTP User: apikey
   SMTP Password: [Tu API Key de SendGrid]
   SMTP Sender Email: [Email verificado en SendGrid]
   ```

### Opción B: Mailgun

1. Crea cuenta en [Mailgun](https://mailgun.com)
2. Verifica tu dominio
3. En Supabase, configura con las credenciales SMTP de Mailgun

## Verificación Final

Una vez configurado correctamente:

1. ✅ Deberías poder crear cuentas sin errores
2. ✅ Deberías recibir los magic links en tu email
3. ✅ Los emails deberían aparecer en los logs de Resend como "Delivered"

## Contacto

Si después de seguir esta guía el problema persiste:

1. Revisa los logs específicos en Resend y Supabase
2. Verifica que todos los pasos se hayan seguido correctamente
3. Contacta a soporte@hostguide.app con:
   - El mensaje de error exacto
   - Capturas de pantalla de la configuración (sin mostrar el API Key completo)
   - Los logs de Resend y Supabase
