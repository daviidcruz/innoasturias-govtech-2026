# InnoAsturias GovTech 2026

Landing del evento, promovido por Fundación NovaGob con el Principado de Asturias.
Stack: **Vite + React + Tailwind CSS v4**.

- Producción: <https://innoasturias-govtech-2026.vercel.app>
- Repositorio: <https://github.com/daviidcruz/innoasturias-govtech-2026>

Desplegado en Vercel, enlazado a este repositorio: cada push a `main` construye
y publica solo.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # -> dist/
```

## Estructura

```
src/
  data/content.js          Todo el copy y los datos del evento
  components/Backdrop.jsx  El fondo: la imagen de Canva, fija tras todo el doc
  components/Nav.jsx       Menú flotante en píldora translúcida
  components/Hero.jsx      Portada
  components/Countdown.jsx Cuenta atrás hasta el comienzo de la jornada
  components/Sections.jsx  Cuenta atrás, Encuentro, Jornada, Radar y Footer
  hooks/useInView.js       Revelados, el reloj del programa y el Radar
  hooks/useHashLanding.js  Salto al ancla al abrir un enlace con #seccion
public/brand/              Logos y fondo extraídos del diseño de Canva
_fuente/                   Material original: Canva y documentación de licitación
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
- **Lugar**: Oviedo. La sede concreta sigue sin confirmar.
- **Inscripción**: <https://luma.com/2nzua3op>. Todos los CTA («Quiero
  participar» del menú y de la portada, «Reservar mi plaza» del cierre) salen
  de `evento.inscripcion`, así que se cambia en un solo sitio.
- **Entrada gratuita**: `evento.entrada` y `evento.plazas`. Aparece en la
  portada, en el menú y en el cierre.
- La sección de ponentes se retiró: no hay cartel que mostrar todavía. El
  contenido vive en el historial de git si hace falta recuperarlo.

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

## Fondo

La portada usa **tu imagen original de Canva** (`_fuente/back.png`), convertida a
WebP en `public/brand/back.webp`: 2,4 MB → 55 KB, sin pérdida visible. Va sobre
el degradado teal, que cubre el sangrado en ventanas más anchas que los 1920 px
del original, con un velo oscuro hacia la izquierda para que el texto blanco
mantenga contraste sobre las zonas rosas claras de la imagen.

