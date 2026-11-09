/** Ayuda para la noche — versión en español (misma forma que la francesa; solo cambian los textos mostrados). */
import type { NightAgeBand } from './nightHelp';

export const NIGHT_BANDS_ES: NightAgeBand[] = [
  {
    key: '0-3m',
    fromMonths: 0,
    toMonths: 3,
    title: 'De 0 a 3 meses',
    points: [
      'Un recién nacido duerme de media de 16 a 17 horas cada 24 horas, en periodos de 3 a 4 horas, sin distinguir todavía el día de la noche.',
      'Despertarse cada 2 a 4 horas es habitual a esta edad: este ritmo depende de la maduración de su cerebro, no de lo que tú hagas.',
      'Al comienzo de la lactancia, son frecuentes de 8 a 12 tomas cada 24 horas, noche incluida; las tomas nocturnas suelen ayudar a mantener la producción de leche.',
      'A esta edad, se aconseja seguir su ritmo y cogerlo en brazos cuando llora.',
      'El llanto de la tarde-noche suele ser más intenso hacia las 6 a 8 semanas y luego se atenúa hacia el final del tercer mes.',
      'De día: luz y ruidos habituales. De noche: poca luz, voz baja, gestos tranquilos y volver a acostarlo rápido.',
    ],
    sources: ['santeSommeilNormal', 'santeVeilleSommeil', 'santeRythmeTetees', 'santePleurs'],
  },
  {
    key: '3-6m',
    fromMonths: 3,
    toMonths: 6,
    title: 'De 3 a 6 meses',
    points: [
      'La necesidad de sueño sigue siendo importante, en torno a 16 a 17 horas cada 24 horas de media antes de los 6 meses.',
      'Los ciclos de sueño duran unos 50 a 60 minutos; un breve despertar entre dos ciclos es normal, y muchos bebés vuelven a dormirse solos.',
      'De media, las noches empiezan a alargarse entre los 4 y los 6 meses, pero cada bebé tiene su ritmo, y algunos tardan más.',
      'Un biberón más abundante por la noche no prolonga el sueño y puede favorecer las regurgitaciones.',
      'Hacia los 6 meses, muchos bebés hacen unas tres siestas al día.',
    ],
    sources: ['santeSommeilNormal', 'santeVeilleSommeil'],
  },
  {
    key: '6-12m',
    fromMonths: 6,
    toMonths: 12,
    title: 'De 6 a 12 meses',
    points: [
      'Hacia el año, el sueño representa de media de 13 a 14 horas cada 24 horas, de las cuales unas 12 horas por la noche, con dos siestas.',
      'Los despertares entre dos ciclos siguen siendo normales; lo que puede volverse difícil es volver a dormirse solo.',
      'Después de los 6 meses, los profesionales suelen sugerir dar al bebé la oportunidad de volver a dormirse, tranquilizarlo y luego acostarlo de nuevo, sin ofrecerle sistemáticamente el pecho o el biberón, y sin dejarlo llorar mucho tiempo sin respuesta.',
      'A partir de los 9 meses aproximadamente, una etapa del desarrollo (caminar) o un cambio de vida (nuevo modo de cuidado, mudanza) puede alterar las noches durante un tiempo.',
      'Un ritual tranquilo y un objeto que lo reconforte (un muñeco de apego adaptado a su edad) pueden ayudar a la hora de acostarse.',
    ],
    sources: ['santeSommeilNormal', 'santeVeilleSommeil', 'mpediaTroublesSommeil'],
  },
  {
    key: '12-24m',
    fromMonths: 12,
    toMonths: 24,
    title: 'De 12 a 24 meses',
    points: [
      'La necesidad de sueño disminuye poco a poco: unas 13 a 14 horas cada 24 horas hacia el año.',
      'La siesta de la mañana suele desaparecer hacia los 18 meses; una siesta a primera hora de la tarde sigue siendo habitual.',
      'Despertarse por la noche en cada cambio de ciclo es normal; la angustia de separación o un cambio de vida pueden hacer más difícil conciliar el sueño.',
      'Una habitación a oscuras, si acaso con una pequeña luz quitamiedos, y sin pantallas en la habitación favorecen el sueño.',
      'Las pantallas se desaconsejan antes de los 3 años, y deben apagarse de 1 a 2 horas antes de acostarse a cualquier edad.',
    ],
    sources: ['santeSommeilNormal', 'mpediaTroublesSommeil', 'ameliEcrans'],
  },
  {
    key: '24-36m',
    fromMonths: 24,
    toMonths: 36,
    title: 'De 2 a 3 años',
    points: [
      'Hacia los 3 años, el sueño representa de media de 12 a 13 horas cada 24 horas, con una siesta de unas 2 horas a primera hora de la tarde.',
      'Los despertares a mitad de la noche siguen siendo frecuentes; a menudo, el niño vuelve a dormirse solo.',
      'Pesadilla (más bien al final de la noche): el niño se despierta asustado; tranquilizarlo le ayuda a volver a dormirse.',
      'Terror nocturno (más bien al principio de la noche): grita o se agita sin estar realmente despierto; quédate cerca de él sin despertarlo.',
      'No existe ningún medicamento para dormir adaptado a los niños pequeños; si las dificultades persisten, el médico o el pediatra pueden ayudar a reorganizar los ritmos.',
    ],
    sources: ['santeSommeilNormal', 'mpediaTroublesSommeil', 'ameliSommeilEnfant'],
  },
];

