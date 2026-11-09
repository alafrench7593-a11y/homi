/** Parcours fertilité — versione italiana (stessa forma di quella francese; cambiano solo i testi mostrati). */
import type { FertilityJourney } from '@/lib/types-fertility';
import type { MethodInfo, ReminderPreset } from './fertility';

export const TTC_DISCLAIMER_IT =
  'Le date dell’ovulazione e della finestra fertile sono stime calcolate a partire da ciò che registri. Possono aiutarti a orientarti, ma non garantiscono mai una gravidanza.';

export const AVOID_DISCLAIMER_IT =
  'Una gravidanza resta possibile in qualsiasi momento del ciclo, anche al di fuori della finestra fertile stimata e durante le mestruazioni. Questo calendario non è un metodo contraccettivo: per evitare una gravidanza serve una contraccezione adeguata.';

export const AVOID_NO_SAFE_DAYS_IT =
  'Nessun giorno viene presentato qui come «sicuro»: l’ovulazione può anticipare o ritardare da un ciclo all’altro, e gli spermatozoi possono sopravvivere fino a 5 giorni.';

export const TIMING_INFO_IT: { title: string; text: string }[] = [
  {
    title: 'Rapporti regolari',
    text: 'Avere rapporti ogni 1-2 giorni durante la finestra fertile stimata — e più in generale durante tutto il ciclo — può aumentare le probabilità di concepimento, senza bisogno di pianificare tutto.',
  },
  {
    title: 'I giorni che precedono l’ovulazione stimata',
    text: 'Gli spermatozoi possono sopravvivere fino a 5 giorni, mentre l’ovulo vive solo circa 24 ore: i 2-3 giorni che precedono l’ovulazione stimata sono spesso quelli in cui le probabilità possono essere più alte.',
  },
  {
    title: 'Nessuna garanzia',
    text: 'Anche in buone condizioni, spesso servono diversi mesi per concepire. Questi riferimenti non garantiscono una gravidanza e non sostituiscono il parere di un professionista.',
  },
  {
    title: 'Prendersi cura della coppia',
    text: 'Il calendario può diventare pesante. È del tutto possibile non annotare nulla in alcuni mesi: quello che conta è il tuo ritmo.',
  },
];

export const EXAMS_INTRO_IT =
  'Queste informazioni ti aiutano a preparare un colloquio con un professionista. Non permettono di fare una diagnosi e non sostituiscono una visita: solo un professionista può valutare la tua situazione e decidere quali esami sono utili.';

export const WHEN_TO_TALK_IT: string[] = [
  'Dopo 12 mesi di rapporti regolari senza contraccezione e senza gravidanza, prima dei 35 anni.',
  'Dopo 6 mesi a partire dai 35 anni.',
  'Prima in caso di cicli molto irregolari o assenti, mestruazioni molto dolorose, precedenti noti (endometriosi, PCOS, infezione genitale, chirurgia pelvica, trattamento contro un tumore…) o di una difficoltà nota nel o nella partner.',
  'In qualsiasi momento, se hai una domanda o una preoccupazione: non è mai troppo presto per parlarne.',
];

export const WHO_TO_SEE_IT: string[] = [
  'Il tuo medico di base, un o una ginecologa, o un’ostetrica: possono fare un primo punto della situazione e indirizzarti se necessario.',
  'Un centro di procreazione medicalmente assistita (PMA), su indicazione di un professionista.',
  'Un centro per la salute sessuale (ex pianificazione familiare, simile a un consultorio) per qualsiasi domanda sulla vita sessuale e affettiva.',
];

export const POSSIBLE_EXAMS_IT: { title: string; text: string }[] = [
  { title: 'Un colloquio e una visita clinica', text: 'Da quanto tempo ci provate, regolarità dei cicli, precedenti, terapie, stile di vita: spesso è il punto di partenza.' },
  { title: 'Un esame ormonale tramite prelievo di sangue', text: 'A volte richiesto in giorni precisi del ciclo, per capire meglio il funzionamento delle ovaie.' },
  { title: 'Un’ecografia pelvica', text: 'Per osservare l’utero e le ovaie.' },
  { title: 'Un esame della pervietà delle tube', text: 'Per esempio un’isterosalpingografia o un’isterosonografia, secondo il parere del professionista.' },
  { title: 'Uno spermiogramma per il partner', text: 'La fertilità riguarda entrambi i partner: l’esame del liquido seminale fa spesso parte dei primi accertamenti di una coppia.' },
  { title: 'Esami sierologici e verifica delle vaccinazioni', text: 'Utili prima di una gravidanza, che ci siano difficoltà o meno.' },
];

