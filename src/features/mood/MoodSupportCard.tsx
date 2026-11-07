/**
 * Carte de soutien (07/11/2026) : apparaît seulement d'après ce que la personne a noté dans son bilan d'humeur
 * (privé) — plusieurs jours bas dans la semaine, ou une réponse inquiétante. Aucun score, aucun diagnostic.
 * Elle propose d'en parler (sage-femme, médecin, PMI), un relais, et les numéros d'aide ; masquable pour la semaine
 * (sauf en cas de réponse inquiétante : les numéros restent visibles).
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Banner, Button, Row, Text } from '@/components/ui';
import { EmergencyList } from '@/components/Family';
import { useMoods } from '@/lib/data/hooks';
import { moodSupport, weekKey } from '@/lib/domain/moodSupport';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

const KEY = 'toietmoi.mood-support-hidden.v1';

export function MoodSupportCard({ testID = 'mood-support' }: { testID?: string }) {
  const moods = useMoods(30).data;
  const [hiddenWeek, setHiddenWeek] = useState<string | null>(null);
  useEffect(() => { void AsyncStorage.getItem(KEY).then(setHiddenWeek).catch(() => undefined); }, []);
  const level = moods ? moodSupport(moods, new Date()) : null;
  const week = weekKey(new Date());
  if (!level || (level === 'low' && hiddenWeek === week)) return null;
  const urgent = level === 'urgent';
  return (
    <View testID={testID}>
      <Banner tone={urgent ? 'danger' : 'warning'} icon="heart" title={urgent ? tr('u8.mood.support.urgentTitle') : tr('ms.lowTitle')}
        action={
          <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
            {urgent ? <EmergencyList compact /> : null}
            <Row wrap style={{ gap: 6 }}>
              <Button label={tr('ms.talk')} icon="calendar" size="sm" variant="secondary" onPress={() => router.push('/appointments')} testID={`${testID}-talk`} />
              <Button label={tr('ms.relay')} icon="users" size="sm" variant="secondary" onPress={() => router.push('/family/offduty' as never)} testID={`${testID}-relay`} />
              <Button label={tr('u8.mood.support.allHelp')} icon="life-buoy" size="sm" variant="secondary" onPress={() => router.push('/emergency')} testID={`${testID}-help`} />
              {urgent ? null : <Button label={tr('ms.hide')} size="sm" variant="ghost" onPress={() => { setHiddenWeek(week); void AsyncStorage.setItem(KEY, week).catch(() => undefined); }} testID={`${testID}-hide`} />}
            </Row>
          </View>
        }>
        <Text variant="small">{urgent ? tr('u8.mood.support.urgent') : tr('ms.lowBody')}</Text>
      </Banner>
    </View>
  );
}
