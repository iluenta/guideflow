# Solución de Problemas: Error 500 con Resend Configurado

## Tu Configuración Actual (Correcta)

Según la captura de pantalla, tu configuración es:
- ✅ Enable custom SMTP: Activado
- ✅ Sender email: `onboarding@resend.dev`
- ✅ Sender name: `resend`
- ✅ Host: `smtp.resend.com`
- ✅ Port: `465`
- ✅ Username: `resend`
- ✅ Password: [Configurado]

## Problemas Comunes y Soluciones

### Problema 1: API Key Incorrecto o Incompleto

**Síntomas:**
- Error 500 "Error sending confirmation email"
- La configuración parece correcta pero no funciona

**Solución:**
1. Ve a [Resend Dashboard > API Keys](https://resend.com/api-keys)
2. Verifica que el API Key esté activo
3. **Crea un nuevo API Key** (por si el anterior está corrupto)
4. Copia el API Key completo (debe empezar con `re_` y tener ~40 caracteres)
5. En Supabase, **reemplaza completamente** el password con el nuevo API Key
6. Asegúrate de que no haya espacios antes o después del API Key
7. Guarda los cambios
8. Espera 2-3 minutos y prueba de nuevo

### Problema 2: Permisos del API Key

**Solución:**
1. En Resend Dashboard > API Keys
2. Verifica que el API Key tenga permisos de **"Sending access"** o **"Full access"**
3. Si no tiene permisos, crea uno nuevo con los permisos correctos

### Problema 3: Problema con Puerto 465 (SSL)

**Solución: Prueba con Puerto 587 (TLS)**

1. En Supabase Dashboard > Settings > Auth > SMTP Settings
2. Cambia el **Port number** de `465` a `587`
3. **IMPORTANTE**: Asegúrate de que **TLS** esté activado (no SSL)
4. Guarda los cambios
5. Espera 2-3 minutos y prueba de nuevo

**Configuración alternativa:**
```
Port number: 587
(Con TLS activado, no SSL)
```

### Problema 4: Verificar Logs de Resend

**Pasos para diagnosticar:**

1. Ve a [Resend Dashboard > Logs](https://resend.com/logs)
2. Busca intentos de envío recientes
3. Si hay errores, verás el mensaje específico:
   - **"Invalid API key"** → El API Key es incorrecto
   - **"Unauthorized"** → El API Key no tiene permisos
   - **"Rate limit exceeded"** → Has excedido el límite
   - **"Connection timeout"** → Problema de conexión (prueba puerto 587)

### Problema 5: Verificar Logs de Supabase

1. Ve a Supabase Dashboard > **Logs** > **Auth Logs**
2. Busca errores relacionados con SMTP
3. Los errores te darán más detalles sobre qué está fallando

## Checklist de Verificación Rápida

Antes de probar de nuevo, verifica:

- [ ] El API Key está completo (empieza con `re_` y tiene ~40 caracteres)
- [ ] El API Key tiene permisos de "Sending access"
- [ ] No hay espacios antes o después del API Key en el campo Password
- [ ] Has guardado los cambios en Supabase
- [ ] Has esperado 2-3 minutos después de guardar
- [ ] Has revisado los logs de Resend para ver errores específicos

## Solución Paso a Paso Recomendada

### Paso 1: Verificar/Crear API Key Nuevo

1. Ve a Resend Dashboard > API Keys
2. Si ya tienes uno, verifica que esté activo
3. Si no estás seguro, **crea uno nuevo**:
   - Nombre: "Supabase SMTP"
   - Permisos: "Sending access" o "Full access"
   - Copia el API Key completo

### Paso 2: Actualizar Configuración en Supabase

1. Ve a Supabase Dashboard > Settings > Auth > SMTP Settings
2. En el campo **Password**, **elimina todo** y pega el nuevo API Key
3. Asegúrate de que no haya espacios
4. Guarda los cambios

### Paso 3: Probar con Puerto 587

Si sigue fallando con puerto 465:

1. Cambia **Port number** a `587`
2. Asegúrate de que **TLS** esté activado (no SSL)
3. Guarda los cambios
4. Espera 2-3 minutos
5. Prueba de nuevo

### Paso 4: Verificar Logs

1. Intenta crear una cuenta
2. Inmediatamente ve a Resend Dashboard > Logs
3. Busca el intento de envío
4. Revisa el mensaje de error específico

## Si Nada Funciona

### Opción A: Verificar que Resend Esté Funcionando

1. Ve a Resend Dashboard > **Test Email**
2. Envía un email de prueba directamente desde Resend
3. Si funciona, el problema está en la configuración de Supabase
4. Si no funciona, el problema está en tu cuenta de Resend

### Opción B: Usar SendGrid como Alternativa

Si Resend no funciona, prueba con SendGrid:

1. Crea cuenta en [SendGrid](https://sendgrid.com)
2. Crea un API Key con permisos de "Mail Send"
3. En Supabase, configura:
   ```
   SMTP Host: smtp.sendgrid.net
   SMTP Port: 587
   SMTP User: apikey
   SMTP Password: [Tu API Key de SendGrid]
   SMTP Sender Email: [Email verificado en SendGrid o usa el de prueba]
   ```

## Contacto

Si después de seguir todos estos pasos el problema persiste:

1. Revisa los logs específicos de Resend y Supabase
2. Toma capturas de pantalla de:
   - La configuración de SMTP (sin mostrar el API Key completo)
   - Los logs de Resend
   - Los logs de Supabase
3. Contacta a soporte@hostguide.app con esta información
