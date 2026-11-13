/**
 * Démonstration seulement : pastille compacte « Démo · Camille ⇄ Sam » pour essayer les deux côtés d'une mission sur
 * un seul appareil (la démonstration n'a qu'un compte). Remplace l'ancien grand bandeau (16/11/2026) sans perdre la
 * fonction : un appui bascule vers l'autre personne du foyer (le conjoint rejoint le foyer s'il n'existe pas encore).
 * Rien de tel n'existe avec un vrai compte : chacun répond depuis le sien.
 */
import React from 'react';
import { Pressable, View } from 'react-native';
import { isDemo } from '@/lib/backend';
import { usePeople } from '@/lib/data/hooks-family-load';
import { useDemoSwitchPerson } from '@/lib/data/hooks-missions';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useToast } from '@/components/Overlays';
import { Icon, Text } from '@/components/ui';
import { UserAvatar } from '@/components/UserAvatar';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export function DemoPerson() {
  const t = useTheme();
  const { people, me } = usePeople();
  const sw = useDemoSwitchPerson();
  const toast = useToast();
  if (!isDemo || !me) return null;
  const self = people.find((p) => p.id === me);
  const other = people.find((p) => p.id !== me);
  const myName = self?.name ?? '';
  const otherName = other?.name ?? tr('mis.demo.partner');
  const label = `${tr('mis.demo.as', { person: myName })}. ${tr('mis.demo.switch', { person: otherName })}`;
  return (
    <Pressable testID="mission-demo-switch" accessibilityRole="button" accessibilityLabel={label} accessibilityHint={tr('mis.demo.hint')} disabled={sw.isPending}
      onPress={() => sw.mutateAsync(other?.id).catch((e) => toast(friendlyError(e), 'error'))}
      // maxWidth : sans borne, la pastille (alignSelf flex-start) prenait la largeur de son contenu et sortait de l'écran à 320 px (audit 09)
      style={({ pressed }) => ({ alignSelf: 'flex-start', maxWidth: '100%', flexDirection: 'row', flexWrap: 'wrap', rowGap: 2, alignItems: 'center', gap: spacing.xs, minHeight: MIN_TOUCH, paddingLeft: 6, paddingRight: spacing.sm,
        borderRadius: radius.pill, borderWidth: 1, borderColor: t.colors.border, backgroundColor: pressed ? t.colors.surfaceAlt : t.material.lines.controlFill, opacity: sw.isPending ? 0.6 : 1 })}>
      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: t.material.lines.iconWell }}>
        <Text variant="caption" weight="bold" color={t.colors.primary}>{tr('mis.demo.badge')}</Text>
      </View>
      {self ? <UserAvatar path={self.avatarPath} initial={self.initial} size={24} /> : null}
      <Text variant="small" weight="bold" testID="mission-demo-me" style={{ flexShrink: 1 }}>{myName}</Text>
      <Icon name="repeat" size={14} color={t.colors.textMuted} />
      <Text variant="small" muted style={{ flexShrink: 1 }}>{tr('mis.demo.switchShort', { person: otherName })}</Text>
    </Pressable>
  );
}
