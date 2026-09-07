# InnoAsturias GovTech 2026

Landing del evento, promovido por Fundación NovaGob con el Principado de Asturias.
Stack: **Vite + React + Tailwind CSS v4**.

- Producción: <https://innoasturias.novagob.org> (dominio propio; el proyecto
  también responde en <https://innoasturias-govtech-2026.vercel.app>)
- Repositorio: <https://github.com/daviidcruz/innoasturias-govtech-2026>

Desplegado en Vercel, enlazado a este repositorio: cada push a `main` construye
y publica solo. Lleva **Vercel Analytics** (`@vercel/analytics`), visible en
el panel del proyecto → pestaña Analytics.

```bash
npm install
cp .env.example .env.local   # y rellena con las claves reales — ver más abajo
npm run dev      # http://localhost:5173
npm run build    # -> dist/
```

## Estructura

```
src/
  data/content.js              Todo el copy y los datos del evento
  data/radar.js                 Perfiles y áreas del Radar del ecosistema: la
                                 única fuente de verdad para textos y colores
  data/radarConclusiones.js     Conclusiones de /radar/resultados (se
                                 escriben a mano después del evento)
  components/Backdrop.jsx      El fondo: la imagen de Canva, fija tras todo el doc
  components/Nav.jsx           Menú flotante en píldora translúcida
  components/Hero.jsx          Portada
  components/Countdown.jsx     Cuenta atrás hasta el comienzo de la jornada
  components/Sections.jsx      Cuenta atrás, Encuentro, Jornada, Radar y Footer
  hooks/useInView.js           Revelados, el reloj del programa y el Radar
  hooks/useHashLanding.js      Salto al ancla al abrir un enlace con #seccion
  lib/supabase.js              Cliente de Supabase (clave pública, vía env)
  pages/Home.jsx               La landing de arriba, montada en "/"
  pages/radar/RadarForm.jsx        /radar — formulario de 4 pasos
  pages/radar/RadarPantalla.jsx    /radar/pantalla — grafo en vivo (Realtime)
  pages/radar/RadarResultados.jsx  /radar/resultados — versión congelada
  pages/radar/RadarGraph.jsx       El grafo SVG, compartido por las dos de arriba
  pages/radar/graphLayout.js       Cómo se calcula la posición de cada nodo
  pages/radar/radarStats.js        Contador de respuestas y entidades distintas
public/brand/                  Logos y fondo extraídos del diseño de Canva
supabase/migrations/           El SQL de la tabla del Radar, para pegar en Supabase
_fuente/                       Material original: Canva y documentación de licitación
```

## Cómo está construida

Una sola idea: **el fondo no se mueve y el contenido flota sobre él**. `Backdrop`
fija la imagen de Canva detrás de todo el documento con tres capas de velo, y
cada bloque de contenido es un panel de cristal translúcido que pasa por encima
al hacer scroll. No hay degradados por sección, así que tampoco hay costuras
entre ellas.

El material tiene tres pesos —`glass-1`, `glass-2`, `glass-3`— según cuánto
tenga que sostener cada elemento. Los titulares van sueltos sobre la foto, con
`on-photo` para despegarlos; el contenido siempre dentro de cristal. Ese
contraste es el ritmo de la página.

En móvil se recorta el radio del desenfoque: un fondo fijo con muchos paneles
`backdrop-filter` encima cuesta GPU y el scroll lo nota.

## Datos del evento

En `src/data/content.js`:

- **Fecha**: miércoles 30 de septiembre de 2026.
- **Lugar**: Salón AB, Cámara de Comercio de Oviedo · Calle Quintana, 32,
  Oviedo. El botón «Cómo llegar» de la cuenta atrás abre esta dirección en
  Google Maps.
- **Inscripción**: <https://luma.com/2nzua3op>. Todos los CTA («Quiero
  participar» del menú y de la portada, «Reservar mi plaza» del cierre) salen
  de `evento.inscripcion`, así que se cambia en un solo sitio.
- **Entrada gratuita**: `evento.entrada` y `evento.plazas`. Aparece en la
  portada, en el menú y en el cierre.
- La sección de ponentes se retiró: no hay cartel que mostrar todavía. El
  contenido vive en el historial de git si hace falta recuperarlo.

## SEO

- **Meta description** en `index.html`, 148 caracteres (Google trunca a
  partir de ~155-160; la anterior tenía 239 y se cortaba a media frase).
- **Canonical, Open Graph y Twitter Card**, todos apuntando al dominio
  propio (`innoasturias.novagob.org`), con imagen social dedicada
  (`public/brand/og.jpg`, 1200×630, generada a partir del mismo fondo de la
  portada).
- **Datos estructurados `schema.org/Event`** en `index.html` (JSON-LD):
  fecha, lugar, organizador y precio (gratis). Es lo que permite que Google
  pueda mostrar esto como evento en los resultados de búsqueda, no como un
  enlace suelto — fecha y lugar visibles directamente en el snippet.
- `public/robots.txt` y `public/sitemap.xml`.

Si cambia el dominio, hay que actualizar las URLs absolutas en `index.html`
(canonical, `og:url`, `og:image`, el JSON-LD) y en `public/robots.txt`.

