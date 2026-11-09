/** Parcours fertilité — deutsche Fassung (gleiche Form wie die französische; nur die angezeigten Texte ändern sich). */
import type { FertilityJourney } from '@/lib/types-fertility';
import type { MethodInfo, ReminderPreset } from './fertility';

export const TTC_DISCLAIMER_DE =
  'Die Daten für Eisprung und fruchtbares Fenster sind Schätzungen, die aus deinen Eingaben berechnet werden. Sie können dir zur Orientierung helfen, garantieren aber niemals eine Schwangerschaft.';

export const AVOID_DISCLAIMER_DE =
  'Eine Schwangerschaft ist zu jedem Zeitpunkt des Zyklus möglich, auch außerhalb des geschätzten fruchtbaren Fensters und während der Periode. Dieser Kalender ist keine Verhütungsmethode: Um eine Schwangerschaft zu vermeiden, ist eine geeignete Verhütung nötig.';

export const AVOID_NO_SAFE_DAYS_DE =
  'Kein Tag wird hier als „sicher“ dargestellt: Der Eisprung kann sich von einem Zyklus zum nächsten nach vorne oder hinten verschieben, und Spermien können bis zu 5 Tage überleben.';

export const TIMING_INFO_DE: { title: string; text: string }[] = [
  {
    title: 'Regelmäßiger Geschlechtsverkehr',
    text: 'Geschlechtsverkehr alle 1 bis 2 Tage während des geschätzten fruchtbaren Fensters – und allgemein über den ganzen Zyklus hinweg – kann die Chancen auf eine Empfängnis erhöhen, ohne dass alles geplant werden muss.',
  },
  {
    title: 'Die Tage vor dem geschätzten Eisprung',
    text: 'Spermien können bis zu 5 Tage überleben, die Eizelle dagegen nur etwa 24 Stunden: Die 2 bis 3 Tage vor dem geschätzten Eisprung sind oft die Tage, an denen die Chancen höher sein können.',
  },
  {
    title: 'Keine Garantie',
    text: 'Selbst unter guten Bedingungen dauert es oft mehrere Monate, bis es mit einer Empfängnis klappt. Diese Anhaltspunkte garantieren keine Schwangerschaft und ersetzen nicht den Rat einer Fachperson.',
  },
  {
    title: 'Auf die Partnerschaft achten',
    text: 'Der Kalender kann belastend werden. Es ist völlig in Ordnung, in manchen Monaten gar nichts einzutragen: Es zählt dein eigenes Tempo.',
  },
];

export const EXAMS_INTRO_DE =
  'Diese Informationen helfen dir, ein Gespräch mit einer Fachperson vorzubereiten. Sie erlauben keine Diagnose und ersetzen keine Sprechstunde: Nur eine Fachperson kann deine Situation beurteilen und entscheiden, welche Untersuchungen sinnvoll sind.';

export const WHEN_TO_TALK_DE: string[] = [
  'Nach 12 Monaten regelmäßigem Geschlechtsverkehr ohne Verhütung und ohne Schwangerschaft, wenn du unter 35 bist.',
  'Nach 6 Monaten ab einem Alter von 35 Jahren.',
  'Früher bei sehr unregelmäßigen oder ausbleibenden Zyklen, sehr schmerzhaften Perioden, bekannter Vorgeschichte (Endometriose, PCOS, Genitalinfektion, Operation im Beckenbereich, Krebsbehandlung …) oder einer bekannten Schwierigkeit bei der Partnerin oder dem Partner.',
  'Jederzeit, wenn du eine Frage oder eine Sorge hast: Es ist nie zu früh, darüber zu sprechen.',
];

export const WHO_TO_SEE_DE: string[] = [
  'Deine Hausärztin oder dein Hausarzt, eine Gynäkologin oder ein Gynäkologe oder eine Hebamme: Sie können eine erste Einschätzung vornehmen und dich bei Bedarf weiterleiten.',
  'Ein Kinderwunschzentrum (assistierte Reproduktion, AMP), auf Überweisung einer Fachperson.',
  'Eine Beratungsstelle für sexuelle Gesundheit (früher Familienplanung) für alle Fragen zum Sexual- und Gefühlsleben.',
];

