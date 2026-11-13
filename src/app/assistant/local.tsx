/**
 * Assistant de la bibliothèque — 100 % sur l'appareil.
 * Il retrouve la réponse dans les articles sourcés (grossesse, projet bébé, bébé, enfant, TDAH, autisme, dys, maladies…)
 * et la présente : réponse, points clés, quand demander conseil, article et sources. Aucune question ne quitte le téléphone.
 */
import React, { useEffect, useRef, useState } from 'react';
import { aiAssistantOnline } from '@/config/features';
import { FlatList, Keyboard, Linking, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { Markdown } from '@/components/Markdown';
import { GlassSurface } from '@/components/Glass';
import { UrgentCard } from '@/components/Assistant';
import { Banner, Chip, haptic, Icon, IconButton, Text } from '@/components/ui';
import { Skeleton } from '@/components/States';
import { Tappable } from '@/components/Tappable';
import { tint } from '@/components/ToolGlyph';
import { useActivePregnancy, useChildren, useFullArticles, useProfile } from '@/lib/data/hooks';
import { childAge } from '@/lib/domain/child';
import { answer, buildIndex, type KbIndex, type LocalAnswer } from '@/lib/localAI/engine';

let CACHE: { n: number; index: KbIndex } | null = null;
import { ui8 as frUi8 } from '@/i18n/fr/ui8';
import { type TKey, t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, spacing } from '@/theme/tokens';

interface Msg { id: string; q: string; a: LocalAnswer }

const SUGGEST: Record<string, TKey[]> = {
  pregnant: ['u8.local.sg.pregnant1', 'u8.local.sg.pregnant2', 'u8.local.sg.pregnant3', 'u8.local.sg.pregnant4', 'u8.local.sg.pregnant5'],
  ttc: ['u8.local.sg.ttc1', 'u8.local.sg.ttc2', 'u8.local.sg.ttc3', 'u8.local.sg.ttc4'],
  newborn: ['u8.local.sg.newborn1', 'u8.local.sg.newborn2', 'u8.local.sg.newborn3', 'u8.local.sg.newborn4', 'u8.local.sg.newborn5'],
  avoid: ['u8.local.sg.avoid1', 'u8.local.sg.avoid2', 'u8.local.sg.avoid3', 'u8.local.sg.avoid4', 'u8.local.sg.avoid5'],
  child: ['u8.local.sg.child1', 'u8.local.sg.child2', 'u8.local.sg.child3', 'u8.local.sg.child4', 'u8.local.sg.child5'],
};

function AnswerCard({ m }: { m: Msg }) {
  const t = useTheme();
  const a = m.a;
  const gold = t.colors.gold;
  if (a.kind === 'urgent' && a.safety) {
    return (
      <View style={{ gap: spacing.sm }}>
        <UrgentCard level={a.safety} contacts={a.urgent} />
        {a.related.length ? <Text variant="caption" muted>{tr('u8.local.urgentRelated')}</Text> : null}
        <Related items={a.related} />
      </View>
    );
  }
  if (a.kind === 'none' || !a.main) {
    return (
      <GlassSurface fill={t.colors.surface} depth={1} radius={22}>
        <View style={{ padding: spacing.md, gap: spacing.sm }} testID="local-none">
          <Text weight="bold">{tr('u8.local.none')}</Text>
          <Text variant="small" muted>{tr('u8.local.noneBody')}</Text>
          {a.related.length ? <Text variant="caption" muted>{tr('u8.local.closest')}</Text> : null}
          <Related items={a.related} />
          {aiAssistantOnline() ? <Chip icon="cloud" label={tr('u8.local.online')} onPress={() => router.push({ pathname: '/assistant/chat', params: { q: m.q } })} testID="local-online" /> : null}
        </View>
      </GlassSurface>
    );
  }
  return (
    <GlassSurface fill={t.colors.surface} depth={2} radius={24}>
      <View style={{ padding: spacing.lg, gap: spacing.sm }} testID="local-answer">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="book-open" size={14} color={gold} />
          <Text variant="caption" weight="bold" color={gold} style={{ flex: 1 }} numberOfLines={2}>{tr('u8.local.from', { title: a.main.title })}</Text>
        </View>
        {a.main.section && !/^introduction$/i.test(a.main.section) ? <Text weight="bold">{a.main.section}</Text> : null}
        <Markdown source={a.answer ?? ''} />
        {a.keyPoints?.length ? (
          <View style={{ borderRadius: 18, padding: spacing.md, gap: 6, backgroundColor: tint(gold, t.isDark ? 0.16 : 0.09) }}>
            <Text variant="caption" weight="bold" color={gold} style={{ letterSpacing: 1, textTransform: 'uppercase' }}>{tr('u8.local.keep')}</Text>
            {a.keyPoints.map((p, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                <Icon name="check" size={14} color={gold} />
                <View style={{ flex: 1 }}><Markdown source={p} /></View>
              </View>
            ))}
          </View>
        ) : null}
        {a.care ? (
          <View style={{ borderRadius: 18, padding: spacing.md, gap: 6, backgroundColor: t.colors.dangerSoft }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Icon name="alert-circle" size={14} color={t.colors.danger} />
              <Text variant="caption" weight="bold" color={t.colors.danger}>{tr('u8.local.care')}</Text>
            </View>
            <Markdown source={a.care} />
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <Tappable accessibilityRole="button" onPress={() => router.push(`/article/${a.main!.slug}`)} testID="local-read"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: t.colors.primary }}>
            <Icon name="book-open" size={14} color={t.colors.primaryText} />
            <Text variant="caption" weight="bold" color={t.colors.primaryText}>{tr('u8.local.read')}</Text>
          </Tappable>
        </View>
        {a.main.sources.length ? (
          <View style={{ gap: 4 }}>
            <Text variant="caption" muted>{tr('u8.local.sources')}</Text>
            {a.main.sources.slice(0, 3).map((s) => (
              <Text key={s.url} variant="caption" color={t.colors.primary} accessibilityRole="link" onPress={() => void Linking.openURL(s.url)} style={{ textDecorationLine: 'underline' }}>{s.label}</Text>
            ))}
          </View>
        ) : null}
        {a.related.length ? <Text variant="caption" muted>{tr('u8.local.seeAlso')}</Text> : null}
        <Related items={a.related} />
      </View>
    </GlassSurface>
  );
}

function Related({ items }: { items: { slug: string; title: string }[] }) {
  if (!items.length) return null;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {items.map((r) => <Chip key={r.slug} icon="book" label={r.title.length > 42 ? `${r.title.slice(0, 40)}…` : r.title} onPress={() => router.push(`/article/${r.slug}`)} />)}
    </View>
  );
}

export default function LocalAssistant() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string; journey?: string }>();
  // L'index local a besoin du texte complet de chaque article (seul écran, avec la recherche de la bibliothèque)
  const articlesQ = useFullArticles();
  const { data: profile } = useProfile();
  const pregnancy = useActivePregnancy();
  const { data: children } = useChildren();
  // Index construit une seule fois (gardé en mémoire), juste après l'affichage de l'écran pour qu'il reste fluide
  const [index, setIndex] = useState<KbIndex | null>(() => (articlesQ.data && CACHE?.n === articlesQ.data.length ? CACHE.index : null));
  useEffect(() => {
    const data = articlesQ.data;
    if (!data) return;
    if (CACHE?.n === data.length) { setIndex(CACHE.index); return; }
    const id = setTimeout(() => {
      const built = buildIndex(data.map((a) => ({ slug: a.slug, title: a.title, summary: a.summary, body_md: a.body_md, tags: a.tags, sources: a.sources, min_age_months: a.min_age_months, max_age_months: a.max_age_months, journeys: a.journeys })));
      CACHE = { n: data.length, index: built };
      setIndex(built);
    }, 30);
    return () => clearTimeout(id);
  }, [articlesQ.data]);
  const [text, setText] = useState(typeof params.q === 'string' ? params.q : '');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const list = useRef<FlatList<Msg>>(null);

  const journey = typeof params.journey === 'string' && SUGGEST[params.journey] ? params.journey : pregnancy ? 'pregnant' : (children ?? []).some((c) => childAge(c.birth_date).months < 24) ? 'newborn' : (children ?? []).length ? 'child' : (profile?.journeys ?? []).includes('ttc') ? 'ttc' : (profile?.journeys ?? []).includes('avoid') ? 'avoid' : 'pregnant';
  const suggestions = [...SUGGEST[journey], ...(journey !== 'child' ? SUGGEST.child.slice(0, 2) : [])];

  // Question venue de l'onglet « Questions » : posée automatiquement dès que l'assistant est prêt
  const autoAsked = useRef(false);
  useEffect(() => {
    if (!index || autoAsked.current || typeof params.q !== 'string' || params.q.trim().length < 2) return;
    autoAsked.current = true;
    ask(params.q);
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  /** `label` : texte affiché ; `query` : formulation française cherchée dans les articles (identique par défaut). */
  function ask(q: string, query?: string) {
    const question = q.trim();
    if (!question || !index) return;
    Keyboard.dismiss();
    haptic('light');
    setMsgs((m) => [...m, { id: `${Date.now()}`, q: question, a: answer(index, query ?? question) }]);
    setText('');
    setTimeout(() => list.current?.scrollToEnd({ animated: true }), 80);
  }

  return (
    <Screen back title={tr('u8.local.title')} subtitle={tr('u8.local.subtitle')} scroll={false} padded={false}
      footer={(
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
          <TextInput value={text} onChangeText={setText} placeholder={tr('u8.local.ph')} placeholderTextColor={t.colors.textMuted} multiline maxLength={300}
            onSubmitEditing={() => ask(text)} submitBehavior="blurAndSubmit" blurOnSubmit textAlignVertical="top" returnKeyType="send" testID="local-input" accessibilityLabel={tr('u8.local.yourQ')}
            style={{ flex: 1, minHeight: 48, maxHeight: 120, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, color: t.colors.text, fontFamily: fonts.body, fontSize: 16,
              backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,250,246,0.9)', borderWidth: 1, borderColor: t.isDark ? 'rgba(205,190,250,0.22)' : 'rgba(172,139,93,0.3)' }} />
          <IconButton icon="send" label={tr('u8.local.send')} tone="primary" onPress={() => ask(text)} disabled={!text.trim() || !index} />
        </View>
      )}>
      <FlatList
        ref={list}
        data={msgs}
        keyExtractor={(m) => m.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}
        ListHeaderComponent={(
          <View style={{ gap: spacing.md }}>
            <Banner tone="info" icon="lock">{tr('u8.local.banner')}</Banner>
            {!index ? <Skeleton rows={2} /> : msgs.length === 0 ? (
              <View style={{ gap: spacing.sm }}>
                <Text variant="caption" muted style={{ letterSpacing: 1, textTransform: 'uppercase' }}>{tr('u8.local.examples')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {suggestions.map((s) => <Chip key={s} icon="help-circle" label={tr(s)} onPress={() => ask(tr(s), (frUi8 as unknown as Record<string, string>)[s])} />)}
                </View>
                <Text variant="caption" muted>{tr('u8.local.count', { count: index.articles.size })}</Text>
              </View>
            ) : null}
          </View>
        )}
        renderItem={({ item: m }) => (
          <View style={{ gap: spacing.sm }}>
            <View style={{ alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: t.colors.primary, borderRadius: 20, borderBottomRightRadius: 6, paddingHorizontal: 14, paddingVertical: 10 }}>
              <Text color={t.colors.primaryText}>{m.q}</Text>
            </View>
            <AnswerCard m={m} />
          </View>
        )}
      />
    </Screen>
  );
}
