/**
 * Parcours « Projet bébé » › « Comprendre mon cycle et mes tests ».
 */
import React from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Appear } from '@/components/Appear';
import { NavCard } from '@/components/Fertility';
import { useToast } from '@/components/Overlays';
import { Banner, Card, Icon, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { useCyclePreferences, useSaveCyclePreferences } from '@/lib/data/hooks-cycle';
import { friendlyError } from '@/lib/data/hooks-settings';
import { spacing } from '@/theme/tokens';

const GUARANTEES = [
  'Les tests sont analysés sur votre téléphone : la photo n’est pas envoyée.',
  'Par défaut, la photo est supprimée juste après l’analyse ; seul le résultat est gardé.',
  'Si vous gardez une photo, elle est chiffrée sur le téléphone avant d’être enregistrée dans votre espace privé.',
  'Une photo de glaire n’est envoyée pour analyse qu’avec votre accord, à chaque fois.',
  'Vous pouvez supprimer une photo immédiatement, à tout moment.',
  'Aucune photo n’est enregistrée dans votre galerie, publiée dans la communauté ou utilisée pour entraîner une IA.',
  'Aucune image n’apparaît dans les journaux techniques ou les statistiques.',
];

export default function UnderstandCycleScreen() {
  const toast = useToast();
  const { prefs } = useCyclePreferences();
  const savePrefs = useSaveCyclePreferences();

  return (
    <Screen back title="Comprendre mon cycle et mes tests" subtitle="Observer, photographier un test, garder un calendrier privé">
      <Banner tone="info" title="Des repères, pas des certitudes">La glaire, les tests et le calendrier aident à mieux connaître votre cycle. L’application ne confirme jamais une ovulation ni une grossesse : en cas de doute, parlez-en à une sage-femme ou à un médecin.</Banner>

      <Appear kind="soft">
        <NavCard items={[
          { icon: 'droplet', title: 'Observer ma glaire cervicale', subtitle: 'Aspect, texture, sensation, photo facultative', to: '/fertility/mucus' },
          { icon: 'camera', title: 'Photographier un test d’ovulation', subtitle: 'Analyse sur le téléphone, résultat à confirmer', to: '/fertility/test/ovulation' },
          { icon: 'camera', title: 'Photographier un test de grossesse', subtitle: 'Analyse sur le téléphone, résultat à confirmer', to: '/fertility/test/pregnancy' },
          { icon: 'calendar', title: 'Mon calendrier du cycle', subtitle: 'Tout ce que vous notez, avec les estimations', to: '/fertility/calendar' },
          { icon: 'list', title: 'Tests compatibles', subtitle: 'Marques prises en charge et règles des notices', to: '/fertility/compatible' },
        ]} />
      </Appear>

      <SectionTitle title="Options" />
      <Card>
        <Toggle
          value={prefs.track_intercourse}
          label="Afficher les rapports dans mon calendrier"
          onChange={async (v) => {
            try { await savePrefs.mutateAsync({ track_intercourse: v }); } catch (err) { toast(friendlyError(err), 'error'); }
          }}
        />
        <Text variant="caption" muted style={{ marginTop: 4 }}>Désactivé par défaut. Les rapports restent strictement privés.</Text>
      </Card>

      <SectionTitle title="Confidentialité renforcée" />
      <Card>
        {GUARANTEES.map((g) => (
          <Row key={g} gap={8} style={{ alignItems: 'flex-start', paddingVertical: 3 }}>
            <View style={{ marginTop: 2 }}><Icon name="shield" size={16} /></View>
            <Text variant="small" style={{ flex: 1 }}>{g}</Text>
          </Row>
        ))}
      </Card>
      <Text variant="caption" muted center style={{ marginBottom: spacing.lg }}>Ces outils ne remplacent ni la notice des tests, ni l’avis d’un professionnel de santé.</Text>
    </Screen>
  );
}
