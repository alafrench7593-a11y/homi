/**
 * Lecture d'un article en sections soignées :
 * - « En bref » : carte dorée, points clés cochés ;
 * - « Questions fréquentes » : questions dépliables une à une ;
 * - « Quand demander conseil » : carte d'attention avec accès direct aux urgences ;
 * - les autres sections : titre + texte aéré.
 * Un sommaire en pastilles résume les sections. Sans sections `## `, rendu Markdown habituel.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Markdown } from '@/components/Markdown';
import { GlassSurface } from '@/components/Glass';
import { Icon, Text, type IconName } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { tint } from '@/components/ToolGlyph';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export interface ArticleSection { title: string; body: string }

/** Découpe un article en sections `## Titre` (le texte avant le premier titre devient une introduction). */
export function splitSections(md: string): { intro: string; sections: ArticleSection[] } {
  const parts = md.split(/^## +/m);
  const intro = parts[0].trim();
  const sections = parts.slice(1).map((p) => {
    const nl = p.indexOf('\n');
    return { title: (nl < 0 ? p : p.slice(0, nl)).trim(), body: (nl < 0 ? '' : p.slice(nl + 1)).trim() };
  });
  return { intro, sections };
}

/** Questions fréquentes : chaque paragraphe qui commence par **question** devient une paire question / réponse. */
export function splitFaq(body: string): { q: string; a: string }[] {
  const out: { q: string; a: string }[] = [];
  for (const block of body.split(/\n{2,}/)) {
    const m = block.match(/^\s*(?:[-*]\s*)?\*\*(.+?)\*\*\s*:?\s*([\s\S]*)$/);
    if (m) out.push({ q: m[1].trim(), a: m[2].trim() });
    else if (out.length) out[out.length - 1].a += `\n\n${block.trim()}`;
  }
  return out;
}

/** Temps de lecture (≈ 200 mots par minute, jamais zéro). */
export function readingMinutes(md: string): number {
  return Math.max(1, Math.round(md.split(/\s+/).filter(Boolean).length / 200));
}

const kindOf = (title: string): 'brief' | 'faq' | 'care' | 'plain' => {
  const s = title.toLowerCase();
  if (s.startsWith('en bref')) return 'brief';
  if (s.startsWith('questions')) return 'faq';
  if (s.includes('demander conseil') || s.includes('consulter') || s.includes('urgence')) return 'care';
  return 'plain';
};
const ICON: Record<string, IconName> = { brief: 'star', faq: 'help-circle', care: 'alert-circle', plain: 'book-open' };

function Faq({ items }: { items: { q: string; a: string }[] }) {
  const t = useTheme();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((it, i) => {
        const on = open === i;
        return (
          <GlassSurface key={i} fill={t.colors.surface} depth={1} radius={18}>
            <Tappable bare accessibilityRole="button" accessibilityState={{ expanded: on }} onPress={() => setOpen(on ? null : i)} testID={`faq-${i}`}
              style={{ padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text weight="bold" style={{ flex: 1 }}>{it.q}</Text>
              <Icon name={on ? 'minus' : 'plus'} size={16} color={t.colors.primary} />
            </Tappable>
            {on && it.a ? <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md }}><Markdown source={it.a} /></View> : null}
          </GlassSurface>
        );
      })}
    </View>
  );
}

export function ArticleBody({ source }: { source: string }) {
  const t = useTheme();
  const { intro, sections } = splitSections(source);
  if (!sections.length) return <Markdown source={source} />;
  const gold = t.colors.gold;
  return (
    <View style={{ gap: spacing.lg }} testID="article-body">
      {/* sommaire */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }} accessibilityRole="summary">
        {sections.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: tint(gold, t.isDark ? 0.2 : 0.1) }}>
            <Icon name={ICON[kindOf(s.title)]} size={12} color={gold} />
            <Text variant="caption" weight="bold" color={gold}>{s.title}</Text>
          </View>
        ))}
      </View>
      {intro ? <Markdown source={intro} /> : null}
      {sections.map((s, i) => {
        const kind = kindOf(s.title);
        if (kind === 'brief') {
          const points = s.body.split('\n').filter((l) => /^\s*[-*•]\s+/.test(l)).map((l) => l.replace(/^\s*[-*•]\s+/, ''));
          return (
            <View key={i} style={{ borderRadius: 24, padding: spacing.lg, gap: spacing.sm, backgroundColor: tint(gold, t.isDark ? 0.16 : 0.09), borderWidth: 1, borderColor: tint(gold, 0.35) }} testID="article-brief">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="star" size={16} color={gold} />
                <Text variant="heading" accessibilityRole="header">{s.title}</Text>
              </View>
              {points.length ? points.map((p, j) => (
                <View key={j} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: gold, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                    <Icon name="check" size={12} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}><Markdown source={p} /></View>
                </View>
              )) : <Markdown source={s.body} />}
            </View>
          );
        }
        if (kind === 'faq') {
          const items = splitFaq(s.body);
          return (
            <View key={i} style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="help-circle" size={18} color={t.colors.primary} />
                <Text variant="heading" accessibilityRole="header">{s.title}</Text>
              </View>
              {items.length ? <Faq items={items} /> : <Markdown source={s.body} />}
            </View>
          );
        }
        if (kind === 'care') {
          return (
            <View key={i} style={{ borderRadius: 24, padding: spacing.lg, gap: spacing.sm, backgroundColor: t.colors.dangerSoft, borderWidth: 1, borderColor: tint(t.colors.danger, 0.3) }} testID="article-care">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="alert-circle" size={18} color={t.colors.danger} />
                <Text variant="heading" accessibilityRole="header">{s.title}</Text>
              </View>
              <Markdown source={s.body} />
              <Tappable accessibilityRole="button" onPress={() => router.push('/emergency')} testID="article-emergency"
                style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: t.colors.danger }}>
                <Icon name="life-buoy" size={14} color="#FFFFFF" />
                <Text variant="caption" weight="bold" color="#FFFFFF">Urgences · 15 · 112 · 3114</Text>
              </Tappable>
            </View>
          );
        }
        return (
          <View key={i} style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: gold }} />
              <Text variant="heading" accessibilityRole="header">{s.title}</Text>
            </View>
            <Markdown source={s.body} />
          </View>
        );
      })}
    </View>
  );
}
