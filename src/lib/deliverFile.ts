/**
 * Remise d'un fichier fabriqué sur l'appareil : feuille de partage du téléphone (mobile) ou téléchargement (web).
 * Toujours déclenchée par l'utilisatrice ; le fichier temporaire est effacé ensuite ; aucun lien public n'est créé.
 */
import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import { writeTemp } from '@/lib/documents/io';
import { discardLocalImage } from '@/lib/cycleAnalysis/privacy';

export async function deliverFile(bytes: Uint8Array, name: string, mime: string, dialogTitle: string) {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mime }));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    return;
  }
  const ext = mime === 'application/pdf' ? 'pdf' : mime.split('/')[1] ?? 'bin';
  const uri = writeTemp(bytes, ext);
  try {
    if (!(await Sharing.isAvailableAsync())) throw new Error('share_unavailable');
    await Sharing.shareAsync(uri, { mimeType: mime, dialogTitle, UTI: mime === 'application/pdf' ? 'com.adobe.pdf' : undefined });
  } finally {
    await discardLocalImage(uri);
  }
}