export const POSSIBLE_EXAMS_DE: { title: string; text: string }[] = [
  { title: 'Ein Gespräch und eine körperliche Untersuchung', text: 'Wie lange ihr es schon versucht, Regelmäßigkeit der Zyklen, Vorgeschichte, Behandlungen, Lebensweise: Das ist oft der Ausgangspunkt.' },
  { title: 'Eine Hormonuntersuchung per Blutabnahme', text: 'Manchmal an bestimmten Zyklustagen angeordnet, um die Funktion der Eierstöcke besser zu verstehen.' },
  { title: 'Ein Ultraschall des Beckens', text: 'Um die Gebärmutter und die Eierstöcke anzusehen.' },
  { title: 'Eine Untersuchung der Durchlässigkeit der Eileiter', text: 'Zum Beispiel eine Hysterosalpingographie oder eine Hysterosonographie, je nach Einschätzung der Fachperson.' },
  { title: 'Ein Spermiogramm für den Partner', text: 'Fruchtbarkeit betrifft beide Partner: Die Untersuchung des Spermas gehört oft zur ersten Abklärung eines Paares.' },
  { title: 'Serologische Tests und Überprüfung der Impfungen', text: 'Sinnvoll vor einer Schwangerschaft, unabhängig davon, ob Schwierigkeiten bestehen oder nicht.' },
];

export const EXAMS_FOOTER_DE =
  'Manche Untersuchungen und Behandlungen werden unter bestimmten Voraussetzungen von der französischen Krankenversicherung (Assurance maladie) übernommen. Deine Fachperson kann dir sagen, was für deine Situation passend ist.';

export const CONTRACEPTION_INTRO_DE =
  'Neutrale Anhaltspunkte, um die Methoden zu vergleichen. Die Wahl triffst du mit einer Ärztin oder einem Arzt, einer Hebamme oder in einer Beratungsstelle für sexuelle Gesundheit, je nach deiner Gesundheit, deinen Vorlieben und deinem Leben. Die Zahlen zur Wirksamkeit geben die ungefähre Anzahl an Schwangerschaften pro 100 Personen während eines Jahres üblicher Anwendung an (mit den Vergesslichkeiten und Fehlern des echten Lebens).';