export const EXAMS_FOOTER_IT =
  'Alcuni esami e trattamenti sono rimborsati dall’Assurance maladie (assicurazione sanitaria francese), a determinate condizioni. Il tuo professionista potrà indicarti ciò che è adatto alla tua situazione.';

export const CONTRACEPTION_INTRO_IT =
  'Riferimenti neutri per confrontare i metodi. La scelta si fa con un medico, un’ostetrica o in un centro per la salute sessuale, in base alla tua salute, alle tue preferenze e alla tua vita. I dati di efficacia indicano il numero approssimativo di gravidanze ogni 100 persone durante un anno di uso abituale (con le dimenticanze e gli errori della vita reale).';

export const CONTRACEPTION_METHODS_IT: MethodInfo[] = [
  {
    kind: 'pill', title: 'Pillola', summary: 'Compressa da prendere ogni giorno, estroprogestinica o solo progestinica.',
    typicalUse: 'Circa 7 gravidanze ogni 100 persone all’anno con un uso abituale (meno di 1 con un uso perfetto).',
    howItWorks: 'Agisce principalmente bloccando l’ovulazione (o modificando il muco cervicale per alcune pillole solo progestiniche).',
    goodToKnow: ['Su prescrizione di un medico o di un’ostetrica.', 'In caso di dimenticanza, vomito o diarrea: segui il foglietto illustrativo e chiedi consiglio a un farmacista.', 'Alcuni farmaci possono ridurne l’efficacia: segnala sempre la tua contraccezione.'],
    reminder: 'daily',
  },
  {
    kind: 'iud_copper', title: 'IUD al rame (spirale)', summary: 'Piccolo dispositivo inserito nell’utero, senza ormoni.',
    typicalUse: 'Meno di 1 gravidanza ogni 100 persone all’anno.',
    howItWorks: 'Il rame rende inattivi gli spermatozoi.',
    goodToKnow: ['Inserito e rimosso da un medico o da un’ostetrica.', 'Durata d’azione da 5 a 10 anni secondo il modello.', 'In alcune persone può rendere le mestruazioni più abbondanti.', 'È adatto anche a chi non ha mai avuto figli.'],
    reminder: 'once', renewalYears: 5,
  },
  {
    kind: 'iud_hormonal', title: 'IUD ormonale', summary: 'Dispositivo inserito nell’utero che rilascia un progestinico.',
    typicalUse: 'Meno di 1 gravidanza ogni 100 persone all’anno.',
    howItWorks: 'Ispessisce il muco cervicale e assottiglia la mucosa dell’utero.',
    goodToKnow: ['Inserito e rimosso da un medico o da un’ostetrica.', 'Durata d’azione da 3 a 8 anni secondo il modello.', 'Le mestruazioni diventano spesso più leggere, a volte assenti.'],
    reminder: 'once', renewalYears: 5,
  },
  {
    kind: 'implant', title: 'Impianto', summary: 'Piccolo bastoncino inserito sotto la pelle del braccio, che rilascia un progestinico.',
    typicalUse: 'Meno di 1 gravidanza ogni 100 persone all’anno.',
    howItWorks: 'Blocca l’ovulazione.',
    goodToKnow: ['Inserito e rimosso da un medico o da un’ostetrica, in anestesia locale.', 'Efficace per 3 anni.', 'I sanguinamenti possono diventare irregolari.'],
    reminder: 'once', renewalYears: 3,
  },
  {
    kind: 'patch', title: 'Cerotto', summary: 'Cerotto applicato sulla pelle, che rilascia ormoni.',
    typicalUse: 'Circa 7 gravidanze ogni 100 persone all’anno con un uso abituale.',
    howItWorks: 'Blocca l’ovulazione, come la pillola estroprogestinica.',
    goodToKnow: ['Su prescrizione.', 'Un cerotto alla settimana per 3 settimane, poi una settimana senza cerotto (secondo il foglietto illustrativo).', 'Se si stacca o sei in ritardo, segui il foglietto illustrativo e chiedi consiglio a un farmacista.'],
    reminder: 'weekly',
  },
  {
    kind: 'ring', title: 'Anello vaginale', summary: 'Anello flessibile inserito nella vagina, che rilascia ormoni.',
    typicalUse: 'Circa 7 gravidanze ogni 100 persone all’anno con un uso abituale.',
    howItWorks: 'Blocca l’ovulazione.',
    goodToKnow: ['Su prescrizione.', 'Lasciato in sede per 3 settimane, poi una settimana senza anello (secondo il foglietto illustrativo).', 'Lo inserisci e lo rimuovi da sola.'],
    reminder: 'once',
  },
  {
    kind: 'injection', title: 'Iniezione', summary: 'Iniezione di un progestinico, ripetuta regolarmente.',
    typicalUse: 'Circa 4 gravidanze ogni 100 persone all’anno con un uso abituale.',
    howItWorks: 'Blocca l’ovulazione.',
    goodToKnow: ['Su prescrizione, eseguita da un professionista.', 'Da ripetere circa ogni 3 mesi, alla data indicata dal tuo professionista.', 'Dopo la sospensione possono servire diversi mesi perché torni la fertilità.'],
    reminder: 'once',
  },
  {
    kind: 'condom', title: 'Preservativo esterno', summary: 'Guaina da mettere sul pene in erezione, monouso.',
    typicalUse: 'Circa 13 gravidanze ogni 100 persone all’anno con un uso abituale.',
    howItWorks: 'Impedisce allo sperma di entrare nella vagina.',
    goodToKnow: ['Insieme al preservativo interno, è l’unico metodo che protegge anche dalle infezioni sessualmente trasmissibili (IST).', 'In Francia alcuni preservativi sono gratuiti in farmacia per chi ha meno di 26 anni, senza ricetta.', 'In caso di rottura o di scivolamento, pensa alla contraccezione d’emergenza.'],
  },
  {
    kind: 'internal_condom', title: 'Preservativo interno', summary: 'Guaina da inserire nella vagina, monouso.',
    typicalUse: 'Circa 21 gravidanze ogni 100 persone all’anno con un uso abituale.',
    howItWorks: 'Impedisce allo sperma di entrare nell’utero.',
    goodToKnow: ['Protegge anche dalle IST.', 'Può essere inserito alcune ore prima del rapporto.'],
  },
  {
    kind: 'diaphragm', title: 'Diaframma e cappuccio cervicale', summary: 'Coppetta da inserire in fondo alla vagina prima del rapporto.',
    typicalUse: 'Circa 17 gravidanze ogni 100 persone all’anno con un uso abituale.',
    howItWorks: 'Blocca l’ingresso dell’utero, spesso insieme a uno spermicida.',
    goodToKnow: ['La scelta della misura e l’apprendimento si fanno con un professionista.', 'Deve restare in sede per diverse ore dopo il rapporto (secondo il foglietto illustrativo).', 'Non protegge dalle IST.'],
  },
  {
    kind: 'sterilisation', title: 'Sterilizzazione (legatura delle tube, vasectomia)', summary: 'Intervento chirurgico per le persone che non desiderano più figli.',
    typicalUse: 'Meno di 1 gravidanza ogni 100 persone all’anno.',
    howItWorks: 'Impedisce l’incontro tra ovulo e spermatozoi.',
    goodToKnow: ['Da considerare definitiva.', 'In Francia è riservata alle persone maggiorenni, con un periodo di riflessione di 4 mesi dopo la prima visita.', 'Dopo una vasectomia serve ancora un’altra contraccezione fino al controllo dello sperma.'],
  },
  {
    kind: 'natural', title: 'Metodi cosiddetti «naturali»', summary: 'Osservazione del ciclo (temperatura, muco, calendario) o coito interrotto.',
    typicalUse: 'Con un uso abituale, circa 20-25 gravidanze ogni 100 persone all’anno: sono i metodi meno efficaci.',
    howItWorks: 'Evitare i rapporti, o proteggerli, durante il periodo fertile stimato; oppure ritirare il pene prima dell’eiaculazione.',
    goodToKnow: ['Richiedono apprendimento, cicli regolari e grande rigore.', 'Il liquido pre-eiaculatorio può contenere spermatozoi.', 'Un’app per il monitoraggio del ciclo, compresa questa, non è un metodo contraccettivo.', 'Non proteggono dalle IST.'],
  },
];

