/**
 * Lumière JAUNE douce derrière une icône de la barre d'onglets (consigne de la propriétaire, 21/11/2026) : disque
 * radial centré, plus vif sous l'onglet actif, discret sinon ; aussi derrière « + ». Décoratif, ne capte pas le toucher.
 */
import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { TAB_LIGHT } from '@/theme/toolLogo';

export function TabLight({ size, active, children, testID }: { size: number; active: boolean; children: React.ReactNode; testID?: string }) {
  const uid = `tb${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const box = Math.round(size * 1.9);
  const a = active ? TAB_LIGHT.active : TAB_LIGHT.idle;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View pointerEvents="none" testID={testID} style={{ position: 'absolute', left: (size - box) / 2, top: (size - box) / 2, width: box, height: box }}>
        <Svg width={box} height={box} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id={uid} cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor={TAB_LIGHT.color} stopOpacity={a} />
              <Stop offset="0.55" stopColor={TAB_LIGHT.color} stopOpacity={a * 0.6} />
              <Stop offset="1" stopColor={TAB_LIGHT.color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={50} cy={50} r={50} fill={`url(#${uid})`} />
        </Svg>
      </View>
      {children}
    </View>
  );
}
