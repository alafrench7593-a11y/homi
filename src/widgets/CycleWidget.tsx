/**
 * Widget iOS « Mon cycle » (expo-widgets, SDK 57). Contenu préparé par l'application : par défaut DISCRET
 * (aucun mot lié aux règles visible sur l'écran d'accueil du téléphone) ; détaillé seulement si la personne le choisit.
 * Règles du moteur de widget : pas de hook, pas d'état, aucune variable extérieure — tout passe par les props.
 */
import { Text, VStack } from '@expo/ui/swift-ui';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export interface CycleWidgetProps { title: string; line1: string; line2: string }

const CycleWidgetView = (props: CycleWidgetProps, _env: WidgetEnvironment) => {
  'widget';
  return (
    <VStack alignment="leading" spacing={4}>
      <Text>{props.title}</Text>
      <Text>{props.line1}</Text>
      <Text>{props.line2}</Text>
    </VStack>
  );
};

export default createWidget('CycleWidget', CycleWidgetView);
