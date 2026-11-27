/**
 * Réglages › Widgets et Live Activities (27/11/2026) : les dix widgets (formats, contenu actuel réellement envoyé),
 * comment les ajouter, enfant affiché, confidentialité, Live Activities, état et actualisation.
 * Aucune maquette : les formats sont des gabarits de proportion de la grille iOS, le contenu affiché est celui
 * que l'app a réellement transmis au widget (ou « rien encore »).
 */
import React, { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button, Card, Icon, SectionTitle, Text } from '@/components/ui';
import { ToggleRow } from '@/features/recipes/ToggleRow';
import { formatTime, t as tr, type TKey } from '@/i18n';
import { useUiStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { FAMILY_SHAPE, WIDGET_CATALOG, type Family } from '@/widgets/catalog';
import { refreshWidgets, widgetStatus, type WidgetStatus } from '@/widgets/push';
import { WidgetChildPicker } from '@/widgets/WidgetChildPicker';

const STATE: Record<string, TKey> = { ok: 'wg.state.ok', empty: 'wg.state.empty', locked: 'wg.state.locked', out: 'wg.state.out' };

function FamilyShape({ f }: { f: Family }) {
  const t = useTheme();
  const s = FAMILY_SHAPE[f];
  const unit = 32;
  return (
    <View style={{ alignItems: 'center', gap: 4 }} accessible accessibilityLabel={tr(s.label)}>
      <View style={{ width: s.w * unit, height: s.h * unit, borderRadius: f === 'lock' ? 8 : 9, borderWidth: 1.5, borderColor: t.colors.border, backgroundColor: t.colors.surface }} />
      <Text variant="caption" muted maxFontSizeMultiplier={1.3}>{tr(s.label)}</Text>
    </View>
  );
}

export default function WidgetsSettings() {
  const t = useTheme();
  const widgetsPrivate = useUiStore((s) => s.widgetsPrivate);
  const setWidgetsPrivate = useUiStore((s) => s.setWidgetsPrivate);
  const cycleDetailed = useUiStore((s) => s.cycleWidgetDetailed);
  const setCycleDetailed = useUiStore((s) => s.setCycleWidgetDetailed);
  const liveOn = useUiStore((s) => s.liveActivitiesEnabled);
  const setLiveOn = useUiStore((s) => s.setLiveActivitiesEnabled);
  const [status, setStatus] = useState<Record<string, WidgetStatus>>({});
  const load = () => { void widgetStatus().then(setStatus).catch(() => undefined); };
  useEffect(load, []);
  const ios = Platform.OS === 'ios';

  return (
    <Screen back title={tr('wg.page.title')} subtitle={tr('wg.page.sub')}>
      <SectionTitle title={tr('wg.how.title')} />
      <Card testID="wg-howto">
        {(['wg.how.1', 'wg.how.2', 'wg.how.3', 'wg.how.4'] as TKey[]).map((k, i) => (
          <View key={k} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', paddingVertical: spacing.xxs }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text variant="caption" weight="bold" style={{ color: t.colors.primaryText, fontVariant: ['tabular-nums'] }} maxFontSizeMultiplier={1.2}>{String(i + 1)}</Text>
            </View>
            <Text variant="body" style={{ flex: 1 }}>{tr(k)}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: spacing.sm }}>
          {(['small', 'medium', 'large', 'lock'] as Family[]).map((f) => <FamilyShape key={f} f={f} />)}
        </View>
      </Card>

      <Card testID="wg-child"><WidgetChildPicker /></Card>

      <SectionTitle title={tr('wg.list.title')} />
      {WIDGET_CATALOG.map((w) => {
        const st = status[w.name];
        return (
          <Card key={w.name} testID={`wg-cat-${w.name}`}>
            <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
              <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={w.icon} size={20} color={t.colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="body" weight="bold">{tr(w.title)}</Text>
                <Text variant="caption" muted>{tr(w.desc)}</Text>
              </View>
            </View>
            <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{w.families.map((f) => tr(FAMILY_SHAPE[f].label)).join(' · ')}</Text>
            {ios && st?.at ? (
              <Text variant="caption" style={{ marginTop: spacing.xxs }} testID={`wg-now-${w.name}`}>
                {st.error ? tr('wg.diag.error', { msg: st.error }) : tr('wg.now', { state: tr(STATE[st.state] ?? 'wg.state.empty'), time: formatTime(new Date(st.at)) })}
              </Text>
            ) : null}
          </Card>
        );
      })}

      {ios ? (
        <>
          <SectionTitle title={tr('lv.set.title')} />
          <Card testID="wg-live">
            <ToggleRow label={tr('lv.set.toggle')} hint={tr('lv.set.toggleD')} value={liveOn !== false} onChange={setLiveOn} />
            <Text variant="caption" weight="bold" style={{ marginTop: spacing.xs }}>{tr('wg.live.list')}</Text>
            <Text variant="caption" muted style={{ marginTop: spacing.xxs }}>{tr('wg.live.note')}</Text>
          </Card>
        </>
      ) : null}

      <SectionTitle title={tr('wg.privacy.title')} />
      <Card testID="wg-privacy">
        <ToggleRow label={tr('wg.set.private')} hint={tr('wg.set.privateD')} value={widgetsPrivate} onChange={(v) => { setWidgetsPrivate(v); refreshWidgets(); }} />
        <ToggleRow label={tr('wg.set.cycle')} hint={tr('wg.set.cycleD')} value={cycleDetailed} onChange={(v) => { setCycleDetailed(v); refreshWidgets(); }} />
        <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{tr('wg.privacy.lock')}</Text>
      </Card>

      {ios ? (
        <Card testID="wg-refresh">
          <Button variant="secondary" label={tr('wg.diag.refresh')} onPress={() => { refreshWidgets(); setTimeout(load, 1500); }} />
        </Card>
      ) : null}
    </Screen>
  );
}
