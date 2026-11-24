/**
 * Réglages › Aide et informations : aide, visites, textes légaux et « À propos ».
 * Sortie de la page Réglages pour qu'elle tienne sur un écran (examen App Store : tout se trouve vite).
 */
import React, { useRef } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { Screen } from '@/components/Screen';
import { Banner, Card, Divider, ListRow, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { BRAND } from '@/config/brand';
import { BrandName } from '@/components/BrandLogo';
import { HomiGlassMark } from '@/components/HomiGlassMark';
import { LEGAL_NOTICE, PRIVACY, SUPPORT, TERMS } from '@/content/legal';
import { useTourAllowed } from '@/features/tour/TourEntry';
import { startTour, useTourStore } from '@/features/tour/store';
import { isDemo } from '@/lib/backend';
import { setDeveloperMode, useDeveloperMode } from '@/lib/devMode';
import { useUiStore } from '@/lib/store';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function SettingsHelpScreen() {
  const toast = useToast();
  const tourAllowed = useTourAllowed();
  const hintsOff = useTourStore((s) => s.hintsOff);
  const setHintsOff = useTourStore((s) => s.setHintsOff);
  const devMode = useDeveloperMode();
  const versionTaps = useRef(0);
  const version = Constants.expoConfig?.version ?? '—';

  return (
    <Screen back title={tr('settings.helpInfo')}>
      <SectionTitle title={tr('settings.help')} />
      <Card>
        <ListRow icon="mail" title={tr('settings.help.write')} subtitle={BRAND.supportEmail} onPress={() => Linking.openURL(`mailto:${BRAND.supportEmail}`).catch(() => toast(tr('settings.help.writeTo', { email: BRAND.supportEmail }), 'info'))} />
        <Divider />
        <ListRow icon="instagram" title={tr('settings.help.instagram')} subtitle={BRAND.instagramHandle} onPress={() => void Linking.openURL(BRAND.instagram).catch(() => undefined)} testID="settings-instagram" />
        <Divider />
        <ListRow icon="help-circle" title={SUPPORT.title} onPress={() => router.push('/legal/support')} testID="settings-support" />
        <Divider />
        {tourAllowed ? <ListRow icon="compass" title={tr('tour.settingsRow')} subtitle={tr('tour.settingsRowSub')} onPress={startTour} testID="settings-tour" /> : null}
        {/* Présentation d'Aura : relançable ici (et depuis les réglages d'Aura) ; elle s'ouvre sur l'écran d'où l'on vient */}
        <ListRow icon="message-circle" title={tr('ta.intro.replay')} onPress={() => { useUiStore.getState().requestAuraIntro(); if (router.canDismiss()) router.dismissAll(); else router.back(); }} testID="settings-aura-intro" />
        {tourAllowed ? <Divider /> : null}
        <Row style={{ justifyContent: 'space-between', alignItems: 'center' }} testID="settings-tool-hints">
          <View style={{ flex: 1, gap: 2 }}>
            <Text>{tr('tour.hints.row')}</Text>
            <Text variant="small" muted>{tr('tour.hints.rowSub')}</Text>
          </View>
          <Toggle label={tr('tour.hints.row')} value={!hintsOff} onChange={(v) => setHintsOff(!v)} />
        </Row>
        <Divider />
        <ListRow icon="play-circle" title={tr('kn.settingsRow')} subtitle={tr('kn.settingsRowSub')} onPress={() => router.push('/discover?replay=1' as never)} testID="settings-discover" />
      </Card>

      <SectionTitle title={tr('settings.legal')} />
      <Card>
        <ListRow icon="file-text" title={TERMS.title} onPress={() => router.push('/legal/terms')} testID="settings-terms" />
        <Divider />
        <ListRow icon="lock" title={PRIVACY.title} onPress={() => router.push('/legal/privacy')} testID="settings-privacy-policy" />
        <Divider />
        <ListRow icon="info" title={LEGAL_NOTICE.title} onPress={() => router.push('/legal/notice')} testID="settings-legal-notice" />
      </Card>
      <Banner tone="info">{tr('settings.disclaimer')}</Banner>

      <SectionTitle title={tr('settings.about')} />
      <Card tone="soft">
        {/* moment de marque : la signature animée du symbole (verre), puis le mot-symbole — ne retarde rien */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xxs }}>
          <HomiGlassMark size={64} testID="settings-glass-mark" />
          <View testID="settings-wordmark"><BrandName size={30} /></View>
        </View>
        <Text italic muted>{tr('brand.tagline')}</Text>
        {/* Ligne informative : le geste caché (7 appuis, mode développeur) reste, sans surbrillance de bouton au toucher (iOS) */}
        <Text variant="small" muted suppressHighlighting style={{ marginTop: spacing.xs }} testID="settings-version" onPress={() => {
          const n = versionTaps.current + 1;
          versionTaps.current = n;
          if (n === 7) { void setDeveloperMode(!devMode); toast(devMode ? tr('settings.devOff') : tr('settings.devOn')); versionTaps.current = 0; }
        }}>
          {isDemo ? tr('settings.versionDemo', { version }) : tr('settings.version', { version })}
        </Text>
      </Card>
    </Screen>
  );
}
