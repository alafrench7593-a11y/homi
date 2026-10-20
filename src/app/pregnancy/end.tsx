/**
 * Terminer une grossesse, avec respect : « Mon bébé est né », « Grossesse terminée » ou « Je préfère ne pas préciser ».
 * Naissance : un profil distinct par bébé (prénom, date et heure, poids, taille, terme, photo facultative),
 * parcours post-partum et parcours bébé créés. Ensuite : plus aucune semaine d'aménorrhée ni notification de grossesse.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Image, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { confirm, useToast } from '@/components/Overlays';
import { EmptyState } from '@/components/States';
import { Banner, Button, Card, Chip, Field, haptic, Icon, Row, Text } from '@/components/ui';
import { useUserId } from '@/lib/auth';
import { backend, eq } from '@/lib/backend';
import { useActivePregnancy, useActiveSubject, useChildren, useExpectedBabies, useHouseholdId, useInvalidate, useJourneyState, usePremium } from '@/lib/data/hooks';
import { usePlanLimit } from '@/lib/data/hooks-family';
import { PremiumGate } from '@/components/Family';
import { friendlyError } from '@/lib/data/hooks-settings';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { pickPhotos } from '@/lib/documents/io';
import { useRunJourneyOps } from '@/lib/journeys/manager';
import { planEndPregnancy, type Birth, type PregnancyOutcome } from '@/lib/journeys/model';
import { toFrDate } from '@/lib/validation';
import { uuid } from '@/lib/uuid';
import { t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

interface Draft { first_name: string; date: string; time: string; weight: string; length: string; term: string; sex: 'female' | 'male' | 'unspecified' | null; photo: string | null }
const empty = (name = ''): Draft => ({ first_name: name, date: toFrDate(todayISO()), time: '', weight: '', length: '', term: '', sex: null, photo: null });

function validateBirth(d: Draft): { errors: Record<string, string>; birth?: Birth } {
  const e: Record<string, string> = {};
  if (!d.first_name.trim()) e.first_name = tr('pj.birth.err.name');
  const date = frToISO(d.date);
  if (!date) e.date = tr('pj.start.err.format');
  else if (date > todayISO()) e.date = tr('pj.start.err.future');
  const time = d.time.trim();
  if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) e.time = tr('pj.birth.err.time');
  const num = (v: string) => (v.trim() ? Number(v.replace(',', '.')) : null);
  const w = num(d.weight); const l = num(d.length); const t = num(d.term);
  if (w != null && (!Number.isFinite(w) || w < 300 || w > 7000)) e.weight = tr('pj.birth.err.weight');
  if (l != null && (!Number.isFinite(l) || l < 20 || l > 70)) e.length = tr('pj.birth.err.length');
  if (t != null && (!Number.isInteger(t) || t < 20 || t > 45)) e.term = tr('pj.birth.err.term');
  if (Object.keys(e).length) return { errors: e };
  return { errors: e, birth: { first_name: d.first_name.trim(), birth_date: date!, birth_time: time || null, weight_g: w != null ? Math.round(w) : null, length_cm: l, term_weeks: t, sex: d.sex } };
}

export default function EndPregnancy() {
  const t = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams<{ outcome?: PregnancyOutcome }>();
  const userId = useUserId();
  const hid = useHouseholdId();
  const js = useJourneyState();
  const pregnancy = useActivePregnancy();
  const { data: babies } = useExpectedBabies(pregnancy?.id);
  const { setSubject } = useActiveSubject();
  const inv = useInvalidate();
  const { run, busy } = useRunJourneyOps();
  const [outcome, setOutcome] = useState<PregnancyOutcome | null>(params.outcome === 'born' ? 'born' : null);
  const [drafts, setDrafts] = useState<Draft[]>([empty()]);
  const [errors, setErrors] = useState<Record<string, string>[]>([]);
  const [prefilled, setPrefilled] = useState(false);
  const idsRef = useRef<string[]>([]);
  const groupRef = useRef(uuid());
  // Limite de l'offre gratuite (profils enfants) : dite AVANT d'enregistrer, jamais au milieu
  const premium = usePremium();
  const childLimit = usePlanLimit('children_count');
  const { data: allChildren } = useChildren();
  const remaining = premium ? Infinity : Math.max(0, childLimit - (allChildren?.length ?? 0));

  useEffect(() => {
    if (prefilled || !babies) return;
    const n = Math.max(1, babies.length);
    setDrafts(Array.from({ length: n }, (_, i) => empty(babies[i]?.nickname ?? '')));
    setPrefilled(true);
  }, [babies, prefilled]);

  if (!pregnancy) {
    return <Screen back title={tr('pj.end.title')}><EmptyState icon="moon" title={tr('pj.end.none')} action={{ label: tr('pj.editJourney'), onPress: () => router.replace('/journeys') }} /></Screen>;
  }

  // Seule la personne enceinte termine la grossesse (le conjoint ne déclare pas à sa place)
  if (pregnancy.carrier_user_id && pregnancy.carrier_user_id !== userId) {
    return <Screen back title={tr('pj.end.title')}><Banner tone="info">{tr('pj.end.notCarrier')}</Banner></Screen>;
  }

  const set = (i: number, patch: Partial<Draft>) => setDrafts((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  async function addPhoto(i: number) {
    const r = await pickPhotos(false).catch(() => [] as const);
    if (r === 'denied') { toast(tr('pj.birth.photoDenied'), 'info'); return; }
    if (r[0]) set(i, { photo: r[0].uri });
  }

  async function submit() {
    if (!pregnancy || !userId || !outcome) return;
    let births: Birth[] = [];
    if (outcome === 'born') {
      const res = drafts.map(validateBirth);
      setErrors(res.map((r) => r.errors));
      if (res.some((r) => !r.birth)) return;
      if (res.length > remaining) { toast(tr('pj.birth.limitBody', { count: remaining }), 'info'); return; }
      births = res.map((r) => r.birth!);
    } else {
      const ok = await confirm(tr('pj.end.confirmTitle'), tr('pj.end.confirmBody'), tr('pj.end.confirm'), false);
      if (!ok) return;
    }
    try {
      // Identifiants gardés entre deux essais : un nouvel envoi après une erreur ne crée pas d'enfants en double
      while (idsRef.current.length < births.length) idsRef.current.push(uuid());
      const ids = idsRef.current.slice(0, births.length);
      const h = hid ?? pregnancy.household_id;
      await run(planEndPregnancy(js.rows, userId, pregnancy.id, h, outcome, births, todayISO(), { children: ids, group: births.length > 1 ? groupRef.current : null }));
      // Photo facultative : envoyée dans l'espace privé du foyer (accès par lien signé temporaire uniquement)
      for (let i = 0; i < births.length; i++) {
        const uri = drafts[i].photo;
        if (!uri) continue;
        try {
          const path = `${h}/children/${ids[i]}.jpg`;
          await backend.storage.upload('avatars', path, { uri, mimeType: 'image/jpeg', size: 1 });
          await backend.update('children', { photo_path: path }, [eq('id', ids[i])]);
        } catch { toast(tr('pj.birth.photoFailed'), 'info'); }
      }
      inv('children');
      haptic(outcome === 'born' ? 'success' : 'light');
      if (outcome === 'born') {
        setSubject({ type: 'child', id: ids[0] });
        toast(tr(births.length > 1 ? 'pj.birth.doneMany' : 'pj.birth.done'), 'success');
        router.replace({ pathname: '/child/[id]', params: { id: ids[0] } });
      } else {
        setSubject(null);
        toast(tr('pj.end.doneEnded'), 'info');
        router.replace('/(tabs)');
      }
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
  }

  const choice = (o: PregnancyOutcome, icon: React.ComponentProps<typeof Icon>['name']) => (
    <Tappable key={o} testID={`outcome-${o}`} accessibilityRole="radio" accessibilityState={{ checked: outcome === o }} onPress={() => { haptic('selection'); setOutcome(o); }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, borderColor: outcome === o ? t.colors.primary : t.colors.border, backgroundColor: outcome === o ? t.colors.accentSoft : t.colors.surface }}>
      <Icon name={icon} color={outcome === o ? t.colors.primary : t.colors.textMuted} />
      <View style={{ flex: 1 }}>
        <Text weight="bold">{tr(`pj.outcome.${o}` as TKey)}</Text>
        <Text variant="small" muted>{tr(`pj.outcome.${o}.hint` as TKey)}</Text>
      </View>
    </Tappable>
  );

  return (
    <Screen back title={tr('pj.end.title')} subtitle={tr('pj.end.subtitle')} footer={outcome ? <Button label={outcome === 'born' ? tr(drafts.length > 1 ? 'pj.birth.submitMany' : 'pj.birth.submit', { count: drafts.length }) : tr('pj.end.confirm')} size="lg" loading={busy} onPress={() => submit()} testID="end-submit" /> : undefined}>
      {choice('born', 'heart')}
      {choice('ended', 'feather')}
      {choice('unspecified', 'circle')}

      {outcome && outcome !== 'born' ? <Banner tone="info">{tr('pj.end.support')}</Banner> : null}

      {outcome === 'born' ? (
        <>
          {drafts.map((d, i) => (
            <Card key={i}>
              <View style={{ gap: spacing.sm }}>
                {drafts.length > 1 ? <Text variant="heading" accessibilityRole="header">{tr('pj.birth.babyN', { n: i + 1 })}</Text> : null}
                <Field label={tr('pj.birth.name')} value={d.first_name} onChangeText={(v) => set(i, { first_name: v })} error={errors[i]?.first_name} maxLength={40} autoCapitalize="words" testID={`birth-name-${i}`} />
                <Row>
                  <View style={{ flex: 1 }}><Field label={tr('pj.birth.date')} placeholder="JJ/MM/AAAA" value={d.date} onChangeText={(v) => set(i, { date: v })} error={errors[i]?.date} keyboardType="numbers-and-punctuation" testID={`birth-date-${i}`} /></View>
                  <View style={{ flex: 1 }}><Field label={tr('pj.birth.time')} optional placeholder="14:30" value={d.time} onChangeText={(v) => set(i, { time: v })} error={errors[i]?.time} keyboardType="numbers-and-punctuation" testID={`birth-time-${i}`} /></View>
                </Row>
                <Row>
                  <View style={{ flex: 1 }}><Field label={tr('pj.birth.weight')} optional suffix="g" value={d.weight} onChangeText={(v) => set(i, { weight: v })} error={errors[i]?.weight} keyboardType="number-pad" testID={`birth-weight-${i}`} /></View>
                  <View style={{ flex: 1 }}><Field label={tr('pj.birth.length')} optional suffix="cm" value={d.length} onChangeText={(v) => set(i, { length: v })} error={errors[i]?.length} keyboardType="decimal-pad" testID={`birth-length-${i}`} /></View>
                </Row>
                <Field label={tr('pj.birth.term')} optional suffix="SA" value={d.term} onChangeText={(v) => set(i, { term: v })} error={errors[i]?.term} keyboardType="number-pad" testID={`birth-term-${i}`} />
                <Row wrap>
                  {(['female', 'male', 'unspecified'] as const).map((k) => <Chip key={k} label={tr(`pj.sex.${k}` as TKey)} selected={d.sex === k} onPress={() => set(i, { sex: d.sex === k ? null : k })} />)}
                </Row>
                <Row>
                  {d.photo ? <Image source={{ uri: d.photo }} style={{ width: 56, height: 56, borderRadius: 28 }} accessibilityLabel={tr('pj.birth.photo')} /> : null}
                  <Button label={d.photo ? tr('pj.birth.photoChange') : tr('pj.birth.photoAdd')} icon="camera" size="sm" variant="secondary" onPress={() => addPhoto(i)} />
                  {d.photo ? <Button label={tr('pj.birth.photoRemove')} size="sm" variant="ghost" onPress={() => set(i, { photo: null })} /> : null}
                </Row>
                {drafts.length > 1 ? <Button label={tr('pj.birth.remove')} size="sm" variant="ghost" icon="x" onPress={() => { setDrafts((ds) => ds.filter((_, j) => j !== i)); setErrors((es) => es.filter((_, j) => j !== i)); }} /> : null}
              </View>
            </Card>
          ))}
          {drafts.length > remaining ? (
            <View style={{ gap: spacing.sm }} testID="birth-limit">
              <Banner tone="warning" title={tr('pj.birth.limitTitle')}>{tr('pj.birth.limitBody', { count: remaining })}</Banner>
              <PremiumGate feature={tr('pj.birth.limitFeature')}><View /></PremiumGate>
            </View>
          ) : null}
          {drafts.length < 4 ? <Button label={tr('pj.birth.addBaby')} icon="plus" variant="ghost" onPress={() => setDrafts((ds) => [...ds, empty()])} testID="birth-add" /> : null}
          <Text variant="caption" muted>{tr('pj.birth.note')}</Text>
        </>
      ) : null}
    </Screen>
  );
}
