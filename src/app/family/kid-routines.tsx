/**
 * Routines en pictogrammes pour l'enfant (3–10 ans) : « le matin », « le soir », « après l'école »… chaque étape
 * est un grand pictogramme que l'enfant coche lui-même sur le téléphone ou la tablette (mode enfant).
 * Les parents créent et modifient les routines ici ; les cases cochées du jour sont partagées dans le foyer.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { EmptyState } from '@/components/States';
import { Tappable } from '@/components/Tappable';
import { Banner, Button, Card, Chip, Field, IconButton, Loading, Row, SectionTitle, Text } from '@/components/ui';
import { backend, eq } from '@/lib/backend';
import { useChildren, useHouseholdId, useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useKidChecks, useKidRoutines, type KidMoment, type KidRoutine, type KidStep } from '@/lib/data/hooks-tools6';
import { todayISO } from '@/lib/domain/dates';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

/** Pictogrammes proposés (Material Community Icons, vérifiés dans la police embarquée). */
export const PICTOS = [
  'weather-sunny', 'toilet', 'hand-wash', 'food-croissant', 'toothbrush-paste', 'tshirt-crew', 'shoe-sneaker', 'coat-rack',
  'bag-personal', 'school', 'food-apple', 'cup-water', 'silverware-fork-knife', 'bathtub', 'shower', 'broom',
  'puzzle', 'music', 'television-off', 'book-open-variant', 'teddy-bear', 'hand-heart', 'bed', 'lightbulb-off',
] as const;

const MOMENTS: KidMoment[] = ['morning', 'evening', 'afterschool', 'weekend', 'custom'];
const TEMPLATES: Record<Exclude<KidMoment, 'custom' | 'weekend'>, string[]> = {
  morning: ['weather-sunny', 'toilet', 'food-croissant', 'toothbrush-paste', 'tshirt-crew', 'shoe-sneaker', 'bag-personal'],
  evening: ['silverware-fork-knife', 'bathtub', 'tshirt-crew', 'toothbrush-paste', 'toilet', 'book-open-variant', 'hand-heart', 'lightbulb-off'],
  afterschool: ['hand-wash', 'food-apple', 'school', 'puzzle', 'broom'],
};
const pictoLabel = (icon: string, moment: KidMoment) => {
  const k = `kr.p.${icon.replace(/-/g, '_')}${moment === 'evening' && icon === 'tshirt-crew' ? '.pj' : ''}` as TKey;
  return tr(k);
};

export function Picto({ name, size = 40, color }: { name: string; size?: number; color?: string }) {
  const t = useTheme();
  return <MaterialCommunityIcons name={name as never} size={size} color={color ?? t.colors.primary} />;
}

