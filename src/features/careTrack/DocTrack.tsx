/**
 * Documents et carnet de santé — suivi par mois (22/11/2026). Mêmes documents que la liste (`documents`, privés par
 * défaut) ; rien n'est recopié ni déduit :
 *  · mois gardé dans l'adresse (`?month=AAAA-MM`), mois précédent / suivant ; un document est rangé à SA date (date du
 *    document, sinon jour du dépôt) ;
 *  · donnée principale : le nombre de documents du mois (même nature : des documents), « à vérifier » et total dessous ;
 *    mois sans document → « Aucun document ce mois-ci » en pointillé (jamais 0) ;
 *  · documents du mois (date en colonne fixe, pictogramme de catégorie, titre, catégorie, chevron) ;
 *  · toucher un document → sa fiche (Tray, `?doc=`) : « Corriger » titre, date et note — valeurs provisoires, Annuler,
 *    Enregistrer verrouillé, brouillon gardé si l'écriture échoue ; « Ouvrir le document » mène à sa page.
 */
import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Glass } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, Text } from '@/components/ui';
import { HmFixTray, HmHero, HmRow, TABULAR } from '@/features/homeTrack/kit';
import { formatDate, t as tr } from '@/i18n';
import { useCareEdit } from '@/lib/data/hooks-careTrack';
import { monthOf, shiftMonth, urlMonth } from '@/lib/domain/careTrack';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { categoryDef, categoryLabel } from '@/lib/documents/taxonomy';
import { toFrDate } from '@/lib/validation';
import type { DocumentRow } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { dateError, longDate, shortDate } from './MomentTray';

/** Date de rangement : date du document, sinon jour du dépôt. */
export const docDay = (d: Pick<DocumentRow, 'doc_date' | 'created_at'>) => d.doc_date ?? d.created_at.slice(0, 10);
const monthTitle = (m: string) => formatDate(`${m}-15T12:00:00`, { month: 'long', year: 'numeric' });

export function MonthStepper({ month, onSelect, max, testID }: { month: string; onSelect: (m: string) => void; max: string; testID: string }) {
  const t = useTheme();
  const pick = (m: string) => { haptic('selection'); onSelect(m); };
  const canNext = month < max;
  return (
    <Glass variant="card" radius={radius.pill} contentStyle={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }} testID={testID}>
      <Tappable accessibilityRole="button" accessibilityLabel={tr('ct.month.prev')} testID={`${testID}-prev`} onPress={() => pick(shiftMonth(month, -1))}
        style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="chevron-left" size={22} color={t.colors.text} />
      </Tappable>
      <Text weight="bold" center style={[{ flex: 1 }, TABULAR]} accessibilityRole="header" testID={`${testID}-title`}>{monthTitle(month)}</Text>
      <Tappable accessibilityRole="button" accessibilityLabel={tr('ct.month.next')} accessibilityState={{ disabled: !canNext }} disabled={!canNext} testID={`${testID}-next`}
        onPress={() => pick(shiftMonth(month, 1))} style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', opacity: canNext ? 1 : 0.3 }}>
        <Icon name="chevron-right" size={22} color={t.colors.text} />
      </Tappable>
    </Glass>
  );
}

