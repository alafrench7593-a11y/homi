/**
 * Onglet « Famille » (HOMI) : agenda, tâches, relais de nuit, temps pour soi, surcharge, rappels.
 * Route `/household` : `/family` est déjà l'écran d'organisation du foyer (liens existants conservés).
 */
import React from 'react';
import { HubScreen } from '@/features/hubs/HubScreen';

export default function FamilyTab() {
  return <HubScreen hub="family" />;
}
