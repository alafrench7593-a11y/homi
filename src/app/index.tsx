/**
 * « / » : sur le web, la page publique statique est servie à cette adresse (web/site, Vercel) ; si l'application
 * y arrive en navigation interne, elle passe par /app (même logique de lancement). Mobile : lancement direct.
 */
import React from 'react';
import { Platform } from 'react-native';
import { Redirect } from 'expo-router';
import Launch from '@/features/launch/Launch';

export default function Index() {
  if (Platform.OS === 'web') return <Redirect href={'/app' as never} />;
  return <Launch />;
}
