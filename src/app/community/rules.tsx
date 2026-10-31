/** Règles de la communauté : bienveillance, sécurité des enfants, confidentialité, témoignages (pas de conseils médicaux). */
import React from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Text } from '@/components/ui';
import { spacing } from '@/theme/tokens';

const RULES: { title: string; body: string }[] = [
  { title: 'Bienveillance avant tout', body: 'Pas de jugement, pas de moquerie, pas de harcèlement. Chaque parcours est différent : on partage, on soutient, on respecte les choix de chacun.' },
  { title: 'Des témoignages, pas des diagnostics', body: 'Ce que vous lisez ici, ce sont des expériences personnelles. Elles ne remplacent jamais l’avis d’un médecin, d’une sage-femme ou de la PMI. Ne conseillez jamais d’arrêter ou de modifier un traitement.' },
  { title: 'Protéger les enfants', body: 'Ne publiez ni nom complet, ni date de naissance complète, ni photo où un enfant est reconnaissable ou peu habillé. Préférez un âge (« 6 mois ») et des photos sans visage.' },
  { title: 'Protéger votre vie privée', body: 'Jamais d’adresse, de numéro de téléphone, d’e-mail, de position précise ni de document médical. Les photos sont nettoyées de leur localisation avant l’envoi, mais regardez aussi ce qu’elles montrent.' },
  { title: 'Pas de vente ni de publicité', body: 'Ni vente (y compris de lait maternel), ni lien promotionnel, ni sollicitation. Les messages avec plusieurs liens sont relus avant d’être visibles.' },
  { title: 'Signaler, bloquer', body: 'Un contenu vous semble dangereux ou blessant ? Signalez-le. Un contenu signalé trois fois est masqué en attendant une modération humaine. Vous pouvez bloquer un membre à tout moment.' },
  { title: 'Résumés et traductions automatiques', body: 'Les messages publiés dans la communauté peuvent être envoyés à l’intelligence artificielle Google Gemini (service externe) quand un membre demande un résumé ou une traduction. N’écrivez donc rien que vous ne publieriez pas.' },
  { title: 'Modération', body: 'Certaines informations (téléphone, adresse, date de naissance complète…) sont mises en relecture avant d’être visibles. Les décisions de modération sont enregistrées et l’autrice est informée.' },
];

export default function Rules() {
  return (
    <Screen back title="Règles de la communauté">
      {RULES.map((r, i) => (
        <Card key={r.title}>
          <Text weight="bold">{`${i + 1}. ${r.title}`}</Text>
          <Text variant="small" style={{ marginTop: 4 }}>{r.body}</Text>
        </Card>
      ))}
      <Banner tone="danger" title="Une urgence ?">{'Si quelqu’un semble en danger immédiat, appelez le 15 ou le 112. Pour une détresse psychologique : 3114.'}</Banner>
      <Button label="Numéros d’urgence" variant="secondary" icon="life-buoy" onPress={() => router.push('/emergency')} style={{ marginBottom: spacing.lg }} />
    </Screen>
  );
}