export const CONTRACEPTION_FOOTER_IT =
  'In Francia, per chi ha meno di 26 anni, molti contraccettivi sono rimborsati al 100 % dall’Assurance maladie. Fonte utile: choisirsacontraception.fr (Santé publique France).';

export const EMERGENCY_INTRO_IT =
  'Dopo un rapporto senza contraccezione, una pillola dimenticata, un preservativo scivolato o rotto: la contraccezione d’emergenza può evitare una gravidanza. Prima viene presa, più è efficace.';

export const EMERGENCY_OPTIONS_IT: { title: string; delay: string; text: string }[] = [
  {
    title: 'Pillola al levonorgestrel',
    delay: 'Il prima possibile, al più tardi 72 ore (3 giorni) dopo il rapporto.',
    text: 'Disponibile in farmacia senza ricetta.',
  },
  {
    title: 'Pillola all’ulipristal acetato',
    delay: 'Il prima possibile, fino a 120 ore (5 giorni) dopo il rapporto.',
    text: 'Disponibile in farmacia senza ricetta.',
  },
  {
    title: 'IUD al rame',
    delay: 'Inserito da un medico o da un’ostetrica fino a 5 giorni dopo il rapporto.',
    text: 'È la contraccezione d’emergenza più efficace; può poi restare in sede come contraccezione abituale.',
  },
];

