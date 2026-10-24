/**
 * Fiches et formulaires de « Sorties & rencontres » : détail d'un lieu (sources, équipements jamais présentés comme
 * confirmés, signalement), proposition de lieu (toujours modérée), proposition de rencontre (lieu public choisi dans
 * les résultats, jamais une adresse saisie), détail d'une rencontre (je participe / annuler, signaler, bloquer).
 */
import React, { useMemo, useState } from 'react';
import { Linking, Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Chip, Field, haptic, Icon, IconButton, Row, Text, Toggle } from '@/components/ui';
import { REPORT_REASONS } from '@/features/community';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useReportPlace, useTogglePlaceFavorite, type PlaceFavorite, type ReportReason as PlaceReason } from '@/lib/data/hooks-discoveries';
import { useCancelMeetup, useCreateMeetup, useJoinMeetup, useLeaveMeetup, useReportOuting, useSuggestPlace } from '@/lib/data/hooks-outings';
import { approxDistance, directionsUrl, parseGeocode } from '@/lib/domain/nearby';
import {
  addressGeocodeUrl, containsPersonalData, MEMBER_EQUIPMENT, OUTING_CATEGORIES, OUTING_EQUIPMENT, placesLeft, validateMeetup,
  type Meetup, type OutingCategory, type OutingEquipment, type OutingPlace,
} from '@/lib/domain/outings';
import type { ReportReason } from '@/lib/types';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { catLabel, GoogleMapsMark, longDate, meetupAges, meetupWhen, PlacePhoto, placeName, SourceBadge } from './OutingsUi';

const PLACE_REASONS: PlaceReason[] = ['closed', 'hours', 'address', 'contact', 'accessibility', 'not_family', 'other'];
const equipLabel = (e: OutingEquipment) => tr(`out.equip.${e}` as TKey);

function Info({ icon, text, testID }: { icon: string; text: string; testID?: string }) {
  const t = useTheme();
  return <Row style={{ alignItems: 'flex-start' }} testID={testID}><Icon name={icon as never} size={16} color={t.colors.textMuted} /><Text variant="small" style={{ flex: 1 }}>{text}</Text></Row>;
}

// ─── Fiche d'un lieu ───────────────────────────────────────────────────────────────────────────

