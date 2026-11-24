/**
 * Ancienne adresse du « mode enfant » (retiré à l'audit final du 23/11/2026 : aucune interface destinée à l'enfant).
 * Un lien ou une notification qui y mène encore ouvre la version IMPRIMABLE de la même routine.
 */
import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function KidRoutineRedirect() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <Redirect href={(id ? `/print?kind=routine&routine=${encodeURIComponent(id)}` : '/family/kid-routines') as never} />;
}
