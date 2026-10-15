/** Accueil du scanner : produit ou aliment, historique récent, favoris, comparaison. */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Icon, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { isDemo } from '@/lib/backend';
import { useRecallWatch, useScanFavorites, useScanHistory, useScanQuota } from '@/lib/data/hooks-scanner';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { ScanListRow } from '@/features/scanner/components';

export default function ScannerHub() {
  const t = useTheme();
  useRecallWatch();
  const { data: history } = useScanHistory();
  const { ids: favIds } = useScanFavorites();
  const { data: quota } = useScanQuota();
  const recent = (history ?? []).slice(0, 4);
  const favorites = (history ?? []).filter((s) => favIds.has(s.id)).slice(0, 4);

  return (
    <Screen back title="Scanner" subtitle="Un produit ou un aliment précis, analysé selon des règles sourcées.">
      {isDemo ? <Banner tone="demo" title="Données de démonstration">{'Sans serveur connecté, le scanner n’utilise qu’une base fictive : les résultats ne sont pas des analyses réelles.'}</Banner> : null}
      <Card onPress={() => router.push('/scanner/product')} accessibilityLabel="Scanner un produit">
        <Row style={{ alignItems: 'center' }}>
          <Icon name="maximize" size={28} color={t.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="heading">Scanner un produit</Text>
            <Text variant="small" muted>Crème, lingettes, couches, lessive, produit ménager…</Text>
          </View>
        </Row>
      </Card>
      <Card onPress={() => router.push('/scanner/food')} accessibilityLabel="Scanner un aliment">
        <Row style={{ alignItems: 'center' }}>
          <Icon name="search" size={28} color={t.colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="heading">Scanner un aliment</Text>
            <Text variant="small" muted>Puis-je manger ou donner cet aliment ?</Text>
          </View>
        </Row>
      </Card>
      {quota ? <Text variant="caption" muted>{`Analyses restantes ce mois-ci : ${quota.remaining} sur ${quota.quota}. Les alertes de rappel officiel sont toujours gratuites.`}</Text> : null}

      <SectionTitle title="Récents" action={history?.length ? 'Tout voir' : undefined} onAction={() => router.push('/scanner/history')} />
      {recent.length ? recent.map((s) => <ScanListRow key={s.id} s={s} favorite={favIds.has(s.id)} />) : (
        <Text variant="small" muted>Aucune analyse pour le moment.</Text>
      )}

      {favorites.length ? (
        <>
          <SectionTitle title="Favoris" action="Tout voir" onAction={() => router.push({ pathname: '/scanner/history', params: { filter: 'favorites' } })} />
          {favorites.map((s) => <ScanListRow key={s.id} s={s} favorite />)}
        </>
      ) : null}

      <SectionTitle title="Outils" />
      <Card padded={false}>
        <ListRow icon="clock" title="Historique et favoris" subtitle="Supprimer une analyse ou tout l’historique" onPress={() => router.push('/scanner/history')} />
        <ListRow icon="columns" title="Comparer deux produits" subtitle="Côte à côte, chacun analysé séparément" onPress={() => router.push('/scanner/compare')} />
      </Card>

      <Card tone="soft">
        <Text weight="medium">Comment ça marche ?</Text>
        <Text variant="small" muted style={{ marginTop: 4 }}>
          {'1. Code-barres, photo ou recherche. 2. Vous confirmez le produit. 3. Fiche Open Food Facts, Open Beauty Facts ou Open Products Facts, et vérification RappelConso. 4. Règles sourcées (grossesse, allaitement, âge). 5. Explication en clair par IA, sans qu’elle décide du verdict.'}
        </Text>
        <Text variant="caption" muted style={{ marginTop: spacing.xs }}>Aucune note chiffrée, jamais de garantie d’innocuité : chaque verdict cite ses sources et leur date.</Text>
      </Card>
      <Button label="Nouveau scan de produit" icon="camera" onPress={() => router.push('/scanner/product')} />
    </Screen>
  );
}
