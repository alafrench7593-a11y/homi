/**
 * Fond « Blanc nacré » (maquette validée le 23/11/2026, planches du brief PDF) : perle grise, deux reflets diagonaux
 * et trois sphères chromées. Statique (aucune animation, aucun flou calculé) : coût de rendu nul au défilement.
 * Affiché seulement pour le thème Blanc nacré en clair, et jamais avec « Réduire la transparence » (fond uni).
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { PEARL } from '@/theme/glass';

/** Une sphère chromée (dégradé radial : reflet en haut à gauche, ombre en bas à droite). */
function Orb({ size, style, id }: { size: number; style: object; id: string }) {
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="32%" cy="28%" r="75%" fx="32%" fy="28%">
            <Stop offset="0" stopColor={PEARL.orb[0]} />
            <Stop offset="0.18" stopColor={PEARL.orb[1]} />
            <Stop offset="0.45" stopColor={PEARL.orb[2]} />
            <Stop offset="0.75" stopColor={PEARL.orb[3]} />
            <Stop offset="1" stopColor={PEARL.orb[4]} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

/** Reflet : bande claire en biais, fondue sur ses bords (dégradé, pas de flou). */
function Sheen({ top, opacity }: { top: number; opacity: number }) {
  return (
    <LinearGradient pointerEvents="none" colors={[...PEARL.sheen]}
      start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      style={{ position: 'absolute', left: -120, right: -120, top, height: 110, opacity, transform: [{ rotate: '-32deg' }] }} />
  );
}

export function PearlBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="pearl-backdrop">
      <LinearGradient colors={[...PEARL.base]} locations={[0, 0.42, 0.7, 1]}
        start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      <Sheen top={140} opacity={0.75} />
      <Sheen top={520} opacity={0.55} />
      {/* Sphères à moitié hors de l'écran, au bord droit seulement : jamais sous un titre (marge de texte à gauche) */}
      <Orb id="pearl-orb-a" size={150} style={{ top: 150, right: -100 }} />
      <Orb id="pearl-orb-b" size={110} style={{ top: 470, right: -78 }} />
      <Orb id="pearl-orb-c" size={72} style={{ bottom: 160, right: -44 }} />
    </View>
  );
}