export const SOOTHING_ROUTINES_ES: { title: string; steps: string[] }[] = [
  {
    title: 'El mismo orden cada noche',
    steps: [
      'Elegir tres o cuatro pasos sencillos y mantenerlos siempre en el mismo orden.',
      'Por ejemplo: aseo, pijama, cuento, abrazo, cama.',
      'Anunciar lo que viene con voz suave: «Después del cuento, a dormir».',
      'Mantener más o menos la misma hora, sin buscar la perfección.',
    ],
  },
  {
    title: 'Bajar la luz',
    steps: [
      'Atenuar las luces de la habitación un rato antes de acostarse.',
      'Apagar la televisión y guardar las pantallas.',
      'Dejar una pequeña luz quitamiedos si eso tranquiliza al niño.',
    ],
  },
  {
    title: 'Un baño templado y tranquilo',
    steps: [
      'Un baño templado, sin juegos demasiado excitantes, si a tu hijo o hija le gusta.',
      'Comprobar la temperatura del agua con el codo antes de meterlo.',
      'No dejar nunca a un niño solo en el baño, ni siquiera un instante.',
      'Seguir con el pijama en una habitación cálida y con luz tenue.',
    ],
  },
  {
    title: 'Nana o música suave',
    steps: [
      'Cantar siempre la misma nana, o poner música suave a bajo volumen.',
      'Mecerlo suavemente en brazos si a tu bebé le gusta.',
      'Después, acostar al bebé boca arriba en su cuna.',
    ],
  },
  {
    title: 'La hora del cuento',
    steps: [
      'Leer uno o dos cuentos cortos, siempre en el mismo sitio.',
      'Dejar que el niño elija el libro entre dos propuestas.',
      'Terminar con una palabra o un gesto ritual («Buenas noches, hasta mañana»).',
    ],
  },
  {
    title: 'Para ti también',
    steps: [
      'Si sientes que aumenta la tensión, deja al bebé en un lugar seguro en su cuna y tómate unos minutos para respirar.',
      'Turnarse con otro adulto cuando sea posible.',
      'No existe la noche perfecta: algunas noches serán más difíciles, y es normal.',
    ],
  },
];

