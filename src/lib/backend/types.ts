/**
 * Contrat de la couche de données. Deux implémentations :
 *  - SupabaseBackend : la vraie base (RLS, stockage privé, fonctions backend) ;
 *  - DemoBackend : base locale sur l'appareil, utilisée tant que Supabase
 *    n'est pas configuré (EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY absents).
 */

export type FilterOp = 'eq' | 'neq' | 'in' | 'gte' | 'lte' | 'gt' | 'lt' | 'is' | 'ilike' | 'contains';
export interface Filter { col: string; op: FilterOp; value: unknown }
export interface Order { col: string; asc?: boolean }

export interface Query {
  table: string;
  /** Colonnes à lire (défaut : toutes). Nécessaire quand une colonne n'est pas lisible (ex. empreinte d'un jeton). */
  columns?: string;
  filters?: Filter[];
  order?: Order[];
  limit?: number;
}

export interface Session { userId: string; email: string | null }

export interface AuthApi {
  getSession(): Promise<Session | null>;
  onChange(cb: (s: Session | null) => void): () => void;
  /** `meta` : consentements donnés à l'inscription (CGU, confidentialité, 18 ans), gardés avec le compte. */
  signUp(email: string, password: string, meta?: Record<string, unknown>): Promise<{ needsConfirmation: boolean }>;
  /** Renvoie l'e-mail de confirmation d'inscription. */
  resendConfirmation(email: string): Promise<void>;
  /** Connexion Apple ou Google (lève une erreur en français si indisponible). */
  signInWithProvider(provider: 'apple' | 'google'): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signOut(allDevices?: boolean): Promise<void>;
  resetPassword(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  /** Lien reçu par e-mail (confirmation, réinitialisation) : échange du code PKCE contre une session. */
  exchangeCode(code: string): Promise<void>;
}

/** `bytes` : contenu déjà en mémoire (PDF créé sur l'appareil) ; sinon le fichier est lu depuis `uri`. */
export interface UploadFile { uri: string; mimeType: string; size: number; name?: string; bytes?: Uint8Array }

export interface StorageApi {
  upload(bucket: string, path: string, file: UploadFile): Promise<void>;
  signedUrl(bucket: string, path: string, expiresInSeconds: number): Promise<string>;
  remove(bucket: string, paths: string[]): Promise<void>;
}

export class BackendError extends Error {
  constructor(message: string, public code?: string, public hint?: string, public status?: number) {
    super(message);
  }
  get isPremiumRequired() {
    return this.hint === 'premium_required' || this.status === 402;
  }
  get isNetwork() {
    return this.code === 'network';
  }
}

export interface Backend {
  mode: 'supabase' | 'demo';
  auth: AuthApi;
  storage: StorageApi;
  select<T>(q: Query): Promise<T[]>;
  insert<T>(table: string, rows: Record<string, unknown> | Record<string, unknown>[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }): Promise<T[]>;
  update<T>(table: string, patch: Record<string, unknown>, filters: Filter[]): Promise<T[]>;
  remove(table: string, filters: Filter[]): Promise<void>;
  rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T>;
  invoke<T>(fn: string, body: unknown): Promise<T>;
  /**
   * Appel d'une fonction backend en diffusion continue (Server-Sent Events).
   * `onEvent` reçoit chaque événement intermédiaire (« meta », « delta »…) ;
   * la promesse se résout avec l'événement final « done » (ou la réponse JSON
   * si le serveur a répondu sans diffusion, par exemple une orientation urgente).
   * Sur les plateformes sans flux lisible, bascule automatiquement sans diffusion.
   */
  invokeStream<T>(fn: string, body: Record<string, unknown>, onEvent: (event: string, data: unknown) => void): Promise<T>;
  /**
   * Changements faits ailleurs (autre appareil, coparent) sur des tables, en temps réel.
   * Les droits (RLS) s'appliquent côté serveur. Absent en démonstration (une seule personne, un seul appareil).
   */
  subscribeChanges?(specs: ChangeSpec[], onChange: (table: string) => void, onStatus?: (s: 'live' | 'offline') => void): () => void;
}

export interface ChangeSpec { table: string; /** filtre PostgREST, ex. « household_id=eq.<uuid> » */ filter?: string }

export const eq = (col: string, value: unknown): Filter => ({ col, op: 'eq', value });
export const inList = (col: string, value: unknown[]): Filter => ({ col, op: 'in', value });
export const gte = (col: string, value: unknown): Filter => ({ col, op: 'gte', value });
export const lte = (col: string, value: unknown): Filter => ({ col, op: 'lte', value });
export const isNull = (col: string): Filter => ({ col, op: 'is', value: null });
