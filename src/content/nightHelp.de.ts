/** Hilfe für die Nacht — deutsche Fassung (gleiche Form wie die französische; nur die angezeigten Texte ändern sich). */
import type { NightAgeBand } from './nightHelp';

export const NIGHT_BANDS_DE: NightAgeBand[] = [
  {
    key: '0-3m',
    fromMonths: 0,
    toMonths: 3,
    title: '0 bis 3 Monate',
    points: [
      'Ein Neugeborenes schläft im Durchschnitt 16 bis 17 Stunden in 24 Stunden, in Abschnitten von 3 bis 4 Stunden, und unterscheidet noch nicht zwischen Tag und Nacht.',
      'Alle 2 bis 4 Stunden aufzuwachen ist in diesem Alter üblich: Dieser Rhythmus hängt von der Reifung seines Gehirns ab, nicht davon, was du tust.',
      'Zu Beginn des Stillens sind 8 bis 12 Stillmahlzeiten in 24 Stunden, nachts eingeschlossen, häufig; die nächtlichen Mahlzeiten helfen oft, die Milchbildung aufrechtzuerhalten.',
      'In diesem Alter wird empfohlen, seinem Rhythmus zu folgen und es auf den Arm zu nehmen, wenn es weint.',
      'Das abendliche Weinen ist oft um die 6. bis 8. Woche am stärksten und lässt gegen Ende des dritten Monats nach.',
      'Tagsüber: übliches Licht und übliche Geräusche. Nachts: wenig Licht, leise Stimme, ruhige Bewegungen, schnell wieder hinlegen.',
    ],
    sources: ['santeSommeilNormal', 'santeVeilleSommeil', 'santeRythmeTetees', 'santePleurs'],
  },
  {
    key: '3-6m',
    fromMonths: 3,
    toMonths: 6,
    title: '3 bis 6 Monate',
    points: [
      'Das Schlafbedürfnis bleibt groß, vor 6 Monaten im Durchschnitt um die 16 bis 17 Stunden in 24 Stunden.',
      'Schlafzyklen dauern etwa 50 bis 60 Minuten; ein kurzes Aufwachen zwischen zwei Zyklen ist normal, und viele Babys schlafen von allein wieder ein.',
      'Im Durchschnitt werden die Nächte zwischen 4 und 6 Monaten länger, aber jedes Baby hat seinen eigenen Rhythmus, und manche brauchen länger.',
      'Eine größere Flasche am Abend verlängert den Schlaf nicht und kann Spucken begünstigen.',
      'Mit etwa 6 Monaten machen viele Babys ungefähr drei Nickerchen am Tag.',
    ],
    sources: ['santeSommeilNormal', 'santeVeilleSommeil'],
  },
  {
    key: '6-12m',
    fromMonths: 6,
    toMonths: 12,
    title: '6 bis 12 Monate',
    points: [
      'Mit etwa 1 Jahr umfasst der Schlaf im Durchschnitt 13 bis 14 Stunden in 24 Stunden, davon etwa 12 Stunden nachts, mit zwei Tagschläfchen.',
      'Das Aufwachen zwischen zwei Zyklen bleibt normal; schwierig werden kann es, allein wieder einzuschlafen.',
      'Nach 6 Monaten raten Fachleute oft, dem Baby eine Chance zu geben, wieder einzuschlafen, es zu beruhigen und dann wieder hinzulegen, ohne ihm jedes Mal die Brust oder die Flasche anzubieten und ohne es lange ohne Antwort weinen zu lassen.',
      'Ab etwa 9 Monaten kann ein Entwicklungsschritt (Laufen) oder eine Veränderung im Leben (neue Betreuung, Umzug) die Nächte eine Zeit lang stören.',
      'Ein ruhiges Ritual und ein tröstender Gegenstand (ein altersgerechtes Kuscheltier) können beim Zubettgehen helfen.',
    ],
    sources: ['santeSommeilNormal', 'santeVeilleSommeil', 'mpediaTroublesSommeil'],
  },
  {
    key: '12-24m',
    fromMonths: 12,
    toMonths: 24,
    title: '12 bis 24 Monate',
    points: [
      'Das Schlafbedürfnis nimmt nach und nach ab: etwa 13 bis 14 Stunden in 24 Stunden mit ungefähr 1 Jahr.',
      'Das Vormittagsschläfchen fällt oft mit etwa 18 Monaten weg; ein Mittagsschlaf am frühen Nachmittag bleibt üblich.',
      'Bei jedem Zykluswechsel nachts aufzuwachen ist normal; Trennungsangst oder eine Veränderung im Leben können das Einschlafen erschweren.',
      'Ein dunkles Zimmer, eventuell mit einem kleinen Nachtlicht, und kein Bildschirm im Zimmer erleichtern das Einschlafen.',
      'Bildschirme werden vor 3 Jahren nicht empfohlen und sollten in jedem Alter 1 bis 2 Stunden vor dem Zubettgehen ausgeschaltet werden.',
    ],
    sources: ['santeSommeilNormal', 'mpediaTroublesSommeil', 'ameliEcrans'],
  },
  {
    key: '24-36m',
    fromMonths: 24,
    toMonths: 36,
    title: '2 bis 3 Jahre',
    points: [
      'Mit etwa 3 Jahren umfasst der Schlaf im Durchschnitt 12 bis 13 Stunden in 24 Stunden, mit einem Mittagsschlaf von etwa 2 Stunden am frühen Nachmittag.',
      'Aufwachen mitten in der Nacht bleibt häufig; oft schläft das Kind von allein wieder ein.',
      'Albtraum (eher gegen Ende der Nacht): Das Kind wacht verängstigt auf; es zu beruhigen hilft ihm, wieder einzuschlafen.',
      'Nachtschreck (eher zu Beginn der Nacht): Es schreit oder ist unruhig, ohne wirklich wach zu sein; bleib in seiner Nähe, ohne es zu wecken.',
      'Es gibt kein Schlafmittel, das für kleine Kinder geeignet ist; wenn die Schwierigkeiten anhalten, können die Ärztin, der Arzt oder die Kinderärztin bzw. der Kinderarzt helfen, die Rhythmen neu zu ordnen.',
    ],
    sources: ['santeSommeilNormal', 'mpediaTroublesSommeil', 'ameliSommeilEnfant'],
  },
];

