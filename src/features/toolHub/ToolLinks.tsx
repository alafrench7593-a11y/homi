/**
 * `ToolLinks` — LE composant par lequel un écran propose des outils (menus « Mon cycle », « Ma grossesse »,
 * « Moi aussi », suivi du jour, onglets Moi / Enfant / Famille, profil…).
 *
 * Un menu ne décrit plus ses outils : il donne seulement le CHOIX et l'ORDRE de ses raccourcis (`ids` : des
 * identifiants du registre central, src/lib/journeys/tools.ts) ou une catégorie entière (`category`). Tout le reste
 * vient du registre et du catalogue : identifiant, nom, description, pictogramme, destination adaptée au profil,
 * règle d'accès (profil, Premium / gratuit), état de favori — exactement comme dans « Mes outils ».
 *  - un identifiant inconnu, ou un outil qui n'existe pas pour les profils du foyer, n'est simplement pas affiché ;
 *  - `subject` : le profil visé par le menu (la fiche d'un enfant, « Ma grossesse ») ; ouvrir l'outil sélectionne ce
 *    profil d'abord, les données ne sont jamais mélangées ;
 *  - `status` : un état RÉEL connu de l'écran (« 3 documents »), affiché en plus — jamais un autre nom ;
 *  - `allOf` : accès NOMMÉ à la catégorie complète (« Tous les outils de sommeil »), jamais « Voir les N autres ».
 * Appui : ouvre l'outil ; appui long : sa fiche (ce que ça fait, pour qui, Premium), comme dans le centre d'outils.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, Text } from '@/components/ui';
import { categoryAllLabel, categoryContent, type CatalogTool } from '@/lib/domain/toolCatalog';
import type { ToolShelf } from '@/lib/journeys/tools';
import type { ActiveSubject } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { ToolRow } from './ToolRow';
import { useToolHub, type ToolEntry } from './useToolHub';

export interface ToolLinksProps {
  /** Identifiants d'outils du registre (actuels ou anciens, sous-accès `outil.sous-accès` compris), dans l'ordre voulu. */
  ids?: readonly string[];
  /** Ou : tous les outils d'une catégorie (catégorie principale puis raccourcis contextuels), pour le profil visé. */
  category?: ToolShelf;
  /** Profil visé ; par défaut le profil affiché, sinon le premier profil du foyer qui propose l'outil. */
  subject?: ActiveSubject | null;
  /** Garde seulement certains outils (réglage de l'écran : suivi du poids masqué, suivi des rapports désactivé…). */
  filter?: (tool: CatalogTool) => boolean;
  /** État réel par identifiant d'outil. */
  status?: Partial<Record<string, string | null | undefined>>;
  /** Titre de section (titre du menu, pas un nom d'outil). */
  title?: string;
  /** Catégorie(s) complète(s) proposée(s) sous la liste. */
  allOf?: ToolShelf | readonly ToolShelf[];
  /** Nombre maximal d'outils affichés (sélection) : le reste est dans la catégorie complète, à un appui. */
  max?: number;
  /** Pastilles de profil affichées (hors du profil visé elles le sont toujours). */
  pills?: boolean;
  /** Le titre de la section nomme déjà le profil (« Pour Léa ») : la pastille de profil n'est pas répétée sur chaque rangée. */
  profileInTitle?: boolean;
  testID?: string;
}

/** Résout les raccourcis d'un menu dans le catalogue (outils disponibles seulement, sans doublon). */
export function useToolLinks({ ids, category, subject, filter, max }: Pick<ToolLinksProps, 'ids' | 'category' | 'subject' | 'filter' | 'max'>) {
  const hub = useToolHub();
  const entries = useMemo<ToolEntry[]>(() => {
    const seen = new Set<string>();
    const out: ToolEntry[] = [];
    const push = (e: ToolEntry | null) => { if (e && !seen.has(e.tool.id) && (!filter || filter(e.tool))) { seen.add(e.tool.id); out.push(e); } };
    for (const id of ids ?? []) push(hub.resolve(id, subject));
    if (category) {
      const pool = subject ? hub.byProfile.find((p) => p.subject.type === subject.type && ('id' in p.subject ? p.subject.id : '') === ('id' in subject ? subject.id : ''))?.tools ?? hub.catalog : hub.catalog;
      const { tools, shortcuts } = categoryContent(pool, category);
      for (const tool of [...tools, ...shortcuts]) if (!tool.urgent) push(hub.resolve(tool.id, subject));
    }
    return max ? out.slice(0, max) : out;
  }, [hub, ids, category, subject, filter, max]);
  return { hub, entries };
}

export function ToolLinks(props: ToolLinksProps) {
  const { title, allOf, status, pills, profileInTitle, testID } = props;
  const { hub, entries } = useToolLinks(props);
  const shelves = allOf ? (typeof allOf === 'string' ? [allOf] : allOf) : [];
  if (!entries.length && !shelves.length) return null;
  return (
    <View testID={testID} style={{ gap: spacing.xs }}>
      {title ? <Text variant="heading" accessibilityRole="header">{title}</Text> : null}
      <View>
        {entries.map((e, i) => (
          <ToolRow key={e.tool.id} tool={e.tool} otherProfile={profileInTitle ? undefined : e.profile} first={i === 0} compact={!pills}
            testID={testID ? `${testID}-${e.tool.id}` : undefined}
            status={status?.[e.tool.id] ?? undefined}
            favorite={hub.favSet.has(e.tool.id)} onToggleFavorite={hub.toggleFav}
            opensDirectly onPress={() => hub.openNow(e)} onLongPress={() => hub.showSheet(e)} />
        ))}
        {shelves.map((c, i) => <CategoryLink key={c} category={c} first={i === 0 && !entries.length} testID={testID ? `${testID}-all-${c}` : `tool-links-all-${c}`} />)}
      </View>
      {hub.sheetNode}
    </View>
  );
}

/** Accès nommé à une catégorie complète du centre d'outils (« Tous les outils de sommeil »). */
export function CategoryLink({ category, first, testID }: { category: ToolShelf; first?: boolean; testID?: string }) {
  const t = useTheme();
  const label = categoryAllLabel(category);
  return (
    <Tappable accessibilityRole="link" accessibilityLabel={label} testID={testID ?? `tool-links-all-${category}`}
      onPress={() => { haptic('selection'); router.push(`/tools/${category}` as never); }} bare pressScale={1} hoverLift={0}
      style={({ pressed, hovered }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH + 4, paddingVertical: spacing.xs, marginTop: first ? 0 : spacing.xxs, borderRadius: radius.md, backgroundColor: pressed || hovered ? t.colors.surfaceAlt : 'transparent' })}>
      <View style={{ width: 40, alignItems: 'center' }}><Icon name="grid" size={18} color={t.colors.primary} /></View>
      <Text weight="medium" color={t.colors.primary} style={{ flex: 1, minWidth: 0 }}>{label}</Text>
      <Icon name="chevron-right" size={18} color={t.colors.primary} />
    </Tappable>
  );
}
