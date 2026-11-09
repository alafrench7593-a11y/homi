/** « Je grandis » — textes affichés en espagnol (traduits depuis le français ; mêmes clés, mêmes âges, mêmes sources). */
import type { StepSource } from './steps';

type StepText = { title: string; what: string; play: string; safety: string; ask: string };
const T = (title: string, what: string, play: string, safety: string, ask: string): StepText => ({ title, what, play, safety, ask });

export const STEP_SOURCE_LABELS_ES: Record<StepSource, string> = {
  sf_etapes: 'Santé.fr (Santé publique France – 1000 premiers jours) — Las etapas del desarrollo del bebé',
  sf_lang_2_12: 'Santé.fr (mpedia) — Progresos del lenguaje de los 2 a los 12 meses',
  sf_lang_1_3: 'Santé.fr (mpedia) — Progresos del lenguaje de 1 a 3 años',
  mp_3_6: 'mpedia (Dr. Jacques Langue) — El desarrollo psicomotor entre los 3 y los 6 meses',
  mp_9_12: 'mpedia (Dr. Jacques Langue) — El desarrollo psicomotor entre los 9 y los 12 meses',
  sf_proprete: 'Santé.fr (mpedia, AFPA) — ¿Cómo aprenderá mi hijo a dejar el pañal?',
  sf_nuits: 'Santé.fr (mpedia, AFPA) — Ritmo de sueño y vigilia: ¿cuándo «dormirá toda la noche»?',
  sf_sieste: 'Santé.fr (mpedia, AFPA) — La siesta, el sueño diurno del niño',
  sf_diversification: 'Santé.fr (Manger Bouger) — Entre los 4 y los 6 meses: introducir los alimentos con suavidad',
  spf_diversification: 'Santé publique France — Pas à pas, votre enfant mange comme un grand (folleto)',
};

const FLOOR = 'Juega en el suelo, sobre una alfombra; nunca en una cama, un sofá o un cambiador sin tu mano sobre él.';
const SMALL = 'Mantén fuera de su alcance los objetos pequeños que caben en la boca (pilas de botón, imanes, canicas).';
const CALM = 'Nada que forzar: se propone, se observa y se vuelve a intentar otro día.';

