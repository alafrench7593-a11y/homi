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
 *
 * Langage de `GlassToolCard` (18/11/2026) SANS le verre : dans une LISTE riche en texte (nom + description de 4 lignes
 * + pastilles), une carte OPAQUE avec liseré et ombre légère se lit mieux qu'une vitre et coûte moins (pas de flou par
 * rangée dans une liste virtualisée). Le verre est gardé pour les TUILES compactes (favoris, récents, « Pour <profil> »,
 * `ToolTile`). Mêmes gestes : compression 0,97 (`usePress`, fil UI), ombre qui évolue, haptique léger, ouverture après
 * l'enfoncement perçu (`openTool`). Rangée mémoïsée (React.memo).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Tappable } from '@/components/Tappable';
import { FavoriteStar as MotionStar, SkeletonBone, SkeletonPulse, usePress } from '@/motion';
import { ToolGlyph } from '@/components/ToolGlyph';
import { haptic, Icon, Text } from '@/components/ui';
import type { CatalogTool } from '@/lib/domain/toolCatalog';
import { TOOL_PROFILES } from '@/lib/journeys/tools';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, physicalShadow, radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { useTourAnchor } from '@/features/tour/anchors';

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
  /** Sans Premium : outil réservé (cadenas « Réservé à Premium », annoncé ; l'appui ouvre toujours sa fiche puis l'écran). */
  locked?: boolean;
}

export const ToolRow = React.memo(function ToolRow({ tool, otherProfile, favorite, onToggleFavorite, onPress, onLongPress, opensDirectly, first, testID, status, compact, locked }: ToolRowProps) {
  const t = useTheme();
  const p = usePress({ scale: 0.97, haptic: 'light' });
  // Ombre de repos (contact + diffuse) qui se fond dans la seule ombre de contact quand la carte est enfoncée
  const shadows = React.useMemo(() => {
    if (t.name === 'night') return null;
    const low = physicalShadow('low', t.isDark, t.material.shadowInk);
    return { rest: low, down: [low[0]] };
  }, [t]);
  const rest = useAnimatedStyle(() => ({ opacity: 1 - p.progress.value }));
  const down = useAnimatedStyle(() => ({ opacity: p.progress.value }));
  const pill = profilePill(tool, otherProfile);
  const label = [tool.label, tool.sub, status, compact && !otherProfile ? null : pill, tool.free && tool.category !== 'account' ? tr('th.ui.free') : null, locked ? tr('mt.lockedA11y') : null, favorite ? tr('th.ui.favOn') : null]
    .filter((x): x is string => !!x).map((x) => x.replace(/[.!?]$/, '')).join('. ');
  const free = tool.free && tool.category !== 'account';
  const star = !!onToggleFavorite && !tool.urgent && tool.category !== 'account';
  return (
    <View testID={testID ?? `tool-row-${tool.id}`} style={{ marginTop: first ? 0 : spacing.xs }}>
      {/* Carte OPAQUE (liste riche en texte : on ne lit pas quatre lignes à travers une vitre) : liseré, profondeur
          subtile. Au toucher : compression 0,97, l'ombre de repos se fond dans l'ombre de contact, haptique léger. */}
      <Animated.View style={[{ borderRadius: radius.lg }, p.style]}>
        {shadows ? (
          <>
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.lg, boxShadow: shadows.rest }, rest]} />
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius.lg, boxShadow: shadows.down }, down]} />
          </>
        ) : null}
        <Tappable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint={onLongPress ? tr(opensDirectly ? 'th.ui.hintOpen' : 'th.ui.hintSheet') : undefined}
          accessibilityActions={onLongPress ? [{ name: 'activate' }, { name: 'longpress', label: tr(opensDirectly ? 'th.ui.actSheet' : 'th.ui.actOpen') }] : undefined}
          onAccessibilityAction={(e) => { if (e.nativeEvent.actionName === 'longpress') onLongPress?.(); else onPress(); }}
          onPressIn={p.onPressIn}
          onPressOut={p.onPressOut}
          onPress={onPress}
          onLongPress={onLongPress ? () => { haptic('light'); onLongPress(); } : undefined}
          delayLongPress={380}
          pressRetentionOffset={16}
          pressScale={1} hoverLift={0} bare
          testID={`tool-row-press-${tool.id}`}
          style={({ pressed, hovered }) => [StyleSheet.absoluteFill, { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border, backgroundColor: pressed || hovered ? t.colors.surfaceAlt : t.colors.surface }]}
        />
        {/* en-tête : pictogramme, nom (la place de l'étoile est réservée) ; la description occupe ensuite TOUTE la largeur */}
        <View pointerEvents="box-none" style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, gap: 6, minHeight: TOOL_ROW_MIN_HEIGHT, justifyContent: 'center' }}>
          <View pointerEvents="none" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingRight: star ? MIN_TOUCH - 8 : 0 }}>
            <ToolGlyph id={tool.id} theme={tool.theme} icon={tool.icon} urgent={tool.urgent} size={GLYPH} />
            <Text weight="bold" style={{ flex: 1, minWidth: 0 }}>{tool.label}</Text>
          </View>
          {tool.sub ? <View pointerEvents="none"><Text variant="small" muted numberOfLines={TOOL_DESC_LINES} intentionalTruncation testID={`tool-desc-${tool.id}`}>{tool.sub}</Text></View> : null}
          {status ? <View pointerEvents="none"><Text variant="small" weight="medium" color={t.colors.primary}>{status}</Text></View> : null}
          {compact && !otherProfile && !free && !locked ? null : (
            <View pointerEvents="none" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {compact && !otherProfile ? null : <Pill label={pill} />}
              {free ? <Pill label={tr('th.ui.free')} tone="accent" /> : null}
              {locked ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, minHeight: 22, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border, backgroundColor: t.colors.surfaceAlt }} testID={`tool-locked-${tool.id}`}>
                  <Icon name="lock" size={11} color={t.colors.textMuted} />
                  <Text variant="caption" muted>{tr('mt.lockedA11y')}</Text>
                </View>
              ) : null}
            </View>
          )}
          {star ? (
            <View style={{ position: 'absolute', top: spacing.xs - 2, right: 0 }}>
              <FavoriteStar on={favorite} label={tool.label} onPress={() => onToggleFavorite!(tool)} id={tool.id} />
            </View>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
});

