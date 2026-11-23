/**
 * Carte de confirmation STANDARD après un enregistrement (demandée par les pilotes Humeur et Biberon, qui la
 * refaisaient chacun) — toujours selon le résultat RÉEL, jamais avant :
 *  - `saved`   : « Enregistré » (coche, ton succès) ;
 *  - `offline` : « Hors ligne » + « Enregistré sur l'appareil — synchronisation dès le retour du réseau » (nuage
 *                barré, ton avertissement) : rien n'est perdu, rien à refaire ;
 *  - `error`   : « Une erreur est survenue. » + message + bouton « Réessayer » (ton erreur, annoncé tout de suite).
 * Le statut ne repose jamais sur la couleur seule (icône + titre). À l'apparition, la carte est amenée dans la
 * zone visible si elle était sous le pli (`useScreenScroll().ensureVisible`) et annoncée aux lecteurs d'écran
 * (`accessibilityLiveRegion`, rôle `alert` pour l'erreur). Mouvement : `Reveal` (immédiat si animations réduites).
 */
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { bannerColors, radius, spacing, type BannerTone } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { Icon, Text, type IconName } from '../ui';
import { SecondaryButton } from './Buttons';
import { Reveal } from '@/motion/Reveal';
import { useScreenScroll } from '../screenChrome';

export type ConfirmState = 'saved' | 'offline' | 'error';

/** Ton, icône et textes par défaut de chaque état (pur, testé). */
export function confirmationLook(state: ConfirmState): { tone: BannerTone; icon: IconName; titleKey: TKey; messageKey?: TKey; live: 'polite' | 'assertive' } {
  if (state === 'saved') return { tone: 'success', icon: 'check-circle', titleKey: 'common.saved', live: 'polite' };
  if (state === 'offline') return { tone: 'warning', icon: 'cloud-off', titleKey: 'sync.offline', messageKey: 'common.offlineSaved', live: 'polite' };
  return { tone: 'danger', icon: 'alert-circle', titleKey: 'common.error', live: 'assertive' };
}

export function ConfirmationCard({ state, title, message, onRetry, retryLabel, children, testID }: {
  state: ConfirmState;
  title?: string;
  message?: string;
  /** État `error` : relancer l'action (une promesse affiche le chargement du bouton). */
  onRetry?: () => unknown;
  retryLabel?: string;
  /** Contenu supplémentaire (lien « Voir l'historique », résumé…) */
  children?: React.ReactNode;
  testID?: string;
}) {
  const t = useTheme();
  const look = confirmationLook(state);
  const c = bannerColors(t)[look.tone];
  const ref = useRef<View>(null);
  const scroll = useScreenScroll();
  useEffect(() => { const id = setTimeout(() => { void scroll.ensureVisible(ref.current); }, 120); return () => clearTimeout(id); }, [state, scroll]);
  const body = message ?? (look.messageKey ? tr(look.messageKey) : undefined);
  return (
    <Reveal visible>
      <View ref={ref} collapsable={false} testID={testID ?? `confirmation-${state}`}
        accessibilityRole={state === 'error' ? 'alert' : undefined} accessibilityLiveRegion={look.live}
        style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, backgroundColor: c.bg, borderColor: c.edge, alignItems: 'flex-start' }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: c.edge }}>
          <Icon name={look.icon} size={16} color={c.fg} />
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
          <Text weight="bold" color={state === 'error' ? c.fg : t.colors.text}>{title ?? tr(look.titleKey)}</Text>
          {body ? <Text variant="small" muted>{body}</Text> : null}
          {children}
          {state === 'error' && onRetry ? (
            <SecondaryButton label={retryLabel ?? tr('common.retry')} icon="refresh-cw" size="sm" style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} onPress={() => onRetry()} testID="confirmation-retry" />
          ) : null}
        </View>
      </View>
    </Reveal>
  );
}
