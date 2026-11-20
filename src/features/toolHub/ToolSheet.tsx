/**
 * Fiche courte d'un outil (premier appui sur un outil jamais ouvert), dans une FEUILLE DE VERRE (`GlassSheet`, verre
 * `sheet` : voile presque opaque, toutes les encres du thème y sont garanties ≥ 4,5:1) :
 *  1. pictogramme, nom (titre de la feuille), ce que ça fait (une phrase), étoile de favori ;
 *  2. « Problème résolu » : la situation du parent, rédigée en une phrase pour chaque outil (`th.<id>.problem`) ;
 *  3. « En pratique » : l'aperçu « geste → résultat » repris de « Découvrir HOMI » quand il existe ;
 *  4. « Commencer » : placé AVANT les détails secondaires (pour qui, Premium, sous-accès) pour rester visible sans
 *     défiler à 320 × 568 ; sur un écran bas, « En pratique » passe juste après lui.
 * Rien n'est lu ni écrit dans les données du foyer : textes du registre et valeurs d'exemple constantes.
 */
import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import { GlassButton, GlassSheet } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { ToolGlyph } from '@/components/ToolGlyph';
import { haptic, Icon, Text } from '@/components/ui';
import type { ToolEntry } from '@/features/hubs/ToolSearch';
import { DISCOVER_BY_KEY } from '@/features/discover/model';
import { describeDemo } from '@/features/discover/texts';
import { subAsTool, type CatalogTool } from '@/lib/domain/toolCatalog';
import { TOOL_PROFILES, toolProblemKey } from '@/lib/journeys/tools';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { t as tr, tMaybe, type TKey } from '@/i18n';
import { FavoriteStar, Pill } from './ToolRow';

/** Aperçu « geste → résultat » de l'outil (ou de son outil parent), s'il a une démo dans « Découvrir HOMI ». */
export function toolPreview(tool: CatalogTool): { gesture: string; result: string } | null {
  if (tool.parent) return null;
  const d = DISCOVER_BY_KEY[tool.id];
  return d ? describeDemo(d) : null;
}

/**
 * « Problème résolu » : une phrase rédigée par outil (`th.<id>.problem`, 5 langues) qui décrit la situation du parent
 * (« Vous vous levez toutes les nuits et l'autre parent ne sait pas quand prendre le relais. »). Un sous-accès reprend
 * celle de son outil. Rien n'est assemblé à partir des mots-clés de la recherche.
 */
export function toolProblem(tool: Pick<CatalogTool, 'id' | 'parent'>): string | null {
  return tMaybe(toolProblemKey(tool.parent ?? tool.id)) || null;
}

