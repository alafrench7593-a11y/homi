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
import { accountEntries, findEntry, toggleFavorite, type CatalogTool } from '@/lib/domain/toolCatalog';
import { canonicalToolId } from '@/lib/journeys/tools';
import { useUiStore } from '@/lib/store';
import { useReduceMotion } from '@/theme/ThemeProvider';
import { t as tr } from '@/i18n';
import { ToolSheet } from './ToolSheet';

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

  const showSheet = useCallback((e: ToolEntry) => setSheet(e), []);
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

  return { scope, catalog, others, all, allTools, account, favorites, recents, favSet, toggleFav, openNow, showSheet, press, longPress, opensDirectly, sheetNode };
}
