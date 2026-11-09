/** Inhalte zum Wochenbett — deutsche Fassung (aus dem Französischen übersetzt, gleiche Struktur, gleiche Kennungen). */
import type { Section } from './postpartum';

/** Quellen: Nur die Beschreibung des Herausgebers ändert sich; die Titel bleiben in ihrer Originalsprache. */
export const AWHONN_PUBLISHER_DE = 'AWHONN — US-amerikanischer Verband der Pflegefachkräfte für Frauengesundheit, Geburtshilfe und Neonatologie';

export const UNDERSTAND_DE: Section[] = [
  {
    id: 'blues',
    title: 'Der Babyblues',
    body: [
      'In den Tagen nach der Geburt sind viele Mütter sehr dünnhäutig: Tränen, Reizbarkeit, Sorgen. Das kommt häufig vor und hängt mit den großen körperlichen, hormonellen und seelischen Veränderungen zusammen.',
      'Er dauert in der Regel einige Stunden bis einige Tage und vergeht von selbst.',
    ],
    sources: ['mpj'],
  },
  {
    id: 'signs',
    title: 'Wann es sich lohnt, darüber zu sprechen',
    body: [
      'Manche Anzeichen können eine ärztliche Abklärung rechtfertigen: eine Traurigkeit, die sich festsetzt, Verlust von Interesse oder Freude, starke Ängste, ein Gefühl der Hoffnungslosigkeit, übermäßige Schuldgefühle, Schlafprobleme, selbst wenn sich die Gelegenheit zum Ausruhen bietet, emotionale Erschöpfung, Schwierigkeiten, den Alltag zu bewältigen, ein Gefühl der Distanz oder Schwierigkeiten, eine Bindung zum Baby aufzubauen, das Gefühl, überfordert zu sein.',
      'Diese Anzeichen können mehrere Ursachen haben. Nur eine Fachperson kann sie beurteilen – diese App tut das nicht.',
      'Die offiziellen Empfehlungen raten, darüber zu sprechen, wenn es länger als zwei Wochen anhält, und in jedem Fall beim geringsten Zweifel. Wenn es stark ist oder schlimmer wird, warte nicht: Du kannst schon heute darüber sprechen.',
      'Die postpartale Depression ist häufig – laut der französischen nationalen Perinatalerhebung 2021 betrifft sie 15 bis 20 % der Frauen, die entbunden haben – und sie ist behandelbar. Sie kann auch Väter betreffen.',
    ],
    sources: ['mpj', 'ministere'],
  },
  {
    id: 'who',
    title: 'Mit wem du darüber sprechen kannst',
    body: [
      'Deine Hebamme, deine Hausärztin oder dein Hausarzt, ein PMI-Zentrum (Mutter-Kind-Schutz), eine Psychologin oder ein Psychologe (das Programm „Mon soutien psy“ wird von der Assurance maladie übernommen) oder eine perinatalpsychiatrische Sprechstunde im Krankenhaus.',
      'Das frühe postnatale Gespräch, vorgesehen zwischen der 4. und 8. Woche nach der Geburt, ist ein Moment, der dir gewidmet ist. Du kannst auch darum bitten, schon früher darüber zu sprechen.',
      'Eltern-Kind-Treffpunkte und Elterngruppen helfen, aus der Isolation herauszukommen.',
    ],
    sources: ['mpj'],
  },
  {
    id: 'urgent',
    title: 'Wenn du in Gefahr bist',
    body: [
      'Wenn du Gedanken hast, dir etwas anzutun, nicht mehr da sein zu wollen oder deinem Baby etwas anzutun, oder wenn du dich sehr verwirrt fühlst: Ruf jetzt die 3114 an (kostenlos, vertraulich, rund um die Uhr) oder die 15 oder die 112, wenn die Gefahr unmittelbar ist.',
      'Für solche Gedanken musst du dich nicht schämen. Sie sind ein Zeichen, dass du Hilfe brauchst, und zwar sofort.',
    ],
    sources: ['crise'],
  },
];

