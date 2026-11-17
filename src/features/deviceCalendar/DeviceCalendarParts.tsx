/**
 * Calendrier de l'iPhone — briques d'interface :
 *  - `AddToDeviceCalendar` : bloc « Ajouter au calendrier iPhone » du détail d'un événement ou d'un rendez-vous
 *    (ré-appui = « Déjà dans le calendrier » avec Mettre à jour / Retirer) ;
 *  - `DeviceEventSheet` : détail en lecture seule d'un événement du téléphone ;
 *  - `DeviceCalendarEntry` : carte d'accès à l'écran « Calendrier iPhone » depuis l'agenda.
 * Tout passe par src/lib/deviceCalendar (règles testées) ; rien ici n'écrit sans un appui de l'utilisateur.
 */
import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Card, haptic, Icon, Row, Text } from '@/components/ui';
import { deviceCalendar, homiKey, type DeviceAgendaItem, type ExportSource } from '@/lib/deviceCalendar';
import { useCalendarLink, useDeviceCalendarOverview, useDeviceCalendarState } from '@/lib/deviceCalendar/hooks';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { formatDate, formatTime, t as tr } from '@/i18n';

export const DEVICE_CALENDAR_ROUTE = '/settings/iphone-calendar';
const fullDay = (iso: string) => formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

/**
 * Ajout d'un élément HOMI au calendrier de l'iPhone. Absent hors iPhone et en démonstration.
 * `notes` : texte écrit dans les notes de l'événement iOS (jamais les notes de santé du rendez-vous).
 */
export function AddToDeviceCalendar({ source, title, occurrenceStart, notes, testID = 'ical-action' }: { source: ExportSource; title: string; occurrenceStart?: string | null; notes?: string | null; testID?: string }) {
  const t = useTheme();
  const toast = useToast();
  const { status, link, access, refresh } = useCalendarLink(source, occurrenceStart);
  const [busy, setBusy] = useState(false);
  if (deviceCalendar.unavailable() || access === 'unavailable' || access == null) return null;
  const key = homiKey(source.kind, source.kind === 'event' ? source.event.id : source.appointment.id);
  const opts = { occurrenceStart, notes: [notes, tr('ical.note.from')].filter(Boolean).join('\n') };

  async function run(job: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try { await job(); } catch { toast(tr('ical.toast.failed'), 'error'); } finally { setBusy(false); refresh(); }
  }
  const explainLimit = (limit: 'monthEnd' | 'unknown' | null, at: string | null) => (limit && at ? tr(limit === 'monthEnd' ? 'ical.limit.monthEnd' : 'ical.limit.unknown', { date: fullDay(at) }) : null);

  const add = () => run(async () => {
    // Première fois : iOS pose sa question ; un refus est dit clairement, avec le chemin vers Réglages
    const a = access === 'notAsked' ? await deviceCalendar.requestAccess() : access;
    if (a !== 'full' && a !== 'writeOnly') { toast(tr('ical.toast.denied'), 'error'); return; }
    const r = await deviceCalendar.add(source, opts);
    if (r.status === 'added') {
      haptic('success');
      const name = (await deviceCalendar.calendars().catch(() => [])).find((c) => c.id === r.calendarId)?.title ?? '';
      toast([name ? tr('ical.toast.added', { calendar: name }) : tr('ical.toast.addedPlain'), explainLimit(r.plan.limit, r.plan.occurrenceStart)].filter(Boolean).join(' '));
    } else if (r.status === 'already') toast(tr('ical.act.already'), 'info');
    else if (r.status === 'noCalendar') toast(tr('ical.toast.noCalendar'), 'error');
    else toast(tr('ical.toast.denied'), 'error');
  });
  const update = () => run(async () => {
    const r = await deviceCalendar.update(source, opts);
    if (r.status === 'updated') { haptic('success'); toast([tr('ical.toast.updated'), explainLimit(r.plan.limit, r.plan.occurrenceStart)].filter(Boolean).join(' ')); }
    else toast(tr(r.status === 'notOwned' ? 'ical.toast.notOwned' : r.status === 'denied' ? 'ical.toast.denied' : 'ical.toast.missing'), 'error');
  });
  const remove = () => run(async () => {
    if (!(await confirm(tr('ical.act.removeQ'), tr('ical.act.removeBody', { title }), tr('ical.act.remove')))) return;
    const r = await deviceCalendar.remove(key);
    if (r.status === 'removed') toast(tr('ical.toast.removed'));
    else toast(tr(r.status === 'notOwned' ? 'ical.toast.notOwned' : r.status === 'denied' ? 'ical.toast.denied' : 'ical.toast.missing'), r.status === 'missing' ? 'info' : 'error');
  });
  const forget = () => run(async () => { await deviceCalendar.forget(key); });

  const linked = status === 'linked' || status === 'outdated' || status === 'unverified';
  const line = status === 'outdated' ? tr('ical.act.outdated') : status === 'missing' ? tr('ical.act.missing') : status === 'unverified' ? tr('ical.act.unverified')
    : status === 'linked' ? (link?.mode === 'occurrence' && link.occurrenceStart ? tr('ical.act.linkedOne', { date: fullDay(link.occurrenceStart) }) : link?.mode === 'series' ? tr('ical.act.linkedSeries') : tr('ical.act.linked'))
      : access === 'denied' ? tr('ical.act.deniedHint') : access === 'notAsked' ? tr('ical.act.askHint') : tr('ical.act.addHint');

  return (
    <View testID={testID} style={{ gap: spacing.xs, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: t.colors.border }}>
      <Row style={{ alignItems: 'center' }}>
        <Icon name={linked ? 'check-circle' : 'smartphone'} size={18} color={linked ? t.tokens.status.success : t.colors.textMuted} />
        <Text weight="bold" style={{ flex: 1 }}>{linked ? tr('ical.act.already') : tr('ical.title')}</Text>
      </Row>
      <Text variant="caption" muted testID={`${testID}-status`}>{line}</Text>
      {access === 'denied' && !linked ? (
        <Button label={tr('ical.access.openSettings')} icon="settings" size="sm" variant="secondary" style={{ alignSelf: 'flex-start' }} onPress={() => Linking.openSettings().catch(() => undefined)} />
      ) : status === 'none' || status == null ? (
        <Button label={tr('ical.act.add')} icon="plus" size="sm" variant="secondary" loading={busy} style={{ alignSelf: 'flex-start' }} onPress={add} testID={`${testID}-add`} />
      ) : status === 'missing' ? (
        <Row wrap>
          <Button label={tr('ical.act.addAgain')} icon="plus" size="sm" variant="secondary" loading={busy} onPress={add} testID={`${testID}-add`} />
          <Button label={tr('ical.act.forget')} size="sm" variant="ghost" onPress={forget} />
        </Row>
      ) : status === 'unverified' ? (
        <Row wrap>
          <Button label={tr('ical.act.forget')} size="sm" variant="ghost" onPress={forget} />
          <Button label={tr('ical.act.settings')} size="sm" variant="ghost" onPress={() => router.push(DEVICE_CALENDAR_ROUTE as never)} />
        </Row>
      ) : (
        <Row wrap>
          {status === 'outdated' ? <Button label={tr('ical.act.update')} icon="refresh-cw" size="sm" variant="secondary" loading={busy} onPress={update} testID={`${testID}-update`} /> : null}
          <Button label={tr('ical.act.remove')} size="sm" variant="ghost" onPress={remove} testID={`${testID}-remove`} />
        </Row>
      )}
    </View>
  );
}

