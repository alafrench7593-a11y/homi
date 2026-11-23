/** Impression d'une fiche du Print Studio : téléphone → PDF partagé (imprimer, envoyer, enregistrer) ; web → boîte d'impression. */
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { t as tr } from '@/i18n';

/**
 * Web : `expo-print` ignore le HTML fourni et imprime la page de l'application (`window.print()`). La fiche est donc
 * imprimée depuis un cadre isolé, invisible, qui ne contient QUE ce document ; il est retiré après l'impression.
 */
export function printHtmlWeb(html: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const frame = document.createElement('iframe');
      frame.setAttribute('aria-hidden', 'true');
      frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
      frame.setAttribute('sandbox', 'allow-modals allow-same-origin');
      document.body.appendChild(frame);
      const doc = frame.contentDocument!;
      doc.open(); doc.write(html); doc.close();
      setTimeout(() => {
        try { frame.contentWindow!.focus(); frame.contentWindow!.print(); resolve(); } catch (e) { reject(e); }
        setTimeout(() => frame.remove(), 1000);
      }, 250);
    } catch (e) { reject(e); }
  });
}

export async function printSheet(html: string): Promise<'file' | 'print'> {
  if (Platform.OS === 'web') { await printHtmlWeb(html); return 'print'; }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Print = require('expo-print') as typeof import('expo-print');
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: tr('pst.share'), UTI: 'com.adobe.pdf' });
  else await Print.printAsync({ uri });
  return 'file';
}
