/**
 * « Mes outils » sans Premium et première visite (ticket 3, 21/11/2026).
 *  - `useToolLock()` : outil réservé pour CE compte, d'après les droits réels (has_premium du serveur, my_access :
 *    co-parent partenaire, offre IA, outils achetés à vie — src/lib/premium/access.ts). Droit encore inconnu : rien
 *    n'est marqué (jamais de cadenas affiché puis retiré chez un abonné) ; l'écran de l'outil reste de toute façon
 *    gardé par `PremiumGate`.
 *  - `ToolsIntro` : « Bienvenue dans Mes outils » — classement par catégorie et couleurs, recherche, fonctionnement de
 *    Premium (aperçu libre, outils réservés marqués, offre ensuite). Passable (« Passer » / « Compris ») et revoyable
 *    (« Comment ça marche ? ») ; mémorisée sur l'appareil PAR COMPTE (`toolsIntroSeen`, src/lib/store.ts).
 *  - `PreviewBanner` : sans Premium, une ligne « Aperçu du catalogue » + « Voir l'offre Premium » (écran /premium
 *    existant, inchangé).
 */
import React, { useCallback } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Glass } from '@/components/glass';
import { Button, Icon, Text, type IconName } from '@/components/ui';
import { backend } from '@/lib/backend';
import { useAuth } from '@/lib/auth';
import { useAccess } from '@/lib/data/hooks-access';
import { isLockedFor } from '@/lib/premium/access';
import type { CatalogTool } from '@/lib/domain/toolCatalog';
import { useUiStore } from '@/lib/store';
import { useStoresHydrated } from '@/features/tour/store';
import { Cascade } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';

/** has_premium à trois états (même clé de cache que `PremiumGate` : une seule lecture). */
export function useHasPremium(): boolean | undefined {
  const { session } = useAuth();
  const q = useQuery({ queryKey: [session?.userId, 'subscriptions', 'premium'], queryFn: () => backend.rpc<boolean>('has_premium'), enabled: !!session, staleTime: 60_000 });
  if (!session) return undefined;
  return q.data === true ? true : q.data === false || q.isError ? false : undefined;
}

export function useToolLock(): { premium: boolean | undefined; locked: ((tool: CatalogTool) => boolean) | undefined } {
  const premium = useHasPremium();
  const access = useAccess().data ?? null;
  const fn = useCallback((tool: CatalogTool) => !tool.free && tool.category !== 'account' && isLockedFor(tool.href, premium, access), [premium, access]);
  return { premium, locked: premium === false ? fn : undefined };
}

/** Introduction vue par ce compte ? `show()` la rouvre, `hide()` la ferme (et s'en souvient). */
export function useToolsIntro(): { open: boolean; show: () => void; hide: () => void } {
  const uid = useAuth().session?.userId ?? null;
  const seen = useUiStore((s) => (uid ? !!s.toolsIntroSeen?.[uid] : true));
  const set = useUiStore((s) => s.setToolsIntroSeen);
  // Sans compte encore lu, ou avant la relecture des préférences : rien (sinon la carte clignotait puis revenait)
  const hydrated = useStoresHydrated();
  return { open: hydrated && !!uid && !seen, show: () => { if (uid) set(uid, false); }, hide: () => { if (uid) set(uid, true); } };
}

export function ToolsIntro({ premium, onDone }: { premium: boolean | undefined; onDone: () => void }) {
  const t = useTheme();
  const rows: [IconName, TKey][] = [
    ['grid', 'mt.intro.sort'],
    ['search', 'mt.intro.search'],
    [premium === true ? 'unlock' : 'lock', premium === true ? 'mt.intro.premiumOn' : 'mt.intro.premium'],
  ];
  return (
    <Cascade index={0}>
      <Glass variant="card" radius={radius.lg} testID="tools-intro" contentStyle={{ padding: spacing.md, gap: spacing.sm }} accessibilityLabel={tr('mt.intro.a11y')}>
        <Text variant="heading" accessibilityRole="header" testID="tools-intro-title">{tr('mt.intro.title')}</Text>
        {rows.map(([icon, key]) => (
          <View key={key} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.surfaceAlt }}>
              <Icon name={icon} size={15} color={t.colors.primary} />
            </View>
            <Text variant="small" style={{ flex: 1, minWidth: 0 }}>{tr(key)}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'flex-end' }}>
          <Button label={tr('mt.intro.skip')} variant="ghost" size="sm" onPress={onDone} testID="tools-intro-skip" />
          <Button label={tr('mt.intro.ok')} size="sm" onPress={onDone} testID="tools-intro-ok" />
        </View>
      </Glass>
    </Cascade>
  );
}

export function PreviewBanner() {
  const t = useTheme();
  return (
    <View testID="tools-preview" style={{ gap: spacing.xs, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surface }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Icon name="lock" size={16} color={t.colors.primary} />
        <Text weight="bold" style={{ flex: 1, minWidth: 0 }}>{tr('mt.preview.title')}</Text>
      </View>
      <Text variant="small" muted>{tr('mt.preview.body')}</Text>
      <Button label={tr('mt.preview.cta')} icon="star" variant="secondary" size="sm" onPress={() => router.push('/premium')} testID="tools-preview-offer" />
    </View>
  );
}