function RoutineEditor({ routine, visible, onClose }: { routine?: KidRoutine; visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const hid = useHouseholdId();
  const children = useChildren().data ?? [];
  const [title, setTitle] = useState('');
  const [moment, setMoment] = useState<KidMoment>('morning');
  const [childId, setChildId] = useState<string | null>(null);
  const [steps, setSteps] = useState<KidStep[]>([]);
  const [busy, setBusy] = useState(false);
  React.useEffect(() => {
    if (!visible) return;
    setTitle(routine?.title ?? ''); setMoment(routine?.moment ?? 'morning'); setChildId(routine?.child_id ?? null);
    setSteps(routine?.steps ?? TEMPLATES.morning.map((i) => ({ icon: i, label: pictoLabel(i, 'morning') })));
  }, [visible, routine]);
  function pickMoment(m: KidMoment) {
    setMoment(m);
    if (!routine && m in TEMPLATES) setSteps(TEMPLATES[m as keyof typeof TEMPLATES].map((i) => ({ icon: i, label: pictoLabel(i, m) })));
    else if (!routine && (m === 'custom' || m === 'weekend')) setSteps([]);
  }
  const move = (i: number, d: -1 | 1) => setSteps((s) => { const n = [...s]; const j = i + d; if (j < 0 || j >= n.length) return s; [n[i], n[j]] = [n[j], n[i]]; return n; });
  async function save() {
    const clean = steps.map((s) => ({ icon: s.icon, label: s.label.trim().slice(0, 40) })).filter((s) => s.label);
    if (!clean.length) return toast(tr('kr.errSteps'), 'error');
    if (!hid) return;
    setBusy(true);
    try {
      const row = { title: (title.trim() || tr(`kr.m.${moment}` as TKey)).slice(0, 60), moment, child_id: childId, steps: clean };
      if (routine) await backend.update('kid_routines', row, [eq('id', routine.id)]);
      else await backend.insert('kid_routines', { ...row, household_id: hid });
      inv('kid_routines');
      toast(tr('kr.saved'));
      onClose();
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  async function remove() {
    if (!routine || !(await confirm(tr('common.delete'), tr('kr.deleteQ'), tr('common.delete')))) return;
    try { await backend.remove('kid_routines', [eq('id', routine.id)]); inv('kid_routines', 'kid_routine_checks'); onClose(); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={routine ? tr('kr.edit') : tr('kr.new')}>
      <Text variant="label">{tr('kr.moment')}</Text>
      <Row wrap>{MOMENTS.map((m) => <Chip key={m} label={tr(`kr.m.${m}` as TKey)} selected={moment === m} onPress={() => pickMoment(m)} testID={`kr-moment-${m}`} />)}</Row>
      <Field label={tr('kr.title')} optional value={title} onChangeText={setTitle} maxLength={60} placeholder={tr(`kr.m.${moment}` as TKey)} />
      {children.length ? (
        <>
          <Text variant="label">{tr('kr.for')}</Text>
          <Row wrap>
            <Chip label={tr('kr.forAll')} selected={!childId} onPress={() => setChildId(null)} />
            {children.map((c) => <Chip key={c.id} label={c.first_name} selected={childId === c.id} onPress={() => setChildId(c.id)} />)}
          </Row>
        </>
      ) : null}
      <Text variant="label">{tr('kr.steps', { count: steps.length })}</Text>
      {steps.map((s, i) => (
        <View key={`${i}-${s.icon}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Picto name={s.icon} size={28} />
          <View style={{ flex: 1 }}><Field label={tr('kr.stepN', { n: i + 1 })} value={s.label} maxLength={40} onChangeText={(v) => setSteps((p) => p.map((x, j) => (j === i ? { ...x, label: v } : x)))} /></View>
          <IconButton icon="arrow-up" label={tr('kr.up')} onPress={() => move(i, -1)} disabled={i === 0} />
          <IconButton icon="x" label={tr('kr.removeStep')} onPress={() => setSteps((p) => p.filter((_, j) => j !== i))} />
        </View>
      ))}
      {steps.length < 15 ? (
        <>
          <Text variant="small" muted>{tr('kr.addPicto')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {PICTOS.map((p) => (
              <Tappable key={p} accessibilityRole="button" accessibilityLabel={tr(`kr.p.${p.replace(/-/g, '_')}` as TKey)} testID={`kr-add-${p}`}
                onPress={() => setSteps((s) => [...s, { icon: p, label: pictoLabel(p, moment) }])}
                style={({ pressed }) => ({ width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.surface, borderWidth: 0.5, borderColor: t.colors.border, opacity: pressed ? 0.7 : 1 })}>
                <Picto name={p} size={26} />
              </Tappable>
            ))}
          </View>
        </>
      ) : null}
      <Button label={tr('common.save')} loading={busy} onPress={() => void save()} testID="kr-save" />
      {routine ? <Button label={tr('common.delete')} variant="ghost" onPress={() => void remove()} /> : null}
    </Sheet>
  );
}

export default function KidRoutines() {
  const q = useKidRoutines();
  const checks = useKidChecks(todayISO()).data ?? [];
  const children = useChildren().data ?? [];
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<KidRoutine | undefined>();
  const list = q.data ?? [];
  return (
    <Screen back title={tr('tool.kid_routines')} subtitle={tr('tool.kid_routines.sub')}
      action={{ label: tr('kr.new'), icon: 'plus', onPress: () => { setEditing(undefined); setOpen(true); }, testID: 'kr-new' }}>
      <Text muted>{tr('kr.intro')}</Text>
      {q.isLoading ? <Loading /> : !list.length ? (
        <EmptyState icon="sun" title={tr('kr.none')} body={tr('kr.noneD')} action={{ label: tr('kr.new'), onPress: () => { setEditing(undefined); setOpen(true); } }} />
      ) : list.map((r) => {
        const done = checks.filter((c) => c.routine_id === r.id).length;
        const who = children.find((c) => c.id === r.child_id)?.first_name;
        return (
          <Card key={r.id} testID={`kr-routine-${r.id}`}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text weight="bold">{r.title}</Text>
                <Text variant="small" muted>{[who, tr('kr.progress', { done: Math.min(done, r.steps.length), total: r.steps.length })].filter(Boolean).join(' · ')}</Text>
              </View>
              <IconButton icon="edit-2" label={tr('kr.edit')} onPress={() => { setEditing(r); setOpen(true); }} />
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: spacing.xs }}>
              {r.steps.map((s, i) => <Picto key={i} name={s.icon} size={26} />)}
            </View>
            <Button label={tr('kr.kidMode')} icon="smile" onPress={() => router.push(`/family/kid-routine/${r.id}` as never)} testID={`kr-open-${r.id}`} />
          </Card>
        );
      })}
      <SectionTitle title={tr('kr.tips')} />
      <Banner tone="info" icon="heart">{tr('kr.tipsD')}</Banner>
      <RoutineEditor routine={editing} visible={open} onClose={() => setOpen(false)} />
    </Screen>
  );
}
