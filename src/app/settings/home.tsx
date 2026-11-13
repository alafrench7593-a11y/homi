/** Mon accueil : ordre et visibilité des cartes, choix des raccourcis, et l'introduction à revoir. */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { StaggerItem } from '@/components/Motion';
import { useToast } from '@/components/Overlays';
import { Button, Card, Chip, IconButton, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { effectiveHidden, homeCardOrder, HOME_CARDS, QUICK_KEYS, orderedHomeCards, quickIcon, quickLabel } from '@/features/home';
import { useUiStore } from '@/lib/store';
import { spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { Cascade, MorphIcon, MORPH_SHAPES, type MorphShape } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';

/** Libellés des modules (clés existantes) associés aux formes morphables. */
const MODULE_LABEL: Record<MorphShape, TKey> = {
  drop: 'u2.profiles.track_breastfeed', moon: 'u2.profiles.track_sleep', circle: 'u2.sky.u_cycle',
  belly: 'u2.preg.title', house: 'cy.nav.calendar', heart: 'u7.child.mk.memory',
};

/** Démonstration du système de mouvement : l'icône se transforme d'un module à l'autre (src/motion/MorphIcon). */
function ModuleMorphPreview() {
  const t = useTheme();
  const [shape, setShape] = React.useState<MorphShape>('house');
  return (
    <Cascade index={0}>
      <Card testID="module-morph-preview">
        <Row style={{ alignItems: 'center' }}>
          <MorphIcon shape={shape} size={52} color={t.colors.primary} testID="module-morph-icon" />
          <Row wrap gap={spacing.xs} style={{ flex: 1 }}>
            {MORPH_SHAPES.map((s) => (
              <Chip key={s} label={tr(MODULE_LABEL[s])} selected={s === shape} onPress={() => setShape(s)} testID={`morph-${s}`} />
            ))}
          </Row>
        </Row>
      </Card>
    </Cascade>
  );
}

export default function HomeSettings() {
  const toast = useToast();
  const order = useUiStore((s) => s.homeOrder);
  const storedHidden = useUiStore((s) => s.homeHidden);
  const setLayout = useUiStore((s) => s.setHomeLayout);
  const shortcuts = useUiStore((s) => s.quickShortcuts);
  const setShortcuts = useUiStore((s) => s.setQuickShortcuts);
  const dailyFavs = useUiStore((s) => s.dailyActionFavorites);
  const setDailyFavs = useUiStore((s) => s.setDailyActionFavorites);
  const setIntroSeen = useUiStore((s) => s.setIntroSeen);
  const simple = useUiStore((s) => s.simpleMode);
  const setSimple = useUiStore((s) => s.setSimpleMode);

  // Toutes les cartes ; celles masquées par défaut le restent tant qu'on ne les active pas
  const full = homeCardOrder(order);
  const hidden = effectiveHidden(order, storedHidden);
  const move = (key: string, d: -1 | 1) => {
    const i = full.indexOf(key);
    const j = i + d;
    if (j < 0 || j >= full.length) return;
    const next = [...full];
    [next[i], next[j]] = [next[j], next[i]];
    setLayout(next, hidden);
  };
  const toggle = (key: string, visible: boolean) => setLayout(full, visible ? hidden.filter((k) => k !== key) : [...hidden, key]);
  const chosen = shortcuts ?? [];
  const pick = (k: string) => {
    const next = chosen.includes(k) ? chosen.filter((x) => x !== k) : chosen.length >= 4 ? chosen : [...chosen, k];
    if (!chosen.includes(k) && chosen.length >= 4) toast(tr('u1.home.maxShortcuts'), 'info');
    setShortcuts(next.length ? next : null);
  };

  return (
    <Screen back title={tr('u1.home.title')} subtitle={tr('u1.home.subtitle')}>
      <ModuleMorphPreview />
      <Card>
        <Row>
          <View style={{ flex: 1, gap: 2 }}>
            <Text weight="bold">{tr('pj.simple.title')}</Text>
            <Text variant="small" muted>{tr('pj.simple.body')}</Text>
          </View>
          <Toggle label={tr('pj.simple.title')} value={simple} onChange={setSimple} />
        </Row>
      </Card>
      <SectionTitle title={tr('u1.home.cards')} />
      {full.map((key, i) => {
        const c = HOME_CARDS.find((x) => x.key === key)!;
        const visible = !hidden.includes(key);
        return (
          <StaggerItem key={key} index={i}>
            <Card style={{ paddingVertical: spacing.xs }}>
              {/* Libellé jamais coupé au milieu d'un mot : sur écran étroit, flèches et interrupteur passent dessous, à droite */}
              <Row wrap>
                <View style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 128, opacity: visible ? 1 : 0.55 }}>
                  <Text weight="medium">{c.label}</Text>
                  {c.detail ? <Text variant="caption" muted>{c.detail}</Text> : null}
                </View>
                <Row style={{ marginLeft: 'auto' }}>
                  <IconButton icon="arrow-up" label={tr('u1.home.up', { name: c.label })} onPress={() => move(key, -1)} />
                  <IconButton icon="arrow-down" label={tr('u1.home.down', { name: c.label })} onPress={() => move(key, 1)} />
                  <Toggle label={tr('u1.home.show', { name: c.label })} value={visible} onChange={(v) => toggle(key, v)} />
                </Row>
              </Row>
            </Card>
          </StaggerItem>
        );
      })}

      <SectionTitle title={tr('u1.home.shortcuts')} />
      <Card>
        {/* Les raccourcis se choisissent dans « Mes actions du jour », profil par profil : jamais un outil hors sujet */}
        <Text variant="small" muted>{tr('da.settingsHint')}</Text>
        {dailyFavs && Object.keys(dailyFavs).length ? <Button label={tr('da.reset')} size="sm" variant="ghost" onPress={() => { for (const k of Object.keys(dailyFavs)) setDailyFavs(k, null); setShortcuts(null); }} style={{ alignSelf: 'flex-start' }} /> : null}
      </Card>

      <Button label={tr('cy.home.customize')} variant="secondary" icon="sliders" onPress={() => router.push('/cycle/home-card' as never)} />
      <Button label={tr('u1.home.reset')} variant="secondary" icon="rotate-ccw" onPress={() => { setLayout([], []); setShortcuts(null); for (const k of Object.keys(dailyFavs ?? {})) setDailyFavs(k, null); toast(tr('u1.home.resetDone')); }} />
      <Button label={tr('cine.replay')} variant="ghost" icon="film" testID="settings-replay-cinematic" onPress={() => router.push({ pathname: '/cinematic', params: { replay: '1' } } as never)} />
      <Button label={tr('u1.home.replayIntro')} variant="ghost" icon="play-circle" onPress={() => { setIntroSeen(false); router.push('/intro'); }} />
      <Text variant="caption" muted>{tr('u1.home.local')}</Text>
    </Screen>
  );
}
