/**
 * Voix d'Aura (brief du 21/11/2026) — UNIQUEMENT les capacités du téléphone ou du navigateur, aucun service vocal payant.
 *
 *  - LECTURE (synthèse) : `expo-speech` (module Expo du SDK 57, voix du système : AVSpeechSynthesizer sur iOS,
 *    TextToSpeech sur Android, speechSynthesis sur le web). Détection de capacité : sur téléphone, le module natif
 *    `ExpoSpeech` doit être présent dans le binaire (`requireOptionalNativeModule`) — une version de l'app compilée
 *    AVANT son ajout ne plante pas : la lecture est simplement indisponible. Lecture SUR DEMANDE seulement, arrêt
 *    immédiat (bouton, fermeture, changement d'écran, application en arrière-plan).
 *  - DICTÉE : pas de module de reconnaissance vocale natif dans l'app. Sur téléphone, la dictée du CLAVIER (micro du
 *    clavier iOS / Android) remplit le champ — l'autorisation est demandée par le système à sa première utilisation.
 *    Sur le web, l'API du navigateur (`SpeechRecognition`) quand elle existe : micro demandé au premier appui, texte
 *    partiel affiché dans le champ, arrêt et annulation, refus géré.
 *  - Aucune écoute permanente, aucune lecture automatique.
 */
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { getLocale } from '@/i18n';

type SpeechModule = typeof import('expo-speech');
let speechMod: SpeechModule | null | undefined;

/** Module de synthèse, ou `null` si la plateforme / le binaire ne l'a pas (jamais d'exception). */
function speech(): SpeechModule | null {
  if (speechMod !== undefined) return speechMod;
  try {
    const available = Platform.OS === 'web'
      ? typeof globalThis !== 'undefined' && 'speechSynthesis' in globalThis
      : !!requireOptionalNativeModule('ExpoSpeech');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    speechMod = available ? (require('expo-speech') as SpeechModule) : null;
  } catch {
    speechMod = null;
  }
  return speechMod;
}

/** Tests : oublie la détection (nouvelle plateforme simulée). */
export function resetVoiceCaps() { speechMod = undefined; }

/** Étiquette de langue pour la voix du système. */
export function voiceLang(locale: string = getLocale()): string {
  return ({ fr: 'fr-FR', en: 'en-GB', de: 'de-DE', es: 'es-ES', it: 'it-IT' } as Record<string, string>)[locale] ?? locale;
}

/** Texte lisible à voix haute : sans Markdown, sans liens ni adresses, longueur bornée (pur, testé). */
export function plainForSpeech(md: string, max = 1800): string {
  const s = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/[*_`>~|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return s.length > max ? `${s.slice(0, max).replace(/\s+\S*$/, '')}…` : s;
}

export const canSpeak = () => !!speech();

/** Lit un texte avec la voix du système. Renvoie `false` si la lecture est indisponible. */
export function speak(text: string, cb: { onEnd?: () => void } = {}): boolean {
  const m = speech();
  const said = plainForSpeech(text);
  if (!m || !said) return false;
  try {
    void m.stop();
    m.speak(said, { language: voiceLang(), rate: 1, onDone: cb.onEnd, onStopped: cb.onEnd, onError: () => cb.onEnd?.() });
    return true;
  } catch {
    cb.onEnd?.();
    return false;
  }
}

export function stopSpeaking() {
  try { void speech()?.stop(); } catch { /* lecture déjà arrêtée */ }
}

// ------------------------------------------------------------------------------------------------- dictée
/** `browser` : reconnaissance du navigateur ; `keyboard` : dictée du clavier du téléphone ; `none` : texte seul. */
export type DictationMode = 'browser' | 'keyboard' | 'none';

interface BrowserRecognition {
  lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
}
type RecognitionCtor = new () => BrowserRecognition;

function recognitionCtor(): RecognitionCtor | null {
  if (Platform.OS !== 'web' || typeof globalThis === 'undefined') return null;
  const g = globalThis as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return g.SpeechRecognition ?? g.webkitSpeechRecognition ?? null;
}

export function dictationMode(): DictationMode {
  if (Platform.OS === 'web') return recognitionCtor() ? 'browser' : 'none';
  return Platform.OS === 'ios' || Platform.OS === 'android' ? 'keyboard' : 'none';
}

export type DictationError = 'denied' | 'no-speech' | 'failed';
export interface DictationHandle { stop(): void; abort(): void }

/**
 * Dictée du navigateur : texte partiel au fil de l'eau, texte final à l'arrêt. `null` si indisponible.
 * Le micro est demandé par le navigateur à ce premier appel (jamais avant).
 */
export function startBrowserDictation(h: { onText: (text: string, final: boolean) => void; onError: (e: DictationError) => void; onEnd: () => void }): DictationHandle | null {
  const Ctor = recognitionCtor();
  if (!Ctor) return null;
  let r: BrowserRecognition;
  try { r = new Ctor(); } catch { return null; }
  r.lang = voiceLang();
  r.interimResults = true;
  r.continuous = false;
  r.maxAlternatives = 1;
  let text = '';
  r.onresult = (e) => {
    let interim = '';
    let finalText = '';
    for (let i = 0; i < e.results.length; i++) {
      const res = e.results[i];
      if (res.isFinal) finalText += res[0].transcript; else interim += res[0].transcript;
    }
    text = `${finalText}${interim}`.trim();
    h.onText(text, !interim);
  };
  r.onerror = (e) => {
    if (e.error === 'aborted') return; // annulation demandée par la personne
    h.onError(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'denied' : e.error === 'no-speech' ? 'no-speech' : 'failed');
  };
  r.onend = () => h.onEnd();
  try { r.start(); } catch { return null; }
  return { stop: () => { try { r.stop(); } catch { /* déjà arrêtée */ } }, abort: () => { try { r.abort(); } catch { /* déjà arrêtée */ } } };
}
