/**
 * « Mon assistant IA » sur l'accueil : on écrit sa question directement dans la carte ; l'envoi interroge d'abord
 * l'IA locale (gratuite, sur le téléphone, à partir des articles : /assistant/local?q=…), et un lien mène à l'IA
 * en ligne (/assistant/chat) pour une réponse plus détaillée. Le consentement à l'IA et les règles de
 * sécurité santé restent ceux de l'écran de conversation : cette carte ne fait qu'y mener.
 */
import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Tappable } from '@/components/Tappable';
import { Icon, Text } from '@/components/ui';
import { MIN_TOUCH, NACRE, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export function HomeAssistantCard() {
  const [q, setQ] = useState('');
  const send = () => {
    const question = q.trim();
    setQ('');
    // D'abord l'IA locale (gratuite, sur le téléphone, à partir des articles) ; l'IA en ligne reste à un geste
    router.push(question.length >= 2 ? { pathname: '/assistant/local', params: { q: question } } : '/assistant/local');
  };
  return (
    <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: spacing.md, gap: spacing.sm }}>
      <Tappable accessibilityRole="button" accessibilityLabel={tr('ai.home.openA11y')} onPress={() => router.push('/assistant/local')} testID="home-ai-open"
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="message-circle" color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text weight="bold" color="#FFFFFF">{tr('ai.home.title')}</Text>
          <Text variant="caption" color="rgba(255,255,255,0.88)">{tr('ai.home.sub')}</Text>
        </View>
        <Icon name="arrow-right" color="#FFFFFF" />
      </Tappable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 18, paddingLeft: spacing.md, minHeight: MIN_TOUCH }}>
        <TextInput value={q} onChangeText={setQ} placeholder={tr('ai.home.placeholder')} placeholderTextColor="rgba(60,40,50,0.55)"
          accessibilityLabel={tr('ai.home.inputA11y')} returnKeyType="send" onSubmitEditing={send} maxLength={500} testID="home-ai-input"
          style={{ flex: 1, minHeight: MIN_TOUCH, color: '#2A1A22', fontSize: 16 }} />
        <Tappable accessibilityRole="button" accessibilityLabel={tr('ai.home.send')} onPress={send} testID="home-ai-send"
          style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="send" color="#87533F" />
        </Tappable>
      </View>
      <Tappable accessibilityRole="button" accessibilityLabel={tr('ai.home.online')} onPress={() => router.push(q.trim().length >= 2 ? { pathname: '/assistant/chat', params: { q: q.trim() } } : '/assistant/chat')} testID="home-ai-online"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: MIN_TOUCH }}>
        <Icon name="cloud" size={16} color="#FFFFFF" />
        <Text variant="small" weight="bold" color="#FFFFFF" style={{ flex: 1 }}>{tr('ai.home.online')}</Text>
        <Icon name="chevron-right" size={16} color="#FFFFFF" />
      </Tappable>
      <Text variant="caption" color="rgba(255,255,255,0.85)">{tr('ai.home.localNote')} {tr('ai.home.disclaimer')}</Text>
    </LinearGradient>
  );
}
