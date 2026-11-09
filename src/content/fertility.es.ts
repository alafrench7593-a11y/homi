/** Parcours fertilité — versión en español (misma forma que la francesa; solo cambian los textos mostrados). */
import type { FertilityJourney } from '@/lib/types-fertility';
import type { MethodInfo, ReminderPreset } from './fertility';

export const TTC_DISCLAIMER_ES =
  'Las fechas de ovulación y de ventana fértil son estimaciones calculadas a partir de lo que registras. Pueden ayudarte a orientarte, pero nunca garantizan un embarazo.';

export const AVOID_DISCLAIMER_ES =
  'Un embarazo sigue siendo posible en cualquier momento del ciclo, incluso fuera de la ventana fértil estimada y durante la regla. Este calendario no es un método anticonceptivo: para evitar un embarazo, se necesita una anticoncepción adecuada.';

export const AVOID_NO_SAFE_DAYS_ES =
  'Ningún día se presenta aquí como «seguro»: la ovulación puede adelantarse o retrasarse de un ciclo a otro, y los espermatozoides pueden sobrevivir hasta 5 días.';

export const TIMING_INFO_ES: { title: string; text: string }[] = [
  {
    title: 'Relaciones regulares',
    text: 'Tener relaciones cada 1 a 2 días durante la ventana fértil estimada —y, en general, a lo largo de todo el ciclo— puede aumentar las probabilidades de concepción, sin necesidad de planificarlo todo.',
  },
  {
    title: 'Los días previos a la ovulación estimada',
    text: 'Los espermatozoides pueden sobrevivir hasta 5 días, mientras que el óvulo solo vive unas 24 horas: los 2 a 3 días previos a la ovulación estimada suelen ser aquellos en los que las probabilidades pueden ser más altas.',
  },
  {
    title: 'Ninguna garantía',
    text: 'Incluso en buenas condiciones, a menudo se necesitan varios meses para concebir. Estas referencias no garantizan un embarazo y no sustituyen la opinión de un profesional.',
  },
  {
    title: 'Cuidar de la pareja',
    text: 'El calendario puede volverse pesado. Es totalmente posible no registrar nada algunos meses: lo que cuenta es tu ritmo.',
  },
];

export const EXAMS_INTRO_ES =
  'Esta información te ayuda a preparar una conversación con un profesional. No permite hacer un diagnóstico ni sustituye una consulta: solo un profesional puede valorar tu situación y decidir qué pruebas son útiles.';

export const WHEN_TO_TALK_ES: string[] = [
  'Después de 12 meses de relaciones regulares sin anticoncepción y sin embarazo, antes de los 35 años.',
  'Después de 6 meses a partir de los 35 años.',
  'Antes si tienes ciclos muy irregulares o ausentes, reglas muy dolorosas, un antecedente conocido (endometriosis, SOP, infección genital, cirugía pélvica, tratamiento contra un cáncer…) o una dificultad conocida en tu pareja.',
  'En cualquier momento si tienes una pregunta o una preocupación: nunca es demasiado pronto para hablarlo.',
];

export const WHO_TO_SEE_ES: string[] = [
  'Tu médico de cabecera, un o una ginecóloga, o una matrona: pueden hacer una primera valoración y derivarte si hace falta.',
  'Un centro de reproducción asistida (AMP), por derivación de un profesional.',
  'Un centro de salud sexual (antes llamado planificación familiar) para cualquier pregunta sobre la vida sexual y afectiva.',
];

export const POSSIBLE_EXAMS_ES: { title: string; text: string }[] = [
  { title: 'Una entrevista y una exploración clínica', text: 'Tiempo que lleváis intentándolo, regularidad de los ciclos, antecedentes, tratamientos, estilo de vida: suele ser el punto de partida.' },
  { title: 'Un estudio hormonal mediante análisis de sangre', text: 'A veces se pide en días concretos del ciclo, para comprender mejor el funcionamiento de los ovarios.' },
  { title: 'Una ecografía pélvica', text: 'Para observar el útero y los ovarios.' },
  { title: 'Una prueba de permeabilidad de las trompas', text: 'Por ejemplo, una histerosalpingografía o una histerosonografía, según el criterio del profesional.' },
  { title: 'Un seminograma para la pareja', text: 'La fertilidad concierne a los dos miembros de la pareja: el análisis del semen suele formar parte del primer estudio de una pareja.' },
  { title: 'Serologías y comprobación de las vacunas', text: 'Útiles antes de un embarazo, haya o no dificultades.' },
];

