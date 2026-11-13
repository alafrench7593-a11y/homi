/**
 * « Tous mes outils » : outils des AUTRES profils (chaque enfant, ma grossesse, moi, la famille),
 * pour que chaque outil de l'application soit visible depuis la page Outils.
 * Toucher un de ces outils sélectionne d'abord le bon profil : les données ne sont jamais mélangées.
 */
import { t as tr } from '@/i18n';
import { useMemo } from 'react';
import type { ActiveSubject } from '../store';
import type { Scope, ScopeCtx } from '../journeys/tools';
import { toolCatalog, type CatalogTool } from '../domain/toolCatalog';
import { useActivePregnancy, useActiveSubject, useJourneyState, useTrackedChildren } from './hooks';

export interface ProfileTools { key: string; title: string; subject: ActiveSubject; tools: CatalogTool[] }

const sameSubject = (a: ActiveSubject, b: ActiveSubject) => a.type === b.type && ('id' in a ? a.id : '') === ('id' in b ? b.id : '');

/**
 * Outils d'un autre profil à proposer : ni urgences (toujours en tête), ni outils déjà montrés.
 * Un outil « pour tout le monde » n'est écarté que si le profil affiché a déjà le MÊME outil (il s'y adapte) ;
 * sinon (Sommeil, Repas ou Humeur d'un enfant pendant qu'une grossesse est affichée) il n'apparaissait nulle part
 * dans les onglets (audit navigation 13/11/2026, N-04).
 */
export function pickOtherTools(catalog: CatalogTool[], shown: CatalogTool[], already: Set<string>): CatalogTool[] {
  const shownKeys = new Set(shown.map((x) => x.key));
  return catalog.filter((x) => !x.urgent && !already.has(x.id) && !(x.universal && shownKeys.has(x.key)));
}

export function useOtherProfileTools(shown: CatalogTool[]): ProfileTools[] {
  const { subject } = useActiveSubject();
  const js = useJourneyState();
  const pregnancy = useActivePregnancy();
  const { data: children } = useTrackedChildren();
  return useMemo(() => {
    const already = new Set(shown.map((x) => x.id));
    const bodyType = js.body?.type;
    const meScope: Scope = bodyType === 'avoid' || bodyType === 'ttc' || bodyType === 'cycle' ? bodyType : 'none';
    const babyId = children?.find((c) => js.childType(c.id) === 'baby')?.id ?? null;
    const base = { pregnancyId: pregnancy?.id ?? null, babyId, postpartum: !!js.postpartum };
    const profiles: { key: string; title: string; subject: ActiveSubject; ctx: ScopeCtx }[] = [];
    for (const c of children ?? []) {
      const type = js.childType(c.id);
      if (type) profiles.push({ key: `child-${c.id}`, title: tr('l3.alltools.for_child', { name: c.first_name }), subject: { type: 'child', id: c.id }, ctx: { ...base, scope: type, childId: c.id } });
    }
    if (pregnancy) profiles.push({ key: 'pregnancy', title: tr('l3.alltools.for_pregnancy'), subject: { type: 'pregnancy', id: pregnancy.id }, ctx: { ...base, scope: 'pregnancy' } });
    profiles.push({ key: 'me', title: tr('l3.alltools.for_me'), subject: { type: 'me' }, ctx: { ...base, scope: meScope } });
    if ((children?.length ?? 0) + (pregnancy ? 1 : 0) > 1) profiles.push({ key: 'family', title: tr('l3.alltools.for_family'), subject: { type: 'family' }, ctx: { ...base, scope: 'family' } });
    return profiles
      .filter((p) => !sameSubject(p.subject, subject))
      .map((p) => {
        const tools = pickOtherTools(toolCatalog(p.ctx), shown, already);
        tools.forEach((x) => already.add(x.id));
        return { key: p.key, title: p.title, subject: p.subject, tools };
      })
      .filter((p) => p.tools.length);
  }, [shown, subject, js, pregnancy, children]);
}
