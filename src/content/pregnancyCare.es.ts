/** Contenidos de embarazo en español (misma forma, mismas claves y mismo orden que el francés de pregnancyCare.ts). */
import { S as L } from './articles/library/sources';
import type { ArticleSource } from './articles/library/types';
import type { CareSources, FoodSection, Nutrient, SafetyContact, SymptomCare, SymptomKey } from './pregnancyCare';

export function careES(FR: CareSources) {
  const CARE_SOURCES: CareSources = {
    ameliProgramme1: { ...FR.ameliProgramme1, label: 'ameli.fr — Embarazo: el programa de seguimiento y la primera consulta' },
    ameliMensuel: { ...FR.ameliMensuel, label: 'ameli.fr — Seguimiento mensual del embarazo a partir del 4.º mes' },
    santeCalendrier: { ...FR.santeCalendrier, label: 'Santé.fr — El calendario del embarazo' },
    petitsMaux: { ...FR.petitsMaux, label: '1000 premiers jours (Santé publique France) — Las pequeñas molestias del embarazo' },
    preeclampsie: { ...FR.preeclampsie, label: 'ameli.fr — Preeclampsia: síntomas, diagnóstico y evolución' },
    consult8: { ...FR.consult8, label: 'Santé.fr — Embarazo: la consulta del 8.º mes' },
    mois9: { ...FR.mois9, label: 'Santé.fr — 9.º mes, seguimiento del embarazo semana a semana' },
    rgo: { ...FR.rgo, label: 'Santé.fr — Ardor de estómago y reflujo gastroesofágico' },
    jambesLourdes: { ...FR.jambesLourdes, label: 'ameli.fr — Piernas pesadas: síntomas, causas y factores favorecedores' },
    cholestase: { ...FR.cholestase, label: 'CNGOF — Colestasis gravídica, recomendaciones para la práctica clínica (2023)' },
    ameliAliments: { ...FR.ameliAliments, label: 'ameli.fr — Alimentos que evitar y precauciones de higiene durante el embarazo' },
    ameliAlimentation: { ...FR.ameliAlimentation, label: 'ameli.fr — Adaptar la alimentación durante el embarazo' },
    listeriose: { ...FR.listeriose, label: 'Santé.fr — Listeriosis durante el embarazo: ¿qué alimentos evitar?' },
    toxoplasmose: { ...FR.toxoplasmose, label: 'Santé.fr — Toxoplasmosis en el embarazo: ¿cómo evitarla?' },
  };
  const S = CARE_SOURCES;
  const DOUBT = 'Si tienes dudas, llama a tu matrona, a tu médico o a tu maternidad: no molestas.';

  const SYMPTOM_CARE: Record<SymptomKey, SymptomCare> = {
    nausea: {
      frequentSA: [4, 16],
      help: ['Comer a menudo, en pequeñas cantidades, sin pasar mucho tiempo en ayunas.', 'Elegir lo que te apetezca, evitando los platos grasos, fritos o picantes.', 'Beber con regularidad, a pequeños sorbos.', 'Levantarte despacio, ventilar, evitar los olores que provocan las náuseas.', 'Descansar: el cansancio puede empeorarlas.'],
      ask: ['Si las náuseas dificultan tu vida diaria: existen soluciones, coméntalo con tu médico o tu matrona.', 'Ningún medicamento ni producto «natural» sin el consejo de un profesional.'],
      sources: [L.ameliNausees, L.ameliNauseesConsult],
    },
    vomiting: {
      frequentSA: [4, 16],
      help: ['Beber a menudo, en pequeñas cantidades, para evitar la deshidratación.', 'Repartir las comidas y elegir lo que mejor toleres.'],
      ask: ['Rápidamente si ya no retienes los líquidos, pierdes peso, tienes mucha sed, la boca seca, orina oscura, fiebre o un cansancio inusual.', 'Los vómitos muy intensos y persistentes (hiperémesis gravídica) necesitan un tratamiento rápido.'],
      sources: [L.ameliNausees, L.ameliNauseesConsult],
    },
    fatigue: {
      frequentSA: [4, 14],
      help: ['Descansar en cuanto puedas y aceptar la ayuda que te ofrezcan.', 'Mantener horarios de sueño regulares.', 'Una actividad suave (caminar, nadar, gimnasia suave) si tu situación lo permite.'],
      ask: ['Si el cansancio es intenso, se instala o viene con falta de aire, palidez o mareos: coméntalo con tu profesional.'],
      sources: [S.petitsMaux, L.ameliActive],
    },
    dizziness: {
      frequentSA: null,
      help: ['Levantarte despacio, sentarte o tumbarte de lado en cuanto la cabeza te dé vueltas.', 'Beber con regularidad y no pasar mucho tiempo en ayunas.'],
      ask: ['Rápidamente en caso de desmayo, pérdida de conocimiento, mareos que se repiten o que vienen con dolor de cabeza, alteraciones de la vista o falta de aire.'],
      sources: [L.ameliMensuel],
    },
    headache: {
      frequentSA: null,
      help: ['Descansar en un lugar tranquilo, beber con regularidad.', 'Ningún medicamento sin consejo: la aspirina y los antiinflamatorios deben evitarse, en particular durante los últimos meses.'],
      ask: ['Urgentemente a partir de las 20 semanas de amenorrea si el dolor de cabeza viene con alteraciones de la vista (manchas, destellos, visión borrosa), zumbidos en los oídos, un dolor en barra en la parte alta del vientre o una hinchazón repentina de la cara o las manos.'],
      sources: [S.preeclampsie, S.consult8, S.petitsMaux],
    },
    reflux: {
      frequentSA: [20, 41],
      help: ['Hacer comidas más pequeñas y más frecuentes.', 'Evitar tumbarte justo después de comer; elevar la cabecera de la cama puede ayudar.', 'Identificar los alimentos que empeoran el ardor.'],
      ask: ['Si el ardor es frecuente o te impide dormir: coméntalo con tu profesional o tu farmacéutico antes de tomar cualquier medicamento.'],
      sources: [S.rgo, L.ameliPremiersSignes],
    },
    constipation: {
      frequentSA: null,
      help: ['Beber con regularidad a lo largo del día.', 'Elegir alimentos ricos en fibra: verduras, frutas, legumbres, féculas integrales.', 'Moverte un poco cada día si es posible.'],
      ask: ['Si el estreñimiento dura, es doloroso o viene con sangrado: coméntalo con tu profesional. Ningún laxante sin consejo.'],
      sources: [S.ameliAlimentation, S.petitsMaux],
    },
    bloating: {
      frequentSA: null,
      help: ['Comer despacio, repartir las comidas.', 'Identificar los alimentos que más te hinchan.', 'Un paseo después de comer puede ayudar.'],
      ask: ['Rápidamente si el vientre se pone duro y doloroso, o si aparecen dolores que se instalan.'],
      sources: [L.ameliPremiersSignes],
    },
    breasts: {
      frequentSA: [4, 14],
      help: ['Un sujetador cómodo, adaptado a la talla que va cambiando.'],
      ask: ['Si aparece un enrojecimiento, un bulto o un dolor localizado: coméntalo con tu profesional.'],
      sources: [L.ameliPremiersSignes],
    },
    back_pain: {
      frequentSA: [20, 41],
      help: ['Una actividad suave: caminar, nadar, gimnasia suave, yoga prenatal.', 'Los masajes de espalda y piernas pueden aliviar.', 'Evitar cargar peso y agacharte doblando las rodillas.'],
      ask: ['Si el dolor es intenso, vuelve en oleadas regulares (como contracciones) o viene con fiebre o escozor al orinar: consulta rápidamente.'],
      sources: [S.petitsMaux, L.ameliActive],
    },
    pelvic_pain: {
      frequentSA: [14, 41],
      help: ['Descansar, cambiar de postura, evitar estar mucho tiempo de pie.'],
      ask: ['Rápidamente si el dolor es fuerte, de un solo lado, con sangrado, fiebre, o si vuelve de forma regular.'],
      sources: [L.ameliSaign1, L.ameliMensuel],
    },
    contractions: {
      frequentSA: [20, 41],
      help: ['Descansar y anotar su frecuencia y su duración.'],
      ask: ['Durante el embarazo se describen contracciones poco dolorosas, irregulares y poco numerosas (menos de 10 al día).', 'Contacta sin demora con tu maternidad si se vuelven dolorosas, se acercan con el paso de las horas o vienen con sangrado o pérdida de líquido.'],
      sources: [S.ameliMensuel, S.consult8],
    },
    discharge: {
      frequentSA: null,
      help: ['Durante el embarazo se describen a menudo flujos blanquecinos, sin olor ni picor.'],
      ask: ['Rápidamente en caso de olor fuerte, picor, escozor o color inusual.', 'Ve a la maternidad si sale líquido de forma continua: puede indicar una rotura de la bolsa de las aguas.'],
      sources: [S.consult8, S.mois9],
    },
    bleeding: {
      frequentSA: null,
      help: ['Anota la hora, la cantidad y el color, y lo que lo acompaña (dolores, contracciones).'],
      ask: ['En el 2.º o 3.er trimestre, cualquier sangrado debe valorarse de urgencia en la maternidad, aunque no duela.', 'En el 1.er trimestre: consulta rápidamente; de urgencia (15 o 112) si el sangrado es abundante, con mareo, dolor en la parte baja del vientre o fiebre.'],
      sources: [L.ameliSaign1, L.ameliSaign23, S.consult8],
    },
    itching: {
      frequentSA: null,
      help: ['Una piel bien hidratada y ropa holgada pueden ayudar con los picores leves.'],
      ask: ['Consulta rápidamente si el picor es intenso, sobre todo en las palmas de las manos y las plantas de los pies, o por la noche, en particular en el 3.er trimestre: puede ser necesario un análisis.'],
      sources: [S.cholestase],
    },
    breathless: {
      frequentSA: [28, 41],
      help: ['Bajar el ritmo, hacer pausas, mantenerte erguida para dejar espacio a los pulmones.'],
      ask: ['Rápidamente si la falta de aire aparece en reposo, empeora o viene con dolor en el pecho, palpitaciones o mareo (llama al 15 en caso de dolor en el pecho).'],
      sources: [L.ameliMensuel],
    },
    swollen_legs: {
      frequentSA: [28, 41],
      help: ['Caminar, nadar, hacer gimnasia suave.', 'Elevar las piernas en reposo, evitar estar mucho tiempo de pie o sentada.'],
      ask: ['Rápidamente si una pantorrilla se hincha, se pone dura y duele, o si la cara y las manos se hinchan de repente con un aumento de peso rápido.'],
      sources: [S.petitsMaux, S.jambesLourdes, S.preeclampsie],
    },
    sleep: {
      frequentSA: null,
      help: ['Un momento tranquilo antes de acostarte, limitar la cafeína por la tarde-noche.', 'Dormir de lado, con un cojín bajo el vientre o entre las rodillas.'],
      ask: ['Si la falta de sueño te pesa o viene con tristeza o pérdida de interés: coméntalo con tu profesional.'],
      sources: [S.petitsMaux, L.nhsFatigueGrossesse],
    },
    mood: {
      frequentSA: null,
      help: ['Compartir lo que sientes con tu pareja o con una persona de confianza.', 'Cuidarte: descanso, comidas regulares, actividad suave.'],
      ask: ['Si la tristeza, el llanto o la irritabilidad duran más de dos semanas: coméntalo con tu matrona o tu médico.', 'Si tienes ideas de hacerte daño: llama al 3114 (gratuito, 24 h/24).'],
      sources: [L.ameliPsy, L.ameliAidePsy, S.petitsMaux],
    },
    anxiety: {
      frequentSA: null,
      help: ['Hablarlo: pareja, entorno, preparación al parto.', 'Respiración lenta, momentos de calma.'],
      ask: ['Si la ansiedad es constante, te impide dormir o hacer las cosas del día a día: coméntalo con tu matrona o tu médico. La entrevista prenatal precoz es un momento previsto para ello.', 'Si tienes ideas de hacerte daño: llama al 3114 (gratuito, 24 h/24).'],
      sources: [L.ameliPsy, L.ameliAidePsy],
    },
    movements: {
      frequentSA: null,
      help: ['Las sensaciones cambian con las semanas; al final del embarazo, el bebé, con menos espacio, puede moverse de otra manera.'],
      ask: ['Si notas que tu bebé se mueve menos de lo habitual, o ya no se mueve: contacta con tu maternidad sin esperar, de día o de noche.'],
      sources: [S.mois9],
    },
    other: {
      frequentSA: null,
      help: ['Anota cuándo empezó, con qué frecuencia y qué lo alivia o lo empeora: estas notas ayudan en la consulta.'],
      ask: [DOUBT],
      sources: [L.ameliMensuel],
    },
  };

  const SAFETY_CONTACTS: readonly SafetyContact[] = [
    { key: 'samu', label: 'SAMU (urgencias médicas)', phone: '15' },
    { key: 'eu', label: 'Urgencias (número europeo)', phone: '112' },
    { key: 'sms', label: 'Urgencias para personas sordas o con dificultades auditivas (SMS)', phone: '114' },
  ];

  const EAT_INTERESTING: FoodSection = {
    key: 'interesting',
    title: 'Las pautas del día a día',
    items: [
      { title: 'Frutas y verduras', text: 'Al menos cinco raciones al día, crudas bien lavadas o cocinadas.' },
      { title: 'Féculas y legumbres', text: 'En cada comida, dando preferencia a los cereales integrales y a las legumbres secas (lentejas, garbanzos, alubias).' },
      { title: 'Lácteos', text: 'Tres al día, pasteurizados (nada de leche cruda).' },
      { title: 'Carne, pescado o huevos', text: 'Una o dos veces al día, siempre bien cocinados.' },
      { title: 'Agua', text: 'A voluntad, a lo largo del día.' },
      { title: 'Ritmo', text: 'Tres comidas sin saltarte ninguna y, a partir del 2.º trimestre, un tentempié si lo necesitas.' },
    ],
    sources: [S.ameliAlimentation],
  };

  const EAT_AVOID: FoodSection = {
    key: 'avoid',
    title: 'Evitar o preparar con precaución',
    items: [
      { title: 'Alcohol', text: 'Totalmente desaconsejado durante todo el embarazo, sea cual sea la cantidad.' },
      { title: 'Quesos de leche cruda', text: 'Evitarlos, sobre todo los de pasta blanda, así como las cortezas de queso y los quesos rallados vendidos en bolsa.' },
      { title: 'Embutidos cocidos y productos al corte', text: 'Rillettes, patés, foie gras, productos en gelatina y alimentos servidos al corte: evitarlos.' },
      { title: 'Pescado y carne crudos o poco hechos', text: 'Sushi, tartar, ceviche, pescados ahumados o marinados, marisco crudo, surimi, tarama: evitarlos. Carne y pescado bien cocinados por dentro.' },
      { title: 'Semillas germinadas crudas', text: 'Evitarlas.' },
      { title: 'Algunos pescados', text: 'Pez espada, marlín, tiburón, lamprea: evitarlos. Atún, dorada, lucio y otros depredadores salvajes: limitarlos. Pescados de agua dulce (anguila, carpa…): como máximo una vez cada dos meses.' },
      { title: 'Soja y regaliz', text: 'Alimentos a base de soja desaconsejados por precaución (la salsa de soja sigue siendo posible de vez en cuando). Regaliz que evitar en todas sus formas.' },
      { title: 'Cafeína', text: 'Limitarla: la referencia citada por la Assurance Maladie es de 300 mg al día como máximo. Bebidas energéticas que evitar.' },
    ],
    sources: [S.ameliAliments, S.ameliAlimentation, S.listeriose],
  };

  const EAT_HYGIENE: FoodSection = {
    key: 'hygiene',
    title: 'Higiene y cocción',
    items: [
      { title: 'Frigorífico', text: 'A 4 °C como máximo, limpiado con regularidad. Respetar las fechas de caducidad y consumir rápido después de abrir.' },
      { title: 'Sobras', text: 'No más de 3 días, recalentadas hasta que estén calientes por todas partes.' },
      { title: 'Crudo y cocinado por separado', text: 'No poner en contacto la carne cruda, las verduras sin lavar y los alimentos listos para comer.' },
      { title: 'Lavado', text: 'Lavar bien las frutas, las verduras, las hierbas y los utensilios, y lavarte las manos antes de cocinar y después de tocar carne cruda.' },
      { title: 'Descongelación', text: 'En el frigorífico, nunca sobre la encimera.' },
      { title: 'Jardín y animales', text: 'Si no estás inmunizada contra la toxoplasmosis: trabajar en el jardín con guantes y evitar la arena del gato.' },
    ],
    sources: [S.ameliAliments, S.toxoplasmose],
  };

  const NUTRIENTS: Nutrient[] = [
    { key: 'iron', title: 'Hierro', why: 'Las necesidades aumentan, sobre todo al final del embarazo.', where: 'Legumbres secas, pescado, carne.', professional: 'Tu médico o tu matrona puede recetarte hierro si hace falta: sigue sus consejos.' },
    { key: 'calcium', title: 'Calcio', why: 'Útil para el esqueleto del bebé, sobre todo en el 3.er trimestre.', where: 'Lácteos pasteurizados, algunas aguas minerales ricas en calcio.', professional: 'Habla de tus costumbres (sin lácteos, por ejemplo) con tu profesional.' },
    { key: 'protein', title: 'Proteínas', why: 'Acompañan el crecimiento del bebé.', where: 'Carne, pescado, huevos bien cocinados, legumbres, lácteos.', professional: 'Si sigues una alimentación vegetariana o vegana, pide consejo a tu profesional.' },
    { key: 'fiber', title: 'Fibra', why: 'Ayuda al tránsito intestinal, que a menudo se ralentiza durante el embarazo.', where: 'Verduras, frutas, legumbres, féculas integrales.', professional: 'Si el estreñimiento dura, coméntalo antes de tomar un laxante.' },
    { key: 'b9', title: 'Vitamina B9 (folatos)', why: 'Importante al principio del embarazo para el desarrollo del sistema nervioso.', where: 'Verduras de hoja verde, legumbres.', professional: 'Al principio del embarazo, la alimentación sola no basta: es tu médico o tu matrona quien receta, si procede, un suplemento e indica su duración. La aplicación nunca lo recomienda.' },
  ];

  const SUPPLEMENT_NOTICE = 'La aplicación no recomienda ningún complemento alimenticio. Algunos contienen vitaminas o minerales nocivos en dosis altas: sigue los consejos del profesional que acompaña tu embarazo.';
  const NOT_ADVICE = 'Información general procedente de fuentes oficiales francesas, no un consejo médico personalizado.';
  const NUTRITION_SOURCES: ArticleSource[] = [S.ameliAlimentation, S.ameliAliments, S.listeriose, S.toxoplasmose, L.santeB9];

  return { CARE_SOURCES, SYMPTOM_CARE, SAFETY_CONTACTS, EAT_INTERESTING, EAT_AVOID, EAT_HYGIENE, NUTRIENTS, SUPPLEMENT_NOTICE, NOT_ADVICE, NUTRITION_SOURCES };
}
