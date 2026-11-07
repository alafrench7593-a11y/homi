/**
 * Widget iOS « Bébé » (07/11/2026, expo-widgets SDK 57) : prochain biberon et prochaine prise de traitement.
 * Contenu préparé par l'application (babyWidgetContent) : DISCRET par défaut ; jamais le nom d'un médicament.
 * Règles du moteur de widget : pas de hook, pas d'état, aucune variable extérieure — tout passe par les props.
 */
import { Text, VStack } from '@expo/ui/swift-ui';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export interface BabyWidgetProps { title: string; line1: string; line2: string }

const BabyWidgetView = (props: BabyWidgetProps, _env: WidgetEnvironment) => {
  'widget';
  return (
    <VStack alignment="leading" spacing={4}>
      <Text>{props.title}</Text>
      <Text>{props.line1}</Text>
      <Text>{props.line2}</Text>
    </VStack>
  );
};

export default createWidget('BabyWidget', BabyWidgetView);
