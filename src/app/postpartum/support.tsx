/**
 * Mon plan de soutien : à préparer avant ou après la naissance.
 * Contacts de confiance, professionnels, besoins de repos, tâches à confier, questions pour la consultation,
 * rendez-vous et démarches. Tout est privé ; rien n'est envoyé à personne.
 */
import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { Skeleton } from '@/components/States';
import { ConsultationChecklist } from '@/components/Fertility';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, IconButton, ListRow, Row, SectionTitle, Segmented, Text } from '@/components/ui';
import {
  useAddAction, useDeleteContact, usePostpartumSettings, useSaveContact, useSaveSettings, useTrustedContacts, type TrustedContact,
} from '@/lib/data/hooks-postpartum';
import { useAppointments } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { ACTION_KINDS, PLAN_REST_IDEAS, PLAN_TASK_IDEAS } from '@/lib/domain/postpartum';
import { todayISO } from '@/lib/domain/dates';
import { spacing } from '@/theme/tokens';
import { localeTag, t as tr } from '@/i18n';

type ContactDraft = { id?: string; kind: 'trusted' | 'professional'; name: string; relation: string; phone: string; email: string; note: string };
const PHONE_RE = /^[0-9+ ().-]{2,30}$/;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function PostpartumSupport() {
  const toast = useToast();
  const settingsQ = usePostpartumSettings();
  const settings = settingsQ.data;
  const saveSettings = useSaveSettings();
  const contactsQ = useTrustedContacts();
  const saveContact = useSaveContact();
  const delContact = useDeleteContact();
  const addAction = useAddAction();
  const { data: appointments } = useAppointments({ upcomingOnly: true });
  const [draft, setDraft] = useState<ContactDraft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customRest, setCustomRest] = useState('');
  const [customTask, setCustomTask] = useState('');
  const [notes, setNotes] = useState<string | null>(null);
  const [actionKind, setActionKind] = useState<(typeof ACTION_KINDS)[number]['value']>('appointment_booked');
  const [actionNote, setActionNote] = useState('');

  const rest = settings?.plan_rest_needs ?? [];
  const tasks = settings?.plan_tasks_to_delegate ?? [];
  const myAppointments = (appointments ?? []).filter((a) => a.for_parent);

  async function patch(p: Parameters<typeof saveSettings.mutateAsync>[0]['patch'], msg?: string) {
    try { await saveSettings.mutateAsync({ existing: !!settings, patch: p }); if (msg) toast(msg); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  const toggleIn = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  async function submitContact() {
    if (!draft) return;
    const e: Record<string, string> = {};
    if (!draft.name.trim()) e.name = tr('u5.pp_support.e_name');
    if (draft.phone.trim() && !PHONE_RE.test(draft.phone.trim())) e.phone = tr('u5.pp_support.e_phone');
    if (draft.email.trim() && !EMAIL_RE.test(draft.email.trim())) e.email = tr('u5.pp_support.e_email');
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      await saveContact.mutateAsync({ id: draft.id, input: { kind: draft.kind, name: draft.name.trim(), relation: draft.relation.trim() || null, phone: draft.phone.trim() || null, email: draft.email.trim() || null, note: draft.note.trim() || null } });
      toast(draft.id ? tr('u5.pp_support.c_edited') : tr('u5.pp_support.c_added'));
      setDraft(null);
    } catch (err) { toast(friendlyError(err), 'error'); }
  }

  async function removeContact(c: TrustedContact) {
    if (!(await confirm(tr('u5.pp_support.rm_t'), tr('u5.pp_support.rm_b', { name: c.name }), tr('u5.pp_support.rm_ok')))) return;
    try { await delContact.mutateAsync(c.id); toast(tr('u5.pp_support.c_removed')); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  async function noteAction() {
    try {
      await addAction.mutateAsync({ kind: actionKind, note: actionNote.trim() || null, done_on: todayISO() });
      setActionNote('');
      toast(tr('u5.pp_support.noted'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  const contacts = contactsQ.data ?? [];
  const renderContacts = (kind: 'trusted' | 'professional') => {
    const list = contacts.filter((c) => c.kind === kind);
    return (
      <Card>
        {list.length === 0 ? <Text variant="small" muted>{kind === 'trusted' ? tr('u5.pp_support.empty_t') : tr('u5.pp_support.empty_p')}</Text> : null}
        {list.map((c) => (
          <ListRow
            key={c.id}
            icon={kind === 'trusted' ? 'user' : 'briefcase'}
            title={c.name}
            subtitle={[c.relation, c.phone, c.email].filter(Boolean).join(' · ') || undefined}
            onPress={() => setDraft({ id: c.id, kind: c.kind, name: c.name, relation: c.relation ?? '', phone: c.phone ?? '', email: c.email ?? '', note: c.note ?? '' })}
            right={(
              <Row gap={2}>
                {c.phone ? <IconButton icon="phone" label={tr('u5.pp_support.call', { name: c.name })} onPress={() => void Linking.openURL(`tel:${c.phone!.replace(/[^0-9+]/g, '')}`).catch(() => toast(tr('u5.pp_support.call_fail'), 'error'))} /> : null}
                {c.email ? <IconButton icon="mail" label={tr('u5.pp_support.write', { name: c.name })} onPress={() => void Linking.openURL(`mailto:${c.email}`).catch(() => toast(tr('u5.pp_support.mail_fail'), 'error'))} /> : null}
                <IconButton icon="trash-2" label={tr('u5.pp_support.remove', { name: c.name })} onPress={() => removeContact(c)} />
              </Row>
            )}
          />
        ))}
        <Button label={kind === 'trusted' ? tr('u5.pp_support.add_t') : tr('u5.pp_support.add_p')} icon="plus" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} onPress={() => { setErrors({}); setDraft({ kind, name: '', relation: '', phone: '', email: '', note: '' }); }} />
      </Card>
    );
  };

  return (
    <Screen back title={tr('u5.pp_home.l_plan')} subtitle={tr('u5.pp_support.subtitle')}
      action={{ label: tr('u5.pp_support.add_t'), icon: 'user-plus', onPress: () => { setErrors({}); setDraft({ kind: 'trusted', name: '', relation: '', phone: '', email: '', note: '' }); }, testID: 'pp-support-add' }}>
      <TodaySummary title={tr('u5.pp_support.my_plan')} items={[
        { icon: 'users', value: String(contacts.filter((c) => c.kind === 'trusted').length), label: tr('u5.pp_support.trusted') },
        { icon: 'briefcase', value: String(contacts.filter((c) => c.kind === 'professional').length), label: tr('u5.pp_support.pros') },
        { icon: 'calendar', value: String(myAppointments.length), label: tr('u5.pp_support.appts') },
      ]} />
      <Banner tone="info">{tr('u5.pp_support.banner')}</Banner>

      <SectionTitle title={tr('u5.pp_support.s_trusted')} />
      {contactsQ.isLoading && !contactsQ.data ? <Skeleton rows={1} /> : renderContacts('trusted')}

      <SectionTitle title={tr('u5.pp_support.s_pros')} />
      {contactsQ.isLoading && !contactsQ.data ? <Skeleton rows={1} /> : renderContacts('professional')}

      <SectionTitle title={tr('u5.pp_support.s_rest')} />
      <Card>
        <Row wrap>{[...new Set([...PLAN_REST_IDEAS, ...rest])].map((x) => <Chip key={x} label={x} selected={rest.includes(x)} onPress={() => patch({ plan_rest_needs: toggleIn(rest, x) })} />)}</Row>
        <Row style={{ marginTop: spacing.sm }}>
          <View style={{ flex: 1 }}><Field label={tr('u5.pp_support.other_need')} optional value={customRest} onChangeText={setCustomRest} maxLength={80} /></View>
          <Button label={tr('u5.pp_support.add')} size="sm" variant="secondary" disabled={!customRest.trim() || rest.length >= 12} style={{ alignSelf: 'flex-end' }} onPress={() => { void patch({ plan_rest_needs: [...rest, customRest.trim()] }); setCustomRest(''); }} />
        </Row>
      </Card>

      <SectionTitle title={tr('u5.pp_support.s_tasks')} />
      <Card>
        <Row wrap>{[...new Set([...PLAN_TASK_IDEAS, ...tasks])].map((x) => <Chip key={x} label={x} selected={tasks.includes(x)} onPress={() => patch({ plan_tasks_to_delegate: toggleIn(tasks, x) })} />)}</Row>
        <Row style={{ marginTop: spacing.sm }}>
          <View style={{ flex: 1 }}><Field label={tr('u5.pp_support.other_task')} optional value={customTask} onChangeText={setCustomTask} maxLength={80} /></View>
          <Button label={tr('u5.pp_support.add')} size="sm" variant="secondary" disabled={!customTask.trim() || tasks.length >= 20} style={{ alignSelf: 'flex-end' }} onPress={() => { void patch({ plan_tasks_to_delegate: [...tasks, customTask.trim()] }); setCustomTask(''); }} />
        </Row>
        <Text variant="caption" muted style={{ marginTop: 6 }}>{tr('u5.pp_support.tasks_note')}</Text>
      </Card>

      <Field
        label={tr('u5.pp_support.notes')}
        optional
        multiline
        maxLength={2000}
        value={notes ?? settings?.plan_notes ?? ''}
        onChangeText={setNotes}
        onBlur={() => { if (notes != null && notes !== (settings?.plan_notes ?? '')) void patch({ plan_notes: notes.trim() || null }, tr('u5.pp_support.notes_saved')); }}
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />

      <SectionTitle title={tr('u5.pp_support.s_appts')} action={tr('u5.pp_support.add')} onAction={() => router.push('/appointments?new=postnatal' as never)} />
      <Card>
        {myAppointments.length === 0 ? <Text variant="small" muted>{tr('u5.pp_support.no_appt')}</Text> : null}
        {myAppointments.slice(0, 5).map((a) => (
          <ListRow key={a.id} icon={a.private_to_creator ? 'lock' : 'calendar'} title={a.title} subtitle={`${new Date(a.starts_at).toLocaleString(localeTag(), { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}${a.private_to_creator ? ` · ${tr('u5.pp_support.private')}` : ''}`} onPress={() => router.push('/appointments')} />
        ))}
      </Card>

      <SectionTitle title={tr('u5.pp_support.s_q')} />
      <ConsultationChecklist journey="postpartum" />

      <SectionTitle title={tr('u5.pp_support.s_act')} />
      <Card>
        <Text variant="small" muted>{tr('u5.pp_support.act_note')}</Text>
        <Row wrap style={{ marginTop: spacing.sm }}>{ACTION_KINDS.map((k) => <Chip key={k.value} label={k.label} selected={actionKind === k.value} onPress={() => setActionKind(k.value)} />)}</Row>
        <Field label={tr('u5.pp_support.detail')} optional value={actionNote} onChangeText={setActionNote} maxLength={500} style={{ marginTop: spacing.sm }} />
        <Button label={tr('u5.pp_support.note')} size="sm" style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} onPress={noteAction} loading={addAction.isPending} />
      </Card>

      <Sheet visible={!!draft} onClose={() => setDraft(null)} title={draft?.id ? tr('u5.pp_support.sh_edit') : draft?.kind === 'professional' ? tr('u5.pp_support.sh_new_p') : tr('u5.pp_support.sh_new_t')}>
        {draft ? (
          <View style={{ gap: spacing.sm }}>
            <Segmented label={tr('u5.pp_support.type')} value={draft.kind} onChange={(k) => setDraft({ ...draft, kind: k })} options={[{ value: 'trusted', label: tr('u5.pp_support.o_trusted') }, { value: 'professional', label: tr('u5.pp_support.o_pro') }]} />
            <Field label={tr('u5.pp_support.name')} value={draft.name} onChangeText={(v) => setDraft({ ...draft, name: v })} error={errors.name} maxLength={80} />
            <Field label={draft.kind === 'professional' ? tr('u5.pp_support.role') : tr('u5.pp_support.link')} optional value={draft.relation} onChangeText={(v) => setDraft({ ...draft, relation: v })} maxLength={80} placeholder={draft.kind === 'professional' ? tr('u5.pp_support.ph_p') : tr('u5.pp_support.ph_t')} />
            <Field label={tr('u5.pp_support.phone')} optional value={draft.phone} onChangeText={(v) => setDraft({ ...draft, phone: v })} error={errors.phone} keyboardType="phone-pad" maxLength={30} />
            <Field label={tr('u5.pp_support.email')} optional value={draft.email} onChangeText={(v) => setDraft({ ...draft, email: v })} error={errors.email} keyboardType="email-address" autoCapitalize="none" maxLength={200} />
            <Field label={tr('u5.pp_support.note_f')} optional value={draft.note} onChangeText={(v) => setDraft({ ...draft, note: v })} maxLength={500} />
            <Button label={draft.id ? tr('u5.pp_checkin.save') : tr('u5.pp_support.add')} full onPress={submitContact} loading={saveContact.isPending} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
