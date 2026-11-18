/**
 * État commun du centre d'outils (« Mes outils », une catégorie, la recherche) :
 *  - toutes les entrées atteignables : outils du profil affiché, puis ceux des autres profils du foyer (un outil
 *    d'un autre profil sélectionne ce profil avant de s'ouvrir : les données ne sont jamais mélangées) ;
 *  - favoris (identifiant stable de l'outil), récents, outils déjà connus ;
 *  - le geste : un outil jamais ouvert montre d'abord sa fiche ; un outil connu (déjà ouvert ou en favori) s'ouvre
 *    directement — l'appui long fait l'inverse. Les favoris et les récents ouvrent toujours directement.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { openTool } from '@/components/ToolCard';
import { useToast } from '@/components/Overlays';
import { useAllToolEntries, type ToolEntry } from '@/features/hubs/ToolSearch';
import { useRecentTools } from '@/features/hubs/recentTools';
import { useActiveSubject } from '@/lib/data/hooks';
import { useHouseholdProfiles } from '@/lib/data/hooks-alltools';
import type { ActiveSubject } from '@/lib/store';
import { accountEntries, findEntry, toggleFavorite, toolCatalog, type CatalogTool } from '@/lib/domain/toolCatalog';
import { canonicalToolId } from '@/lib/journeys/tools';
import { useUiStore } from '@/lib/store';
import { useReduceMotion } from '@/theme/ThemeProvider';
import { t as tr } from '@/i18n';
import { ToolSheet } from './ToolSheet';
import { tourEvent } from '@/features/tour/store';

export type { ToolEntry };

export function useToolHub() {
  const { scope, catalog, others, entries } = useAllToolEntries();
  const { setSubject } = useActiveSubject();
  const toast = useToast();
  const reduce = useReduceMotion();
  const favIds = useUiStore((s) => s.toolFavorites);
  const setFavIds = useUiStore((s) => s.setToolFavorites);
  const recentIds = useRecentTools((s) => s.recentTools);
  const knownIds = useRecentTools((s) => s.knownTools);
  const addRecent = useRecentTools((s) => s.addRecent);
  const [sheet, setSheet] = useState<ToolEntry | null>(null);

  const account = useMemo(() => accountEntries(scope), [scope]);
  /** Une entrée par outil : le profil affiché l'emporte, puis le premier autre profil qui le propose. */
  const all = useMemo(() => {
    const seen = new Set<string>();
    return entries.filter((e) => !seen.has(e.tool.id) && (seen.add(e.tool.id), true));
  }, [entries]);
  const allTools = useMemo(() => all.map((e) => e.tool), [all]);
  const profileOf = useMemo(() => new Map(all.map((e) => [e.tool.id, e])), [all]);

  /** Entrée (outil ou sous-accès) pour un identifiant stable, avec le profil auquel elle appartient. */
  const entryFor = useCallback((id: string): ToolEntry | null => {
    const now = canonicalToolId(id) ?? id;
    const tool = findEntry(allTools, now);
    if (!tool) return null;
    const owner = profileOf.get(tool.parent ?? tool.id);
    return { tool, subject: owner?.subject, profile: owner?.profile };
  }, [allTools, profileOf]);

  // Catalogue COMPLET de chaque autre profil du foyer (les menus contextuels visent un profil précis : la fiche d'un
  // enfant, « Ma grossesse »…), y compris les outils « pour tout le monde » que le profil affiché a déjà.
  const household = useHouseholdProfiles();
  const byProfile = useMemo(() => household.filter((p) => !p.active).map((p) => ({ ...p, tools: toolCatalog(p.ctx) })), [household]);
  /**
   * Entrée d'un outil du registre (identifiant actuel ou ancien, outil ou sous-accès) pour un menu contextuel :
   * sur le profil demandé s'il est donné, sinon le profil affiché, sinon le premier profil du foyer qui le propose.
   */
  const resolve = useCallback((id: string, subject?: ActiveSubject | null): ToolEntry | null => {
    const now = canonicalToolId(id) ?? id;
    const same = (a: ActiveSubject, b: ActiveSubject) => a.type === b.type && ('id' in a ? a.id : '') === ('id' in b ? b.id : '');
    const mine = () => { const tool = findEntry([...catalog, ...account], now); return tool ? { tool } : null; };
    if (subject) {
      const p = byProfile.find((x) => same(x.subject, subject));
      if (!p) return mine(); // le profil demandé est le profil affiché
      const tool = findEntry(p.tools, now);
      return tool ? { tool, subject: p.subject, profile: p.title } : null;
    }
    const own = mine();
    if (own) return own;
    for (const p of byProfile) { const tool = findEntry(p.tools, now); if (tool) return { tool, subject: p.subject, profile: p.title }; }
    return null;
  }, [byProfile, catalog, account]);

  const favSet = useMemo(() => new Set(favIds.map((x) => canonicalToolId(x) ?? x)), [favIds]);
  const knownSet = useMemo(() => new Set([...knownIds, ...favSet]), [knownIds, favSet]);
  const favorites = useMemo(() => [...favSet].map(entryFor).filter((e): e is ToolEntry => !!e), [favSet, entryFor]);
  const recents = useMemo(() => recentIds.map(entryFor).filter((e): e is ToolEntry => !!e && !favSet.has(e.tool.id)), [recentIds, entryFor, favSet]);

  const toggleFav = useCallback((tool: CatalogTool) => {
    const on = !favSet.has(tool.id);
    setFavIds(toggleFavorite([...favSet], tool.id));
    toast(tr(on ? 'th.ui.favAdded' : 'th.ui.favRemoved', { label: tool.label }));
  }, [favSet, setFavIds, toast]);

  /** Ouvre l'outil tout de suite (sélectionne son profil si besoin, le note dans les récents). */
  const openNow = useCallback((e: ToolEntry) => {
    if (e.subject) setSubject(e.subject);
    addRecent(e.tool.id);
    openTool(e.tool, undefined, reduce || e.tool.urgent);
  }, [setSubject, addRecent, reduce]);

  // la fiche d'un outil compte comme une ouverture pour la visite guidée (« Trouver un outil »)
  const showSheet = useCallback((e: ToolEntry) => { tourEvent({ type: 'toolOpened', id: e.tool.id }); setSheet(e); }, []);
  // urgences, lectures (sous-accès) et réglages : jamais de fiche intermédiaire
  const opensDirectly = useCallback((tool: CatalogTool) => !!tool.urgent || !!tool.parent || tool.category === 'account' || knownSet.has(tool.id), [knownSet]);
  /** Appui sur une rangée : fiche pour un outil nouveau, ouverture directe pour un outil connu. */
  const press = useCallback((e: ToolEntry) => (opensDirectly(e.tool) ? openNow(e) : showSheet(e)), [opensDirectly, openNow, showSheet]);
  /** Appui long : l'autre geste. */
  const longPress = useCallback((e: ToolEntry) => (opensDirectly(e.tool) ? showSheet(e) : openNow(e)), [opensDirectly, openNow, showSheet]);

  const sheetNode = (
    <ToolSheet
      entry={sheet}
      favorite={!!sheet && favSet.has(sheet.tool.id)}
      onToggleFavorite={toggleFav}
      onClose={() => setSheet(null)}
      onStart={(e) => {
        setSheet(null);
        // la feuille se ferme avant la navigation (elle ne reste pas au-dessus de l'outil)
        setTimeout(() => openNow(e), reduce ? 0 : 180);
      }}
    />
  );

  return { scope, catalog, others, all, allTools, account, resolve, byProfile, recentIds, favorites, recents, favSet, toggleFav, openNow, showSheet, press, longPress, opensDirectly, sheetNode };
}
