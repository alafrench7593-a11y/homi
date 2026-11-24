/** Ancienne adresse du programme (liens déjà partagés) → écran unique /ambassadors. */
import { Redirect } from 'expo-router';

export default function AmbassadorLegacy() {
  return <Redirect href="/ambassadors" />;
}
