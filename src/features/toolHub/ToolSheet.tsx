/**
 * Fiche courte d'un outil : ce que ça fait (une phrase), pour qui, l'aperçu « geste → résultat » repris de
 * « Découvrir HOMI » quand il existe, le statut Premium, les sous-accès directs, et « Commencer » qui mène à l'outil.
 * Rien n'est lu ni écrit dans les données du foyer : textes du registre et valeurs d'exemple constantes.
 */
import React from 'react';
import { View } from 'react-native';
import { Sheet } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { ToolGlyph } from '@/components/ToolGlyph';
import { Button, haptic, Icon, Text } from '@/components/ui';
import type { ToolEntry } from '@/features/hubs/ToolSearch';
import { DISCOVER_BY_KEY } from '@/features/discover/model';
import { describeDemo } from '@/features/discover/texts';
import { subAsTool, type CatalogTool } from '@/lib/domain/toolCatalog';
import { TOOL_PROFILES } from '@/lib/journeys/tools';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { FavoriteStar, Pill } from './ToolRow';

/** Aperçu « geste → résultat » de l'outil (ou de son outil parent), s'il a une démo dans « Découvrir HOMI ». */
export function toolPreview(tool: CatalogTool): { gesture: string; result: string } | null {
  if (tool.parent) return null;
  const d = DISCOVER_BY_KEY[tool.id];
  return d ? describeDemo(d) : null;
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
  const isTool = tool.category !== 'account' && !tool.urgent;
  const everyone = tool.profiles.length >= TOOL_PROFILES.length - 1;
  return (
    <Sheet visible={!!entry} onClose={onClose} title={tool.label}>
      <View testID={`tool-sheet-${tool.id}`} style={{ gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <ToolGlyph id={tool.id} theme={tool.theme} icon={tool.icon} urgent={tool.urgent} size={56} />
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Text variant="caption" muted accessibilityRole="header">{tr('th.sheet.what')}</Text>
            {tool.sub ? <Text>{tool.sub}</Text> : null}
          </View>
          {isTool ? <FavoriteStar on={favorite} label={tool.label} onPress={() => onToggleFavorite(tool)} id={`sheet-${tool.id}`} /> : null}
        </View>

        <View style={{ gap: 6 }}>
          <Text variant="caption" muted accessibilityRole="header">{tr('th.sheet.who')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {everyone ? <Pill label={tr('th.p.all')} /> : tool.profiles.map((p) => <Pill key={p} label={tr(`th.p.${p}` as TKey)} />)}
            <Pill label={tool.free ? tr('th.sheet.free') : tr('th.sheet.premium')} tone={tool.free ? 'accent' : 'plain'} />
          </View>
          {e.profile ? <Text variant="small" muted>{tr('th.sheet.whoOther', { name: e.profile })}</Text> : null}
        </View>

        {preview ? (
          <View style={{ gap: 6 }} accessible accessibilityLabel={`${tr('th.sheet.how')}. ${preview.gesture} ${preview.result}`}>
            <Text variant="caption" muted accessibilityRole="header">{tr('th.sheet.how')}</Text>
            <View style={{ borderRadius: radius.md, backgroundColor: t.colors.surfaceAlt, padding: spacing.sm, gap: 8 }}>
              <Step icon="edit-3" label={tr('th.sheet.gesture')} text={preview.gesture} />
              <Step icon="check-circle" label={tr('th.sheet.result')} text={preview.result} />
            </View>
          </View>
        ) : null}

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

        <Button label={tr('th.sheet.start')} iconRight="arrow-right" full onPress={() => onStart(e)} testID="tool-sheet-start" />
      </View>
    </Sheet>
  );
}

function Step({ icon, label, text }: { icon: 'edit-3' | 'check-circle'; label: string; text: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
      <View style={{ paddingTop: 2 }}><Icon name={icon} size={16} color={t.colors.primary} /></View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="caption" weight="bold">{label}</Text>
        <Text variant="small">{text}</Text>
      </View>
    </View>
  );
}
