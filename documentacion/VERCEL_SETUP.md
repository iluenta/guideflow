# Configuración de Vercel para Deploy Automático

## ✅ Archivos de Configuración

- `vercel.json` - Configuración de Vercel (ya creado)

## 🔧 Pasos para Activar Deploy Automático

### 1. Conectar Repositorio en Vercel Dashboard

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto `guideflowpro`
3. Ve a **Settings** > **Git**
4. Verifica que el repositorio esté conectado:
   - **Repository**: `iluenta/guideflow`
   - **Production Branch**: `main`
   - **Deploy Hooks**: Debe estar activado

### 2. Verificar Webhooks de GitHub

1. Ve a tu repositorio en GitHub: `https://github.com/iluenta/guideflow`
2. Ve a **Settings** > **Webhooks**
3. Debe haber un webhook de Vercel que se active en cada push

### 3. Verificar Variables de Entorno

En Vercel Dashboard > Settings > Environment Variables, asegúrate de tener:

```
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
NEXT_PUBLIC_SITE_URL=https://guideflowpro.vercel.app
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key (solo si usas scripts)
SUPPORT_EMAIL=soporte@hostguide.app
```

### 4. Activar Deploy Automático

1. En Vercel Dashboard > Settings > Git
2. Asegúrate de que **"Automatically deploy commits"** esté activado
3. Verifica que **"Production Branch"** sea `main`

### 5. Probar el Deploy

1. Haz un cambio pequeño (ej: agregar un comentario)
2. Haz commit y push:
   ```bash
   git add .
   git commit -m "test: verificar deploy automático"
   git push
   ```
3. Ve a Vercel Dashboard > Deployments
4. Deberías ver un nuevo deployment iniciándose automáticamente

## 🐛 Troubleshooting

### Si no se despliega automáticamente:

1. **Verifica la conexión del repositorio:**
   - Vercel Dashboard > Settings > Git
   - Si no está conectado, haz clic en "Connect Git Repository"

2. **Verifica los webhooks:**
   - GitHub > Settings > Webhooks
   - Debe haber un webhook de Vercel activo

3. **Verifica los permisos:**
   - Asegúrate de que Vercel tenga acceso al repositorio
   - GitHub > Settings > Applications > Authorized OAuth Apps > Vercel

4. **Reconecta el repositorio:**
   - Vercel Dashboard > Settings > Git > Disconnect
   - Luego vuelve a conectar

5. **Verifica el branch:**
   - Asegúrate de que estés haciendo push a `main`
   - Verifica que `main` sea el branch de producción en Vercel

## 📝 Notas

- El archivo `vercel.json` ya está configurado
- Vercel detecta automáticamente Next.js y usa `npm run build`
- Los deploys se activan en cada push a `main`
- Los preview deployments se crean para pull requests
