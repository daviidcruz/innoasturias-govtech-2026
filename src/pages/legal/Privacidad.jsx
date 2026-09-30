import LegalPage from './LegalPage.jsx'

export default function Privacidad() {
  return (
    <LegalPage titulo="Política de privacidad" actualizado="septiembre 2026">
      <h2>1. Responsable del tratamiento</h2>
      <p>
        <strong>Entidad:</strong> Fundación NovaGob
        <br />
        <strong>NIF:</strong> G57178766
        <br />
        <strong>Domicilio:</strong> Parque Científico de Madrid, Calle Faraday 7, 28049 Madrid
        <br />
        <strong>Correo electrónico:</strong> info@novagob.org
      </p>
      <p>Inscrita en el Registro de Fundaciones del Ministerio de Justicia con nº 684.</p>
      <p>
        Este sitio (innoasturias.novagob.org) es un micrositio de Fundación NovaGob para el evento
        InnoAsturias GovTech 2026 y su herramienta el Radar del ecosistema GovTech asturiano.
      </p>

      <h2>2. Qué datos tratamos y con qué finalidad</h2>
      <p>
        <strong>a) Inscripción al evento.</strong> El registro de asistentes se gestiona
        íntegramente en Luma, un servicio de terceros ajeno a esta web. No almacenamos esos datos
        en nuestra infraestructura: se rigen por la política de privacidad de Luma, que puedes
        consultar antes de inscribirte.
      </p>
      <p>
        <strong>b) Participación en el Radar del ecosistema</strong> (formulario en{' '}
        <code>/radar/participar</code>). Si cuentas un reto o una solución, tratamos: tu perfil
        (Administración, empresa, startup o universidad), el tipo de aportación, el nombre de tu
        organización (opcional — puedes pedir que no se muestre), la descripción que escribes
        libremente y las áreas que marcas. Lo usamos para proyectar el mapa en directo durante el
        evento, mostrarlo en la web del Radar y calcular posibles coincidencias entre retos y
        soluciones mediante herramientas de análisis (incluida inteligencia artificial) que
        proponen con quién podrías encajar.
      </p>
      <p>
        Esa información se muestra públicamente en el mapa (salvo que ocultes el nombre de tu
        organización) y permanece visible de forma indefinida, porque el Radar no se cierra al
        terminar la jornada: sigue abierto a nuevas respuestas.
      </p>
      <p>
        <strong>c) Datos de navegación.</strong> Usamos analítica de uso y métricas de rendimiento
        (Vercel Analytics y Speed Insights) de forma agregada y anonimizada, sin cookies de
        seguimiento individual ni identificación personal.
      </p>
      <p>No vendemos ni cedemos datos personales a terceros con fines comerciales.</p>

      <h2>3. Base jurídica</h2>
      <ul>
        <li>Consentimiento: al rellenar voluntariamente el formulario del Radar.</li>
        <li>Interés legítimo: analítica agregada del sitio y seguridad.</li>
      </ul>

      <h2>4. Encargados del tratamiento y proveedores</h2>
      <ul>
        <li>Supabase — base de datos y alojamiento de las respuestas del Radar.</li>
        <li>Vercel — hosting del sitio, analítica y métricas de rendimiento.</li>
        <li>Luma — gestión externa de las inscripciones al evento.</li>
      </ul>
      <p>Todos aplican medidas técnicas y organizativas conforme al RGPD.</p>

      <h2>5. Transferencias internacionales</h2>
      <p>
        Cuando alguno de estos proveedores aloje datos fuera de la Unión Europea, la transferencia
        se ampara en mecanismos legalmente válidos: decisiones de adecuación, cláusulas
        contractuales tipo o el EU-US Data Privacy Framework.
      </p>

      <h2>6. Conservación de datos</h2>
      <p>
        Los datos del Radar se conservan mientras el proyecto siga activo — no tiene fecha de
        cierre prevista — o hasta que la persona interesada solicite su supresión.
      </p>

      <h2>7. Tus derechos</h2>
      <p>
        Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, supresión,
        limitación, portabilidad y oposición escribiendo a info@novagob.org. Como el formulario del
        Radar no pide nombre ni correo, para localizar y borrar una entrada concreta puede hacer
        falta que nos des algún detalle que permita identificarla (por ejemplo, la organización y
        la fecha aproximada de envío). Si consideras que tus derechos no han sido atendidos, puedes
        reclamar ante la Agencia Española de Protección de Datos (AEPD).
      </p>

      <h2>8. Menores</h2>
      <p>
        Este sitio no está dirigido a menores de 14 años y no recoge deliberadamente datos de
        menores.
      </p>

      <h2>9. Decisiones automatizadas</h2>
      <p>
        El Radar usa análisis de texto (incluida IA) para sugerir posibles coincidencias entre
        retos y soluciones, pero no toma decisiones con efectos jurídicos ni elabora perfiles con
        consecuencias para nadie: son solo sugerencias de contacto que cada persona decide seguir
        o no.
      </p>

      <h2>10. Seguridad</h2>
      <p>
        El sitio usa cifrado en tránsito (HTTPS) y políticas de seguridad a nivel de fila en la
        base de datos: una vez enviada, una respuesta del Radar no se puede editar ni eliminar
        desde el propio formulario — solo el responsable del tratamiento puede hacerlo, a petición
        de la persona interesada.
      </p>

      <h2>11. Cookies</h2>
      <p>
        Este sitio no utiliza cookies propias de seguimiento. Las herramientas de analítica y
        rendimiento que usamos (Vercel Analytics y Speed Insights) funcionan sin cookies de
        identificación individual.
      </p>
    </LegalPage>
  )
}