export function DocTrack({ docs, testID = 'ct-docs' }: { docs: readonly DocumentRow[]; testID?: string }) {
  const params = useLocalSearchParams<{ month?: string; doc?: string }>();
  const today = todayISO();
  const month = urlMonth(params.month, today);
  const active = docs.filter((d) => !d.archived);
  const inMonth = active.filter((d) => monthOf(docDay(d)) === month).sort((a, b) => docDay(b).localeCompare(docDay(a)) || b.created_at.localeCompare(a.created_at));
  const toVerify = active.filter((d) => d.review_status === 'to_verify').length;
  const opened = params.doc ? docs.find((d) => d.id === params.doc) ?? null : null;
  return (
    <View style={{ gap: spacing.sm }} testID={testID}>
      <MonthStepper month={month} max={monthOf(today)} testID={`${testID}-month`}
        onSelect={(m) => router.setParams({ month: m === monthOf(today) ? undefined : m, doc: undefined } as never)} />
      <HmHero testID={`${testID}-hero`} value={inMonth.length ? String(inMonth.length) : null} emptyLabel={tr('ct.docs.noneMonth')}
        unit={inMonth.length ? tr('ct.docs.unit', { count: inMonth.length, month: monthTitle(month) }) : null}
        split={active.length ? [
          { label: tr('ct.docs.total'), value: String(active.length), testID: `${testID}-total` },
          { label: tr('ct.docs.toVerify'), value: String(toVerify), testID: `${testID}-verify` },
        ] : undefined} />
      {inMonth.length ? (
        <View testID={`${testID}-list`}>
          {inMonth.map((d) => (
            <HmRow key={d.id} time={shortDate(docDay(d))} icon={categoryDef(d.category).icon} title={d.title}
              detail={[categoryLabel(d.category, d.custom_category), d.doc_date ? null : tr('ct.docs.addedOn'), d.review_status === 'to_verify' ? tr('ct.docs.toVerifyOne') : null].filter(Boolean).join(' · ')}
              testID={`${testID}-row-${d.id}`} a11y={`${longDate(docDay(d))}. ${d.title}. ${categoryLabel(d.category, d.custom_category)}. ${tr('ct.openToFix')}`}
              onPress={() => router.setParams({ doc: d.id } as never)} />
          ))}
        </View>
      ) : null}
      {opened ? <DocTray doc={opened} testID={`${testID}-tray`} onClose={() => router.setParams({ doc: undefined } as never)} /> : null}
    </View>
  );
}

function DocTray({ doc, onClose, testID }: { doc: DocumentRow; onClose: () => void; testID: string }) {
  const edit = useCareEdit('documents');
  return (
    <HmFixTray open onOpenChange={(v) => { if (!v) onClose(); }} testID={testID}
      title={doc.title} hero={doc.doc_date ? shortDate(doc.doc_date) : tr('ct.noDate')}
      lines={[doc.doc_date ? longDate(doc.doc_date) : null, categoryLabel(doc.category, doc.custom_category), doc.doc_date ? null : tr('ct.docs.addedAt', { date: longDate(doc.created_at) }), doc.notes ? tr('ct.note', { note: doc.notes }) : null]}
      editLabel={tr('ct.fix')} editTitle={tr('ct.docs.fixTitle')}
      onFullForm={() => router.push(`/documents/${doc.id}` as never)}
      fields={[
        { key: 'title', label: tr('ct.docs.titleField'), kind: 'text', maxLength: 200 },
        { key: 'date', label: tr('ct.docs.dateField'), kind: 'date', hint: tr('ct.docs.dateHint') },
        { key: 'notes', label: tr('ct.moment.noteField'), kind: 'multiline', maxLength: 2000 },
      ]}
      initial={{ title: doc.title, date: doc.doc_date ? toFrDate(doc.doc_date) : '', notes: doc.notes ?? '' }}
      validate={(d) => (!d.title.trim() ? tr('ct.docs.titleRequired') : dateError(d.date))}
      onSave={async (d) => {
        const err = !d.title.trim() ? tr('ct.docs.titleRequired') : dateError(d.date);
        if (err) return err;
        const iso = d.date.trim() ? frToISO(d.date) : null;
        const patch: Record<string, unknown> = {};
        if (d.title.trim() !== doc.title) patch.title = d.title.trim().slice(0, 200);
        if (iso !== doc.doc_date) patch.doc_date = iso;
        const notes = d.notes.trim() || null;
        if (notes !== doc.notes) patch.notes = notes;
        const res = await edit(doc.id, patch, doc as unknown as Record<string, unknown>);
        return res === 'changed' ? tr('ct.changedMeanwhile') : 'ok';
      }} />
  );
}
