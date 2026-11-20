/**
 * Onglet « Questions » (/ask) : HOMI Aura (20/11/2026), à la place de l'écran « Bientôt disponible ».
 * Sans IA serveur, Aura fonctionne en mode LOCAL honnête (recherche dans les outils et les articles, sur le téléphone).
 * Écran de tab : place réservée à la barre du bas (TAB_SCREEN_INSET, appliqué par AuraScreen inTab).
 * L'historique des conversations de l'assistant en ligne : /assistant/history.
 */
import React from 'react';
import { AuraScreen } from '@/features/aura/AuraScreen';

export default function AskScreen() {
  return <AuraScreen inTab />;
}
