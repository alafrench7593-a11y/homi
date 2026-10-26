/**
 * Illustrations originales, volontairement abstraites : silhouettes douces,
 * carnations variées, familles de toutes formes, sans stéréotype de genre.
 */
import React from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

export const SKIN_TONES = ['#F3D3BF', '#E0B192', '#C68B66', '#9C6644', '#6F4730', '#4A2F21'];

function Person({ x, y, scale = 1, skin, cloth, hair }: { x: number; y: number; scale?: number; skin: string; cloth: string; hair: string }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${scale})`}>
      <Path d="M-24 64 C -24 30, 24 30, 24 64 Z" fill={cloth} />
      <Circle cx="0" cy="14" r="15" fill={skin} />
      <Path d="M-15 12 C -15 -4, 15 -4, 15 10 C 8 4, -6 4, -15 12 Z" fill={hair} />
    </G>
  );
}

/** Scène d'accueil : trois foyers différents réunis sous une même lune. */
export function WelcomeIllustration({ size = 300 }: { size?: number }) {
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 300 240" accessibilityElementsHidden importantForAccessibility="no">
      <Defs>
        <RadialGradient id="moon" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#FFF4DD" />
          <Stop offset="100%" stopColor="#F0D9A8" />
        </RadialGradient>
        <LinearGradient id="hill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#EBCFC8" />
          <Stop offset="100%" stopColor="#E6D6C2" />
        </LinearGradient>
      </Defs>
      <Circle cx="150" cy="78" r="58" fill="url(#moon)" opacity={0.9} />
      <Circle cx="150" cy="78" r="80" fill="#F0D9A8" opacity={0.12} />
      <Path d="M0 190 C 70 150, 120 168, 160 176 C 210 186, 250 160, 300 170 L 300 240 L 0 240 Z" fill="url(#hill)" />
      <Person x={70} y={128} skin={SKIN_TONES[4]} cloth="#B9AEDB" hair="#2B2433" />
      <Person x={96} y={150} scale={0.6} skin={SKIN_TONES[4]} cloth="#D58D72" hair="#2B2433" />
      <Person x={150} y={118} skin={SKIN_TONES[1]} cloth="#D58D72" hair="#6B4A3A" />
      <Person x={176} y={124} skin={SKIN_TONES[0]} cloth="#B9654C" hair="#C9A45C" />
      <Ellipse cx="163" cy="168" rx="11" ry="8" fill="#F7F1E8" />
      <Circle cx="163" cy="160" r="7" fill={SKIN_TONES[0]} />
      <Person x={236} y={130} skin={SKIN_TONES[2]} cloth="#6E5FA8" hair="#2B2433" />
      <Person x={258} y={156} scale={0.5} skin={SKIN_TONES[2]} cloth="#EBCFC8" hair="#2B2433" />
      <Person x={218} y={158} scale={0.5} skin={SKIN_TONES[2]} cloth="#E6D6C2" hair="#2B2433" />
      {[[30, 40], [262, 30], [230, 76], [50, 96], [110, 24]].map(([x, y], i) => (
        <Circle key={i} cx={x} cy={y} r={i % 2 ? 1.6 : 2.4} fill="#E2AE78" opacity={0.7} />
      ))}
    </Svg>
  );
}

/** Pour les écrans vides : une petite lune et une feuille, tout en douceur. */
export function EmptyIllustration({ kind = 'moon', size = 140 }: { kind?: 'moon' | 'leaf' | 'letter' | 'chat'; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 140 140" accessibilityElementsHidden importantForAccessibility="no">
      <Circle cx="70" cy="70" r="62" fill="#EBCFC8" opacity={0.35} />
      {kind === 'moon' && <Path d="M86 34 A 38 38 0 1 0 98 98 A 30 30 0 1 1 86 34 Z" fill="#E8D3A6" />}
      {kind === 'leaf' && (
        <G>
          <Path d="M40 100 C 40 50, 80 30, 108 34 C 110 64, 92 104, 40 100 Z" fill="#B9AEDB" />
          <Path d="M44 98 C 64 76, 84 58, 104 38" stroke="#6E5FA8" strokeWidth={2} fill="none" />
        </G>
      )}
      {kind === 'letter' && (
        <G>
          <Path d="M32 48 H 108 V 98 H 32 Z" fill="#F7F1E8" stroke="#D58D72" strokeWidth={2} />
          <Path d="M32 48 L 70 78 L 108 48" stroke="#D58D72" strokeWidth={2} fill="none" />
        </G>
      )}
      {kind === 'chat' && (
        <G>
          <Path d="M30 44 H 98 A 10 10 0 0 1 108 54 V 84 A 10 10 0 0 1 98 94 H 58 L 42 108 V 94 H 30 A 10 10 0 0 1 20 84 V 54 A 10 10 0 0 1 30 44 Z" fill="#B9AEDB" />
          <Circle cx="46" cy="69" r="4" fill="#F7F1E8" />
          <Circle cx="64" cy="69" r="4" fill="#F7F1E8" />
          <Circle cx="82" cy="69" r="4" fill="#F7F1E8" />
        </G>
      )}
      <Circle cx="112" cy="30" r="2.5" fill="#E2AE78" />
      <Circle cx="26" cy="36" r="1.8" fill="#E2AE78" />
    </Svg>
  );
}

/** Avatar à initiales, tonalité douce stable par identifiant. */
export function initialsColor(id: string): string {
  const colors = ['#E3A895', '#B9AEDB', '#E2C48B', '#9CC1A2', '#D58D72', '#A79BD2'];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return colors[h % colors.length];
}
