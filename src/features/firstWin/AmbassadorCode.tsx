/**
 * « J'ai un code ambassadeur » (paywall, 24/11/2026).
 *  1. le SERVEUR vérifie le code et rattache l'ambassadeur (`affiliate_attach`, partie Ambassadeurs) ;
 *  2. si le code est valable, on ouvre l'écran OFFICIEL d'Apple avec le code pré-rempli (code d'offre App Store) :
 *     c'est Apple qui affiche et applique le prix réduit. Aucune réduction n'est simulée ni affichée par HOMI.
 * Sans compte : le code est gardé (30 jours) et rattaché après l'inscription (mécanisme existant).
 * Web : rien n'est acheté ici, le code s'utilise dans l'app iPhone.
 */
import React, { useState } from 'react';
import { Linking, Platform, Pressable, TextInput, View } from 'react-native';
import { Button, Icon, Text } from '@/components/ui';
import { BRAND } from '@/config/brand';
import { backend } from '@/lib/backend';
import { attachPendingAffiliate, normalizeCode, rememberAffiliateCode } from '@/lib/affiliateReferral';
import { t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { NO_HYPHENS } from './kit';

/** Adresse officielle d'Apple pour utiliser un code d'offre, code pré-rempli (lettres et chiffres seulement). */
export function appleRedeemUrl(appStoreId: string, code: string): string {
  return `https://apps.apple.com/redeem?ctx=offercodes&id=${encodeURIComponent(appStoreId)}&code=${encodeURIComponent(code.replace(/[^a-z0-9]/gi, '').toUpperCase())}`;
}

type Outcome = 'ok' | 'locked' | 'unknown_code' | 'self' | 'already_customer' | 'invalid' | 'network' | 'saved' | 'web' | 'android';

/** Ce que l'écran dit après la vérification ; seuls « ok » et « locked » ouvrent la fenêtre d'Apple. */
export function outcomeKey(o: Outcome): TKey {
  return `pw5.code.${o}` as TKey;
}

export function AmbassadorCode({ signedIn, webShowcase, onRedeemOpened }: { signedIn: boolean; webShowcase?: boolean; onRedeemOpened?: () => void }) {
  const th = useTheme();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  async function apply() {
    const code = normalizeCode(value);
    if (!code) { setOutcome('invalid'); return; }
    if (webShowcase || Platform.OS === 'web') { await rememberAffiliateCode(code, 'code'); setOutcome('web'); return; }
    if (Platform.OS !== 'ios') { await rememberAffiliateCode(code, 'code'); setOutcome('android'); return; }
    setBusy(true);
    try {
      await rememberAffiliateCode(code, 'code');
      if (!signedIn) { setOutcome('saved'); return; } // rattaché après l'inscription
      const r = await attachPendingAffiliate((fn, args) => backend.rpc(fn, args));
      const o: Outcome = r === 'ok' || r === 'locked' || r === 'unknown_code' || r === 'self' || r === 'already_customer' ? r : 'network';
      setOutcome(o);
      if ((o === 'ok' || o === 'locked') && BRAND.appStoreId) {
        await Linking.openURL(appleRedeemUrl(BRAND.appStoreId, code));
        onRedeemOpened?.();
      }
    } finally { setBusy(false); }
  }

  const good = outcome === 'ok' || outcome === 'locked' || outcome === 'saved';
  if (!open) {
    return (
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} testID="fw-code-open" style={{ minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}>
        <Icon name="gift" size={16} color={th.colors.primary} />
        <Text variant="small" weight="bold" color={th.colors.primary}>{tr('pw5.code.link')}</Text>
      </Pressable>
    );
  }
  return (
    <View style={{ gap: spacing.xs, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: th.colors.border, backgroundColor: th.colors.surface }} testID="fw-code">
      <Text weight="bold">{tr('pw5.code.title')}</Text>
      <TextInput value={value} onChangeText={(v) => { setValue(v); setOutcome(null); }} autoCapitalize="characters" autoCorrect={false} maxLength={24}
        placeholder={tr('pw5.code.placeholder')} placeholderTextColor={th.colors.textMuted} accessibilityLabel={tr('pw5.code.title')} testID="fw-code-input"
        style={{ minHeight: MIN_TOUCH, borderRadius: radius.md, borderWidth: 1, borderColor: th.colors.border, paddingHorizontal: spacing.sm, color: th.colors.text, fontSize: 17, letterSpacing: 1 }} />
      <Button label={tr('pw5.code.apply')} onPress={() => void apply()} loading={busy} disabled={!value.trim()} testID="fw-code-apply" />
      {outcome ? (
        <View accessibilityLiveRegion="polite" style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }} testID={`fw-code-${outcome}`}>
          <Icon name={good ? 'check-circle' : 'info'} size={16} color={good ? th.colors.primary : th.colors.textMuted} />
          <Text variant="small" style={[{ flex: 1 }, NO_HYPHENS]}>{tr(outcomeKey(outcome))}</Text>
        </View>
      ) : null}
      <Text variant="caption" muted style={NO_HYPHENS}>{tr('pw5.code.note')}</Text>
    </View>
  );
}
