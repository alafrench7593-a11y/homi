/** Rubrique « Sources et lectures » : ressources externes vérifiées (titre, éditeur, résumé de l'équipe, lien d'origine). */
import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { backend, eq } from '../backend';
import { useInvalidate, useRows } from './hooks';
import type { ExternalResource, ResourceKind } from '@/content/resources';
import { t as tr } from '@/i18n';

export interface ResourceRow extends ExternalResource { id: string; status: 'draft' | 'published' | 'retired'; created_at: string }

const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** Contrôles avant enregistrement (mêmes règles que la table et que le script de génération). */
export function resourceErrors(r: Partial<ExternalResource>, today = new Date().toISOString().slice(0, 10)): string[] {
  const e: string[] = [];
  if (!r.slug || !/^[a-z0-9][a-z0-9-]{1,60}$/.test(r.slug)) e.push('slug');
  if (!r.title || r.title.trim().length < 3 || r.title.length > 200) e.push('title');
  if (!r.publisher?.trim()) e.push('publisher');
  if (!r.description?.trim() || r.description.length > 400) e.push('description');
  if (!r.url || !/^https:\/\/[^\s/]+\.[^\s]+$/.test(r.url)) e.push('url');
  if (!r.consulted_on || !DATE.test(r.consulted_on) || r.consulted_on > today) e.push('consulted_on');
  if (r.published_on && (!DATE.test(r.published_on) || r.published_on > today)) e.push('published_on');
  if (r.min_age_months != null && r.max_age_months != null && r.min_age_months > r.max_age_months) e.push('ages');
  return e;
}

/** Une ressource correspond-elle à un âge (en mois) ? Sans tranche indiquée : tous âges. */
export const resourceFitsAge = (r: Pick<ExternalResource, 'min_age_months' | 'max_age_months'>, from: number, to: number) =>
  (r.min_age_months ?? 0) <= to && (r.max_age_months ?? 999) >= from;

export function useExternalResources(opts: { includeDrafts?: boolean; kind?: ResourceKind | null } = {}) {
  const q = useRows<ResourceRow>(['external_resources'], { table: 'external_resources', order: [{ col: 'title' }] }, { staleTime: 600_000 });
  const data = useMemo(() => (q.data ?? []).filter((r) => (opts.includeDrafts || r.status === 'published') && (!opts.kind || r.kind === opts.kind)), [q.data, opts.includeDrafts, opts.kind]);
  return { ...q, data };
}

export function useSaveResource() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { id?: string; row: Partial<ResourceRow> }) => {
      if (v.id) await backend.update('external_resources', v.row, [eq('id', v.id)]);
      else await backend.insert('external_resources', { status: 'draft', ...v.row });
    },
    onSuccess: () => inv('external_resources'),
  });
}

const months = (m: number) => (m < 24 ? tr('src.months', { n: m }) : tr('src.years', { n: Math.floor(m / 12) }));
export function resourceAgeLabel(r: Pick<ExternalResource, 'min_age_months' | 'max_age_months'>): string {
  if (r.min_age_months == null && r.max_age_months == null) return tr('src.allAges');
  if (r.max_age_months == null) return tr('src.from', { from: months(r.min_age_months ?? 0) });
  return tr('src.range', { from: months(r.min_age_months ?? 0), to: months(r.max_age_months) });
}