export const EXAMS_FOOTER_ES =
  'Algunas pruebas y tratamientos están cubiertos por la Assurance maladie (seguro de salud francés), bajo ciertas condiciones. Tu profesional podrá indicarte lo que se adapta a tu situación.';

export const CONTRACEPTION_INTRO_ES =
  'Referencias neutras para comparar los métodos. La elección se hace con un médico, una matrona o en un centro de salud sexual, según tu salud, tus preferencias y tu vida. Las cifras de eficacia indican el número aproximado de embarazos por cada 100 personas durante un año de uso habitual (con los olvidos y errores de la vida real).';

export const CONTRACEPTION_METHODS_ES: MethodInfo[] = [
  {
    kind: 'pill', title: 'Píldora', summary: 'Comprimido que se toma cada día, combinado (estrógeno y progestágeno) o solo de progestágeno.',
    typicalUse: 'Unos 7 embarazos por cada 100 personas al año con un uso habitual (menos de 1 con un uso perfecto).',
    howItWorks: 'Actúa principalmente bloqueando la ovulación (o modificando el moco cervical en algunas píldoras de solo progestágeno).',
    goodToKnow: ['Con receta de un médico o de una matrona.', 'En caso de olvido, vómitos o diarrea: sigue el prospecto y pide consejo a un farmacéutico.', 'Algunos medicamentos pueden reducir su eficacia: menciona siempre tu anticoncepción.'],
    reminder: 'daily',
  },
  {
    kind: 'iud_copper', title: 'DIU de cobre', summary: 'Pequeño dispositivo colocado en el útero, sin hormonas.',
    typicalUse: 'Menos de 1 embarazo por cada 100 personas al año.',
    howItWorks: 'El cobre inactiva los espermatozoides.',
    goodToKnow: ['Lo coloca y lo retira un médico o una matrona.', 'Duración de acción de 5 a 10 años según el modelo.', 'Puede hacer que las reglas sean más abundantes en algunas personas.', 'También es adecuado para personas que nunca han tenido hijos.'],
    reminder: 'once', renewalYears: 5,
  },
  {
    kind: 'iud_hormonal', title: 'DIU hormonal', summary: 'Dispositivo colocado en el útero que libera un progestágeno.',
    typicalUse: 'Menos de 1 embarazo por cada 100 personas al año.',
    howItWorks: 'Espesa el moco cervical y adelgaza la mucosa del útero.',
    goodToKnow: ['Lo coloca y lo retira un médico o una matrona.', 'Duración de acción de 3 a 8 años según el modelo.', 'Las reglas suelen volverse más ligeras, a veces desaparecen.'],
    reminder: 'once', renewalYears: 5,
  },
  {
    kind: 'implant', title: 'Implante', summary: 'Pequeña varilla colocada bajo la piel del brazo, que libera un progestágeno.',
    typicalUse: 'Menos de 1 embarazo por cada 100 personas al año.',
    howItWorks: 'Bloquea la ovulación.',
    goodToKnow: ['Lo coloca y lo retira un médico o una matrona, con anestesia local.', 'Eficaz durante 3 años.', 'Los sangrados pueden volverse irregulares.'],
    reminder: 'once', renewalYears: 3,
  },
  {
    kind: 'patch', title: 'Parche', summary: 'Parche pegado en la piel, que libera hormonas.',
    typicalUse: 'Unos 7 embarazos por cada 100 personas al año con un uso habitual.',
    howItWorks: 'Bloquea la ovulación, como la píldora combinada.',
    goodToKnow: ['Con receta.', 'Un parche por semana durante 3 semanas y luego una semana sin parche (según el prospecto).', 'Si se despega o hay retraso, sigue el prospecto y pide consejo a un farmacéutico.'],
    reminder: 'weekly',
  },
  {
    kind: 'ring', title: 'Anillo vaginal', summary: 'Anillo flexible colocado en la vagina, que libera hormonas.',
    typicalUse: 'Unos 7 embarazos por cada 100 personas al año con un uso habitual.',
    howItWorks: 'Bloquea la ovulación.',
    goodToKnow: ['Con receta.', 'Se deja colocado 3 semanas y luego una semana sin anillo (según el prospecto).', 'Te lo colocas y te lo retiras tú misma.'],
    reminder: 'once',
  },
  {
    kind: 'injection', title: 'Inyección', summary: 'Inyección de un progestágeno, que se repite regularmente.',
    typicalUse: 'Unos 4 embarazos por cada 100 personas al año con un uso habitual.',
    howItWorks: 'Bloquea la ovulación.',
    goodToKnow: ['Con receta, la pone un profesional.', 'Se repite aproximadamente cada 3 meses, en la fecha que indique tu profesional.', 'La fertilidad puede tardar varios meses en volver tras dejarla.'],
    reminder: 'once',
  },
  {
    kind: 'condom', title: 'Preservativo externo', summary: 'Funda que se coloca sobre el pene en erección, de un solo uso.',
    typicalUse: 'Unos 13 embarazos por cada 100 personas al año con un uso habitual.',
    howItWorks: 'Impide que el semen entre en la vagina.',
    goodToKnow: ['Junto con el preservativo interno, es el único método que también protege de las infecciones de transmisión sexual (ITS).', 'En Francia, algunos preservativos son gratuitos en la farmacia para menores de 26 años, sin receta.', 'Si se rompe o se desliza, piensa en la anticoncepción de urgencia.'],
  },
  {
    kind: 'internal_condom', title: 'Preservativo interno', summary: 'Funda que se coloca en la vagina, de un solo uso.',
    typicalUse: 'Unos 21 embarazos por cada 100 personas al año con un uso habitual.',
    howItWorks: 'Impide que el semen entre en el útero.',
    goodToKnow: ['También protege de las ITS.', 'Puede colocarse unas horas antes de la relación.'],
  },
  {
    kind: 'diaphragm', title: 'Diafragma y capuchón cervical', summary: 'Copa que se coloca en el fondo de la vagina antes de la relación.',
    typicalUse: 'Unos 17 embarazos por cada 100 personas al año con un uso habitual.',
    howItWorks: 'Bloquea la entrada del útero, a menudo con un espermicida.',
    goodToKnow: ['La elección de la talla y el aprendizaje se hacen con un profesional.', 'Debe permanecer colocado varias horas después de la relación (según el prospecto).', 'No protege de las ITS.'],
  },
  {
    kind: 'sterilisation', title: 'Esterilización (ligadura de trompas, vasectomía)', summary: 'Intervención quirúrgica para las personas que ya no desean tener hijos.',
    typicalUse: 'Menos de 1 embarazo por cada 100 personas al año.',
    howItWorks: 'Impide el encuentro del óvulo con los espermatozoides.',
    goodToKnow: ['Debe considerarse definitiva.', 'En Francia, reservada a personas mayores de edad, con un plazo de reflexión de 4 meses tras la primera consulta.', 'Tras una vasectomía, sigue siendo necesaria otra anticoncepción hasta el control del semen.'],
  },
  {
    kind: 'natural', title: 'Métodos llamados «naturales»', summary: 'Observación del ciclo (temperatura, moco, calendario) o marcha atrás.',
    typicalUse: 'Con un uso habitual, unos 20 a 25 embarazos por cada 100 personas al año: son los métodos menos eficaces.',
    howItWorks: 'Evitar las relaciones, o protegerlas, durante el periodo fértil estimado; o retirar el pene antes de la eyaculación.',
    goodToKnow: ['Requieren aprendizaje, ciclos regulares y mucho rigor.', 'El líquido preeyaculatorio puede contener espermatozoides.', 'Una aplicación de seguimiento del ciclo, incluida esta, no es un método anticonceptivo.', 'No protegen de las ITS.'],
  },
];