export const EMERGENCY_FACTS_IT: string[] = [
  'In Francia, dal 1° gennaio 2023, la pillola d’emergenza viene fornita in farmacia senza ricetta e gratuitamente a tutte le persone, maggiorenni o minorenni.',
  'Le minorenni possono ottenerla in modo riservato, in farmacia, dall’infermiera scolastica o in un centro per la salute sessuale.',
  'Il o la farmacista può consigliarti sulla pillola adatta, sulle interazioni con le tue terapie e sulla ripresa della tua contraccezione abituale.',
  'La contraccezione d’emergenza non protegge per i rapporti successivi e non sostituisce una contraccezione abituale.',
  'Se le mestruazioni sono in ritardo o insolite, è consigliato un test di gravidanza (circa 3 settimane dopo il rapporto).',
];

export const EMERGENCY_CONTACTS_IT: { label: string; phone: string; description: string }[] = [
  { label: 'Numero nazionale (Francia): sessualità, contraccezione, IVG', phone: '0800081111', description: 'Gratuito e anonimo.' },
  { label: 'Fil Santé Jeunes', phone: '0800235236', description: 'Per i ragazzi dai 12 ai 25 anni, gratuito e anonimo.' },
];

export const QUESTION_SUGGESTIONS_IT: Record<FertilityJourney, string[]> = {
  postpartum: [
    'Quello che provo dal parto merita di essere seguito?',
    'Dormo male anche quando potrei riposare: che ne pensi?',
    'Quando e come iniziare la riabilitazione del pavimento pelvico?',
    'Questi dolori sono normali o bisogna farli controllare?',
    'A chi posso rivolgermi per parlare del mio umore?',
  ],
  ttc: [
    'Nella nostra situazione, dopo quanto tempo bisogna consultare qualcuno?',
    'Bisogna prendere un integratore prima della gravidanza (acido folico)?',
    'Le mie vaccinazioni e i miei esami sierologici sono aggiornati?',
    'Le mie terapie attuali sono compatibili con una gravidanza?',
    'I miei cicli ti sembrano regolari?',
    'Quali esami potrebbero essere utili per ciascuno di noi?',
    'Devo adattare la mia alimentazione, la mia attività, il mio consumo di alcol o di tabacco?',
  ],
  avoid: [
    'Quale metodo è adatto alla mia salute e al mio stile di vita?',
    'Cosa fare in caso di dimenticanza o di ritardo?',
    'Quali effetti indesiderati sono possibili e quando bisogna preoccuparsi?',
    'La mia contraccezione è compatibile con le mie altre terapie?',
    'Come procurarmi rapidamente una contraccezione d’emergenza?',
    'Come cambiare metodo senza un periodo non protetto?',
    'Come proteggermi anche dalle infezioni sessualmente trasmissibili?',
  ],
  pregnancy: [
    'Quello che provo in questo momento è normale a questo stadio?',
    'Quali sono i prossimi esami, e quando?',
    'Quali segnali devono farmi chiamare subito il reparto maternità?',
    'Posso continuare la mia attività fisica e il mio lavoro come adesso?',
    'Quali alimenti o farmaci devo evitare?',
  ],
  child: [
    'La sua crescita e il suo sviluppo ti sembrano nella norma?',
    'Quali vaccini sono previsti e quando?',
    'Per questo sintomo, quali segnali devono farmi tornare in visita o chiamare il 15?',
    'Il suo sonno e la sua alimentazione sono adatti alla sua età?',
    'C’è un accertamento o uno specialista da prendere in considerazione?',
  ],
  general: [
    'Le mie mestruazioni o il mio ciclo ti sembrano nella norma?',
    'I miei esami di screening sono aggiornati?',
    'Le mie vaccinazioni sono aggiornate?',
    'Questo sintomo richiede un esame di approfondimento?',
    'A chi rivolgermi per parlare del mio umore o della mia stanchezza?',
  ],
};

