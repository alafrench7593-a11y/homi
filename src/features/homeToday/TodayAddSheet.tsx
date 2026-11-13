/**
 * « Ajouter pour aujourd'hui » : la SEULE entrée d'ajout de l'accueil (ouverte par le « + » de la barre d'onglets).
 *  - Tâche simple pour aujourd'hui (même insertion que la liste familiale : useSaveTask, file hors ligne comprise) ;
 *    qui s'en charge : sélecteur de membre (avatar + prénom, indicateur qui glisse) — moi, un autre membre, ou « à prendre » ;
 *  - « Confier une mission » ouvre la création de mission (étapes) ;
 *  - Autres ajouts rapides du profil (suivi, courses, scanner…), pour que le « + » de l'accueil n'en perde aucun.
 * Confirmation selon le résultat réel : « ajoutée » (envoyée) ou « enregistrée, envoyée au retour du réseau » (file).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Sheet, useToast } from '@/components/Overlays';
import { Button, Field, haptic, Text } from '@/components/ui';
import { QuickAddGrid } from '@/components/Dock';
import { MemberSelector, type MemberOption } from '@/features/scene';
import { usePeople, useSaveTask } from '@/lib/data/hooks-family-load';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useReduceMotion } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

const OPEN = '__open__';

export function TodayAddSheet({ visible, onClose, me, canEdit }: { visible: boolean; onClose: () => void; me: string | null | undefined; canEdit: boolean }) {
  const toast = useToast();
  const reduce = useReduceMotion();
  const save = useSaveTask();
  const { people } = usePeople();
  const [title, setTitle] = useState('');
  const [who, setWho] = useState<string>('me');
  const [error, setError] = useState<string | undefined>();

  const options: MemberOption[] = [
    { value: 'me', label: tr('ht.add.me'), avatarPath: people.find((p) => p.isMe)?.avatarPath ?? null, initial: people.find((p) => p.isMe)?.initial, testID: 'today-add-me' },
    ...people.filter((p) => !p.isMe).map((p) => ({ value: p.id, label: p.name, avatarPath: p.avatarPath, initial: p.initial, testID: `today-add-who-${p.role}` })),
    { value: OPEN, label: tr('ht.add.open'), icon: 'user-plus' as const, testID: 'today-add-open' },
  ];

  const close = () => { setTitle(''); setError(undefined); setWho('me'); onClose(); };
  async function add() {
    const v = title.trim();
    if (!v) { setError(tr('ht.add.needTitle')); return; }
    try {
      const assignee = who === OPEN ? null : who === 'me' ? me ?? null : who;
      const out = await save.mutateAsync({ input: { title: v.slice(0, 120), category: 'other', due_at: null, assignee_id: assignee, priority: 'normal', essential: false, recurrence: null, notes: null } });
      haptic('success');
      toast(out === 'queued' ? tr('ht.add.queued') : tr('u2.fam.added_today'));
      close();
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  const mission = () => { close(); setTimeout(() => router.push('/family/missions/new'), reduce ? 0 : 180); };

  return (
    <Sheet visible={visible} onClose={close} title={tr('ht.add.title')}>
      <View testID="today-add-sheet" style={{ gap: spacing.md }}>
        {canEdit ? (
          <>
            <Field label={tr('ht.add.taskLabel')} placeholder={tr('u2.fam.quick_ph')} value={title} onChangeText={(v) => { setTitle(v); if (error) setError(undefined); }}
              error={error} maxLength={120} returnKeyType="done" onSubmitEditing={() => void add()} autoFocus testID="today-add-title" />
            <View style={{ gap: spacing.xs }}>
              <Text variant="label">{tr('ht.add.who')}</Text>
              <MemberSelector label={tr('ht.add.who')} options={options} value={who} onChange={setWho} testID="today-add-who" />
            </View>
            <Button label={tr('ht.add.submit')} icon="plus" full onPress={add} loading={save.isPending} testID="today-add-submit" />
          </>
        ) : <Text variant="small" muted>{tr('ht.add.readOnly')}</Text>}
        <View style={{ gap: spacing.xs }}>
          <Text variant="small" muted>{tr('ht.add.missionHint')}</Text>
          <Button label={tr('ht.add.mission')} icon="send" variant="secondary" full onPress={mission} testID="today-add-mission" />
        </View>
        <View style={{ gap: spacing.xs }}>
          <Text variant="label">{tr('ht.add.others')}</Text>
          <QuickAddGrid compact onBefore={close} />
        </View>
      </View>
    </Sheet>
  );
}