export const CONTRACEPTION_FOOTER_ES =
  'En Francia, para menores de 26 años, muchos anticonceptivos están cubiertos al 100 % por la Assurance maladie. Fuente útil: choisirsacontraception.fr (Santé publique France).';

export const EMERGENCY_INTRO_ES =
  'Tras una relación sin anticoncepción, un olvido de la píldora o un preservativo que se ha deslizado o roto: la anticoncepción de urgencia puede evitar un embarazo. Cuanto antes se tome, más eficaz es.';

export const EMERGENCY_OPTIONS_ES: { title: string; delay: string; text: string }[] = [
  {
    title: 'Píldora de levonorgestrel',
    delay: 'Lo antes posible, como máximo 72 horas (3 días) después de la relación.',
    text: 'Disponible en la farmacia sin receta.',
  },
  {
    title: 'Píldora de acetato de ulipristal',
    delay: 'Lo antes posible, hasta 120 horas (5 días) después de la relación.',
    text: 'Disponible en la farmacia sin receta.',
  },
  {
    title: 'DIU de cobre',
    delay: 'Lo coloca un médico o una matrona hasta 5 días después de la relación.',
    text: 'Es la anticoncepción de urgencia más eficaz; después puede quedarse colocado como anticoncepción habitual.',
  },
];