/** Détail d'un événement du téléphone : lecture seule, aucune action d'écriture. */
export function DeviceEventSheet({ item, onClose }: { item: DeviceAgendaItem | null; onClose: () => void }) {
  const t = useTheme();
  const when = (i: DeviceAgendaItem) => {
    const sameDay = new Date(i.starts).toDateString() === new Date(i.ends).toDateString();
    if (i.allDay) return sameDay ? `${fullDay(i.starts)} · ${tr('ical.detail.allDay')}` : `${fullDay(i.starts)} → ${fullDay(i.ends)}`;
    return sameDay ? `${fullDay(i.starts)} · ${formatTime(i.starts)} – ${formatTime(i.ends)}` : `${fullDay(i.starts)} ${formatTime(i.starts)} → ${fullDay(i.ends)} ${formatTime(i.ends)}`;
  };
  return (
    <Sheet visible={!!item} onClose={onClose} title={tr('ical.detail.title')}>
      {item ? (
        <View style={{ gap: spacing.sm }} testID="ical-detail">
          <Text variant="heading">{item.title || tr('ical.detail.untitled')}</Text>
          <Row style={{ alignItems: 'center' }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.calendarColor ?? t.colors.textMuted }} />
            <Text variant="small" style={{ flex: 1 }}>{tr('ical.detail.calendar', { calendar: item.calendarTitle || tr('ical.title') })}</Text>
          </Row>
          <Text>{when(item)}</Text>
          {item.location ? <Text variant="small">{item.location}</Text> : null}
          {item.notes ? <Text variant="small" muted>{item.notes}</Text> : null}
          <Banner tone="info" icon="lock">{tr('ical.detail.readOnly')}</Banner>
        </View>
      ) : null}
    </Sheet>
  );
}

/** Résumé d'état, pour l'agenda et les réglages. */
export function useDeviceCalendarSummary(): { visible: boolean; text: string } {
  const o = useDeviceCalendarOverview();
  const state = useDeviceCalendarState();
  const shown = o.calendars.filter((c) => state.prefs.visibleCalendarIds.includes(c.id)).length;
  const text = o.unavailable === 'demo' ? tr('ical.rowSub.demo') : o.unavailable ? tr('ical.rowSub.unavailable')
    : o.access === 'full' ? (shown ? tr('ical.rowSub.full', { count: shown }) : tr('ical.rowSub.fullNone'))
      : o.access === 'writeOnly' ? tr('ical.rowSub.writeOnly') : o.access === 'denied' ? tr('ical.rowSub.denied') : tr('ical.rowSub.off');
  // Hors iPhone, la fonction n'existe pas : on ne la propose pas (en démonstration sur iPhone, elle s'explique)
  return { visible: o.unavailable !== 'platform', text };
}

/** Accès à « Calendrier iPhone » depuis l'agenda. */
export function DeviceCalendarEntry() {
  const t = useTheme();
  const s = useDeviceCalendarSummary();
  if (!s.visible) return null;
  return (
    <Card onPress={() => router.push(DEVICE_CALENDAR_ROUTE as never)} accessibilityLabel={`${tr('ical.title')}. ${s.text}`} testID="cal-iphone-entry">
      <Row style={{ alignItems: 'center' }}>
        <Icon name="smartphone" size={18} color={t.colors.primary} />
        <View style={{ flex: 1 }}>
          <Text weight="bold">{tr('ical.title')}</Text>
          <Text variant="small" muted>{s.text}</Text>
        </View>
        <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
      </Row>
    </Card>
  );
}
