/** Éléments d'affichage de l'assistant : avertissement, réponse structurée, orientation urgente. */
import React from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { Markdown } from './Markdown';
import { Icon, Text, type IconName } from './ui';
import {
  ASSISTANT_INTRO, SECTION_TITLES, urgentContacts,
  type ArticleSourceRef, type StructuredAnswer, type UrgentContact,
} from '@/features/assistant';
import { isAllowedSourceUrl } from '../../supabase/functions/_shared/assistant-format';

/** Avertissement affiché en tête de chaque conversation (texte imposé). */
export function AssistantIntro() {
  const t = useTheme();
  return (
    <View accessibilityRole="summary" style={[styles.intro, { backgroundColor: t.colors.surfaceAlt, borderColor: t.colors.border }]}>
      <Icon name="cpu" size={18} color={t.colors.lavender} />
      <Text variant="small" style={{ flex: 1 }}>{ASSISTANT_INTRO}</Text>
    </View>
  );
}

function Section({ icon, title, items, color }: { icon: IconName; title: string; items: string[]; color: string }) {
  const t = useTheme();
  if (!items.length) return null;
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Icon name={icon} size={16} color={color} />
        <Text weight="bold" variant="small" accessibilityRole="header">{title}</Text>
      </View>
      {items.map((it, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingLeft: 4 }}>
          <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: t.colors.accent, marginTop: 9 }} />
          <View style={{ flex: 1 }}><Markdown source={it} /></View>
        </View>
      ))}
    </View>
  );
}

const formatDate = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
};

/** Réponse en sections : en bref, actions, à surveiller, quand consulter, sources officielles. */
export function StructuredAnswerView({ answer, articles, streaming }: { answer: StructuredAnswer; articles?: ArticleSourceRef[]; streaming?: boolean }) {
  const t = useTheme();
  const sources = answer.sources.filter((s) => isAllowedSourceUrl(s.url));
  return (
    <View style={{ gap: spacing.md }}>
      {!!answer.short && <Markdown source={answer.short} />}
      <Section icon="check-circle" title={SECTION_TITLES.actions} items={answer.actions} color={t.colors.success} />
      <Section icon="eye" title={SECTION_TITLES.watch} items={answer.watch} color={t.colors.gold} />
      <Section icon="user-check" title={SECTION_TITLES.consult} items={answer.consult} color={t.colors.danger} />
      <Section icon="help-circle" title={SECTION_TITLES.questions} items={answer.questions} color={t.colors.lavender} />
      {!!sources.length && (
        <View style={{ gap: 4 }}>
          <Text weight="bold" variant="small" accessibilityRole="header">{SECTION_TITLES.sources}</Text>
          {sources.map((s) => (
            <Pressable
              key={s.url}
              accessibilityRole="link"
              accessibilityLabel={`Ouvrir la source : ${s.label}`}
              accessibilityHint="Ouvre le site officiel dans le navigateur"
              onPress={() => Linking.openURL(s.url)}
              style={{ flexDirection: 'row', gap: 6, alignItems: 'center', minHeight: 36 }}
            >
              <Icon name="external-link" size={14} color={t.colors.primary} />
              <Text variant="small" color={t.colors.primary} style={{ flex: 1, textDecorationLine: 'underline' }}>{s.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {!!articles?.length && (
        <View style={{ gap: 4 }}>
          <Text weight="bold" variant="small">Articles de l’application</Text>
          {articles.map((a) => (
            <Pressable key={a.ref} accessibilityRole="link" onPress={() => router.push(`/article/${a.slug}`)} style={{ flexDirection: 'row', gap: 6, alignItems: 'center', minHeight: 36 }}>
              <Icon name="book-open" size={14} color={t.colors.primary} />
              <Text variant="small" color={t.colors.primary} style={{ flex: 1 }}>[{a.ref}] {a.title}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {!streaming && !!answer.updated_on && <Text variant="caption" muted>Réponse mise à jour le {formatDate(answer.updated_on)}</Text>}
    </View>
  );
}

/** Carte d'orientation urgente : appel direct du 15, 112, 3114 et SMS au 114. */
export function UrgentCard({ level, contacts, message }: { level: 'medical_urgent' | 'crisis'; contacts?: UrgentContact[]; message?: string }) {
  const t = useTheme();
  const list = contacts?.length ? contacts : urgentContacts(level);
  return (
    <View accessibilityRole="alert" style={[styles.urgent, { backgroundColor: t.colors.dangerSoft, borderColor: t.colors.danger }]}>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <Icon name="alert-triangle" size={20} color={t.colors.danger} />
        <Text weight="bold" color={t.colors.danger} style={{ flex: 1 }}>
          {level === 'crisis' ? 'Vous n’êtes pas seul·e : parlez-en maintenant' : 'Cette situation peut être urgente'}
        </Text>
      </View>
      {!!message && <Markdown source={message} />}
      <View style={{ gap: spacing.xs }}>
        {list.map((c) => (
          <Pressable
            key={c.number}
            accessibilityRole="button"
            accessibilityLabel={`${c.channel === 'sms' ? 'Envoyer un SMS au' : 'Appeler le'} ${c.number.split('').join(' ')}, ${c.label}`}
            onPress={() => Linking.openURL(`${c.channel}:${c.number}`)}
            style={({ pressed }) => [styles.contact, { backgroundColor: t.colors.surface, borderColor: t.colors.border, opacity: pressed ? 0.85 : 1 }]}
          >
            <Text weight="bold" color={t.colors.danger} style={{ fontSize: 20, lineHeight: 24, minWidth: 52 }}>{c.number}</Text>
            <View style={{ flex: 1 }}>
              <Text weight="bold" variant="small">{c.label}{c.channel === 'sms' ? ' (SMS)' : ''}</Text>
              <Text variant="caption" muted>{c.detail}</Text>
            </View>
            <Icon name={c.channel === 'sms' ? 'message-square' : 'phone'} size={18} color={t.colors.danger} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', padding: spacing.md, borderRadius: radius.lg, borderWidth: 1 },
  urgent: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1.5 },
  contact: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, minHeight: 52 },
});
