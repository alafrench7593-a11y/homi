/** Onglet « Agenda » de la barre du bas (07/11/2026) : le même agenda du foyer que /calendar, sans bouton retour. */
import React from 'react';
import { FamilyCalendarScreen } from '../calendar';

export default function AgendaTab() {
  return <FamilyCalendarScreen inTab />;
}