export const EMERGENCY_FACTS_ES: string[] = [
  'En Francia, la píldora de urgencia se dispensa en la farmacia sin receta y gratuitamente a todas las personas, mayores o menores de edad, desde el 1 de enero de 2023.',
  'Las menores pueden obtenerla de forma confidencial, en la farmacia, a través de la enfermera escolar o en un centro de salud sexual.',
  'El o la farmacéutica puede aconsejarte sobre la píldora adecuada, las interacciones con tus tratamientos y la reanudación de tu anticoncepción habitual.',
  'La anticoncepción de urgencia no protege en las relaciones siguientes y no sustituye una anticoncepción habitual.',
  'Si tu regla se retrasa o es inusual, se aconseja hacer una prueba de embarazo (unas 3 semanas después de la relación).',
];

export const EMERGENCY_CONTACTS_ES: { label: string; phone: string; description: string }[] = [
  { label: 'Teléfono nacional (Francia): sexualidad, anticoncepción, IVE', phone: '0800081111', description: 'Gratuito y anónimo.' },
  { label: 'Fil Santé Jeunes', phone: '0800235236', description: 'Para jóvenes de 12 a 25 años, gratuito y anónimo.' },
];

export const QUESTION_SUGGESTIONS_ES: Record<FertilityJourney, string[]> = {
  postpartum: [
    '¿Lo que siento desde el parto merece un seguimiento?',
    'Duermo mal incluso cuando podría descansar: ¿qué opinas?',
    '¿Cuándo y cómo empezar la rehabilitación del suelo pélvico?',
    '¿Son esperables estos dolores o hay que examinarlos?',
    '¿A quién puedo acudir para hablar de mi estado de ánimo?',
  ],
  ttc: [
    'En nuestra situación, ¿al cabo de cuánto tiempo hay que consultar?',
    '¿Hay que tomar un suplemento antes del embarazo (ácido fólico)?',
    '¿Están al día mis vacunas y serologías?',
    '¿Son compatibles mis tratamientos actuales con un embarazo?',
    '¿Te parecen regulares mis ciclos?',
    '¿Qué pruebas podrían ser útiles para cada uno de nosotros?',
    '¿Debo adaptar mi alimentación, mi actividad, mi consumo de alcohol o de tabaco?',
  ],
  avoid: [
    '¿Qué método se adapta a mi salud y a mi estilo de vida?',
    '¿Qué hacer en caso de olvido o retraso?',
    '¿Qué efectos secundarios son posibles y cuándo hay que preocuparse?',
    '¿Es compatible mi anticoncepción con mis otros tratamientos?',
    '¿Cómo conseguir rápidamente una anticoncepción de urgencia?',
    '¿Cómo cambiar de método sin un periodo sin protección?',
    '¿Cómo protegerme también de las infecciones de transmisión sexual?',
  ],
  pregnancy: [
    '¿Lo que siento ahora mismo es esperable en esta etapa?',
    '¿Cuáles son las próximas pruebas y en qué fecha?',
    '¿Qué signos deben hacerme llamar a la maternidad sin esperar?',
    '¿Puedo seguir con mi actividad física y mi trabajo como hasta ahora?',
    '¿Qué alimentos o medicamentos debo evitar?',
  ],
  child: [
    '¿Te parece que su crecimiento y su desarrollo están dentro de lo esperado?',
    '¿Qué vacunas están previstas y en qué fecha?',
    'Para este síntoma, ¿qué signos deben hacerme volver a consultar o llamar al 15?',
    '¿Su sueño y su alimentación son adecuados para su edad?',
    '¿Hay que plantearse un estudio o un especialista?',
  ],
  general: [
    '¿Te parecen habituales mis reglas o mi ciclo?',
    '¿Están al día mis pruebas de cribado?',
    '¿Están al día mis vacunas?',
    '¿Este síntoma merece una prueba complementaria?',
    '¿A quién acudir para hablar de mi estado de ánimo o de mi cansancio?',
  ],
};

