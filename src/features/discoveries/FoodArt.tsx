/**
 * Visuel d'un aliment de « Ses découvertes » : photo originale générée pour l'application (FOOD_PHOTO_FILES) ou,
 * à défaut, illustration vectorielle propre à l'application (forme selon la catégorie, couleur de l'aliment),
 * dans un cercle et entourée d'un anneau de couleur.
 */
import React from 'react';
import { Image, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import type { FoodCategory, FoodDef } from '@/content/discoveries/foods';
import { FOOD_PHOTO_FILES } from './foodPhotos';

function shade(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * k)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, '0')).join('')}`;
}

/** Forme des légumes : longue (carotte, poireau…), ronde (tomate, potiron…), en bouquet (brocoli…) ou en feuilles. */
const VEG_SHAPE: Record<string, 'long' | 'round' | 'floret' | 'leafy'> = {
  carrot: 'long', parsnip: 'long', leek: 'long', zucchini: 'long', cucumber: 'long', asparagus: 'long', eggplant: 'long', sweet_potato: 'long',
  broccoli: 'floret', cauliflower: 'floret', spinach: 'leafy', cabbage: 'leafy', artichoke: 'leafy', fennel: 'leafy',
};

function Glyph({ category, c, k }: { category: FoodCategory; c: string; k: string }) {
  const d = shade(c, 0.72);
  const leaf = '#5E9E3A';
  const veg = category === 'veg' ? (VEG_SHAPE[k] ?? 'round') : null;
  if (veg === 'round') return (<>
    <Ellipse cx={50} cy={56} rx={24} ry={21} fill={c} stroke={d} strokeWidth={2} />
    <Path d="M42 36 C46 30 54 30 58 36 C54 38 46 38 42 36 Z" fill={leaf} />
    <Path d="M38 52 C40 62 46 68 52 70" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" fill="none" opacity={0.35} />
  </>);
  if (veg === 'floret') return (<>
    <Path d="M44 78 L47 58 M56 78 L53 58" stroke={leaf} strokeWidth={6} strokeLinecap="round" />
    {[[38, 46], [50, 38], [62, 46], [44, 56], [56, 56]].map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={11} fill={c} stroke={d} strokeWidth={1.5} />)}
  </>);
  if (veg === 'leafy') return (<>
    <Path d="M50 78 C30 70 24 46 36 30 C44 40 48 52 50 78 Z" fill={c} stroke={d} strokeWidth={2} />
    <Path d="M50 78 C70 70 76 46 64 30 C56 40 52 52 50 78 Z" fill={shade(c, 1.1)} stroke={d} strokeWidth={2} />
    <Path d="M50 78 C46 56 48 36 50 24 C52 36 54 56 50 78 Z" fill={shade(c, 0.9)} stroke={d} strokeWidth={1.5} />
  </>);
  switch (category) {
    case 'veg': return (<>
      <Path d="M50 22 C64 30 70 52 58 74 C54 80 46 80 42 74 C30 52 36 30 50 22 Z" fill={c} stroke={d} strokeWidth={2} />
      <Path d="M50 22 C46 14 40 12 36 14 M50 22 C54 13 60 11 64 14" stroke={leaf} strokeWidth={4} strokeLinecap="round" fill="none" />
      <Path d="M44 40 h8 M46 52 h8 M45 63 h7" stroke={d} strokeWidth={2} strokeLinecap="round" />
    </>);
    case 'fruit': return (<>
      <Circle cx={50} cy={56} r={22} fill={c} stroke={d} strokeWidth={2} />
      <Path d="M50 34 C50 28 52 24 55 22" stroke="#7A5532" strokeWidth={3} strokeLinecap="round" fill="none" />
      <Path d="M54 28 C62 22 70 26 70 30 C62 34 56 32 54 28 Z" fill={leaf} />
      <Ellipse cx={42} cy={48} rx={5} ry={8} fill="#FFFFFF" opacity={0.35} />
    </>);
    case 'starch': return (<>
      <Path d="M22 50 h56 C76 70 64 78 50 78 C36 78 24 70 22 50 Z" fill="#FFFFFF" stroke={d} strokeWidth={2} />
      <Ellipse cx={50} cy={50} rx={28} ry={8} fill={c} stroke={d} strokeWidth={2} />
      <Circle cx={42} cy={46} r={3} fill={shade(c, 1.12)} /><Circle cx={55} cy={48} r={3} fill={shade(c, 1.12)} /><Circle cx={49} cy={44} r={2.5} fill={shade(c, 1.12)} />
    </>);
    case 'cereal': return (<>
      <Path d="M50 80 V30" stroke={d} strokeWidth={3} strokeLinecap="round" />
      {[0, 1, 2, 3].map((i) => <Ellipse key={`l${i}`} cx={43} cy={36 + i * 10} rx={6} ry={4} fill={c} stroke={d} strokeWidth={1.5} transform={`rotate(-35 43 ${36 + i * 10})`} />)}
      {[0, 1, 2, 3].map((i) => <Ellipse key={`r${i}`} cx={57} cy={36 + i * 10} rx={6} ry={4} fill={c} stroke={d} strokeWidth={1.5} transform={`rotate(35 57 ${36 + i * 10})`} />)}
      <Ellipse cx={50} cy={27} rx={4} ry={6} fill={c} stroke={d} strokeWidth={1.5} />
    </>);
    case 'legume': return (<>
      {[[38, 46], [56, 42], [46, 60], [62, 60]].map(([x, y], i) => <Ellipse key={i} cx={x} cy={y} rx={10} ry={7} fill={c} stroke={d} strokeWidth={2} transform={`rotate(${i * 25 - 20} ${x} ${y})`} />)}
    </>);
    case 'meat': return (<>
      <Path d="M30 44 C30 30 48 24 60 32 C72 40 70 58 58 62 C50 65 42 62 38 58 C34 56 30 52 30 44 Z" fill={c} stroke={d} strokeWidth={2} />
      <Path d="M56 60 L70 74" stroke="#F5EEDC" strokeWidth={6} strokeLinecap="round" />
      <Circle cx={72} cy={76} r={4} fill="#F5EEDC" /><Circle cx={68} cy={78} r={3.5} fill="#F5EEDC" />
    </>);
    case 'fish': return (<>
      <Path d="M24 50 C34 34 58 32 70 50 C58 68 34 66 24 50 Z" fill={c} stroke={d} strokeWidth={2} />
      <Path d="M70 50 L82 40 L80 50 L82 60 Z" fill={c} stroke={d} strokeWidth={2} strokeLinejoin="round" />
      <Circle cx={36} cy={47} r={2.5} fill={d} />
      <Path d="M48 40 C52 46 52 54 48 60" stroke={d} strokeWidth={1.5} fill="none" />
    </>);
    case 'egg': return (<>
      <Path d="M50 22 C64 22 72 46 72 58 C72 70 62 78 50 78 C38 78 28 70 28 58 C28 46 36 22 50 22 Z" fill="#FFF8EC" stroke={shade('#E8D9B8', 0.85)} strokeWidth={2} />
      <Circle cx={50} cy={60} r={11} fill={c} />
    </>);
    case 'dairy': return (<>
      <Path d="M32 36 h36 l-4 40 h-28 Z" fill="#FFFFFF" stroke={d} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M33 46 h34 l-3 30 h-28 Z" fill={c} opacity={0.9} />
      <Ellipse cx={50} cy={36} rx={18} ry={4} fill="#FFFFFF" stroke={d} strokeWidth={2} />
    </>);
    case 'fat': return (<>
      <Path d="M50 22 C58 36 70 48 70 60 C70 71 61 78 50 78 C39 78 30 71 30 60 C30 48 42 36 50 22 Z" fill={c} stroke={d} strokeWidth={2} />
      <Ellipse cx={43} cy={58} rx={4} ry={8} fill="#FFFFFF" opacity={0.4} />
    </>);
    case 'herb': return (<>
      <Path d="M50 80 C50 60 50 40 50 24" stroke={d} strokeWidth={3} strokeLinecap="round" fill="none" />
      {[[40, 62, -40], [60, 54, 40], [41, 44, -40], [59, 36, 40], [50, 24, 0]].map(([x, y, r], i) => <Ellipse key={i} cx={x} cy={y} rx={8} ry={4.5} fill={c} stroke={d} strokeWidth={1.5} transform={`rotate(${r} ${x} ${y})`} />)}
    </>);
    case 'allergen': return (<>
      <Path d="M50 26 C64 26 72 40 70 54 C68 68 58 76 50 76 C42 76 32 68 30 54 C28 40 36 26 50 26 Z" fill={c} stroke={d} strokeWidth={2} />
      <Path d="M50 30 C47 44 47 60 50 72" stroke={d} strokeWidth={2} fill="none" />
      <Path d="M38 40 C42 46 42 56 38 64 M62 40 C58 46 58 56 62 64" stroke={d} strokeWidth={1.2} fill="none" opacity={0.6} />
    </>);
    default: return (<>
      <Path d="M34 38 h32 v34 c0 5 -4 8 -8 8 h-16 c-4 0 -8 -3 -8 -8 Z" fill={c} stroke={d} strokeWidth={2} />
      <Path d="M32 30 h36 v8 h-36 Z" fill={d} />
      <Ellipse cx={44} cy={54} rx={3} ry={9} fill="#FFFFFF" opacity={0.35} />
    </>);
  }
}

export function FoodArt({ food, size = 72, ring = true, dim = false }: { food: Pick<FoodDef, 'key' | 'name' | 'category' | 'tint'>; size?: number; ring?: boolean; dim?: boolean }) {
  const file = FOOD_PHOTO_FILES[food.key];
  const pad = ring ? Math.max(3, Math.round(size * 0.06)) : 0;
  const inner = size - pad * 2;
  return (
    <View accessibilityRole="image" accessibilityLabel={food.name} testID={`food-art-${food.key}`}
      style={{ width: size, height: size, borderRadius: size / 2, padding: pad, backgroundColor: ring ? `${food.tint}55` : 'transparent', opacity: dim ? 0.55 : 1 }}>
      <View style={{ width: inner, height: inner, borderRadius: inner / 2, overflow: 'hidden', backgroundColor: '#FFF9F3' }}>
        {file ? (
          <Image source={file} style={{ width: inner, height: inner }} resizeMode="cover" accessibilityIgnoresInvertColors />
        ) : (
          <Svg width={inner} height={inner} viewBox="0 0 100 100">
            <Defs>
              <RadialGradient id={`bg-${food.key}`} cx="50%" cy="40%" r="65%">
                <Stop offset="0" stopColor="#FFFDF8" />
                <Stop offset="1" stopColor={food.tint} stopOpacity={0.28} />
              </RadialGradient>
            </Defs>
            <Circle cx={50} cy={50} r={50} fill={`url(#bg-${food.key})`} />
            <Glyph category={food.category} c={food.tint} k={food.key} />
          </Svg>
        )}
      </View>
    </View>
  );
}
