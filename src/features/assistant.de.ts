/** Assistant — textes allemands (questions suggérées, présentation), traduits depuis le français. */
import type { Journey } from '@/lib/types';

export const ASSISTANT_INTRO_DE =
  'Du sprichst mit einem KI-Assistenten, der auf Informationen zu Gesundheit und Elternschaft spezialisiert ist. Er ersetzt weder eine Ärztin oder einen Arzt, eine Hebamme, eine Kinderärztin oder einen Kinderarzt noch den Notdienst.';

export const SUGGESTIONS_BY_JOURNEY_DE: Record<Journey, { label: string; questions: string[] }> = {
  avoid: {
    label: 'Verhütung',
    questions: [
      'Welche Verhütungsmethoden gibt es?',
      'Was tun, wenn ich die Pille vergessen habe?',
      'Wie funktioniert die Notfallverhütung?',
      'Welche Verhütung ist nach einer Geburt möglich?',
    ],
  },
  cycle: {
    label: 'Mein Zyklus',
    questions: [
      'Wie lange dauert ein Zyklus üblicherweise?',
      'Sind unregelmäßige Perioden häufig?',
      'Welche Beschwerden können die Periode begleiten?',
      'Wann sollte ich mit schmerzhaften Perioden zur Ärztin oder zum Arzt?',
    ],
  },
  ttc: {
    label: 'Kinderwunsch',
    questions: [
      'Welche Untersuchungen sind vor einer Schwangerschaft sinnvoll?',
      'Warum sollte man vor einer Schwangerschaft Folsäure nehmen?',
      'Wie lange dauert es im Durchschnitt, schwanger zu werden?',
      'Wann sollte ich ärztlichen Rat suchen, wenn die Schwangerschaft ausbleibt?',
    ],
  },
  pregnant: {
    label: 'Schwangerschaft',
    questions: [
      'Was gehört in meine Kliniktasche?',
      'Welche Lebensmittel sollte ich in der Schwangerschaft meiden?',
      'Bei welchen Anzeichen sollte ich den Kreißsaal anrufen?',
      'Wie wird eine Zwillingsschwangerschaft begleitet?',
    ],
  },
  newborn: {
    label: 'Baby',
    questions: [
      'Woran erkenne ich, ob mein Baby genug trinkt?',
      'Wie lege ich mein Baby sicher schlafen?',
      'Mein Baby spuckt: Worauf sollte ich achten?',
      'Welche sind die ersten Vorsorgetermine für das Baby?',
    ],
  },
  child: {
    label: 'Kind',
    questions: [
      'Wie beginne ich mit der Beikost?',
      'Wie viele Stunden Schlaf braucht ein 2-jähriges Kind?',
      'Was sollte ich vor dem Termin in der Kinderarztpraxis notieren?',
      'Wie kann ich die Bildschirmzeit bei kleinen Kindern begrenzen?',
    ],
  },
  family: {
    label: 'Familie',
    questions: [
      'Wie bereite ich meine Kinder auf die Ankunft des Babys vor?',
      'Wie organisieren wir die Nächte mit Zwillingen?',
      'Wie erkenne ich elterliche Erschöpfung?',
      'Wozu dient die Rückbildung des Beckenbodens?',
    ],
  },
};
