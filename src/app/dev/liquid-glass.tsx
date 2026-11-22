/**
 * Entrée du laboratoire du verre liquide : ouvre le panneau de réglage PAR-DESSUS l'Accueil réel (vraie barre, vraies
 * cartes) puis y revient. Mode développeur ou démonstration seulement ; ailleurs, retour à l'accueil sans panneau.
 */
import { useEffect } from 'react';
import { Redirect, router } from 'expo-router';
import { isDemo } from '@/lib/backend';
import { useDeveloperMode } from '@/lib/devMode';
import { useLensStore } from '@/components/glass/liquid/store';

export default function LiquidGlassLab() {
  const dev = useDeveloperMode();
  const allowed = dev || isDemo;
  const setLab = useLensStore((s) => s.setLab);
  useEffect(() => { if (allowed) { setLab(true); router.replace('/' as never); } }, [allowed, setLab]);
  if (!allowed) return <Redirect href="/" />;
  return null;
}