export function ToolSheet({ entry, favorite, onToggleFavorite, onClose, onStart }: {
  entry: ToolEntry | null; favorite: boolean; onToggleFavorite: (tool: CatalogTool) => void; onClose: () => void; onStart: (e: ToolEntry) => void;
}) {
  const t = useTheme();
  // Écran bas (320 × 568) : « En pratique » passe après « Commencer », qui reste visible sans défiler
  const short = useWindowDimensions().height < SHORT_SCREEN;
  // la dernière fiche reste affichée pendant la fermeture de la feuille
  const last = React.useRef<ToolEntry | null>(entry);
  if (entry) last.current = entry;
  const e = entry ?? last.current;
  if (!e) return null;
  const { tool } = e;
  const preview = toolPreview(tool);
  const problem = toolProblem(tool);
  const isTool = tool.category !== 'account' && !tool.urgent;
  const everyone = tool.profiles.length >= TOOL_PROFILES.length - 1;
  return (
    <GlassSheet visible={!!entry} onClose={onClose} title={tool.label}>
      <View testID={`tool-sheet-${tool.id}`} style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
          <ToolGlyph id={tool.id} theme={tool.theme} icon={tool.icon} urgent={tool.urgent} size={48} />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text variant="caption" muted accessibilityRole="header">{tr('th.sheet.what')}</Text>
            {tool.sub ? <Text>{tool.sub}</Text> : null}
          </View>
          {isTool ? <FavoriteStar on={favorite} label={tool.label} onPress={() => onToggleFavorite(tool)} id={`sheet-${tool.id}`} /> : null}
        </View>

        {problem ? (
          <View style={{ gap: 2 }} testID="tool-sheet-problem">
            <Text variant="caption" muted accessibilityRole="header">{tr('glass.sheet.problem')}</Text>
            <Text variant="small" weight="medium">{problem}</Text>
          </View>
        ) : null}

        {preview && !short ? <Preview preview={preview} /> : null}

        {/* Action principale : avant les détails, visible sans défiler sur un petit écran */}
        {tool.locked ? <Text variant="small" muted testID="tool-sheet-locked">{tr('pz.cat.lockedNote')}</Text> : null}
        <GlassButton label={tool.locked ? tr('pz.cat.lockedAction') : tr('th.sheet.start')} variant="primary" iconRight="arrow-right" full onPress={() => onStart(e)} testID="tool-sheet-start" />
        {preview && short ? <Preview preview={preview} /> : null}

        <View style={{ gap: 6 }}>
          <Text variant="caption" muted accessibilityRole="header">{tr('th.sheet.who')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {everyone ? <Pill label={tr('th.p.all')} /> : tool.profiles.map((p) => <Pill key={p} label={tr(`th.p.${p}` as TKey)} />)}
            <Pill label={tool.free ? tr('th.sheet.free') : tr('th.sheet.premium')} tone={tool.free ? 'accent' : 'plain'} />
          </View>
          {e.profile ? <Text variant="small" muted>{tr('th.sheet.whoOther', { name: e.profile })}</Text> : null}
        </View>

        {tool.subs.length && !tool.locked ? (
          <View style={{ gap: 2 }}>
            <Text variant="caption" muted accessibilityRole="header">{tr('th.sheet.direct')}</Text>
            {tool.subs.map((s) => (
              <Tappable key={s.id} accessibilityRole="button" accessibilityLabel={[s.label, s.hint].filter(Boolean).join('. ')} testID={`tool-sheet-sub-${s.id}`}
                onPress={() => { haptic('selection'); onStart({ ...e, tool: subAsTool(tool, s) }); }} bare pressScale={1} hoverLift={0}
                style={({ pressed, hovered }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH, paddingVertical: 6, paddingHorizontal: 4, borderRadius: radius.md, backgroundColor: pressed || hovered ? t.colors.surfaceAlt : 'transparent' })}>
                <Icon name={s.icon} size={18} color={t.colors.primary} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text weight="medium">{s.label}</Text>
                  {s.hint ? <Text variant="caption" muted>{s.hint}</Text> : null}
                </View>
                <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
              </Tappable>
            ))}
          </View>
        ) : null}
      </View>
    </GlassSheet>
  );
}

/** Hauteur d'écran sous laquelle « En pratique » passe après « Commencer » (320 × 568 : oui ; 390 × 844 : non). */
export const SHORT_SCREEN = 700;

/** « En pratique » : le geste et son résultat, repris de « Découvrir HOMI ». */
function Preview({ preview }: { preview: { gesture: string; result: string } }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }} accessible accessibilityLabel={`${tr('th.sheet.how')}. ${preview.gesture} ${preview.result}`} testID="tool-sheet-preview">
      <Text variant="caption" muted accessibilityRole="header">{tr('th.sheet.how')}</Text>
      <View style={{ borderRadius: radius.md, backgroundColor: t.colors.surfaceAlt, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, gap: 6 }}>
        <Step icon="edit-3" label={tr('th.sheet.gesture')} text={preview.gesture} />
        <Step icon="check-circle" label={tr('th.sheet.result')} text={preview.result} />
      </View>
    </View>
  );
}

function Step({ icon, label, text }: { icon: 'edit-3' | 'check-circle'; label: string; text: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }}>
      <View style={{ paddingTop: 2 }}><Icon name={icon} size={15} color={t.colors.primary} /></View>
      <Text variant="small" style={{ flex: 1, minWidth: 0 }}><Text variant="small" weight="bold">{label} · </Text>{text}</Text>
    </View>
  );
}