export const STEP_TEXT_ES: Record<string, StepText> = {
  lifts_head: T('Levanta la cabeza boca abajo', 'Tumbado boca abajo y despierto, levanta la cabeza y luego los hombros para mirar a su alrededor.', 'Unos minutos boca abajo cuando esté bien despierto, frente a tu cara o a un juguete de colores.', `${FLOOR} Para dormir: siempre boca arriba.`, '¿Cuánto tiempo boca abajo, despierto, me aconseja a su edad?'),
  holds_head: T('Sostiene la cabeza', 'En brazos contra ti o sentado con apoyo, su cabeza se mantiene recta sin balancearse.', 'Llévalo mirando hacia delante unos instantes para que descubra la habitación.', 'Sigue sujetándole la nuca en los cambios rápidos de posición.', '¿Cómo llevarlo en brazos para que esté bien colocado?'),
  rolls_over: T('Se da la vuelta', 'Rueda de la espalda hacia un lado y luego pasa de boca arriba a boca abajo.', 'Pon un juguete un poco hacia un lado para invitarlo a girarse.', 'En cuanto se da la vuelta, puede caerse: nunca lo dejes solo en alto.', 'Si se pone boca abajo por la noche, ¿qué hago?'),
  sits_supported: T('Se sienta con apoyo', 'Con la espalda apoyada en un cojín o en ti, se mantiene sentado y se mira las manos y los juguetes.', 'Siéntalo entre tus piernas, con un juguete delante.', 'Rodéalo de cojines: todavía se cae con facilidad.', '¿Cuándo puedo sentarlo para jugar?'),
  sits_alone: T('Se sienta sin apoyo', 'Se mantiene bien sentado solo y usa las manos para jugar.', 'Juguetes a su alrededor para que se incline y recupere el equilibrio.', FLOOR, '¿Cómo ayudarle a ganar equilibrio?'),
  moves_around: T('Se desplaza', 'Se desplaza a su manera: reptando, a gatas, sobre el culete…', 'Un circuito de cojines en el suelo, una pelota que rueda para ir a buscarla.', 'Barreras en las escaleras, enchufes protegidos, productos de limpieza fuera de su alcance. El andador no se recomienda (caídas, quemaduras).', '¿Qué medidas de seguridad conviene tomar en casa?'),
  stands_up: T('Se pone de pie agarrándose', 'Se levanta agarrándose a los muebles y luego aprende a mantenerse de pie.', 'Un mueble bajo y estable con juguetes encima.', 'Fija a la pared los muebles que puedan volcarse.', '¿Necesita zapatos a esta edad?'),
  walks: T('Camina solo', 'Da sus primeros pasos solo y luego camina cada vez más lejos. Las edades varían mucho de un niño a otro.', 'Descalzo en casa sobre un suelo que no resbale; un correpasillos o un carrito para empujar.', 'Asegura escaleras, ventanas y piscina.', '¿Cómo acompañarlo en sus primeros pasos?'),
  climbs_stairs: T('Sube las escaleras', 'Sube los escalones, al principio a menudo a gatas, agarrándose.', 'Uno o dos escalones contigo al lado.', 'Siempre un adulto en la escalera; barrera arriba y abajo.', '¿A partir de cuándo puedo dejarle intentarlo solo?'),
  kicks_ball: T('Da patadas a un balón', 'Da una patada a un balón sin caerse.', 'Un balón ligero en el parque, pequeñas porterías con dos zapatos.', 'Elige un espacio despejado, lejos de la calle.', '¿Qué actividades físicas son adecuadas a su edad?'),
  grasps: T('Agarra un objeto', 'Agarra a propósito lo que tiene a su alcance y lo mantiene en la mano.', 'Un sonajero ligero o una anilla de tela delante de él.', SMALL, '¿Qué juguetes son adecuados para su edad?'),
  hand_to_hand: T('Pasa un objeto de una mano a la otra', 'Pasa un cubo o un juguete de una mano a la otra.', 'Dos cubos de tela, uno en cada mano; intercambiadlos por turnos.', SMALL, '¿Cómo animarle a usar las dos manos?'),
  empties_fills: T('Vacía y llena', 'Saca los objetos de una bolsa o de una caja y luego empieza a volver a meterlos.', 'Una cesta con pequeños objetos cotidianos y seguros (vasos, pañuelos, cucharas de madera).', SMALL, '¿Qué objetos cotidianos puede manipular sin peligro?'),
  smiles: T('Sonríe y te mira', 'Te mira a los ojos y sonríe.', 'Cara a cara, a 20–30 cm, háblale suavemente sonriendo.', CALM, '¿Qué me aconseja para comunicarme con él?'),
  reacts_voice: T('Reacciona a la voz', 'Hace gorgoritos y reacciona cuando le hablan.', 'Responde a sus sonidos y luego haz una pausa para dejarle «la palabra».', CALM, '¿Cómo saber si oye bien?'),
  makes_sounds: T('Hace sonidos', 'Vocaliza, hace gorgoritos y luego balbucea con sílabas como «ba-ba».', 'El juego de «cada uno su turno»: imita su sonido, añade otro, espera su respuesta.', 'Evita las pantallas: no sustituyen un intercambio real.', '¿Cómo ayudarle a balbucear?'),
  name: T('Reacciona a su nombre', 'Gira la cabeza o se detiene cuando lo llaman por su nombre.', 'Llámalo suavemente desde un lado de la habitación y luego desde el otro.', CALM, '¿Qué hago si tengo dudas sobre su audición?'),
  waves_bye: T('Dice «adiós» con la mano', 'Hace «palmitas» y dice «adiós» con la mano.', 'Canciones con gestos, como «Los cinco lobitos».', CALM, '¿Qué canciones con gestos puedo proponerle?'),
  points: T('Señala con el dedo', 'Extiende la mano o el índice hacia un objeto para mostrarlo o preguntar su nombre.', 'Nombra lo que señala; mirad juntos libros de imágenes.', CALM, '¿Cómo animarle a comunicarse?'),
  first_words: T('Dice sus primeras palabras', 'Aparecen las primeras palabras, a menudo «papá», «mamá», a veces deformadas.', 'Leed libros de imágenes nombrando cada imagen; cantad.', CALM, '¿Cómo ayudarle a enriquecer su vocabulario?'),
  understands_simple: T('Entiende frases sencillas', 'Entiende algunas frases sencillas del día a día («dame», «ven»).', 'Describe lo que haces durante el baño o las comidas.', CALM, '¿Cómo saber lo que entiende?'),
  says_words: T('Pronuncia algunas palabras', 'Dice varias palabras y pequeñas expresiones; entiende muchas más palabras de las que dice.', 'Repite lo que dice con la palabra correcta, sin corregirle; leed cuentos cortos.', CALM, '¿Qué hago si habla poco?'),
  two_words: T('Junta dos palabras', 'Empieza a juntar dos palabras («yo comer») y dice «yo» o su nombre.', 'Hazle preguntas para elegir («¿manzana o plátano?»).', CALM, '¿Cómo apoyar su lenguaje en el día a día?'),
  sentences: T('Hace frases', 'Sus frases se alargan, dice «yo» y hace muchas preguntas.', 'Contaos el día por turnos; juegos de imitación (cocinita, garaje).', CALM, '¿Cómo ayudarle a hacerse entender?'),
  familiar_people: T('Reconoce a las personas conocidas', 'Reacciona de forma distinta ante las personas que conoce.', 'Mirad fotos de la familia nombrando a cada uno.', CALM, '¿Cómo preparar un nuevo modo de cuidado?'),
  strangers: T('Se fija en las personas desconocidas', 'Se fija en las personas que no conoce y puede acurrucarse contra ti.', 'Déjale tiempo para observar antes de que lo cojan en brazos.', CALM, '¿Cómo ayudarle ante personas nuevas?'),
  imitates: T('Imita a los adultos', 'Le gusta hacer como tú: hablar por teléfono, barrer, cocinar.', 'Dale una cuchara de madera y una ensaladera mientras cocinas.', 'En la cocina: mantenlo lejos de los fogones y de las ollas calientes.', '¿Qué juegos de imitación puedo proponerle?'),
  plays_with_adult: T('Te invita a jugar', 'Imita la vida cotidiana y viene a buscarte para jugar.', 'Cocinita, muñeca, garaje: sigue su historia.', CALM, '¿Cómo ayudarle a jugar con otros niños?'),
  shows_emotions: T('Muestra sus emociones', 'Expresa alegría, enfado o miedo con la cara y el llanto.', 'Pon palabras a lo que parece sentir.', CALM, '¿Cómo calmarlo cuando llora mucho?'),
  laughs: T('Se ríe a carcajadas', 'Se ríe de verdad cuando juegan con él.', 'Cucú-tras, cosquillas suaves, muecas.', CALM, '¿Qué juegos puedo proponerle a esta edad?'),
  soothed_voice: T('Se calma con tu voz', 'Puede dejar de llorar al oír tu voz.', 'Una canción, siempre la misma, para los momentos tranquilos.', 'Si el llanto te agota, déjalo en un lugar seguro en su cuna y llama a alguien: a un bebé nunca se le zarandea.', '¿Qué hago cuando el llanto se vuelve difícil de llevar?'),
  says_no: T('Dice «no»', 'Usa cada vez más el «no»: reafirma sus deseos.', 'Ofrécele dos opciones aceptables en lugar de una pregunta abierta.', CALM, '¿Cómo reaccionar ante sus rabietas?'),
  mirror: T('Sonríe a su reflejo', 'Sonríe a su imagen en un espejo irrompible.', 'Un espejo de seguridad en el suelo, junto a la alfombra de actividades.', 'Solo espejo irrompible.', '¿Qué juegos de estimulación son adecuados para su edad?'),
  throws_toys: T('Tira sus juguetes para que se los recojan', 'Deja caer sus juguetes y mira adónde van… y si tú los recoges.', 'Un juego de «se cae – lo recojo» con un objeto blando.', SMALL, '¿Cómo entretenerlo durante las comidas?'),
  explores: T('Explora su entorno', 'Se vuelve más autónomo y se va a descubrir la habitación.', 'Una caja de «tesoros» para rebuscar: cajas, telas, cucharas.', 'Guarda en alto los medicamentos, los productos de limpieza y los objetos cortantes.', '¿Cómo hacer la casa segura para que explore?'),
  stories: T('Le gusta que le cuenten cuentos', 'Le gusta que le cuenten cuentos y busca tu atención.', 'Un libro cada noche, a menudo el mismo: le encanta la repetición.', CALM, '¿Qué libros elegir a su edad?'),
  says_me: T('Dice «yo» o su nombre', 'Habla de sí mismo diciendo «yo» o su nombre.', 'Déjale elegir entre dos prendas de ropa.', CALM, '¿Cómo ayudarle a ganar autonomía?'),
  spoon_alone: T('Usa la cuchara solo', 'Come solo con su cuchara, aunque no todo llegue a la boca.', 'Una cuchara de su tamaño y alimentos que se sostengan bien (puré espeso).', 'Siempre sentado y bajo tu mirada durante la comida.', '¿Cómo animarle a comer solo?'),
  potty_interest: T('Se interesa por el orinal', 'El aprendizaje para dejar el pañal suele empezar entre los 18 y los 24 meses, a veces más tarde. Puede llevar desde unos días hasta varios meses.', 'Ofrécele el orinal después de comer o antes de la siesta, unos minutos, sin insistir.', 'Nunca forzar: la presión puede provocar estreñimiento.', '¿Cómo saber si está preparado?'),
  food_interest: T('Se interesa por tu comida', 'Sostiene la cabeza y mira con interés lo que comes: señales que pueden anunciar la alimentación complementaria.', 'Siéntalo a la mesa contigo durante tus comidas.', 'Ningún alimento antes de los 4 meses; pide consejo si el bebé nació prematuro.', '¿Cuándo y cómo empezar la alimentación complementaria?'),
  soft_pieces: T('Come trocitos blandos', 'Acepta trozos muy blandos que se aplastan entre la lengua y el paladar.', 'Una sola textura nueva por comida, junto a un plato que ya conoce.', 'Siempre sentado y bajo tu mirada; los alimentos redondos, cortados en cuatro.', '¿Cómo hacer evolucionar las texturas?'),
  crunchy_pieces: T('Muerde trocitos', 'Empieza a morder trozos con los dientes.', 'Bastoncitos de verduras cocidas y blandas para sujetar con la mano.', 'Ningún alimento pequeño, duro y redondo (cacahuete entero, nuez) antes de los 5 años.', '¿Qué alimentos evitar para limitar los atragantamientos?'),
  longer_nights: T('Duerme más horas por la noche', 'Entre los 4 y los 6 meses, de media, muchos bebés duermen más tiempo por la noche. Antes de los 3–4 meses, se sigue su ritmo.', 'De día: luz y ruidos normales; de noche: luz tenue, voz suave.', 'Dormir boca arriba, en una cuna de barrotes, sin edredón, almohada ni protector de cuna.', '¿Cómo ayudarle a distinguir el día de la noche?'),
  two_naps: T('Hace dos siestas', 'Hacia los 12 meses, suele hacer una siesta por la mañana y otra por la tarde.', 'Un pequeño ritual antes de la siesta (canción, peluche).', 'El mismo lugar seguro para la siesta que para la noche.', '¿Cuánto tiempo de siesta a su edad?'),
  one_nap: T('Hace una sola siesta', 'Hacia los 18 meses, la siesta de la mañana desaparece y da paso a una siesta más larga a primera hora de la tarde.', 'Un rato tranquilo después de comer.', 'Una siesta muy larga puede retrasar la hora de dormir: pide consejo si lo necesitas.', '¿Cómo gestionar el paso a una sola siesta?'),
};
