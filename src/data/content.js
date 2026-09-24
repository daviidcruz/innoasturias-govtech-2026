export const evento = {
  titulo: 'InnoAsturias',
  subtitulo: 'GovTech',
  anio: '2026',
  claim: 'Del potencial a la acción: activar, conectar y ordenar el ecosistema GovTech asturiano.',
  fecha: 'Miércoles 30 de septiembre de 2026',
  // Hora oficial de comienzo, en hora peninsular (CEST en septiembre)
  fechaISO: '2026-09-30T09:00:00+02:00',
  lugar: 'Salón AB · Cámara de Comercio de Oviedo',
  direccion: 'Calle Quintana, 32, Oviedo',
  inscripcion: 'https://luma.com/2nzua3op',
  formato: 'Media jornada · 09:00 – 14:00',
  entrada: 'Entrada gratuita',
  plazas: 'Plazas limitadas',
}

export const nav = [
  { id: 'encuentro', label: 'El encuentro' },
  { id: 'programa', label: 'La jornada' },
  { id: 'participantes', label: 'Quién viene' },
]

export const objetivos = [
  {
    titulo: 'Conectar',
    texto:
      'Administraciones públicas, empresas, startups y universidad en un espacio común orientado a la colaboración práctica.',
  },
  {
    titulo: 'Identificar retos',
    texto:
      'Detectar y priorizar retos públicos susceptibles de abordarse con soluciones tecnológicas ya existentes en el territorio.',
  },
  {
    titulo: 'Mapear el ecosistema',
    texto:
      'Construir un Radar GovTech asturiano que visibilice capacidades, niveles de madurez y oportunidades de conexión.',
  },
  {
    titulo: 'Transferir conocimiento',
    texto:
      'Cómo colaborar con la Administración de verdad: compra pública de innovación, pilotos y retos.',
  },
  {
    titulo: 'Activar oportunidades',
    texto:
      'Dinámicas de matching entre retos y soluciones que se traducen en propuestas concretas de piloto.',
  },
]

