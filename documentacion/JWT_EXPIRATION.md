# Configuración de Caducidad de Tokens JWT - Supabase

## Valores por Defecto de Supabase

### Access Token (JWT)
- **Caducidad**: **1 hora** (3600 segundos)
- **Uso**: Se incluye en cada petición a la API
- **Renovación**: Automática antes de expirar

### Refresh Token
- **Caducidad**: **30 días** (por defecto, configurable)
- **Uso**: Para renovar el access token cuando expira
- **Almacenamiento**: En cookies HTTP-only (seguro)

## ¿Cuándo se pedirá al usuario que inicie sesión de nuevo?

El usuario **NO** necesitará iniciar sesión de nuevo en estos casos:

1. ✅ **Uso activo**: Si el usuario usa la aplicación regularmente, el token se renueva automáticamente
2. ✅ **Sesión activa**: Mientras el refresh token sea válido (30 días), la sesión se mantiene
3. ✅ **Renovación automática**: Supabase renueva el access token automáticamente antes de que expire

El usuario **SÍ** necesitará iniciar sesión de nuevo en estos casos:

1. ❌ **Refresh token expirado**: Después de 30 días sin usar la aplicación
2. ❌ **Cierre de sesión manual**: Cuando el usuario hace clic en "Cerrar sesión"
3. ❌ **Token revocado**: Si se revoca manualmente desde el dashboard de Supabase
4. ❌ **Cambio de contraseña**: Si el usuario cambia su contraseña (si aplica)

## Configuración Personalizada

Puedes cambiar estos valores en Supabase:

1. Ve a **Authentication > Settings**
2. Busca **JWT expiry** y **Refresh token expiry**
3. Ajusta según tus necesidades

### Valores Recomendados

- **JWT expiry**: 1 hora (3600s) - Seguro y balanceado
- **Refresh token expiry**: 7-30 días - Depende de tus requisitos de seguridad

## Cómo Funciona la Renovación Automática

1. El cliente de Supabase detecta cuando el access token está cerca de expirar
2. Automáticamente usa el refresh token para obtener un nuevo access token
3. El proceso es transparente para el usuario
4. No se requiere ninguna acción del usuario

## Manejo de Errores de Expiración

El código actual maneja automáticamente:
- Renovación de tokens expirados
- Redirección a login cuando el refresh token expira
- Manejo de errores de autenticación

Si necesitas personalizar el comportamiento, puedes escuchar el evento `SIGNED_OUT` en `onAuthStateChange`.
