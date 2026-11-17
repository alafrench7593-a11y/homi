/**
 * « Mon assistant IA » sur l'accueil : on écrit sa question directement dans la carte ; l'envoi interroge d'abord
 * l'IA locale (gratuite, sur le téléphone, à partir des articles : /assistant/local?q=…), et un lien mène à l'IA
 * en ligne (/assistant/chat) pour une réponse plus détaillée. Le consentement à l'IA et les règles de
 * sécurité santé restent ceux de l'écran de conversation : cette carte ne fait qu'y mener.
 */
import React, { useState } from 'react';
import { Keyboard, TextInput, View } from 'react-native';
import { useRevealOnFocus } from '@/components/keyboard';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Tappable } from '@/components/Tappable';
import { Icon, Text } from '@/components/ui';
import { alpha, MIN_TOUCH, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

/** Carte de l'assistant : scène sombre de la palette (jeton `inverse`) en clair, surface élevée en sombre ; texte ≥ 4,5:1 (testé pour chaque palette). */
import { t as tr } from '@/i18n';
import { aiAssistantOnline } from '@/config/features';

export function HomeAssistantCard() {
  const t = useTheme();
  const fill = t.isDark ? t.colors.surfaceAlt : t.tokens.inverse.fill;
  const fg = t.isDark ? t.colors.text : t.tokens.inverse.text;
  const fgMuted = t.isDark ? t.colors.textMuted : t.tokens.inverse.textMuted;
  const [q, setQ] = useState('');
  const inputRef = React.useRef<TextInput>(null);
  const reveal = useRevealOnFocus(inputRef);
  const send = () => {
    Keyboard.dismiss();
    const question = q.trim();
    setQ('');
    // D'abord l'IA locale (gratuite, sur le téléphone, à partir des articles) ; l'IA en ligne reste à un geste
    router.push(question.length >= 2 ? { pathname: '/assistant/local', params: { q: question } } : '/assistant/local');
  };
  return (
    <LinearGradient colors={[fill, fill]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: spacing.md, gap: spacing.sm }}>
      <Tappable accessibilityRole="button" accessibilityLabel={tr('ai.home.openA11y')} onPress={() => router.push('/assistant/local')} testID="home-ai-open"
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: alpha(fg, 0.16), alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="message-circle" color={fg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text weight="bold" color={fg}>{tr('ai.home.title')}</Text>
          <Text variant="caption" color={fgMuted}>{tr('ai.home.sub')}</Text>
        </View>
        <Icon name="arrow-right" color={fg} />
      </Tappable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.colors.surface, borderRadius: 18, paddingLeft: spacing.md, minHeight: MIN_TOUCH }}>
        <TextInput ref={inputRef} onFocus={reveal} value={q} onChangeText={setQ} placeholder={tr('ai.home.placeholder')} placeholderTextColor={t.colors.textMuted}
          accessibilityLabel={tr('ai.home.inputA11y')} returnKeyType="send" onSubmitEditing={send} maxLength={500} testID="home-ai-input"
          style={{ flex: 1, minHeight: MIN_TOUCH, color: t.colors.text, fontSize: 16 }} />
        <Tappable accessibilityRole="button" accessibilityLabel={tr('ai.home.send')} onPress={send} testID="home-ai-send"
          style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="send" color={t.colors.primary} />
        </Tappable>
      </View>
      <Tappable accessibilityRole="button" accessibilityLabel={tr('ai.home.online')} onPress={() => router.push(q.trim().length >= 2 ? { pathname: '/assistant/chat', params: { q: q.trim() } } : '/assistant/chat')} testID="home-ai-online"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: MIN_TOUCH }}>
        <Icon name="cloud" size={16} color={fg} />
        {/* libellé et pastille « Bientôt disponible » : la pastille passe sous le libellé quand la place manque (texte
            agrandi à 320 px : le libellé tombait à 3 lettres par ligne, « Ré-ponse », audit 09) */}
        <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 6, rowGap: 4 }}>
          <Text variant="small" weight="bold" color={fg} style={{ flexShrink: 1 }}>{tr('ai.home.online')}</Text>
          {aiAssistantOnline() ? null : (
            <View style={{ backgroundColor: alpha(fg, 0.2), borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }} testID="home-ai-soon">
              <Text variant="caption" weight="bold" color={fg}>{tr('pw.soon.badge')}</Text>
            </View>
          )}
        </View>
        <Icon name="chevron-right" size={16} color={fg} />
      </Tappable>
      <Text variant="caption" color={fgMuted}>{tr('ai.home.localNote')} {tr('ai.home.disclaimer')}</Text>
    </LinearGradient>
  );
}