export const TTC_REMINDER_PRESETS_ES: ReminderPreset[] = [
  { key: 'bbt', title: 'Tomarme la temperatura', discreetTitle: 'Recordatorio de la mañana', kind: 'daily', category: 'tracking', hint: 'Cada mañana al despertar, antes de levantarte.' },
  { key: 'ovulation_test', title: 'Test de ovulación', discreetTitle: 'Pequeño recordatorio', kind: 'daily', category: 'tracking', hint: 'A la misma hora cada día, según el prospecto del test.' },
  { key: 'supplement', title: 'Mi suplemento', discreetTitle: 'Pequeño recordatorio', kind: 'daily', category: 'medication', hint: 'Si un profesional te ha aconsejado un suplemento.' },
  { key: 'period', title: 'Anotar mi regla', discreetTitle: 'Acuérdate de anotar', kind: 'once', category: 'tracking', hint: 'Hacia la fecha estimada de la próxima regla.' },
  { key: 'pregnancy_test', title: 'Test de embarazo', discreetTitle: 'Pequeño recordatorio', kind: 'once', category: 'tracking', hint: 'Un test es más fiable a partir del día en que se espera la regla (estimación).' },
];

export const AVOID_REMINDER_PRESETS_ES: ReminderPreset[] = [
  { key: 'pill', title: 'Mi píldora', discreetTitle: 'Recordatorio diario', kind: 'daily', category: 'medication', hint: 'A una hora fija cada día.' },
  { key: 'patch', title: 'Cambiar mi parche', discreetTitle: 'Recordatorio semanal', kind: 'weekly', category: 'medication', hint: 'El mismo día cada semana, siguiendo el prospecto (semana sin parche).' },
  { key: 'ring', title: 'Mi anillo', discreetTitle: 'Pequeño recordatorio', kind: 'once', category: 'medication', hint: 'Fecha de retirada o de colocación indicada en el prospecto.' },
  { key: 'injection', title: 'Mi inyección', discreetTitle: 'Cita por programar', kind: 'once', category: 'medication', hint: 'Fecha indicada por tu profesional (aproximadamente cada 3 meses).' },
  { key: 'renewal', title: 'Renovar mi implante o DIU', discreetTitle: 'Cita por programar', kind: 'once', category: 'custom', hint: 'Unas semanas antes de la fecha de fin de eficacia, para pedir cita.' },
  { key: 'treatment', title: 'Mi tratamiento prescrito', discreetTitle: 'Recordatorio diario', kind: 'daily', category: 'medication', hint: 'Un tratamiento ya prescrito, a la hora indicada por tu profesional. La aplicación no calcula ni modifica ninguna dosis.' },
  { key: 'appointment', title: 'Mi cita', discreetTitle: 'Cita por programar', kind: 'once', category: 'custom', hint: 'Consulta, colocación o retirada de un dispositivo, renovación: en la fecha de tu cita.' },
  { key: 'prescription', title: 'Renovar mi receta', discreetTitle: 'Cita por programar', kind: 'once', category: 'custom', hint: 'Antes de que se acabe tu última caja o blíster.' },
];
