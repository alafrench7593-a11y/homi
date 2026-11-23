/**
 * HOMI Aura — route d'entrée : `/assistant` (sans thème) et `/assistant?theme=<id>` pour les assistants thématiques de
 * la liste des 200 (29, 49, 64, 82, 110, 124, 140, 174, 190, 197, 200 : supabase/functions/_shared/aura-prompt.ts).
 * Paramètres facultatifs : `q` (question posée à l'ouverture), `mode=local` (sans IA), `draft` et `situation` (174).
 */
import React from 'react';
import { AuraScreen } from '@/features/aura/AuraScreen';

export default function AssistantScreen() {
  return <AuraScreen />;
}
