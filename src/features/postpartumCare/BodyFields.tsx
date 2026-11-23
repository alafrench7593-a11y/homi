/**
 * 53 — Journal de récupération physique : cicatrice, périnée (ressenti noté) et saignements (niveau noté) dans le
 * point du jour post-partum. Tout est facultatif ; rien n'est interprété. Raccourcis vers les outils existants :
 * suivi de la cicatrisation (60, avec photo privée) et rééducation périnéale prescrite (58).
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Chip, Row, Text } from '@/components/ui';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';
import { BLEEDINGS, BODY_FEELINGS, type Bleeding, type BodyFeeling } from './domain';

function FeelingRow({ label, value, onChange, testID }: { label: string; value: BodyFeeling | null; onChange: (v: BodyFeeling | null) => void; testID: string }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label">{label}</Text>
      <Row wrap>
        {BODY_FEELINGS.map((f) => <Chip key={f} label={tr(`ppb.f.${f}` as TKey)} selected={value === f} onPress={() => onChange(value === f ? null : f)} testID={`${testID}-${f}`} />)}
      </Row>
    </View>
  );
}

export function BodyFields({ scar, perineum, bleeding, onScar, onPerineum, onBleeding }: {
  scar: BodyFeeling | null; perineum: BodyFeeling | null; bleeding: Bleeding | null;
  onScar: (v: BodyFeeling | null) => void; onPerineum: (v: BodyFeeling | null) => void; onBleeding: (v: Bleeding | null) => void;
}) {
  return (
    <View style={{ gap: spacing.sm }} testID="ppb-fields">
      <Text weight="bold">{tr('ppb.title')}</Text>
      <FeelingRow label={tr('ppb.scar')} value={scar} onChange={onScar} testID="ppb-scar" />
      <FeelingRow label={tr('ppb.perineum')} value={perineum} onChange={onPerineum} testID="ppb-perineum" />
      <View style={{ gap: spacing.xs }}>
        <Text variant="label">{tr('ppb.bleeding')}</Text>
        <Row wrap>
          {BLEEDINGS.map((b) => <Chip key={b} label={tr(`ppb.b.${b}` as TKey)} selected={bleeding === b} onPress={() => onBleeding(bleeding === b ? null : b)} testID={`ppb-bleeding-${b}`} />)}
        </Row>
      </View>
      <Text variant="caption" muted>{tr('ppb.note')}</Text>
      <Row wrap>
        <Button label={tr('ppb.healing')} icon="feather" size="sm" variant="ghost" onPress={() => router.push('/postpartum/healing')} testID="ppb-healing" />
        <Button label={tr('ppb.pelvic')} icon="activity" size="sm" variant="ghost" onPress={() => router.push('/postpartum/pelvic')} testID="ppb-pelvic" />
      </Row>
    </View>
  );
}
