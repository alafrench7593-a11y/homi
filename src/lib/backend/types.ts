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
  filters?: Filter[];
  order?: Order[];
  limit?: number;
}

export interface Session { userId: string; email: string | null }

export interface AuthApi {
  getSession(): Promise<Session | null>;
  onChange(cb: (s: Session | null) => void): () => void;
  signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }>;
  signIn(email: string, password: string): Promise<void>;
  signOut(allDevices?: boolean): Promise<void>;
  resetPassword(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  /** Lien reçu par e-mail (confirmation, réinitialisation) : échange du code PKCE contre une session. */
  exchangeCode(code: string): Promise<void>;
}

export interface UploadFile { uri: string; mimeType: string; size: number; name?: string }

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
}

export const eq = (col: string, value: unknown): Filter => ({ col, op: 'eq', value });
export const inList = (col: string, value: unknown[]): Filter => ({ col, op: 'in', value });
export const gte = (col: string, value: unknown): Filter => ({ col, op: 'gte', value });
export const lte = (col: string, value: unknown): Filter => ({ col, op: 'lte', value });
export const isNull = (col: string): Filter => ({ col, op: 'is', value: null });
