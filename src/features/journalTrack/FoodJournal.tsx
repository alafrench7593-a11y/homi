/**
 * Diversification — journal des dégustations (22/11/2026). Lit les MÊMES lignes que la mosaïque et l'historique
 * (food_tastings de CET enfant) ; rien n'est recopié :
 *  · bandeau « Journal des dégustations » : vignettes des aliments goûtés (coche), carte de la dernière dégustation
 *    (« 24 janv. 2025 · Poire · Première dégustation · Quelques cuillerées, bien acceptées ») ;
 *  · toucher un aliment ouvre son journal dans le Tray (Reacticx) posé sur le verre : dégustations, observations du
 *    parent telles qu'il les a écrites ; « Ajouter » ou toucher une ligne ouvre la vue « Modifier » : valeur
 *    PROVISOIRE en grand, Annuler restitue, Enregistrer verrouillé contre le double appui, brouillon gardé si l'écriture
 *    échoue. Aucune déduction d'allergie ou de réaction à partir d'une note.
 */
import React, { useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Tray, useTray } from '@/components/reacticx/tray';
import { Glass, GlassButton } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { Chip, Field, haptic, Icon, Text } from '@/components/ui';
import { FoodArt } from '@/features/discoveries/FoodArt';
import { FOOD_BY_KEY } from '@/content/discoveries/foods';
import { useSaveTasting } from '@/lib/data/hooks-discoveries';
import { friendlyError } from '@/lib/data/hooks-settings';
import { todayISO } from '@/lib/domain/dates';
import type { FoodEntry, Tasting } from '@/lib/domain/discoveries';
import { firstTastingIds, foodJournal, frDayToIso, isoToFrDay, shiftDay, tastingsByFood } from '@/lib/domain/journalTrack';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, radius, spacing } from '@/theme/tokens';

