/** Accueil du scanner : produit ou aliment, historique récent, favoris, comparaison. */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Card, Icon, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { isDemo } from '@/lib/backend';
import { useRecallWatch, useScanFavorites, useScanHistory, useScanQuota } from '@/lib/data/hooks-scanner';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { ScanListRow } from '@/features/scanner/components';

export default function ScannerHub() {
  const t = useTheme();
  useRecallWatch();
  const historyQ = useScanHistory();
  const { data: history } = historyQ;
  const { ids: favIds } = useScanFavorites();
  const { data: quota } = useScanQuota();
  const recent = (history ?? []).slice(0, 4);
  const favorites = (history ?? []).filter((s) => favIds.has(s.id)).slice(0, 4);

  return (
    <Screen back title="Scanner" subtitle="Un produit ou un aliment précis, analysé selon des règles sourcées."
      action={{ label: 'Nouveau scan de produit', icon: 'camera', onPress: () => router.push('/scanner/product'), testID: 'scanner-new' }}>
      {isDemo ? <Banner tone="demo" title="Données de démonstration">{'Sans serveur connecté, le scanner n’utilise qu’une base fictive : les résultats ne sont pas des analyses réelles.'}</Banner> : null}
      <TodaySummary title="Mon scanner" items={[
        { icon: 'clock', value: history ? String(history.length) : '—', label: 'Analyses' },
        { icon: 'star', value: history ? String((history ?? []).filter((x) => favIds.has(x.id)).length) : '—', label: 'Favoris' },
        { icon: 'zap', value: quota ? String(quota.remaining) : '—', label: 'Restantes ce mois-ci' },
      ]} />
      <Row style={{ alignItems: 'stretch' }}>
        {([
          { to: '/scanner/product', icon: 'maximize', title: 'Scanner un produit', sub: 'Crème, lingettes, couches, lessive, produit ménager…' },
          { to: '/scanner/food', icon: 'search', title: 'Scanner un aliment', sub: 'Puis-je manger ou donner cet aliment ?' },
        ] as const).map((c) => (
          <View key={c.to} style={{ flex: 1 }}>
            <Card onPress={() => router.push(c.to)} accessibilityLabel={c.title} style={{ flex: 1 }}>
              <View style={{ gap: spacing.xs }}>
                <View style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.surfaceAlt }}>
                  <Icon name={c.icon} size={26} color={t.colors.primary} />
                </View>
                <Text weight="bold">{c.title}</Text>
                <Text variant="caption" muted>{c.sub}</Text>
              </View>
            </Card>
          </View>
        ))}
      </Row>
      {quota ? <Text variant="caption" muted>{`Analyses restantes ce mois-ci : ${quota.remaining} sur ${quota.quota}. Les alertes de rappel officiel sont toujours gratuites.`}</Text> : null}

      <SectionTitle title="Récents" action={history?.length ? 'Tout voir' : undefined} onAction={() => router.push('/scanner/history')} />
      {historyQ.isLoading && !history ? <Skeleton kind="card" rows={2} /> : historyQ.isError && !history ? (
        <ErrorView error={historyQ.error} onRetry={() => void historyQ.refetch()} title="Impossible d’afficher vos analyses" />
      ) : recent.length ? recent.map((s) => <ScanListRow key={s.id} s={s} favorite={favIds.has(s.id)} />) : (
        <EmptyState icon="maximize" title="Aucune analyse pour le moment." body="Scannez un code-barres ou recherchez un produit par son nom." action={{ label: 'Lancer un premier scan', icon: 'camera', onPress: () => router.push('/scanner/product') }} />
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
        <ListRow icon="slash" title="Produits à éviter" subtitle="La liste de votre foyer, signalée à chaque scan" onPress={() => router.push('/scanner/avoid')} />
      </Card>

      <Card tone="soft">
        <Text weight="medium">Comment ça marche ?</Text>
        <View style={{ gap: 6, marginTop: spacing.xs }} accessibilityLabel="1. Code-barres, photo ou recherche. 2. Vous confirmez le produit. 3. Fiche Open Food Facts, Open Beauty Facts ou Open Products Facts, et vérification RappelConso. 4. Règles sourcées (grossesse, allaitement, âge). 5. Explication en clair par IA, sans qu’elle décide du verdict.">
          {([
            ['camera', 'Code-barres, photo ou recherche'],
            ['check', 'Vous confirmez le produit'],
            ['database', 'Fiche Open Food Facts, Open Beauty Facts ou Open Products Facts, et vérification RappelConso'],
            ['book-open', 'Règles sourcées (grossesse, allaitement, âge)'],
            ['message-circle', 'Explication en clair par IA, sans qu’elle décide du verdict'],
          ] as const).map(([icon, label], i) => (
            <Row key={label} style={{ alignItems: 'flex-start' }}>
              <Icon name={icon} size={16} color={t.colors.primary} />
              <Text variant="small" style={{ flex: 1 }}>{`${i + 1}. ${label}`}</Text>
            </Row>
          ))}
        </View>
        <Text variant="caption" muted style={{ marginTop: spacing.xs }}>Aucune note chiffrée, jamais de garantie d’innocuité : chaque verdict cite ses sources et leur date.</Text>
      </Card>
    </Screen>
  );
}
