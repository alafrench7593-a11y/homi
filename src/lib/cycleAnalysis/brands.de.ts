/** Deutsche Texte der Leseregeln (gleiche Kennungen und gleiche Reihenfolge wie im Französischen). */
import type { RuleTexts } from './brands';

export const DE_TEXTS: RuleTexts = {
  'clearblue-detection-precoce': {
    model: 'Détection Précoce (Linien)',
    readingRules: [
      'Warte die vollen 3 Minuten ab und lies spätestens 10 Minuten nach dem Test ab.',
      'Linie im Kontrollfenster + Linie im Ergebnisfenster: positiv, unabhängig von der Intensität.',
      'Nur Kontrolllinie: negativ.',
      'Keine Linie im Kontrollfenster: ungültiger Test, bitte wiederholen.',
    ],
    source: { title: 'Packungsbeilage Clearblue Détection Précoce (Französisch)' },
  },
  'first-response-early-result': {
    model: 'Early Result (Linien)',
    readingRules: [
      'Warte 3 Minuten; lies ein negatives Ergebnis nicht nach 10 Minuten ab.',
      'Zwei rosa Linien: positiv (eine Linie kann heller sein als die andere).',
      'Nur eine rosa Linie: negativ.',
      'Keine rosa Linie nach 3 Minuten: ungültiger Test.',
    ],
    source: { title: 'Packungsbeilage First Response Early Result', note: 'Nordamerikanische Packungsbeilage: Prüfe die Beilage der in Frankreich gekauften Packung.' },
  },
  'clearblue-detection-rapide': {
    model: 'Détection Rapide (Zeichen + / −)',
    readingRules: [
      'Warte 3 Minuten (ein „Enceinte“ kann schon ab 1 Minute erscheinen) und lies spätestens 10 Minuten nach dem Test ab.',
      'Blaue Linie im Kontrollfenster + Zeichen „+“: positiv, auch wenn ein Balken des „+“ blasser ist.',
      'Blaue Linie im Kontrollfenster + Zeichen „−“: negativ.',
      'Keine blaue Linie im Kontrollfenster: ungültiger Test.',
    ],
    options: {
      plus: 'Kontrolllinie + Zeichen „+“',
      minus: 'Kontrolllinie + Zeichen „−“',
      no_control: 'Keine Linie im Kontrollfenster',
      unsure: 'Ich bin mir nicht sicher',
    },
    source: { title: 'Packungsbeilage Clearblue Détection Rapide (Französisch)', note: 'Du liest das Zeichen selbst ab: Die automatische Auswertung von Kreuzen wird nicht unterstützt.' },
  },
  'clearblue-ultra-precoce-digital': {
    model: 'Détection Ultra Précoce Digital',
    readingRules: [
      'Das Ergebnis erscheint nach der Fortschrittsanzeige (1 bis 5 Minuten).',
      '„Enceinte“: positiv. „Pas Enceinte“: negativ.',
      'Ein Symbol „!“ oder eine Fehlermeldung: Der Test hat nicht funktioniert.',
    ],
    options: {
      pregnant: 'Das Display zeigt „Enceinte“',
      not_pregnant: 'Das Display zeigt „Pas Enceinte“',
      error: 'Symbol „!“ oder Fehlermeldung',
      unsure: 'Ich kann das Display nicht lesen',
    },
    source: { title: 'Packungsbeilage Clearblue Détection Ultra Précoce Digital (Französisch)' },
  },
  'one-step-lh-strip': {
    model: 'LH-Teststreifen (Co-Innovation Biotech)',
    readingRules: [
      'Lies das Ergebnis nach 5 Minuten ab; nicht später.',
      'Zwei Linien, Testlinie genauso dunkel wie oder dunkler als die Kontrolllinie: LH-Anstieg.',
      'Nur Kontrolllinie oder hellere Testlinie: kein LH-Anstieg.',
      'Keine Linie oder nur Testlinie: ungültiger Test.',
    ],
    source: { title: 'Packungsbeilage One Step LH Test Strip (EU)' },
  },
  'clearblue-ovulation-digital': {
    model: 'Digitaler Ovulationstest (Smiley)',
    readingRules: [
      'Ein Smiley erscheint, wenn der LH-Anstieg erkannt wird.',
      'Die Anzeigedauer und die anderen Symbole findest du in der Packungsbeilage.',
    ],
    options: {
      smiley: 'Ein Smiley wird angezeigt',
      no_smiley: 'Kein Smiley',
      error: 'Symbol oder Fehlermeldung',
      unsure: 'Ich bin mir nicht sicher',
    },
    source: { title: 'Produktblatt Clearblue Digitaler Ovulationstest', note: 'Die geprüfte Quelle bestätigt nur den Smiley: Das Symbol kann nicht per Texterkennung gelesen werden, deshalb liest du es selbst ab.' },
  },
};
