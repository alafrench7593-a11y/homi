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
import { t as tr } from '@/i18n';

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
    if (!chosen.includes(k) && chosen.length >= 4) toast('Quatre raccourcis au maximum : retirez-en un d’abord.', 'info');
    setShortcuts(next.length ? next : null);
  };

  return (
    <Screen back title="Mon accueil" subtitle="Ce que vous voyez en premier, dans l’ordre qui vous convient.">
      <Card>
        <Row>
          <View style={{ flex: 1, gap: 2 }}>
            <Text weight="bold">{tr('pj.simple.title')}</Text>
            <Text variant="small" muted>{tr('pj.simple.body')}</Text>
          </View>
          <Toggle label={tr('pj.simple.title')} value={simple} onChange={setSimple} />
        </Row>
      </Card>
      <SectionTitle title="Cartes" />
      {full.map((key, i) => {
        const c = HOME_CARDS.find((x) => x.key === key)!;
        const visible = !hidden.includes(key);
        return (
          <StaggerItem key={key} index={i}>
            <Card style={{ paddingVertical: spacing.xs }}>
              <Row>
                <View style={{ flex: 1, opacity: visible ? 1 : 0.55 }}>
                  <Text weight="medium">{c.label}</Text>
                  {c.detail ? <Text variant="caption" muted>{c.detail}</Text> : null}
                </View>
                <IconButton icon="arrow-up" label={`Monter « ${c.label} »`} onPress={() => move(key, -1)} />
                <IconButton icon="arrow-down" label={`Descendre « ${c.label} »`} onPress={() => move(key, 1)} />
                <Toggle label={`Afficher « ${c.label} »`} value={visible} onChange={(v) => toggle(key, v)} />
              </Row>
            </Card>
          </StaggerItem>
        );
      })}

      <SectionTitle title="Raccourcis" />
      <Card>
        {/* Les raccourcis se choisissent dans « Mes actions du jour », profil par profil : jamais un outil hors sujet */}
        <Text variant="small" muted>{tr('da.settingsHint')}</Text>
        {dailyFavs && Object.keys(dailyFavs).length ? <Button label={tr('da.reset')} size="sm" variant="ghost" onPress={() => { for (const k of Object.keys(dailyFavs)) setDailyFavs(k, null); setShortcuts(null); }} style={{ alignSelf: 'flex-start' }} /> : null}
      </Card>

      <Button label={tr('cy.home.customize')} variant="secondary" icon="sliders" onPress={() => router.push('/cycle/home-card' as never)} />
      <Button label="Réinitialiser l’accueil" variant="secondary" icon="rotate-ccw" onPress={() => { setLayout([], []); setShortcuts(null); for (const k of Object.keys(dailyFavs ?? {})) setDailyFavs(k, null); toast('Accueil réinitialisé.'); }} />
      <Button label="Revoir l’introduction" variant="ghost" icon="play-circle" onPress={() => { setIntroSeen(false); router.push('/intro'); }} />
      <Text variant="caption" muted>Ces préférences sont gardées sur cet appareil.</Text>
    </Screen>
  );
}
