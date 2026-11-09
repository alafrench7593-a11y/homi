/** Aiuto per la notte — versione italiana (stessa forma di quella francese; cambiano solo i testi mostrati). */
import type { NightAgeBand } from './nightHelp';

export const NIGHT_BANDS_IT: NightAgeBand[] = [
  {
    key: '0-3m',
    fromMonths: 0,
    toMonths: 3,
    title: 'Da 0 a 3 mesi',
    points: [
      'Un neonato dorme in media dalle 16 alle 17 ore su 24, a periodi di 3-4 ore, senza ancora distinguere il giorno dalla notte.',
      'Svegliarsi ogni 2-4 ore è abituale a questa età: questo ritmo dipende dalla maturazione del suo cervello, non da quello che fai tu.',
      'All’inizio dell’allattamento sono frequenti da 8 a 12 poppate ogni 24 ore, notte compresa; le poppate notturne aiutano spesso a mantenere la produzione di latte.',
      'A questa età si consiglia di seguire il suo ritmo e di prenderlo in braccio quando piange.',
      'Il pianto serale è spesso più intenso verso le 6-8 settimane, poi si attenua verso la fine del terzo mese.',
      'Di giorno: luce e rumori abituali. Di notte: poca luce, voce bassa, gesti calmi, rimetterlo a letto in fretta.',
    ],
    sources: ['santeSommeilNormal', 'santeVeilleSommeil', 'santeRythmeTetees', 'santePleurs'],
  },
  {
    key: '3-6m',
    fromMonths: 3,
    toMonths: 6,
    title: 'Da 3 a 6 mesi',
    points: [
      'Il bisogno di sonno resta importante, intorno alle 16-17 ore su 24 in media prima dei 6 mesi.',
      'I cicli di sonno durano circa 50-60 minuti; un breve risveglio tra due cicli è normale, e molti bambini si riaddormentano da soli.',
      'In media, le notti iniziano ad allungarsi tra i 4 e i 6 mesi, ma ogni bambino ha il suo ritmo, e alcuni ci mettono di più.',
      'Un biberon più abbondante la sera non prolunga il sonno e può favorire i rigurgiti.',
      'Verso i 6 mesi, molti bambini fanno circa tre sonnellini al giorno.',
    ],
    sources: ['santeSommeilNormal', 'santeVeilleSommeil'],
  },
  {
    key: '6-12m',
    fromMonths: 6,
    toMonths: 12,
    title: 'Da 6 a 12 mesi',
    points: [
      'Verso 1 anno, il sonno rappresenta in media dalle 13 alle 14 ore su 24, di cui circa 12 ore di notte, con due sonnellini.',
      'I risvegli tra due cicli restano normali; ciò che può diventare difficile è riaddormentarsi da solo.',
      'Dopo i 6 mesi, i professionisti suggeriscono spesso di dare al bambino la possibilità di riaddormentarsi, di rassicurarlo e poi rimetterlo a letto, senza offrirgli sistematicamente il seno o il biberon, e senza lasciarlo piangere a lungo senza risposta.',
      'A partire dai 9 mesi circa, una tappa dello sviluppo (camminare) o un cambiamento di vita (nuova modalità di custodia, trasloco) può disturbare le notti per un po’.',
      'Un rituale tranquillo e un oggetto rassicurante (un pupazzo adatto alla sua età) possono aiutare al momento di andare a letto.',
    ],
    sources: ['santeSommeilNormal', 'santeVeilleSommeil', 'mpediaTroublesSommeil'],
  },
  {
    key: '12-24m',
    fromMonths: 12,
    toMonths: 24,
    title: 'Da 12 a 24 mesi',
    points: [
      'Il bisogno di sonno diminuisce poco a poco: circa 13-14 ore su 24 verso 1 anno.',
      'Il sonnellino del mattino scompare spesso verso i 18 mesi; un sonnellino nel primo pomeriggio resta abituale.',
      'Svegliarsi di notte a ogni cambio di ciclo è normale; l’ansia da separazione o un cambiamento di vita possono rendere più difficile addormentarsi.',
      'Una camera buia, eventualmente con una piccola luce notturna, e nessuno schermo in camera favoriscono l’addormentamento.',
      'Gli schermi sono sconsigliati prima dei 3 anni, e vanno spenti 1-2 ore prima di andare a letto a qualsiasi età.',
    ],
    sources: ['santeSommeilNormal', 'mpediaTroublesSommeil', 'ameliEcrans'],
  },
  {
    key: '24-36m',
    fromMonths: 24,
    toMonths: 36,
    title: 'Da 2 a 3 anni',
    points: [
      'Verso i 3 anni, il sonno rappresenta in media dalle 12 alle 13 ore su 24, con un sonnellino di circa 2 ore nel primo pomeriggio.',
      'I risvegli a metà notte restano frequenti; spesso il bambino si riaddormenta da solo.',
      'Incubo (più spesso verso la fine della notte): il bambino si sveglia spaventato; rassicurarlo lo aiuta a riaddormentarsi.',
      'Pavor nocturnus (più spesso all’inizio della notte): grida o si agita senza essere davvero sveglio; resta vicino a lui senza svegliarlo.',
      'Non esiste un farmaco per dormire adatto ai bambini piccoli; se le difficoltà durano, il medico o il pediatra possono aiutare a riorganizzare i ritmi.',
    ],
    sources: ['santeSommeilNormal', 'mpediaTroublesSommeil', 'ameliSommeilEnfant'],
  },
];