export function PlaceDetailSheet({ place, dist, fav, meetups, onClose, onPropose, onOpenMeetup }: {
  place: OutingPlace | null; dist: number | null; fav: PlaceFavorite | null; meetups: Meetup[];
  onClose: () => void; onPropose: (p: OutingPlace) => void; onOpenMeetup: (m: Meetup) => void;
}) {
  const t = useTheme();
  const toast = useToast();
  const toggle = useTogglePlaceFavorite();
  const reportPlace = useReportPlace();
  const reportOuting = useReportOuting();
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState<PlaceReason | null>(null);
  const [comment, setComment] = useState('');
  if (!place) return <Sheet visible={false} onClose={onClose} title=""><View /></Sheet>;
  const p = place;
  const by = tr(`out.by.${p.equipmentSource}` as TKey);
  const known = OUTING_EQUIPMENT.filter((e) => p.equipment[e] != null);
  async function sendReport() {
    if (!reason) return toast(tr('nb.reportPick'), 'info');
    if (containsPersonalData(comment)) return toast(tr('nb.reportHint'), 'info');
    try {
      if (p.source === 'member') {
        await reportOuting.mutateAsync({ suggestionId: p.id.replace(/^sugg:/, ''), reason: 'other', details: `${tr(`nb.reason.${reason}` as TKey)}${comment.trim() ? ` — ${comment.trim()}` : ''}` });
      } else {
        await reportPlace.mutateAsync({ placeId: p.id, placeName: placeName(p), reason, comment: comment.trim() || null });
      }
      toast(tr('nb.reportThanks'), 'success'); setReporting(false); setReason(null); setComment('');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Sheet visible onClose={() => { setReporting(false); onClose(); }} title={placeName(p)}>
      <View style={{ gap: spacing.sm }} testID="out-sheet">
        <PlacePhoto place={p} height={170} />
        <Row style={{ alignItems: 'center' }} wrap>
          <Text variant="small" muted style={{ flex: 1 }}>{[p.typeLabel ?? catLabel(p.category), dist != null ? approxDistance(dist) : null].filter(Boolean).join(' · ')}</Text>
          <SourceBadge place={p} />
        </Row>
        <Info icon="map-pin" text={p.address ?? tr('nb.addressNone')} />
        {p.hours ? <Info icon="clock" text={`${tr('out.hoursFrom', { source: by })} : ${p.hours}`} /> : p.hoursLines.length ? (
          <View style={{ gap: 2 }}><Info icon="clock" text={tr('out.hoursFrom', { source: by })} />{p.hoursLines.map((l) => <Text key={l} variant="caption" muted style={{ marginLeft: 24 }}>{l}</Text>)}</View>
        ) : <Info icon="clock" text={tr('nb.hoursNone')} />}
        {p.phone ? <Info icon="phone" text={p.phone} /> : null}
        {p.website ? <Info icon="globe" text={p.website.replace(/^https:\/\//, '')} /> : null}
        <View style={{ gap: 2 }} testID="out-equipment">
          {known.length ? known.map((e) => <Info key={e} icon={p.equipment[e] ? 'check' : 'x'} text={tr(p.equipment[e] ? 'out.eq.yes' : 'out.eq.no', { equip: equipLabel(e), source: by })} />)
            : <Info icon="info" text={tr('out.eq.unknown')} />}
          {p.goodForChildren ? <Info icon="smile" text={tr('out.goodForChildren')} /> : null}
        </View>
        <Info icon="users" text={p.minAge != null || p.maxAge != null ? tr('nb.ages', { min: p.minAge ?? 0, max: p.maxAge ?? '…' }) : tr('out.agesNone')} />
        {p.activities ? <Info icon="star" text={`${tr('out.activities')} : ${p.activities}`} /> : null}
        <Text variant="caption" muted testID="out-source">
          {p.source === 'member' && p.moderatedOn ? tr('out.memberVerified', { date: longDate(p.moderatedOn) }) : tr('out.verified', { source: tr(`out.src.${p.source}` as TKey), date: longDate(p.fetchedOn) })}
        </Text>
        {p.source === 'google' ? <GoogleMapsMark /> : null}
        <Row wrap>
          <Button label={tr('nb.directions')} icon="navigation" size="sm" onPress={() => void Linking.openURL(directionsUrl(p, Platform.OS))} testID="out-directions" />
          {p.mapsUri ? <Button label={tr('out.openGoogle')} icon="external-link" size="sm" variant="secondary" onPress={() => void Linking.openURL(p.mapsUri!)} testID="out-open-google" /> : null}
          {p.website ? <Button label={tr('nb.website')} icon="external-link" size="sm" variant="secondary" onPress={() => void Linking.openURL(p.website!)} /> : null}
          {p.phone ? <Button label={tr('nb.callShort')} icon="phone" size="sm" variant="secondary" onPress={() => void Linking.openURL(`tel:${p.phone!.replace(/\s/g, '')}`)} /> : null}
          {/* Les contenus Google ne sont jamais enregistrés : pas de favori pour un établissement Google */}
          {p.source !== 'google' ? (
            <Button label={fav ? tr('nb.unfavorite') : tr('nb.favorite')} icon="heart" size="sm" variant="ghost" loading={toggle.isPending}
              onPress={() => toggle.mutate({ place: { id: p.id, name: placeName(p), kind: p.category, address: p.address, lat: p.lat, lon: p.lon, source: tr(`out.src.${p.source}` as TKey) }, existing: fav }, { onSuccess: () => { haptic('selection'); toast(fav ? tr('nb.unfavorited') : tr('nb.favorited')); }, onError: (e) => toast(friendlyError(e), 'error') })} testID="out-fav" />
          ) : null}
        </Row>
        {meetups.length ? (
          <View style={{ gap: 4 }} testID="out-meetups-here">
            <Text variant="label">{tr('out.meetupsHere')}</Text>
            {meetups.map((m) => <Button key={m.id} label={`${m.title} · ${meetupWhen(m.starts_at)}`} size="sm" variant="secondary" onPress={() => onOpenMeetup(m)} />)}
          </View>
        ) : null}
        <Button label={tr('out.proposeHere')} icon="users" size="sm" variant="secondary" onPress={() => onPropose(p)} testID="out-propose-here" />
        {reporting ? (
          <View style={{ gap: spacing.sm }} testID="out-report">
            <Text variant="label">{tr('nb.reportWhat')}</Text>
            <Row wrap>{PLACE_REASONS.map((r) => <Chip key={r} label={tr(`nb.reason.${r}` as TKey)} selected={reason === r} onPress={() => setReason(r)} testID={`out-reason-${r}`} />)}</Row>
            <Field label={tr('nb.reportComment')} optional value={comment} onChangeText={setComment} multiline maxLength={1000} hint={tr('nb.reportHint')} testID="out-report-comment" />
            <Button label={tr('nb.reportSend')} full loading={reportPlace.isPending || reportOuting.isPending} onPress={sendReport} testID="out-report-send" />
          </View>
        ) : <Button label={tr('nb.report')} icon="flag" size="sm" variant="ghost" onPress={() => setReporting(true)} testID="out-report-open" />}
        <Text variant="caption" color={t.colors.textMuted}>{p.source === 'member' ? tr('out.memberNote') : p.source === 'google' ? tr('out.googleNote') : tr('out.osmNote')}</Text>
      </View>
    </Sheet>
  );
}

// ─── Proposer un lieu ──────────────────────────────────────────────────────────────────────────

const AGE_BANDS: { key: string; min: number | null; max: number | null }[] = [
  { key: 'nb.age.any', min: null, max: null }, { key: 'nb.age.baby', min: 0, max: 3 }, { key: 'nb.age.small', min: 3, max: 6 }, { key: 'nb.age.school', min: 6, max: 10 },
];

export function SuggestPlaceSheet({ visible, onClose, defaultCategory, town }: { visible: boolean; onClose: () => void; defaultCategory: OutingCategory | null; town: string | null }) {
  const toast = useToast();
  const suggest = useSuggestPlace();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<OutingCategory>(defaultCategory && defaultCategory !== 'mum_meetups' ? defaultCategory : 'parks');
  const [address, setAddress] = useState('');
  const [band, setBand] = useState(0);
  const [equip, setEquip] = useState<OutingEquipment[]>([]);
  const [activities, setActivities] = useState('');
  const [hours, setHours] = useState('');
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);
  async function send() {
    if (name.trim().length < 2) return toast(tr('out.sg.err.name'), 'info');
    if (address.trim().length < 5) return toast(tr('out.sg.err.address'), 'info');
    if ([name, activities, hours].some((s) => containsPersonalData(s))) return toast(tr('out.sg.err.personal'), 'info');
    setBusy(true);
    try {
      const q = town && !address.toLowerCase().includes(town.toLowerCase()) ? `${address}, ${town}` : address;
      const res = await fetch(addressGeocodeUrl(q));
      const hit = res.ok ? parseGeocode(await res.json())[0] : null;
      if (!hit) { toast(tr('out.sg.err.notFound'), 'info'); return; }
      const b = AGE_BANDS[band];
      await suggest.mutateAsync({
        name: name.trim(), category, address_public: address.trim(), city: hit.city, lat: hit.lat, lon: hit.lon, min_age: b.min, max_age: b.max,
        equipment: equip, activities: activities.trim() || null, hours_text: hours.trim() || null, website: website.trim() ? (/^https:\/\//.test(website.trim()) ? website.trim() : `https://${website.trim().replace(/^http:\/\//, '')}`) : null,
      });
      toast(tr('out.sg.sent'), 'success');
      setName(''); setAddress(''); setEquip([]); setActivities(''); setHours(''); setWebsite(''); setBand(0);
      onClose();
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={tr('out.sg.title')}>
      <View style={{ gap: spacing.sm }} testID="out-suggest">
        <Banner tone="info" icon="shield">{tr('out.sg.note')}</Banner>
        <Field label={tr('out.sg.name')} value={name} onChangeText={setName} maxLength={120} testID="out-sg-name" />
        <Text variant="label">{tr('out.sg.category')}</Text>
        <Row wrap>{OUTING_CATEGORIES.filter((c) => c !== 'mum_meetups').map((c) => <Chip key={c} label={catLabel(c)} selected={category === c} onPress={() => setCategory(c)} testID={`out-sg-cat-${c}`} />)}</Row>
        <Field label={tr('out.sg.address')} placeholder={tr('out.sg.addressPh')} value={address} onChangeText={setAddress} maxLength={240} testID="out-sg-address" />
        <Text variant="label">{tr('out.sg.ages')}</Text>
        <Row wrap>{AGE_BANDS.map((b, i) => <Chip key={b.key} label={tr(b.key as TKey)} selected={band === i} onPress={() => setBand(i)} />)}</Row>
        <Text variant="label">{tr('out.sg.equipment')}</Text>
        <Row wrap>{MEMBER_EQUIPMENT.map((e) => <Chip key={e} label={equipLabel(e)} selected={equip.includes(e)} onPress={() => setEquip(equip.includes(e) ? equip.filter((x) => x !== e) : [...equip, e])} testID={`out-sg-eq-${e}`} />)}</Row>
        <Field label={tr('out.sg.activities')} optional value={activities} onChangeText={setActivities} multiline maxLength={500} />
        <Field label={tr('out.sg.hours')} optional value={hours} onChangeText={setHours} maxLength={200} />
        <Field label={tr('out.sg.website')} optional value={website} onChangeText={setWebsite} autoCapitalize="none" keyboardType="url" maxLength={300} />
        <Button label={tr('out.sg.send')} full loading={busy} onPress={send} testID="out-sg-send" />
      </View>
    </Sheet>
  );
}

// ─── Proposer une rencontre ────────────────────────────────────────────────────────────────────

const TIMES = ['09:30', '10:00', '10:30', '11:00', '14:00', '15:00', '15:30', '16:30'];
const MEETUP_AGES: { min: number; max: number }[] = [{ min: 0, max: 0 }, { min: 0, max: 3 }, { min: 3, max: 6 }, { min: 6, max: 10 }, { min: 0, max: 10 }];
const DURATIONS = [60, 90, 120];
const nextDays = (n: number) => Array.from({ length: n }, (_, i) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + i + 1); return d; });

export function MeetupFormSheet({ visible, onClose, candidates, initialPlace, cityLabel }: {
  visible: boolean; onClose: () => void; candidates: OutingPlace[]; initialPlace: OutingPlace | null; cityLabel: string | null;
}) {
  const t = useTheme();
  const toast = useToast();
  const create = useCreateMeetup();
  const days = useMemo(() => nextDays(21), []);
  const [placeId, setPlaceId] = useState<string | null>(initialPlace?.id ?? null);
  const [title, setTitle] = useState('');
  const [activity, setActivity] = useState('');
  const [day, setDay] = useState(0);
  const [time, setTime] = useState('10:00');
  const [custom, setCustom] = useState('');
  const [duration, setDuration] = useState(90);
  const [capacity, setCapacity] = useState(6);
  const [ages, setAges] = useState(1);
  const [pregnant, setPregnant] = useState(false);
  React.useEffect(() => { if (initialPlace) setPlaceId(initialPlace.id); }, [initialPlace]);
  const list = useMemo(() => {
    const all = initialPlace && !candidates.some((c) => c.id === initialPlace.id) ? [initialPlace, ...candidates] : candidates;
    return all.slice(0, 30);
  }, [candidates, initialPlace]);
  const place = list.find((p) => p.id === placeId) ?? null;
  async function publish() {
    const hhmm = custom.trim() || time;
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hhmm)) return toast(tr('mt.err.time'), 'info');
    const startsAt = new Date(days[day]);
    startsAt.setHours(Number(hhmm.slice(0, 2)), Number(hhmm.slice(3)), 0, 0);
    const a = MEETUP_AGES[ages];
    const err = validateMeetup({ title, activity, place, startsAt, capacity, ageMin: a.min, ageMax: a.max, forPregnant: pregnant });
    if (err) return toast(tr(err as TKey), 'info');
    if (containsPersonalData(`${title} ${activity}`)) return toast(tr('mt.err.personal'), 'info');
    try {
      const [row] = await create.mutateAsync({ title, activity, place: place!, startsAt, capacity, ageMin: a.min, ageMax: a.max, forPregnant: pregnant, durationMin: duration, cityLabel });
      haptic('success');
      toast(row?.status === 'pending_review' ? tr('mt.form.publishedReview') : tr('mt.form.published'), 'success');
      setTitle(''); setActivity(''); setCustom('');
      onClose();
    } catch (e) {
      if ((e as { hint?: string }).hint === 'pseudonym_required') { onClose(); router.push('/community/profile'); return; }
      toast(friendlyError(e), 'error');
    }
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={tr('mt.form.title')}>
      <View style={{ gap: spacing.sm }} testID="mt-form">
        <Banner tone="info" icon="shield" title={tr('mt.rulesTitle')}>{tr('mt.rules')}</Banner>
        <Text variant="label">{tr('mt.form.place')}</Text>
        <Text variant="caption" muted>{tr('mt.form.placeHint')}</Text>
        {list.length ? (
          <View style={{ gap: 4 }} testID="mt-form-places">
            {list.map((p) => <Chip key={p.id} label={`${placeName(p)}${p.source === 'member' ? ` · ${tr('out.src.member')}` : ''}`} icon="map-pin" selected={placeId === p.id} onPress={() => setPlaceId(p.id)} testID={`mt-form-place-${p.id}`} />)}
          </View>
        ) : <Text variant="small" muted testID="mt-form-noplace">{tr('mt.form.placeNone')}</Text>}
        <Field label={tr('mt.form.titleLabel')} placeholder={tr('mt.form.titlePh')} value={title} onChangeText={setTitle} maxLength={80} testID="mt-form-title" />
        <Field label={tr('mt.form.activity')} placeholder={tr('mt.form.activityPh')} hint={tr('mt.form.activityHint')} value={activity} onChangeText={setActivity} multiline maxLength={500} testID="mt-form-activity" />
        <Text variant="label">{tr('mt.form.day')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs }}>
          {days.map((d, i) => <Chip key={d.toISOString()} label={formatDate(d, { weekday: 'short', day: 'numeric', month: 'short' })} selected={day === i} onPress={() => setDay(i)} testID={`mt-form-day-${i}`} />)}
        </ScrollView>
        <Text variant="label">{tr('mt.form.time')}</Text>
        <Row wrap>{TIMES.map((x) => <Chip key={x} label={x.replace(':', ' h ')} selected={!custom && time === x} onPress={() => { setTime(x); setCustom(''); }} testID={`mt-form-time-${x}`} />)}</Row>
        <Field label={tr('mt.form.timeField')} optional value={custom} onChangeText={setCustom} maxLength={5} keyboardType="numbers-and-punctuation" />
        <Text variant="label">{tr('mt.form.duration')}</Text>
        <Row wrap>{DURATIONS.map((x) => <Chip key={x} label={tr('mt.duration', { min: x })} selected={duration === x} onPress={() => setDuration(x)} />)}</Row>
        <Text variant="label">{tr('mt.form.capacity')}</Text>
        <Row style={{ alignItems: 'center' }}>
          <IconButton icon="minus" label={tr('mt.form.capacityMinus')} tone="filled" onPress={() => setCapacity(Math.max(3, capacity - 1))} disabled={capacity <= 3} />
          <Text variant="heading" testID="mt-form-capacity" accessibilityLiveRegion="polite">{capacity}</Text>
          <IconButton icon="plus" label={tr('mt.form.capacityPlus')} tone="filled" onPress={() => setCapacity(Math.min(20, capacity + 1))} disabled={capacity >= 20} />
        </Row>
        <Text variant="label">{tr('mt.form.ages')}</Text>
        <Row wrap>{MEETUP_AGES.map((a, i) => <Chip key={`${a.min}-${a.max}`} label={a.max === 0 ? tr('mt.agesBaby') : tr('mt.form.agesValue', { min: a.min, max: a.max })} selected={ages === i} onPress={() => setAges(i)} testID={`mt-form-ages-${i}`} />)}</Row>
        <Toggle value={pregnant} onChange={setPregnant} label={tr('mt.form.pregnant')} />
        <Button label={tr('mt.form.publish')} full loading={create.isPending} onPress={publish} testID="mt-form-publish" />
        <Text variant="caption" color={t.colors.textMuted}>{tr('cm1.report.emergency')}</Text>
      </View>
    </Sheet>
  );
}