export const SAFE_SLEEP_ES: string[] = [
  'Acuesta al bebé boca arriba, en plano, por la noche y en cada siesta; ni boca abajo ni de lado.',
  'Que duerma en su propia cuna, en la habitación de los padres, idealmente hasta los 6 meses aproximadamente; se desaconseja compartir la cama de los padres.',
  'Un colchón firme, de las medidas de la cuna, sin huecos a los lados; no añadas un colchón en una cuna de viaje.',
  'Ni edredón, manta, almohada, protector de cuna ni peluche grande: mejor un saco de dormir adaptado a su talla.',
  'Nada que pueda cubrirle la cara o rodearle el cuello (ni collar, ni cordón de chupete).',
  'Ni posicionadores, cojines ni toallas enrolladas para mantenerlo en una postura.',
  'Una habitación entre 18 y 20 °C, ventilada cada día; evita abrigarlo demasiado: su nuca no debe estar húmeda.',
  'Nada de humo de tabaco cerca del bebé, ni en la habitación ni en el coche.',
  'No te duermas nunca con el bebé en un sofá o en un sillón.',
  'Si estás muy cansado o cansada, o tomas un medicamento que da sueño, vuelve a acostar al bebé en su cuna antes de dormirte.',
  'La silla portabebés es para el coche: no sustituye a la cuna.',
  'No des nunca un medicamento para hacer dormir a un bebé, y no lo sacudas nunca.',
];

export const QUESTIONS_FOR_PRO_ES: string[] = [
  '¿Cuántos despertares por noche son habituales a su edad?',
  '¿Cuántas horas de sueño cada 24 horas son habituales a su edad, siestas incluidas?',
  '¿Siguen siendo útiles para él o ella las tomas o biberones nocturnos?',
  '¿Cómo saber si come lo suficiente? ¿Puede revisar su curva de peso?',
  '¿Cómo ayudarle a distinguir el día de la noche?',
  '¿Qué hacer cuando llora en el momento de dormirse?',
  '¿Son habituales sus ronquidos, su respiración o sus movimientos durante el sueño?',
  '¿Es adecuado cómo duerme ahora (cuna, saco de dormir, temperatura de la habitación)?',
  '¿A partir de cuándo y cómo plantearse que duerma en su propia habitación?',
  '¿Qué signos deben hacerme llamar por la noche, y a quién llamar?',
  'Estoy muy cansado o cansada: ¿qué ayudas existen para nosotros, los padres?',
];

export const SEEK_HELP_NOW_ES: string[] = [
  'Bebé de menos de 3 meses con fiebre (38 °C o más): acude a urgencias sin esperar, aunque parezca estar bien.',
  'Dificultad para respirar: respiración rápida o irregular, pausas respiratorias, aleteo nasal, hundimiento entre las costillas, labios azulados: llama al 15.',
  'Bebé inusualmente somnoliento, flojo, que reacciona poco o que sufre un desmayo: llama al 15.',
  'Rechazo total a beber (pecho o biberón), o signos de deshidratación: llama al 15 o acude a urgencias.',
  'Pequeñas manchas rojas en la piel que no desaparecen al presionarlas, o palidez marcada: llama al 15.',
  'Convulsiones o movimientos anormales: protege al niño, colócalo de lado y llama al 15.',
  'Fiebre por encima de 40 °C, o fiebre con rigidez de nuca, vómitos repetidos o dolor de cabeza intenso: acude a urgencias.',
  'Llanto inusual, quejidos o cualquier comportamiento que te parezca anormal o preocupante: ante la duda, llama al 15.',
  'Bebé que ya no respira: llama inmediatamente al 15 o al 112, y no lo sacudas.',
  'Si sientes que podrías sacudir o hacer daño a tu bebé: déjalo boca arriba en su cuna, sal de la habitación y llama al 119 (24 h/24) o a alguien cercano.',
  'Si tienes pensamientos de hacerte daño o de dejar de estar aquí: llama al 3114 (gratuito, 24 h/24).',
];
