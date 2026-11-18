/**
 * Fiche courte d'un outil (premier appui sur un outil jamais ouvert), dans une FEUILLE DE VERRE (`GlassSheet`, verre
 * `sheet` : voile presque opaque, toutes les encres du thème y sont garanties ≥ 4,5:1) :
 *  1. pictogramme, nom (titre de la feuille), ce que ça fait (une phrase), étoile de favori ;
 *  2. « Problème résolu » : les besoins que l'outil couvre, tirés de son index de recherche par besoin (`th.<id>.k`,
 *     tournures de trois mots ou plus, les mêmes que la recherche reconnaît) — aucun texte inventé ;
 *  3. « En pratique » : l'aperçu « geste → résultat » repris de « Découvrir HOMI » quand il existe ;
 *  4. « Commencer » : placé AVANT les détails secondaires (pour qui, Premium, sous-accès) pour rester visible sans
 *     défiler à 320 × 568.
 * Rien n'est lu ni écrit dans les données du foyer : textes du registre et valeurs d'exemple constantes.
 */
import React from 'react';
import { View } from 'react-native';
import { GlassButton, GlassSheet } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { ToolGlyph } from '@/components/ToolGlyph';
import { haptic, Icon, Text } from '@/components/ui';
import type { ToolEntry } from '@/features/hubs/ToolSearch';
import { DISCOVER_BY_KEY } from '@/features/discover/model';
import { describeDemo } from '@/features/discover/texts';
import { subAsTool, type CatalogTool } from '@/lib/domain/toolCatalog';
import { TOOL_PROFILES, toolWordsKey } from '@/lib/journeys/tools';
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
 * « Problème résolu » : les tournures de besoin (3 mots ou plus) de l'index de recherche de l'outil, dans la langue
 * active — les phrases mêmes que la recherche par besoin reconnaît (« combien a bu bébé », « se réveille la nuit »).
 */
export function toolNeeds(tool: CatalogTool, max = 2): string[] {
  const raw = tMaybe(toolWordsKey(tool.parent ?? tool.id)) ?? '';
  const out: string[] = [];
  for (const part of raw.split(';')) {
    const p = part.trim();
    if (p.split(/\s+/).length >= 3 && !out.includes(p)) out.push(p);
    if (out.length >= max) break;
  }
  return out;
}

export function ToolSheet({ entry, favorite, onToggleFavorite, onClose, onStart }: {
  entry: ToolEntry | null; favorite: boolean; onToggleFavorite: (tool: CatalogTool) => void; onClose: () => void; onStart: (e: ToolEntry) => void;
}) {
  const t = useTheme();
  // la dernière fiche reste affichée pendant la fermeture de la feuille
  const last = React.useRef<ToolEntry | null>(entry);
  if (entry) last.current = entry;
  const e = entry ?? last.current;
  if (!e) return null;
  const { tool } = e;
  const preview = toolPreview(tool);
  const needs = toolNeeds(tool);
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

        {needs.length ? (
          <View style={{ gap: 2 }} testID="tool-sheet-problem">
            <Text variant="caption" muted accessibilityRole="header">{tr('glass.sheet.problem')}</Text>
            <Text variant="small" weight="medium">{needs.map((n) => tr('glass.sheet.quote', { q: n })).join(' · ')}</Text>
          </View>
        ) : null}

        {preview ? (
          <View style={{ gap: 6 }} accessible accessibilityLabel={`${tr('th.sheet.how')}. ${preview.gesture} ${preview.result}`} testID="tool-sheet-preview">
            <Text variant="caption" muted accessibilityRole="header">{tr('th.sheet.how')}</Text>
            <View style={{ borderRadius: radius.md, backgroundColor: t.colors.surfaceAlt, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, gap: 6 }}>
              <Step icon="edit-3" label={tr('th.sheet.gesture')} text={preview.gesture} />
              <Step icon="check-circle" label={tr('th.sheet.result')} text={preview.result} />
            </View>
          </View>
        ) : null}

        {/* Action principale : avant les détails, visible sans défiler sur un petit écran */}
        <GlassButton label={tr('th.sheet.start')} variant="primary" iconRight="arrow-right" full onPress={() => onStart(e)} testID="tool-sheet-start" />

        <View style={{ gap: 6 }}>
          <Text variant="caption" muted accessibilityRole="header">{tr('th.sheet.who')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {everyone ? <Pill label={tr('th.p.all')} /> : tool.profiles.map((p) => <Pill key={p} label={tr(`th.p.${p}` as TKey)} />)}
            <Pill label={tool.free ? tr('th.sheet.free') : tr('th.sheet.premium')} tone={tool.free ? 'accent' : 'plain'} />
          </View>
          {e.profile ? <Text variant="small" muted>{tr('th.sheet.whoOther', { name: e.profile })}</Text> : null}
        </View>

        {tool.subs.length ? (
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

function Step({ icon, label, text }: { icon: 'edit-3' | 'check-circle'; label: string; text: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }}>
      <View style={{ paddingTop: 2 }}><Icon name={icon} size={15} color={t.colors.primary} /></View>
      <Text variant="small" style={{ flex: 1, minWidth: 0 }}><Text variant="small" weight="bold">{label} · </Text>{text}</Text>
    </View>
  );
}
