# Vivo Academy

Academia interna de Vivo: cursos con lecciones de texto, video, PDF y quizzes; rutas de aprendizaje por cargo; gamificación (XP, niveles, racha diaria, insignias, ranking y certificados verificables) y aula en vivo con video, chat, mano levantada, encuestas, quiz estilo Kahoot y pizarra compartida.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui
- Auth.js v5 con Google Workspace (solo el dominio `ALLOWED_EMAIL_DOMAIN`)
- Neon Postgres + Drizzle ORM
- Vercel Blob (videos, PDF, imágenes)
- LiveKit (open source) para el aula en vivo; Excalidraw para la pizarra
- `@react-pdf/renderer` para certificados

## Puesta en marcha

```bash
pnpm install
cp .env.example .env.local   # o `vercel env pull .env.local`
pnpm db:push                 # crea las tablas en Neon
pnpm db:seed                 # insignias, 2 cursos demo y 1 ruta
pnpm dev
```

### Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | La crea la integración de Neon en Vercel |
| `BLOB_READ_WRITE_TOKEN` | Lo crea el store de Vercel Blob |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Credenciales OAuth de Google (ver abajo) |
| `ALLOWED_EMAIL_DOMAIN` | Dominio permitido, p. ej. `govivo.co` |
| `LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | Credenciales de LiveKit Cloud o de tu servidor propio |
| `NEXT_PUBLIC_LIVEKIT_URL` | Igual a `LIVEKIT_URL` (wss://…) |
| `NEXT_PUBLIC_APP_NAME` | Nombre visible, p. ej. `Vivo Academy` |
| `NEXT_PUBLIC_APP_URL` | URL pública (para el botón de LinkedIn en certificados) |

### Google OAuth (una sola vez)

1. Entra a [console.cloud.google.com](https://console.cloud.google.com) → APIs y servicios → Pantalla de consentimiento → tipo **Interno** (solo tu Workspace).
2. Credenciales → Crear credenciales → **ID de cliente de OAuth** → Aplicación web.
3. Orígenes autorizados: `http://localhost:3000` y `https://<tu-dominio>`.
4. URIs de redirección: `http://localhost:3000/api/auth/callback/google` y `https://<tu-dominio>/api/auth/callback/google`.
5. Copia el ID y el secreto en `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET`.

La **primera persona** que inicie sesión queda como administradora automáticamente.

### LiveKit (aula en vivo)

1. Crea un proyecto gratis en [cloud.livekit.io](https://cloud.livekit.io) (5,000 minutos/mes).
2. Copia la URL `wss://…`, la API key y el secret a las variables de entorno.
3. Opcional: en Settings → Webhooks agrega `https://<tu-dominio>/api/livekit/webhook` para registrar salidas y grabaciones.

Cuando el uso gratuito no alcance, instala el servidor open source en un VPS (`docker run livekit/livekit-server`) y cambia solo las variables; el código es el mismo.

## Marca

La fuente de verdad es el **Vivo Design System**, no el PDF del manual:
<https://github.com/fjimenez9169/vivo-design-system> (`tokens/colors.json`,
`tokens/typography.json`, `brand/logo/`). El PDF es para humanos; los tokens son
para código. Antes de tocar color, tipografía o logo, mira el repo.

| Token | Hex | Rol |
|---|---|---|
| Navy | `#011640` | Texto principal, fondos oscuros, headers |
| Green | `#04D98B` | CTAs, highlights, elementos interactivos |
| Yellow | `#F2E205` | Énfasis puntual (nunca fondo de texto largo) |
| White | `#FFFFFF` | Fondos limpios, texto sobre superficies oscuras |

Reglas de proporción, acordadas con marca:

- **En modo claro el color dominante es el gris neutro** (`--gray-*` en
  `src/app/globals.css`), no el azul. El azul cansa la vista cuando se usa como
  fondo general; ahí es un ancla, no un tono de fondo.
- **En modo oscuro las superficies son navy** (`--navy-*`), no un negro neutro:
  el Design System le asigna al navy los *dark backgrounds*. La regla del gris
  dominante aplica solo a la interfaz clara.
- El **verde es el color de acción**: `--primary`, estado activo de navegación,
  CTAs. Todo estado "activo/seleccionado" de la app es verde.
- El **navy** vive en el texto, en el sidebar y en los héroes (portada de curso,
  panel de login). Son momentos clave, no superficies repetidas.
- El **amarillo** es apenas acento (racha, lección actual). Casi no se nota.
- Tipografía: se cargan las **variables** de `Nunito` y `Nunito Sans` (un archivo
  por familia, no cortes estáticos). La jerarquía sale de `tokens/typography.json`:

  | Nivel | Rol | Familia y peso | En código |
  |---|---|---|---|
  | level-01 | Titular / display | Nunito Bold | `font-heading font-bold` |
  | level-02 | Texto de apoyo | Nunito Sans SemiBold | `font-semibold` |
  | level-03 | Cuerpo | Nunito Sans Regular | por defecto |
  | level-04 | Etiqueta | Nunito Sans Bold | `font-sans font-bold` |

  Nunito es la familia de **display**: titulares y cifras grandes. Las etiquetas
  pequeñas (badges, chips, uppercase de 10-12px) van en Nunito Sans. No usar
  ExtraBold (800) ni Black (900): el peso máximo de la jerarquía es Bold (700).
- Logos en `public/brand/` (artwork oficial). El favicon (`public/favicon.svg`,
  `public/favicon.png`, `public/apple-icon.png`) se genera del isotipo oficial —
  **nunca redibujar el logo a mano en SVG**.
- **Clear space**: el manual mide la separación en unidades `x`, donde `x` es el
  diámetro del contraforma de la "o" del logotipo. Medido sobre el artwork,
  `x ≈ 0.27 × la altura del logotipo`. En un lockup va **1x — línea divisoria —
  1x** (ver `AcademyBrand` en `src/components/brand/logo.tsx`). Nada debe entrar
  en esa caja.

## Roles

- **admin**: todo, incluida la gestión de usuarios.
- **instructor**: crea cursos, rutas y clases en vivo; ve reportes.
- **colaborador**: aprende.

Cambia roles y cargos en `/admin/usuarios`. Las rutas con un cargo se asignan solas a quien tenga ese cargo.

## Gamificación

XP por lección (+10), quiz aprobado (+25, +15 si 100 %), curso completado (+100), asistir a clase en vivo (+30), responder encuesta/quiz en vivo (+5), ganar el quiz en vivo (+20). Los niveles siguen la curva `100 · (nivel − 1)^1.5`. La racha cuenta días consecutivos con actividad (zona horaria `America/Bogota`). Las insignias se evalúan tras cada evento de XP en `src/lib/gamification.ts`.

## Scripts

- `pnpm dev` / `pnpm build` / `pnpm start`
- `pnpm typecheck` / `pnpm lint`
- `pnpm db:push` / `pnpm db:studio` / `pnpm db:seed`
- `pnpm tsx scripts/dev-session.ts correo@govivo.co admin` → crea una sesión local de prueba sin Google (solo desarrollo)

## Despliegue

El proyecto está vinculado a Vercel (`academia`). `vercel --prod` despliega a producción. Recuerda agregar las variables de Google y LiveKit en Vercel → Settings → Environment Variables.