export const SOOTHING_ROUTINES_IT: { title: string; steps: string[] }[] = [
  {
    title: 'Lo stesso ordine ogni sera',
    steps: [
      'Scegliere tre o quattro passaggi semplici e mantenerli sempre nello stesso ordine.',
      'Per esempio: lavarsi, pigiama, storia, coccola, letto.',
      'Annunciare cosa viene dopo con voce dolce: «Dopo la storia, si va a nanna».',
      'Mantenere più o meno lo stesso orario, senza puntare alla perfezione.',
    ],
  },
  {
    title: 'Abbassare la luce',
    steps: [
      'Attenuare le luci della stanza un po’ prima di andare a letto.',
      'Spegnere la televisione e mettere via gli schermi.',
      'Lasciare una piccola luce notturna se rassicura il bambino.',
    ],
  },
  {
    title: 'Un bagno tiepido e tranquillo',
    steps: [
      'Un bagno tiepido, senza giochi troppo eccitanti, se piace al tuo bambino.',
      'Controllare la temperatura dell’acqua con il gomito prima di metterlo dentro.',
      'Non lasciare mai un bambino da solo nel bagnetto, nemmeno per un istante.',
      'Passare subito al pigiama in una stanza calda e con luce soffusa.',
    ],
  },
  {
    title: 'Ninna nanna o musica dolce',
    steps: [
      'Cantare sempre la stessa ninna nanna, o mettere una musica dolce a basso volume.',
      'Cullarlo dolcemente in braccio se al tuo bambino piace.',
      'Poi mettere il bambino a pancia in su nel suo lettino.',
    ],
  },
  {
    title: 'Il momento della storia',
    steps: [
      'Leggere una o due storie brevi, sempre nello stesso posto.',
      'Lasciare che il bambino scelga il libro tra due proposte.',
      'Finire con una parola o un gesto rituale («Buonanotte, a domani»).',
    ],
  },
  {
    title: 'Anche per te',
    steps: [
      'Se senti salire la tensione, metti il bambino al sicuro nel suo lettino e prenditi qualche minuto per respirare.',
      'Darsi il cambio con un altro adulto quando è possibile.',
      'La serata perfetta non esiste: alcune sere saranno più difficili, ed è normale.',
    ],
  },
];

