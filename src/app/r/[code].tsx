/**
 * Lien ambassadeur : /r/<code>?c=<campagne>&f=<fonctionnalité>
 * Compte un clic anonyme agrégé, garde le code 30 jours sur l'appareil, puis ouvre l'inscription
 * (ou l'accueil si la personne est déjà connectée ; le code sera rattaché par la garde de session).
 * Aucune donnée personnelle collectée ici ; un code invalide mène simplement à l'accueil.
 */
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { backend } from '@/lib/backend';
import { useAuth } from '@/lib/auth';
import { normalizeCode, recordAffiliateClick, rememberAffiliateCode } from '@/lib/affiliateReferral';

export default function AffiliateLink() {
  const { code, c, f } = useLocalSearchParams<{ code?: string; c?: string; f?: string }>();
  const { session, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    const valid = normalizeCode(code);
    (async () => {
      if (valid) {
        await rememberAffiliateCode(valid, 'link', c, f);
        await recordAffiliateClick((fn, args) => backend.rpc(fn, args), valid, c, f);
      }
      router.replace(session ? '/app' : valid ? '/auth/sign-up' : '/app');
    })();
  }, [ready, session, code, c, f]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} testID="affiliate-link">
      <ActivityIndicator />
    </View>
  );
}
