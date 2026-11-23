/**
 * Menu de la semaine — suivi (23/11/2026). Même donnée que l'écran (menu en cours, `meal_plans` / `meal_plan_items`) :
 *  · `MenuDayList` : un jour par ligne, date en colonne fixe (date réelle si le menu est enregistré, sinon à partir
 *    d'aujourd'hui), recettes prévues ; jour sans repas = « Rien de prévu » (jamais 0). Le jour choisi est gardé dans
 *    l'adresse (« ?day=2 ») ;
 *  · `MenuSlotTray` : fiche d'un repas (gardé dans l'adresse « ?slot=2-dinner ») — « Corriger » les personnes et la
 *    note : valeurs PROVISOIRES, Annuler, Enregistrer verrouillé ; si le menu est enregistré, la ligne n'est écrite que
 *    si elle n'a pas changé depuis l'ouverture (`useCareEdit`, gardes `editGuards`).
 */
import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { HmFixTray, HmRow } from '@/features/homeTrack/kit';
import { MotionItem, MotionList } from '@/motion/ListMotion';
import { formatDate, t as tr } from '@/i18n';
import { useCareEdit } from '@/lib/data/hooks-careTrack';
import { friendlyError } from '@/lib/data/hooks-settings';
import { menuDayDate, menuDays, slotPatch, type PlanItemLike, type SlotLike } from '@/lib/domain/finishMeals';
import { spacing } from '@/theme/tokens';

const shortDay = (iso: string) => formatDate(`${iso}T12:00:00`, { weekday: 'short', day: 'numeric' }).replace('.', '');
const longDay = (iso: string) => formatDate(`${iso}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' });

export function MenuDayList({ slots, days, start, selected, onSelect, titleOf }: {
  slots: readonly SlotLike[]; days: number; start: string; selected: number; onSelect: (d: number) => void; titleOf: (recipeId: string) => string | null;
}) {
  const rows = menuDays(slots, days).map((d) => ({ ...d, id: `menu-day-${d.day}`, date: menuDayDate(start, d.day)! }));
  return (
    <View style={{ gap: spacing.xs }} testID="fm-menu-days">
      <Text variant="label" muted accessibilityRole="header">{tr('fm.menu.daysTitle')}</Text>
      <MotionList>{rows.map((d) => (
        <MotionItem key={d.id}>
          <HmRow time={shortDay(d.date)} icon={d.day === selected ? 'disc' : 'circle'} testID={`fm-menu-day-${d.day}`}
            title={`${tr('rc.menu.day', { n: d.day + 1 })}${d.day === selected ? ` · ${tr('fm.menu.shown')}` : ''}`}
            detail={d.count == null ? tr('fm.menu.dayNone') : d.recipeIds.map(titleOf).filter(Boolean).join(' · ')}
            faded={d.count == null}
            a11y={`${longDay(d.date)}. ${d.count == null ? tr('fm.menu.dayNone') : tr('fm.menu.count', { count: d.count })}${d.day === selected ? `. ${tr('fm.menu.shown')}` : ''}`}
            onPress={() => onSelect(d.day)} />
        </MotionItem>
      ))}</MotionList>
    </View>
  );
}

export function MenuSlotTray({ slot, mealName, recipeTitle, date, saved, onLocal, onClose }: {
  slot: SlotLike; mealName: string; recipeTitle: string; date: string;
  /** Ligne enregistrée correspondante (menu enregistré), sinon `null` : la correction reste dans le menu en cours */
  saved: PlanItemLike | null;
  onLocal: (patch: { servings?: number; note?: string | null }) => void;
  onClose: () => void;
}) {
  const edit = useCareEdit('meal_plan_items');
  return (
    <HmFixTray open onOpenChange={(v) => { if (!v) onClose(); }} testID="fm-menu-tray"
      title={tr('fm.menu.trayTitle', { meal: mealName, day: longDay(date) })} hero={recipeTitle}
      lines={[tr('rc.servings', { count: slot.servings }), slot.note ? tr('fm.note', { note: slot.note }) : null, saved ? tr('fm.menu.savedLine') : tr('fm.menu.unsavedLine')]}
      editTitle={tr('fm.menu.fixTitle')}
      fields={[
        { key: 'servings', label: tr('fm.menu.servings'), kind: 'number', step: 1, hint: tr('fm.menu.servingsHint') },
        { key: 'note', label: tr('fm.noteLabel'), kind: 'multiline', maxLength: 500 },
      ]}
      initial={{ servings: String(slot.servings), note: slot.note ?? '' }}
      validate={(d) => (slotPatch(slot, { servings: d.servings ?? '', note: d.note ?? '' }).ok ? null : tr('fm.menu.badServings'))}
      onSave={async (d) => {
        const res = slotPatch(slot, { servings: d.servings ?? '', note: d.note ?? '' });
        if (!res.ok) return tr('fm.menu.badServings');
        if (!Object.keys(res.patch).length) return 'ok';
        if (saved) {
          try {
            const out = await edit(saved.id, res.patch, saved as unknown as Record<string, unknown>);
            if (out === 'changed') return tr('fm.changedMeanwhile');
          } catch (e) { return friendlyError(e); }
        }
        onLocal(res.patch);
        return 'ok';
      }} />
  );
}
