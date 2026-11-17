/**
 * « Calendrier iPhone » : état de l'autorisation, calendriers du téléphone affichés dans l'agenda HOMI, calendrier
 * où HOMI ajoute, et ce que HOMI fait — et ne fait pas — avec le calendrier. Voir docs/CALENDRIER_IPHONE.md.
 * Les choix restent sur ce téléphone (non synchronisés) : les calendriers d'un iPhone sont des données privées.
 */
import React from 'react';
import { Linking, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Divider, haptic, Icon, type IconName, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { deviceCalendar, type DeviceCalendarInfo } from '@/lib/deviceCalendar';
import { useDeviceCalendarOverview, useDeviceCalendarState } from '@/lib/deviceCalendar/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function IphoneCalendarScreen() {
  const t = useTheme();
  const o = useDeviceCalendarOverview();
  const { prefs } = useDeviceCalendarState();
  const writable = o.calendars.filter((c) => c.writable);
  const target = prefs.targetCalendarId && writable.some((c) => c.id === prefs.targetCalendarId) ? prefs.targetCalendarId : null;

  const isFull = o.access === 'full';
  const needsAsk = o.access === 'notAsked';
  const accessKey: 'full' | 'writeOnly' | 'notAsked' | 'denied' = isFull ? 'full' : o.access === 'writeOnly' ? 'writeOnly' : needsAsk ? 'notAsked' : 'denied';
  const accessIcon: IconName = isFull ? 'check-circle' : accessKey === 'writeOnly' ? 'edit-3' : accessKey === 'denied' ? 'slash' : 'calendar';
  const accessColor = isFull ? t.tokens.status.success : accessKey === 'denied' ? t.tokens.status.warning : t.colors.primary;

  const toggle = (id: string, on: boolean) => {
    haptic('selection');
    void deviceCalendar.setPrefs({ visibleCalendarIds: on ? [...prefs.visibleCalendarIds, id] : prefs.visibleCalendarIds.filter((x) => x !== id) });
  };
  const pick = (id: string | null) => { haptic('selection'); void deviceCalendar.setPrefs({ targetCalendarId: id }); };
  const sub = (c: DeviceCalendarInfo) => [c.sourceName, c.writable ? null : tr('ical.show.readOnly')].filter(Boolean).join(' · ');
  const dot = (c: DeviceCalendarInfo | null) => <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c?.color ?? t.colors.textMuted }} />;

  const radio = (id: string | null, label: string, caption: string | null, c: DeviceCalendarInfo | null) => {
    const on = target === id;
    return (
      <Tappable key={id ?? 'default'} bare onPress={() => pick(id)} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={[label, caption].filter(Boolean).join('. ')} testID={`ical-target-${id ?? 'default'}`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH, paddingVertical: spacing.xs }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: on ? t.colors.primary : t.colors.border }}>
          {on ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.colors.primary }} /> : null}
        </View>
        {dot(c)}
        <View style={{ flex: 1 }}>
          <Text weight="medium">{label}</Text>
          {caption ? <Text variant="caption" muted>{caption}</Text> : null}
        </View>
      </Tappable>
    );
  };

  return (
    <Screen back title={tr('ical.title')} subtitle={tr('ical.subtitle')}>
      <Card>
        <Text variant="small">{tr('ical.intro')}</Text>
      </Card>
      <Banner tone="info" icon="lock">{tr('ical.privacy')}</Banner>

      <SectionTitle title={tr('ical.access.title')} />
      {o.unavailable ? (
        <Banner tone={o.unavailable === 'demo' ? 'demo' : 'info'} title={tr('ical.unavailable.title')}>
          {tr(o.unavailable === 'demo' ? 'ical.unavailable.demo' : o.unavailable === 'module' ? 'ical.unavailable.module' : 'ical.unavailable.platform')}
        </Banner>
      ) : o.loading || o.access == null ? (
        <Card><Text variant="small" muted>{tr('ical.access.checking')}</Text></Card>
      ) : (
        <Card testID={`ical-access-${o.access}`}>
          <Row style={{ alignItems: 'flex-start' }}>
            <Icon name={accessIcon} size={20} color={accessColor} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text weight="bold">{tr(`ical.access.${accessKey}` as const)}</Text>
              <Text variant="small">{tr(`ical.access.${accessKey}Body` as const)}</Text>
            </View>
          </Row>
          {needsAsk ? (
            <Button label={tr('ical.access.ask')} icon="calendar" full style={{ marginTop: spacing.sm }} onPress={() => void o.request()} testID="ical-ask" />
          ) : !isFull ? (
            <Button label={tr('ical.access.openSettings')} icon="settings" variant="secondary" full style={{ marginTop: spacing.sm }} onPress={() => Linking.openSettings().catch(() => undefined)} testID="ical-open-settings" />
          ) : null}
        </Card>
      )}

      {isFull ? (
        <>
          <SectionTitle title={tr('ical.show.title')} />
          <Card>
            <Text variant="caption" muted>{tr('ical.show.hint')}</Text>
            {o.calendars.length ? o.calendars.map((c, k) => (
              <View key={c.id}>
                {k ? <Divider /> : null}
                <Row style={{ alignItems: 'center', minHeight: MIN_TOUCH, paddingVertical: spacing.xs }}>
                  {dot(c)}
                  <View style={{ flex: 1 }}>
                    <Text weight="medium">{c.title}</Text>
                    {sub(c) ? <Text variant="caption" muted>{sub(c)}</Text> : null}
                  </View>
                  <Toggle label={tr('ical.show.toggle', { calendar: c.title })} value={prefs.visibleCalendarIds.includes(c.id)} onChange={(v) => toggle(c.id, v)} />
                </Row>
              </View>
            )) : <Text variant="small" muted style={{ marginTop: spacing.xs }}>{tr('ical.show.none')}</Text>}
          </Card>

          <SectionTitle title={tr('ical.target.title')} />
          <Card>
            <Text variant="caption" muted>{tr('ical.target.hint')}</Text>
            <View accessibilityRole="radiogroup">
              {radio(null, o.defaultCalendar ? tr('ical.target.default', { calendar: o.defaultCalendar.title }) : tr('ical.target.defaultPlain'), tr('ical.target.defaultNote'), o.defaultCalendar)}
              {writable.map((c) => radio(c.id, c.title, c.sourceName, c))}
            </View>
          </Card>
        </>
      ) : null}

      <SectionTitle title={tr('ical.noSync.title')} />
      <Card>
        <View style={{ gap: spacing.xs }}>
          <Text variant="small">{tr('ical.noSync.body')}</Text>
          <Text variant="small">{tr('ical.noSync.rules')}</Text>
        </View>
      </Card>
    </Screen>
  );
}
