/** Contenuti sul post-partum — versione italiana (tradotta dal francese, stessa struttura, stessi identificativi). */
import type { Section } from './postpartum';

/** Fonti: cambia solo la presentazione dell'editore; i titoli restano nella lingua originale. */
export const AWHONN_PUBLISHER_IT = 'AWHONN — associazione statunitense delle infermiere per la salute della donna, l’ostetricia e la neonatologia';

export const UNDERSTAND_IT: Section[] = [
  {
    id: 'blues',
    title: 'Il baby blues',
    body: [
      'Nei giorni dopo il parto, molte mamme si sentono a fior di pelle: lacrime, irritabilità, preoccupazioni. È frequente ed è legato ai grandi cambiamenti fisici, ormonali e psicologici.',
      'Di solito dura da qualche ora a qualche giorno, e passa da solo.',
    ],
    sources: ['mpj'],
  },
  {
    id: 'signs',
    title: 'Quando vale la pena parlarne',
    body: [
      'Alcuni segnali possono giustificare una visita: una tristezza che si installa, la perdita di interesse o di piacere, un’ansia importante, un senso di disperazione, un senso di colpa eccessivo, difficoltà a dormire anche quando c’è occasione di riposare, un esaurimento emotivo, difficoltà ad affrontare la vita quotidiana, una sensazione di distacco o di difficoltà a creare un legame con il bambino, la sensazione di essere sopraffatta.',
      'Queste manifestazioni possono avere diverse cause. Solo un professionista può valutarle: questa app non lo fa.',
      'Le indicazioni ufficiali invitano a parlarne se dura più di due settimane e, in ogni caso, al minimo dubbio. Se è intenso o peggiora, non aspettare: puoi parlarne già oggi.',
      'La depressione post-partum è frequente — riguarda dal 15 al 20 % delle donne che hanno partorito secondo l’indagine nazionale perinatale francese del 2021 — e si cura. Può colpire anche i padri.',
    ],
    sources: ['mpj', 'ministere'],
  },
  {
    id: 'who',
    title: 'Con chi parlarne',
    body: [
      'La tua ostetrica, il tuo medico di base, un centro PMI (protezione materna e infantile), uno psicologo (il programma «Mon soutien psy» è coperto dall’Assurance maladie) o un ambulatorio di psichiatria perinatale in ospedale.',
      'Il colloquio postnatale precoce, previsto tra la 4ª e l’8ª settimana dopo il parto, è un momento dedicato a parlare di te. Puoi anche chiedere di parlarne prima.',
      'I luoghi di accoglienza genitori-bambini e i gruppi di genitori aiutano a rompere l’isolamento.',
    ],
    sources: ['mpj'],
  },
  {
    id: 'urgent',
    title: 'Se sei in pericolo',
    body: [
      'Se hai pensieri di farti del male, di non esserci più o di fare del male al tuo bambino, o se ti senti molto confusa: chiama subito il 3114 (gratuito, riservato, 24 ore su 24), oppure il 15 o il 112 se il pericolo è immediato.',
      'Non sono pensieri di cui vergognarsi. Sono un segnale che serve aiuto, subito.',
    ],
    sources: ['crise'],
  },
];

export const PARTNER_IT: Section[] = [
  {
    id: 'changes',
    title: 'Cosa cambia dopo una nascita',
    body: [
      'Il corpo si riprende per settimane, a volte mesi. Il sonno è frammentato, gli ormoni cambiano molto e la cura del bambino è continua.',
      'Lacrime e fragilità nei primi giorni sono frequenti (baby blues) e di solito passano in pochi giorni.',
    ],
    sources: ['mpj'],
  },
  {
    id: 'difference',
    title: 'Stanchezza, baby blues o qualcosa di più?',
    body: [
      'Se la tristezza, l’ansia o l’esaurimento si installano, si intensificano o le impediscono di affrontare la vita quotidiana, è il caso di sentire il parere di un professionista. Non devi essere tu a decidere: il tuo ruolo è ascoltare e facilitare l’accesso all’aiuto.',
      'Anche i padri e i co-genitori possono attraversare una depressione dopo una nascita. Prenditi cura anche di te.',
    ],
    sources: ['mpj', 'ministere'],
  },
  {
    id: 'listen',
    title: 'Ascoltare senza minimizzare',
    body: [
      'Evita «è normale, passerà» o «hai tutto per essere felice». Accogli quello che dice, senza cercare di correggere le sue emozioni.',
      'Non leggere di nascosto ciò che non è destinato a te: quello che lei condivide nell’app, l’ha scelto lei.',
    ],
    sources: [],
  },
  {
    id: 'help',
    title: 'Aiutare in modo concreto',
    body: [
      'Condividi le notti (biberon, risvegli), occupati dei pasti, della spesa, del bucato e delle visite senza che lei debba chiederlo.',
      'Proteggi i suoi momenti di riposo: tu gestisci il bambino, il telefono e la porta.',
    ],
    sources: [],
  },
  {
    id: 'consult',
    title: 'Incoraggiare una visita, senza colpevolizzare',
    body: [
      'Proponi invece di imporre: «Se vuoi, posso aiutarti a prendere un appuntamento». Offriti di tenere il bambino durante l’appuntamento, o di accompagnarla.',
      'Un’ostetrica, il medico di base, la PMI o uno psicologo possono riceverla.',
    ],
    sources: ['mpj'],
  },
  {
    id: 'urgent',
    title: 'Quando chiedere un aiuto urgente',
    body: [
      'Se parla di farsi del male, di non esserci più, di fare del male al bambino, o se sembra molto confusa: non lasciarla sola, metti il bambino al sicuro e chiama il 3114, oppure il 15 / 112 se il pericolo è immediato.',
    ],
    sources: ['crise'],
  },
];

export const USEFUL_PHRASES_IT = [
  'Come ti senti davvero oggi?',
  'Di cosa posso occuparmi per farti respirare un po’?',
  'Vuoi che mi occupi io del bambino mentre riposi?',
  'Se vuoi, posso aiutarti a prendere un appuntamento.',
  'Non devi gestire tutto da sola.',
];

export const RECOVERY_WARNINGS_IT = {
  call15: ['Dolore al petto', 'Difficoltà a respirare o fiato corto', 'Convulsioni', 'Pensieri di farti del male o di fare del male a qualcuno'],
  callPro: [
    'Sanguinamento che inzuppa un assorbente in un’ora, o coaguli grandi come un uovo o più',
    'Cicatrice (episiotomia, cesareo) che non guarisce, è arrossata o trasuda',
    'Gamba arrossata, gonfia, dolorante o calda',
    'Temperatura di 38 °C o più',
    'Mal di testa che persiste nonostante un antidolorifico, o accompagnato da disturbi della vista',
  ],
  source: 'awhonn' as const,
};