export const CONTRACEPTION_METHODS_DE: MethodInfo[] = [
  {
    kind: 'pill', title: 'Pille', summary: 'Tablette, die jeden Tag eingenommen wird, als Kombinationspräparat (Östrogen und Gestagen) oder als reines Gestagenpräparat.',
    typicalUse: 'Etwa 7 Schwangerschaften pro 100 Personen pro Jahr bei üblicher Anwendung (weniger als 1 bei perfekter Anwendung).',
    howItWorks: 'Wirkt hauptsächlich, indem sie den Eisprung verhindert (oder bei manchen Gestagenpillen den Zervixschleim verändert).',
    goodToKnow: ['Auf Rezept einer Ärztin, eines Arztes oder einer Hebamme.', 'Bei einer vergessenen Pille, Erbrechen oder Durchfall: Folge der Packungsbeilage und lass dich in der Apotheke beraten.', 'Manche Medikamente können ihre Wirksamkeit verringern: Erwähne immer deine Verhütung.'],
    reminder: 'daily',
  },
  {
    kind: 'iud_copper', title: 'Kupferspirale (Kupfer-IUP)', summary: 'Kleines Hilfsmittel, das in die Gebärmutter eingesetzt wird, ohne Hormone.',
    typicalUse: 'Weniger als 1 Schwangerschaft pro 100 Personen pro Jahr.',
    howItWorks: 'Das Kupfer macht die Spermien unbeweglich.',
    goodToKnow: ['Wird von einer Ärztin, einem Arzt oder einer Hebamme eingesetzt und entfernt.', 'Wirkdauer von 5 bis 10 Jahren je nach Modell.', 'Kann bei manchen Personen die Periode stärker machen.', 'Eignet sich auch für Personen, die noch nie ein Kind bekommen haben.'],
    reminder: 'once', renewalYears: 5,
  },
  {
    kind: 'iud_hormonal', title: 'Hormonspirale', summary: 'In die Gebärmutter eingesetztes Hilfsmittel, das ein Gestagen abgibt.',
    typicalUse: 'Weniger als 1 Schwangerschaft pro 100 Personen pro Jahr.',
    howItWorks: 'Verdickt den Zervixschleim und macht die Gebärmutterschleimhaut dünner.',
    goodToKnow: ['Wird von einer Ärztin, einem Arzt oder einer Hebamme eingesetzt und entfernt.', 'Wirkdauer von 3 bis 8 Jahren je nach Modell.', 'Die Periode wird oft schwächer, manchmal bleibt sie ganz aus.'],
    reminder: 'once', renewalYears: 5,
  },
  {
    kind: 'implant', title: 'Implantat', summary: 'Kleines Stäbchen unter der Haut des Oberarms, das ein Gestagen abgibt.',
    typicalUse: 'Weniger als 1 Schwangerschaft pro 100 Personen pro Jahr.',
    howItWorks: 'Verhindert den Eisprung.',
    goodToKnow: ['Wird von einer Ärztin, einem Arzt oder einer Hebamme unter örtlicher Betäubung eingesetzt und entfernt.', 'Wirksam für 3 Jahre.', 'Blutungen können unregelmäßig werden.'],
    reminder: 'once', renewalYears: 3,
  },
  {
    kind: 'patch', title: 'Pflaster', summary: 'Auf die Haut geklebtes Pflaster, das Hormone abgibt.',
    typicalUse: 'Etwa 7 Schwangerschaften pro 100 Personen pro Jahr bei üblicher Anwendung.',
    howItWorks: 'Verhindert den Eisprung, wie die Kombinationspille.',
    goodToKnow: ['Auf Rezept.', 'Ein Pflaster pro Woche für 3 Wochen, dann eine Woche ohne Pflaster (laut Packungsbeilage).', 'Wenn es sich löst oder du zu spät dran bist: Folge der Packungsbeilage und lass dich in der Apotheke beraten.'],
    reminder: 'weekly',
  },
  {
    kind: 'ring', title: 'Vaginalring', summary: 'Weicher Ring, der in die Scheide eingelegt wird und Hormone abgibt.',
    typicalUse: 'Etwa 7 Schwangerschaften pro 100 Personen pro Jahr bei üblicher Anwendung.',
    howItWorks: 'Verhindert den Eisprung.',
    goodToKnow: ['Auf Rezept.', 'Bleibt 3 Wochen an Ort und Stelle, dann eine Woche ohne Ring (laut Packungsbeilage).', 'Du setzt ihn selbst ein und nimmst ihn selbst heraus.'],
    reminder: 'once',
  },
  {
    kind: 'injection', title: 'Spritze', summary: 'Injektion eines Gestagens, die regelmäßig wiederholt wird.',
    typicalUse: 'Etwa 4 Schwangerschaften pro 100 Personen pro Jahr bei üblicher Anwendung.',
    howItWorks: 'Verhindert den Eisprung.',
    goodToKnow: ['Auf Rezept, wird von einer Fachperson gegeben.', 'Etwa alle 3 Monate zu wiederholen, zu dem von deiner Fachperson genannten Datum.', 'Nach dem Absetzen kann es mehrere Monate dauern, bis die Fruchtbarkeit zurückkehrt.'],
    reminder: 'once',
  },
  {
    kind: 'condom', title: 'Kondom', summary: 'Hülle, die über den erigierten Penis gezogen wird, zum einmaligen Gebrauch.',
    typicalUse: 'Etwa 13 Schwangerschaften pro 100 Personen pro Jahr bei üblicher Anwendung.',
    howItWorks: 'Verhindert, dass Sperma in die Scheide gelangt.',
    goodToKnow: ['Zusammen mit dem Femidom ist es die einzige Methode, die auch vor sexuell übertragbaren Infektionen (STI) schützt.', 'In Frankreich sind manche Kondome für unter 26-Jährige in der Apotheke kostenlos, ohne Rezept.', 'Wenn es reißt oder abrutscht, denk an die Notfallverhütung.'],
  },
  {
    kind: 'internal_condom', title: 'Femidom (inneres Kondom)', summary: 'Hülle, die in die Scheide eingeführt wird, zum einmaligen Gebrauch.',
    typicalUse: 'Etwa 21 Schwangerschaften pro 100 Personen pro Jahr bei üblicher Anwendung.',
    howItWorks: 'Verhindert, dass Sperma in die Gebärmutter gelangt.',
    goodToKnow: ['Schützt auch vor STI.', 'Kann einige Stunden vor dem Geschlechtsverkehr eingesetzt werden.'],
  },
  {
    kind: 'diaphragm', title: 'Diaphragma und Portiokappe', summary: 'Schale, die vor dem Geschlechtsverkehr tief in die Scheide eingesetzt wird.',
    typicalUse: 'Etwa 17 Schwangerschaften pro 100 Personen pro Jahr bei üblicher Anwendung.',
    howItWorks: 'Verschließt den Eingang der Gebärmutter, oft zusammen mit einem Spermizid.',
    goodToKnow: ['Die Wahl der Größe und das Erlernen der Anwendung erfolgen mit einer Fachperson.', 'Muss nach dem Geschlechtsverkehr mehrere Stunden an Ort und Stelle bleiben (laut Packungsbeilage).', 'Schützt nicht vor STI.'],
  },
  {
    kind: 'sterilisation', title: 'Sterilisation (Eileiterunterbindung, Vasektomie)', summary: 'Chirurgischer Eingriff für Personen, die keine Kinder mehr möchten.',
    typicalUse: 'Weniger als 1 Schwangerschaft pro 100 Personen pro Jahr.',
    howItWorks: 'Verhindert, dass Eizelle und Spermien aufeinandertreffen.',
    goodToKnow: ['Ist als endgültig zu betrachten.', 'In Frankreich nur für Volljährige, mit einer Bedenkzeit von 4 Monaten nach der ersten Sprechstunde.', 'Nach einer Vasektomie ist bis zur Kontrolle des Spermas weiterhin eine andere Verhütung nötig.'],
  },
  {
    kind: 'natural', title: 'Sogenannte „natürliche“ Methoden', summary: 'Beobachtung des Zyklus (Temperatur, Zervixschleim, Kalender) oder Coitus interruptus.',
    typicalUse: 'Bei üblicher Anwendung etwa 20 bis 25 Schwangerschaften pro 100 Personen pro Jahr: Das sind die am wenigsten wirksamen Methoden.',
    howItWorks: 'Geschlechtsverkehr während der geschätzten fruchtbaren Zeit vermeiden oder schützen; oder den Penis vor dem Samenerguss herausziehen.',
    goodToKnow: ['Sie erfordern Übung, regelmäßige Zyklen und große Sorgfalt.', 'Der Lusttropfen kann Spermien enthalten.', 'Eine Zyklus-App, auch diese, ist keine Verhütungsmethode.', 'Sie schützen nicht vor STI.'],
  },
];

