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
import { mapsConfigured, placesProvider, usePlacesCheck } from '@/lib/data/hooks-outings';
import { useTheme } from '@/theme/ThemeProvider';
import { t as tr } from '@/i18n';

type State = 'ok' | 'demo' | 'missing';
interface Line { name: string; state: State; detail: string }

function Status({ line }: { line: Line }) {
  const t = useTheme();
  const colour = line.state === 'ok' ? t.colors.success : line.state === 'demo' ? t.colors.lavender : t.colors.danger;
  const label = line.state === 'ok' ? tr('u1.svc.ok') : line.state === 'demo' ? tr('u1.svc.demo') : tr('u1.svc.missing');
  return (
    <Row style={{ paddingVertical: 8, alignItems: 'flex-start' }} gap={10}>
      <Icon name={line.state === 'ok' ? 'check-circle' : line.state === 'demo' ? 'eye' : 'x-circle'} size={18} color={colour} />
      <Text style={{ flex: 1 }} accessibilityLabel={tr('u1.svc.a11y', { name: line.name, label, detail: line.detail })}>
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
  // Vérification réelle de la recherche de lieux (une petite recherche Google côté serveur, seul l'état revient)
  const places = usePlacesCheck(dev && !isDemo);
  if (!dev) return <Screen back title={tr('u1.svc.title')}><EmptyState icon="lock" title={tr('u1.svc.devOnly')} body={tr('u1.svc.devHow')} /></Screen>;

  const env = process.env;
  const s = server.data?.services ?? {};
  const srv = (k: string): State => (isDemo ? 'demo' : s[k] ? 'ok' : 'missing');
  const lines: Line[] = [
    { name: tr('u1.svc.supabase'), state: isDemo ? 'demo' : 'ok', detail: isDemo ? (hasRealBackend ? tr('u1.svc.supabaseDemo') : tr('u1.svc.supabaseMissing')) : tr('u1.svc.connected') },
    { name: tr('u1.svc.gemini'), state: srv('gemini'), detail: tr('u1.svc.geminiD') },
    { name: tr('u1.svc.resend'), state: isDemo ? 'demo' : s.resend && s.auth_email_hook ? 'ok' : 'missing', detail: tr('u1.svc.resendD') },
    { name: tr('u1.svc.rc'), state: isDemo ? 'demo' : (env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY || env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY) && s.revenuecat_webhook ? 'ok' : 'missing', detail: tr('u1.svc.rcD') },
    { name: tr('u1.svc.expo'), state: isDemo ? 'demo' : Constants.expoConfig?.extra?.eas?.projectId && s.push ? 'ok' : 'missing', detail: tr('u1.svc.expoD') },
    { name: tr('u1.svc.off'), state: srv('open_food_facts'), detail: tr('u1.svc.offD') },
    { name: tr('u1.svc.osm'), state: placesProvider() === 'osm' ? 'ok' : 'missing', detail: placesProvider() === 'osm' ? tr('u1.svc.osmOn') : tr('u1.svc.osmOff') },
    { name: tr('u1.svc.places'), state: isDemo ? 'demo' : places.data === 'ok' ? 'ok' : 'missing', detail: isDemo ? tr('u1.svc.placesD') : tr('u1.svc.placesCheck', { result: places.data ?? (places.isFetching ? tr('u1.svc.inProgress') : tr('u1.svc.notDone')) }) },
    { name: tr('u1.svc.maps'), state: mapsConfigured() ? 'ok' : 'missing', detail: tr('u1.svc.mapsD') },
    { name: tr('u1.svc.sentry'), state: crashReportingConfigured() ? 'ok' : 'missing', detail: tr('u1.svc.sentryD') },
  ];

  return (
    <Screen back title={tr('u1.svc.title')} subtitle={tr('u1.svc.subtitle')}>
      {isDemo ? <Banner tone="demo" title={tr('u1.svc.demoTitle')}>{tr('u1.svc.demoBody')}</Banner> : null}
      <SectionTitle title={tr('u1.svc.services')} />
      {server.isLoading && !isDemo ? <Skeleton kind="list" rows={3} /> : server.isError && !isDemo ? (
        <ErrorView error={server.error} onRetry={() => void server.refetch()} title={tr('u1.svc.serverDown')} />
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
      <Text variant="caption" muted>{tr('u1.svc.testHint')}</Text>
    </Screen>
  );
}
