/** Lecteur YouTube intégré (web) : iframe youtube-nocookie, chargée seulement après « Lire ». */
import React from 'react';
import { embedUrl } from '@/lib/domain/officialVideos';

export function YouTubeFrame({ id, title, lang }: { id: string; title: string; lang: string; onError: () => void }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
  return React.createElement('iframe', {
    src: embedUrl(id, { origin, lang }),
    title,
    allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
    allowFullScreen: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    'data-testid': 'video-frame',
    style: { border: 0, width: '100%', height: '100%', display: 'block', background: '#000' },
  });
}