export const CONTRACEPTION_FOOTER_DE =
  'In Frankreich werden für unter 26-Jährige viele Verhütungsmittel zu 100 % von der Assurance maladie übernommen. Nützliche Quelle: choisirsacontraception.fr (Santé publique France).';

export const EMERGENCY_INTRO_DE =
  'Nach Geschlechtsverkehr ohne Verhütung, einer vergessenen Pille oder einem abgerutschten oder gerissenen Kondom: Die Notfallverhütung kann eine Schwangerschaft verhindern. Je früher sie eingenommen wird, desto wirksamer ist sie.';

export const EMERGENCY_OPTIONS_DE: { title: string; delay: string; text: string }[] = [
  {
    title: 'Pille mit Levonorgestrel',
    delay: 'So früh wie möglich, spätestens 72 Stunden (3 Tage) nach dem Geschlechtsverkehr.',
    text: 'Ohne Rezept in der Apotheke erhältlich.',
  },
  {
    title: 'Pille mit Ulipristalacetat',
    delay: 'So früh wie möglich, bis zu 120 Stunden (5 Tage) nach dem Geschlechtsverkehr.',
    text: 'Ohne Rezept in der Apotheke erhältlich.',
  },
  {
    title: 'Kupferspirale',
    delay: 'Wird bis zu 5 Tage nach dem Geschlechtsverkehr von einer Ärztin, einem Arzt oder einer Hebamme eingesetzt.',
    text: 'Sie ist die wirksamste Notfallverhütung; sie kann danach als reguläre Verhütung an Ort und Stelle bleiben.',
  },
];

