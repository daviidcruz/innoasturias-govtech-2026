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
Supabase → tu proyecto → **SQL Editor** → Run. Luego haz lo mismo con
`supabase/migrations/20260907_radar_areas_multiples.sql` (va después: amplía
el catálogo de áreas de 6 a 9 y deja marcar varias por respuesta). Las dos
son idempotentes: se pueden volver a ejecutar sin miedo si algo falla a
medias. Crean la tabla `radar_respuestas`, sus políticas de RLS (inserción y
lectura públicas, sin edición ni borrado) y la añaden a la publicación de
Realtime — sin este último paso, `/radar/pantalla` no recibiría nada en
vivo.

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
- **Una respuesta puede marcar varias áreas**, no solo una — el paso 4 del
  formulario es de selección múltiple. Se comparan todas a la hora de
  calcular matches, no solo la primera.
- **Las tarjetas van sueltas por el lienzo, sin agrupar por área y sin
  orden aparente** — como notas repartidas sobre una mesa, no una lista ni
  una cuadrícula. Se probaron antes un despliegue radial alrededor de un
  hub por área y una cuadrícula de columnas en caja; los dos fallaban con
  datos reales (pocas respuestas repartidas de forma desigual entre las
  nueve áreas): quedaban pequeñas, descolocadas, o una columna desbordando
  a la de al lado. También se probó un grafo de puntos pequeños (estilo
  Obsidian) en vez de tarjetas, pero perdía la lectura directa del reto o
  la solución que traía cada respuesta — volver a la tarjeta, con esta
  misma disposición suelta, es lo que se quedó.
- **`colocarTarjetas` (`RadarGraph.jsx`) coloca cada tarjeta con una
  simulación de fuerzas, no con una retícula: todas se repelen entre sí,
  pero cada pareja que hace match se atrae.** Así una empresa con varios
  retos alrededor suyo los reúne cerca, formando un grupo que se distingue
  de un vistazo, mientras que las que no tienen match ninguno quedan
  sueltas por el resto del lienzo — sin orden de lectura, ni fila, ni
  columna. Arranca desde posiciones sembradas por id (deterministas: no
  saltan de sitio entre renders) y dos pasadas más: la física se asienta
  durante 240 iteraciones y luego una separación explícita de rectángulos
  empuja aparte cualquier par que aún se solape (el campo de fuerzas por sí
  solo lo hace muy improbable, no imposible). Se recalcula solo si cambia
  el tamaño de ventana o llega una respuesta nueva.
- **El Radar es un mapa con zoom, como Figma o Canva — no un hueco fijo
  donde encajar tarjetas a la fuerza.** Se probó primero encoger todas las
  tarjetas por igual cuando no sobraba sitio (`escala`, comparando área
  disponible con área necesaria): funcionaba, pero seguía atado al tamaño
  de la ventana — con una ventana pequeña de verdad (1000×630, 21
  respuestas reales) dos tarjetas casi idénticas en posición se quedaban
  empujándose la una a la otra sin separarse nunca. La causa de fondo era
  que el problema (colocar N tarjetas a tamaño fijo en un hueco que no
  crece) no siempre tiene solución sin solapes. `calcularLienzo`
  (`RadarGraph.jsx`) invierte el planteamiento: el lienzo donde viven las
  tarjetas se dimensiona a partir de cuántas respuestas hay — siempre a
  tamaño real de tarjeta, con hueco de sobra — así que colocarlas sin que
  se pisen es, por construcción, un problema que sí tiene solución. La
  ventana solo decide con cuánto zoom se ve ese lienzo (ajustado para que
  quepa entero al abrir), y con la rueda del ratón y arrastrando se explora
  como un mapa; un botón "Ver todo" reencuadra si te has movido.
