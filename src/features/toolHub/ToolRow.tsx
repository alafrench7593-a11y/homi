/**
 * Rangée d'outil — la SEULE présentation d'un outil du registre, partout (centre d'outils, catégories, onglets,
 * menus contextuels via `ToolLinks`) : pictogramme propre à l'outil et nom sur la première ligne, description sur
 * toute la largeur, ENTIÈRE jusqu'à `TOOL_DESC_LINES` lignes (les descriptions du registre sont écrites pour tenir :
 * test de longueur par langue ; l'ellipse n'apparaît qu'au-delà, avec de très grandes tailles de texte, et la fiche
 * affiche toujours la phrase complète), état réel éventuel, pastille de profil, étoile de favori.
 *  - Appui : `onPress` (fiche de l'outil, ou ouverture directe pour un outil déjà connu) ;
 *  - Appui long : `onLongPress` (l'autre geste) ; les deux sont aussi des actions d'accessibilité nommées.
 * La rangée est le bouton (posé DERRIÈRE le contenu) ; l'étoile est un bouton frère de 44 pt, annoncé comme un
 * interrupteur avec son état. La hauteur suit le texte (grandes tailles de police) : rien n'est coupé hors description.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tappable } from '@/components/Tappable';
import { ToolGlyph } from '@/components/ToolGlyph';
import { haptic, Icon, Text } from '@/components/ui';
import type { CatalogTool } from '@/lib/domain/toolCatalog';
import { TOOL_PROFILES } from '@/lib/journeys/tools';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

export const TOOL_ROW_MIN_HEIGHT = 72;
/** Lignes de description affichées avant l'ellipse (2 auparavant : la phrase était coupée au milieu). */
export const TOOL_DESC_LINES = 4;
const GLYPH = 40;

/** Libellé de la pastille : profil d'un autre membre du foyer, nature de l'entrée, ou profils concernés. */
export function profilePill(tool: CatalogTool, otherProfile?: string): string {
  if (otherProfile) return otherProfile;
  if (tool.category === 'account') return tr('th.ui.setting');
  if (tool.category === 'community') return tr('th.ui.space');
  if (tool.parent && tool.parent === 'guides') return tr('th.ui.reading');
  if (tool.profiles.length >= TOOL_PROFILES.length - 1) return tr('th.p.all');
  return tool.profiles.map((p) => tr(`th.p.${p}` as TKey)).join(' · ');
}

export function Pill({ label, tone = 'plain' }: { label: string; tone?: 'plain' | 'accent' }) {
  const t = useTheme();
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: tone === 'accent' ? t.colors.accentSoft : t.colors.surfaceAlt }}>
      <Text variant="caption" weight="medium" color={tone === 'accent' ? t.colors.primary : t.colors.textMuted}>{label}</Text>
    </View>
  );
}

export interface ToolRowProps {
  tool: CatalogTool;
  /** Nom du profil quand l'outil appartient à un autre profil du foyer (« Pour Léa »). */
  otherProfile?: string;
  favorite: boolean;
  onToggleFavorite?: (tool: CatalogTool) => void;
  onPress: () => void;
  onLongPress?: () => void;
  /** Vrai : l'appui ouvre l'outil ; faux : l'appui ouvre la fiche (indication lue par les lecteurs d'écran). */
  opensDirectly?: boolean;
  first?: boolean;
  testID?: string;
  /** État réel fourni par l'écran (« Dernier biberon il y a 2 h ») : affiché EN PLUS du nom et de la description. */
  status?: string;
  /** Sans pastille de profil ni « Gratuit » (menu contextuel d'un écran qui dit déjà pour qui c'est). */
  compact?: boolean;
}