export const EMERGENCY_FACTS_DE: string[] = [
  'In Frankreich wird die Pille danach seit dem 1. Januar 2023 in der Apotheke ohne Rezept und kostenlos an alle Personen abgegeben, ob volljährig oder minderjährig.',
  'Minderjährige können sie vertraulich erhalten: in der Apotheke, bei der Schulkrankenschwester oder in einer Beratungsstelle für sexuelle Gesundheit.',
  'Die Apothekerin oder der Apotheker kann dich zur passenden Pille, zu Wechselwirkungen mit deinen Behandlungen und zur Wiederaufnahme deiner üblichen Verhütung beraten.',
  'Die Notfallverhütung schützt nicht bei späterem Geschlechtsverkehr und ersetzt keine reguläre Verhütung.',
  'Wenn deine Periode ausbleibt oder ungewöhnlich ist, wird ein Schwangerschaftstest empfohlen (etwa 3 Wochen nach dem Geschlechtsverkehr).',
];

export const EMERGENCY_CONTACTS_DE: { label: string; phone: string; description: string }[] = [
  { label: 'Nationale Rufnummer (Frankreich): Sexualität, Verhütung, Schwangerschaftsabbruch (IVG)', phone: '0800081111', description: 'Kostenlos und anonym.' },
  { label: 'Fil Santé Jeunes', phone: '0800235236', description: 'Für 12- bis 25-Jährige, kostenlos und anonym.' },
];

export const QUESTION_SUGGESTIONS_DE: Record<FertilityJourney, string[]> = {
  postpartum: [
    'Sollte das, was ich seit der Geburt empfinde, weiter begleitet werden?',
    'Ich schlafe schlecht, selbst wenn ich mich ausruhen könnte: Was denkst du darüber?',
    'Wann und wie beginne ich mit der Rückbildung des Beckenbodens?',
    'Sind diese Schmerzen zu erwarten, oder sollten sie untersucht werden?',
    'An wen kann ich mich wenden, um über meine Stimmung zu sprechen?',
  ],
  ttc: [
    'Nach wie langer Zeit sollten wir in unserer Situation ärztlichen Rat suchen?',
    'Sollte ich vor der Schwangerschaft ein Nahrungsergänzungsmittel nehmen (Folsäure)?',
    'Sind meine Impfungen und serologischen Tests auf dem aktuellen Stand?',
    'Sind meine aktuellen Behandlungen mit einer Schwangerschaft vereinbar?',
    'Erscheinen dir meine Zyklen regelmäßig?',
    'Welche Untersuchungen könnten für jeden von uns sinnvoll sein?',
    'Sollte ich meine Ernährung, meine Bewegung, meinen Alkohol- oder Tabakkonsum anpassen?',
  ],
  avoid: [
    'Welche Methode passt zu meiner Gesundheit und meiner Lebensweise?',
    'Was tun, wenn ich etwas vergesse oder zu spät dran bin?',
    'Welche Nebenwirkungen sind möglich, und wann sollte ich mir Sorgen machen?',
    'Ist meine Verhütung mit meinen anderen Behandlungen vereinbar?',
    'Wie komme ich schnell an eine Notfallverhütung?',
    'Wie wechsle ich die Methode, ohne eine ungeschützte Zeit?',
    'Wie schütze ich mich auch vor sexuell übertragbaren Infektionen?',
  ],
  pregnancy: [
    'Ist das, was ich gerade empfinde, in diesem Stadium zu erwarten?',
    'Welche Untersuchungen stehen als Nächstes an, und wann?',
    'Bei welchen Anzeichen sollte ich sofort die Geburtsklinik anrufen?',
    'Kann ich meine körperliche Aktivität und meine Arbeit so weiterführen wie bisher?',
    'Welche Lebensmittel oder Medikamente sollte ich meiden?',
  ],
  child: [
    'Liegen sein Wachstum und seine Entwicklung deiner Meinung nach im üblichen Rahmen?',
    'Welche Impfungen stehen an, und wann?',
    'Bei welchen Anzeichen sollte ich bei diesem Symptom wiederkommen oder die 15 anrufen?',
    'Sind sein Schlaf und seine Ernährung seinem Alter angemessen?',
    'Sollte eine Abklärung oder eine Fachärztin bzw. ein Facharzt in Betracht gezogen werden?',
  ],
  general: [
    'Erscheinen dir meine Periode oder mein Zyklus üblich?',
    'Sind meine Vorsorgeuntersuchungen auf dem aktuellen Stand?',
    'Sind meine Impfungen auf dem aktuellen Stand?',
    'Erfordert dieses Symptom eine weitere Untersuchung?',
    'An wen kann ich mich wenden, um über meine Stimmung oder meine Müdigkeit zu sprechen?',
  ],
};

