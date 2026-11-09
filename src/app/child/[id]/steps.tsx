/**
 * Mes démarches (script 92 « L'attente ») : quand on soupçonne un TDAH, un trouble du spectre de l'autisme, un
 * trouble « dys » ou un autre besoin particulier, les mois d'attente se remplissent de démarches. Cette liste les
 * met dans l'ordre, à cocher à deux. C'est une liste de la famille (même mécanique que « Listes »), rattachée à
 * l'enfant par son titre : rien de nouveau à stocker.
 * Aucun diagnostic ici : seul un professionnel peut le poser ; les étapes sont les démarches françaises habituelles.
 */
import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { EmptyState, Skeleton } from '@/components/States';
import { Banner, Button, Card, Text } from '@/components/ui';
import { backend } from '@/lib/backend';
import { ensureHousehold, useChecklists, useChild, useChildrenLoading, useHouseholdId, useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { isPremiumError } from '@/lib/data/hooks-family';
import type { Checklist } from '@/lib/types';
import { ChecklistDetail } from '@/app/lists';
import { t as tr, type TKey } from '@/i18n';

const STEP_KEYS = ['doctor', 'school', 'observe', 'assessment', 'pco', 'adjust', 'mdph', 'association', 'relay', 'documents'] as const;
export const stepsTitle = (firstName: string) => `${tr('ks.listTitle')} · ${firstName}`.slice(0, 80);

export default function ChildSteps() {
  const toast = useToast();
  const inv = useInvalidate();
  const hid = useHouseholdId();
  const { id } = useLocalSearchParams<{ id: string }>();
  const child = useChild(id);
  const childLoading = useChildrenLoading();
  const listsQ = useChecklists();
  const [busy, setBusy] = useState(false);
  const [limit, setLimit] = useState(false);
  if (!child) return <Screen back title={tr('tool.kid_steps')}>{childLoading ? <Skeleton rows={4} /> : <EmptyState icon="user" title={tr('kc.noChild')} />}</Screen>;
  const title = stepsTitle(child.first_name);
  const list = (listsQ.data ?? []).find((l) => l.kind === 'custom' && l.title === title) ?? null;

  async function create() {
    setBusy(true);
    try {
      const h = hid ?? (await ensureHousehold());
      const [created] = await backend.insert<Checklist>('checklists', { household_id: h, pregnancy_id: null, kind: 'custom', title });
      await backend.insert('checklist_items', STEP_KEYS.map((k, i) => ({ checklist_id: created.id, household_id: h, label: tr(`ks.step.${k}` as TKey).slice(0, 160), position: i })));
      inv('checklists', 'checklist_items', 'memberships');
      toast(tr('ks.created'));
    } catch (e) {
      if (isPremiumError(e)) setLimit(true); else toast(friendlyError(e), 'error');
    } finally { setBusy(false); }
  }

  return (
    <Screen back title={tr('tool.kid_steps')} subtitle={child.first_name}>
      <Text muted>{tr('ks.intro')}</Text>
      <Banner tone="info">{tr('ks.disclaimer')}</Banner>
      {listsQ.isLoading && !listsQ.data ? <Skeleton rows={4} /> : list ? (
        <ChecklistDetail list={list} onClose={() => router.back()} />
      ) : (
        <Card>
          <Text weight="bold">{tr('ks.startTitle')}</Text>
          <Text variant="small" muted>{STEP_KEYS.map((k, i) => `${i + 1}. ${tr(`ks.step.${k}` as TKey)}`).join('\n')}</Text>
          {limit ? <Banner tone="warning">{tr('ks.limit')}</Banner> : null}
          <Button label={tr('ks.start')} icon="check-square" loading={busy} onPress={() => void create()} testID="kid-steps-create" />
        </Card>
      )}
      <Button label={tr('ks.guide')} icon="book-open" variant="secondary" onPress={() => router.push(`/child/${child.id}/needs`)} />
    </Screen>
  );
}
