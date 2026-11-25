/**
 * Introductions d'Aura par section (25/11/2026, retour iPhone « intro grossesse, bébé, enfant, deux parents ») :
 * à la première ouverture d'une section, Aura explique en une phrase ce qu'elle peut faire et propose les premières
 * actions (vrais écrans). « Compris » la range ; elle ne revient pas, sauf « Revoir les présentations » (réglages d'Aura).
 * Mémorisé sur l'appareil, par compte (clé `homi.` : effacée à la déconnexion).
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Button, Card, Chip, Text, type IconName } from '@/components/ui';
import { useUserId } from '@/lib/auth';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';
import { AuraOrb } from './AuraMark';

export type IntroSection = 'pregnancy' | 'baby' | 'child' | 'family' | 'cycle' | 'postpartum' | 'coparent' | 'story' | 'joined';
export const INTRO_SECTIONS: readonly IntroSection[] = ['pregnancy', 'baby', 'child', 'family', 'cycle', 'postpartum', 'coparent', 'story', 'joined'];

type Act = { key: string; icon: IconName; href: (childId?: string | null) => string };
/** Actions proposées : uniquement des écrans qui existent (vérifié par src/__tests__/sectionIntro.test.ts). */
export const INTRO_ACTIONS: Record<IntroSection, Act[]> = {
  pregnancy: [
    { key: 'week', icon: 'calendar', href: () => '/pregnancy/calendar' },
    { key: 'appointments', icon: 'clock', href: () => '/appointments' },
    { key: 'birthPlan', icon: 'file-text', href: () => '/pregnancy/birth-plan' },
    { key: 'invite', icon: 'user-plus', href: () => '/settings/family' },
    { key: 'tools', icon: 'grid', href: () => '/tools' },
  ],
  baby: [
    { key: 'daily', icon: 'droplet', href: () => '/track' },
    { key: 'sleep', icon: 'moon', href: (c) => (c ? `/sleep/${c}` : '/track') },
    { key: 'growth', icon: 'trending-up', href: (c) => (c ? `/child/${c}/growth` : '/track') },
    { key: 'vaccines', icon: 'shield', href: (c) => (c ? `/child/${c}/vaccines` : '/track') },
    { key: 'relay', icon: 'repeat', href: () => '/family/relay' },
  ],
  child: [
    { key: 'school', icon: 'book', href: (c) => (c ? `/child/${c}/school` : '/tools') },
    { key: 'routines', icon: 'check-square', href: () => '/family/kid-routines' },
    { key: 'sleep', icon: 'moon', href: (c) => (c ? `/sleep/${c}` : '/tools') },
    { key: 'health', icon: 'heart', href: (c) => (c ? `/child/${c}/health-tracking` : '/tools') },
    { key: 'tools', icon: 'grid', href: () => '/tools' },
  ],
  family: [
    { key: 'missions', icon: 'check-square', href: () => '/family/missions' },
    { key: 'load', icon: 'layers', href: () => '/family/load' },
    { key: 'lists', icon: 'shopping-cart', href: () => '/lists' },
    { key: 'relay', icon: 'repeat', href: () => '/family/relay' },
    { key: 'calendar', icon: 'calendar', href: () => '/calendar' },
  ],
  cycle: [
    { key: 'calendar', icon: 'calendar', href: () => '/cycle/calendar' },
    { key: 'symptoms', icon: 'activity', href: () => '/cycle/symptoms' },
    { key: 'stats', icon: 'bar-chart-2', href: () => '/cycle/stats' },
  ],
  postpartum: [
    { key: 'checkin', icon: 'smile', href: () => '/postpartum/checkin' },
    { key: 'recovery', icon: 'heart', href: () => '/postpartum/recovery' },
    { key: 'support', icon: 'life-buoy', href: () => '/postpartum/support' },
  ],
  story: [
    { key: 'addPhoto', icon: 'camera', href: (c) => (c ? `/child/${c}/album` : '/tools') },
    { key: 'addFirst', icon: 'star', href: (c) => (c ? `/child/${c}?tab=etapes` : '/tools') },
  ],
  // Coparent qui vient de rejoindre (26/11/2026) : prendre le relais tout de suite
  joined: [
    { key: 'relay', icon: 'repeat', href: () => '/family/relay' },
    { key: 'calendar', icon: 'calendar', href: () => '/calendar' },
    { key: 'latest', icon: 'clock', href: () => '/journal' },
    { key: 'missions', icon: 'check-square', href: () => '/family/missions' },
    { key: 'tools', icon: 'grid', href: () => '/tools' },
  ],
  coparent: [
    { key: 'relay', icon: 'repeat', href: () => '/family/relay' },
    { key: 'share', icon: 'users', href: () => '/family/missions/responsibilities' },
    { key: 'calendar', icon: 'calendar', href: () => '/calendar' },
    { key: 'invite', icon: 'user-plus', href: () => '/settings/family' },
  ],
};

const key = (userId: string, s: IntroSection) => `homi.intro.${userId}.${s}`;

/** « Revoir les présentations » : toutes les sections réapparaissent. */
export async function resetSectionIntros(userId: string): Promise<void> {
  await AsyncStorage.multiRemove(INTRO_SECTIONS.map((s) => key(userId, s)));
}

export function SectionIntro({ section, childId, name }: { section: IntroSection; childId?: string | null; name?: string | null }) {
  const userId = useUserId();
  const [state, setState] = useState<'loading' | 'show' | 'hidden'>('loading');
  useEffect(() => {
    if (!userId) return;
    let live = true;
    AsyncStorage.getItem(key(userId, section)).then((v) => { if (live) setState(v ? 'hidden' : 'show'); }).catch(() => { if (live) setState('hidden'); });
    return () => { live = false; };
  }, [userId, section]);
  if (state !== 'show' || !userId) return null;
  const done = () => { setState('hidden'); void AsyncStorage.setItem(key(userId, section), '1').catch(() => {}); };
  return (
    <Card testID={`section-intro-${section}`}>
      <View style={{ gap: spacing.sm }} accessibilityLiveRegion="polite">
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <AuraOrb size={36} />
          <Text weight="bold" style={{ flex: 1 }} accessibilityRole="header">{tr(`aura.intro.${section}.title` as TKey, { name: name ?? '' })}</Text>
        </View>
        <Text variant="small">{tr(`aura.intro.${section}.body` as TKey, { name: name ?? '' })}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
          {INTRO_ACTIONS[section].map((a) => (
            <Chip key={a.key} icon={a.icon} label={tr(`aura.intro.act.${a.key}` as TKey)} onPress={() => router.push(a.href(childId) as never)} testID={`section-intro-${section}-${a.key}`} />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
          <Button label={tr('aura.intro.talk')} icon="message-circle" size="sm" onPress={() => router.push('/assistant' as never)} testID={`section-intro-${section}-talk`} />
          <Button label={tr('aura.intro.done')} size="sm" variant="ghost" onPress={done} testID={`section-intro-${section}-done`} />
        </View>
      </View>
    </Card>
  );
}
