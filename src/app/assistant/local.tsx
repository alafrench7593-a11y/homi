/**
 * Assistant de la bibliothèque — 100 % sur l'appareil.
 * Il retrouve la réponse dans les articles sourcés (grossesse, projet bébé, bébé, enfant, TDAH, autisme, dys, maladies…)
 * et la présente : réponse, points clés, quand demander conseil, article et sources. Aucune question ne quitte le téléphone.
 */
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Linking, TextInput, View } from 'react-native';
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
import { useActivePregnancy, useArticles, useChildren, useProfile } from '@/lib/data/hooks';
import { childAge } from '@/lib/domain/child';
import { answer, buildIndex, type KbIndex, type LocalAnswer } from '@/lib/localAI/engine';

let CACHE: { n: number; index: KbIndex } | null = null;
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, spacing } from '@/theme/tokens';

interface Msg { id: string; q: string; a: LocalAnswer }

const SUGGEST: Record<string, string[]> = {
  pregnant: ['Puis-je boire du café enceinte ?', 'Quels aliments éviter ?', 'Quand partir à la maternité ?', 'Comment se passe la péridurale ?', 'Combien dure le congé maternité ?'],
  ttc: ['Quand ai-je le plus de chances de concevoir ?', 'Quand consulter si la grossesse tarde ?', 'Qui peut accéder à la PMA ?', 'Quels vaccins avant une grossesse ?'],
  newborn: ['Mon bébé pleure tout le soir', 'Comment conserver le lait maternel ?', 'Quand commencer la diversification ?', 'Que faire en cas de bronchiolite ?', 'Quels vaccins sont obligatoires ?'],
  child: ['Mon enfant a peut-être un TDAH', 'Comment savoir si mon enfant est autiste ?', 'Qu’est-ce que la dyslexie ?', 'Comment obtenir une AESH ?', 'Mon enfant fait pipi au lit'],
};