- **El encuadre inicial ajusta el zoom al rectángulo que de verdad ocupan
  las tarjetas, no al lienzo entero.** El lienzo se dimensiona generoso a
  propósito para darle margen a la simulación de fuerzas, y el empuje hacia
  el centro agrupa las tarjetas en un óvalo más pequeño que ese lienzo — si
  el encuadre inicial usaba el lienzo entero, ese óvalo se veía encogido en
  medio de la pantalla con los lados vacíos, aunque hubiera hueco de sobra
  a los lados. `contenido` (`RadarGraph.jsx`) mide el rectángulo real que
  ocupan las tarjetas ya colocadas y encuadra eso. El empuje hacia el
  centro, además, tira más flojo en horizontal que en vertical cuando el
  lienzo es ancho (proporcional a su aspecto), para que el grupo se asiente
  ancho en vez de redondo — aprovechando ese hueco en vez de dejarlo vacío.
- **Cada tarjeta muestra siempre el nombre y el reto o la solución que
  trajo** — nunca hace falta pasar el ratón por encima para leerlos.
- **El match del Radar: una Administración con un reto en un área, conectada
  con una Empresa/Startup/Universidad con una solución en esa misma área**
  (comparando todas las áreas que marcó cada una, no solo la principal) —
  un hilo curvo con un punto de luz que lo recorre, calculado en
  `calcularMatches` (`graphLayout.js`). Sin match, la tarjeta se queda sola.
- **El punto donde termina un hilo se calcula, no se mide.**
  `centroTarjeta` (`RadarGraph.jsx`) saca el centro de cada tarjeta
  directamente de su posición y su ancho — los dos ya conocidos de
  antemano —, no con `getBoundingClientRect` sobre el DOM ya pintado. La
  primera versión sí medía el DOM: funcionaba en el primer pintado, pero en
  cuanto el usuario tocaba la rueda o arrastraba antes de que la medición
  llegara a correr, los hilos se quedaban con coordenadas de un zoom o un
  paneo que ya no era el actual — se veían cruzando la pantalla sin tocar
  las tarjetas que decían conectar. Calculándolo en vez de midiéndolo, el
  hilo no puede desincronizarse nunca del mapa: son la misma aritmética.
- **El marco de una tarjeta con match parpadea cada `CICLO_PARPADEO`
  segundos (5 por defecto)**, cada una con su propio retraso inicial
  (sembrado por su id) para que no parpadeen todas a la vez — se probó
  antes sincronizar el parpadeo con el momento exacto en que la bola de su
  hilo llega, pero en una pantalla proyectada, sin poder fijar la vista en
  un hilo concreto, ese matiz se perdía por completo: parecía que no pasaba
  nada. Un parpadeo simple y regular, aunque no coincida bola a bola con el
  hilo, es lo que de verdad se nota de un vistazo.
- **Pulsar una tarjeta la enfoca: el resto de la pantalla se atenúa y se
  desenfoca, su hilo y la tarjeta o tarjetas con las que hace match se
  quedan nítidas y brillantes, y un panel centrado (`PanelFoco`,
  `RadarGraph.jsx`) muestra el detalle completo** (perfil, áreas, texto
  entero, y la lista "Conecta con" de cada match, cada una pulsable para
  saltar el foco a esa tarjeta). Sustituye al popover que aparecía al pasar
  el ratón por encima: en una pantalla proyectada nadie tiene el ratón
  encima de nada, y con las tarjetas ahora más grandes hacía falta un modo
  de leer el detalle completo sin depender del hover. El desenfoque de
  fondo (`backdrop-filter: blur`) y el resaltado del hilo activo viven en
  dos capas aparte por encima del lienzo, no dentro de él, porque un
  elemento con `transform` (el propio lienzo, que se paneé y haga zoom)
  abre su propio contexto de apilamiento — el `z-index` de sus hijos no se
  puede comparar con el de nada fuera de él.
- **Las tarjetas crecieron (más ancho y alto) y el margen del encuadre
  inicial se apretó (de 0.94 a 0.985 del hueco disponible)** para
  aprovechar más pantalla y hacerlas legibles de lejos en una proyección;
  se volvió a comprobar que la disposición no se solape ni en 1440×900 ni
  en una ventana pequeña real (1000×628).
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