export const programa = [
  {
    hora: '09:00 – 09:15',
    titulo: 'Apertura institucional',
    tipo: 'institucional',
    ponentes: [
      {
        nombre: 'Loredana Stan',
        cargo: 'Directora de la Fundación NovaGob',
        foto: '/ponentes/loredana-stan.jpg',
        linkedin: 'https://www.linkedin.com/in/loredana-stan-1b651b43/',
      },
      {
        nombre: 'José Manuel Ferreira',
        cargo: 'Vicepresidente de la Cámara de Comercio de Oviedo',
        foto: '/ponentes/jose-manuel-ferreira.jpg',
        linkedin: 'https://www.linkedin.com/in/jose-manuel-ferreira/',
      },
      {
        nombre: 'Ángela Medrano',
        cargo: 'Periodista. Conductora y presentadora del evento.',
        foto: '/ponentes/angela-medrano.jpg',
        linkedin: 'https://www.linkedin.com/in/%C3%A1ngelamedrano/',
      },
    ],
  },
  {
    hora: '09:15 – 10:00',
    titulo: 'Keynote estratégica',
    tipo: 'contenido',
    texto:
      'Administraciones que aprenden: cómo el enfoque GovTech conecta retos públicos con las capacidades del ecosistema.',
    ponentes: [
      {
        nombre: 'Saioa Leguinagoicoa',
        cargo: 'Responsable de Estrategia Digital y Gobierno Digital, Diputación Foral de Bizkaia',
        foto: '/ponentes/saioa-leguinagoicoa.jpg',
        linkedin: 'https://www.linkedin.com/in/saioa-leguinagoicoa-78165618/',
      },
    ],
  },
  {
    hora: '10:00 – 10:30',
    titulo: 'GovTech en el Principado de Asturias',
    tipo: 'contenido',
    texto:
      'Cómo avanza la estrategia digital y de inteligencia artificial del Principado, y qué papel juega el ecosistema GovTech en ese camino.',
    ponentes: [
      {
        nombre: 'Javier Fernández Rodríguez',
        cargo: 'Director General de Estrategia Digital e Inteligencia Artificial, Gobierno del Principado de Asturias',
        foto: '/ponentes/javier-fernandez.jpg',
        linkedin: 'https://www.linkedin.com/in/javierfdezrguez/',
      },
    ],
  },
  {
    hora: '10:30 – 11:30',
    titulo: 'InnoTalks',
    tipo: 'contenido',
    ponentes: [
      {
        nombre: 'Guiomar Álvarez Reyes',
        rol: 'Moderadora',
        cargo: 'Adjunta a Dirección General. Directora del Área de Formación y Personas',
        foto: '/ponentes/guiomar-alvarez.jpg',
        linkedin: 'https://www.linkedin.com/in/guiomarareyes/',
      },
      {
        nombre: 'Judith Flórez Paredes',
        cargo: 'Directora General de Empleo y Asuntos Laborales, Principado de Asturias',
        foto: '/ponentes/judith-florez.jpg',
      },
      {
        nombre: 'David González Fernández',
        cargo: 'Director de SEKUENS',
        foto: '/ponentes/david-gonzalez.jpg',
        linkedin: 'https://www.linkedin.com/in/david-gonzalez-phd-2350896/',
      },
      {
        nombre: 'Noelia Rico',
        cargo: 'Directora del CEISIA, Universidad de Oviedo',
        foto: '/ponentes/noelia-rico.jpg',
        linkedin: 'https://www.linkedin.com/in/noeliaricop/',
      },
      {
        nombre: 'Alejandro González',
        cargo: 'Coordinador Nodo Smart Cities e IoT de Asturias y Nodo Inteligencia Artificial de Asturias, Clúster TIC Asturias',
        foto: '/ponentes/alejandro-gonzalez.jpg',
        linkedin: 'https://www.linkedin.com/in/alejandroglezgarcia/',
      },
      {
        nombre: 'David Rosa Mañez',
        cargo: 'CEO de More Than Theory',
        foto: '/ponentes/david-rosa.jpg',
        linkedin: 'https://www.linkedin.com/in/david-rosa-mañez-94748420/',
      },
    ],
  },
  {
    hora: '11:30 – 12:00',
    titulo: 'Pausa para el café y networking',
    tipo: 'logistica',
    texto: 'Descanso entre sesiones para tomar algo y seguir la conversación de forma informal.',
  },
  {
    hora: '12:00 – 12:30',
    titulo: 'InnoClass 1.0',
    tipo: 'contenido',
    texto:
      'Personalización orientada a valor real, no a marketing: personalizar la experiencia digital en los servicios públicos no es marketing, es aportar valor para el ciudadano.',
    ponentes: [
      {
        nombre: 'Javier García-Calvo Gutiérrez',
        cargo: 'Global Head of DXP y Director territorial Asturias, en Hiberus',
        foto: '/ponentes/javier-garcia-calvo.jpg',
        linkedin: 'https://www.linkedin.com/in/javier-garc%C3%ADa-calvo-guti%C3%A9rrez-a0682718/',
      },
    ],
  },
  {
    hora: '12:30 – 13:00',
    titulo: 'InnoClass 2.0',
    tipo: 'contenido',
    texto:
      'TwIN, Gemelos Digitales de Navarra: de los retos públicos a 8 pilotos reales en calidad del aire, energía, urbanismo y movilidad.',
    ponentes: [
      {
        nombre: 'Jone Ezcurra Ibarra',
        cargo: 'Ingeniera especialista en Diseño e Innovación en Tracasa Instrumental',
        foto: '/ponentes/jone-ezcurra.jpg',
        linkedin: 'https://www.linkedin.com/in/jone-ezcurra-ibarra-55b564a4/',
      },
    ],
  },
  {
    hora: '13:00 – 13:30',
    titulo: 'Radar del ecosistema',
    tipo: 'dinamica',
    ponentes: [
      {
        nombre: 'Ángela Medrano',
        cargo: 'Periodista. Conductora y presentadora del evento.',
        foto: '/ponentes/angela-medrano.jpg',
        linkedin: 'https://www.linkedin.com/in/%C3%A1ngelamedrano/',
      },
    ],
  },
  {
    hora: '13:30 – 14:00',
    titulo: 'InnoIA',
    tipo: 'contenido',
    texto:
      'SmartBidRigging: una demostración de cómo la inteligencia artificial puede detectar prácticas anticompetitivas en la contratación pública.',
    ponentes: [
      {
        nombre: 'Vicente Rodríguez Montequín',
        cargo: 'Full Professor, Área de Proyectos de Ingeniería, Universidad de Oviedo',
        foto: '/ponentes/vicente-rodriguez-montequin.jpg',
        linkedin: 'https://www.linkedin.com/in/montequi/',
      },
      {
        nombre: 'Antonio Saldaña Fernández del Viso',
        cargo: 'Investigador en la Universidad de Oviedo',
        foto: '/ponentes/antonio-saldana.jpg',
        linkedin: 'https://www.linkedin.com/in/antoniosalviso/',
      },
    ],
  },
  {
    hora: '14:00 – 14:15',
    titulo: 'InnoDemo',
    tipo: 'dinamica',
    texto:
      'GreenBid AI: una demo en vivo de cómo la inteligencia artificial puede vigilar el cumplimiento ambiental en los contratos públicos.',
    ponentes: [
      {
        nombre: 'Miguel López',
        cargo: 'CEO de Cadabit',
        foto: '/ponentes/miguel-lopez.jpg',
        linkedin: 'https://www.linkedin.com/in/miguel-lopez-barrio/',
      },
    ],
  },
  {
    hora: '14:15',
    titulo: 'Cierre y networking',
    tipo: 'logistica',
    texto: 'Espacio informal para consolidar contactos y explorar los próximos pasos de colaboración.',
  },
]

export const cuadrantes = [
  {
    bloque: 'Administración',
    aporta: 'Los retos',
    texto: 'Perfiles con capacidad real de decisión que traen a la sala problemas concretos y presupuesto.',
  },
  {
    bloque: 'Empresas',
    aporta: 'Las soluciones',
    texto: 'Tejido tecnológico con producto probado y ganas de entender cómo se contrata en lo público.',
  },
  {
    bloque: 'Startups',
    aporta: 'La velocidad',
    texto: 'Equipos capaces de prototipar un piloto en semanas si encuentran el reto y el interlocutor.',
  },
  {
    bloque: 'Universidad',
    aporta: 'El conocimiento',
    texto: 'Grupos de investigación, parques científicos y agentes de transferencia con capacidad aplicada.',
  },
]

export const temas = [
  'Digitalización',
  'Datos',
  'Inteligencia artificial',
  'Automatización',
  'Eficiencia administrativa',
  'Compra pública de innovación',
]

export const colaboradores = [
  { src: '/brand/camara-oviedo.png', alt: 'Cámara de Comercio de Oviedo' },
  { src: '/brand/hiberus.png', alt: 'Hiberus' },
  { src: '/brand/clustertic.png', alt: 'Clúster TIC Asturias' },
  { src: '/brand/ceisia-uniovi.png', alt: 'CEISIA · Universidad de Oviedo' },
]
