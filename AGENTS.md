# GESTARIAN - Reglas y Convenciones del Repositorio

## 📌 Repositorio y Ramas
- **Repositorio Oficial**: `https://github.com/iclomsinks-a11y/GESTARIAN.git`
- **Rama Principal (Blindada)**: `main`
- **Rama AI Studio (Dev)**: `RAMA-AI-STUDIO`
- **Stack**: React + TypeScript + Vite + Tailwind CSS + Supabase + Express (server.ts)

## 🛡️ Blindaje de Egreso (Supabase Egress Shield)
1. **Compresión WebP en Cliente**:
   - Todas las imágenes subidas deben pasar obligatoriamente por `compressImage(...)` (`src/lib/compressImage.ts`) a formato WebP (máx. 1280px, <= 250 KB) antes de enviarse a la red.
2. **Almacenamiento en Supabase Storage**:
   - Bucket: `gestarian-files` (fallback a `public` si no existe).
   - Siempre especificar `cacheControl: '31536000'` (1 año de caché para evitar egreso en visitas repetidas).
   - Prohibido almacenar imágenes en Base64 en PostgreSQL. Solo guardar URLs públicas.
3. **Consultas `select(...)` Explícitas**:
   - En listados generales (`ClientesPage`, `PresupuestosPage`, `ExpedientesPage`), excluir columnas con arrays pesados de fotos. Solo pedir campos clave.
4. **Supabase Realtime con Debounce y Cleanup**:
   - Utilizar el hook centralizado `useRealtimeSubscription` (`src/hooks/useRealtimeSubscription.ts`) con debounce de 600ms y limpieza obligatoria en `unmount` para prevenir fugas de canales y ráfagas de egreso.

## 🎯 Pautas de Código y Respuestas
- Respetar siempre el blindaje de egreso y la arquitectura limpia.
- Respuestas concisas, directas y sin adornos comerciales ni funciones innecesarias.
- Indicar siempre los archivos modificados y los bloques de código exactos para facilitar la integración local.
