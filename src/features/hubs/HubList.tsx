/**
 * Listes des onglets hub (HOMI v5 « Lumière corail ») : les outils sont rangés en GROUPES À SÉPARATEURS, une rangée
 * par outil (icône cohérente, titre, sous-titre court, chevron), au lieu de grilles de cartes.
 *
 * Pourquoi pas `ListGroup` / `ListRow` de ui.tsx : chaque rangée d'outil porte AUSSI un interrupteur « favori »
 * (cible ≥ 44 pt) qui ne doit pas être imbriqué dans le bouton de la rangée (bouton dans un bouton, interdit sur le
 * web et ambigu pour les lecteurs d'écran). Ici, la rangée entière est un bouton posé DERRIÈRE le contenu, l'étoile
 * est un bouton frère, au-dessus. Même rendu que `ListGroup` : surface, rayon 20, liseré fin, filets alignés sur le
 * texte, pastille ronde corail pâle et icône corail ; urgences en rouge d'alerte (icône + libellé, jamais la
 * couleur seule).
 *
 * Mouvement : appui = teinte du creux (immédiat), sans élévation ni rebond ; l'étoile « éclot » quand on l'allume
 * (usePop, coupé avec Réduire les animations). Rien ne bouge pendant la lecture.
 */
import React from 'react';
import { Animated, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import { usePop } from '@/components/Motion';
import { openTool } from '@/components/ToolCard';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, Text, type IconName } from '@/components/ui';
import type { CatalogTool, ToolStatus } from '@/lib/domain/toolCatalog';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { linesOf, radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

const ICON = 36;
const ROW_MIN = 60;
/** Cible de l'étoile : 44 × 44 pt (recommandation iOS), dans la hauteur de la rangée. */
const STAR = 44;
const Ctx = React.createContext<{ first: boolean }>({ first: true });

/** Groupe de rangées : titre de section (en-tête accessible), surface unique, filets fins entre les rangées. */
export function HubGroup({ title, children, testID, footer }: { title?: string; children: React.ReactNode; testID?: string; footer?: React.ReactNode }) {
  const t = useTheme();
  const rows = React.Children.toArray(children).filter(Boolean);
  if (!rows.length) return null;
  return (
    <View style={{ gap: spacing.xs }} testID={testID}>
      {title ? <Text variant="heading" accessibilityRole="header" style={{ paddingHorizontal: spacing.xxs }}>{title}</Text> : null}
      <View style={{ backgroundColor: t.colors.surface, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border, overflow: 'hidden' }}>
        {rows.map((row, i) => <Ctx.Provider key={(row as { key?: React.Key }).key ?? i} value={{ first: i === 0 }}>{row}</Ctx.Provider>)}
      </View>
      {footer}
    </View>
  );
}

function Separator() {
  const t = useTheme();
  const { first } = React.useContext(Ctx);
  if (first) return null;
  return <View pointerEvents="none" style={{ position: 'absolute', top: 0, right: 0, left: spacing.md + ICON + spacing.sm, height: StyleSheet.hairlineWidth, backgroundColor: linesOf(t).separator }} />;
}

/** Icône sur la pastille d'alerte : blanc en clair, fond prune en sombre (rouge d'alerte lumineux), ≥ 3:1 (testé). */
export const alertIconOn = (t: ReturnType<typeof useTheme>) => (t.isDark ? t.colors.background : '#FFFFFF');

function IconWell({ name, danger }: { name: IconName; danger?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ width: ICON, height: ICON, borderRadius: ICON / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: danger ? t.colors.danger : linesOf(t).iconWell }}>
      <Icon name={name} size={18} color={danger ? alertIconOn(t) : t.colors.primary} />
    </View>
  );
}

/** Rangée simple (accès direct, communauté, « voir plus ») : toute la rangée est le bouton. */
export function HubRow({ icon, title, subtitle, onPress, testID, trailing = 'chevron-right', accessibilityLabel }: {
  icon: IconName; title: string; subtitle?: string; onPress: () => void; testID?: string; trailing?: IconName; accessibilityLabel?: string;
}) {
  const t = useTheme();
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? [title, subtitle].filter(Boolean).join('. ')} testID={testID}
      onPress={() => { haptic('selection'); onPress(); }} pressScale={1} hoverLift={0} bare
      style={({ pressed, hovered }) => ({ backgroundColor: pressed || hovered ? t.colors.surfaceAlt : 'transparent' })}>
      <Separator />
      <View style={rowStyle}>
        <IconWell name={icon} />
        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <Text weight="medium">{title}</Text>
          {subtitle ? <Text variant="small" muted>{subtitle}</Text> : null}
        </View>
        <Icon name={trailing} size={18} color={t.colors.textMuted} />
      </View>
    </Tappable>
  );
}

