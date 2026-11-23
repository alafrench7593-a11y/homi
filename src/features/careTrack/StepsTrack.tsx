/**
 * « Mes démarches » — suivi (22/11/2026). Même liste que l'écran (`checklists` + `checklist_items`, partagée avec le
 * foyer, cochée à deux) :
 *  · donnée principale : « 3 / 10 » démarches faites (même nature : des démarches), le reste dessous ;
 *  · la prochaine démarche à faire (dans l'ordre de la liste) ; toucher une démarche → sa fiche (Tray, démarche gardée dans l'adresse `?step=`) : « Corriger » faite / à faire
 *    et la note — valeurs provisoires, Annuler, Enregistrer verrouillé, brouillon gardé si l'écriture échoue.
 * La liste à cocher d'origine reste en dessous pour cocher en un geste. Aucun diagnostic, aucun délai inventé.
 */
import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { HmFixTray, HmHero, HmRow } from '@/features/homeTrack/kit';
import { t as tr } from '@/i18n';
import { useUserId } from '@/lib/auth';
import { useChecklistItems } from '@/lib/data/hooks';
import { useCareEdit } from '@/lib/data/hooks-careTrack';
import { stepsProgress } from '@/lib/domain/careTrack';
import type { ChecklistItem } from '@/lib/types';
import { spacing } from '@/theme/tokens';

export function StepsTrack({ listId }: { listId: string }) {
  const items = useChecklistItems(listId).data ?? [];
  const { step } = useLocalSearchParams<{ step?: string }>();
  const p = stepsProgress(items);
  const opened = step ? items.find((i) => i.id === step) ?? null : null;
  const next = items.find((i) => !i.done) ?? null;
  return (
    <View style={{ gap: spacing.sm }} testID="ct-steps">
      <HmHero testID="ct-steps-hero" value={p ? tr('ct.steps.ratio', { done: p.done, total: p.total }) : null} emptyLabel={tr('ct.nothing')}
        unit={p ? tr('ct.steps.unit', { count: p.done }) : null}
        split={p ? [
          { label: tr('ct.steps.left'), value: String(p.total - p.done), testID: 'ct-steps-left' },
          { label: tr('ct.steps.done'), value: String(p.done), testID: 'ct-steps-done' },
        ] : undefined} />
      {next ? (
        <HmRow time={String(items.indexOf(next) + 1)} icon="arrow-right-circle" title={next.label}
          detail={[tr('ct.steps.next'), next.note].filter(Boolean).join(' · ')}
          testID="ct-steps-next" a11y={`${tr('ct.steps.next')} : ${next.label}. ${tr('ct.openToFix')}`}
          onPress={() => router.setParams({ step: next.id } as never)} />
      ) : null}
      {opened ? <StepTray item={opened} onClose={() => router.setParams({ step: undefined } as never)} /> : null}
    </View>
  );
}

function StepTray({ item, onClose }: { item: ChecklistItem; onClose: () => void }) {
  const edit = useCareEdit('checklist_items');
  const userId = useUserId();
  return (
    <HmFixTray open onOpenChange={(v) => { if (!v) onClose(); }} testID="ct-steps-tray"
      title={item.label} hero={item.done ? tr('ct.steps.isDone') : tr('ct.steps.isTodo')}
      lines={[item.note ? tr('ct.note', { note: item.note }) : null]}
      editLabel={tr('ct.fix')} editTitle={tr('ct.steps.fixTitle')}
      fields={[
        { key: 'done', label: tr('ct.steps.stateField'), kind: 'choice', options: [tr('ct.steps.isTodo'), tr('ct.steps.isDone')] },
        { key: 'note', label: tr('ct.moment.noteField'), kind: 'multiline', maxLength: 500 },
      ]}
      initial={{ done: item.done ? '1' : '0', note: item.note ?? '' }}
      onSave={async (d) => {
        const patch: Record<string, unknown> = {};
        const done = d.done === '1';
        if (done !== item.done) { patch.done = done; patch.done_by = done ? userId : null; }
        const note = d.note.trim() || null;
        if (note !== item.note) patch.note = note;
        const res = await edit(item.id, patch, item as unknown as Record<string, unknown>);
        return res === 'changed' ? tr('ct.changedMeanwhile') : 'ok';
      }} />
  );
}
