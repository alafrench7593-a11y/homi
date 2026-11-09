/**
 * Contrôle de qualité de la photo AVANT toute interprétation :
 * luminosité, surexposition, netteté, résolution.
 * Si la qualité est insuffisante, l'analyse s'arrête et répond « Photo inexploitable ».
 *
 * Les seuils ont été réglés sur des images de synthèse (voir les tests) :
 * ils doivent être recalibrés sur un jeu de vraies photos avant publication.
 */
import { localized } from '@/i18n/localized';
import { luminance, percentile, type RGBAImage } from './image';

export type QualityIssue = 'too_dark' | 'too_bright' | 'blurry' | 'too_small';

export interface QualityReport {
  /** Luminosité moyenne de l'image (0–255). */
  brightness: number;
  /** Luminosité moyenne de la fenêtre de résultat cadrée (0–255), si connue. */
  windowBrightness: number | null;
  /** Indice de netteté (0 = très flou, ~1 = bords francs). */
  sharpness: number;
  /** Part de pixels saturés (blanc pur) dans l'image. */
  clipped: number;
  issues: QualityIssue[];
  ok: boolean;
  /** Score de qualité 0–1 utilisé dans le niveau de confiance. */
  score: number;
}

export const QUALITY_THRESHOLDS = {
  minSide: 120,
  darkImage: 45,
  darkWindow: 70,
  brightClipped: 0.6,
  blurry: 0.15,
  sharpGood: 0.35,
};

const QUALITY_MESSAGES_FR: Record<QualityIssue, string> = {
  too_dark: 'Photo trop sombre : placez-vous près d’une fenêtre ou sous une lumière blanche, sans flash.',
  too_bright: 'Photo surexposée : évitez le flash et les reflets directs sur la fenêtre de résultat.',
  blurry: 'Photo floue : tenez le téléphone immobile, à 10–15 cm, et touchez l’écran pour faire la mise au point.',
  too_small: 'Image trop petite : rapprochez-vous pour que la fenêtre de résultat occupe une bonne partie de la photo.',
};

const QUALITY_MESSAGES_EN: Record<QualityIssue, string> = {
  too_dark: 'Photo too dark: stand near a window or under a white light, without flash.',
  too_bright: 'Photo overexposed: avoid flash and direct glare on the result window.',
  blurry: 'Photo blurry: hold the phone still, 10–15 cm away, and tap the screen to focus.',
  too_small: 'Image too small: move closer so that the result window fills a good part of the photo.',
};
const QUALITY_MESSAGES_ES: Record<QualityIssue, string> = {
  too_dark: 'Foto demasiado oscura: colócate cerca de una ventana o bajo una luz blanca, sin flash.',
  too_bright: 'Foto sobreexpuesta: evita el flash y los reflejos directos sobre la ventana de resultado.',
  blurry: 'Foto borrosa: sujeta el teléfono sin moverlo, a 10–15 cm, y toca la pantalla para enfocar.',
  too_small: 'Imagen demasiado pequeña: acércate para que la ventana de resultado ocupe buena parte de la foto.',
};
const QUALITY_MESSAGES_DE: Record<QualityIssue, string> = {
  too_dark: 'Foto zu dunkel: Stell dich an ein Fenster oder unter weißes Licht, ohne Blitz.',
  too_bright: 'Foto überbelichtet: Vermeide den Blitz und direkte Spiegelungen auf dem Ergebnisfenster.',
  blurry: 'Foto unscharf: Halte das Handy ruhig, in 10–15 cm Abstand, und tippe auf den Bildschirm, um scharfzustellen.',
  too_small: 'Bild zu klein: Geh näher heran, damit das Ergebnisfenster einen guten Teil des Fotos ausfüllt.',
};
const QUALITY_MESSAGES_IT: Record<QualityIssue, string> = {
  too_dark: 'Foto troppo scura: mettiti vicino a una finestra o sotto una luce bianca, senza flash.',
  too_bright: 'Foto sovraesposta: evita il flash e i riflessi diretti sulla finestra del risultato.',
  blurry: 'Foto sfocata: tieni il telefono fermo, a 10–15 cm, e tocca lo schermo per mettere a fuoco.',
  too_small: 'Immagine troppo piccola: avvicinati perché la finestra del risultato occupi buona parte della foto.',
};
export const QUALITY_MESSAGES: Record<QualityIssue, string> = localized(QUALITY_MESSAGES_FR, QUALITY_MESSAGES_EN, { es: QUALITY_MESSAGES_ES, de: QUALITY_MESSAGES_DE, it: QUALITY_MESSAGES_IT });

export function assessQuality(img: RGBAImage, windowBrightness: number | null = null): QualityReport {
  const { width: w, height: h, data } = img;
  const lum = new Float32Array(w * h);
  let sum = 0;
  let clippedCount = 0;
  for (let i = 0; i < w * h; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const l = luminance(r, g, b);
    lum[i] = l;
    sum += l;
    if (r >= 252 && g >= 252 && b >= 252) clippedCount++;
  }
  const brightness = sum / (w * h);
  const clipped = clippedCount / (w * h);

  // Netteté : moyenne des 1 % de gradients les plus forts, rapportée à l'amplitude de l'image.
  const grads: number[] = [];
  const step = Math.max(1, Math.floor(Math.sqrt((w * h) / 60000))); // échantillonnage sur les grandes images
  for (let y = 0; y < h - 1; y += step) {
    for (let x = 0; x < w - 1; x += step) {
      const i = y * w + x;
      grads.push(Math.max(Math.abs(lum[i + 1] - lum[i]), Math.abs(lum[i + w] - lum[i])));
    }
  }
  grads.sort((a, b) => b - a);
  const top = grads.slice(0, Math.max(5, Math.floor(grads.length * 0.01)));
  const topMean = top.reduce((a, b) => a + b, 0) / top.length;
  const lumList = Array.from(lum.filter((_, i) => i % step === 0));
  const range = Math.max(25, percentile(lumList, 99) - percentile(lumList, 1));
  const sharpness = Math.min(1.5, topMean / range);

  const t = QUALITY_THRESHOLDS;
  const issues: QualityIssue[] = [];
  if (Math.min(w, h) < t.minSide) issues.push('too_small');
  if (brightness < t.darkImage || (windowBrightness != null && windowBrightness < t.darkWindow)) issues.push('too_dark');
  else if (clipped > t.brightClipped) issues.push('too_bright');
  if (sharpness < t.blurry) issues.push('blurry');

  const lightRef = windowBrightness ?? brightness;
  const lightScore = lightRef < 90 ? Math.max(0, (lightRef - t.darkWindow) / (90 - t.darkWindow)) : 1;
  const sharpScore = Math.min(1, Math.max(0, (sharpness - t.blurry) / (t.sharpGood - t.blurry)));
  const score = issues.length ? 0 : Math.round(Math.min(lightScore, 0.4 + 0.6 * sharpScore) * 100) / 100;

  return { brightness, windowBrightness, sharpness, clipped, issues, ok: issues.length === 0, score };
}
