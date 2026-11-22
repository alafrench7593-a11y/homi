/**
 * Papiers de la famille — échéances (22/11/2026). Même donnée que la liste des papiers (family_papers) :
 *  · la prochaine échéance en grand (« 23 jours », papier et date dessous), « à renouveler / à jour / sans photo » ;
 *    aucune date notée : « Aucune échéance notée » en pointillé (jamais 0) ;
 *  · les papiers datés en liste (date en colonne fixe) ; un papier → sa fiche (Tray, papier gardé dans l'adresse
 *    « ?paper= ») pour corriger la date d'échéance : valeur provisoire, Annuler, Enregistrer verrouillé, brouillon
 *    gardé si l'écriture échoue (même écriture que la fiche du papier : family_papers.expires_on).
 */
import { MotionItem, MotionList } from '@/motion/ListMotion';
import React from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { backend, eq } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import type { FamilyPaper } from '@/lib/data/hooks-mental';
import { friendlyError } from '@/lib/data/hooks-settings';
import { frToISO } from '@/lib/domain/dates';
import { daysUntil, nextExpiry } from '@/lib/domain/homeTrack';
import { paperStatus } from '@/lib/domain/mentalLoad';
import { toFrDate } from '@/lib/validation';
import { spacing } from '@/theme/tokens';
import { HmFixTray, HmHero, HmRow } from './kit';

const long = (iso: string) => formatDate(iso, { day: 'numeric', month: 'short', year: 'numeric' });

export function PaperTrack({ papers, today, nameOf }: { papers: readonly FamilyPaper[]; today: string; nameOf: (childId: string | null) => string | null }) {
  const inv = useInvalidate();
  const { paper: param } = useLocalSearchParams<{ paper?: string }>();
  const label = (p: FamilyPaper) => { const n = nameOf(p.child_id); return n ? `${tr(`cm.pp.k.${p.kind}` as TKey)} (${n})` : tr(`cm.pp.k.${p.kind}` as TKey); };
  const next = nextExpiry(papers, today);
  const st = papers.map((p) => paperStatus(p, today));
  const renew = st.filter((s) => s === 'expiring' || s === 'expired').length;
  const dated = papers.filter((p) => p.expires_on).sort((a, b) => (a.expires_on! < b.expires_on! ? -1 : 1));
  const opened = param ? papers.find((p) => p.id === param) ?? null : null;
  const value = next ? String(Math.abs(next.days)) : null;
  const unit = next ? `${tr(next.days < 0 ? 'hm.pp.since' : 'hm.pp.until', { count: Math.abs(next.days) })} · ${label(next.paper)} · ${long(next.paper.expires_on!)}` : null;
  return (
    <View style={{ gap: spacing.sm }} testID="hm-pp">
      <HmHero testID="hm-pp-hero" value={value} unit={unit} emptyLabel={tr('hm.pp.none')}
        split={papers.length ? [
          { label: tr('hm.pp.renew'), value: String(renew), testID: 'hm-pp-renew' },
          { label: tr('hm.pp.ok'), value: String(st.filter((s) => s === 'ok').length), testID: 'hm-pp-ok' },
          { label: tr('hm.pp.noPhoto'), value: String(st.filter((s) => s === 'no_photo').length), testID: 'hm-pp-nophoto' },
        ] : undefined} />
      {dated.length ? (
        <View testID="hm-pp-list">
          <Text variant="label" muted>{tr('hm.pp.dates')}</Text>
          <MotionList>{dated.map((p) => {
            const d = daysUntil(today, p.expires_on!);
            return <MotionItem key={p.id}><HmRow key={p.id} time={formatDate(p.expires_on!, { day: 'numeric', month: 'short' })} icon={d < 0 ? 'alert-triangle' : d <= 60 ? 'clock' : 'check-circle'}
              title={label(p)} detail={`${tr(d < 0 ? 'hm.pp.sinceShort' : 'hm.pp.untilShort', { count: Math.abs(d) })} · ${long(p.expires_on!)}`}
              testID={`hm-pp-row-${p.kind}`} onPress={() => router.setParams({ paper: p.id } as never)} /></MotionItem>;
          })}</MotionList>
        </View>
      ) : null}
      {opened ? (
        <HmFixTray open onOpenChange={(v) => { if (!v) router.setParams({ paper: undefined } as never); }} testID="hm-pp-tray"
          title={label(opened)} hero={opened.expires_on ? long(opened.expires_on) : tr('hm.nothing')}
          lines={[opened.expires_on ? tr(daysUntil(today, opened.expires_on) < 0 ? 'hm.pp.since' : 'hm.pp.until', { count: Math.abs(daysUntil(today, opened.expires_on)) }) : null, tr(`cm.pp.st.${paperStatus(opened, today)}` as TKey)]}
          editLabel={tr('hm.pp.fix')}
          fields={[{ key: 'date', label: tr('cm.pp.expires'), kind: 'date', hint: tr('hm.pp.emptyHint') }]}
          initial={{ date: opened.expires_on ? toFrDate(opened.expires_on) : '' }}
          validate={(d) => (d.date.trim() && !frToISO(d.date) ? tr('hm.fix.badDate') : null)}
          onSave={async (d) => {
            const iso = d.date.trim() ? frToISO(d.date) : null;
            if (d.date.trim() && !iso) return tr('hm.fix.badDate');
            try { await backend.update('family_papers', { expires_on: iso }, [eq('id', opened.id)]); inv('family_papers'); return 'ok'; } catch (e) { return friendlyError(e); }
          }} />
      ) : null}
    </View>
  );
}
