/** Ancienne route d'onglet « Agenda » (/agenda, hors de la barre depuis HOMI) : le même agenda du foyer que /calendar, avec bouton retour (vers Famille) comme /track et /ask. */
import React from 'react';
import { FamilyCalendarScreen } from '../calendar';

export default function AgendaTab() {
  return <FamilyCalendarScreen inTab />;
}