export const ToolRow = React.memo(function ToolRow({ tool, otherProfile, favorite, onToggleFavorite, onPress, onLongPress, opensDirectly, first, testID, status, compact }: ToolRowProps) {
  const t = useTheme();
  const pill = profilePill(tool, otherProfile);
  const label = [tool.label, tool.sub, status, compact && !otherProfile ? null : pill, tool.free && tool.category !== 'account' ? tr('th.ui.free') : null, favorite ? tr('th.ui.favOn') : null]
    .filter((x): x is string => !!x).map((x) => x.replace(/[.!?]$/, '')).join('. ');
  const free = tool.free && tool.category !== 'account';
  const star = !!onToggleFavorite && !tool.urgent && tool.category !== 'account';
  return (
    <View testID={testID ?? `tool-row-${tool.id}`} style={{ minHeight: TOOL_ROW_MIN_HEIGHT }}>
      {first ? null : <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, left: 0, height: StyleSheet.hairlineWidth, backgroundColor: t.colors.border }} />}
      <Tappable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={onLongPress ? tr(opensDirectly ? 'th.ui.hintOpen' : 'th.ui.hintSheet') : undefined}
        accessibilityActions={onLongPress ? [{ name: 'activate' }, { name: 'longpress', label: tr(opensDirectly ? 'th.ui.actSheet' : 'th.ui.actOpen') }] : undefined}
        onAccessibilityAction={(e) => { if (e.nativeEvent.actionName === 'longpress') onLongPress?.(); else onPress(); }}
        onPress={() => { haptic('selection'); onPress(); }}
        onLongPress={onLongPress ? () => { haptic('light'); onLongPress(); } : undefined}
        delayLongPress={380}
        pressScale={1} hoverLift={0} bare
        testID={`tool-row-press-${tool.id}`}
        style={({ pressed, hovered }) => [StyleSheet.absoluteFill, { borderRadius: radius.md, backgroundColor: pressed || hovered ? t.colors.surfaceAlt : 'transparent' }]}
      />
      {/* en-tête : pictogramme, nom (la place de l'étoile est réservée) ; la description occupe ensuite TOUTE la largeur */}
      <View pointerEvents="box-none" style={{ paddingVertical: spacing.sm, gap: 6, minHeight: TOOL_ROW_MIN_HEIGHT, justifyContent: 'center' }}>
        <View pointerEvents="none" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingRight: star ? MIN_TOUCH - 4 : 0 }}>
          <ToolGlyph id={tool.id} theme={tool.theme} icon={tool.icon} urgent={tool.urgent} size={GLYPH} />
          <Text weight="bold" style={{ flex: 1, minWidth: 0 }}>{tool.label}</Text>
        </View>
        {tool.sub ? <View pointerEvents="none"><Text variant="small" muted numberOfLines={TOOL_DESC_LINES} intentionalTruncation testID={`tool-desc-${tool.id}`}>{tool.sub}</Text></View> : null}
        {status ? <View pointerEvents="none"><Text variant="small" weight="medium" color={t.colors.primary}>{status}</Text></View> : null}
        {compact && !otherProfile && !free ? null : (
          <View pointerEvents="none" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {compact && !otherProfile ? null : <Pill label={pill} />}
            {free ? <Pill label={tr('th.ui.free')} tone="accent" /> : null}
          </View>
        )}
        {star ? (
          <View style={{ position: 'absolute', top: spacing.sm - 2, right: -8 }}>
            <FavoriteStar on={favorite} label={tool.label} onPress={() => onToggleFavorite!(tool)} id={tool.id} />
          </View>
        ) : null}
      </View>
    </View>
  );
});

export function FavoriteStar({ on, label, onPress, id }: { on: boolean; label: string; onPress: () => void; id?: string }) {
  const t = useTheme();
  return (
    <Tappable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      aria-checked={on}
      accessibilityLabel={tr('th.ui.favSwitch', { label })}
      onPress={() => { haptic(on ? 'light' : 'success'); onPress(); }}
      testID={id ? `tool-fav-${id}` : undefined}
      bare pressScale={0.9} hoverLift={0}
      style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}
    >
      <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.colors.accentSoft : 'transparent' }}>
        <Icon name="star" size={18} color={on ? t.colors.primary : t.colors.textMuted} />
      </View>
    </Tappable>
  );
}
