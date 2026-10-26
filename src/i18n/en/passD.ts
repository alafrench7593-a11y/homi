import type { passD as fr } from '../fr/passD';
import type { Messages } from '../types';

export const passD: Messages<typeof fr> = {
  'pd.ring.label': "Cycle ring: day {day} of about {length} (estimated length).",
  'pd.ring.day': "Day {day}",
  'pd.ring.of': "of ~{length} d · estimated",
  'pd.ring.noData': "Log your last period to see your cycle.",
  'pd.ring.legend.period': "Logged period",
  'pd.ring.legend.fertile': "Fertile window (estimated)",
  'pd.ring.legend.next': "Next period (estimated)",
  'pd.ring.detail': "See cycle details",
  'pd.ring.next': "Next period estimated around {date}",
  'pd.quick.title': "Today in one tap",
  'pd.quick.hint': "Tap to log, tap again to remove. Your most frequent symptoms come first.",
  'pd.quick.flow': "Your period flow",
  'pd.quick.symptoms': "How you feel",
  'pd.quick.mood': "Mood",
  'pd.quick.all': "Log everything in detail",
  'pd.quick.added': "{what} logged for today.",
  'pd.quick.removed': "{what} removed from today.",
  'pd.quick.flowSaved': "Flow logged: {what}.",
  'pd.quick.moodSaved': "Mood logged.",
};
