/** Univers de la grossesse : illustration 3D artistique, semaine par semaine, compte à rebours. */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { FetusArt } from '@/components/FetusArt';
import { WeeksRing } from '@/components/DayClock';
import { ProgressRing } from '@/components/Charts';
import { Banner, Button, Card, Chip, Field, Icon, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { backend, eq } from '@/lib/backend';
import { useActiveSubject, useAppointments, useExpectedBabies, useInvalidate, useJourneyState, usePregnancies, useProfile, useRows } from '@/lib/data/hooks';
import { useUiStore } from '@/lib/store';
import { friendlyError } from '@/lib/data/hooks-settings';
import { countdownLabel, multiplicityLabel, pregnancyProgress } from '@/lib/domain/pregnancy';
import { FETAL_SIZE_SOURCE, formatLength, formatWeight, weekInfo } from '@/lib/domain/fetalWeeks';
import { formatDateFr } from '@/lib/domain/dates';
import type { ExpectedBaby } from '@/lib/types';
import { Aurora } from '@/components/Aurora';
import { spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

const HUES = ['rose', 'lavande', 'or'] as const;

type Rubric = { key: string; icon: Parameters<typeof Icon>[0]['name']; title: string; subtitle?: string; to: string | { pathname: string; params?: Record<string, string> } };
/** Les 15 rubriques de « Ma grossesse », dans l'ordre demandé ; chacune ouvre un écran existant. */
function rubrics(showWeight: boolean, docs: number): Rubric[] {
  return [
    { key: 'week', icon: 'star', title: 'Mon bébé cette semaine', subtitle: 'Repères, développement, illustration', to: '#week' },
    { key: 'body', icon: 'heart', title: 'Mon corps', subtitle: 'Changements, petits maux, signes d’alerte', to: { pathname: '/library', params: { cat: 'grossesse' } } },
    ...(showWeight ? [{ key: 'weight', icon: 'trending-up', title: 'Mon poids', subtitle: 'Facultatif, sans objectif imposé', to: '/pregnancy/weight' } as Rubric] : []),
    { key: 'sleep', icon: 'moon', title: 'Mon sommeil', subtitle: 'Nuits, siestes, fatigue', to: '/me/sleep' },
    { key: 'mood', icon: 'smile', title: 'Mon humeur', subtitle: 'Comment je me sens', to: '/me/mood' },
    { key: 'meals', icon: 'coffee', title: 'Mes repas', subtitle: 'Recettes adaptées à la grossesse', to: '/meals' },
    { key: 'appointments', icon: 'calendar', title: 'Mes rendez-vous', to: { pathname: '/appointments', params: { for: 'pregnancy' } } },
    { key: 'exams', icon: 'clipboard', title: 'Mes examens', subtitle: 'Échographies, prises de sang, consultations', to: { pathname: '/appointments', params: { for: 'pregnancy' } } },
    { key: 'docs', icon: 'folder', title: 'Mes échographies et documents', subtitle: docs ? `${docs} document(s)` : undefined, to: '/documents' },
    { key: 'birth', icon: 'book-open', title: 'Préparer l’accouchement', subtitle: 'Signes du travail, péridurale, césarienne…', to: { pathname: '/library', params: { cat: 'accouchement' } } },
    { key: 'lists', icon: 'check-square', title: 'Liste de maternité', subtitle: 'Valise, papiers, chambre', to: '/lists' },
    { key: 'names', icon: 'type', title: 'Idées de prénoms', to: '/names' },
    { key: 'articles', icon: 'book', title: 'Articles grossesse', to: { pathname: '/library', params: { journey: 'pregnant' } } },
    { key: 'assistant', icon: 'message-circle', title: 'Assistant IA', subtitle: 'Questions générales, sans diagnostic', to: '/(tabs)/ask' },
    { key: 'community', icon: 'users', title: 'Communauté grossesse', to: '/(tabs)/community' },
    { key: 'supplement', icon: 'bell', title: 'Complément prescrit', subtitle: 'Fer, acide folique… seulement s’il a été prescrit ou conseillé', to: { pathname: '/settings/reminders', params: { new: 'supplement' } } },
  ];
}
const GOLD = '#FF8FB1';
const TEXT = '#F2DFC1';
const MUTED = '#B8A88F';

function BabyNotes({ baby }: { baby: ExpectedBaby }) {
  const toast = useToast();
  const inv = useInvalidate();
  const [nickname, setNickname] = useState(baby.nickname ?? '');
  const [notes, setNotes] = useState(baby.notes ?? '');
  const [saving, setSaving] = useState(false);
  async function save() {
    setSaving(true);
    try {
      await backend.update('expected_babies', { nickname: nickname.trim() || null, notes: notes.trim() || null }, [eq('id', baby.id)]);
      inv('expected_babies');
      toast('Enregistré.');
    } catch (err) {
      toast(friendlyError(err), 'error');
    } finally {
      setSaving(false);
    }
  }
  return (
    <Card>
      <Text weight="bold">Bébé {baby.position}</Text>
      <Field label="Surnom" optional value={nickname} onChangeText={setNickname} maxLength={40} />
      <Field label="Notes (ses propres notes, séparées des autres bébés)" optional value={notes} onChangeText={setNotes} multiline maxLength={4000} />
      <Button label="Enregistrer" size="sm" variant="secondary" style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }} loading={saving} onPress={save} />
    </Card>
  );
}

