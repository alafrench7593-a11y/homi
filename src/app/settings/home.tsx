/** Mon accueil : le même éditeur que « Personnaliser » sur l'accueil (modules, actions rapides, outils épinglés), et l'introduction à revoir. */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button, Card, Chip, Row, Text, Toggle } from '@/components/ui';
import { HomeEditor } from '@/features/homeToday/HomeModules';
import { homeSituation } from '@/features/homeToday/homeLayout';
import { useActivePregnancy, useHouseholdMembers, useTrackedChildren } from '@/lib/data/hooks';
import { useScope } from '@/lib/data/hooks-scope';
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
  const setIntroSeen = useUiStore((s) => s.setIntroSeen);
  const simple = useUiStore((s) => s.simpleMode);
  const setSimple = useUiStore((s) => s.setSimpleMode);
  // Même situation que l'accueil : le profil affiché + la composition du foyer
  const scope = useScope();
  const pregnancy = useActivePregnancy();
  const { data: children } = useTrackedChildren();
  const { data: members } = useHouseholdMembers();
  const adults = (members ?? []).filter((m) => m.role === 'owner' || m.role === 'coparent').length;
  const situation = homeSituation({ scope: scope.scope, adults, children: children?.length ?? 0, pregnancy: !!pregnancy });

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
      {/* Le même éditeur que « Personnaliser » en bas de l'accueil : modules, actions rapides, outils épinglés, rétablir */}
      <HomeEditor situation={situation} />

      <Button label={tr('cy.home.customize')} variant="secondary" icon="sliders" onPress={() => router.push('/cycle/home-card' as never)} />
      <Button label={tr('cine.replay')} variant="ghost" icon="film" testID="settings-replay-cinematic" onPress={() => router.push({ pathname: '/cinematic', params: { replay: '1' } } as never)} />
      <Button label={tr('u1.home.replayIntro')} variant="ghost" icon="play-circle" onPress={() => { setIntroSeen(false); router.push('/intro'); }} />
    </Screen>
  );
}
