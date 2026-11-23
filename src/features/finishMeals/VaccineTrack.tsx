/**
 * Vaccins de l'enfant — suivi (23/11/2026). Même donnée que l'écran (registre `child_vaccinations`, calendrier
 * calculé) ; rien n'est recopié :
 *  · `VaccineHero` : vaccins NOTÉS en grand (jamais une norme, jamais « en retard »), puis doses du calendrier faites /
 *    prévues / reportées ; aucun vaccin noté : « Aucun vaccin noté » en pointillé (jamais 0) ;
 *  · `VaccineRegistry` : registre du plus récent au plus ancien, date en colonne fixe ; toucher une ligne ouvre sa
 *    fiche (Tray, gardée dans l'adresse « ?vax= ») : « Corriger » date (jamais future, jamais avant la naissance),
 *    dose, lot, par qui, source et note — valeurs PROVISOIRES, Annuler, Enregistrer verrouillé ; la ligne n'est écrite
 *    que si elle n'a pas changé depuis l'ouverture (`useCareEdit`, gardes `editGuards`).
 */
import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IconButton } from '@/components/ui';
import { HmFixTray, HmHero, HmRow } from '@/features/homeTrack/kit';
import { MotionItem, MotionList } from '@/motion/ListMotion';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useCareEdit } from '@/lib/data/hooks-careTrack';
import { friendlyError } from '@/lib/data/hooks-settings';
import type { Vaccination } from '@/lib/data/hooks-vaccines';
import { SOURCES, vaccineFacts, vaccinationsByDate, vaccinePatch } from '@/lib/domain/finishMeals';
import { todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { spacing } from '@/theme/tokens';

const longDate = (iso: string) => formatDate(`${iso.slice(0, 10)}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' });
const shortDate = (iso: string) => formatDate(`${iso.slice(0, 10)}T12:00:00`, { day: 'numeric', month: 'short' });
const srcLabel = (s: string) => tr(`vx.src.${s}` as TKey);

export function VaccineHero({ vaccinations, schedule, next }: { vaccinations: readonly Vaccination[]; schedule: readonly { state: string }[] | null; next: string | null }) {
  const f = vaccineFacts(vaccinations, schedule);
  return (
    <HmHero testID="fm-vx-hero" value={f.count ? String(f.count) : null} emptyLabel={tr('fm.vx.none')}
      unit={f.count ? tr('fm.vx.unit', { count: f.count }) : null}
      split={schedule ? [
        { label: tr('fm.vx.done'), value: String(f.done), testID: 'fm-vx-done' },
        { label: tr('fm.vx.planned'), value: String(f.planned), testID: 'fm-vx-planned' },
        // Doses passées non notées : à vérifier dans le carnet (plus utile qu'un « 0 reportée » quand rien n'est noté)
        f.check && !f.postponed ? { label: tr('fm.vx.check'), value: String(f.check), testID: 'fm-vx-check' }
          : { label: tr('fm.vx.postponed'), value: String(f.postponed), testID: 'fm-vx-postponed' },
      ] : undefined}
      caption={[f.last ? tr('fm.vx.lastOn', { date: longDate(f.last) }) : null, next ? tr('fm.vx.next', { when: next }) : null].filter(Boolean).join(' · ') || null} />
  );
}

export function VaccineRegistry({ vaccinations, birthDate, onAttach, onDelete, onFullForm }: {
  vaccinations: readonly Vaccination[]; birthDate: string;
  onAttach: (v: Vaccination) => void; onDelete: (v: Vaccination) => void; onFullForm: (v: Vaccination) => void;
}) {
  const { vax } = useLocalSearchParams<{ vax?: string }>();
  const open = vax ? vaccinations.find((v) => v.id === vax) ?? null : null;
  const rows = vaccinationsByDate(vaccinations);
  return (
    <View style={{ gap: spacing.xs }} testID="fm-vx-list">
      <MotionList>{rows.map((v) => (
        <MotionItem key={v.id}>
          {/* pièce jointe à côté de la ligne et non dedans : un bouton dans un bouton est invalide sur le web */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <HmRow time={shortDate(v.given_on)} icon="shield" testID={`fm-vx-row-${v.id}`}
                title={`${v.vaccine}${v.dose_label ? ` · ${v.dose_label}` : ''}`}
                detail={[v.given_by, v.lot ? tr('vx.lot', { lot: v.lot }) : null, srcLabel(v.source)].filter(Boolean).join(' · ')}
                a11y={`${v.vaccine}. ${longDate(v.given_on)}. ${tr('fm.openToFix')}`}
                onPress={() => router.setParams({ vax: v.id } as never)} />
            </View>
            <IconButton icon="paperclip" label={tr('vx.attachA11y', { name: v.vaccine })} size={18} onPress={() => onAttach(v)} />
          </View>
        </MotionItem>
      ))}</MotionList>
      {open ? <VaccineTray key={open.id} v={open} birthDate={birthDate} onDelete={onDelete} onFullForm={onFullForm} /> : null}
    </View>
  );
}

function VaccineTray({ v, birthDate, onDelete, onFullForm }: { v: Vaccination; birthDate: string; onDelete: (v: Vaccination) => void; onFullForm: (v: Vaccination) => void }) {
  const edit = useCareEdit('child_vaccinations');
  const close = () => router.setParams({ vax: undefined } as never);
  const err = (reason: 'format' | 'future' | 'before') => tr(reason === 'future' ? 'ct.date.future' : reason === 'before' ? 'ct.date.beforeBirth' : 'ct.date.format');
  const draftOf = (d: Record<string, string>) => ({ date: d.date ?? '', dose: d.dose ?? '', lot: d.lot ?? '', by: d.by ?? '', source: d.source ?? '', note: d.note ?? '' });
  return (
    <HmFixTray open onOpenChange={(o) => { if (!o) close(); }} testID="fm-vx-tray"
      title={tr('fm.vx.trayTitle')} hero={shortDate(v.given_on)} heroLabel={longDate(v.given_on)}
      lines={[`${v.vaccine}${v.dose_label ? ` · ${v.dose_label}` : ''}`, longDate(v.given_on), v.given_by, v.lot ? tr('vx.lot', { lot: v.lot }) : null, srcLabel(v.source), v.note ? tr('fm.note', { note: v.note }) : null]}
      editTitle={tr('fm.vx.fixTitle')}
      onFullForm={() => onFullForm(v)}
      fields={[
        { key: 'date', label: tr('vx.f.date'), kind: 'date', hint: tr('fm.vx.dateHint') },
        { key: 'dose', label: tr('vx.f.dose'), kind: 'text', maxLength: 60 },
        { key: 'lot', label: tr('vx.f.lot'), kind: 'text', maxLength: 40 },
        { key: 'by', label: tr('vx.f.by'), kind: 'text', maxLength: 120 },
        { key: 'source', label: tr('fm.vx.source'), kind: 'choice', options: SOURCES.map(srcLabel) },
        { key: 'note', label: tr('vx.f.note'), kind: 'multiline', maxLength: 1000 },
      ]}
      initial={{ date: toFrDate(v.given_on), dose: v.dose_label ?? '', lot: v.lot ?? '', by: v.given_by ?? '', source: String(Math.max(0, SOURCES.indexOf(v.source))), note: v.note ?? '' }}
      validate={(d) => { const r = vaccinePatch(v, draftOf(d), todayISO(), birthDate); return r.ok ? null : err(r.reason); }}
      onSave={async (d) => {
        const r = vaccinePatch(v, draftOf(d), todayISO(), birthDate);
        if (!r.ok) return err(r.reason);
        if (!Object.keys(r.patch).length) return 'ok';
        try {
          const res = await edit(v.id, r.patch, v as unknown as Record<string, unknown>);
          return res === 'changed' ? tr('fm.changedMeanwhile') : 'ok';
        } catch (e) { return friendlyError(e); }
      }}
      deleteLabel={tr('fm.vx.delete')} onDelete={() => onDelete(v)} />
  );
}

