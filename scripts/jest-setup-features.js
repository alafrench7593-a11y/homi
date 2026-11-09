/**
 * Tests : l'assistant IA en ligne est testé allumé (son code reste couvert) ; l'écran « Bientôt disponible »
 * est testé à part dans src/__tests__/aiComingSoon.test.tsx, qui remet l'interrupteur à faux.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { FEATURES } = require('../src/config/features');
FEATURES.aiAssistantOnline = true;
// Tests d'écran historiques écrits avant le Premium strict ; le strict est couvert par premiumStrict/premiumGate.
FEATURES.demoStrictPremium = false;
