/** Interrupteur avec son libellé visible (le composant Toggle n'affiche que l'interrupteur). */
import React from 'react';
import { View } from 'react-native';
import { Row, Text, Toggle } from '@/components/ui';

export function ToggleRow({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row style={{ alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Text weight="medium">{label}</Text>
        {hint ? <Text variant="caption" muted>{hint}</Text> : null}
      </View>
      <Toggle label={label} value={value} onChange={onChange} />
    </Row>
  );
}