export const SOOTHING_ROUTINES_DE: { title: string; steps: string[] }[] = [
  {
    title: 'Jeden Abend dieselbe Reihenfolge',
    steps: [
      'Drei oder vier einfache Schritte wählen und sie immer in derselben Reihenfolge beibehalten.',
      'Zum Beispiel: Waschen, Schlafanzug, Geschichte, Kuscheln, Bett.',
      'Mit sanfter Stimme ankündigen, was als Nächstes kommt: „Nach der Geschichte wird geschlafen“.',
      'Ungefähr dieselbe Uhrzeit beibehalten, ohne Perfektion anzustreben.',
    ],
  },
  {
    title: 'Das Licht dämpfen',
    steps: [
      'Das Licht im Raum eine Weile vor dem Zubettgehen dämpfen.',
      'Den Fernseher ausschalten und die Bildschirme wegräumen.',
      'Ein kleines Nachtlicht anlassen, wenn es das Kind beruhigt.',
    ],
  },
  {
    title: 'Ein lauwarmes, ruhiges Bad',
    steps: [
      'Ein lauwarmes Bad ohne allzu aufregende Spiele, wenn dein Kind es mag.',
      'Die Wassertemperatur vor dem Hineinsetzen mit dem Ellbogen prüfen.',
      'Ein Kind niemals allein in der Badewanne lassen, auch nicht für einen Augenblick.',
      'Danach direkt den Schlafanzug anziehen, in einem warmen, gedämpft beleuchteten Raum.',
    ],
  },
  {
    title: 'Schlaflied oder sanfte Musik',
    steps: [
      'Immer dasselbe Schlaflied singen oder leise sanfte Musik abspielen.',
      'Sanft im Arm wiegen, wenn dein Baby das mag.',
      'Dein Baby danach auf dem Rücken in sein Bettchen legen.',
    ],
  },
  {
    title: 'Die Geschichtenzeit',
    steps: [
      'Eine oder zwei kurze Geschichten vorlesen, immer am selben Ort.',
      'Das Kind das Buch aus zwei Vorschlägen auswählen lassen.',
      'Mit einem Ritualwort oder einer Ritualgeste abschließen („Gute Nacht, bis morgen“).',
    ],
  },
  {
    title: 'Auch für dich',
    steps: [
      'Wenn du spürst, dass die Anspannung steigt, leg dein Baby sicher in sein Bettchen und nimm dir ein paar Minuten zum Durchatmen.',
      'Sich mit einem anderen Erwachsenen abwechseln, wenn es möglich ist.',
      'Den perfekten Abend gibt es nicht: Manche Abende werden schwieriger sein, und das ist normal.',
    ],
  },
];

