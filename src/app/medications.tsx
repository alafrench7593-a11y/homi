/**
 * « Médicaments » (07/11/2026) : les traitements de la maman (personnels) et ceux des enfants, au même endroit.
 *  - Aujourd'hui : toutes les prises prévues de la famille, à cocher en un geste (un second appui décoche) ;
 *  - Pour qui ? : le panneau complet (Pris, Reporter, Ignorer, note, ajout et modification) de la personne choisie.
 * Les rappels de chaque prise et la relance (30 min après si rien n'est noté) sont programmés sur le téléphone.
 * Règle absolue : nom et dose recopiés de l'ordonnance ou de la notice ; aucune dose calculée ni proposée.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { ErrorView, Skeleton } from '@/components/States';
import { Banner, Card, Chip, haptic, Icon, Row, SectionTitle, Text } from '@/components/ui';
import { DoseDay, type DoseAnswer, type DoseRow } from '@/features/healthTrack/DoseDay';
import { dayStarts } from '@/lib/domain/healthTrack';
import { dayKey } from '@/lib/domain/quickTrack';
import { ChildAvatar } from '@/features/childAvatar';
import { dosesFor } from '@/features/needs';
import { TreatmentsPanel, type TreatmentScope } from '@/features/treatments/TreatmentsPanel';
import { useChildren, useJourneyState } from '@/lib/data/hooks';
import { useNow } from '@/lib/data/hooks-bottle';
import { useLogDose } from '@/lib/data/hooks-needs';
import { useDoseLogsSince, useFamilyChildTreatments, useLogMyDose, useMyTreatments, useUnlogDose } from '@/lib/data/hooks-myTreatments';
import { friendlyError } from '@/lib/data/hooks-settings';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

/** Référence stable : un `?? []` neuf à chaque rendu relançait le calcul des prises des 7 jours. */
const NONE: never[] = [];

export default function Medications() {
  const params = useLocalSearchParams<{ who?: string; dose?: string; time?: string; day?: string }>();
  const toast = useToast();
  const now = useNow(60_000);
  const children = useChildren().data ?? NONE;
  const js = useJourneyState();
  const [who, setWho] = useState<string>(params.who && params.who !== 'me' && children.some((c) => c.id === params.who) ? params.who : params.who ?? 'me');
  // 7 derniers jours (prises prévues et réponses notées) ; le jour choisi reste dans l'adresse (`?day=`)
  const starts = useMemo(() => dayStarts(now, 7), [now.toDateString()]); // eslint-disable-line react-hooks/exhaustive-deps
  const mineQ = useMyTreatments();
  const childTQ = useFamilyChildTreatments();
  const mine = mineQ.data ?? NONE;
  const childT = childTQ.data ?? NONE;
  const dosesLoading = (mineQ.isLoading && !mineQ.data) || (childTQ.isLoading && !childTQ.data);
  const dosesFailed = (mineQ.isError && !mineQ.data) || (childTQ.isError && !childTQ.data);
  // Une prise à la fois : un double appui ne crée pas deux enregistrements
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const logs = useDoseLogsSince(starts[0].toISOString());
  const logMine = useLogMyDose();
  const logChild = useLogDose();
  const unlog = useUnlogDose();

  const days = useMemo(() => starts.map((dayStart) => {
    const out: DoseRow[] = [];
    for (const d of dosesFor(dayStart, mine, logs.mine ?? [])) {
      out.push({ key: `me-${d.treatment.id}-${d.scheduledFor}`, time: d.time, who: tr('med.me'), childId: null, name: d.treatment.name, dose: d.treatment.dose_text, treatmentId: d.treatment.id, scheduledFor: d.scheduledFor, log: d.log });
    }
    for (const c of children) {
      for (const d of dosesFor(dayStart, childT.filter((t) => t.child_id === c.id), logs.child ?? [])) {
        out.push({ key: `${c.id}-${d.treatment.id}-${d.scheduledFor}`, time: d.time, who: c.first_name, childId: c.id, name: d.treatment.name, dose: d.treatment.dose_text, treatmentId: d.treatment.id, scheduledFor: d.scheduledFor, log: d.log });
      }
    }
    return { day: dayKey(dayStart), rows: out.sort((a, b) => a.time.localeCompare(b.time) || a.who.localeCompare(b.who)) };
  }), [starts, mine, childT, children, logs.mine, logs.child]);
  const today = days[days.length - 1];
  const selected = days.find((d) => d.day === params.day) ?? today;

  // Première réponse (case à cocher ou fiche) : même chemin, file hors connexion comprise ; heure réelle notée
  const answer: DoseAnswer = async (r, at, status) => {
    const v = { treatment_id: r.treatmentId, scheduled_for: r.scheduledFor, status, existingId: r.log?.id, logged_at: (at ?? new Date()).toISOString() };
    const res = r.childId ? await logChild.mutateAsync(v) : await logMine.mutateAsync(v);
    if (res === 'queued') toast(tr('u7.track.queued'), 'info');
  };
  async function toggle(r: DoseRow) {
    if (pendingKey) return;
    setPendingKey(r.key);
    // Retour à l'appui, accordé à l'événement : « validé » pour une prise cochée, simple cran pour une prise décochée
    haptic(r.log?.status === 'taken' ? 'selection' : 'success');
    try {
      if (r.log?.status === 'taken') await unlog.mutateAsync({ table: r.childId ? 'treatment_logs' : 'my_treatment_logs', id: r.log.id });
      else await answer(r, undefined, 'taken');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setPendingKey(null); }
  }

  const scope: TreatmentScope = who === 'me' ? { kind: 'me' } : { kind: 'child', childId: who, childName: children.find((c) => c.id === who)?.first_name ?? '' };
  const showPregnant = js.active.some((j) => j.type === 'pregnancy' || j.type === 'postpartum' || j.type === 'baby');

  return (
    <Screen back title={tr('med.title')} subtitle={tr('med.subtitle')}>
      <Banner tone="warning" icon="alert-triangle">{tr('med.rule')}</Banner>
      {showPregnant ? <Banner tone="info">{tr('med.pregnant')}</Banner> : null}

      <SectionTitle title={tr('med.today')} />
      {/* Chargement et erreur réels : jamais « aucune prise prévue » tant que les traitements ne sont pas connus */}
      {dosesLoading ? <Skeleton kind="card" rows={2} /> : dosesFailed ? (
        <ErrorView error={mineQ.error ?? childTQ.error} onRetry={() => { void mineQ.refetch(); void childTQ.refetch(); }} />
      ) : <DoseDay days={days} selected={selected.day} onSelectDay={(day) => router.setParams({ day } as never)} rows={selected.rows}
        onToggle={(r) => void toggle(r)} onAnswer={answer} isToday={selected.day === today.day} />}

      <SectionTitle title={tr('med.who')} />
      <Row wrap gap={spacing.xs}>
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
