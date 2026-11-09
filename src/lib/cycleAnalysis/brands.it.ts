/** Testi italiani delle regole di lettura (stessi identificativi e stesso ordine del francese). */
import type { RuleTexts } from './brands';

export const IT_TEXTS: RuleTexts = {
  'clearblue-detection-precoce': {
    model: 'Détection Précoce (linee)',
    readingRules: [
      'Attendi i 3 minuti completi e leggi il risultato al massimo 10 minuti dopo il test.',
      'Linea nella finestra di controllo + linea nella finestra del risultato: positivo, qualunque sia l’intensità.',
      'Solo la linea di controllo: negativo.',
      'Nessuna linea nella finestra di controllo: test non valido, da ripetere.',
    ],
    source: { title: 'Foglietto illustrativo Clearblue Détection Précoce (francese)' },
  },
  'first-response-early-result': {
    model: 'Early Result (linee)',
    readingRules: [
      'Attendi 3 minuti; non leggere un risultato negativo dopo 10 minuti.',
      'Due linee rosa: positivo (una linea può essere più chiara dell’altra).',
      'Una sola linea rosa: negativo.',
      'Nessuna linea rosa a 3 minuti: test non valido.',
    ],
    source: { title: 'Foglietto illustrativo First Response Early Result', note: 'Foglietto nordamericano: controlla il foglietto della confezione acquistata in Francia.' },
  },
  'clearblue-detection-rapide': {
    model: 'Détection Rapide (segno + / −)',
    readingRules: [
      'Attendi 3 minuti («Enceinte» può comparire già dopo 1 minuto) e leggi il risultato al massimo 10 minuti dopo il test.',
      'Linea blu nella finestra di controllo + segno «+»: positivo, anche se un tratto del «+» è più chiaro.',
      'Linea blu nella finestra di controllo + segno «−»: negativo.',
      'Nessuna linea blu nella finestra di controllo: test non valido.',
    ],
    options: {
      plus: 'Linea di controllo + segno «+»',
      minus: 'Linea di controllo + segno «−»',
      no_control: 'Nessuna linea nella finestra di controllo',
      unsure: 'Non sono sicura',
    },
    source: { title: 'Foglietto illustrativo Clearblue Détection Rapide (francese)', note: 'Il segno lo leggi tu: l’analisi automatica delle croci non è supportata.' },
  },
  'clearblue-ultra-precoce-digital': {
    model: 'Détection Ultra Précoce Digital',
    readingRules: [
      'Il risultato compare dopo l’indicatore di avanzamento (da 1 a 5 minuti).',
      '«Enceinte»: positivo. «Pas Enceinte»: negativo.',
      'Un simbolo «!» o un messaggio di errore: il test non ha funzionato.',
    ],
    options: {
      pregnant: 'Lo schermo mostra «Enceinte»',
      not_pregnant: 'Lo schermo mostra «Pas Enceinte»',
      error: 'Simbolo «!» o messaggio di errore',
      unsure: 'Non riesco a leggere lo schermo',
    },
    source: { title: 'Foglietto illustrativo Clearblue Détection Ultra Précoce Digital (francese)' },
  },
  'one-step-lh-strip': {
    model: 'Striscia LH (Co-Innovation Biotech)',
    readingRules: [
      'Leggi il risultato a 5 minuti; non leggerlo oltre.',
      'Due linee, con la linea del test scura quanto o più della linea di controllo: picco di LH.',
      'Solo la linea di controllo, o linea del test più chiara: nessun picco di LH.',
      'Nessuna linea, o solo la linea del test: test non valido.',
    ],
    source: { title: 'Foglietto illustrativo One Step LH Test Strip (UE)' },
  },
  'clearblue-ovulation-digital': {
    model: 'Test di ovulazione Digital (smiley)',
    readingRules: [
      'Compare uno smiley quando viene rilevato il picco di LH.',
      'Consulta il foglietto della confezione per il tempo di visualizzazione e gli altri simboli.',
    ],
    options: {
      smiley: 'È visualizzato uno smiley',
      no_smiley: 'Nessuno smiley',
      error: 'Simbolo o messaggio di errore',
      unsure: 'Non sono sicura',
    },
    source: { title: 'Scheda prodotto Clearblue Test di ovulazione Digital', note: 'La fonte consultata conferma solo lo smiley: il simbolo non può essere letto con il riconoscimento del testo, quindi lo leggi tu.' },
  },
};
