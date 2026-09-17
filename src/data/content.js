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
      { nombre: 'Loredana Stan', cargo: 'Directora de la Fundación NovaGob', foto: '/ponentes/loredana-stan.jpg' },
      {
        nombre: 'Arantxa González Montell',
        cargo: 'Directora General de Empresa y Comercio, Principado de Asturias',
        foto: '/ponentes/arantxa-gonzalez.jpg',
      },
      {
        nombre: 'José Manuel Ferreira',
        cargo: 'Vicepresidente de la Cámara de Comercio de Oviedo',
        foto: '/ponentes/jose-manuel-ferreira.jpg',
      },
      { nombre: 'Ángela Medrano', cargo: 'Presentadora del evento', foto: '/ponentes/angela-medrano.jpg' },
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
      },
    ],
  },
  {
    hora: '10:00 – 10:20',
    titulo: 'GovTech en el Principado de Asturias',
    tipo: 'institucional',
    ponentes: [
      {
        nombre: 'Javier Fernández Rodríguez',
        cargo: 'Director General de Estrategia Digital e Inteligencia Artificial, Gobierno del Principado de Asturias',
        foto: '/ponentes/javier-fernandez.jpg',
      },
    ],
  },
  {
    hora: '10:20 – 11:10',
    titulo: 'InnoTalks',
    tipo: 'contenido',
    ponentes: [
      {
        nombre: 'Judith Flórez Paredes',
        cargo: 'Directora General de Empleo y Asuntos Laborales, Principado de Asturias',
        foto: '/ponentes/judith-florez.jpg',
      },
      { nombre: 'David González Fernández', cargo: 'Director de SEKUENS', foto: '/ponentes/david-gonzalez.jpg' },
      { nombre: 'Noelia Rico', cargo: 'Directora del CEISIA, Universidad de Oviedo', foto: '/ponentes/noelia-rico.jpg' },
      {
        nombre: 'Alejandro González',
        cargo: 'Coordinador Nodo Smart Cities e IoT de Asturias y Nodo Inteligencia Artificial de Asturias',
        foto: '/ponentes/alejandro-gonzalez.jpg',
      },
    ],
  },
  {
    hora: '11:10 – 11:30',
    titulo: 'Pausa para el café y networking',
    tipo: 'logistica',
    texto: 'Descanso entre sesiones para tomar algo y seguir la conversación de forma informal.',
  },
  {
    hora: '11:40 – 12:05',
    titulo: 'InnoClass — Caso 1',
    tipo: 'contenido',
    ponentes: [
      {
        nombre: 'Javier García-Calvo Gutiérrez',
        cargo: 'Global Head of DXP y Director territorial Asturias, en Hiberus',
        foto: '/ponentes/javier-garcia-calvo.jpg',
      },
    ],
  },
  {
    hora: '12:05 – 12:30',
    titulo: 'InnoClass — Caso 2',
    tipo: 'contenido',
    ponentes: [
      {
        nombre: 'Jone Ezcurra Ibarra',
        cargo: 'Ingeniera especialista en Diseño e Innovación en Tracasa',
        foto: '/ponentes/jone-ezcurra.jpg',
      },
    ],
  },
  {
    hora: '12:30 – 13:00',
    titulo: 'Radar del ecosistema',
    tipo: 'dinamica',
    ponentes: [{ nombre: 'Ángela Medrano', cargo: 'Presentadora del evento', foto: '/ponentes/angela-medrano.jpg' }],
  },
  {
    hora: '13:00 – 14:00',
    titulo: 'InnoDemos',
    tipo: 'dinamica',
    texto: 'Empresas y startups muestran en formato breve sus soluciones y casos de uso aplicables al sector público.',
  },
  {
    hora: '14:00',
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
  { src: '/brand/hiberus.png', alt: 'Hiberus' },
  { src: '/brand/camara-oviedo.png', alt: 'Cámara de Comercio de Oviedo' },
  { src: '/brand/clustertic.png', alt: 'Clúster TIC Asturias' },
  { src: '/brand/ceisia-uniovi.png', alt: 'CEISIA · Universidad de Oviedo' },
]