export const TTC_REMINDER_PRESETS_IT: ReminderPreset[] = [
  { key: 'bbt', title: 'Misurare la temperatura', discreetTitle: 'Promemoria del mattino', kind: 'daily', category: 'tracking', hint: 'Ogni mattina al risveglio, prima di alzarti.' },
  { key: 'ovulation_test', title: 'Test di ovulazione', discreetTitle: 'Piccolo promemoria', kind: 'daily', category: 'tracking', hint: 'Alla stessa ora ogni giorno, secondo il foglietto illustrativo del test.' },
  { key: 'supplement', title: 'Il mio integratore', discreetTitle: 'Piccolo promemoria', kind: 'daily', category: 'medication', hint: 'Se un professionista ti ha consigliato un integratore.' },
  { key: 'period', title: 'Annotare le mestruazioni', discreetTitle: 'Ricordati di annotare', kind: 'once', category: 'tracking', hint: 'Intorno alla data stimata delle prossime mestruazioni.' },
  { key: 'pregnancy_test', title: 'Test di gravidanza', discreetTitle: 'Piccolo promemoria', kind: 'once', category: 'tracking', hint: 'Un test è più affidabile a partire dal giorno delle mestruazioni attese (stima).' },
];

export const AVOID_REMINDER_PRESETS_IT: ReminderPreset[] = [
  { key: 'pill', title: 'La mia pillola', discreetTitle: 'Promemoria quotidiano', kind: 'daily', category: 'medication', hint: 'A un orario fisso ogni giorno.' },
  { key: 'patch', title: 'Cambiare il cerotto', discreetTitle: 'Promemoria settimanale', kind: 'weekly', category: 'medication', hint: 'Lo stesso giorno ogni settimana, seguendo il foglietto illustrativo (settimana senza cerotto).' },
  { key: 'ring', title: 'Il mio anello', discreetTitle: 'Piccolo promemoria', kind: 'once', category: 'medication', hint: 'Data di rimozione o di inserimento indicata nel foglietto illustrativo.' },
  { key: 'injection', title: 'La mia iniezione', discreetTitle: 'Appuntamento da fissare', kind: 'once', category: 'medication', hint: 'Data indicata dal tuo professionista (circa ogni 3 mesi).' },
  { key: 'renewal', title: 'Rinnovare l’impianto o la spirale', discreetTitle: 'Appuntamento da fissare', kind: 'once', category: 'custom', hint: 'Qualche settimana prima della data di fine efficacia, per prendere appuntamento.' },
  { key: 'treatment', title: 'La mia terapia prescritta', discreetTitle: 'Promemoria quotidiano', kind: 'daily', category: 'medication', hint: 'Una terapia già prescritta, all’orario indicato dal tuo professionista. L’app non calcola né modifica alcuna dose.' },
  { key: 'appointment', title: 'Il mio appuntamento', discreetTitle: 'Appuntamento da fissare', kind: 'once', category: 'custom', hint: 'Visita, inserimento o rimozione di un dispositivo, rinnovo: alla data del tuo appuntamento.' },
  { key: 'prescription', title: 'Rinnovare la ricetta', discreetTitle: 'Appuntamento da fissare', kind: 'once', category: 'custom', hint: 'Prima che finisca la tua ultima confezione o il tuo ultimo blister.' },
];
