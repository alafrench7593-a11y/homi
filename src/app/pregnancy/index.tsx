/** Univers de la grossesse : illustration 3D artistique, semaine par semaine, compte à rebours. */
import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { FetusOrb } from '@/components/FetusOrb';
import { WeeksRing } from '@/components/DayClock';
import { ProgressRing } from '@/components/Charts';
import { Banner, Button, Card, Chip, Field, Icon, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { backend, eq } from '@/lib/backend';
import { useActivePregnancy, useExpectedBabies, useInvalidate, useProfile, useRows } from '@/lib/data/hooks';
import { countdownLabel, multiplicityLabel, pregnancyProgress } from '@/lib/domain/pregnancy';
import { formatWeight, weekInfo } from '@/lib/domain/fetalWeeks';
import { formatDateFr } from '@/lib/domain/dates';
import type { ExpectedBaby } from '@/lib/types';
import { spacing } from '@/theme/tokens';

const HUES = ['rose', 'lavande', 'or'] as const;
const GOLD = '#E2B884';
const TEXT = '#F2DFC1';
const MUTED = '#B8A88F';

function BabyNotes({ baby }: { baby: ExpectedBaby }) {
  const toast = useToast();
  const inv = useInvalidate();
  const [nickname, setNickname] = useState(baby.nickname ?? '');
  const [notes, setNotes] = useState(baby.notes ?? '');
  return (
    <Card>
      <Text weight="bold">Bébé {baby.position}</Text>
      <Field label="Surnom" optional value={nickname} onChangeText={setNickname} maxLength={40} />
      <Field label="Notes (ses propres notes, séparées des autres bébés)" optional value={notes} onChangeText={setNotes} multiline maxLength={4000} />
      <Button label="Enregistrer" size="sm" variant="secondary" style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }} onPress={async () => {
        await backend.update('expected_babies', { nickname: nickname.trim() || null, notes: notes.trim() || null }, [eq('id', baby.id)]);
        inv('expected_babies');
        toast('Enregistré.');
      }} />
    </Card>
  );
}

export default function PregnancyUniverse() {
  const pregnancy = useActivePregnancy();
  const { data: babies } = useExpectedBabies(pregnancy?.id);
  const { data: profile } = useProfile();
  const p = pregnancy ? pregnancyProgress(pregnancy.due_date) : null;
  const [week, setWeek] = useState<number | null>(null);
  const [selected, setSelected] = useState(0);
  const { data: docs } = useRows<{ id: string }>(['documents', 'preg', pregnancy?.id ?? ''], pregnancy ? { table: 'documents', filters: [eq('pregnancy_id', pregnancy.id)] } : null);

  if (!pregnancy || !p) {
    return (
      <Screen back title="Grossesse">
        <Text muted>Aucune grossesse en cours.</Text>
        <Button label="Ajouter une grossesse" onPress={() => router.replace('/profiles/new')} />
      </Screen>
    );
  }
  const w = week ?? p.weeksSA;
  const info = weekInfo(w);
  const n = Math.max(1, babies?.length ?? 1);
  const multiple = pregnancy.multiplicity !== 'single' && pregnancy.multiplicity !== 'unknown';

  return (
    <Screen back stars>
      <View style={{ backgroundColor: '#1E2350', borderRadius: 36, padding: spacing.lg, gap: spacing.sm, overflow: 'hidden' }}>
        <Text variant="small" color={GOLD} center>{multiplicityLabel(pregnancy.multiplicity)}</Text>
        <Text variant="hero" color={TEXT} center>{w} SA</Text>
        <Text center color={MUTED}>{Math.max(0, w - 2)} semaines de grossesse, trimestre {w < 15 ? 1 : w < 29 ? 2 : 3}</Text>
        <View style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
          <WeeksRing week={w} size={310}><FetusOrb growth={info.growth} size={n > 1 ? 220 : 250} hue={HUES[selected % 3]} accessibilityLabel={`Illustration artistique ${babies?.[selected]?.nickname ? 'de ' + babies[selected].nickname : 'du bébé'} à ${w} semaines d’aménorrhée. Glissez pour faire tourner.`} /></WeeksRing>
        </View>
        {n > 1 && (
          <Row wrap style={{ justifyContent: 'center' }}>
            {babies!.map((b, i) => <Chip key={b.id} label={b.nickname ?? `Bébé ${b.position}`} selected={selected === i} onPress={() => setSelected(i)} />)}
          </Row>
        )}
        <Text center color={TEXT}>À peu près de la taille d’<Text weight="bold" color={GOLD}>{info.compare.replace(/^une? /, (m) => m === 'une ' ? 'une ' : 'un ')}</Text></Text>
        <Text center variant="small" color={MUTED}>Environ {info.lengthCm} cm ({info.lengthKind}) et {formatWeight(info.weightG).replace('environ ', '')}</Text>
        <Text center variant="caption" color={MUTED}>Illustration artistique et éducative : ce n’est pas une échographie ni une image de votre bébé. La lueur du cœur est décorative et ne mesure rien.</Text>
        {multiple && <Text center variant="caption" color={MUTED}>En cas de grossesse multiple, chaque bébé grandit à son propre rythme : ces repères ne permettent pas de les comparer.</Text>}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} accessibilityLabel="Choisir une semaine">
        {Array.from({ length: 39 }, (_, i) => i + 4).map((s) => (
          <Pressable key={s} accessibilityRole="button" accessibilityState={{ selected: s === w }} accessibilityLabel={`Semaine ${s}`} onPress={() => setWeek(s === p.weeksSA ? null : s)} style={{ width: 46, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: s === w ? '#C6A15B' : s === p.weeksSA ? '#2A3157' : 'transparent', borderWidth: 1, borderColor: '#C6A15B55' }}>
            <Text variant="small" weight="bold" color={s === w ? '#120F1E' : undefined}>{s}</Text>
          </Pressable>
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

      <SectionTitle title="Organiser" />
      <Card>
        {!profile?.hide_weight_module && <ListRow icon="trending-up" title="Mon poids" subtitle="Facultatif, sans objectif imposé" onPress={() => router.push('/pregnancy/weight')} />}
        <ListRow icon="calendar" title="Rendez-vous, échographies, examens" onPress={() => router.push('/appointments')} />
        <ListRow icon="check-square" title="Listes de préparation" onPress={() => router.push('/lists')} />
        <ListRow icon="folder" title="Échographies et documents" subtitle={docs?.length ? `${docs.length} document(s)` : undefined} onPress={() => router.push('/documents')} />
        <ListRow icon="star" title="Idées de prénoms" onPress={() => router.push('/names')} />
        <ListRow icon="book-open" title="Préparer l’accouchement" subtitle="Signes du travail, péridurale, césarienne…" onPress={() => router.push('/(tabs)/discover')} />
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
