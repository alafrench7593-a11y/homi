/**
 * Nouvelle mission. Modèles pré-remplis à formulation NEUTRE (« Acheter du lait avant 18 h »), destinataire proposé
 * par le domaine (la personne qui porte « courses » reçoit les missions de courses), produit associé ajouté à la liste
 * de courses à l'acceptation, enfant associé (périmètre de la nounou appliqué par le serveur), pièce jointe = document
 * du foyer. Le serveur valide tout (create_mission).
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, haptic, Segmented, Text } from '@/components/ui';
import { Cascade } from '@/motion';
import { DemoPerson } from '@/features/missions/DemoPerson';
import { parseFrDateTime } from '@/features/familyLoad';
import { useChildren, useDocuments } from '@/lib/data/hooks';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useDomains } from '@/lib/data/hooks-mental';
import { useCreateMission } from '@/lib/data/hooks-missions';
import { friendlyError } from '@/lib/data/hooks-settings';
import { CATEGORIES, type TaskCategory } from '@/lib/domain/familyLoad';
import { defaultRecipient, MISSION_DOMAIN_OF, MISSION_TEMPLATES, missionHref, type MissionTemplate } from '@/lib/domain/missions';
import { toFrDate } from '@/lib/validation';
import { todayISO } from '@/lib/domain/dates';
import { spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { uuid } from '@/lib/uuid';

const MISSION_CATEGORIES: TaskCategory[] = ['shopping', 'diapers', 'feeding', 'childcare', 'packing', 'pets', 'housework', 'admin', 'health', 'appointments', 'other'];
const AUTO = '__auto__';

interface Draft {
  template: string | null; title: string; notes: string; who: string; category: TaskCategory; date: string; time: string;
  priority: 'low' | 'normal' | 'high'; repeat: 'none' | 'daily' | 'weekly' | 'monthly'; product: string; child: string | null; doc: string | null;
}

const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return toFrDate(todayISO(d)); };

export default function NewMission() {
  const params = useLocalSearchParams<{ template?: string }>();
  const toast = useToast();
  const create = useCreateMission();
  const { people, me } = usePeople();
  const { data: children } = useChildren();
  const { data: domains } = useDomains();
  const { data: docs } = useDocuments();
  const others = people.filter((p) => p.id !== me);
  const [clientId] = useState(() => uuid()); // même envoi rejoué = même mission
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [d, setD] = useState<Draft>(() => fromTemplate(MISSION_TEMPLATES.find((x) => x.key === params.template) ?? null));

  function fromTemplate(tpl: MissionTemplate | null): Draft {
    return {
      template: tpl?.key ?? null, title: tpl ? tr(tpl.title) : '', notes: '', who: AUTO, category: tpl?.category ?? 'shopping',
      date: tpl?.time ? addDays(0) : '', time: tpl?.time ?? '', priority: 'normal', repeat: tpl?.recurrence?.type ?? 'none',
      product: tpl?.product ? tr(tpl.product) : '', child: null, doc: null,
    };
  }
  const pick = (tpl: MissionTemplate) => { haptic('selection'); setD((cur) => ({ ...fromTemplate(tpl), who: cur.who, child: tpl.child ? cur.child : null })); };

  const auto = useMemo(() => defaultRecipient(d.category, domains ?? [], me, people.map((p) => p.id)), [d.category, domains, me, people]);
  const domainKey = MISSION_DOMAIN_OF[d.category];
  const showProduct = d.category === 'shopping' || d.category === 'pets' || d.category === 'diapers' || !!d.product;

  async function submit() {
    const e: Record<string, string> = {};
    if (!d.title.trim()) e.title = tr('mis.form.titleRequired');
    const due = parseFrDateTime(d.date, d.time);
    if (due === undefined) e.date = tr('mis.form.dateInvalid');
    if (d.repeat !== 'none' && !due) e.date = tr('u6.fl.err_recurring');
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      const m = await create.mutateAsync({
        client_id: clientId, title: d.title.trim().slice(0, 120), notes: d.notes.trim() || null, assignee_id: d.who === AUTO ? null : d.who,
        category: d.category, due_at: due ?? null, all_day: !!due && !d.time.trim(), priority: d.priority,
        recurrence: d.repeat === 'none' ? null : { type: d.repeat }, child_id: d.child, product_label: showProduct ? d.product.trim() || null : null, document_id: d.doc,
      });
      haptic('success');
      toast(tr('mis.form.sent'));
      router.replace(missionHref(m.id) as never);
    } catch (err) { toast(friendlyError(err), 'error'); }
  }

  return (
    <Screen back title={tr('mis.new')} subtitle={tr('mis.sub')}>
      <DemoPerson />
      <Cascade index={0} style={{ gap: spacing.xs }}>
        <Text variant="heading" accessibilityRole="header">{tr('mis.form.templates')}</Text>
        <Text variant="small" muted>{tr('mis.form.templatesHint')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingRight: spacing.lg }}>
          {MISSION_TEMPLATES.map((tpl) => <Chip key={tpl.key} label={tr(tpl.title)} icon={tpl.icon} selected={d.template === tpl.key} onPress={() => pick(tpl)} testID={`mission-tpl-${tpl.key}`} />)}
        </ScrollView>
      </Cascade>

      <Cascade index={1}>
        <Card style={{ gap: spacing.sm }}>
          <Field label={tr('mis.form.title')} value={d.title} onChangeText={(v) => setD({ ...d, title: v, template: null })} error={errors.title} maxLength={120}
            placeholder={tr('mis.form.titlePh')} testID="mission-title" />
          <Text variant="label">{tr('mis.form.who')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <Chip label={tr('mis.form.whoAuto')} icon="user-check" selected={d.who === AUTO} onPress={() => setD({ ...d, who: AUTO })} testID="mission-who-auto" />
            {others.map((p) => <Chip key={p.id} label={p.label} selected={d.who === p.id} onPress={() => setD({ ...d, who: p.id })} testID={`mission-who-${p.role}`} />)}
          </View>
          {d.who === AUTO ? (
            <Text variant="caption" muted>
              {auto ? tr('mis.resp.owner', { person: people.find((p) => p.id === auto)?.label ?? '' }) : tr('mis.form.whoAutoHint')}
              {domainKey ? ` · ${tr('mis.detail.domain', { domain: tr(`cm.domain.${domainKey}` as TKey) })}` : ''}
            </Text>
          ) : null}
          <Text variant="label">{tr('mis.form.category')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {MISSION_CATEGORIES.map((c) => {
              const def = CATEGORIES.find((x) => x.value === c)!;
              return <Chip key={c} label={def.label} icon={def.icon} selected={d.category === c} onPress={() => setD({ ...d, category: c })} testID={`mission-cat-${c}`} />;
            })}
          </View>
        </Card>
      </Cascade>

      <Cascade index={2}>
        <Card style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <Chip label={tr('mis.form.today')} icon="sun" selected={d.date === addDays(0)} onPress={() => setD({ ...d, date: addDays(0) })} testID="mission-date-today" />
            <Chip label={tr('mis.form.tomorrow')} selected={d.date === addDays(1)} onPress={() => setD({ ...d, date: addDays(1) })} />
            <Chip label={tr('mis.form.noDate')} selected={!d.date} onPress={() => setD({ ...d, date: '', time: '', repeat: 'none' })} />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 3 }}><Field label={tr('mis.form.date')} optional value={d.date} onChangeText={(v) => setD({ ...d, date: v })} error={errors.date} keyboardType="numbers-and-punctuation" testID="mission-date" /></View>
            <View style={{ flex: 2 }}><Field label={tr('mis.form.time')} optional value={d.time} onChangeText={(v) => setD({ ...d, time: v })} keyboardType="numbers-and-punctuation" testID="mission-time" /></View>
          </View>
          <Text variant="label">{tr('mis.form.priority')}</Text>
          <Segmented label={tr('mis.form.priority')} value={d.priority} onChange={(v) => setD({ ...d, priority: v })}
            options={[{ value: 'low', label: tr('mis.form.priority.low') }, { value: 'normal', label: tr('mis.form.priority.normal') }, { value: 'high', label: tr('mis.form.priority.high') }]} />
          <Text variant="label">{tr('mis.form.repeat')}</Text>
          <Segmented label={tr('mis.form.repeat')} value={d.repeat} onChange={(v) => setD({ ...d, repeat: v })}
            options={[{ value: 'none', label: tr('mis.form.repeat.none') }, { value: 'daily', label: tr('mis.form.repeat.daily') }, { value: 'weekly', label: tr('mis.form.repeat.weekly') }, { value: 'monthly', label: tr('mis.form.repeat.monthly') }]} />
        </Card>
      </Cascade>

      <Cascade index={3}>
        <Card style={{ gap: spacing.sm }}>
          {showProduct ? (
            <Field label={tr('mis.form.product')} optional value={d.product} onChangeText={(v) => setD({ ...d, product: v })} maxLength={120} hint={tr('mis.form.productHint')} testID="mission-product" />
          ) : null}
          {children?.length ? (
            <>
              <Text variant="label">{tr('mis.form.child')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <Chip label={tr('mis.form.none')} selected={!d.child} onPress={() => setD({ ...d, child: null })} />
                {children.filter((c) => !c.archived).map((c) => <Chip key={c.id} label={c.first_name} selected={d.child === c.id} onPress={() => setD({ ...d, child: c.id })} />)}
              </View>
            </>
          ) : null}
          {d.category === 'pets' ? <Text variant="caption" muted>{tr('mis.form.pet')}</Text> : null}
          {docs?.length ? (
            <>
              <Text variant="label">{tr('mis.form.attach')}</Text>
              <Text variant="caption" muted>{tr('mis.form.attachHint')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <Chip label={tr('mis.form.none')} selected={!d.doc} onPress={() => setD({ ...d, doc: null })} />
                {docs.slice(0, 6).map((x) => <Chip key={x.id} label={x.title} icon="paperclip" selected={d.doc === x.id} onPress={() => setD({ ...d, doc: x.id })} />)}
              </View>
            </>
          ) : null}
          <Field label={tr('mis.form.desc')} optional multiline value={d.notes} onChangeText={(v) => setD({ ...d, notes: v })} maxLength={1000} testID="mission-notes" />
        </Card>
      </Cascade>

      {others.length === 0 && !auto ? <Banner tone="info" icon="user-plus">{tr('mis.form.alone')}</Banner> : null}
      <Button label={tr('mis.form.send')} icon="send" full onPress={submit} loading={create.isPending} testID="mission-send" />
    </Screen>
  );
}