export const PARTNER_DE: Section[] = [
  {
    id: 'changes',
    title: 'Was sich nach einer Geburt verändert',
    body: [
      'Der Körper erholt sich über Wochen, manchmal Monate. Der Schlaf ist zerstückelt, die Hormone verändern sich stark, und die Versorgung des Babys hört nie auf.',
      'Tränen und Verletzlichkeit in den ersten Tagen sind häufig (Babyblues) und vergehen in der Regel innerhalb weniger Tage.',
    ],
    sources: ['mpj'],
  },
  {
    id: 'difference',
    title: 'Müdigkeit, Babyblues oder mehr?',
    body: [
      'Wenn sich Traurigkeit, Angst oder Erschöpfung festsetzen, stärker werden oder sie daran hindern, den Alltag zu bewältigen, sollte eine Fachperson das beurteilen. Du musst das nicht entscheiden: Deine Rolle ist es, zuzuhören und den Weg zur Hilfe zu erleichtern.',
      'Auch Väter und Mit-Eltern können nach einer Geburt eine Depression durchmachen. Achte auch auf dich.',
    ],
    sources: ['mpj', 'ministere'],
  },
  {
    id: 'listen',
    title: 'Zuhören, ohne zu verharmlosen',
    body: [
      'Vermeide „Das ist normal, das geht vorbei“ oder „Du hast doch alles, um glücklich zu sein“. Nimm an, was sie sagt, ohne ihre Gefühle korrigieren zu wollen.',
      'Lies nicht heimlich, was nicht für dich bestimmt ist: Was sie in der App teilt, hat sie selbst gewählt.',
    ],
    sources: [],
  },
  {
    id: 'help',
    title: 'Konkret helfen',
    body: [
      'Teilt euch die Nächte (Fläschchen, Aufwachen), übernimm Mahlzeiten, Einkäufe, Wäsche und Besuche, ohne dass sie darum bitten muss.',
      'Schütze ihre Ruhezeiten: Du kümmerst dich um das Baby, das Telefon und die Tür.',
    ],
    sources: [],
  },
  {
    id: 'consult',
    title: 'Zu einem Termin ermutigen, ohne Schuldgefühle',
    body: [
      'Schlag vor, statt etwas aufzuzwingen: „Wenn du möchtest, kann ich dir helfen, einen Termin zu vereinbaren.“ Biete an, während des Termins auf das Baby aufzupassen oder sie zu begleiten.',
      'Eine Hebamme, die Hausärztin oder der Hausarzt, die PMI oder eine Psychologin bzw. ein Psychologe können sie empfangen.',
    ],
    sources: ['mpj'],
  },
  {
    id: 'urgent',
    title: 'Wann du dringend Hilfe holen solltest',
    body: [
      'Wenn sie davon spricht, sich etwas anzutun, nicht mehr da sein zu wollen, dem Baby etwas anzutun, oder wenn sie sehr verwirrt wirkt: Lass sie nicht allein, bring das Baby in Sicherheit und ruf die 3114 an, oder die 15 / 112, wenn die Gefahr unmittelbar ist.',
    ],
    sources: ['crise'],
  },
];

export const USEFUL_PHRASES_DE = [
  'Wie fühlst du dich heute wirklich?',
  'Was kann ich übernehmen, damit du durchatmen kannst?',
  'Soll ich mich um das Baby kümmern, während du dich ausruhst?',
  'Wenn du möchtest, kann ich dir helfen, einen Termin zu vereinbaren.',
  'Du musst nicht alles allein schaffen.',
];

export const RECOVERY_WARNINGS_DE = {
  call15: ['Schmerzen in der Brust', 'Atembeschwerden oder Kurzatmigkeit', 'Krampfanfälle', 'Gedanken, dir selbst oder jemand anderem etwas anzutun'],
  callPro: [
    'Blutung, die innerhalb einer Stunde eine Binde durchtränkt, oder Blutgerinnsel so groß wie ein Ei oder größer',
    'Narbe (Dammschnitt, Kaiserschnitt), die nicht heilt, gerötet ist oder nässt',
    'Rotes, geschwollenes, schmerzendes oder warmes Bein',
    'Temperatur von 38 °C oder mehr',
    'Kopfschmerzen, die trotz eines Schmerzmittels anhalten oder mit Sehstörungen einhergehen',
  ],
  source: 'awhonn' as const,
};
