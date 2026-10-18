/** Documents : lecture (les droits sont appliqués par la base) et petites écritures. */
import { backend, eq } from '@/lib/backend';
import type { DocumentExtraction, DocumentRow } from '@/lib/types';
import { useHouseholdId, useRows } from './hooks';

export function useDocument(id: string | null | undefined) {
  return useRows<DocumentRow>(['documents', 'one', id ?? ''], id ? { table: 'documents', filters: [eq('id', id)] } : null);
}

export function useExtractions(documentId: string | null | undefined) {
  return useRows<DocumentExtraction>(['document_extractions', documentId ?? ''], documentId ? { table: 'document_extractions', filters: [eq('document_id', documentId)], order: [{ col: 'created_at', asc: false }] } : null);
}

/** Toutes les extractions visibles du foyer (carnet de santé : statut des vaccinations, ordonnances…). */
export function useHouseholdExtractions() {
  const hid = useHouseholdId();
  return useRows<DocumentExtraction>(['document_extractions', 'household', hid ?? ''], hid ? { table: 'document_extractions', filters: [eq('household_id', hid)] } : null);
}

export async function updateDocument(id: string, patch: Partial<DocumentRow>) {
  return backend.update<DocumentRow>('documents', patch as Record<string, unknown>, [eq('id', id)]);
}

/** Une seule lecture (« fields ») par document : on remplace la précédente. */
export async function saveFields(documentId: string, fields: Record<string, unknown>, status: DocumentExtraction['status'], source: DocumentExtraction['source'], professionalNote?: string | null) {
  const existing = await backend.select<DocumentExtraction>({ table: 'document_extractions', filters: [eq('document_id', documentId), eq('kind', 'fields')], limit: 1 });
  const row = { fields, status, source, professional_note: status === 'professional' ? professionalNote ?? null : null };
  if (existing[0]) return backend.update<DocumentExtraction>('document_extractions', row, [eq('id', existing[0].id)]);
  return backend.insert<DocumentExtraction>('document_extractions', { document_id: documentId, kind: 'fields', ...row });
}