/**
 * Rangée d'outil : icône de l'outil, libellé, état réel (« Dernier biberon il y a 2 h ») ou description, étoile
 * favori, chevron. Outil d'un autre profil : `beforeOpen` sélectionne ce profil juste avant l'ouverture.
 */
export function HubToolRow({ tool, status, favorite, onToggleFavorite, beforeOpen }: {
  tool: CatalogTool; status?: ToolStatus; favorite: boolean; onToggleFavorite?: (t: CatalogTool) => void; beforeOpen?: () => void;
}) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const line = status?.text ?? tool.sub;
  const accent = status?.tone === 'accent';
  const open = (e: GestureResponderEvent) => {
    haptic('selection');
    beforeOpen?.();
    openTool(tool, e.nativeEvent?.pageY, reduce || tool.urgent);
  };
  return (
    <View testID={`hub-tool-${tool.key}`}>
      <Separator />
      {/* bouton de la rangée : DERRIÈRE le contenu (l'étoile, bouton frère, reste atteignable au-dessus) */}
      <Tappable accessibilityRole="button" accessibilityLabel={[tool.label, line].filter(Boolean).join('. ')} onPress={open} pressScale={1} hoverLift={0} bare
        style={({ pressed, hovered }) => [StyleSheet.absoluteFill, { backgroundColor: pressed || hovered ? t.colors.surfaceAlt : 'transparent' }]} />
      <View style={rowStyle} pointerEvents="box-none">
        <View pointerEvents="none"><IconWell name={tool.icon} /></View>
        <View pointerEvents="none" style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <Text weight="medium">{tool.label}</Text>
          {line ? <Text variant="small" muted={!accent} color={accent ? t.colors.primary : undefined}>{line}</Text> : null}
        </View>
        {onToggleFavorite && !tool.urgent ? <FavoriteStar on={favorite} label={tool.label} onPress={() => onToggleFavorite(tool)} /> : null}
        <View pointerEvents="none"><Icon name="chevron-right" size={18} color={t.colors.textMuted} /></View>
      </View>
    </View>
  );
}

function FavoriteStar({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) {
  const t = useTheme();
  const pop = usePop(on, 1.3);
  return (
    <Tappable accessibilityRole="switch" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={tr('u3.tools.favSwitch', { label })}
      onPress={() => { haptic(on ? 'light' : 'success'); onPress(); }} pressScale={0.9} hoverLift={0} bare
      // la cible (44 × 44) chevauche le chevron, qui n'est pas interactif : le libellé garde sa largeur à 320 px
      style={{ width: STAR, height: STAR, alignItems: 'center', justifyContent: 'center', marginVertical: -spacing.xs, marginLeft: -spacing.xs, marginRight: -spacing.sm }}>
      <Animated.View style={pop}>
        <Icon name="star" size={17} color={on ? t.colors.primary : t.colors.textMuted} />
      </Animated.View>
    </Tappable>
  );
}

/**
 * Urgences : EN TÊTE du hub, rouge d'alerte (distinct du corail), icône + libellé + sous-titre, sans animation ni
 * délai d'ouverture. Rangée pleine largeur de 64 pt.
 */
export function UrgentRow({ tool }: { tool: CatalogTool }) {
  const t = useTheme();
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={tool.sub ? `${tool.label}. ${tool.sub}` : tool.label} testID={`hub-urgent-${tool.key}`}
      onPress={() => { haptic('warning'); openTool(tool, undefined, true); }} pressScale={0.99} hoverLift={0}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 64, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
        borderRadius: radius.lg, backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.dangerSoft, borderWidth: 1, borderColor: t.colors.danger })}>
      <IconWell name="life-buoy" danger />
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <Text weight="bold" color={t.colors.danger}>{tool.label}</Text>
        {tool.sub ? <Text variant="small" color={t.colors.text}>{tool.sub}</Text> : null}
      </View>
      <Icon name="chevron-right" size={18} color={t.colors.danger} />
    </Tappable>
  );
}

const rowStyle = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.sm, minHeight: ROW_MIN, paddingLeft: spacing.md, paddingRight: spacing.sm, paddingVertical: spacing.xs };