## Tipografía Mont

Mont (Fontfabric) es la fuente de los diseños de Canva y es **comercial**, así que no
viene incluida. Deja los ficheros en `public/fonts/` con estos nombres exactos y se
aplicará sin tocar nada más:

```
public/fonts/Mont-Regular.woff2
public/fonts/Mont-SemiBold.woff2
public/fonts/Mont-Bold.woff2
public/fonts/Mont-Heavy.woff2
```

Mientras no estén, la web cae en **Poppins** (Google Fonts), la geométrica libre más
parecida a Mont. Los `@font-face` están en `src/index.css`.

## Radar del ecosistema GovTech Asturias

Herramienta en vivo para el evento, dentro de esta misma web (Vite + React,
sin apps ni subdominios aparte). Tres rutas, sin login:

| Ruta | Para quién | Qué hace |
|---|---|---|
| `/radar` | Asistentes, desde el móvil vía QR | Formulario de 4 pasos → un `INSERT` en Supabase |
| `/radar/pantalla` | Proyector, durante el evento | Grafo en vivo: cada respuesta nueva aparece sola (Supabase Realtime) |
| `/radar/resultados` | Público, para siempre | La misma visualización, congelada, + conclusiones escritas a mano |

### Puesta en marcha (dos pasos, uno en Supabase y otro en Vercel)

**1. Crea la tabla.** Copia el contenido de
`supabase/migrations/20260904_radar_respuestas.sql` y pégalo entero en
Supabase → tu proyecto → **SQL Editor** → Run. Es idempotente: se puede
volver a ejecutar sin miedo si algo falla a medias. Crea la tabla
`radar_respuestas`, sus políticas de RLS (inserción y lectura públicas, sin
edición ni borrado) y la añade a la publicación de Realtime — sin este
último paso, `/radar/pantalla` no recibiría nada en vivo.

**2. Configura las variables de entorno**, con la clave **pública**
(`sb_publishable_...` o el `anon key` con formato JWT) — **nunca la
`secret`/`service_role`: esa se salta las políticas de RLS y da acceso
total a la base de datos**, no debe estar en ningún sitio del frontend.

- Local: `cp .env.example .env.local` y rellena `VITE_SUPABASE_URL` y
  `VITE_SUPABASE_ANON_KEY`. Ese archivo no se sube a git.
- Vercel: Project → Settings → Environment Variables → añade esas mismas
  dos, en Production (y Preview si quieres probarlo en un PR). Vite incrusta
  las variables **al construir**, no en tiempo de ejecución — después de
  añadirlas hace falta un deploy nuevo (push, o Redeploy en el panel) para
  que surtan efecto.

Sin este segundo paso, `/radar/*` se queda en un estado de error controlado
("No se ha podido conectar…"), pero **no rompe el resto de la web**: la
portada y todo lo demás en `/` funcionan igual.

### Decisiones ya tomadas (la especificación las dejaba abiertas)

- **Empresa y Startup van separadas**, con color propio cada una (coral y
  menta), en vez de fusionarse en un solo botón. La tabla ya distinguía los
  dos valores; juntarlas habría tirado información sin necesidad.
- **Las conexiones del grafo son nodo → hub de su área, no nodo ↔ nodo entre
  todos los que comparten área.** Con muchas respuestas en la misma área, un
  grafo completo (n·(n-1)/2 líneas) se vuelve una maraña — que es justo lo
  que la especificación pedía evitar. Cada nodo conecta con un punto de
  anclaje fijo por área; mismo agrupamiento visual, sin ese crecimiento
  cuadrático. Los seis anclajes están siempre visibles, tengan nodos o no.
- **La disposición es una espiral áurea** (el mismo patrón de las semillas
  de un girasol) alrededor de cada anclaje, no una simulación de física de
  grafo (d3-force). Determinista — pantalla y resultados coinciden siempre,
  sin física que derive sola en una pantalla que nadie toca durante horas — y
  no se solapa por mucho que crezca.
- **Pendiente, fuera de esta app**: la especificación ya lo señala — el
  código QR físico (quién lo genera y lo coloca el día del evento) y el
  registro de reuniones de matching / oportunidades de colaboración, que no
  son datos que capture un formulario, son conversaciones humanas que hay
  que anotar aparte para el informe final de la subvención.

### Conclusiones de /radar/resultados

`src/data/radarConclusiones.js` tiene `publicado: false` con texto de
relleno — la página muestra un aviso de "disponible después del evento" en
vez de esas frases. Cuando el evento pase, escribe ahí la lectura real de
los datos (qué área concentró más respuestas, proporción
administración/empresa, 2-3 frases de conclusión) y cambia a
`publicado: true`.

## Fondo

La portada usa **tu imagen original de Canva** (`_fuente/back.png`), convertida a
WebP en `public/brand/back.webp`: 2,4 MB → 55 KB, sin pérdida visible. Va sobre
el degradado teal, que cubre el sangrado en ventanas más anchas que los 1920 px
del original, con un velo oscuro hacia la izquierda para que el texto blanco
mantenga contraste sobre las zonas rosas claras de la imagen.