export default function PregnancyUniverse() {
  const pregnanciesQ = usePregnancies();
  // Seule la grossesse d'un parcours « grossesse » actif s'affiche (jamais une ancienne grossesse)
  const js = useJourneyState();
  const pregnancy = pregnanciesQ.data?.find((x) => x.status === 'active' && js.pregnancyIds.includes(x.id)) ?? null;
  const { data: babies } = useExpectedBabies(pregnancy?.id);
  const { data: profile } = useProfile();
  const p = pregnancy ? pregnancyProgress(pregnancy.due_date) : null;
  const [week, setWeek] = useState<number | null>(null);
  const [selected, setSelected] = useState(0);
  const simple = useUiStore((st) => st.simpleMode);
  const { setSubject } = useActiveSubject();
  const [allRubrics, setAllRubrics] = useState(false);
  const { data: appts } = useAppointments({ upcomingOnly: true });
  const { data: docs } = useRows<{ id: string }>(['documents', 'preg', pregnancy?.id ?? ''], pregnancy ? { table: 'documents', filters: [eq('pregnancy_id', pregnancy.id)] } : null);

  if (pregnanciesQ.isLoading && !pregnanciesQ.data) {
    return <Screen back title="Grossesse"><Skeleton kind="card" rows={3} /></Screen>;
  }
  if (pregnanciesQ.isError && !pregnanciesQ.data) {
    return <Screen back title="Grossesse"><ErrorView error={pregnanciesQ.error} onRetry={() => void pregnanciesQ.refetch()} /></Screen>;
  }
  if (!pregnancy || !p) {
    return (
      <Screen back title="Grossesse">
        <EmptyState icon="heart" title="Aucune grossesse en cours" body="Ajoutez une grossesse pour suivre chaque semaine, le terme prévu et vos rendez-vous." action={{ label: 'Ajouter une grossesse', onPress: () => router.replace('/profiles/new') }} />
      </Screen>
    );
  }
  const w = week ?? p.weeksSA;
  const info = weekInfo(w);
  const n = Math.max(1, babies?.length ?? 1);
  const multiple = pregnancy.multiplicity !== 'single' && pregnancy.multiplicity !== 'unknown';

  return (
    <Screen back stars>
      <View style={{ backgroundColor: 'rgba(28,17,40,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderRadius: 32, padding: spacing.lg, gap: spacing.sm, overflow: 'hidden' }}>
        <Aurora mood="night" intensity={1.2} />
        <Text variant="small" color={GOLD} center>{multiplicityLabel(pregnancy.multiplicity)}</Text>
        <Text variant="hero" color={TEXT} center>{w} SA</Text>
        <Text center color={MUTED}>{Math.max(0, w - 2)} semaines de grossesse, trimestre {w < 15 ? 1 : w < 29 ? 2 : 3}</Text>
        <View style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
          <WeeksRing week={w} size={310}><FetusArt week={w} growth={info.growth} size={n > 1 ? 220 : 250} hue={HUES[selected % 3]} accessibilityLabel={`Illustration artistique ${babies?.[selected]?.nickname ? 'de ' + babies[selected].nickname : 'du bébé'} à ${w} semaines d’aménorrhée. Glissez pour faire tourner.`} /></WeeksRing>
        </View>
        {n > 1 && (
          <Row wrap style={{ justifyContent: 'center' }}>
            {babies!.map((b, i) => <Chip key={b.id} label={b.nickname ?? `Bébé ${b.position}`} selected={selected === i} onPress={() => setSelected(i)} />)}
          </Row>
        )}
        <Text center color={TEXT}>À peu près de la taille d’<Text weight="bold" color={GOLD}>{info.compare.replace(/^une? /, (m) => m === 'une ' ? 'une ' : 'un ')}</Text></Text>
        <Text center variant="small" color={MUTED} testID="fetal-size">Taille moyenne {formatLength(info.lengthCm)} · poids moyen {formatWeight(info.weightG)}</Text>
        <Text center variant="caption" color={MUTED} testID="fetal-source">Moyennes générales, pas les mesures de votre bébé. Source : {FETAL_SIZE_SOURCE.name}, mis à jour le {formatDateFr(FETAL_SIZE_SOURCE.updatedOn)}.</Text>
        <Text center variant="caption" color={MUTED}>Illustration artistique et éducative : ce n’est pas une échographie ni une image de votre bébé. La lueur du cœur est décorative et ne mesure rien.</Text>
        {multiple && <Text center variant="caption" color={MUTED}>En cas de grossesse multiple, chaque bébé grandit à son propre rythme : ces repères ne permettent pas de les comparer.</Text>}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} accessibilityLabel="Choisir une semaine">
        {Array.from({ length: 39 }, (_, i) => i + 4).map((s) => (
          <Tappable key={s} accessibilityRole="button" accessibilityState={{ selected: s === w }} accessibilityLabel={`Semaine ${s}`} onPress={() => setWeek(s === p.weeksSA ? null : s)} style={{ width: 46, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: s === w ? '#FF8FB1' : s === p.weeksSA ? '#3A1D2E' : 'transparent', borderWidth: 1, borderColor: '#FF8FB155' }}>
            <Text variant="small" weight="bold" color={s === w ? '#1A0A13' : undefined}>{s}</Text>
          </Tappable>
        ))}
      </ScrollView>
      {week !== null && <Button label="Revenir à ma semaine" variant="ghost" size="sm" onPress={() => setWeek(null)} />}

      <Row style={{ gap: spacing.md }}>
        <ProgressRing progress={p.progress} size={112} label={`Progression de la grossesse : ${Math.round(p.progress * 100)} %`}>
          <Text variant="heading">{Math.round(p.progress * 100)}%</Text>
        </ProgressRing>
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="caption" muted>Terme prévu</Text>
          <Text variant="heading">{formatDateFr(pregnancy.due_date)}</Text>
          <Text>{countdownLabel(p.daysToDue)}</Text>
          <Text variant="caption" muted>{pregnancy.due_date_source === 'lmp' ? 'Estimé depuis la date des dernières règles' : 'Date indiquée par vous'}</Text>
        </View>
      </Row>

      <SectionTitle title="Cette semaine, chez le bébé" />
      <Card>{info.baby.map((b) => <Row key={b} style={{ alignItems: 'flex-start', paddingVertical: 4 }}><Icon name="star" size={14} /><Text style={{ flex: 1 }}>{b}</Text></Row>)}</Card>
      <SectionTitle title="Et chez vous, peut-être" />
      <Card tone="soft">{info.mother.map((m) => <Row key={m} style={{ alignItems: 'flex-start', paddingVertical: 4 }}><Icon name="heart" size={14} /><Text style={{ flex: 1 }}>{m}</Text></Row>)}</Card>
      <Banner tone="warning">{'Saignements, douleurs inhabituelles, fièvre, maux de tête intenses, troubles de la vue, bébé qui bouge moins : contactez sans attendre votre maternité ou le 15.'}</Banner>

      {(() => {
        const next = (appts ?? []).filter((x) => x.pregnancy_id === pregnancy.id && Date.parse(x.starts_at) >= Date.now()).sort((x, y) => x.starts_at.localeCompare(y.starts_at))[0];
        return (
          <Card onPress={() => router.push({ pathname: '/appointments', params: { for: 'pregnancy' } })} accessibilityLabel="Prochain rendez-vous de grossesse">
            <View testID="preg-next-appt"><ListRow icon="calendar" title={next ? next.title : 'Aucun rendez-vous à venir'} subtitle={next ? new Date(next.starts_at).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : 'Ajouter un rendez-vous ou un examen'} /></View>
          </Card>
        );
      })()}

      <SectionTitle title="Ma grossesse" />
      <Card>
        {(() => {
          const list = rubrics(!profile?.hide_weight_module, docs?.length ?? 0);
          const shown = simple && !allRubrics ? list.slice(0, 6) : list;
          return (
            <>
              {shown.map((r) => (
                <View key={r.key} testID={`preg-rubric-${r.key}`}>
                  <ListRow icon={r.icon} title={r.title} subtitle={r.subtitle} onPress={() => { if (r.to === '#week') { setWeek(null); return; } setSubject({ type: 'pregnancy', id: pregnancy.id }); router.push(r.to as never); }} />
                </View>
              ))}
              {simple && list.length > 6 ? <Button label={allRubrics ? 'Voir moins' : `Voir plus (${list.length - 6})`} variant="ghost" size="sm" onPress={() => setAllRubrics((v) => !v)} testID="preg-rubrics-more" /> : null}
            </>
          );
        })()}
        <ListRow icon="edit-3" title="Modifier la grossesse" subtitle="Date du terme, nombre de bébés" onPress={() => router.push('/pregnancy/edit')} />
      </Card>

      {multiple && (
        <>
          <SectionTitle title="Chaque bébé, ses propres notes" />
          {babies?.map((b) => <BabyNotes key={b.id} baby={b} />)}
          <Card tone="lavender" onPress={() => router.push({ pathname: '/assistant/chat', params: { q: 'Quelles questions poser à l’équipe médicale pour une grossesse multiple ?' } })}>
            <Text weight="bold">Questions à poser pour une grossesse multiple</Text>
            <Text variant="small" muted>Préparez votre prochain rendez-vous avec l’assistant.</Text>
          </Card>
        </>
      )}
    </Screen>
  );
}
