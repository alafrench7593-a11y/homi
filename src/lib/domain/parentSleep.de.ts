/** „Mein Schlaf“ — deutsche Fassung der Tipps (gleiche Form wie die französische). */
import type { SleepTip } from './parentSleep';

export const POSTPARTUM_TIPS_DE: SleepTip[] = [
  { key: 'sieste-bebe', icon: 'moon', title: 'Schlafen, wenn das Baby schläft, wann immer es geht', text: 'Sich während eines Schläfchens des Babys hinzulegen zählt, auch für 20 Minuten. Wäsche und Abwasch können warten.' },
  { key: 'relais', icon: 'users', title: 'Nachts um Ablösung bitten', text: 'Die Nächte mit dem anderen Elternteil oder einer nahestehenden Person zu teilen (Wickeln, Wiegen, Fläschchen) ermöglicht jedem einen längeren Schlafblock.' },
  { key: 'aide', icon: 'gift', title: 'Angebotene Hilfe annehmen', text: 'Ein vorbeigebrachtes Essen, ein Einkauf, eine Stunde Betreuung: Annehmen heißt auch, für deine Familie zu sorgen.' },
];

export const GENERAL_TIPS_DE: SleepTip[] = [
  { key: 'ecrans', icon: 'smartphone', title: 'Bildschirme am Abend einschränken', text: 'Wenn du kannst, leg das Handy eine Weile vor dem Schlafen weg und reduziere die Helligkeit. Der Nachtmodus der App ist für das nächtliche Aufwachen gedacht.' },
  { key: 'rituel', icon: 'feather', title: 'Ein kleines Abendritual', text: 'Sanftes Licht, ein warmes koffeinfreies Getränk, ein paar langsame Atemzüge: Ein einfacher Anker hilft manchmal beim Loslassen.' },
  { key: 'cafeine', icon: 'coffee', title: 'Koffein lieber morgens', text: 'Kaffee, Tee, Limonaden: Sie für den Tagesbeginn aufzuheben, kann das Einschlafen erleichtern.' },
];
