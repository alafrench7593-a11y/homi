/**
 * « Je suis à bout » : 6 questions sur les 2 dernières semaines, un niveau de fatigue RESSENTIE (jamais un diagnostic),
 * des pistes concrètes (relais, je décroche, temps pour soi) et, selon le niveau, l'orientation vers un professionnel
 * et les numéros d'écoute. Strictement personnel : jamais visible du conjoint ni du foyer.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Text } from '@/components/ui';
import { backend } from '@/lib/backend';
import { useUserId } from '@/lib/auth';
import { useInvalidate } from '@/lib/data/hooks';
import { useTapShield } from '@/features/tapShield';
import { useExhaustionCheckins } from '@/lib/data/hooks-mental';
import { friendlyError } from '@/lib/data/hooks-settings';
import { EXHAUSTION_QUESTIONS, exhaustionLevel, type ExhaustionLevel } from '@/lib/domain/mentalLoad';
import { callNumber } from '@/lib/links';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

export default function Exhausted() {
  const toast = useToast();
  const inv = useInvalidate();
  const uid = useUserId();
  const past = useExhaustionCheckins().data ?? [];
  const [answers, setAnswers] = useState<(number | null)[]>(EXHAUSTION_QUESTIONS.map(() => null));
  const [result, setResult] = useState<ExhaustionLevel | null>(null);
  const complete = answers.every((a) => a != null);
  // Le résultat prend la place des questions : un double appui sur « Voir où j'en suis » n'ouvre pas une piste
  const { arm, guard } = useTapShield();

  async function finish() {
    const vals = answers.map((a) => a ?? 0);
    const { level } = exhaustionLevel(vals);
    arm();
    setResult(level);
    try {
      await backend.insert('exhaustion_checkins', { user_id: uid, answers: vals });
      inv('exhaustion_checkins');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('tool.exhaustion_check')} subtitle={tr('tool.exhaustion_check.sub')}>
      <Text muted>{tr('cm.ex.intro')}</Text>
      {!result ? (
        <>
          {EXHAUSTION_QUESTIONS.map((q, i) => (
            <Card key={q} testID={`ex-q-${q}`}>
              <Text weight="bold">{tr(`cm.ex.q.${q}` as TKey)}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.xs }}>
                {[0, 1, 2, 3].map((v) => <Chip key={v} label={tr(`cm.ex.a.${v}` as TKey)} selected={answers[i] === v} onPress={() => setAnswers((a) => a.map((x, j) => (j === i ? v : x)))} testID={`ex-${q}-${v}`} />)}
              </View>
            </Card>
          ))}
          <Button label={tr('cm.ex.see')} disabled={!complete} onPress={() => void finish()} testID="ex-done" />
        </>
      ) : (
        <>
          <Card tone={result === 'high' ? 'danger' : result === 'medium' ? 'gold' : 'soft'} testID={`ex-result-${result}`}>
            <Text variant="title">{tr(`cm.ex.r.${result}` as TKey)}</Text>
            <Text>{tr(`cm.ex.r.${result}.d` as TKey)}</Text>
          </Card>
          <Button label={tr('tool.offduty')} icon="moon" onPress={guard(() => router.push('/family/offduty'))} />
          <Button label={tr('cm.ex.relay')} icon="users" variant="secondary" onPress={guard(() => router.push('/family/nights'))} />
          <Button label={tr('cm.ex.metime')} icon="sun" variant="secondary" onPress={guard(() => router.push('/family/me-time'))} />
          {result !== 'low' ? <Banner tone="info" icon="user-check">{tr('cm.ex.pro')}</Banner> : null}
          <Button label={tr('cm.ex.allo')} icon="phone" variant="ghost" onPress={guard(() => callNumber('0800003456', toast))} />
          <Button label={tr('cm.ex.retake')} variant="ghost" onPress={guard(() => { setResult(null); setAnswers(EXHAUSTION_QUESTIONS.map(() => null)); })} />
        </>
      )}
      <Banner tone="danger" icon="alert-octagon">{tr('cm.ex.urgent')}</Banner>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <View style={{ flex: 1 }}><Button label="3114" icon="phone" variant="secondary" onPress={() => callNumber('3114', toast)} /></View>
        <View style={{ flex: 1 }}><Button label="15" icon="phone" variant="secondary" onPress={() => callNumber('15', toast)} /></View>
      </View>
      {past.length ? (
        <Card tone="soft">
          <Text variant="label">{tr('cm.ex.history')}</Text>
          {past.slice(0, 6).map((p) => <Text key={p.id} variant="small">{formatDate(p.created_at, { day: 'numeric', month: 'short' })} · {tr(`cm.ex.r.${exhaustionLevel(p.answers).level}` as TKey)}</Text>)}
        </Card>
      ) : null}
      <Text variant="caption" muted>{tr('cm.ex.private')}</Text>
    </Screen>
  );
}
