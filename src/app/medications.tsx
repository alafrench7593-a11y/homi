/**
 * « Médicaments » (07/11/2026) : les traitements de la maman (personnels) et ceux des enfants, au même endroit.
 *  - Aujourd'hui : toutes les prises prévues de la famille, à cocher en un geste (un second appui décoche) ;
 *  - Pour qui ? : le panneau complet (Pris, Reporter, Ignorer, note, ajout et modification) de la personne choisie.
 * Les rappels de chaque prise et la relance (30 min après si rien n'est noté) sont programmés sur le téléphone.
 * Règle absolue : nom et dose recopiés de l'ordonnance ou de la notice ; aucune dose calculée ni proposée.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Tappable } from '@/components/Tappable';
import { useToast } from '@/components/Overlays';
import { Banner, Card, Chip, haptic, Icon, Row, SectionTitle, Text } from '@/components/ui';
import { ChildAvatar } from '@/features/childAvatar';
import { dosesFor } from '@/features/needs';
import { TreatmentsPanel, type TreatmentScope } from '@/features/treatments/TreatmentsPanel';
import { useChildren, useJourneyState } from '@/lib/data/hooks';
import { useNow } from '@/lib/data/hooks-bottle';
import { useLogDose } from '@/lib/data/hooks-needs';
import { useDoseLogsSince, useFamilyChildTreatments, useLogMyDose, useMyTreatments, useUnlogDose } from '@/lib/data/hooks-myTreatments';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

interface Row4 { key: string; time: string; who: string; childId: string | null; name: string; dose: string; treatmentId: string; scheduledFor: string; log: { id: string; status: 'taken' | 'snoozed' | 'skipped' } | null }

export default function Medications() {
  const params = useLocalSearchParams<{ who?: string; dose?: string; time?: string }>();
  const th = useTheme();
  const toast = useToast();
  const now = useNow(60_000);
  const children = useChildren().data ?? [];
  const js = useJourneyState();
  const [who, setWho] = useState<string>(params.who && params.who !== 'me' && children.some((c) => c.id === params.who) ? params.who : params.who ?? 'me');
  const dayStart = useMemo(() => { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }, [now.toDateString()]); // eslint-disable-line react-hooks/exhaustive-deps
  const mine = useMyTreatments().data ?? [];
  const childT = useFamilyChildTreatments().data ?? [];
  const logs = useDoseLogsSince(dayStart.toISOString());
  const logMine = useLogMyDose();
  const logChild = useLogDose();
  const unlog = useUnlogDose();

  const rows: Row4[] = useMemo(() => {
    const out: Row4[] = [];
    for (const d of dosesFor(dayStart, mine, logs.mine ?? [])) {
      out.push({ key: `me-${d.treatment.id}-${d.time}`, time: d.time, who: tr('med.me'), childId: null, name: d.treatment.name, dose: d.treatment.dose_text, treatmentId: d.treatment.id, scheduledFor: d.scheduledFor, log: d.log });
    }
    for (const c of children) {
      for (const d of dosesFor(dayStart, childT.filter((t) => t.child_id === c.id), logs.child ?? [])) {
        out.push({ key: `${c.id}-${d.treatment.id}-${d.time}`, time: d.time, who: c.first_name, childId: c.id, name: d.treatment.name, dose: d.treatment.dose_text, treatmentId: d.treatment.id, scheduledFor: d.scheduledFor, log: d.log });
      }
    }
    return out.sort((a, b) => a.time.localeCompare(b.time) || a.who.localeCompare(b.who));
  }, [dayStart, mine, childT, children, logs.mine, logs.child]);
  const done = rows.filter((r) => r.log?.status === 'taken').length;

  async function toggle(r: Row4) {
    haptic('success');
    try {
      if (r.log?.status === 'taken') await unlog.mutateAsync({ table: r.childId ? 'treatment_logs' : 'my_treatment_logs', id: r.log.id });
      else {
        const v = { treatment_id: r.treatmentId, scheduled_for: r.scheduledFor, status: 'taken' as const, existingId: r.log?.id };
        if (r.childId) await logChild.mutateAsync(v); else await logMine.mutateAsync(v);
      }
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  const scope: TreatmentScope = who === 'me' ? { kind: 'me' } : { kind: 'child', childId: who, childName: children.find((c) => c.id === who)?.first_name ?? '' };
  const showPregnant = js.active.some((j) => j.type === 'pregnancy' || j.type === 'postpartum' || j.type === 'baby');

  return (
    <Screen back title={tr('med.title')} subtitle={tr('med.subtitle')}>
      <Banner tone="warning" icon="alert-triangle">{tr('med.rule')}</Banner>
      {showPregnant ? <Banner tone="info">{tr('med.pregnant')}</Banner> : null}

      <SectionTitle title={tr('med.today')} />
      <Card testID="med-today">
        {rows.length ? <Text variant="small" muted style={{ marginBottom: 4 }}>{tr('med.todayCount', { done, total: rows.length })}</Text> : <Text muted>{tr('med.todayNone')}</Text>}
        {rows.map((r) => {
          const taken = r.log?.status === 'taken';
          const title = `${r.who} · ${r.name}`;
          return (
            <Row key={r.key} style={{ alignItems: 'center', gap: spacing.md, paddingVertical: 8 }}>
              <Tappable bare accessibilityRole="checkbox" accessibilityState={{ checked: taken }} aria-checked={taken}
                accessibilityLabel={taken ? tr('med.untick', { title }) : tr('med.tick', { title })} onPress={() => void toggle(r)} hitSlop={8} testID={`med-check-${r.key}`}
                style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: taken ? th.colors.success : th.colors.primary, backgroundColor: taken ? th.colors.success : 'transparent' }}>
                {taken ? <Icon name="check" size={20} color="#FFFFFF" /> : null}
              </Tappable>
              <View style={{ flex: 1 }}>
                <Text weight="bold">{r.time} · {r.who}</Text>
                <Text variant="small">{r.name} — {r.dose}</Text>
                <Text variant="caption" weight="bold" color={taken ? th.colors.success : undefined} muted={!r.log}>{tr(`med.status.${r.log?.status ?? 'todo'}` as TKey)}</Text>
              </View>
            </Row>
          );
        })}
      </Card>

      <SectionTitle title={tr('med.who')} />
      <Row wrap style={{ gap: 6 }}>
        <Chip label={tr('med.me')} icon="user" selected={who === 'me'} onPress={() => setWho('me')} testID="med-who-me" />
        {children.map((c) => <Chip key={c.id} label={c.first_name} selected={who === c.id} onPress={() => setWho(c.id)} testID={`med-who-${c.first_name}`} />)}
      </Row>
      <Card tone="soft">
        <Row style={{ alignItems: 'center', gap: spacing.sm }}>
          {scope.kind === 'child' ? <ChildAvatar child={children.find((c) => c.id === who)!} size={36} /> : <Icon name="lock" size={18} />}
          <View style={{ flex: 1 }}>
            <Text weight="bold">{scope.kind === 'me' ? tr('med.mineTitle') : tr('med.childTitle', { name: scope.childName })}</Text>
            <Text variant="small" muted>{scope.kind === 'me' ? tr('med.mineHint') : tr('med.childHint', { name: scope.childName })}</Text>
          </View>
        </Row>
      </Card>
      <TreatmentsPanel key={who} scope={scope} compact noteDose={params.dose} askTime={params.time} />
    </Screen>
  );
}
