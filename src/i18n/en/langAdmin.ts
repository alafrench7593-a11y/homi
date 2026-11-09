import type { langAdmin as fr } from '../fr/langAdmin';
import type { Messages } from '../types';

export const langAdmin: Messages<typeof fr> = {
  'la.title': 'Article languages',
  'la.subtitle': 'Publish translated articles after review',
  'la.open': 'Article languages',
  'la.denied': 'Administrators only.',
  'la.rule': 'Translated health articles must be reviewed by a qualified person (a native-speaking health professional) before publication. Until a language is published, the app shows the English version.',
  'la.lang.es': 'Spanish',
  'la.lang.de': 'German',
  'la.lang.it': 'Italian',
  'la.off': 'Not published: English version shown',
  'la.since': 'Published since {date}',
  'la.confirmT': 'Publish these articles?',
  'la.confirmB': 'Confirm that the articles in {lang} have been reviewed. They will appear immediately for everyone using this language.',
  'la.confirmOk': 'Publish',
  'la.published': 'Articles published.',
  'la.unpublished': 'Publication withdrawn: the English version is shown again.',
  'la.note': 'The app interface, topics and community spaces are already in all five languages; only the article texts are awaiting this approval.',
};
