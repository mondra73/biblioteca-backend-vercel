# Migración Render → Vercel — Biblioteca Multimedia

## Estructura del backend serverless

```
backend-vercel/
├── api/
│   ├── auth/
│   │   └── [...path].js       ← todas las rutas /api/auth/*
│   └── admin/
│       ├── index.js            ← GET /api/admin (ruta protegida)
│       ├── estadisticas.js     ← estadísticas generales y por usuario
│       ├── movimiento.js       ← POST /api/admin/movimiento
│       └── user/
│           ├── libros.js       ← CRUD libros
│           ├── series.js       ← CRUD series
│           ├── peliculas.js    ← CRUD películas
│           └── pendientes.js   ← CRUD pendientes
├── lib/
│   ├── db.js                   ← singleton MongoDB
│   ├── verifyToken.js          ← middleware JWT adaptado a serverless
│   └── cors.js                 ← helper CORS (⚠️ actualizar origins)
├── models/
│   └── User.js                 ← todos los modelos con patrón singleton
├── email-template/             ← copiar desde el repo original
│   ├── bienvenido.js
│   ├── contacto-admin.js
│   ├── contacto-usuario.js
│   ├── recuperar-password.js
│   └── registro-exitoso.js
├── routes/
│   └── mails.js               ← copiar desde el repo original
├── passport.js                ← copiar desde el repo original (si usás OAuth redirect)
├── package.json
└── vercel.json
```

---

## Paso 1 — Preparar el repo del backend

1. Crear repo nuevo en GitHub (ej: `bibliotecamultimedia-backend-vercel`)
2. Copiar todos los archivos de esta carpeta
3. Copiar manualmente desde el repo original:
   - `email-template/` (todos los archivos)
   - `routes/mails.js` → renombrar a `lib/mailer.js` (ver nota abajo)
   - `passport.js` (si usás el flujo OAuth redirect)
4. Verificar que `lib/mailer.js` exporte correctamente la función `enviarEmail`
5. `npm install`

---

## Paso 2 — Variables de entorno en Vercel (backend)

En el dashboard de Vercel → Settings → Environment Variables, agregar:

| Variable | Valor |
|---|---|
| `MONGODB_URI` | tu URI de MongoDB Atlas |
| `TOKEN_SECRET` | tu secret JWT |
| `REFRESH_SECRET` | tu refresh secret |
| `FIREBASE_CONFIG_BASE64` | config de Firebase en base64 |
| `GOOGLE_CLIENT_ID` | client ID de Google OAuth |
| `GOOGLE_CALLBACK_URL` | `https://tu-backend.vercel.app/api/auth/google/callback` |
| `FRONTEND_URL` | `https://tu-frontend.vercel.app` (o tu dominio) |
| `URLUSER` | igual que FRONTEND_URL |

---

## Paso 3 — Actualizar CORS

En `lib/cors.js`, actualizar el array `allowedOrigins` con las URLs reales:

```js
const allowedOrigins = [
  'http://localhost:5173',
  'https://tu-frontend.vercel.app',   // ← URL de Vercel
  'https://tudominio.com.ar',          // ← sin www
  'https://www.tudominio.com.ar',      // ← con www (¡ambas!)
]
```

---

## Paso 4 — Deploy del backend

1. Conectar el repo en vercel.com → Add New Project
2. Framework Preset: **Other**
3. Build Command: dejar vacío
4. Output Directory: dejar vacío
5. Cargar las variables de entorno
6. Deploy

Probar: `https://tu-backend.vercel.app/api/auth/ping` → debe devolver `{"mensaje":"ok"}`

---

## Paso 5 — Preparar el repo del frontend

1. Crear repo nuevo en GitHub (ej: `bibliotecamultimedia-frontend-vercel`)
2. Copiar todo el proyecto frontend original
3. Reemplazar `src/api.js` con el archivo `api.js.frontend` de esta entrega
4. Crear `vercel.json` en la raíz con el contenido de `vercel.json.frontend`:
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```

---

## Paso 6 — Variables de entorno en Vercel (frontend)

| Variable | Valor |
|---|---|
| `VITE_API_BASE` | `https://tu-backend.vercel.app` |

---

## Paso 7 — Deploy del frontend

1. Conectar repo en Vercel
2. Framework Preset: **Vite**
3. Cargar variables de entorno
4. Deploy

---

## Cambios de rutas — referencia rápida

Las rutas con parámetros en path se convirtieron a query params:

| Ruta original | Nueva ruta |
|---|---|
| `GET /admin/estadisticas-libros/:id` | `GET /admin/estadisticas-libros?id=:id` |
| `GET /admin/estadisticas-peliculas/:id` | `GET /admin/estadisticas-peliculas?id=:id` |
| `GET /admin/estadisticas-series/:id` | `GET /admin/estadisticas-series?id=:id` |
| `GET /admin/user/libro/:libroId` | `GET /admin/user/libro?id=:libroId` |
| `GET /admin/user/serie/:serieId` | `GET /admin/user/serie?id=:serieId` |
| `GET /admin/user/pelicula/:peliculaId` | `GET /admin/user/pelicula?id=:peliculaId` |
| `GET /admin/user/pendiente/:pendienteId` | `GET /admin/user/pendiente?id=:pendienteId` |
| `DELETE /admin/user/libro/:id` | `DELETE /admin/user/libro?id=:id` |
| `PUT /admin/user/libro/:id` | `PUT /admin/user/libro?id=:id` |
| (igual para serie, pelicula, pendiente) | |
| `GET /admin/user/libro/buscar/:texto` | `GET /admin/user/libro/buscar?texto=:texto` |
| (igual para serie, pelicula, pendiente) | |

El `api.js` del frontend traduce todo esto automáticamente.

---

## ⚠️ Cosas importantes a recordar

- CORS: agregar SIEMPRE con y sin www
- El proxy de Cloudflare debe estar en **gris** (desactivado) para los registros DNS de Vercel
- En MongoDB Atlas, agregar `0.0.0.0/0` en Network Access (Vercel usa IPs dinámicas)
- El modelo `User.js` usa patrón singleton — no modificar la línea `mongoose.models.User || ...`