export const SAFE_SLEEP_IT: string[] = [
  'Metti il bambino a dormire a pancia in su, in piano, per la notte e per ogni sonnellino; né a pancia in giù, né su un fianco.',
  'Fallo dormire nel suo lettino, nella camera dei genitori, idealmente fino a circa 6 mesi; la condivisione del letto dei genitori è sconsigliata.',
  'Un materasso rigido, delle dimensioni del lettino, senza spazi ai lati; non aggiungere un materasso in un lettino da viaggio.',
  'Niente piumone, coperta, cuscino, paracolpi o grossi peluche: meglio un sacco nanna adatto alla sua taglia.',
  'Niente che possa coprirgli il viso o avvolgergli il collo (niente collane, né cordoncini del ciuccio).',
  'Niente cuscini posizionatori, cuscini o asciugamani arrotolati per tenerlo in una posizione.',
  'Una camera tra 18 e 20 °C, arieggiata ogni giorno; evita di coprirlo troppo: la sua nuca non deve essere sudata.',
  'Nessun fumo di tabacco vicino al bambino, né in camera né in auto.',
  'Non addormentarti mai con il bambino su un divano o in una poltrona.',
  'Se sei molto stanco o stanca, o prendi un farmaco che dà sonnolenza, rimetti il bambino nel suo lettino prima di addormentarti.',
  'L’ovetto è fatto per l’auto: non sostituisce il lettino.',
  'Non dare mai un farmaco per far dormire un bambino, e non scuoterlo mai.',
];

export const QUESTIONS_FOR_PRO_IT: string[] = [
  'Quanti risvegli per notte sono abituali alla sua età?',
  'Quante ore di sonno su 24 sono abituali alla sua età, sonnellini compresi?',
  'Le poppate o i biberon notturni sono ancora utili per lui o per lei?',
  'Come capire se mangia abbastanza? Può controllare la sua curva del peso?',
  'Come aiutarlo o aiutarla a distinguere il giorno dalla notte?',
  'Cosa fare quando piange al momento di addormentarsi?',
  'Il suo russare, il suo respiro o i suoi movimenti durante il sonno sono abituali?',
  'Il modo in cui dorme adesso (lettino, sacco nanna, temperatura della camera) è adatto?',
  'Da quando e come pensare di farlo o farla dormire nella sua cameretta?',
  'Quali segni devono farmi chiamare di notte, e chi chiamare?',
  'Sono molto stanco o stanca: quali aiuti esistono per noi genitori?',
];

export const SEEK_HELP_NOW_IT: string[] = [
  'Bambino di meno di 3 mesi con febbre (38 °C o più): rivolgiti subito al pronto soccorso, senza aspettare, anche se sembra stare bene.',
  'Difficoltà a respirare: respiro rapido o irregolare, pause respiratorie, alitamento delle pinne nasali, rientramenti tra le costole, labbra blu: chiama il 15.',
  'Bambino insolitamente sonnolento, molle, che reagisce poco, o che ha un malore: chiama il 15.',
  'Rifiuto totale di bere (seno o biberon), o segni di disidratazione: chiama il 15 o rivolgiti al pronto soccorso.',
  'Piccole macchie rosse sulla pelle che non scompaiono premendoci sopra, o pallore marcato: chiama il 15.',
  'Convulsioni o movimenti anomali: proteggi il bambino, mettilo su un fianco e chiama il 15.',
  'Febbre sopra i 40 °C, o febbre con rigidità del collo, vomito ripetuto o forte mal di testa: rivolgiti al pronto soccorso.',
  'Pianto insolito, lamenti, o qualsiasi comportamento che ti sembri anomalo o preoccupante: nel dubbio, chiama il 15.',
  'Bambino che non respira più: chiama immediatamente il 15 o il 112, e non scuoterlo.',
  'Se senti che potresti scuotere o fare del male al tuo bambino: mettilo a pancia in su nel suo lettino, esci dalla stanza e chiama il 119 (24 ore su 24) o una persona vicina.',
  'Se hai pensieri di farti del male o di non esserci più: chiama il 3114 (gratuito, 24 ore su 24).',
];
