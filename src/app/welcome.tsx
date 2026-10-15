import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StarField } from '@/components/StarField';
import { FetusOrb } from '@/components/FetusOrb';
import { WeeksRing } from '@/components/DayClock';
import { Icon, Text } from '@/components/ui';
import { isDemo } from '@/lib/backend';
import { BRAND } from '@/config/brand';
import { NACRE, palette, radius, spacing } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

const JOURNEY = ['Contraception', 'Projet bébé', 'Grossesse', 'Naissance', 'Enfance'];

export default function Welcome() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: '#140A11' }}>
      <StatusBar style="light" />
      <LinearGradient colors={['#1A1F4A', '#140A11', '#07081A']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <StarField density={50} color="#D8BC85" />
      <View style={{ flex: 1, paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.lg, justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center', gap: spacing.md }}>
          <WeeksRing week={26} size={260}>
            <FetusOrb growth={0.6} size={190} interactive={false} />
          </WeeksRing>
          <Text variant="hero" color={palette.milk} center accessibilityRole="header">{BRAND.name}</Text>
          <Text italic variant="heading" center color={palette.gold} style={{ maxWidth: 320 }}>{BRAND.tagline}</Text>
          <Text center color="rgba(246,240,230,0.7)" style={{ maxWidth: 300 }}>Une seule application qui grandit avec votre famille.</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, maxWidth: 340 }} accessibilityLabel={`Parcours : ${JOURNEY.join(', ')}`}>
            {JOURNEY.map((j, i) => (
              <View key={j} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text variant="small" color={i === 2 ? palette.gold : 'rgba(251,248,244,0.55)'}>{j}</Text>
                {i < JOURNEY.length - 1 && <View style={{ width: 14, height: 1, backgroundColor: 'rgba(200,163,94,0.5)' }} />}
              </View>
            ))}
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Pressable accessibilityRole="button" onPress={() => router.push('/auth/sign-up')} style={({ pressed }) => ({ minHeight: 58, borderRadius: radius.pill, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.9 : 1 })}>
            <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
            <Text weight="medium" color={palette.night} style={{ letterSpacing: 0.5 }}>Créer mon compte</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/auth/sign-in')} style={({ pressed }) => ({ minHeight: 58, borderRadius: radius.pill, borderWidth: 1.2, borderColor: 'rgba(255,143,177,0.45)', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.8 : 1 })}>
            <Text weight="medium" color={palette.milk}>J’ai déjà un compte</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/emergency')} style={{ minHeight: 48, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="life-buoy" size={18} color={palette.powder} />
            <Text variant="small" color={palette.powder}>Besoin d’aide maintenant</Text>
          </Pressable>
          {isDemo && <Text variant="caption" center color="rgba(251,248,244,0.5)">Mode démonstration : les données restent sur cet appareil.</Text>}
        </View>
      </View>
    </View>
  );
}