// ─── Détail d'une rencontre ────────────────────────────────────────────────────────────────────

export function MeetupSheet({ m, organizer, organizerHandle, mine, joined, onClose, onMemberActions }: {
  m: Meetup | null; organizer: string | null; organizerHandle: string | null; mine: boolean; joined: boolean; onClose: () => void; onMemberActions: (handle: string) => void;
}) {
  const t = useTheme();
  const toast = useToast();
  const join = useJoinMeetup();
  const leave = useLeaveMeetup();
  const cancel = useCancelMeetup();
  const report = useReportOuting();
  const [reporting, setReporting] = useState(false);
  const [details, setDetails] = useState('');
  if (!m) return <Sheet visible={false} onClose={onClose} title=""><View /></Sheet>;
  const left = placesLeft(m);
  const past = new Date(m.starts_at).getTime() < Date.now();
  async function doJoin() {
    try { await join.mutateAsync(m!.id); haptic('success'); toast(tr('mt.joinedToast'), 'success'); }
    catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function doLeave() {
    try { await leave.mutateAsync(m!.id); toast(tr('mt.leftToast')); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function doCancel() {
    if (!(await confirm(tr('mt.cancelTitle'), tr('mt.cancelBody'), tr('mt.cancel')))) return;
    try { await cancel.mutateAsync(m!.id); toast(tr('mt.cancelledToast')); onClose(); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function sendReport(reason: ReportReason) {
    try { await report.mutateAsync({ meetupId: m!.id, reason, details: details.trim() || null }); toast(tr('mt.reported'), 'success'); setReporting(false); setDetails(''); }
    catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Sheet visible onClose={() => { setReporting(false); onClose(); }} title={m.title}>
      <View style={{ gap: spacing.sm }} testID="mt-sheet">
        {m.status === 'pending_review' ? <Banner tone="info" icon="eye">{tr('mt.pending')}</Banner> : null}
        {m.status === 'cancelled' ? <Banner tone="warning" icon="x-circle">{tr('mt.cancelled')}</Banner> : null}
        <Info icon="calendar" text={`${meetupWhen(m.starts_at)} · ${tr('mt.duration', { min: m.duration_min })}`} />
        <Info icon="map-pin" text={`${tr('mt.where')} : ${m.place_name}${m.place_address ? `, ${m.place_address}` : ''}`} testID="mt-sheet-place" />
        <Info icon="users" text={[meetupAges(m), m.for_pregnant ? tr('mt.pregnant') : null].filter(Boolean).join(' · ')} />
        <Info icon="info" text={m.activity} />
        <Text variant="small" weight="bold" testID="mt-sheet-left">{tr('mt.left', { count: left })}</Text>
        <Text variant="caption" muted>{mine ? tr('mt.byYou') : organizer ? tr('mt.by', { name: organizer }) : ''}</Text>
        <Row wrap>
          {m.status === 'visible' && !past && !mine ? (
            joined ? <Button label={tr('mt.leave')} icon="x" size="sm" variant="secondary" loading={leave.isPending} onPress={doLeave} testID="mt-leave" />
              : <Button label={left ? tr('mt.join') : tr('mt.full')} icon="check" size="sm" disabled={!left} loading={join.isPending} onPress={doJoin} testID="mt-join" />
          ) : null}
          <Button label={tr('mt.directions')} icon="navigation" size="sm" variant="secondary" onPress={() => void Linking.openURL(directionsUrl({ lat: m.lat, lon: m.lon, name: m.place_name }, Platform.OS))} />
          {mine && m.status !== 'cancelled' && m.status !== 'removed' ? <Button label={tr('mt.cancel')} icon="x-circle" size="sm" variant="ghost" onPress={doCancel} testID="mt-cancel" /> : null}
        </Row>
        {!mine ? (
          reporting ? (
            <View style={{ gap: spacing.xs }} testID="mt-report">
              <Text variant="label">{tr('mt.reportTitle')}</Text>
              <Field label={tr('nb.reportComment')} optional value={details} onChangeText={setDetails} maxLength={1000} hint={tr('nb.reportHint')} />
              {REPORT_REASONS.map((r) => <Chip key={r.key} label={r.label} onPress={() => void sendReport(r.key)} testID={`mt-report-${r.key}`} />)}
            </View>
          ) : (
            <Row wrap>
              <Button label={tr('mt.report')} icon="flag" size="sm" variant="ghost" onPress={() => setReporting(true)} testID="mt-report-open" />
              {organizerHandle ? <Button label={tr('mt.memberActions')} icon="slash" size="sm" variant="ghost" onPress={() => onMemberActions(organizerHandle)} testID="mt-member-actions" /> : null}
            </Row>
          )
        ) : null}
        <Text variant="caption" color={t.colors.textMuted}>{tr('mt.rules')}</Text>
      </View>
    </Sheet>
  );
}