/**
 * Étoile de favori des outils : micro-animation (`@/motion` FavoriteStar : saut + onde), haptique de SUCCÈS à
 * l'ajout. L'état est enregistré tout de suite (avant l'animation : rien n'est perdu si l'on quitte l'écran) ;
 * annoncée comme un interrupteur, avec son état.
 */
export function FavoriteStar({ on, label, onPress, id }: { on: boolean; label: string; onPress: () => void; id?: string }) {
  const t = useTheme();
  const name = tr('th.ui.favSwitch', { label });
  // Visite guidée (« Ajouter un favori ») : la découpe se pose sur la première étoile visible
  const anchor = useTourAnchor('tool-star');
  return (
    <View {...anchor}>
    <MotionStar active={on} onToggle={() => onPress()} labelOn={name} labelOff={name} role="switch" hapticOn="success"
      size={18} box={MIN_TOUCH} color={t.colors.textMuted} activeColor={t.colors.primary} well={t.colors.accentSoft}
      testID={id ? `tool-fav-${id}` : undefined} ringTestID={id ? `fav-ring-${id}` : undefined} />
    </View>
  );
}

/**
 * Squelette d'une liste de `ToolRow` : mêmes cartes (rayon, liseré, marges, hauteur minimale, pictogramme 40, nom,
 * deux lignes de description), os qui respirent ensemble — l'arrivée des données ne décale rien.
 */
export function ToolRowsSkeleton({ rows = 4, testID = 'tool-rows-skeleton' }: { rows?: number; testID?: string }) {
  const t = useTheme();
  return (
    <SkeletonPulse label={tr('common.loadingA11y')} testID={testID}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={{ marginTop: i ? spacing.xs : 0, minHeight: TOOL_ROW_MIN_HEIGHT, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border, backgroundColor: t.colors.surface, padding: spacing.sm, gap: 8, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <SkeletonBone width={GLYPH} height={GLYPH} radius={GLYPH / 2} />
            <SkeletonBone width="48%" height={16} />
          </View>
          <SkeletonBone width="100%" height={12} />
          <SkeletonBone width="72%" height={12} />
        </View>
      ))}
    </SkeletonPulse>
  );
}
