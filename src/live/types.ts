/**
 * Live Activities HOMI (27/11/2026) : types partagés entre le contrôleur (app) et la mise en page (extension iOS).
 * Les props sont sérialisées en JSON et relues par la vue du moteur expo-widgets : uniquement des nombres et des
 * chaînes, déjà traduites (la vue ne peut ni traduire ni lire le thème).
 */
export type LiveKind = 'breast' | 'bottle' | 'sleep' | 'contractions' | 'pump' | 'relay';
export const LIVE_KINDS: LiveKind[] = ['breast', 'bottle', 'sleep', 'contractions', 'pump', 'relay'];

export interface LiveProps {
  /** Type (choix de l'accent dans la vue). */
  k: LiveKind;
  /** En-tête : « Allaitement », « Sieste »… (neutre en mode discret pour les contenus sensibles). */
  title: string;
  /** Prénom de l'enfant ou du parent ; vide en mode discret. */
  who: string;
  /** Ligne d'état : « Sein gauche », « En pause », « Contraction en cours »… */
  state: string;
  /** Ligne secondaire : « Commencée à 14:05 », « Dernier intervalle 4 min 30 »… */
  sub: string;
  /** Lettre courte pour la Dynamic Island compacte (« G », « D ») ; vide sinon. */
  short: string;
  /** Début du chrono (ms). Compte à rebours si `end` > 0. */
  from: number;
  /** Fin d'un compte à rebours (ms, relais de nuit) ; 0 sinon. */
  end: number;
  /** Chrono figé à cette heure (ms, biberon en pause) ; 0 sinon. */
  pause: number;
  /** Contenu de santé (grossesse) : masqué quand l'iPhone est verrouillé et dans les captures. */
  sens: boolean;
  /** Logo HOMI du dossier partagé (file://) ; vide si indisponible. */
  logo: string;
  /** Textes de secours : contenu périmé, créneau terminé. */
  l: { stale: string; done: string };
}

/** Une session en cours, calculée depuis les données réelles : au plus une Live Activity par session. */
export interface LiveSession {
  kind: LiveKind;
  /** Identifiant stable de la session (id de la tétée, du biberon, du sommeil, de la séance de contractions…). */
  key: string;
  /** Périmètre des données qui décident de sa fin : id de l'enfant, « me », « device » ou « household ». */
  scope: string;
  props: LiveProps;
  /** Lien profond vers l'écran concerné (schéma BRAND.scheme). */
  url: string;
  /** Au-delà, iOS signale le contenu comme périmé (env.isStale). */
  staleAt: number;
}
