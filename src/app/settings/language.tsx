/**
 * Langue et pays de résidence, réglés séparément (on ne déduit jamais le pays de la langue).
 * Seules les langues entièrement traduites sont sélectionnables ; les autres sont annoncées « en préparation ».
 * Changer de langue ne touche ni aux données ni à la session ; la préférence est gardée sur l'appareil et dans le profil.
 */
import React from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Banner, Card, Divider, haptic, Icon, Row, SectionTitle, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { backend, eq, isDemo } from '@/lib/backend';
import { useUiStore } from '@/lib/store';
import { deviceLanguages, deviceRegion, getLocale, t as tr } from '@/i18n';
import { returnHereAfterLocaleChange } from '@/i18n/I18nProvider';
import { availableLocales, defaultRegion, LOCALES, proposeLocale, REGIONS } from '@/i18n/locales';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';

export default function LanguageScreen() {
  const t = useTheme();
  const toast = useToast();
  const { session } = useAuth();
  const current = getLocale();
  const setLocalePref = useUiStore((s) => s.setLocalePref);
  const region = useUiStore((s) => s.region) ?? defaultRegion(deviceRegion());
  const setRegion = useUiStore((s) => s.setRegion);
  const deviceCode = proposeLocale(deviceLanguages());

  function choose(code: string) {
    if (code === current) return;
    haptic('selection');
    // la langue est aussi gardée dans le profil (autres appareils, e-mails futurs) ; jamais en démonstration
    if (session && !isDemo && (code === 'fr' || code === 'en')) {
      backend.update('profiles', { locale: code }, [eq('id', session.userId)]).catch(() => undefined);
    }
    returnHereAfterLocaleChange('/settings/language');
    setLocalePref(code);
    setTimeout(() => toast(tr('language.changed')), 300);
  }

  const regionName = (r: (typeof REGIONS)[number]) => (current === 'fr' ? r.fr : r.en);
  const regionInfo = REGIONS.find((r) => r.code === region) ?? REGIONS[0];

  return (
    <Screen back title={tr('language.title')} subtitle={tr('language.subtitle')}>
      <SectionTitle title={tr('language.section')} />
      <Card padded={false}>
        {availableLocales().map((l, i) => {
          const on = l.code === current;
          return (
            <View key={l.code}>
              {i ? <Divider /> : null}
              <Tappable
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                aria-checked={on}
                accessibilityLabel={l.native}
                onPress={() => choose(l.code)}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH + 8, paddingHorizontal: spacing.md, opacity: pressed ? 0.7 : 1 })}
              >
                <View style={{ flex: 1 }}>
                  <Text weight={on ? 'bold' : 'medium'}>{l.native}</Text>
                  {l.code === deviceCode ? <Text variant="caption" muted>{tr('language.device')}</Text> : null}
                </View>
                <Icon name={on ? 'check-circle' : 'circle'} size={22} color={on ? t.colors.primary : t.colors.textMuted} />
              </Tappable>
            </View>
          );
        })}
      </Card>

      <SectionTitle title={tr('language.planned')} />
      <Card tone="soft">
        <Text variant="small" muted>{tr('language.plannedHint')}</Text>
        <Row wrap style={{ marginTop: spacing.xs }}>
          {LOCALES.filter((l) => l.status === 'planned').map((l) => (
            <Text key={l.code} variant="caption" muted style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: t.colors.border }}>{l.native}</Text>
          ))}
        </Row>
      </Card>

      <SectionTitle title={tr('language.region')} />
      <Text variant="small" muted>{tr('language.regionHint')}</Text>
      <Card padded={false}>
        {REGIONS.map((r, i) => {
          const on = r.code === region;
          return (
            <View key={r.code}>
              {i ? <Divider /> : null}
              <Tappable
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                aria-checked={on}
                accessibilityLabel={regionName(r)}
                onPress={() => { haptic('selection'); setRegion(r.code); }}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH, paddingHorizontal: spacing.md, opacity: pressed ? 0.7 : 1 })}
              >
                <Text weight={on ? 'bold' : 'regular'} style={{ flex: 1 }}>{regionName(r)}</Text>
                <Text variant="caption" muted>{r.emergency}</Text>
                <Icon name={on ? 'check-circle' : 'circle'} size={20} color={on ? t.colors.primary : t.colors.textMuted} />
              </Tappable>
            </View>
          );
        })}
      </Card>
      <Banner tone="info">{tr('language.emergency', { numbers: regionInfo.emergency })}</Banner>
      {region !== 'FR' ? <Banner tone="warning">{tr('language.regionContent')}</Banner> : null}
    </Screen>
  );
}
