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
import { t as tr } from '@/i18n';

const AGES = [{ k: 'u3.fertExams.age1', value: 30 }, { k: 'u3.fertExams.age2', value: 37 }, { k: 'u3.fertExams.age3', value: 41 }] as const;
const MONTHS = [{ k: 'u3.fertExams.mo1', value: 3 }, { k: 'u3.fertExams.mo2', value: 8 }, { k: 'u3.fertExams.mo3', value: 12 }] as const;

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
    <Screen back title={tr('u3.fertExams.title')} subtitle={tr('u3.fertExams.subtitle')}>
      <Banner tone="info" title={tr('u3.fertExams.infoT')}>{EXAMS_INTRO}</Banner>

      <SectionTitle title={tr('u3.fertExams.when')} />
      <Card><Bullets items={WHEN_TO_TALK} /></Card>

      <Card tone="lavender">
        <Text weight="bold">{tr('u3.fertExams.hint')}</Text>
        <Text variant="small" muted>{tr('u3.fertExams.nothingSaved')}</Text>
        <Text variant="label" style={{ marginTop: spacing.sm }}>{tr('u3.fertExams.yourAge')}</Text>
        <Row wrap style={{ marginTop: 6 }}>{AGES.map((a) => <Chip key={a.k} label={tr(a.k)} selected={age === a.value} onPress={() => setAge(age === a.value ? null : a.value)} />)}</Row>
        <Text variant="label" style={{ marginTop: spacing.sm }}>{tr('u3.fertExams.howLong')}</Text>
        <Row wrap style={{ marginTop: 6 }}>{MONTHS.map((m) => <Chip key={m.k} label={tr(m.k)} selected={months === m.value} onPress={() => setMonths(months === m.value ? null : m.value)} />)}</Row>
        <Row wrap style={{ marginTop: spacing.sm }}>
          <Chip label={tr('u3.fertExams.irreg')} selected={irregular} onPress={() => setIrregular((v) => !v)} />
          <Chip label={tr('u3.fertExams.known')} selected={known} onPress={() => setKnown((v) => !v)} />
        </Row>
        <View style={{ marginTop: spacing.sm, gap: 4 }}>
          {g.suggestTalkingNow ? (
            <>
              <Text weight="bold">{tr('u3.fertExams.talkNow')}</Text>
              {g.reasons.map((r) => <Text key={r} variant="small">{`• ${r}`}</Text>)}
            </>
          ) : (
            <Text variant="small">{tr('u3.fertExams.general', { months: g.thresholdMonths })}</Text>
          )}
          <Text variant="caption" muted>{tr('u3.fertExams.noFert')}</Text>
        </View>
      </Card>

      <SectionTitle title={tr('u3.fertExams.who')} />
      <Card><Bullets items={WHO_TO_SEE} /></Card>

      <SectionTitle title={tr('u3.fertExams.disc')} />
      <Text variant="small" muted>{tr('u3.fertExams.discNote')}</Text>
      <Card>
        {POSSIBLE_EXAMS.map((e) => (
          <View key={e.title} style={{ gap: 2, paddingVertical: 6 }}>
            <Text weight="bold">{e.title}</Text>
            <Text variant="small">{e.text}</Text>
          </View>
        ))}
      </Card>
      <Text variant="small" muted>{EXAMS_FOOTER}</Text>
      <Banner tone="info" title={tr('u3.fertExams.care')}>{tr('u3.fertExams.careBody')}</Banner>
      <Button label={tr('u3.fertExams.prep')} icon="help-circle" onPress={() => router.push('/fertility/consultation' as never)} />
    </Screen>
  );
}
