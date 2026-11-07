import type { videos as fr } from '../fr/videos';
import type { Messages } from '../types';

export const videos: Messages<typeof fr> = {
  'tool.official_videos': 'Videos & articles',
  'tool.official_videos.sub': 'Official videos and related articles',
  'vid.title': 'Videos & articles',
  'vid.subtitle': { one: '{count} official video, with related articles', other: '{count} official videos, with related articles' },
  'vid.intro': 'Videos from Santé publique France, the French National Authority for Health and the French health insurance, to watch here in the app (in French). Under each video, library articles to go further. Nothing loads from YouTube until you tap “Play”.',
  'vid.all': 'All',
  'vid.topic.pregnancy': 'Pregnancy',
  'vid.topic.baby': 'Baby day to day',
  'vid.topic.sleep': 'Sleep',
  'vid.topic.feeding': 'Breast and bottle feeding',
  'vid.topic.meals': 'Children’s meals',
  'vid.topic.couple': 'Couple',
  'vid.topic.me': 'Looking after yourself',
  'vid.toRead': 'Read next',
  'vid.library': 'More topics in the library:',
  'vid.libraryCount': { one: '{count} article', other: '{count} articles' },
  'vid.librarySub': { one: '{count} official video to watch in the app', other: '{count} official videos to watch in the app' },
  'vid.profileSub': { one: '{count} official video and its articles', other: '{count} official videos and their articles' },
  'vid.homeCount': { one: '{count} official video · with related articles', other: '{count} official videos · with related articles' },
  'vid.homeDetail': 'Official videos and articles by topic',
  'vid.seeAll': { one: 'See the video and its articles', other: 'See all {count} videos and their articles' },
  'vid.checked': 'Videos checked on {date}: published by the official channels shown, which allow playback in other apps. Cookie-free YouTube player.',
  'vid.notAdvice': 'These videos inform; they don’t replace advice from your doctor, midwife or child health service. In an emergency: 15 or 112 (France).',
};
