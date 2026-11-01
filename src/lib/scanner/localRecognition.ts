/**
 * Reconnaissance LOCALE sur le téléphone (Google ML Kit) : texte imprimé et codes-barres sur une photo.
 * Aucune image n'est envoyée à un serveur pour la reconnaissance.
 *
 * Ces modules natifs nécessitent un build de développement (EAS / expo run) : ils sont absents
 * d'Expo Go et du web. Dans ce cas, l'application le dit et propose la saisie manuelle.
 */
import { NativeModules, Platform } from 'react-native';
import { t as tr } from '@/i18n';
import { estimateReadability, extractIngredientSection, extractPrecautions, extractPrintedBarcode } from '../domain/scanOcr';

/** Constante française (API inchangée) ; le message de l'exception, lui, suit la langue en cours. */
export const LOCAL_RECOGNITION_UNAVAILABLE = 'Lecture locale indisponible ici : utilisez la saisie manuelle';

export function localTextRecognitionAvailable(): boolean {
  return Platform.OS !== 'web' && !!NativeModules.TextRecognition;
}

export function localBarcodeRecognitionAvailable(): boolean {
  return Platform.OS !== 'web' && !!NativeModules.BarcodeScanning;
}

export interface TextReading {
  text: string;
  ingredients: string | null;
  precautions: string | null;
  printedBarcode: string | null;
  /** Indice de lisibilité estimé (0 à 1), pas une probabilité d'exactitude. */
  readability: number;
}

export class LocalRecognitionUnavailable extends Error {
  constructor() { super(tr('l7.recog.unavailable')); }
}

export async function readTextFromImage(uri: string): Promise<TextReading> {
  if (!localTextRecognitionAvailable()) throw new LocalRecognitionUnavailable();
  // Chargement différé : le module n'est requis que lorsqu'il est réellement présent
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@react-native-ml-kit/text-recognition') as typeof import('@react-native-ml-kit/text-recognition');
  const result = await mod.default.recognize(uri);
  const text = result?.text ?? '';
  const ingredients = extractIngredientSection(text);
  return {
    text,
    ingredients,
    precautions: extractPrecautions(text),
    printedBarcode: extractPrintedBarcode(text),
    readability: estimateReadability(ingredients ?? text),
  };
}

/** Codes-barres (EAN-13, EAN-8, UPC) trouvés sur une photo. */
export async function readBarcodesFromImage(uri: string): Promise<string[]> {
  if (!localBarcodeRecognitionAvailable()) throw new LocalRecognitionUnavailable();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('@react-native-ml-kit/barcode-scanning') as typeof import('@react-native-ml-kit/barcode-scanning');
  const { BarcodeFormat } = mod;
  const codes = await mod.default.scan(uri);
  const wanted = new Set([BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]);
  return [...new Set((codes ?? []).filter((c) => wanted.has(c.format) || /^\d{8,14}$/.test(c.value)).map((c) => c.value.replace(/\D/g, '')).filter((v) => v.length >= 8))];
}