export const TTC_REMINDER_PRESETS_DE: ReminderPreset[] = [
  { key: 'bbt', title: 'Temperatur messen', discreetTitle: 'Kleine Erinnerung am Morgen', kind: 'daily', category: 'tracking', hint: 'Jeden Morgen nach dem Aufwachen, vor dem Aufstehen.' },
  { key: 'ovulation_test', title: 'Ovulationstest', discreetTitle: 'Kleine Erinnerung', kind: 'daily', category: 'tracking', hint: 'Jeden Tag zur gleichen Uhrzeit, laut Packungsbeilage des Tests.' },
  { key: 'supplement', title: 'Mein Nahrungsergänzungsmittel', discreetTitle: 'Kleine Erinnerung', kind: 'daily', category: 'medication', hint: 'Falls dir eine Fachperson ein Nahrungsergänzungsmittel empfohlen hat.' },
  { key: 'period', title: 'Meine Periode eintragen', discreetTitle: 'Ans Eintragen denken', kind: 'once', category: 'tracking', hint: 'Um das geschätzte Datum der nächsten Periode herum.' },
  { key: 'pregnancy_test', title: 'Schwangerschaftstest', discreetTitle: 'Kleine Erinnerung', kind: 'once', category: 'tracking', hint: 'Ein Test ist ab dem Tag der erwarteten Periode zuverlässiger (Schätzung).' },
];

export const AVOID_REMINDER_PRESETS_DE: ReminderPreset[] = [
  { key: 'pill', title: 'Meine Pille', discreetTitle: 'Tägliche Erinnerung', kind: 'daily', category: 'medication', hint: 'Jeden Tag zur gleichen Uhrzeit.' },
  { key: 'patch', title: 'Mein Pflaster wechseln', discreetTitle: 'Wöchentliche Erinnerung', kind: 'weekly', category: 'medication', hint: 'Jede Woche am gleichen Tag, laut Packungsbeilage (pflasterfreie Woche).' },
  { key: 'ring', title: 'Mein Ring', discreetTitle: 'Kleine Erinnerung', kind: 'once', category: 'medication', hint: 'Datum zum Entfernen oder Einsetzen laut Packungsbeilage.' },
  { key: 'injection', title: 'Meine Spritze', discreetTitle: 'Termin einplanen', kind: 'once', category: 'medication', hint: 'Von deiner Fachperson genanntes Datum (etwa alle 3 Monate).' },
  { key: 'renewal', title: 'Mein Implantat oder meine Spirale erneuern', discreetTitle: 'Termin einplanen', kind: 'once', category: 'custom', hint: 'Einige Wochen vor dem Ende der Wirksamkeit, um einen Termin zu vereinbaren.' },
  { key: 'treatment', title: 'Meine verordnete Behandlung', discreetTitle: 'Tägliche Erinnerung', kind: 'daily', category: 'medication', hint: 'Eine bereits verordnete Behandlung, zu der von deiner Fachperson genannten Uhrzeit. Die App berechnet und verändert keine Dosis.' },
  { key: 'appointment', title: 'Mein Termin', discreetTitle: 'Termin einplanen', kind: 'once', category: 'custom', hint: 'Sprechstunde, Einsetzen oder Entfernen eines Hilfsmittels, Erneuerung: am Datum deines Termins.' },
  { key: 'prescription', title: 'Mein Rezept erneuern', discreetTitle: 'Termin einplanen', kind: 'once', category: 'custom', hint: 'Bevor deine letzte Packung oder dein letzter Blister aufgebraucht ist.' },
];
