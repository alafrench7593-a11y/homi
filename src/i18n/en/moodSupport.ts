import type { moodSupport as fr } from '../fr/moodSupport';
import type { Messages } from '../types';

export const moodSupport: Messages<typeof fr> = {
  'ms.section': 'My wellbeing',
  'cf.give': 'Hand over to: {name}',
  'cf.given': 'Handed over to: {name}.',
  'ms.lowTitle': 'The last few days seem heavy',
  'ms.lowBody': 'You noted several hard days this week. Talking about it often helps: your midwife, your doctor or your child health centre can listen. 3114 also answers, free of charge, 24/7. And you can ask someone to take over so you can rest.',
  'ms.talk': 'Note a question for my appointment',
  'ms.relay': 'Ask for a break',
  'ms.hide': 'Hide for this week',
  'ms.weeklyT': 'How are you this week?',
  'ms.weeklyB': 'Take a minute for your mood check-in. It stays private.',
  'ms.weeklyPref': 'Mood check-in reminder',
  'ms.weeklyPrefD': 'Once a week, on Sunday at 6pm. Only you can see your check-ins.',
  'wb.title': '“Baby” widget (iPhone)',
  'wb.pref': 'Show times in the widget',
  'wb.prefD': 'Next bottle and next treatment dose. Never a medicine name. When off, the widget only shows “Open the app”.',
  'wb.howto': 'To add it: long-press the iPhone home screen, then “+” and “Au fil de nous”.',
  'wb.bottle': '{name}’s bottle: {time}',
  'wb.dose': 'Treatment ({who}): {time}',
  'wb.nothing': 'Nothing planned yet',
};
