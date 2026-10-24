/**
 * État des services (mode développeur) : pour chaque service, « configuré » ou « mode démo / non configuré ».
 * Aucune clé n'est affichée ; côté serveur, la fonction service-status ne renvoie que des booléens.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Card, Divider, Icon, Row, SectionTitle, Text } from '@/components/ui';
import { backend, hasRealBackend, isDemo } from '@/lib/backend';
import { crashReportingConfigured } from '@/lib/crashReporting';
import { useDeveloperMode } from '@/lib/devMode';
import { useTheme } from '@/theme/ThemeProvider';

type State = 'ok' | 'demo' | 'missing';
interface Line { name: string; state: State; detail: string }

function Status({ line }: { line: Line }) {
  const t = useTheme();
  const colour = line.state === 'ok' ? t.colors.success : line.state === 'demo' ? t.colors.lavender : t.colors.danger;
  const label = line.state === 'ok' ? 'Configuré' : line.state === 'demo' ? 'Mode démo' : 'Non configuré';
  return (
    <Row style={{ paddingVertical: 8, alignItems: 'flex-start' }} gap={10}>
      <Icon name={line.state === 'ok' ? 'check-circle' : line.state === 'demo' ? 'eye' : 'x-circle'} size={18} color={colour} />
      <Text style={{ flex: 1 }} accessibilityLabel={`${line.name} : ${label}. ${line.detail}`}>
        <Text weight="bold">{line.name}</Text>{'  '}<Text variant="small" color={colour}>{label}</Text>{'\n'}
        <Text variant="caption" muted>{line.detail}</Text>
      </Text>
    </Row>
  );
}

export default function ServicesScreen() {
  const dev = useDeveloperMode();
  const server = useQuery({
    queryKey: ['service-status', isDemo],
    queryFn: () => backend.invoke<{ status: string; services: Record<string, boolean> }>('service-status', {}),
    enabled: dev,
    retry: 0,
  });
  if (!dev) return <Screen back title="État des services"><EmptyState icon="lock" title="Réservé au mode développeur" body="Activez-le en touchant 7 fois le numéro de version dans Réglages." /></Screen>;

  const env = process.env;
  const s = server.data?.services ?? {};
  const srv = (k: string): State => (isDemo ? 'demo' : s[k] ? 'ok' : 'missing');
  const lines: Line[] = [
    { name: 'Supabase (base, comptes, stockage)', state: isDemo ? 'demo' : 'ok', detail: isDemo ? (hasRealBackend ? 'Démonstration choisie : données sur ce téléphone.' : 'EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY absents.') : 'Connecté.' },
    { name: 'Gemini (assistant, explications, photos)', state: srv('gemini'), detail: 'Secret serveur GEMINI_API_KEY.' },
    { name: 'Resend (e-mails d’authentification)', state: isDemo ? 'demo' : s.resend && s.auth_email_hook ? 'ok' : 'missing', detail: 'RESEND_API_KEY, RESEND_FROM_EMAIL et SEND_EMAIL_HOOK_SECRET.' },
    { name: 'RevenueCat (abonnement)', state: isDemo ? 'demo' : (env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY) && s.revenuecat_webhook ? 'ok' : 'missing', detail: 'Clés publiques Apple/Google dans l’app + REVENUECAT_WEBHOOK_SECRET côté serveur.' },
    { name: 'Expo (notifications push)', state: isDemo ? 'demo' : Constants.expoConfig?.extra?.eas?.projectId && s.push ? 'ok' : 'missing', detail: 'EXPO_PUBLIC_EAS_PROJECT_ID + EXPO_ACCESS_TOKEN et PUSH_WEBHOOK_SECRET côté serveur. Les rappels locaux fonctionnent sans.' },
    { name: 'Open Food Facts (scanner)', state: srv('open_food_facts'), detail: 'OPENFOODFACTS_USER_AGENT (identification polie auprès de l’API).' },
    { name: 'Google Places (photos et fiches des sorties, facultatif)', state: srv('google_places'), detail: 'Secret serveur GOOGLE_PLACES_API_KEY (facturation Google Cloud). Sans elle : OpenStreetMap et illustrations.' },
    { name: 'Sentry (rapports de plantage)', state: crashReportingConfigured() ? 'ok' : 'missing', detail: 'EXPO_PUBLIC_SENTRY_DSN, et seulement avec l’accord de la personne.' },
  ];

  return (
    <Screen back title="État des services" subtitle="Mode développeur · aucune clé n’est affichée">
      {isDemo ? <Banner tone="demo" title="Mode démonstration">Les services serveur ne sont pas appelés.</Banner> : null}
      <SectionTitle title="Services" />
      {server.isLoading && !isDemo ? <Skeleton kind="list" rows={3} /> : server.isError && !isDemo ? (
        <ErrorView error={server.error} onRetry={() => void server.refetch()} title="État du serveur indisponible" />
      ) : (
        <Card>
          {lines.map((l, i) => (
            <React.Fragment key={l.name}>
              {i ? <Divider /> : null}
              <Status line={l} />
            </React.Fragment>
          ))}
        </Card>
      )}
      <Text variant="caption" muted>Pour tester réellement chaque service avec ses clés : npm run check:services (voir SETUP.md).</Text>
    </Screen>
  );
}
