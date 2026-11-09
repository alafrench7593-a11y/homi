/** Contenus del posparto — versión española (traducida desde el francés, misma estructura, mismos identificadores). */
import type { Section } from './postpartum';

/** Fuentes: solo cambia la presentación del editor; los títulos se quedan en su idioma original. */
export const AWHONN_PUBLISHER_ES = 'AWHONN — Asociación estadounidense de enfermeras en salud de la mujer, obstetricia y neonatología';

export const UNDERSTAND_ES: Section[] = [
  {
    id: 'blues',
    title: 'El baby blues',
    body: [
      'En los días que siguen al parto, muchas madres se sienten a flor de piel: lágrimas, irritabilidad, preocupaciones. Es frecuente y está ligado a los grandes cambios físicos, hormonales y psicológicos.',
      'Suele durar desde unas horas hasta unos días, y pasa por sí solo.',
    ],
    sources: ['mpj'],
  },
  {
    id: 'signs',
    title: 'Cuándo vale la pena hablarlo',
    body: [
      'Algunos signos pueden justificar una consulta: una tristeza que se instala, la pérdida de interés o de placer, una ansiedad importante, un sentimiento de desesperanza, una culpa excesiva, dificultades para dormir incluso cuando hay ocasión de descansar, un agotamiento emocional, dificultades para hacer frente al día a día, una sensación de desapego o de dificultad para crear un vínculo con el bebé, la sensación de verte desbordada.',
      'Estas manifestaciones pueden tener varias causas. Solo un profesional puede evaluarlas: esta aplicación no lo hace.',
      'Las recomendaciones oficiales invitan a hablarlo si dura más de dos semanas y, en cualquier caso, ante la menor duda. Si es intenso o empeora, no esperes: puedes hablarlo hoy mismo.',
      'La depresión posparto es frecuente —afecta al 15 a 20 % de las mujeres que han dado a luz según la encuesta nacional perinatal francesa de 2021— y tiene tratamiento. También puede afectar a los padres.',
    ],
    sources: ['mpj', 'ministere'],
  },
  {
    id: 'who',
    title: 'Con quién hablarlo',
    body: [
      'Tu matrona, tu médico de cabecera, un centro de PMI (protección materno-infantil), un psicólogo (el programa «Mon soutien psy» lo cubre la Assurance maladie) o una consulta de psiquiatría perinatal en el hospital.',
      'La entrevista posnatal precoz, prevista entre la 4.ª y la 8.ª semana después del parto, es un momento dedicado a hablar de ti. También puedes pedir hablarlo antes.',
      'Los espacios de acogida para madres, padres e hijos y los grupos de padres permiten romper el aislamiento.',
    ],
    sources: ['mpj'],
  },
  {
    id: 'urgent',
    title: 'Si estás en peligro',
    body: [
      'Si tienes pensamientos de hacerte daño, de dejar de estar aquí o de hacer daño a tu bebé, o si te sientes muy confundida: llama ahora al 3114 (gratuito, confidencial, 24 h/24), o al 15 o al 112 si el peligro es inmediato.',
      'No son pensamientos de los que haya que avergonzarse. Son una señal de que necesitas ayuda, ahora mismo.',
    ],
    sources: ['crise'],
  },
];

export const PARTNER_ES: Section[] = [
  {
    id: 'changes',
    title: 'Lo que cambia después de un nacimiento',
    body: [
      'El cuerpo se recupera durante semanas, a veces meses. El sueño está fragmentado, las hormonas cambian mucho y el cuidado del bebé es permanente.',
      'Las lágrimas y la fragilidad en los primeros días son frecuentes (baby blues) y suelen pasar en unos días.',
    ],
    sources: ['mpj'],
  },
  {
    id: 'difference',
    title: '¿Cansancio, baby blues o algo más?',
    body: [
      'Si la tristeza, la ansiedad o el agotamiento se instalan, se intensifican o le impiden hacer frente al día a día, merece la opinión de un profesional. No tienes que decidirlo tú: tu papel es escuchar y facilitar el acceso a la ayuda.',
      'Los padres y los coprogenitores también pueden atravesar una depresión después de un nacimiento. Cuídate tú también.',
    ],
    sources: ['mpj', 'ministere'],
  },
  {
    id: 'listen',
    title: 'Escuchar sin minimizar',
    body: [
      'Evita «es normal, ya pasará» o «lo tienes todo para ser feliz». Acoge lo que dice, sin intentar corregir sus emociones.',
      'No leas a escondidas lo que no va dirigido a ti: lo que ella comparte en la aplicación, lo ha elegido ella.',
    ],
    sources: [],
  },
  {
    id: 'help',
    title: 'Ayudar de forma concreta',
    body: [
      'Comparte las noches (biberones, despertares), encárgate de las comidas, la compra, la ropa y las visitas sin que ella tenga que pedirlo.',
      'Protege sus momentos de descanso: tú te ocupas del bebé, del teléfono y de la puerta.',
    ],
    sources: [],
  },
  {
    id: 'consult',
    title: 'Animar a consultar, sin culpabilizar',
    body: [
      'Propón en lugar de imponer: «Si quieres, puedo ayudarte a pedir cita». Ofrécete a cuidar del bebé durante la cita, o a acompañarla.',
      'Una matrona, el médico de cabecera, la PMI o un psicólogo pueden atenderla.',
    ],
    sources: ['mpj'],
  },
  {
    id: 'urgent',
    title: 'Cuándo pedir ayuda urgente',
    body: [
      'Si habla de hacerse daño, de dejar de estar aquí, de hacer daño al bebé, o si parece muy confundida: no la dejes sola, pon al bebé en un lugar seguro y llama al 3114, o al 15 / 112 si el peligro es inmediato.',
    ],
    sources: ['crise'],
  },
];

export const USEFUL_PHRASES_ES = [
  '¿Cómo te sientes de verdad hoy?',
  '¿De qué puedo encargarme para que puedas respirar un poco?',
  '¿Quieres que me ocupe del bebé mientras descansas?',
  'Si quieres, puedo ayudarte a pedir cita.',
  'No tienes que encargarte de todo tú sola.',
];

export const RECOVERY_WARNINGS_ES = {
  call15: ['Dolor en el pecho', 'Dificultad para respirar o falta de aire', 'Convulsiones', 'Pensamientos de hacerte daño o de hacer daño a alguien'],
  callPro: [
    'Sangrado que empapa una compresa en una hora, o coágulos del tamaño de un huevo o más grandes',
    'Cicatriz (episiotomía, cesárea) que no se cura, está roja o supura',
    'Pierna roja, hinchada, dolorosa o caliente',
    'Temperatura de 38 °C o más',
    'Dolores de cabeza que persisten a pesar de un analgésico, o con alteraciones de la vista',
  ],
  source: 'awhonn' as const,
};
