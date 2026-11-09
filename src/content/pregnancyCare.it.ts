/** Contenuti sulla gravidanza in italiano (stessa forma, stesse chiavi e stesso ordine del francese di pregnancyCare.ts). */
import { S as L } from './articles/library/sources';
import type { ArticleSource } from './articles/library/types';
import type { CareSources, FoodSection, Nutrient, SafetyContact, SymptomCare, SymptomKey } from './pregnancyCare';

export function careIT(FR: CareSources) {
  const CARE_SOURCES: CareSources = {
    ameliProgramme1: { ...FR.ameliProgramme1, label: 'ameli.fr — Gravidanza: il programma di controlli e la prima visita' },
    ameliMensuel: { ...FR.ameliMensuel, label: 'ameli.fr — Controllo mensile della gravidanza dal 4° mese' },
    santeCalendrier: { ...FR.santeCalendrier, label: 'Santé.fr — Il calendario della gravidanza' },
    petitsMaux: { ...FR.petitsMaux, label: '1000 premiers jours (Santé publique France) — I piccoli disturbi della gravidanza' },
    preeclampsie: { ...FR.preeclampsie, label: 'ameli.fr — Preeclampsia: sintomi, diagnosi ed evoluzione' },
    consult8: { ...FR.consult8, label: 'Santé.fr — Gravidanza: la visita dell’8° mese' },
    mois9: { ...FR.mois9, label: 'Santé.fr — 9° mese, controllo della gravidanza settimana dopo settimana' },
    rgo: { ...FR.rgo, label: 'Santé.fr — Bruciore di stomaco e reflusso gastroesofageo' },
    jambesLourdes: { ...FR.jambesLourdes, label: 'ameli.fr — Gambe pesanti: sintomi, cause e fattori favorenti' },
    cholestase: { ...FR.cholestase, label: 'CNGOF — Colestasi gravidica, raccomandazioni per la pratica clinica (2023)' },
    ameliAliments: { ...FR.ameliAliments, label: 'ameli.fr — Alimenti da evitare e precauzioni igieniche in gravidanza' },
    ameliAlimentation: { ...FR.ameliAlimentation, label: 'ameli.fr — Adattare l’alimentazione in gravidanza' },
    listeriose: { ...FR.listeriose, label: 'Santé.fr — Listeriosi in gravidanza: quali alimenti evitare?' },
    toxoplasmose: { ...FR.toxoplasmose, label: 'Santé.fr — La toxoplasmosi in gravidanza: come evitarla?' },
  };
  const S = CARE_SOURCES;
  const DOUBT = 'Se hai dubbi, chiama la tua ostetrica, il tuo medico o il tuo punto nascita: non disturbi.';

  const SYMPTOM_CARE: Record<SymptomKey, SymptomCare> = {
    nausea: {
      frequentSA: [4, 16],
      help: ['Mangiare spesso, in piccole quantità, senza restare a lungo a digiuno.', 'Scegliere ciò che ti va, evitando piatti grassi, fritti o piccanti.', 'Bere regolarmente, a piccoli sorsi.', 'Alzarti piano, arieggiare, evitare gli odori che scatenano la nausea.', 'Riposare: la stanchezza può peggiorarla.'],
      ask: ['Se la nausea ostacola la vita quotidiana: esistono soluzioni, parlane con il tuo medico o la tua ostetrica.', 'Nessun farmaco né prodotto «naturale» senza il parere di un professionista.'],
      sources: [L.ameliNausees, L.ameliNauseesConsult],
    },
    vomiting: {
      frequentSA: [4, 16],
      help: ['Bere spesso, in piccole quantità, per evitare la disidratazione.', 'Suddividere i pasti e preferire ciò che tolleri meglio.'],
      ask: ['Rapidamente se non trattieni più i liquidi, perdi peso, hai molta sete, la bocca secca, urine scure, febbre o una stanchezza insolita.', 'Vomito molto forte e persistente (iperemesi gravidica) richiede un trattamento rapido.'],
      sources: [L.ameliNausees, L.ameliNauseesConsult],
    },
    fatigue: {
      frequentSA: [4, 14],
      help: ['Riposare appena possibile e accettare l’aiuto che ti viene offerto.', 'Mantenere orari di sonno regolari.', 'Un’attività dolce (camminata, nuoto, ginnastica dolce) se la tua situazione lo permette.'],
      ask: ['Se la stanchezza è intensa, si protrae o si accompagna a fiato corto, pallore o malori: parlane con il tuo professionista.'],
      sources: [S.petitsMaux, L.ameliActive],
    },
    dizziness: {
      frequentSA: null,
      help: ['Alzarti piano, sederti o sdraiarti su un fianco appena ti gira la testa.', 'Bere regolarmente e non restare a lungo a digiuno.'],
      ask: ['Rapidamente in caso di malore, perdita di coscienza, capogiri che ritornano o che si accompagnano a mal di testa, disturbi della vista o fiato corto.'],
      sources: [L.ameliMensuel],
    },
    headache: {
      frequentSA: null,
      help: ['Riposare in un luogo tranquillo, bere regolarmente.', 'Nessun farmaco senza parere: l’aspirina e gli antinfiammatori vanno evitati, in particolare negli ultimi mesi.'],
      ask: ['In urgenza dopo 20 settimane di amenorrea se il mal di testa si accompagna a disturbi della vista (macchie, lampi, vista offuscata), ronzii alle orecchie, un dolore a sbarra nella parte alta della pancia o un gonfiore improvviso del viso o delle mani.'],
      sources: [S.preeclampsie, S.consult8, S.petitsMaux],
    },
    reflux: {
      frequentSA: [20, 41],
      help: ['Fare pasti più piccoli e più frequenti.', 'Evitare di sdraiarti subito dopo mangiato; sollevare la testata del letto può aiutare.', 'Individuare gli alimenti che peggiorano il bruciore.'],
      ask: ['Se il bruciore è frequente o disturba il sonno: parlane con il tuo professionista o con il farmacista prima di qualsiasi farmaco.'],
      sources: [S.rgo, L.ameliPremiersSignes],
    },
    constipation: {
      frequentSA: null,
      help: ['Bere regolarmente durante la giornata.', 'Preferire alimenti ricchi di fibre: verdura, frutta, legumi, cereali integrali.', 'Muoverti un po’ ogni giorno, se possibile.'],
      ask: ['Se la stitichezza dura, è dolorosa o si accompagna a sanguinamento: parlane con il tuo professionista. Nessun lassativo senza parere.'],
      sources: [S.ameliAlimentation, S.petitsMaux],
    },
    bloating: {
      frequentSA: null,
      help: ['Mangiare lentamente, suddividere i pasti.', 'Individuare gli alimenti che gonfiano di più.', 'Una passeggiata dopo i pasti può aiutare.'],
      ask: ['Rapidamente se la pancia diventa dura e dolorosa, o se compaiono dolori che persistono.'],
      sources: [L.ameliPremiersSignes],
    },
    breasts: {
      frequentSA: [4, 14],
      help: ['Un reggiseno comodo, adatto alla taglia che cambia.'],
      ask: ['Se compare un arrossamento, un nodulo o un dolore localizzato: parlane con il tuo professionista.'],
      sources: [L.ameliPremiersSignes],
    },
    back_pain: {
      frequentSA: [20, 41],
      help: ['Un’attività dolce: camminata, nuoto, ginnastica dolce, yoga prenatale.', 'I massaggi alla schiena e alle gambe possono dare sollievo.', 'Evitare di portare pesi e piegarti flettendo le ginocchia.'],
      ask: ['Se il dolore è intenso, torna a ondate regolari (come contrazioni) o si accompagna a febbre o bruciore quando urini: consulta rapidamente.'],
      sources: [S.petitsMaux, L.ameliActive],
    },
    pelvic_pain: {
      frequentSA: [14, 41],
      help: ['Riposare, cambiare posizione, evitare di stare a lungo in piedi.'],
      ask: ['Rapidamente se il dolore è forte, da un solo lato, con sanguinamento, febbre, o se ritorna in modo regolare.'],
      sources: [L.ameliSaign1, L.ameliMensuel],
    },
    contractions: {
      frequentSA: [20, 41],
      help: ['Riposare e annotare la loro frequenza e la loro durata.'],
      ask: ['In gravidanza si descrivono contrazioni poco dolorose, irregolari e poco numerose (meno di 10 al giorno).', 'Contatta senza indugio il tuo punto nascita se diventano dolorose, si avvicinano con il passare delle ore o si accompagnano a sanguinamento o perdita di liquido.'],
      sources: [S.ameliMensuel, S.consult8],
    },
    discharge: {
      frequentSA: null,
      help: ['In gravidanza si descrivono spesso perdite biancastre, senza odore né prurito.'],
      ask: ['Rapidamente in caso di odore forte, prurito, bruciore o colore insolito.', 'Vai al punto nascita se esce liquido in modo continuo: può far pensare alla rottura del sacco amniotico.'],
      sources: [S.consult8, S.mois9],
    },
    bleeding: {
      frequentSA: null,
      help: ['Annota l’ora, la quantità e il colore, e ciò che lo accompagna (dolori, contrazioni).'],
      ask: ['Nel 2° o 3° trimestre, qualsiasi sanguinamento deve essere valutato in urgenza al punto nascita, anche se non fa male.', 'Nel 1° trimestre: consulta rapidamente; in urgenza (15 o 112) se il sanguinamento è abbondante, con malore, dolori al basso ventre o febbre.'],
      sources: [L.ameliSaign1, L.ameliSaign23, S.consult8],
    },
    itching: {
      frequentSA: null,
      help: ['Una pelle ben idratata e abiti larghi possono aiutare in caso di prurito leggero.'],
      ask: ['Consulta rapidamente se il prurito è intenso, soprattutto sui palmi delle mani e sulle piante dei piedi, o di notte, in particolare nel 3° trimestre: possono essere necessari degli esami.'],
      sources: [S.cholestase],
    },
    breathless: {
      frequentSA: [28, 41],
      help: ['Rallentare il ritmo, fare pause, stare dritta per lasciare spazio ai polmoni.'],
      ask: ['Rapidamente se il fiato corto compare a riposo, peggiora o si accompagna a dolore al petto, palpitazioni o malore (chiama il 15 in caso di dolore al petto).'],
      sources: [L.ameliMensuel],
    },
    swollen_legs: {
      frequentSA: [28, 41],
      help: ['Camminare, nuotare, fare ginnastica dolce.', 'Sollevare le gambe a riposo, evitare di stare a lungo in piedi o seduta.'],
      ask: ['Rapidamente se un polpaccio diventa gonfio, duro e dolente, o se viso e mani si gonfiano all’improvviso con un rapido aumento di peso.'],
      sources: [S.petitsMaux, S.jambesLourdes, S.preeclampsie],
    },
    sleep: {
      frequentSA: null,
      help: ['Un momento tranquillo prima di andare a letto, limitare la caffeina la sera.', 'Dormire su un fianco, con un cuscino sotto la pancia o tra le ginocchia.'],
      ask: ['Se la mancanza di sonno ti pesa o si accompagna a tristezza o perdita di interesse: parlane con il tuo professionista.'],
      sources: [S.petitsMaux, L.nhsFatigueGrossesse],
    },
    mood: {
      frequentSA: null,
      help: ['Condividere ciò che provi con il tuo partner o con una persona di fiducia.', 'Prenderti cura di te: riposo, pasti regolari, attività dolce.'],
      ask: ['Se la tristezza, il pianto o l’irritabilità durano più di due settimane: parlane con la tua ostetrica o con il tuo medico.', 'Se hai pensieri di farti del male: chiama il 3114 (gratuito, 24 ore su 24).'],
      sources: [L.ameliPsy, L.ameliAidePsy, S.petitsMaux],
    },
    anxiety: {
      frequentSA: null,
      help: ['Parlarne: partner, persone vicine, corso di accompagnamento alla nascita.', 'Respirazione lenta, momenti di calma.'],
      ask: ['Se l’ansia è costante, ti impedisce di dormire o di fare le cose di tutti i giorni: parlane con la tua ostetrica o con il tuo medico. Il colloquio prenatale precoce è un momento previsto proprio per questo.', 'Se hai pensieri di farti del male: chiama il 3114 (gratuito, 24 ore su 24).'],
      sources: [L.ameliPsy, L.ameliAidePsy],
    },
    movements: {
      frequentSA: null,
      help: ['Le sensazioni cambiano con il passare delle settimane; a fine gravidanza il bebè, più stretto, può muoversi in modo diverso.'],
      ask: ['Se senti che il tuo bebè si muove meno del solito, o non si muove più: contatta subito il tuo punto nascita, di giorno come di notte.'],
      sources: [S.mois9],
    },
    other: {
      frequentSA: null,
      help: ['Annota quando è iniziato, con quale frequenza e cosa lo allevia o lo peggiora: queste note aiutano durante la visita.'],
      ask: [DOUBT],
      sources: [L.ameliMensuel],
    },
  };

  const SAFETY_CONTACTS: readonly SafetyContact[] = [
    { key: 'samu', label: 'SAMU (soccorso medico)', phone: '15' },
    { key: 'eu', label: 'Emergenze (numero europeo)', phone: '112' },
    { key: 'sms', label: 'Emergenze per persone sorde o con problemi di udito (SMS)', phone: '114' },
  ];

  const EAT_INTERESTING: FoodSection = {
    key: 'interesting',
    title: 'I punti di riferimento quotidiani',
    items: [
      { title: 'Frutta e verdura', text: 'Almeno cinque porzioni al giorno, crude ben lavate o cotte.' },
      { title: 'Cereali, amidacei e legumi', text: 'A ogni pasto, preferendo i cereali integrali e i legumi secchi (lenticchie, ceci, fagioli).' },
      { title: 'Latticini', text: 'Tre al giorno, pastorizzati (niente latte crudo).' },
      { title: 'Carne, pesce o uova', text: 'Una o due volte al giorno, sempre ben cotti.' },
      { title: 'Acqua', text: 'A volontà, durante tutta la giornata.' },
      { title: 'Ritmo', text: 'Tre pasti senza saltarne nessuno e, dal 2° trimestre, uno spuntino se serve.' },
    ],
    sources: [S.ameliAlimentation],
  };

  const EAT_AVOID: FoodSection = {
    key: 'avoid',
    title: 'Da evitare o da preparare con attenzione',
    items: [
      { title: 'Alcol', text: 'Totalmente sconsigliato per tutta la gravidanza, qualunque sia la quantità.' },
      { title: 'Formaggi a latte crudo', text: 'Da evitare, soprattutto quelli a pasta molle, così come le croste di formaggio e i formaggi grattugiati venduti in busta.' },
      { title: 'Salumi cotti e prodotti al taglio', text: 'Rillettes, paté, foie gras, prodotti in gelatina e alimenti serviti al taglio: da evitare.' },
      { title: 'Pesce e carne crudi o poco cotti', text: 'Sushi, tartare, ceviche, pesce affumicato o marinato, frutti di mare crudi, surimi, tarama: da evitare. Carne e pesce ben cotti anche all’interno.' },
      { title: 'Germogli crudi', text: 'Da evitare.' },
      { title: 'Alcuni pesci', text: 'Pesce spada, marlin, squalo, lampreda: da evitare. Tonno, orata, luccio e altri predatori selvatici: da limitare. Pesci d’acqua dolce (anguilla, carpa…): al massimo una volta ogni due mesi.' },
      { title: 'Soia e liquirizia', text: 'Alimenti a base di soia sconsigliati per precauzione (la salsa di soia resta possibile ogni tanto). Liquirizia da evitare in tutte le sue forme.' },
      { title: 'Caffeina', text: 'Da limitare: il riferimento indicato dall’Assurance Maladie è di 300 mg al giorno al massimo. Bevande energetiche da evitare.' },
    ],
    sources: [S.ameliAliments, S.ameliAlimentation, S.listeriose],
  };

  const EAT_HYGIENE: FoodSection = {
    key: 'hygiene',
    title: 'Igiene e cottura',
    items: [
      { title: 'Frigorifero', text: 'Regolato a 4 °C al massimo, pulito regolarmente. Rispettare le date di scadenza e consumare rapidamente dopo l’apertura.' },
      { title: 'Avanzi', text: 'Non più di 3 giorni, riscaldati finché sono ben caldi ovunque.' },
      { title: 'Crudo e cotto separati', text: 'Non mettere a contatto carne cruda, verdure non lavate e alimenti pronti da mangiare.' },
      { title: 'Lavaggio', text: 'Lavare con cura frutta, verdura, erbe aromatiche e utensili, e lavarti le mani prima di cucinare e dopo aver toccato carne cruda.' },
      { title: 'Scongelamento', text: 'In frigorifero, mai sul piano di lavoro.' },
      { title: 'Giardino e animali', text: 'Se non sei immune alla toxoplasmosi: fare giardinaggio con i guanti ed evitare la lettiera del gatto.' },
    ],
    sources: [S.ameliAliments, S.toxoplasmose],
  };

  const NUTRIENTS: Nutrient[] = [
    { key: 'iron', title: 'Ferro', why: 'Il fabbisogno aumenta, soprattutto a fine gravidanza.', where: 'Legumi secchi, pesce, carne.', professional: 'Il tuo medico o la tua ostetrica può prescrivere del ferro se necessario: segui i suoi consigli.' },
    { key: 'calcium', title: 'Calcio', why: 'Utile allo scheletro del bebè, soprattutto nel 3° trimestre.', where: 'Latticini pastorizzati, alcune acque minerali ricche di calcio.', professional: 'Parla delle tue abitudini (per esempio senza latticini) con il tuo professionista.' },
    { key: 'protein', title: 'Proteine', why: 'Accompagnano la crescita del bebè.', where: 'Carne, pesce, uova ben cotte, legumi, latticini.', professional: 'Se segui un’alimentazione vegetariana o vegana, chiedi consiglio al tuo professionista.' },
    { key: 'fiber', title: 'Fibre', why: 'Aiutano il transito intestinale, spesso rallentato in gravidanza.', where: 'Verdura, frutta, legumi, cereali integrali.', professional: 'Se la stitichezza dura, parlane prima di prendere un lassativo.' },
    { key: 'b9', title: 'Vitamina B9 (folati)', why: 'Importante all’inizio della gravidanza per lo sviluppo del sistema nervoso.', where: 'Verdure a foglia verde, legumi.', professional: 'All’inizio della gravidanza l’alimentazione da sola non basta: è il tuo medico o la tua ostetrica a prescrivere eventualmente un integratore e a indicarne la durata. L’app non ne raccomanda mai.' },
  ];

  const SUPPLEMENT_NOTICE = 'L’app non raccomanda alcun integratore alimentare. Alcuni contengono vitamine o minerali nocivi ad alte dosi: segui i consigli del professionista che segue la tua gravidanza.';
  const NOT_ADVICE = 'Informazioni generali tratte da fonti ufficiali francesi, non un parere medico personalizzato.';
  const NUTRITION_SOURCES: ArticleSource[] = [S.ameliAlimentation, S.ameliAliments, S.listeriose, S.toxoplasmose, L.santeB9];

  return { CARE_SOURCES, SYMPTOM_CARE, SAFETY_CONTACTS, EAT_INTERESTING, EAT_AVOID, EAT_HYGIENE, NUTRIENTS, SUPPLEMENT_NOTICE, NOT_ADVICE, NUTRITION_SOURCES };
}
