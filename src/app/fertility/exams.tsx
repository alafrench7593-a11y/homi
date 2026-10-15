/**
 * « Examens et consultations possibles en cas de difficulté à concevoir » — INFORMATIF uniquement.
 * Ne prescrit rien, ne pose aucun diagnostic : oriente vers un professionnel.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Chip, Row, SectionTitle, Text } from '@/components/ui';
import { consultationGuidance } from '@/lib/domain/cycle';
import { EXAMS_FOOTER, EXAMS_INTRO, POSSIBLE_EXAMS, WHEN_TO_TALK, WHO_TO_SEE } from '@/content/fertility';
import { spacing } from '@/theme/tokens';

const AGES = [{ label: 'Moins de 35 ans', value: 30 }, { label: '35 à 39 ans', value: 37 }, { label: '40 ans ou plus', value: 41 }];
const MONTHS = [{ label: 'Moins de 6 mois', value: 3 }, { label: '6 à 11 mois', value: 8 }, { label: '12 mois ou plus', value: 12 }];

const Bullets = ({ items }: { items: string[] }) => (
  <View style={{ gap: 6 }}>{items.map((i) => <Text key={i} variant="small">{`• ${i}`}</Text>)}</View>
);

export default function ExamsScreen() {
  const [age, setAge] = useState<number | null>(null);
  const [months, setMonths] = useState<number | null>(null);
  const [irregular, setIrregular] = useState(false);
  const [known, setKnown] = useState(false);
  const g = useMemo(() => consultationGuidance({ age, monthsTrying: months ?? 0, irregularCycles: irregular, knownCondition: known }), [age, months, irregular, known]);

  return (
    <Screen back title="Examens et consultations possibles" subtitle="En cas de difficulté à concevoir.">
      <Banner tone="info" title="Information, pas diagnostic">{EXAMS_INTRO}</Banner>

      <SectionTitle title="Quand en parler ?" />
      <Card><Bullets items={WHEN_TO_TALK} /></Card>

      <Card tone="lavender">
        <Text weight="bold">Un repère pour vous</Text>
        <Text variant="small" muted>Rien n’est enregistré : ces réponses servent uniquement à afficher le repère ci-dessous.</Text>
        <Text variant="label" style={{ marginTop: spacing.sm }}>Votre âge</Text>
        <Row wrap style={{ marginTop: 6 }}>{AGES.map((a) => <Chip key={a.label} label={a.label} selected={age === a.value} onPress={() => setAge(age === a.value ? null : a.value)} />)}</Row>
        <Text variant="label" style={{ marginTop: spacing.sm }}>Depuis combien de temps essayez-vous ?</Text>
        <Row wrap style={{ marginTop: 6 }}>{MONTHS.map((m) => <Chip key={m.label} label={m.label} selected={months === m.value} onPress={() => setMonths(months === m.value ? null : m.value)} />)}</Row>
        <Row wrap style={{ marginTop: spacing.sm }}>
          <Chip label="Cycles très irréguliers ou absents" selected={irregular} onPress={() => setIrregular((v) => !v)} />
          <Chip label="Antécédent ou situation connue" selected={known} onPress={() => setKnown((v) => !v)} />
        </Row>
        <View style={{ marginTop: spacing.sm, gap: 4 }}>
          {g.suggestTalkingNow ? (
            <>
              <Text weight="bold">Il peut être utile d’en parler dès maintenant à un professionnel.</Text>
              {g.reasons.map((r) => <Text key={r} variant="small">{`• ${r}`}</Text>)}
            </>
          ) : (
            <Text variant="small">{`Repère général : en parler après ${g.thresholdMonths} mois d’essais sans grossesse — ou plus tôt si vous en ressentez le besoin.`}</Text>
          )}
          <Text variant="caption" muted>Ce repère ne dit rien de votre fertilité : seul un professionnel peut évaluer votre situation.</Text>
        </View>
      </Card>

      <SectionTitle title="À qui en parler ?" />
      <Card><Bullets items={WHO_TO_SEE} /></Card>

      <SectionTitle title="Ce qui peut être discuté ou proposé" />
      <Text variant="small" muted>Selon votre situation, le professionnel peut évoquer certains examens. C’est lui qui décide de ce qui est utile : cette liste n’est ni complète ni une prescription.</Text>
      <Card>
        {POSSIBLE_EXAMS.map((e) => (
          <View key={e.title} style={{ gap: 2, paddingVertical: 6 }}>
            <Text weight="bold">{e.title}</Text>
            <Text variant="small">{e.text}</Text>
          </View>
        ))}
      </Card>
      <Text variant="small" muted>{EXAMS_FOOTER}</Text>
      <Banner tone="info" title="Prendre soin de soi">Les essais qui durent peuvent peser sur le moral et sur le couple. En parler — à un proche, un professionnel ou un psychologue — peut aider.</Banner>
      <Button label="Préparer mes questions" icon="help-circle" onPress={() => router.push('/fertility/consultation' as never)} />
    </Screen>
  );
}
