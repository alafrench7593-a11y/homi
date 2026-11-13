/**
 * « Ajouter une tâche / mission » depuis l'accueil : réutilise les deux chemins existants.
 *  - Ajout rapide d'une tâche simple (même insertion que la liste familiale : useSaveTask, file hors ligne comprise),
 *    pour aujourd'hui, prise par moi ou laissée « à prendre » ;
 *  - « Confier une mission » ouvre l'écran existant /family/missions/new (modèles, destinataire, heure…).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Sheet, useToast } from '@/components/Overlays';
import { Button, Field, haptic, Segmented, Text } from '@/components/ui';
import { useSaveTask } from '@/lib/data/hooks-family-load';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useReduceMotion } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export function TodayAddSheet({ visible, onClose, me, canEdit }: { visible: boolean; onClose: () => void; me: string | null | undefined; canEdit: boolean }) {
  const toast = useToast();
  const reduce = useReduceMotion();
  const save = useSaveTask();
  const [title, setTitle] = useState('');
  const [who, setWho] = useState<'me' | 'open'>('me');
  const [error, setError] = useState<string | undefined>();

  const close = () => { setTitle(''); setError(undefined); onClose(); };
  async function add() {
    const v = title.trim();
    if (!v) { setError(tr('ht.add.needTitle')); return; }
    try {
      await save.mutateAsync({ input: { title: v.slice(0, 120), category: 'other', due_at: null, assignee_id: who === 'me' && me ? me : null, priority: 'normal', essential: false, recurrence: null, notes: null } });
      haptic('success');
      toast(tr('u2.fam.added_today'));
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
              <Segmented label={tr('ht.add.who')} value={who} onChange={setWho}
                options={[{ value: 'me', label: tr('ht.add.me'), testID: 'today-add-me' }, { value: 'open', label: tr('ht.add.open'), testID: 'today-add-open' }]} />
            </View>
            <Button label={tr('ht.add.submit')} icon="plus" full onPress={add} loading={save.isPending} testID="today-add-submit" />
          </>
        ) : <Text variant="small" muted>{tr('ht.add.readOnly')}</Text>}
        <View style={{ gap: spacing.xs }}>
          <Text variant="small" muted>{tr('ht.add.missionHint')}</Text>
          <Button label={tr('ht.add.mission')} icon="send" variant="secondary" full onPress={mission} testID="today-add-mission" />
        </View>
      </View>
    </Sheet>
  );
}
