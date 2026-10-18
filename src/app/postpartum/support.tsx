/**
 * Mon plan de soutien : à préparer avant ou après la naissance.
 * Contacts de confiance, professionnels, besoins de repos, tâches à confier, questions pour la consultation,
 * rendez-vous et démarches. Tout est privé ; rien n'est envoyé à personne.
 */
import React, { useState } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
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
    if (!draft.name.trim()) e.name = 'Indiquez un nom.';
    if (draft.phone.trim() && !PHONE_RE.test(draft.phone.trim())) e.phone = 'Numéro non reconnu.';
    if (draft.email.trim() && !EMAIL_RE.test(draft.email.trim())) e.email = 'Adresse e-mail non reconnue.';
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      await saveContact.mutateAsync({ id: draft.id, input: { kind: draft.kind, name: draft.name.trim(), relation: draft.relation.trim() || null, phone: draft.phone.trim() || null, email: draft.email.trim() || null, note: draft.note.trim() || null } });
      toast(draft.id ? 'Contact modifié.' : 'Contact ajouté.');
      setDraft(null);
    } catch (err) { toast(friendlyError(err), 'error'); }
  }

  async function removeContact(c: TrustedContact) {
    if (!(await confirm('Retirer ce contact ?', `${c.name} sera retiré de votre plan.`, 'Retirer'))) return;
    try { await delContact.mutateAsync(c.id); toast('Contact retiré.'); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  async function noteAction() {
    try {
      await addAction.mutateAsync({ kind: actionKind, note: actionNote.trim() || null, done_on: todayISO() });
      setActionNote('');
      toast('Noté dans votre historique.');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  const contacts = contactsQ.data ?? [];
  const renderContacts = (kind: 'trusted' | 'professional') => {
    const list = contacts.filter((c) => c.kind === kind);
    return (
      <Card>
        {list.length === 0 ? <Text variant="small" muted>{kind === 'trusted' ? 'Personne pour l’instant. Pensez à quelqu’un que vous pourriez appeler, même tard.' : 'Votre sage-femme, votre médecin, la PMI, un psychologue…'}</Text> : null}
        {list.map((c) => (
          <ListRow
            key={c.id}
            icon={kind === 'trusted' ? 'user' : 'briefcase'}
            title={c.name}
            subtitle={[c.relation, c.phone, c.email].filter(Boolean).join(' · ') || undefined}
            onPress={() => setDraft({ id: c.id, kind: c.kind, name: c.name, relation: c.relation ?? '', phone: c.phone ?? '', email: c.email ?? '', note: c.note ?? '' })}
            right={(
              <Row gap={2}>
                {c.phone ? <IconButton icon="phone" label={`Appeler ${c.name}`} onPress={() => void Linking.openURL(`tel:${c.phone!.replace(/[^0-9+]/g, '')}`).catch(() => toast('Appel impossible ici.', 'error'))} /> : null}
                {c.email ? <IconButton icon="mail" label={`Écrire à ${c.name}`} onPress={() => void Linking.openURL(`mailto:${c.email}`).catch(() => toast('Messagerie indisponible.', 'error'))} /> : null}
                <IconButton icon="trash-2" label={`Retirer ${c.name}`} onPress={() => removeContact(c)} />
              </Row>
            )}
          />
        ))}
        <Button label={kind === 'trusted' ? 'Ajouter une personne de confiance' : 'Ajouter un professionnel'} icon="plus" size="sm" variant="secondary" style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} onPress={() => { setErrors({}); setDraft({ kind, name: '', relation: '', phone: '', email: '', note: '' }); }} />
      </Card>
    );
  };

  return (
    <Screen back title="Mon plan de soutien" subtitle="À préparer avant ou après la naissance. Privé.">
      <Banner tone="info">{'Ce plan vous sert à vous. Rien n’est envoyé à personne : c’est vous qui appelez, écrivez ou partagez si vous le souhaitez.'}</Banner>

      <SectionTitle title="Mes personnes de confiance" />
      {contactsQ.isLoading && !contactsQ.data ? <Skeleton rows={1} /> : renderContacts('trusted')}

      <SectionTitle title="Mes professionnels" />
      {contactsQ.isLoading && !contactsQ.data ? <Skeleton rows={1} /> : renderContacts('professional')}

      <SectionTitle title="Mes besoins de repos" />
      <Card>
        <Row wrap>{[...new Set([...PLAN_REST_IDEAS, ...rest])].map((x) => <Chip key={x} label={x} selected={rest.includes(x)} onPress={() => patch({ plan_rest_needs: toggleIn(rest, x) })} />)}</Row>
        <Row style={{ marginTop: spacing.sm }}>
          <View style={{ flex: 1 }}><Field label="Autre besoin" optional value={customRest} onChangeText={setCustomRest} maxLength={80} /></View>
          <Button label="Ajouter" size="sm" variant="secondary" disabled={!customRest.trim() || rest.length >= 12} style={{ alignSelf: 'flex-end' }} onPress={() => { void patch({ plan_rest_needs: [...rest, customRest.trim()] }); setCustomRest(''); }} />
        </Row>
      </Card>

      <SectionTitle title="Ce que d’autres peuvent prendre en charge" />
      <Card>
        <Row wrap>{[...new Set([...PLAN_TASK_IDEAS, ...tasks])].map((x) => <Chip key={x} label={x} selected={tasks.includes(x)} onPress={() => patch({ plan_tasks_to_delegate: toggleIn(tasks, x) })} />)}</Row>
        <Row style={{ marginTop: spacing.sm }}>
          <View style={{ flex: 1 }}><Field label="Autre tâche" optional value={customTask} onChangeText={setCustomTask} maxLength={80} /></View>
          <Button label="Ajouter" size="sm" variant="secondary" disabled={!customTask.trim() || tasks.length >= 20} style={{ alignSelf: 'flex-end' }} onPress={() => { void patch({ plan_tasks_to_delegate: [...tasks, customTask.trim()] }); setCustomTask(''); }} />
        </Row>
        <Text variant="caption" muted style={{ marginTop: 6 }}>Vous pourrez montrer cette liste à votre entourage, ou la partager depuis « Ce que je partage ».</Text>
      </Card>

      <Field
        label="Mes notes pour ce plan"
        optional
        multiline
        maxLength={2000}
        value={notes ?? settings?.plan_notes ?? ''}
        onChangeText={setNotes}
        onBlur={() => { if (notes != null && notes !== (settings?.plan_notes ?? '')) void patch({ plan_notes: notes.trim() || null }, 'Notes enregistrées.'); }}
        style={{ minHeight: 80, textAlignVertical: 'top' }}
      />

      <SectionTitle title="Mes rendez-vous" action="Ajouter" onAction={() => router.push('/appointments?new=postnatal' as never)} />
      <Card>
        {myAppointments.length === 0 ? <Text variant="small" muted>Aucun rendez-vous à venir pour vous. L’entretien postnatal précoce a lieu entre la 4e et la 8e semaine après l’accouchement.</Text> : null}
        {myAppointments.slice(0, 5).map((a) => (
          <ListRow key={a.id} icon={a.private_to_creator ? 'lock' : 'calendar'} title={a.title} subtitle={`${new Date(a.starts_at).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}${a.private_to_creator ? ' · privé' : ''}`} onPress={() => router.push('/appointments')} />
        ))}
      </Card>

      <SectionTitle title="Mes questions pour la consultation" />
      <ConsultationChecklist journey="postpartum" />

      <SectionTitle title="Noter une démarche" />
      <Card>
        <Text variant="small" muted>Seulement ce que vous avez fait vous-même : l’application ne note jamais un rendez-vous à votre place.</Text>
        <Row wrap style={{ marginTop: spacing.sm }}>{ACTION_KINDS.map((k) => <Chip key={k.value} label={k.label} selected={actionKind === k.value} onPress={() => setActionKind(k.value)} />)}</Row>
        <Field label="Précision" optional value={actionNote} onChangeText={setActionNote} maxLength={500} style={{ marginTop: spacing.sm }} />
        <Button label="Noter" size="sm" style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} onPress={noteAction} loading={addAction.isPending} />
      </Card>

      <Sheet visible={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Modifier le contact' : draft?.kind === 'professional' ? 'Nouveau professionnel' : 'Nouvelle personne de confiance'}>
        {draft ? (
          <View style={{ gap: spacing.sm }}>
            <Segmented label="Type de contact" value={draft.kind} onChange={(k) => setDraft({ ...draft, kind: k })} options={[{ value: 'trusted', label: 'Personne de confiance' }, { value: 'professional', label: 'Professionnel' }]} />
            <Field label="Nom" value={draft.name} onChangeText={(v) => setDraft({ ...draft, name: v })} error={errors.name} maxLength={80} />
            <Field label={draft.kind === 'professional' ? 'Fonction' : 'Lien'} optional value={draft.relation} onChangeText={(v) => setDraft({ ...draft, relation: v })} maxLength={80} placeholder={draft.kind === 'professional' ? 'Sage-femme, médecin, PMI…' : 'Ma sœur, une amie…'} />
            <Field label="Téléphone" optional value={draft.phone} onChangeText={(v) => setDraft({ ...draft, phone: v })} error={errors.phone} keyboardType="phone-pad" maxLength={30} />
            <Field label="E-mail" optional value={draft.email} onChangeText={(v) => setDraft({ ...draft, email: v })} error={errors.email} keyboardType="email-address" autoCapitalize="none" maxLength={200} />
            <Field label="Note" optional value={draft.note} onChangeText={(v) => setDraft({ ...draft, note: v })} maxLength={500} />
            <Button label={draft.id ? 'Enregistrer' : 'Ajouter'} full onPress={submitContact} loading={saveContact.isPending} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}
