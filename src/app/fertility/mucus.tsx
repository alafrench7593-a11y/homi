/**
 * Observation de la glaire cervicale : aspect, texture, sensation, note, photo facultative,
 * comparaison au fil du cycle. Jamais de conclusion sur l'ovulation.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, Pressable, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { confirm, useToast } from '@/components/Overlays';
import { PrivateBanner } from '@/components/Fertility';
import { ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Field, haptic, IconButton, ListRow, Loading, Row, SectionTitle, Text } from '@/components/ui';
import { KeepPhotoChoice, PhotoButtons, PhotoGuide } from '@/features/cycleTests';
import { useUserId } from '@/lib/auth';
import { useInvalidate, usePeriods } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useFertilityObservations } from '@/lib/data/hooks-fertility';
import { requestMucusSuggestion, useDeletePhoto, useSaveMucus } from '@/lib/data/hooks-cycle';
import { backend, eq } from '@/lib/backend';
import { BackendError } from '@/lib/backend/types';
import {
  fertilitySign, MUCUS_CATEGORIES, MUCUS_SENSATIONS, MUCUS_TEXTURES, mucusLabel, observationMessage, photoSuggestionMessage,
  suggestionConfidenceLabel, type MucusCategory, type MucusSensation, type MucusTexture, type PhotoSuggestionResult,
} from '@/lib/cycleAnalysis/mucus';
import { assessQuality, QUALITY_MESSAGES } from '@/lib/cycleAnalysis/quality';
import { decodeImage, jpegBase64ForUpload } from '@/lib/cycleAnalysis/decode';
import { deleteEncryptedPhoto, discardLocalImage, loadEncryptedPhoto } from '@/lib/cycleAnalysis/privacy';
import { daysBetween, formatDateFr, frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';
import { t as tr } from '@/i18n';

const SIGN_COLOUR = { less_fertile: '#C9C0D6', intermediate: '#E9CFA4', potentially_fertile: '#7FB6E8', see_professional: '#C8283F', none: '#B9B9C6' } as const;

export default function MucusScreen() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const userId = useUserId();
  const save = useSaveMucus();
  const delPhoto = useDeletePhoto();
  const obsQ = useFertilityObservations(200);
  const { data: obs } = obsQ;
  const { data: periods } = usePeriods();

  const [date, setDate] = useState(toFrDate(todayISO()));
  const [category, setCategory] = useState<MucusCategory | null>(null);
  const [texture, setTexture] = useState<MucusTexture | null>(null);
  const [sensation, setSensation] = useState<MucusSensation | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [uri, setUri] = useState<string | null>(null);
  const uriRef = useRef<string | null>(null);
  const [qualityMsg, setQualityMsg] = useState<string[] | null>(null);
  const [suggestion, setSuggestion] = useState<PhotoSuggestionResult | null>(null);
  const [asking, setAsking] = useState(false);
  const [keepPhoto, setKeepPhoto] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);

  useEffect(() => { uriRef.current = uri; }, [uri]);
  useEffect(() => () => { void discardLocalImage(uriRef.current); }, []);

  async function onPicked(u: string) {
    await discardLocalImage(uri);
    setUri(u);
    setSuggestion(null);
    setQualityMsg(null);
    try {
      // Contrôle de qualité SUR LE TÉLÉPHONE, avant tout envoi éventuel
      const q = assessQuality(await decodeImage(u));
      setQualityMsg(q.ok ? [] : q.issues.map((i) => QUALITY_MESSAGES[i]));
    } catch {
      setQualityMsg([tr('u3.fertMucus.unreadable')]);
    }
  }

  async function dropPhoto() {
    await discardLocalImage(uri);
    setUri(null);
    uriRef.current = null;
    setSuggestion(null);
    setQualityMsg(null);
    setKeepPhoto(false);
  }

  async function askSuggestion() {
    if (!uri) return;
    const ok = await confirm(
      tr('u3.fertMucus.sendQ'),
      tr('u3.fertMucus.sendBody'),
      tr('u3.fertMucus.sendOk'),
    );
    if (!ok) return;
    setAsking(true);
    try {
      const b64 = await jpegBase64ForUpload(uri);
      setSuggestion(await requestMucusSuggestion(b64));
    } catch (err) {
      const code = err instanceof BackendError ? err.code : null;
      toast(code === 'ai_not_configured' ? tr('u3.fertMucus.aiOff') : friendlyError(err), 'error');
    } finally {
      setAsking(false);
    }
  }

  async function submit() {
    const iso = frToISO(date);
    if (!iso || iso > todayISO()) return setError(tr('u3.fertBody.dateInvalid'));
    if (!category && !texture && !sensation && !note.trim()) return setError(tr('u3.fertMucus.needOne'));
    setError(null);
    if (!userId) return;
    try {
      const res = await save.mutateAsync({ userId, observedOn: iso, category, texture, sensation, note: note.trim() || null, suggestion, photoUri: uri, keepPhoto });
      uriRef.current = null;
      setUri(null);
      setSuggestion(null);
      setQualityMsg(null);
      setCategory(null); setTexture(null); setSensation(null); setNote(''); setKeepPhoto(false);
      haptic('success');
      toast(res.photoPath ? tr('u3.fertMucus.savedPhoto') : tr('u3.fertMucus.savedNoPhoto'));
    } catch (err) {
      setUri(null);
      toast(friendlyError(err), 'error');
    }
  }

  async function remove(id: string, on: string, photoPath?: string | null) {
    if (!(await confirm(tr('u3.fertBody.delTitle', { date: formatDateFr(on) }), tr('u3.fertMucus.delBody'), tr('u3.fertBody.delOk')))) return;
    try {
      await deleteEncryptedPhoto(photoPath);
      await backend.remove('fertility_observations', [eq('id', id)]);
      inv('fertility_observations');
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  async function removePhotoOnly(id: string, photoPath: string) {
    if (!(await confirm(tr('u3.fertMucus.delPhotoQ'), tr('u3.fertMucus.delPhotoBody'), tr('u3.fertBody.delOk')))) return;
    try {
      await delPhoto.mutateAsync({ table: 'fertility_observations', id, photoPath });
      toast(tr('u3.fertMucus.photoDeleted'));
    } catch (err) {
      toast(friendlyError(err), 'error');
    }
  }

  async function view(path: string) {
    try {
      setViewing(await loadEncryptedPhoto(path));
    } catch {
      toast(tr('u3.fertMucus.photoUnreadable'), 'error');
    }
  }

  // Comparaison au fil du cycle : un rang par cycle, une pastille par jour de cycle
  const cycles = useMemo(() => {
    const starts = [...new Set((periods ?? []).map((p) => p.start_date))].sort().slice(-3);
    const withMucus = (obs ?? []).filter((o) => o.cervical_mucus);
    return starts.reverse().map((start, idx, arr) => {
      const end = idx === 0 ? todayISO() : arr[idx - 1];
      const days = withMucus.filter((o) => o.observed_on >= start && o.observed_on < end).map((o) => ({ day: daysBetween(start, o.observed_on) + 1, cat: o.cervical_mucus as MucusCategory }));
      return { start, days };
    });
  }, [periods, obs]);

  const message = observationMessage(category);
  const lastObs = useMemo(() => [...(obs ?? [])].filter((o) => o.cervical_mucus).sort((a, b) => b.observed_on.localeCompare(a.observed_on))[0] ?? null, [obs]);

  return (
    <Screen back title={tr('u3.fertMucus.title')} subtitle={tr('u3.fertMucus.subtitle')}
      action={{ label: tr('u3.fertMucus.saveObs'), icon: 'check', onPress: () => submit(), disabled: save.isPending, testID: 'mucus-save' }}>
      <TodaySummary title={tr('u3.fertBody.lastObs')} items={[
        { icon: 'droplet', value: lastObs ? mucusLabel(lastObs.cervical_mucus as MucusCategory) ?? '—' : '—', label: lastObs ? formatDateFr(lastObs.observed_on, false) : tr('u3.fertMucus.aspect') },
        { icon: 'calendar', value: String(cycles[0]?.days.length ?? 0), label: tr('u3.fertMucus.daysCycle') },
      ]} />
      <PrivateBanner>{tr('u3.fertMucus.private')}</PrivateBanner>

      <Card>
        <Field label={tr('u3.fertBody.date')} value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" placeholder={tr('u3.fertBody.datePh')} />
        <Text variant="label" style={{ marginTop: spacing.sm }}>{tr('u3.fertMucus.whichAspect')}</Text>
        {/* reprise en un geste de l'aspect noté la dernière fois (à vérifier avant d'enregistrer) */}
        {!category && lastObs && MUCUS_CATEGORIES.some((m) => m.value === lastObs.cervical_mucus) ? (
          <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
            <Chip icon="corner-down-left" label={tr('u3.fertMucus.like', { date: formatDateFr(lastObs.observed_on, false), label: mucusLabel(lastObs.cervical_mucus as MucusCategory) ?? '' })} onPress={() => setCategory(lastObs.cervical_mucus as MucusCategory)} testID="mucus-prefill" />
          </View>
        ) : null}
        <View style={{ gap: 6, marginTop: 6 }}>
          {MUCUS_CATEGORIES.map((m) => (
            <Tappable key={m.value} accessibilityRole="radio" accessibilityState={{ selected: category === m.value }} onPress={() => setCategory(category === m.value ? null : m.value)}
              style={{ padding: spacing.sm, borderRadius: radius.md, borderWidth: 1.5, borderColor: category === m.value ? t.colors.primary : t.colors.border, backgroundColor: category === m.value ? t.colors.primary + '18' : 'transparent' }}>
              <Text weight="bold">{m.label}</Text>
              <Text variant="caption" muted>{m.hint}</Text>
            </Tappable>
          ))}
        </View>
        <Text variant="label" style={{ marginTop: spacing.sm }}>{tr('u3.fertMucus.texture')}</Text>
        <Row wrap style={{ marginTop: 6 }}>{MUCUS_TEXTURES.map((m) => <Chip key={m.value} label={m.label} selected={texture === m.value} onPress={() => setTexture(texture === m.value ? null : m.value)} />)}</Row>
        <Text variant="label" style={{ marginTop: spacing.sm }}>{tr('u3.fertMucus.sensation')}</Text>
        <Row wrap style={{ marginTop: 6 }}>{MUCUS_SENSATIONS.map((m) => <Chip key={m.value} label={m.label} selected={sensation === m.value} onPress={() => setSensation(sensation === m.value ? null : m.value)} />)}</Row>
        <View style={{ marginTop: spacing.sm }}><Field label={tr('u3.fertBody.note')} optional value={note} onChangeText={setNote} maxLength={500} /></View>
        {message ? <Banner tone={fertilitySign(category) === 'see_professional' ? 'warning' : 'info'}>{message}</Banner> : null}
      </Card>

      <SectionTitle title={tr('u3.fertMucus.photoT')} />
      <Card>
        {!uri ? (
          <>
            <Text variant="small" muted>{tr('u3.fertMucus.photoHelp')}</Text>
            <View style={{ marginTop: spacing.sm }}><PhotoGuide kind="mucus" /></View>
            <View style={{ marginTop: spacing.sm }}><PhotoButtons onPicked={onPicked} onError={(m) => toast(m, 'error')} /></View>
          </>
        ) : (
          <>
            <Row>
              <Image source={{ uri }} style={{ width: 84, height: 84, borderRadius: radius.md }} accessibilityLabel={tr('u3.fertMucus.preview')} />
              <View style={{ flex: 1, gap: 4 }}>
                {qualityMsg == null ? <Loading label={tr('u3.fertMucus.checking')} /> : qualityMsg.length ? qualityMsg.map((m) => <Text key={m} variant="small">{m}</Text>) : <Text variant="small">{tr('u3.fertMucus.sharp')}</Text>}
              </View>
            </Row>
            {!suggestion ? (
              <Button label={tr('u3.fertMucus.propose')} icon="send" variant="secondary" style={{ marginTop: spacing.sm }} loading={asking} disabled={!qualityMsg || qualityMsg.length > 0} onPress={askSuggestion} />
            ) : (
              <View style={{ marginTop: spacing.sm, gap: 4 }}>
                <Text variant="caption" muted weight="bold">{tr('u3.fertMucus.sugg')}</Text>
                {suggestion.analyzable && suggestion.category !== 'unanalyzable' ? <Text weight="bold">{tr('u3.fertMucus.conf', { label: mucusLabel(suggestion.category) ?? '', level: suggestionConfidenceLabel(suggestion.confidence) })}</Text> : null}
                <Text variant="small">{photoSuggestionMessage(suggestion)}</Text>
                {suggestion.analyzable && suggestion.category !== 'unanalyzable' && suggestion.category !== category ? (
                  <Button label={tr('u3.fertMucus.useSugg')} size="sm" variant="secondary" onPress={() => setCategory(suggestion.category as MucusCategory)} />
                ) : null}
              </View>
            )}
            <View style={{ marginTop: spacing.sm }}><KeepPhotoChoice value={keepPhoto} onChange={setKeepPhoto} /></View>
            <Button label={tr('u3.fertMucus.dropNow')} icon="trash-2" variant="ghost" onPress={async () => { await dropPhoto(); toast(tr('u3.fertMucus.photoDeleted')); }} />
          </>
        )}
      </Card>

      {error ? <Banner tone="danger">{error}</Banner> : null}

      <SectionTitle title={tr('u3.fertMucus.overT')} />
      {obsQ.isLoading && !obs ? <Skeleton kind="card" rows={1} /> : obsQ.isError && !obs ? (
        <ErrorView error={obsQ.error} onRetry={() => void obsQ.refetch()} title={tr('u3.fertBody.errShow')} />
      ) : cycles.some((c) => c.days.length) ? (
        <Card>
          {cycles.map((c) => (
            <View key={c.start} style={{ marginBottom: spacing.sm }}>
              <Text variant="caption" muted>{tr('u3.fertMucus.cycleStarted', { date: formatDateFr(c.start) })}</Text>
              <Row gap={2} style={{ marginTop: 4, flexWrap: 'wrap' }}>
                {Array.from({ length: 35 }, (_, i) => {
                  const d = c.days.find((x) => x.day === i + 1);
                  return <View key={i} accessibilityLabel={d ? tr('u3.fertMucus.dayN', { n: i + 1, label: mucusLabel(d.cat) ?? '' }) : undefined} style={{ width: 8, height: 14, borderRadius: 2, backgroundColor: d ? SIGN_COLOUR[fertilitySign(d.cat)] : t.colors.border + '66' }} />;
                })}
              </Row>
            </View>
          ))}
          <View style={{ gap: 2 }}>
            {([['less_fertile', 'u3.fert_mucus.lg1'], ['intermediate', 'u3.fert_mucus.lg2'], ['potentially_fertile', 'u3.fert_mucus.lg3'], ['see_professional', 'u3.fert_mucus.lg4']] as const).map(([k, l]) => (
              <Row key={k} gap={6}><View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: SIGN_COLOUR[k] }} /><Text variant="caption" muted>{tr(l)}</Text></Row>
            ))}
          </View>
          <Text variant="caption" muted style={{ marginTop: 6 }}>{tr('u3.fertMucus.legendNote')}</Text>
        </Card>
      ) : (
        <Card tone="soft"><Text muted>{tr('u3.fertMucus.compare')}</Text></Card>
      )}

      {(obs ?? []).some((o) => o.cervical_mucus || o.mucus_texture || o.mucus_sensation) ? (
        <>
          <SectionTitle title={tr('u3.fertBody.mine')} />
          <Card>
            {(obs ?? []).filter((o) => o.cervical_mucus || o.mucus_texture || o.mucus_sensation).slice(0, 20).map((o) => (
              <ListRow
                key={o.id}
                icon="droplet"
                title={formatDateFr(o.observed_on)}
                subtitle={[mucusLabel(o.cervical_mucus), MUCUS_TEXTURES.find((x) => x.value === o.mucus_texture)?.label, MUCUS_SENSATIONS.find((x) => x.value === o.mucus_sensation)?.label, o.photo_path ? tr('u3.fertMucus.encPhoto') : null, o.note].filter(Boolean).join(' · ')}
                right={(
                  <Row gap={0}>
                    {o.photo_path ? <IconButton icon="eye" label={tr('u3.fertMucus.viewPhoto')} onPress={() => view(o.photo_path!)} /> : null}
                    {o.photo_path ? <IconButton icon="image" label={tr('u3.fertMucus.delPhotoOnly')} onPress={() => removePhotoOnly(o.id, o.photo_path!)} /> : null}
                    <IconButton icon="trash-2" label={tr('u3.fertBody.delA11y', { date: formatDateFr(o.observed_on) })} onPress={() => remove(o.id, o.observed_on, o.photo_path)} />
                  </Row>
                )}
              />
            ))}
          </Card>
        </>
      ) : null}

      <Modal visible={!!viewing} transparent animationType="fade" onRequestClose={() => setViewing(null)}>
        <Pressable accessibilityRole="button" accessibilityLabel={tr('u3.fertMucus.closePhoto')} onPress={() => setViewing(null)} style={{ flex: 1, backgroundColor: '#000d', alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
          {viewing ? <Image source={{ uri: viewing }} style={{ width: '100%', height: '70%' }} resizeMode="contain" /> : null}
          <Text color="#fff" style={{ marginTop: spacing.sm }}>{tr('u3.fertMucus.tapClose')}</Text>
        </Pressable>
      </Modal>
    </Screen>
  );
}