const TABULAR = { fontVariant: ['tabular-nums' as const] };
const STATUSES: Tasting['status'][] = ['tasted', 'liked', 'refused'];
export const tastingDay = (iso: string, year = true) => formatDate(`${iso}T12:00:00`, year ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' });
/** Statut lisible d'une dégustation : l'issue notée si elle existe, sinon le statut. */
const statusLabel = (h: Pick<Tasting, 'status' | 'outcome'>) => (h.outcome ? tr(`blw.outcome.${h.outcome}` as TKey) : tr(`dc.status.${h.status}` as TKey));

export interface JournalFood { key: string; food_key: string | null; name: string }

/** Pastille d'un aliment : photo du catalogue, sinon initiale sur un cercle (aliment noté à la main). */
function FoodBadge({ food, size }: { food: JournalFood; size: number }) {
  const t = useTheme();
  const def = food.food_key ? FOOD_BY_KEY[food.food_key] : undefined;
  if (def) return <FoodArt food={def} size={size} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: t.colors.border, backgroundColor: t.colors.surface }}>
      <Text weight="bold" style={{ fontSize: size * 0.4 }}>{food.name.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

/** Bandeau de l'écran : aliments goûtés + dernière dégustation. */
export function TastingJournal({ tastings, onOpen }: { tastings: readonly Tasting[]; onOpen: (food: JournalFood) => void }) {
  const t = useTheme();
  const groups = useMemo(() => tastingsByFood(tastings), [tastings]);
  const firsts = useMemo(() => firstTastingIds(tastings), [tastings]);
  const last = groups[0]?.last;
  return (
    <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: spacing.sm }} testID="jt-food-journal">
      <Text variant="label" muted accessibilityRole="header">{tr('jt.food.title')}</Text>
      {groups.length ? (
        <>
          <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {groups.slice(0, 16).map((g) => {
              const food = { key: g.key, food_key: g.food_key, name: g.food_name };
              return (
                <Tappable key={g.key} accessibilityRole="button" testID={`jt-food-${g.food_key ?? g.key}`}
                  accessibilityLabel={tr('jt.food.tileA11y', { food: g.food_name, count: g.tastings.length })}
                  onPress={() => { haptic('selection'); onOpen(food); }} style={{ alignItems: 'center', gap: 4, width: 72, minHeight: MIN_TOUCH }}>
                  <View>
                    <FoodBadge food={food} size={56} />
                    <View style={{ position: 'absolute', right: -2, bottom: -2, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.success, borderWidth: 2, borderColor: t.colors.surface }}>
                      <Icon name="check" size={12} color={t.colors.surface} />
                    </View>
                  </View>
                  <Text variant="caption" center numberOfLines={1}>{g.food_name}</Text>
                </Tappable>
              );
            })}
          </ScrollView>
          {last ? (
            <Tappable accessibilityRole="button" testID="jt-food-last" onPress={() => onOpen({ key: groups[0].key, food_key: groups[0].food_key, name: groups[0].food_name })}
              style={{ minHeight: MIN_TOUCH, paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, gap: 2 }}>
              <Text variant="caption" muted>{tr('jt.food.last')}</Text>
              <Text weight="bold" style={TABULAR}>{[tastingDay(last.tasted_on), last.food_name, firsts.has(last.id) ? tr('jt.food.first') : statusLabel(last)].join(' · ')}</Text>
              {last.note ? <Text variant="small" numberOfLines={2} intentionalTruncation>{last.note}</Text> : null}
            </Tappable>
          ) : null}
          <Text variant="caption" muted>{tr('jt.food.hint')}</Text>
        </>
      ) : (
        <View testID="jt-food-empty" style={{ minHeight: 64, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center', padding: spacing.sm }}>
          <Text variant="small" muted center>{tr('jt.food.none')}</Text>
        </View>
      )}
    </Glass>
  );
}

/** Le journal d'un aliment dans le Tray : liste, ajout, correction. */
export function FoodJournalTray({ child, food, tastings, entry, open, onOpenChange, onOpenSheet }: {
  child: { id: string; household_id: string; first_name: string; birth_date?: string | null };
  food: JournalFood | null; tastings: readonly Tasting[]; entry?: FoodEntry; open: boolean; onOpenChange: (v: boolean) => void;
  /** Fiche complète de l'aliment (conseils, texture, réaction, recettes) */ onOpenSheet?: () => void;
}) {
  const t = useTheme();
  const [target, setTarget] = useState<Tasting | null>(null);
  const [nonce, setNonce] = useState(0);
  if (!food) return null;
  const list = foodJournal(tastings, food.key);
  const firsts = firstTastingIds(tastings);
  const palette = { surface: 'transparent', border: t.colors.border, handle: t.colors.textMuted, text: t.colors.text, mutedText: t.colors.textMuted, backdrop: t.colors.overlay };
  return (
    <Tray open={open} onOpenChange={onOpenChange} defaultView="journal" palette={palette} theme={t.isDark ? 'dark' : 'light'} radius={34}
      motion={{ viewAxis: 'x', viewSlide: 60, viewStartScale: 1 }}>
      <Tray.Content surface={<Glass variant="sheet" radius={34} style={{ flex: 1 }} />}>
        <Tray.View id="journal">
          <JournalView child={child} food={food} list={list} firsts={firsts} onClose={() => onOpenChange(false)} onOpenSheet={onOpenSheet}
            onEdit={(x) => { setTarget(x); setNonce((n) => n + 1); }} />
        </Tray.View>
        <Tray.View id="edit">
          <EditTastingView key={`${target?.id ?? 'new'}:${nonce}`} child={child} food={food} entry={entry} target={target} all={tastings} firstOfFood={list[list.length - 1] ?? null} />
        </Tray.View>
      </Tray.Content>
    </Tray>
  );
}

function JournalView({ child, food, list, firsts, onEdit, onClose, onOpenSheet }: {
  child: { first_name: string }; food: JournalFood; list: Tasting[]; firsts: Set<string>; onEdit: (x: Tasting | null) => void; onClose: () => void; onOpenSheet?: () => void;
}) {
  const t = useTheme();
  const { setView } = useTray();
  const edit = (x: Tasting | null) => { onEdit(x); setView('edit'); };
  const since = list.length ? list[list.length - 1].tasted_on : null;
  return (
    <View testID="jt-food-tray" style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <FoodBadge food={food} size={52} />
        <View style={{ flex: 1 }}>
          <Text variant="heading" accessibilityRole="header">{food.name}</Text>
          <Text variant="small" muted style={TABULAR} testID="jt-food-count">
            {list.length ? tr('jt.food.count', { count: list.length, since: tastingDay(since!) }) : tr('jt.food.journalNone', { name: child.first_name })}
          </Text>
        </View>
        <Tray.Close><Icon name="x" size={20} color={t.colors.text} /></Tray.Close>
      </View>
      {list.length ? (
        <View style={{ maxHeight: 320 }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.xs }}>
            {list.slice(0, 40).map((h) => (
              <Tappable key={h.id} accessibilityRole="button" testID={`jt-tasting-${h.id}`} accessibilityLabel={tr('jt.food.editA11y', { date: tastingDay(h.tasted_on) })}
                onPress={() => edit(h)} style={{ minHeight: MIN_TOUCH, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', paddingVertical: 6 }}>
                <Text variant="small" weight="bold" style={[{ width: 92 }, TABULAR]}>{tastingDay(h.tasted_on)}</Text>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text variant="small">{[statusLabel(h), firsts.has(h.id) ? tr('jt.food.first') : null].filter(Boolean).join(' · ')}</Text>
                  {h.note ? <Text variant="small" muted testID={`jt-tasting-note-${h.id}`}>{tr('jt.food.observed', { note: h.note })}</Text> : null}
                </View>
                <Icon name="edit-2" size={14} color={t.colors.textMuted} />
              </Tappable>
            ))}
          </ScrollView>
        </View>
      ) : (
        <View style={{ minHeight: 56, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="small" muted>{tr('jt.food.nothing')}</Text>
        </View>
      )}
      <Text variant="caption" muted>{tr('jt.food.noDeduction')}</Text>
      <GlassButton variant="primary" full icon="plus" label={tr('jt.food.add')} testID="jt-food-add" onPress={() => edit(null)} />
      {onOpenSheet ? <GlassButton variant="tertiary" full icon="book-open" label={tr('jt.food.sheet')} testID="jt-food-sheet" onPress={() => { onClose(); onOpenSheet(); }} /> : null}
    </View>
  );
}

/**
 * Ajouter / corriger une dégustation : date et statut PROVISOIRES affichés en grand tant que rien n'est enregistré ;
 * Annuler restitue les valeurs d'origine ; Enregistrer : une seule écriture même en double appui ; en cas d'échec,
 * le brouillon reste affiché avec le message.
 */
function EditTastingView({ child, food, entry, target, all, firstOfFood }: {
  child: { id: string; household_id: string; birth_date?: string | null }; food: JournalFood; entry?: FoodEntry; target: Tasting | null; all: readonly Tasting[]; firstOfFood: Tasting | null;
}) {
  const t = useTheme();
  const { goBack } = useTray();
  const save = useSaveTasting();
  const init = { date: target?.tasted_on ?? todayISO(), status: target?.status ?? 'tasted' as Tasting['status'], note: target?.note ?? '' };
  const [text, setText] = useState(isoToFrDay(init.date));
  const [status, setStatus] = useState<Tasting['status']>(init.status);
  const [note, setNote] = useState(init.note);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const inflight = useRef(false);
  const iso = frDayToIso(text);
  const invalid = !iso ? tr('jt.edit.badDate') : iso > todayISO() ? tr('jt.edit.future') : child.birth_date && iso < child.birth_date ? tr('jt.edit.beforeBirth') : null;
  const changed = !target || iso !== init.date || status !== init.status || note.trim() !== init.note.trim();
  // Serait-ce la première dégustation de l'aliment ? (date strictement plus ancienne que la première connue)
  const wouldBeFirst = !!iso && (!firstOfFood || firstOfFood.id === target?.id || iso < firstOfFood.tasted_on);
  const step = (d: number) => { setText(isoToFrDay(shiftDay(iso ?? init.date, d))); setError(null); };
  const cancel = () => { setText(isoToFrDay(init.date)); setStatus(init.status); setNote(init.note); setError(null); goBack(); };
  const submit = async () => {
    if (inflight.current || !iso || invalid) return;             // double appui : une seule écriture
    inflight.current = true; setBusy(true); setError(null);
    try {
      await save.mutateAsync({ child, food: { key: food.food_key, name: food.name }, entry: entry ?? null, tasting: target, date: iso, status, note: note.trim() || null, all });
      haptic('success');
      goBack();
    } catch (e) {
      setError(tr('jt.edit.failed', { reason: friendlyError(e).replace(/[.\s]+$/, '') }));
    } finally { inflight.current = false; setBusy(false); }
  };
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm }} testID="jt-tasting-editor">
      <Text variant="label" accessibilityRole="header">{target ? tr('jt.edit.fixTitle', { food: food.name }) : tr('jt.edit.addTitle', { food: food.name })}</Text>
      <Text testID="jt-edit-date" accessibilityLiveRegion="polite" maxFontSizeMultiplier={1.3}
        style={[{ fontSize: 48, lineHeight: 54, letterSpacing: -1.5, fontFamily: fonts.display, color: t.colors.text }, TABULAR]}>{iso ? tastingDay(iso, false) : '—'}</Text>
      <Text weight="bold" testID="jt-edit-proposed">{[statusLabel({ status, outcome: null }), wouldBeFirst ? tr('jt.food.first') : null].filter(Boolean).join(' · ')}</Text>
      {changed && target ? <Text variant="caption" muted testID="jt-edit-provisional">{tr('jt.edit.provisional', { from: tastingDay(init.date) })}</Text> : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs }}>
        <GlassButton variant="secondary" label={tr('jt.edit.minus')} accessibilityLabel={tr('jt.edit.minusA11y')} testID="jt-edit-minus" onPress={() => step(-1)} />
        <View style={{ flex: 1 }}><Field label={tr('jt.edit.date')} value={text} onChangeText={(v) => { setText(v); setError(null); }} keyboardType="numbers-and-punctuation" maxLength={10} testID="jt-edit-day" error={invalid ?? undefined} /></View>
        <GlassButton variant="secondary" label={tr('jt.edit.plus')} accessibilityLabel={tr('jt.edit.plusA11y')} testID="jt-edit-plus" disabled={!!iso && iso >= todayISO()} onPress={() => step(1)} />
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {STATUSES.map((s) => <Chip key={s} label={tr(`dc.status.${s}` as TKey)} selected={status === s} onPress={() => { setStatus(s); setError(null); }} testID={`jt-edit-status-${s}`} />)}
      </View>
      <Field label={tr('jt.edit.note')} optional value={note} onChangeText={(v) => { setNote(v); setError(null); }} multiline maxLength={1000} hint={tr('jt.edit.noteHint')} testID="jt-edit-note" />
      {error ? <Text variant="small" color={t.colors.danger} testID="jt-edit-error" accessibilityLiveRegion="assertive">{error}</Text> : null}
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <View style={{ flex: 1 }}><GlassButton variant="tertiary" full label={tr('jt.edit.cancel')} testID="jt-edit-cancel" onPress={cancel} /></View>
        <View style={{ flex: 1 }}><GlassButton variant="primary" full label={tr('jt.edit.save')} testID="jt-edit-save" disabled={!changed || !!invalid || busy} onPress={submit} /></View>
      </View>
    </View>
  );
}
