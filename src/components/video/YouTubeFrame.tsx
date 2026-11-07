/**
 * Lecteur YouTube intégré (iOS / Android) : WebView avec l'iframe youtube-nocookie.
 * Le référent est l'identifiant de l'appli (https://fr.aufildenous.app), comme YouTube le demande pour les WebView :
 * sans référent, le lecteur affiche « Erreur 153 ».
 */
import React from 'react';
import { WebView } from 'react-native-webview';
import { BRAND } from '@/config/brand';
import { embedUrl } from '@/lib/domain/officialVideos';

const ORIGIN = `https://${BRAND.bundleId}`;

export function YouTubeFrame({ id, title, lang, onError }: { id: string; title: string; lang: string; onError: () => void }) {
  const src = embedUrl(id, { origin: ORIGIN, lang });
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="strict-origin-when-cross-origin">
<style>html,body{margin:0;height:100%;background:#000}iframe{border:0;width:100%;height:100%}</style></head>
<body><iframe src="${src}" title="${title.replace(/["<>&]/g, '')}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></body></html>`;
  return (
    <WebView
      source={{ html, baseUrl: ORIGIN }}
      style={{ flex: 1, backgroundColor: '#000' }}
      allowsInlineMediaPlayback
      allowsFullscreenVideo
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
      // Liens sortants du lecteur (logo YouTube…) : jamais ouverts dans la WebView
      originWhitelist={['https://*']}
      onShouldStartLoadWithRequest={(r) => r.url === 'about:blank' || r.url.startsWith(ORIGIN) || r.url.startsWith('https://www.youtube-nocookie.com/embed/')}
      onError={onError}
      testID="video-frame"
      accessibilityLabel={title}
    />
  );
}
