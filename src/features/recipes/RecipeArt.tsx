/**
 * Illustration GÉNÉRÉE d'une recette (pas une photographie) : bol ou assiette selon la texture, couleurs des
 * ingrédients principaux, morceaux visibles seulement pour les textures « morceaux » ou « comme la famille ».
 * Création propre de l'application : aucune image de tiers. Une photo sous licence (recipe_photos.kind = 'licensed'
 * ou 'owned', avec storage_path) peut la remplacer depuis l'administration.
 */
import React from 'react';
import { Image, View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Text } from '@/components/ui';
import { INGREDIENTS } from '@/lib/recipes/ingredients';
import { STAPLES } from '@/lib/recipes/engine';
import type { Recipe } from '@/lib/recipes/types';
import { RECIPE_PHOTO_FILES } from './recipePhotos';
import { t as tr } from '@/i18n';

const hash = (s: string) => { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const rand = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

export function recipeColors(r: Pick<Recipe, 'ingredients'>) {
  const main = r.ingredients.filter((x) => !STAPLES.includes(x.key)).map((x) => INGREDIENTS[x.key]?.color).filter(Boolean) as string[];
  return main.length ? main : ['#E8CF8E'];
}

const rotate = (p: { rot: number; x: number; y: number }) => `rotate(${p.rot} ${p.x} ${p.y})`;

export function RecipeArt({ recipe, height = 150, label = true, rounded = 18 }: { recipe: Pick<Recipe, 'slug' | 'ingredients' | 'textures' | 'temperature' | 'title' | 'photo'>; height?: number; label?: boolean; rounded?: number }) {
  const colors = recipeColors(recipe);
  const r = rand(hash(recipe.slug));
  const smooth = recipe.textures.every((t) => t === 'smooth' || t === 'mashed');
  const drink = /lassi|smoothie|boisson/.test(recipe.slug);
  const base = colors[0];
  const bg = ['#FBEFE7', '#F1F4EA', '#F6EEF7', '#EEF3F6'][hash(recipe.slug) % 4];
  const pieces = Array.from({ length: smooth ? 0 : 14 }, (_, i) => ({ x: 52 + r() * 96, y: 50 + r() * 34, rx: 4 + r() * 7, ry: 3 + r() * 5, c: colors[(i % (colors.length - 1 || 1)) + (colors.length > 1 ? 1 : 0)] ?? base, rot: r() * 180 }));
  const file = RECIPE_PHOTO_FILES[recipe.slug];
  if (file) {
    // Photo propre à cette recette (source et licence indiquées sur la fiche)
    return (
      <View style={{ height, borderRadius: rounded, overflow: 'hidden', backgroundColor: bg }} accessibilityRole="image" accessibilityLabel={recipe.photo.alt} testID={`rphoto-${recipe.slug}`}>
        <Image source={file} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityIgnoresInvertColors />
      </View>
    );
  }
  return (
    <View style={{ height, borderRadius: rounded, overflow: 'hidden', backgroundColor: bg }} accessibilityRole="image" accessibilityLabel={recipe.photo.alt}>
      <Svg width="100%" height="100%" viewBox="0 0 200 130" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id="food" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={base} stopOpacity="1" /><Stop offset="1" stopColor={colors[1] ?? base} stopOpacity="0.85" /></LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="200" height="130" fill={bg} />
        <Circle cx={170} cy={22} r={30} fill="#FFFFFF" opacity={0.35} />
        {drink ? (
          <>
            <Path d="M78 22 L122 22 L116 112 L84 112 Z" fill="#FFFFFF" opacity={0.75} />
            <Path d="M81 40 L119 40 L115 108 L85 108 Z" fill="url(#food)" />
            <Ellipse cx={100} cy={40} rx={19} ry={3} fill="#FFFFFF" opacity={0.4} />
          </>
        ) : smooth ? (
          <>
            <Ellipse cx={100} cy={112} rx={62} ry={8} fill="#000000" opacity={0.06} />
            <Path d="M40 62 Q100 140 160 62 Z" fill="#FFFFFF" />
            <Ellipse cx={100} cy={62} rx={60} ry={14} fill="#FFFFFF" />
            <Ellipse cx={100} cy={63} rx={52} ry={10} fill="url(#food)" />
            <Path d="M74 62 Q90 54 104 62 T130 61" stroke="#FFFFFF" strokeOpacity={0.45} strokeWidth={2.5} fill="none" strokeLinecap="round" />
            {recipe.textures.includes('mashed') ? <Circle cx={112} cy={60} r={3} fill={colors[1] ?? '#FFFFFF'} opacity={0.7} /> : null}
          </>
        ) : (
          <>
            <Ellipse cx={100} cy={102} rx={78} ry={14} fill="#000000" opacity={0.06} />
            <Ellipse cx={100} cy={70} rx={76} ry={34} fill="#FFFFFF" />
            <Ellipse cx={100} cy={70} rx={60} ry={25} fill="#F7F3EC" />
            <Ellipse cx={100} cy={70} rx={46} ry={18} fill="url(#food)" opacity={0.9} />
            {pieces.map((p, i) => <Ellipse key={i} cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill={p.c} transform={rotate(p)} opacity={0.95} />)}
          </>
        )}
      </Svg>
      {label && recipe.photo.generated ? (
        <View style={{ position: 'absolute', left: 8, bottom: 6, backgroundColor: 'rgba(255,255,255,0.82)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text variant="caption" color="#4A3B42">{tr('rc.generatedImage')}</Text>
        </View>
      ) : null}
    </View>
  );
}
