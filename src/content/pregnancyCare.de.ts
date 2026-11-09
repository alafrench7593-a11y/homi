/** Schwangerschaftsinhalte auf Deutsch (gleiche Form, gleiche Schlüssel und gleiche Reihenfolge wie das Französische in pregnancyCare.ts). */
import { S as L } from './articles/library/sources';
import type { ArticleSource } from './articles/library/types';
import type { CareSources, FoodSection, Nutrient, SafetyContact, SymptomCare, SymptomKey } from './pregnancyCare';

export function careDE(FR: CareSources) {
  const CARE_SOURCES: CareSources = {
    ameliProgramme1: { ...FR.ameliProgramme1, label: 'ameli.fr — Schwangerschaft: das Vorsorgeprogramm und die erste Untersuchung' },
    ameliMensuel: { ...FR.ameliMensuel, label: 'ameli.fr — Monatliche Schwangerschaftsvorsorge ab dem 4. Monat' },
    santeCalendrier: { ...FR.santeCalendrier, label: 'Santé.fr — Der Schwangerschaftskalender' },
    petitsMaux: { ...FR.petitsMaux, label: '1000 premiers jours (Santé publique France) — Kleine Beschwerden in der Schwangerschaft' },
    preeclampsie: { ...FR.preeclampsie, label: 'ameli.fr — Präeklampsie: Symptome, Diagnose und Verlauf' },
    consult8: { ...FR.consult8, label: 'Santé.fr — Schwangerschaft: die Untersuchung im 8. Monat' },
    mois9: { ...FR.mois9, label: 'Santé.fr — 9. Monat, Schwangerschaftsvorsorge Woche für Woche' },
    rgo: { ...FR.rgo, label: 'Santé.fr — Sodbrennen und Reflux' },
    jambesLourdes: { ...FR.jambesLourdes, label: 'ameli.fr — Schwere Beine: Symptome, Ursachen und begünstigende Faktoren' },
    cholestase: { ...FR.cholestase, label: 'CNGOF — Schwangerschaftscholestase, Leitlinien für die klinische Praxis (2023)' },
    ameliAliments: { ...FR.ameliAliments, label: 'ameli.fr — Zu meidende Lebensmittel und Hygieneregeln in der Schwangerschaft' },
    ameliAlimentation: { ...FR.ameliAlimentation, label: 'ameli.fr — Die Ernährung in der Schwangerschaft anpassen' },
    listeriose: { ...FR.listeriose, label: 'Santé.fr — Listeriose in der Schwangerschaft: Welche Lebensmittel meiden?' },
    toxoplasmose: { ...FR.toxoplasmose, label: 'Santé.fr — Toxoplasmose in der Schwangerschaft: Wie lässt sie sich vermeiden?' },
  };
  const S = CARE_SOURCES;
  const DOUBT = 'Im Zweifel ruf deine Hebamme, deine Ärztin oder deinen Arzt oder deine Geburtsklinik an: Du störst nicht.';

  const SYMPTOM_CARE: Record<SymptomKey, SymptomCare> = {
    nausea: {
      frequentSA: [4, 16],
      help: ['Oft und in kleinen Mengen essen, nicht lange nüchtern bleiben.', 'Das wählen, worauf du Lust hast, und fettige, frittierte oder scharfe Gerichte meiden.', 'Regelmäßig in kleinen Schlucken trinken.', 'Langsam aufstehen, lüften, Gerüche meiden, die Übelkeit auslösen.', 'Sich ausruhen: Müdigkeit kann sie verstärken.'],
      ask: ['Wenn die Übelkeit den Alltag beeinträchtigt: Es gibt Lösungen, sprich mit deiner Ärztin, deinem Arzt oder deiner Hebamme darüber.', 'Keine Medikamente und keine „natürlichen“ Mittel ohne fachlichen Rat.'],
      sources: [L.ameliNausees, L.ameliNauseesConsult],
    },
    vomiting: {
      frequentSA: [4, 16],
      help: ['Oft in kleinen Mengen trinken, um einer Austrocknung vorzubeugen.', 'Die Mahlzeiten aufteilen und das bevorzugen, was am besten vertragen wird.'],
      ask: ['Rasch, wenn du keine Flüssigkeit mehr bei dir behältst, Gewicht verlierst, sehr durstig bist, einen trockenen Mund, dunklen Urin, Fieber oder ungewöhnliche Müdigkeit hast.', 'Sehr starkes, anhaltendes Erbrechen (Hyperemesis gravidarum) muss rasch behandelt werden.'],
      sources: [L.ameliNausees, L.ameliNauseesConsult],
    },
    fatigue: {
      frequentSA: [4, 14],
      help: ['Sich ausruhen, sobald es geht, und angebotene Hilfe annehmen.', 'Regelmäßige Schlafenszeiten einhalten.', 'Sanfte Bewegung (Gehen, Schwimmen, sanfte Gymnastik), wenn deine Situation es erlaubt.'],
      ask: ['Wenn die Müdigkeit stark ist, anhält oder mit Atemnot, Blässe oder Schwächeanfällen einhergeht: Sprich mit deiner Fachperson darüber.'],
      sources: [S.petitsMaux, L.ameliActive],
    },
    dizziness: {
      frequentSA: null,
      help: ['Langsam aufstehen, sich hinsetzen oder auf die Seite legen, sobald dir schwindlig wird.', 'Regelmäßig trinken und nicht lange nüchtern bleiben.'],
      ask: ['Rasch bei einem Schwächeanfall, Bewusstlosigkeit, wiederkehrendem Schwindel oder Schwindel mit Kopfschmerzen, Sehstörungen oder Atemnot.'],
      sources: [L.ameliMensuel],
    },
    headache: {
      frequentSA: null,
      help: ['Sich in Ruhe ausruhen, regelmäßig trinken.', 'Keine Medikamente ohne Rat: Aspirin und entzündungshemmende Mittel sind vor allem in den letzten Monaten zu meiden.'],
      ask: ['Als Notfall nach 20 Wochen ab der letzten Periode, wenn die Kopfschmerzen mit Sehstörungen (Flecken, Blitze, verschwommenes Sehen), Ohrensausen, einem gürtelförmigen Schmerz im Oberbauch oder einer plötzlichen Schwellung von Gesicht oder Händen einhergehen.'],
      sources: [S.preeclampsie, S.consult8, S.petitsMaux],
    },
    reflux: {
      frequentSA: [20, 41],
      help: ['Kleinere und häufigere Mahlzeiten essen.', 'Sich direkt nach dem Essen nicht hinlegen; das Kopfende des Bettes höher zu stellen kann helfen.', 'Herausfinden, welche Lebensmittel das Brennen verstärken.'],
      ask: ['Wenn das Brennen häufig ist oder den Schlaf stört: Sprich vor jedem Medikament mit deiner Fachperson oder in der Apotheke darüber.'],
      sources: [S.rgo, L.ameliPremiersSignes],
    },
    constipation: {
      frequentSA: null,
      help: ['Über den Tag verteilt regelmäßig trinken.', 'Ballaststoffreiche Lebensmittel bevorzugen: Gemüse, Obst, Hülsenfrüchte, Vollkornprodukte.', 'Sich möglichst jeden Tag ein wenig bewegen.'],
      ask: ['Wenn die Verstopfung anhält, schmerzt oder mit Blutungen einhergeht: Sprich mit deiner Fachperson darüber. Kein Abführmittel ohne Rat.'],
      sources: [S.ameliAlimentation, S.petitsMaux],
    },
    bloating: {
      frequentSA: null,
      help: ['Langsam essen, die Mahlzeiten aufteilen.', 'Herausfinden, welche Lebensmittel stärker blähen.', 'Ein Spaziergang nach dem Essen kann helfen.'],
      ask: ['Rasch, wenn der Bauch hart und schmerzhaft wird oder sich Schmerzen festsetzen.'],
      sources: [L.ameliPremiersSignes],
    },
    breasts: {
      frequentSA: [4, 14],
      help: ['Ein bequemer BH, passend zur sich verändernden Größe.'],
      ask: ['Wenn eine Rötung, ein Knoten oder ein örtlich begrenzter Schmerz auftritt: Sprich mit deiner Fachperson darüber.'],
      sources: [L.ameliPremiersSignes],
    },
    back_pain: {
      frequentSA: [20, 41],
      help: ['Sanfte Bewegung: Gehen, Schwimmen, sanfte Gymnastik, Schwangerschaftsyoga.', 'Rücken- und Beinmassagen können Linderung bringen.', 'Nicht schwer tragen und beim Bücken in die Knie gehen.'],
      ask: ['Wenn der Schmerz stark ist, in regelmäßigen Wellen wiederkommt (wie Wehen) oder mit Fieber oder Brennen beim Wasserlassen einhergeht: Lass dich rasch untersuchen.'],
      sources: [S.petitsMaux, L.ameliActive],
    },
    pelvic_pain: {
      frequentSA: [14, 41],
      help: ['Sich ausruhen, die Position wechseln, nicht lange stehen.'],
      ask: ['Rasch, wenn der Schmerz stark ist, nur auf einer Seite, mit Blutungen oder Fieber auftritt oder regelmäßig wiederkommt.'],
      sources: [L.ameliSaign1, L.ameliMensuel],
    },
    contractions: {
      frequentSA: [20, 41],
      help: ['Sich ausruhen und Häufigkeit und Dauer notieren.'],
      ask: ['Wenig schmerzhafte, unregelmäßige und seltene Wehen (weniger als 10 pro Tag) werden in der Schwangerschaft beschrieben.', 'Wende dich ohne Verzögerung an deine Geburtsklinik, wenn sie schmerzhaft werden, im Lauf der Stunden häufiger kommen oder mit Blutungen oder Flüssigkeitsabgang einhergehen.'],
      sources: [S.ameliMensuel, S.consult8],
    },
    discharge: {
      frequentSA: null,
      help: ['Weißlicher Ausfluss ohne Geruch und ohne Juckreiz wird in der Schwangerschaft häufig beschrieben.'],
      ask: ['Rasch bei starkem Geruch, Juckreiz, Brennen oder ungewöhnlicher Farbe.', 'Geh in die Geburtsklinik, wenn ständig Flüssigkeit abgeht: Das kann auf einen Blasensprung hindeuten.'],
      sources: [S.consult8, S.mois9],
    },
    bleeding: {
      frequentSA: null,
      help: ['Notiere die Uhrzeit, die Menge und die Farbe sowie die Begleiterscheinungen (Schmerzen, Wehen).'],
      ask: ['Im 2. oder 3. Trimester muss jede Blutung als Notfall in der Geburtsklinik abgeklärt werden, auch wenn sie nicht schmerzt.', 'Im 1. Trimester: Lass dich rasch untersuchen; als Notfall (15 oder 112), wenn die Blutung stark ist oder mit Schwächeanfall, Unterbauchschmerzen oder Fieber einhergeht.'],
      sources: [L.ameliSaign1, L.ameliSaign23, S.consult8],
    },
    itching: {
      frequentSA: null,
      help: ['Gut eingecremte Haut und weite Kleidung können bei leichtem Juckreiz helfen.'],
      ask: ['Lass dich rasch untersuchen, wenn der Juckreiz stark ist, vor allem an den Handflächen und Fußsohlen oder nachts, besonders im 3. Trimester: Eine Blutuntersuchung kann nötig sein.'],
      sources: [S.cholestase],
    },
    breathless: {
      frequentSA: [28, 41],
      help: ['Das Tempo drosseln, Pausen machen, sich aufrecht halten, um der Lunge Platz zu lassen.'],
      ask: ['Rasch, wenn die Atemnot in Ruhe auftritt, sich verschlimmert oder mit Brustschmerzen, Herzklopfen oder einem Schwächeanfall einhergeht (bei Brustschmerzen die 15 anrufen).'],
      sources: [L.ameliMensuel],
    },
    swollen_legs: {
      frequentSA: [28, 41],
      help: ['Gehen, schwimmen, sanfte Gymnastik machen.', 'Die Beine in Ruhe hochlegen, nicht lange stehen oder sitzen.'],
      ask: ['Rasch, wenn eine Wade geschwollen, hart und schmerzhaft wird oder wenn Gesicht und Hände plötzlich anschwellen und das Gewicht schnell zunimmt.'],
      sources: [S.petitsMaux, S.jambesLourdes, S.preeclampsie],
    },
    sleep: {
      frequentSA: null,
      help: ['Ein ruhiger Moment vor dem Schlafengehen, abends wenig Koffein.', 'Auf der Seite schlafen, mit einem Kissen unter dem Bauch oder zwischen den Knien.'],
      ask: ['Wenn der Schlafmangel dich belastet oder mit Traurigkeit oder Interessenverlust einhergeht: Sprich mit deiner Fachperson darüber.'],
      sources: [S.petitsMaux, L.nhsFatigueGrossesse],
    },
    mood: {
      frequentSA: null,
      help: ['Teile deine Gefühle mit deinem Partner, deiner Partnerin oder einer Vertrauensperson.', 'Gut für dich sorgen: Ruhe, regelmäßige Mahlzeiten, sanfte Bewegung.'],
      ask: ['Wenn Traurigkeit, Weinen oder Reizbarkeit länger als zwei Wochen anhalten: Sprich mit deiner Hebamme, deiner Ärztin oder deinem Arzt darüber.', 'Wenn du Gedanken hast, dir etwas anzutun: Ruf die 3114 an (kostenlos, rund um die Uhr).'],
      sources: [L.ameliPsy, L.ameliAidePsy, S.petitsMaux],
    },
    anxiety: {
      frequentSA: null,
      help: ['Darüber reden: Partner oder Partnerin, Umfeld, Geburtsvorbereitung.', 'Langsames Atmen, ruhige Momente.'],
      ask: ['Wenn die Angst ständig da ist, dich nicht schlafen lässt oder den Alltag verhindert: Sprich mit deiner Hebamme, deiner Ärztin oder deinem Arzt darüber. Das frühe pränatale Gespräch (entretien prénatal précoce) ist genau dafür vorgesehen.', 'Wenn du Gedanken hast, dir etwas anzutun: Ruf die 3114 an (kostenlos, rund um die Uhr).'],
      sources: [L.ameliPsy, L.ameliAidePsy],
    },
    movements: {
      frequentSA: null,
      help: ['Die Empfindungen verändern sich im Lauf der Wochen; gegen Ende der Schwangerschaft hat das Baby weniger Platz und kann sich anders bewegen.'],
      ask: ['Wenn du spürst, dass sich dein Baby weniger als sonst oder gar nicht mehr bewegt: Wende dich sofort an deine Geburtsklinik, ob Tag oder Nacht.'],
      sources: [S.mois9],
    },
    other: {
      frequentSA: null,
      help: ['Notiere, wann es angefangen hat, wie oft es auftritt und was es lindert oder verschlimmert: Diese Notizen helfen beim Termin.'],
      ask: [DOUBT],
      sources: [L.ameliMensuel],
    },
  };

  const SAFETY_CONTACTS: readonly SafetyContact[] = [
    { key: 'samu', label: 'SAMU (medizinischer Notdienst)', phone: '15' },
    { key: 'eu', label: 'Notruf (europäische Nummer)', phone: '112' },
    { key: 'sms', label: 'Notruf für gehörlose oder schwerhörige Menschen (SMS)', phone: '114' },
  ];

  const EAT_INTERESTING: FoodSection = {
    key: 'interesting',
    title: 'Orientierung für den Alltag',
    items: [
      { title: 'Obst und Gemüse', text: 'Mindestens fünf Portionen pro Tag, roh (gut gewaschen) oder gekocht.' },
      { title: 'Stärkehaltige Lebensmittel und Hülsenfrüchte', text: 'Zu jeder Mahlzeit, bevorzugt Vollkorngetreide und getrocknete Hülsenfrüchte (Linsen, Kichererbsen, Bohnen).' },
      { title: 'Milchprodukte', text: 'Drei pro Tag, pasteurisiert (keine Rohmilch).' },
      { title: 'Fleisch, Fisch oder Eier', text: 'Ein- bis zweimal pro Tag, immer gut durchgegart.' },
      { title: 'Wasser', text: 'So viel du möchtest, über den ganzen Tag verteilt.' },
      { title: 'Rhythmus', text: 'Drei Mahlzeiten, ohne eine auszulassen, und ab dem 2. Trimester bei Bedarf eine Zwischenmahlzeit.' },
    ],
    sources: [S.ameliAlimentation],
  };

  const EAT_AVOID: FoodSection = {
    key: 'avoid',
    title: 'Meiden oder mit Vorsicht zubereiten',
    items: [
      { title: 'Alkohol', text: 'Während der gesamten Schwangerschaft völlig abgeraten, egal in welcher Menge.' },
      { title: 'Rohmilchkäse', text: 'Meiden, vor allem Weichkäse, ebenso Käserinde und abgepackten geriebenen Käse.' },
      { title: 'Gekochte Wurstwaren und Produkte von der Theke', text: 'Rillettes, Pasteten, Foie gras, Produkte in Aspik und an der Theke aufgeschnittene Lebensmittel: meiden.' },
      { title: 'Roher oder nicht durchgegarter Fisch und rohes Fleisch', text: 'Sushi, Tatar, Ceviche, geräucherter oder marinierter Fisch, rohe Meeresfrüchte, Surimi, Tarama: meiden. Fleisch und Fisch vollständig durchgaren.' },
      { title: 'Rohe Sprossen und Keimlinge', text: 'Meiden.' },
      { title: 'Bestimmte Fische', text: 'Schwertfisch, Marlin, Hai, Neunauge: meiden. Thunfisch, Dorade, Hecht und andere wilde Raubfische: einschränken. Süßwasserfische (Aal, Karpfen…): höchstens einmal alle zwei Monate.' },
      { title: 'Soja und Lakritz', text: 'Sojaprodukte werden vorsichtshalber nicht empfohlen (Sojasoße ist ab und zu möglich). Lakritz in jeder Form meiden.' },
      { title: 'Koffein', text: 'Einschränken: Der von der Assurance Maladie genannte Richtwert liegt bei höchstens 300 mg pro Tag. Energydrinks meiden.' },
    ],
    sources: [S.ameliAliments, S.ameliAlimentation, S.listeriose],
  };

  const EAT_HYGIENE: FoodSection = {
    key: 'hygiene',
    title: 'Hygiene und Garen',
    items: [
      { title: 'Kühlschrank', text: 'Auf höchstens 4 °C eingestellt, regelmäßig gereinigt. Verbrauchsdaten beachten und nach dem Öffnen rasch verzehren.' },
      { title: 'Reste', text: 'Nicht länger als 3 Tage, so lange aufwärmen, bis sie durch und durch heiß sind.' },
      { title: 'Rohes und Gegartes getrennt', text: 'Rohes Fleisch, ungewaschenes Gemüse und verzehrfertige Lebensmittel nicht miteinander in Kontakt bringen.' },
      { title: 'Waschen', text: 'Obst, Gemüse, Kräuter und Küchenutensilien gründlich waschen und dir vor dem Kochen und nach dem Anfassen von rohem Fleisch die Hände waschen.' },
      { title: 'Auftauen', text: 'Im Kühlschrank, nie auf der Arbeitsfläche.' },
      { title: 'Garten und Tiere', text: 'Wenn du nicht gegen Toxoplasmose immun bist: im Garten mit Handschuhen arbeiten und die Katzentoilette meiden.' },
    ],
    sources: [S.ameliAliments, S.toxoplasmose],
  };

  const NUTRIENTS: Nutrient[] = [
    { key: 'iron', title: 'Eisen', why: 'Der Bedarf steigt, vor allem gegen Ende der Schwangerschaft.', where: 'Hülsenfrüchte, Fisch, Fleisch.', professional: 'Deine Ärztin, dein Arzt oder deine Hebamme kann bei Bedarf Eisen verschreiben: Folge ihrem Rat.' },
    { key: 'calcium', title: 'Calcium', why: 'Wichtig für das Skelett des Babys, vor allem im 3. Trimester.', where: 'Pasteurisierte Milchprodukte, manche calciumreichen Mineralwässer.', professional: 'Sprich mit deiner Fachperson über deine Gewohnheiten (zum Beispiel ohne Milchprodukte).' },
    { key: 'protein', title: 'Eiweiß', why: 'Es begleitet das Wachstum des Babys.', where: 'Fleisch, Fisch, gut durchgegarte Eier, Hülsenfrüchte, Milchprodukte.', professional: 'Wenn du dich vegetarisch oder vegan ernährst, lass dich von deiner Fachperson beraten.' },
    { key: 'fiber', title: 'Ballaststoffe', why: 'Sie unterstützen die Verdauung, die in der Schwangerschaft oft langsamer ist.', where: 'Gemüse, Obst, Hülsenfrüchte, Vollkornprodukte.', professional: 'Wenn die Verstopfung anhält, sprich darüber, bevor du ein Abführmittel nimmst.' },
    { key: 'b9', title: 'Vitamin B9 (Folate)', why: 'Ganz am Anfang der Schwangerschaft wichtig für die Entwicklung des Nervensystems.', where: 'Grünes Blattgemüse, Hülsenfrüchte.', professional: 'Am Anfang der Schwangerschaft reicht die Ernährung allein nicht aus: Deine Ärztin, dein Arzt oder deine Hebamme verschreibt gegebenenfalls ein Ergänzungsmittel und sagt dir, wie lange. Die App empfiehlt nie eines.' },
  ];

  const SUPPLEMENT_NOTICE = 'Die App empfiehlt keine Nahrungsergänzungsmittel. Manche enthalten Vitamine oder Mineralstoffe, die in hoher Dosis schädlich sind: Folge dem Rat der Fachperson, die deine Schwangerschaft begleitet.';
  const NOT_ADVICE = 'Allgemeine Informationen aus offiziellen französischen Quellen, keine persönliche medizinische Beratung.';
  const NUTRITION_SOURCES: ArticleSource[] = [S.ameliAlimentation, S.ameliAliments, S.listeriose, S.toxoplasmose, L.santeB9];

  return { CARE_SOURCES, SYMPTOM_CARE, SAFETY_CONTACTS, EAT_INTERESTING, EAT_AVOID, EAT_HYGIENE, NUTRIENTS, SUPPLEMENT_NOTICE, NOT_ADVICE, NUTRITION_SOURCES };
}
