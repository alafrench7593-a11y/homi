/**
 * Point du jour post-partum : moins d'une minute, tout est facultatif, sautable.
 * Les questions de sécurité affichent IMMÉDIATEMENT l'orientation vers une aide humaine
 * (avant même d'enregistrer) ; leur détail n'est jamais stocké.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Button, Card, Chip, Field, haptic, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { DangerPanel, RecoveryWarnings, Scale, SupportPlanCard } from '@/features/postpartum';
import { usePostpartumCheckins, usePostpartumSettings, useSaveCheckin } from '@/lib/data/hooks-postpartum';
import { friendlyError } from '@/lib/data/hooks-settings';
import {
  DANGER_QUESTIONS, NEEDS, PHYSICAL_SCALES, SCALES, persistentLowDays, supportPlan,
  type CheckinInput, type DangerKey, type Need,
} from '@/lib/domain/postpartum';
import { todayISO } from '@/lib/domain/dates';
import { spacing } from '@/theme/tokens';

const QUICK = ['feeling', 'fatigue', 'stress', 'sleep_quality'];

const EMPTY: CheckinInput = {
  checkin_date: '', feeling: null, mood: null, fatigue: null, stress: null, sleep_quality: null, supported: null, coping: null,
  rest_need: null, help_need: null, needs: [], need_other: null, comment: null, physical_fatigue: null, pain: null, pain_note: null,
  recovery: null, feeding_note: null, difficulties: null, urgent_orientation_shown: false,
};

export default function PostpartumCheckin() {
  const toast = useToast();
  const today = todayISO();
  const checkinsQ = usePostpartumCheckins(30);
  const { data: settings } = usePostpartumSettings();
  const save = useSaveCheckin();
  const existing = checkinsQ.data?.find((c) => c.checkin_date === today);
  const [v, setV] = useState<CheckinInput>({ ...EMPTY, checkin_date: today });
  const [more, setMore] = useState(false);
  const [physical, setPhysical] = useState(false);
  const [danger, setDanger] = useState<DangerKey[]>([]);
  const [saved, setSaved] = useState(false);

  // Reprendre le point du jour s'il existe déjà (une entrée par jour, modifiable)
  useEffect(() => {
    if (!existing) return;
    const { id: _i, user_id: _u, created_at: _c, updated_at: _up, ...rest } = existing;
    setV(rest);
    setMore([rest.mood, rest.supported, rest.coping, rest.rest_need, rest.help_need, rest.comment].some((x) => x != null));
    setPhysical([rest.physical_fatigue, rest.pain, rest.recovery, rest.pain_note, rest.feeding_note, rest.difficulties].some((x) => x != null));
  }, [existing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = <K extends keyof CheckinInput>(k: K, val: CheckinInput[K]) => { setV((cur) => ({ ...cur, [k]: val })); setSaved(false); };
  const toggleNeed = (n: Need) => {
    haptic('selection');
    setSaved(false);
    setV((cur) => {
      if (n === 'no_answer') return { ...cur, needs: cur.needs.includes('no_answer') ? [] : ['no_answer'] };
      const base = cur.needs.filter((x) => x !== 'no_answer');
      return { ...cur, needs: base.includes(n) ? base.filter((x) => x !== n) : [...base, n] };
    });
  };
  const toggleDanger = (k: DangerKey, on: boolean) => { setDanger((cur) => (on ? [...new Set([...cur, k])] : cur.filter((x) => x !== k))); if (on) haptic('warning'); };

  const lowDays = persistentLowDays(checkinsQ.data ?? [], today);
  const plan = useMemo(() => supportPlan(v, { danger, persistentLowDays: lowDays, country: settings?.country }), [v, danger, lowDays, settings?.country]);

  async function submit() {
    try {
      await save.mutateAsync({ id: existing?.id, input: { ...v, need_other: v.needs.includes('other') ? v.need_other?.trim() || null : null, comment: v.comment?.trim() || null, urgent_orientation_shown: v.urgent_orientation_shown || danger.length > 0 } });
      haptic('success');
      setSaved(true);
      toast('Enregistré. Cela reste privé.');
      // Retour à l'espace, où les propositions de soutien du jour s'affichent en premier
      // (sauf si une question de sécurité est cochée : les numéros restent sous les yeux)
      if (danger.length === 0) router.replace('/postpartum');
    } catch (e) {
      toast(friendlyError(e, 'Enregistrement impossible. Réessayez dans un instant.'), 'error');
    }
  }

  if (checkinsQ.isLoading && !checkinsQ.data) return <Screen back title="Faire le point"><Skeleton kind="detail" rows={5} /></Screen>;

  return (
    <Screen back title="Faire le point" subtitle="Moins d’une minute. Tout est facultatif.">
      <Card>
        <View style={{ gap: spacing.md }}>
          {SCALES.filter((s) => QUICK.includes(s.key)).map((s) => (
            <Scale key={s.key} label={s.label} low={s.low} high={s.high} value={v[s.key] as number | null} onChange={(x) => set(s.key, x as never)} />
          ))}
        </View>
      </Card>

      <Card>
        <Text weight="bold">De quoi auriez-vous le plus besoin aujourd’hui ?</Text>
        <Text variant="small" muted>Plusieurs choix possibles.</Text>
        <Row wrap style={{ marginTop: spacing.sm }}>
          {NEEDS.map((n) => <Chip key={n.value} label={n.label} selected={v.needs.includes(n.value)} onPress={() => toggleNeed(n.value)} />)}
        </Row>
        {v.needs.includes('other') ? <Field label="De quoi avez-vous besoin ?" optional value={v.need_other ?? ''} onChangeText={(x) => set('need_other', x)} maxLength={300} style={{ marginTop: spacing.sm }} /> : null}
      </Card>

      <Button label={more ? 'Masquer les autres questions' : 'Plus de questions (facultatif)'} variant="ghost" icon={more ? 'chevron-up' : 'chevron-down'} onPress={() => setMore((m) => !m)} />
      {more ? (
        <Card>
          <View style={{ gap: spacing.md }}>
            {SCALES.filter((s) => !QUICK.includes(s.key)).map((s) => (
              <Scale key={s.key} label={s.label} low={s.low} high={s.high} value={v[s.key] as number | null} onChange={(x) => set(s.key, x as never)} />
            ))}
            <Field label="Un mot sur aujourd’hui" optional multiline value={v.comment ?? ''} onChangeText={(x) => set('comment', x)} maxLength={3000} style={{ minHeight: 90, textAlignVertical: 'top' }} />
          </View>
        </Card>
      ) : null}

      <Button label={physical ? 'Masquer la récupération physique' : 'Ma récupération physique (facultatif)'} variant="ghost" icon={physical ? 'chevron-up' : 'activity'} onPress={() => setPhysical((m) => !m)} />
      {physical ? (
        <Card>
          <View style={{ gap: spacing.md }}>
            {PHYSICAL_SCALES.map((s) => (
              <Scale key={s.key} label={s.label} low={s.low} high={s.high} value={v[s.key] as number | null} onChange={(x) => set(s.key, x as never)} />
            ))}
            <Field label="Où, comment ? (douleurs)" optional value={v.pain_note ?? ''} onChangeText={(x) => set('pain_note', x)} maxLength={500} />
            <Field label="Allaitement ou alimentation du bébé" hint="Seulement si vous avez envie d’en parler." optional multiline value={v.feeding_note ?? ''} onChangeText={(x) => set('feeding_note', x)} maxLength={1000} />
            <Field label="Difficultés ressenties" optional multiline value={v.difficulties ?? ''} onChangeText={(x) => set('difficulties', x)} maxLength={1000} />
            <RecoveryWarnings />
          </View>
        </Card>
      ) : null}

      <SectionTitle title="Sécurité (facultatif)" />
      <Card tone="soft">
        <Text variant="small" muted>Ces réponses ne sont pas enregistrées. Si l’une est vraie, des numéros s’affichent tout de suite, juste en dessous.</Text>
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          {DANGER_QUESTIONS.map((q) => (
            <Row key={q.key} style={{ alignItems: 'flex-start' }}>
              <Text style={{ flex: 1 }}>{q.label}</Text>
              <Toggle label={q.label} value={danger.includes(q.key)} onChange={(on) => toggleDanger(q.key, on)} />
            </Row>
          ))}
        </View>
      </Card>
      {danger.length > 0 ? <DangerPanel country={settings?.country} /> : null}

      <Button label={existing ? 'Mettre à jour mon point' : 'Enregistrer'} full onPress={submit} loading={save.isPending} />
      <Button label="Passer pour aujourd’hui" variant="ghost" full onPress={() => router.back()} />

      {saved && plan.level !== 'danger' ? <SupportPlanCard plan={plan} country={settings?.country} /> : null}
    </Screen>
  );
}
