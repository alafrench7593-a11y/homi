/** Rendu Markdown minimal et sûr (titres, gras, listes, liens) pour les articles et réponses. */
import React from 'react';
import { Linking, View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { Text } from './ui';

function Inline({ text, muted }: { text: string; muted?: boolean }) {
  const t = useTheme();
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
  return (
    <Text muted={muted}>
      {parts.map((p, i) => {
        if (p.startsWith('**')) return <Text key={i} weight="bold">{p.slice(2, -2)}</Text>;
        if (p.startsWith('_') && p.endsWith('_')) return <Text key={i} italic variant="small" muted>{p.slice(1, -1)}</Text>;
        const link = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (link && /^https:\/\//.test(link[2])) {
          return (
            <Text key={i} color={t.colors.primary} accessibilityRole="link" onPress={() => Linking.openURL(link[2])} style={{ textDecorationLine: 'underline' }}>
              {link[1]}
            </Text>
          );
        }
        return <React.Fragment key={i}>{p}</React.Fragment>;
      })}
    </Text>
  );
}

export function Markdown({ source }: { source: string }) {
  const t = useTheme();
  const blocks = source.split(/\n{2,}/);
  return (
    <View style={{ gap: 12 }}>
      {blocks.map((block, i) => {
        const lines = block.split('\n');
        if (/^#{1,3} /.test(lines[0])) {
          return (
            <View key={i} style={{ gap: 8 }}>
              <Text variant="heading" accessibilityRole="header">{lines[0].replace(/^#+ /, '')}</Text>
              {lines.slice(1).length > 0 && <Markdown source={lines.slice(1).join('\n')} />}
            </View>
          );
        }
        if (lines.every((l) => /^\s*([-•*]|\d+\.) /.test(l))) {
          return (
            <View key={i} style={{ gap: 6 }}>
              {lines.map((l, j) => (
                <View key={j} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.colors.accent, marginTop: 9 }} />
                  <View style={{ flex: 1 }}><Inline text={l.replace(/^\s*([-•*]|\d+\.) /, '')} /></View>
                </View>
              ))}
            </View>
          );
        }
        return <Inline key={i} text={lines.join('\n')} />;
      })}
    </View>
  );
}
