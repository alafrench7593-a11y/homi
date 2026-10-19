/**
 * « J'ai un test positif / Je démarre une grossesse ».
 * Le terme est calculé UNIQUEMENT avec les informations saisies ici (jamais avec une ancienne grossesse) ;
 * s'il manque la date des dernières règles et le terme connu, il est clairement indiqué comme estimé.
 * Le suivi du cycle précédent est archivé (ou supprimé si la personne le demande), puis le tableau de bord grossesse s'ouvre.
 */
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Field, haptic, Icon, Segmented, Text } from '@/components/ui';
import { createPregnancyChecklists } from '@/features/profiles';
import { journeyLabel } from '@/features/journeys';
import { useUserId } from '@/lib/auth';
import { ensureHousehold, useActivePregnancy, useActiveSubject, useHouseholdId, useJourneyState } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { addDays, frToISO, todayISO } from '@/lib/domain/dates';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { useRunJourneyOps } from '@/lib/journeys/manager';
import { babiesFor, computeDue, planStartPregnancy, type CloseMode, type PregnancyStart } from '@/lib/journeys/model';
import { uuid } from '@/lib/uuid';
import { formatDate, t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

type Mult = PregnancyStart['multiplicity'];

export default function StartPregnancy() {
  const t = useTheme();
  const toast = useToast();
  const userId = useUserId();
  const hid = useHouseholdId();
  const js = useJourneyState();
  const current = useActivePregnancy();
  const { setSubject } = useActiveSubject();
  const { run, busy } = useRunJourneyOps();
  const [lmp, setLmp] = useState('');
  const [conception, setConception] = useState('');
  const [test, setTest] = useState('');
  const [due, setDue] = useState('');
  const [mult, setMult] = useState<Mult>('single');
  const [nicknames, setNicknames] = useState(['', '', '']);
  const [mode, setMode] = useState<CloseMode>('archive');
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Identifiant gardé entre deux essais : jamais deux grossesses pour un même envoi
  const pidRef = useRef(uuid());

  const today = todayISO();
  const parsed = useMemo(() => {
    const e: Record<string, string> = {};
    const read = (k: string, v: string, past: boolean) => {
      if (!v.trim()) return null;
      const iso = frToISO(v);
      if (!iso) { e[k] = tr('pj.start.err.format'); return null; }
      if (past && iso > today) { e[k] = tr('pj.start.err.future'); return null; }
      if (past && iso < addDays(today, -300)) { e[k] = tr('pj.start.err.old'); return null; }
      if (!past && (iso < addDays(today, -21) || iso > addDays(today, 300))) { e[k] = tr('pj.start.err.due'); return null; }
      return iso;
    };
    const s: PregnancyStart = { lmp: read('lmp', lmp, true), conception: read('conception', conception, true), positiveTest: read('test', test, true), due: read('due', due, false), multiplicity: mult, nicknames };
    return { s, e, result: computeDue(s) };
  }, [lmp, conception, test, due, mult, nicknames, today]);

  const closing = js.body && js.body.type !== 'pregnancy' ? js.body : null;
  const n = babiesFor(mult);

  async function submit() {
    setErrors(parsed.e);
    if (Object.keys(parsed.e).length) return;
    if (!parsed.result) { setErrors({ test: tr('pj.start.err.missing') }); return; }
    if (!userId) return;
    try {
      const h = hid ?? (await ensureHousehold());
      const pid = pidRef.current;
      await run(planStartPregnancy(js.rows, userId, h, parsed.s, mode, today, { pregnancy: pid }));
      await createPregnancyChecklists(h, pid, n);
      setSubject({ type: 'pregnancy', id: pid });
      haptic('success');
      toast(tr('pj.start.done'), 'success');
      router.replace('/pregnancy');
    } catch (e) {
      toast(e instanceof Error && e.message === 'already_pregnant' ? tr('pj.start.err.already') : friendlyError(e), 'error');
    }
  }

  if (current) {
    return (
      <Screen back title={tr('pj.start.title')}>
        <Banner tone="info" title={tr('pj.start.err.already')} action={<Button label={tr('pj.start.open')} size="sm" variant="secondary" onPress={() => router.replace('/pregnancy')} style={{ marginTop: 8, alignSelf: 'flex-start' }} />}>{tr('pj.start.alreadyBody')}</Banner>
      </Screen>
    );
  }

  const p = parsed.result ? pregnancyProgress(parsed.result.due) : null;
  return (
    <Screen back title={tr('pj.start.title')} subtitle={tr('pj.start.subtitle')} footer={<Button label={tr('pj.start.submit')} size="lg" loading={busy} onPress={() => void submit()} testID="start-submit" />}>
      <Field label={tr('pj.start.lmp')} optional placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" value={lmp} onChangeText={setLmp} error={errors.lmp} testID="start-lmp" />
      <Field label={tr('pj.start.conception')} optional placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" value={conception} onChangeText={setConception} error={errors.conception} testID="start-conception" />
      <Field label={tr('pj.start.test')} placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" value={test} onChangeText={setTest} error={errors.test} testID="start-test" />
      <Field label={tr('pj.start.due')} optional placeholder="JJ/MM/AAAA" keyboardType="numbers-and-punctuation" value={due} onChangeText={setDue} error={errors.due} hint={tr('pj.start.dueHint')} testID="start-due" />

      <Segmented label={tr('pj.start.mult')} value={mult} onChange={setMult} options={[
        { value: 'single', label: tr('pj.mult.single') }, { value: 'twins', label: tr('pj.mult.twins') },
        { value: 'triplets', label: tr('pj.mult.triplets') }, { value: 'unknown', label: tr('pj.mult.unknown') },
      ]} />
      {Array.from({ length: n }, (_, i) => (
        <Field key={i} label={n > 1 ? tr('pj.start.nicknameN', { n: i + 1 }) : tr('pj.start.nickname')} optional value={nicknames[i]} maxLength={30} onChangeText={(v) => setNicknames((xs) => xs.map((x, j) => (j === i ? v : x)))} testID={`start-nick-${i}`} />
      ))}

      <View testID="start-due-result"><Card tone="soft">
        {parsed.result && p ? (
          <>
            <Text variant="caption" weight="bold" muted>{tr('pj.start.result')}</Text>
            <Text variant="heading">{formatDate(parsed.result.due, { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            <Text variant="small" muted>{p.label}</Text>
            {parsed.result.estimated ? <Text variant="small" weight="bold" color={t.colors.primary} testID="start-estimated">{tr(parsed.result.source === 'conception' ? 'pj.start.estimatedConception' : 'pj.start.estimatedTest')}</Text> : <Text variant="small" muted>{tr(parsed.result.source === 'lmp' ? 'pj.start.fromLmp' : 'pj.start.fromDue')}</Text>}
          </>
        ) : <Text variant="small" muted>{tr('pj.start.needDate')}</Text>}
      </Card></View>

      {closing ? (
        <View style={{ gap: spacing.xs }}>
          <Text weight="bold">{tr('pj.start.closing', { name: journeyLabel(closing.type) })}</Text>
          {(['archive', 'delete'] as const).map((m) => (
            <Pressable key={m} testID={`start-mode-${m}`} accessibilityRole="radio" accessibilityState={{ checked: mode === m }} onPress={() => setMode(m)}
              style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', padding: spacing.sm, borderRadius: radius.md, borderWidth: 1.5, borderColor: mode === m ? t.colors.primary : t.colors.border }}>
              <Icon name={mode === m ? 'check-circle' : 'circle'} color={mode === m ? t.colors.primary : t.colors.textMuted} />
              <View style={{ flex: 1 }}>
                <Text weight="bold">{tr(m === 'archive' ? 'pj.mode.archive' : 'pj.mode.delete')}</Text>
                <Text variant="small" muted>{tr(m === 'archive' ? 'pj.mode.archiveBody' : 'pj.mode.deleteBody')}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Text variant="caption" muted>{tr('pj.start.note')}</Text>
    </Screen>
  );
}