function AnswerCard({ m }: { m: Msg }) {
  const t = useTheme();
  const a = m.a;
  const gold = t.colors.gold;
  if (a.kind === 'urgent' && a.safety) {
    return (
      <View style={{ gap: spacing.sm }}>
        <UrgentCard level={a.safety} contacts={a.urgent} />
        {a.related.length ? <Text variant="caption" muted>Quand vous le pourrez, ces articles peuvent aussi aider :</Text> : null}
        <Related items={a.related} />
      </View>
    );
  }
  if (a.kind === 'none' || !a.main) {
    return (
      <GlassSurface fill={t.colors.surface} depth={1} radius={22}>
        <View style={{ padding: spacing.md, gap: spacing.sm }} testID="local-none">
          <Text weight="bold">Je n’ai pas trouvé de réponse précise dans les articles.</Text>
          <Text variant="small" muted>Je préfère ne rien inventer. Essayez avec d’autres mots, ou posez la question à un professionnel de santé (médecin, sage-femme, PMI, pharmacien).</Text>
          {a.related.length ? <Text variant="caption" muted>Articles les plus proches :</Text> : null}
          <Related items={a.related} />
        </View>
      </GlassSurface>
    );
  }
  return (
    <GlassSurface fill={t.colors.surface} depth={2} radius={24}>
      <View style={{ padding: spacing.lg, gap: spacing.sm }} testID="local-answer">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="book-open" size={14} color={gold} />
          <Text variant="caption" weight="bold" color={gold} style={{ flex: 1 }} numberOfLines={2}>D’après « {a.main.title} »</Text>
        </View>
        {a.main.section && !/^introduction$/i.test(a.main.section) ? <Text weight="bold">{a.main.section}</Text> : null}
        <Markdown source={a.answer ?? ''} />
        {a.keyPoints?.length ? (
          <View style={{ borderRadius: 18, padding: spacing.md, gap: 6, backgroundColor: tint(gold, t.isDark ? 0.16 : 0.09) }}>
            <Text variant="caption" weight="bold" color={gold} style={{ letterSpacing: 1, textTransform: 'uppercase' }}>À retenir</Text>
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
              <Text variant="caption" weight="bold" color={t.colors.danger}>Quand demander conseil</Text>
            </View>
            <Markdown source={a.care} />
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          <Tappable accessibilityRole="button" onPress={() => router.push(`/article/${a.main!.slug}`)} testID="local-read"
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: t.colors.primary }}>
            <Icon name="book-open" size={14} color={t.colors.primaryText} />
            <Text variant="caption" weight="bold" color={t.colors.primaryText}>Lire l’article complet</Text>
          </Tappable>
        </View>
        {a.main.sources.length ? (
          <View style={{ gap: 4 }}>
            <Text variant="caption" muted>Sources :</Text>
            {a.main.sources.slice(0, 3).map((s) => (
              <Text key={s.url} variant="caption" color={t.colors.primary} accessibilityRole="link" onPress={() => void Linking.openURL(s.url)} style={{ textDecorationLine: 'underline' }}>{s.label}</Text>
            ))}
          </View>
        ) : null}
        {a.related.length ? <Text variant="caption" muted>Voir aussi :</Text> : null}
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
  const params = useLocalSearchParams<{ q?: string }>();
  const articlesQ = useArticles();
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
      const built = buildIndex(data.map((a) => ({ slug: a.slug, title: a.title, summary: a.summary, body_md: a.body_md, tags: a.tags, sources: a.sources, min_age_months: a.min_age_months, max_age_months: a.max_age_months })));
      CACHE = { n: data.length, index: built };
      setIndex(built);
    }, 30);
    return () => clearTimeout(id);
  }, [articlesQ.data]);
  const [text, setText] = useState(typeof params.q === 'string' ? params.q : '');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const list = useRef<FlatList<Msg>>(null);

  const journey = pregnancy ? 'pregnant' : (children ?? []).some((c) => childAge(c.birth_date).months < 24) ? 'newborn' : (children ?? []).length ? 'child' : (profile?.journeys ?? []).includes('ttc') ? 'ttc' : 'pregnant';
  const suggestions = [...SUGGEST[journey], ...(journey !== 'child' ? SUGGEST.child.slice(0, 2) : [])];

  function ask(q: string) {
    const question = q.trim();
    if (!question || !index) return;
    haptic('light');
    setMsgs((m) => [...m, { id: `${Date.now()}`, q: question, a: answer(index, question) }]);
    setText('');
    setTimeout(() => list.current?.scrollToEnd({ animated: true }), 80);
  }

  return (
    <Screen back title="Assistant des articles" subtitle="Répond à partir des articles sourcés, sur votre téléphone" scroll={false} padded={false}
      footer={(
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
          <TextInput value={text} onChangeText={setText} placeholder="Posez votre question…" placeholderTextColor={t.colors.textMuted} multiline maxLength={300}
            onSubmitEditing={() => ask(text)} blurOnSubmit returnKeyType="send" testID="local-input" accessibilityLabel="Votre question"
            style={{ flex: 1, minHeight: 48, maxHeight: 120, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, color: t.colors.text, fontFamily: fonts.body, fontSize: 16,
              backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,250,246,0.9)', borderWidth: 1, borderColor: t.isDark ? 'rgba(240,217,207,0.22)' : 'rgba(184,134,90,0.3)' }} />
          <IconButton icon="send" label="Envoyer" tone="primary" onPress={() => ask(text)} disabled={!text.trim() || !index} />
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
            <Banner tone="info" icon="lock">Privé et hors ligne : vos questions restent sur ce téléphone. L’assistant cite les articles de l’application ; il ne pose aucun diagnostic et ne remplace pas un professionnel.</Banner>
            {!index ? <Skeleton rows={2} /> : msgs.length === 0 ? (
              <View style={{ gap: spacing.sm }}>
                <Text variant="caption" muted style={{ letterSpacing: 1, textTransform: 'uppercase' }}>Exemples de questions</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {suggestions.map((s) => <Chip key={s} icon="help-circle" label={s} onPress={() => ask(s)} />)}
                </View>
                <Text variant="caption" muted>{index.articles.size} articles · grossesse, projet bébé, bébé, enfant, TDAH, autisme, dys, maladies…</Text>
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
