/**
 * Nouvelle mission — en 3 étapes (refonte 16/11/2026) : 1. Quoi (modèles NEUTRES, titre, catégorie) ;
 * 2. Qui et quand (sélecteur de membre avatar + prénom — ou le responsable du domaine —, date, heure, priorité,
 * répétition) ; 3. Détails et envoi (produit, enfant, pièce jointe, précisions, récapitulatif).
 *  - Progression discrète (3 segments) qui avance avec le geste ; transition entre étapes (glissement 12 px + fondu,
 *    280 ms `decelerate` ; nuit : fondu court ; Réduire les animations : changement immédiat).
 *  - Le retour (bouton « Précédent », flèche de l'en-tête, retour Android) revient à l'étape précédente SANS perdre la
 *    saisie (un seul brouillon pour les trois étapes) ; la flèche ne quitte l'écran qu'à la première étape.
 *  - Bouton principal dans le pied d'écran : reste visible clavier ouvert.
 *  - Envoi : le serveur valide tout (create_mission, client_id stable : un nouvel essai ne crée jamais de doublon) ;
 *    « Mission envoyée » seulement après sa réponse, puis ouverture du détail.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Chip, Field, haptic, Segmented, Text } from '@/components/ui';
import { useMotion } from '@/motion';
import { MemberSelector, SmokedSurface, type MemberOption } from '@/features/scene';
import { DemoPerson } from '@/features/missions/DemoPerson';
import { missionWhen } from '@/features/missions/MissionCard';
import { parseFrDateTime } from '@/features/familyLoad';
import { useChildren, useDocuments } from '@/lib/data/hooks';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useDomains } from '@/lib/data/hooks-mental';
import { useCreateMission } from '@/lib/data/hooks-missions';
import { friendlyError } from '@/lib/data/hooks-settings';
import { CATEGORIES, categoryOf, type TaskCategory } from '@/lib/domain/familyLoad';
import { defaultRecipient, MISSION_DOMAIN_OF, MISSION_TEMPLATES, missionHref, type MissionTemplate } from '@/lib/domain/missions';
import { toFrDate } from '@/lib/validation';
import { todayISO } from '@/lib/domain/dates';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { uuid } from '@/lib/uuid';

const MISSION_CATEGORIES: TaskCategory[] = ['shopping', 'diapers', 'feeding', 'childcare', 'packing', 'pets', 'housework', 'admin', 'health', 'appointments', 'other'];
const AUTO = '__auto__';
const STEPS: TKey[] = ['mis.step.what', 'mis.step.who', 'mis.step.details'];

interface Draft {
  template: string | null; title: string; notes: string; who: string; category: TaskCategory; date: string; time: string;
  priority: 'low' | 'normal' | 'high'; repeat: 'none' | 'daily' | 'weekly' | 'monthly'; product: string; child: string | null; doc: string | null;
}

const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return toFrDate(todayISO(d)); };

function fromTemplate(tpl: MissionTemplate | null): Draft {
  return {
    template: tpl?.key ?? null, title: tpl ? tr(tpl.title) : '', notes: '', who: AUTO, category: tpl?.category ?? 'shopping',
    date: tpl?.time ? addDays(0) : '', time: tpl?.time ?? '', priority: 'normal', repeat: tpl?.recurrence?.type ?? 'none',
    product: tpl?.product ? tr(tpl.product) : '', child: null, doc: null,
  };
}

export default function NewMission() {
  const params = useLocalSearchParams<{ template?: string }>();
  const t = useTheme();
  const m = useMotion();
  const toast = useToast();
  const navigation = useNavigation();
  const create = useCreateMission();
  const { people, me } = usePeople();
  const { data: children } = useChildren();
  const { data: domains } = useDomains();
  const { data: docs } = useDocuments();
  const others = people.filter((p) => p.id !== me);
  const [clientId] = useState(() => uuid()); // même envoi rejoué = même mission
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [d, setD] = useState<Draft>(() => fromTemplate(MISSION_TEMPLATES.find((x) => x.key === params.template) ?? null));
  const [step, setStep] = useState(0);
  const leaving = useRef(false);

  const pick = (tpl: MissionTemplate) => { haptic('selection'); setD((cur) => ({ ...fromTemplate(tpl), who: cur.who, child: tpl.child ? cur.child : null })); };
  const auto = useMemo(() => defaultRecipient(d.category, domains ?? [], me, people.map((p) => p.id)), [d.category, domains, me, people]);
  const autoPerson = people.find((p) => p.id === auto);
  const domainKey = MISSION_DOMAIN_OF[d.category];
  const showProduct = d.category === 'shopping' || d.category === 'pets' || d.category === 'diapers' || !!d.product;

  // Transition entre étapes + progression
  const enter = useSharedValue(1);
  const dir = useRef(1);
  const progress = useSharedValue((step + 1) / STEPS.length);
  useEffect(() => {
    progress.value = m.timing((step + 1) / STEPS.length, 280, 'decelerate');
    if (m.off) { enter.value = 1; return; }
    enter.value = 0;
    enter.value = m.minimal ? m.timing(1, 160, 'standard') : m.timing(1, 280, 'decelerate');
  }, [step, m, enter, progress]);
  const stepStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, 0.2 + enter.value), transform: m.level === 'full' ? [{ translateX: (1 - enter.value) * 12 * dir.current }] : [] }));
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  // Retour (flèche de l'en-tête, retour Android) : étape précédente, saisie conservée
  useEffect(() => navigation.addListener('beforeRemove', (e) => {
    if (leaving.current || step === 0) return;
    e.preventDefault();
    dir.current = -1;
    setStep((s) => Math.max(0, s - 1));
  }), [navigation, step]);

  function check(s: number): Record<string, string> {
    const e: Record<string, string> = {};
    if (s >= 0 && !d.title.trim()) e.title = tr('mis.form.titleRequired');
    if (s >= 1) {
      const due = parseFrDateTime(d.date, d.time);
      if (due === undefined) e.date = tr('mis.form.dateInvalid');
      if (d.repeat !== 'none' && !due) e.date = tr('u6.fl.err_recurring');
    }
    return e;
  }
  function next() {
    const e = check(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    haptic('selection');
    dir.current = 1;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }
  function back() { dir.current = -1; setErrors({}); setStep((s) => Math.max(0, s - 1)); }

  async function submit() {
    const e = check(2);
    setErrors(e);
    if (e.title) { dir.current = -1; setStep(0); return; }
    if (e.date) { dir.current = -1; setStep(1); return; }
    const due = parseFrDateTime(d.date, d.time);
    try {
      const out = await create.mutateAsync({
        client_id: clientId, title: d.title.trim().slice(0, 120), notes: d.notes.trim() || null, assignee_id: d.who === AUTO ? null : d.who,
        category: d.category, due_at: due ?? null, all_day: !!due && !d.time.trim(), priority: d.priority,
        recurrence: d.repeat === 'none' ? null : { type: d.repeat }, child_id: d.child, product_label: showProduct ? d.product.trim() || null : null, document_id: d.doc,
      });
      // Confirmation APRÈS la réponse du serveur (la mission existe)
      haptic('success');
      toast(tr('mis.form.sent'));
      leaving.current = true;
      router.replace(missionHref(out.id) as never);
    } catch (err) { toast(friendlyError(err), 'error'); }
  }

  const whoOptions: MemberOption[] = [
    { value: AUTO, label: tr('mis.form.whoAuto'), icon: 'user-check', hint: autoPerson ? tr('mis.resp.owner', { person: autoPerson.name }) : tr('mis.form.whoAutoHint'), testID: 'mission-who-auto' },
    ...others.map((p) => ({ value: p.id, label: p.name, avatarPath: p.avatarPath, initial: p.initial, testID: `mission-who-${p.role}` })),
  ];
  const recipientName = d.who === AUTO ? (autoPerson?.name ?? tr('mis.open')) : people.find((p) => p.id === d.who)?.name ?? '';
  const due = parseFrDateTime(d.date, d.time);

  const footer = (
    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
      {step > 0 ? <Button label={tr('mis.step.back')} variant="secondary" onPress={back} testID="mission-prev" /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        {step < STEPS.length - 1
          ? <Button label={tr('mis.step.next')} iconRight="arrow-right" full onPress={next} testID="mission-next" />
          : <Button label={tr('mis.step.send')} icon="send" full onPress={submit} accessibilityLabel={tr('mis.form.send')} loading={create.isPending} testID="mission-send" />}
      </View>
    </View>
  );

  return (
    <Screen back title={tr('mis.new')} subtitle={tr(STEPS[step])} footer={footer}>
      <DemoPerson />
      {/* Progression discrète */}
      <View accessible accessibilityRole="progressbar" accessibilityLabel={tr('mis.step.of', { n: step + 1, total: STEPS.length, name: tr(STEPS[step]) })}
        accessibilityValue={{ min: 1, max: STEPS.length, now: step + 1 }} testID="mission-progress" style={{ gap: 6 }}>
        <Text variant="caption" weight="bold" muted>{tr('mis.step.of', { n: step + 1, total: STEPS.length, name: tr(STEPS[step]) })}</Text>
        <View style={{ height: 4, borderRadius: radius.pill, backgroundColor: t.material.lines.track, overflow: 'hidden' }}>
          <Animated.View style={[{ height: 4, borderRadius: radius.pill, backgroundColor: t.colors.primary }, barStyle]} />
        </View>
      </View>

      <Animated.View key={step} style={[{ gap: spacing.md }, stepStyle]} testID={`mission-step-${step}`}>
        {step === 0 ? (
          <>
            <View style={{ gap: spacing.xs }}>
              <Text variant="heading" accessibilityRole="header">{tr('mis.form.templates')}</Text>
              <Text variant="small" muted>{tr('mis.form.templatesHint')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingRight: spacing.lg }}>
                {MISSION_TEMPLATES.map((tpl) => <Chip key={tpl.key} label={tr(tpl.title)} icon={tpl.icon} selected={d.template === tpl.key} onPress={() => pick(tpl)} testID={`mission-tpl-${tpl.key}`} />)}
              </ScrollView>
            </View>
            <Field label={tr('mis.form.title')} value={d.title} onChangeText={(v) => setD({ ...d, title: v, template: null })} error={errors.title} maxLength={120}
              placeholder={tr('mis.form.titlePh')} testID="mission-title" returnKeyType="next" onSubmitEditing={next} />
            <View style={{ gap: spacing.xs }}>
              <Text variant="label">{tr('mis.form.category')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {MISSION_CATEGORIES.map((c) => {
                  const def = CATEGORIES.find((x) => x.value === c)!;
                  return <Chip key={c} label={def.label} icon={def.icon} selected={d.category === c} onPress={() => setD({ ...d, category: c })} testID={`mission-cat-${c}`} />;
                })}
              </View>
            </View>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <View style={{ gap: spacing.xs }}>
              <Text variant="label">{tr('mis.form.who')}</Text>
              <MemberSelector label={tr('mis.form.who')} options={whoOptions} value={d.who} onChange={(v) => setD({ ...d, who: v })} testID="mission-who" />
              <Text variant="caption" muted>
                {d.who === AUTO ? (auto ? tr('mis.resp.owner', { person: autoPerson?.name ?? '' }) : tr('mis.form.whoAutoHint')) : tr('mis.form.whoDirect', { person: recipientName })}
                {domainKey ? ` · ${tr('mis.detail.domain', { domain: tr(`cm.domain.${domainKey}` as TKey) })}` : ''}
              </Text>
            </View>
            <View style={{ gap: spacing.xs }}>
              <Text variant="label">{tr('mis.form.when')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <Chip label={tr('mis.form.today')} icon="sun" selected={d.date === addDays(0)} onPress={() => setD({ ...d, date: addDays(0) })} testID="mission-date-today" />
                <Chip label={tr('mis.form.tomorrow')} selected={d.date === addDays(1)} onPress={() => setD({ ...d, date: addDays(1) })} testID="mission-date-tomorrow" />
                <Chip label={tr('mis.form.noDate')} selected={!d.date} onPress={() => setD({ ...d, date: '', time: '', repeat: 'none' })} testID="mission-date-none" />
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                <View style={{ flex: 3, minWidth: 140 }}><Field label={tr('mis.form.date')} optional value={d.date} onChangeText={(v) => setD({ ...d, date: v })} error={errors.date} keyboardType="numbers-and-punctuation" testID="mission-date" /></View>
                <View style={{ flex: 2, minWidth: 100 }}><Field label={tr('mis.form.time')} optional value={d.time} onChangeText={(v) => setD({ ...d, time: v })} keyboardType="numbers-and-punctuation" testID="mission-time" /></View>
              </View>
            </View>
            <View style={{ gap: spacing.xs }}>
              <Text variant="label">{tr('mis.form.priority')}</Text>
              <Segmented label={tr('mis.form.priority')} value={d.priority} onChange={(v) => setD({ ...d, priority: v })}
                options={[{ value: 'low', label: tr('mis.form.priority.low') }, { value: 'normal', label: tr('mis.form.priority.normal') }, { value: 'high', label: tr('mis.form.priority.high') }]} />
            </View>
            <View style={{ gap: spacing.xs }}>
              <Text variant="label">{tr('mis.form.repeat')}</Text>
              <Segmented label={tr('mis.form.repeat')} value={d.repeat} onChange={(v) => setD({ ...d, repeat: v })}
                options={[{ value: 'none', label: tr('mis.form.repeat.none') }, { value: 'daily', label: tr('mis.form.repeat.daily') }, { value: 'weekly', label: tr('mis.form.repeat.weekly') }, { value: 'monthly', label: tr('mis.form.repeat.monthly') }]} />
            </View>
            {others.length === 0 && !auto ? <Banner tone="info" icon="user-plus">{tr('mis.form.alone')}</Banner> : null}
          </>
        ) : null}

        {step === 2 ? (
          <>
            {showProduct ? (
              <Field label={tr('mis.form.product')} optional value={d.product} onChangeText={(v) => setD({ ...d, product: v })} maxLength={120} hint={tr('mis.form.productHint')} testID="mission-product" />
            ) : null}
            {children?.length ? (
              <View style={{ gap: spacing.xs }}>
                <Text variant="label">{tr('mis.form.child')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  <Chip label={tr('mis.form.none')} selected={!d.child} onPress={() => setD({ ...d, child: null })} />
                  {children.filter((c) => !c.archived).map((c) => <Chip key={c.id} label={c.first_name} selected={d.child === c.id} onPress={() => setD({ ...d, child: c.id })} />)}
                </View>
              </View>
            ) : null}
            {d.category === 'pets' ? <Text variant="caption" muted>{tr('mis.form.pet')}</Text> : null}
            {docs?.length ? (
              <View style={{ gap: spacing.xs }}>
                <Text variant="label">{tr('mis.form.attach')}</Text>
                <Text variant="caption" muted>{tr('mis.form.attachHint')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  <Chip label={tr('mis.form.none')} selected={!d.doc} onPress={() => setD({ ...d, doc: null })} />
                  {docs.slice(0, 6).map((x) => <Chip key={x.id} label={x.title} icon="paperclip" selected={d.doc === x.id} onPress={() => setD({ ...d, doc: x.id })} />)}
                </View>
              </View>
            ) : null}
            <Field label={tr('mis.form.desc')} optional multiline value={d.notes} onChangeText={(v) => setD({ ...d, notes: v })} maxLength={1000} testID="mission-notes" />
            {/* Récapitulatif avant l'envoi */}
            <SmokedSurface testID="mission-recap" style={{ gap: 4 }}>
              <Text variant="caption" weight="bold" muted accessibilityRole="header">{tr('mis.form.recap')}</Text>
              <Text weight="bold">{d.title.trim()}</Text>
              <Text variant="small">{[tr('mis.to', { person: recipientName }), categoryOf(d.category).label].join(' · ')}</Text>
              <Text variant="small" muted>{due ? missionWhen({ due_at: due, all_day: !d.time.trim() }) : tr('mis.noDue')}</Text>
            </SmokedSurface>
          </>
        ) : null}
      </Animated.View>
    </Screen>
  );
}