export const SAFE_SLEEP_DE: string[] = [
  'Leg dein Baby nachts und bei jedem Tagschlaf flach auf den Rücken; weder auf den Bauch noch auf die Seite.',
  'Lass es in seinem eigenen Bettchen im Elternschlafzimmer schlafen, idealerweise bis etwa 6 Monate; vom Schlafen im Elternbett wird abgeraten.',
  'Eine feste Matratze, passend zur Größe des Bettchens, ohne Lücken an den Seiten; leg keine zusätzliche Matratze in ein Reisebett.',
  'Keine Bettdecke, Decke, kein Kissen, Nestchen oder großes Kuscheltier: lieber ein Babyschlafsack, der zu seiner Größe passt.',
  'Nichts, was sein Gesicht bedecken oder sich um seinen Hals legen könnte (keine Kette, kein Schnullerband).',
  'Keine Lagerungshilfe, kein Kissen und kein zusammengerolltes Handtuch, um es in einer Position zu halten.',
  'Ein Zimmer mit 18 bis 20 °C, täglich gelüftet; deck es nicht zu warm zu: Sein Nacken sollte nicht feucht sein.',
  'Kein Tabakrauch in der Nähe deines Babys, weder im Zimmer noch im Auto.',
  'Schlaf nie mit deinem Baby auf einem Sofa oder in einem Sessel ein.',
  'Wenn du sehr müde bist oder ein Medikament nimmst, das schläfrig macht, leg dein Baby wieder in sein Bettchen, bevor du einschläfst.',
  'Die Babyschale ist für das Auto gedacht: Sie ersetzt nicht das Bettchen.',
  'Gib einem Baby niemals ein Medikament, damit es schläft, und schüttle es niemals.',
];

export const QUESTIONS_FOR_PRO_DE: string[] = [
  'Wie oft nächtliches Aufwachen ist in seinem Alter üblich?',
  'Wie viele Stunden Schlaf in 24 Stunden sind in seinem Alter üblich, Tagschlaf eingeschlossen?',
  'Sind nächtliche Still- oder Flaschenmahlzeiten für ihn oder sie noch sinnvoll?',
  'Woran erkenne ich, ob er oder sie genug isst? Können Sie die Gewichtskurve überprüfen?',
  'Wie kann ich ihm oder ihr helfen, Tag und Nacht zu unterscheiden?',
  'Was tun, wenn er oder sie beim Einschlafen weint?',
  'Sind sein oder ihr Schnarchen, die Atmung oder die Bewegungen im Schlaf üblich?',
  'Ist die jetzige Schlafumgebung (Bett, Schlafsack, Zimmertemperatur) geeignet?',
  'Ab wann und wie kann er oder sie im eigenen Zimmer schlafen?',
  'Bei welchen Anzeichen sollte ich nachts anrufen, und wen?',
  'Ich bin sehr müde: Welche Unterstützung gibt es für uns Eltern?',
];

export const SEEK_HELP_NOW_DE: string[] = [
  'Baby unter 3 Monaten mit Fieber (38 °C oder mehr): sofort notfallmäßig ärztliche Hilfe holen, ohne zu warten, auch wenn es ihm gut zu gehen scheint.',
  'Atemschwierigkeiten: schnelle oder unregelmäßige Atmung, Atempausen, Nasenflügeln, Einziehungen zwischen den Rippen, blaue Lippen: ruf die 15 an.',
  'Baby ungewöhnlich schläfrig, schlaff, reagiert kaum oder hat einen Schwächeanfall: ruf die 15 an.',
  'Vollständige Trinkverweigerung (Brust oder Flasche) oder Anzeichen von Austrocknung: ruf die 15 an oder hol notfallmäßig ärztliche Hilfe.',
  'Kleine rote Flecken auf der Haut, die bei Druck nicht verschwinden, oder auffällige Blässe: ruf die 15 an.',
  'Krampfanfälle oder ungewöhnliche Bewegungen: schütze das Kind, leg es auf die Seite und ruf die 15 an.',
  'Fieber über 40 °C oder Fieber mit Nackensteifigkeit, wiederholtem Erbrechen oder starken Kopfschmerzen: hol notfallmäßig ärztliche Hilfe.',
  'Ungewöhnliches Weinen, Wimmern oder jedes Verhalten, das dir ungewöhnlich oder beunruhigend vorkommt: im Zweifel ruf die 15 an.',
  'Baby atmet nicht mehr: ruf sofort die 15 oder die 112 an und schüttle es nicht.',
  'Wenn du spürst, dass du dein Baby schütteln oder ihm wehtun könntest: leg es auf den Rücken in sein Bettchen, verlass den Raum und ruf die 119 (rund um die Uhr) oder eine vertraute Person an.',
  'Wenn du Gedanken hast, dir etwas anzutun oder nicht mehr da sein zu wollen: ruf die 3114 an (kostenlos, rund um die Uhr).',
];
