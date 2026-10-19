/**
 * Personnaliser la carte « Mon cycle » de l'accueil : éléments affichés et leur ordre, raccourcis (4 au plus),
 * masquage des données sensibles. Ordre et raccourcis restent sur l'appareil ; le masquage suit le compte.
 */
import React from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button, IconButton } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { useCyclePreferences, useSaveCyclePreferences } from '@/lib/data/hooks-cycle';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useFertilityJourney } from '@/lib/data/hooks-fertility';
import { useUiStore } from '@/lib/store';
import { CARD_SHORTCUTS, fullOrder, MAX_SHORTCUTS, moveItem, resolveItems, resolveShortcuts, type CardItem, type CardShortcut } from '@/features/cycle/homeCard';
import { Choices, Glass, Ink, Rise, SwitchRow } from '@/features/cycle/kit';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

export default function HomeCardSettings() {
  const toast = useToast();
  const journey = useFertilityJourney();
  const mode = journey === 'ttc' ? 'ttc' : journey === 'avoid' ? 'avoid' : 'cycle';
  const storedItems = useUiStore((s) => s.cycleCardItems);
  const storedShortcuts = useUiStore((s) => s.cycleCardShortcuts);
  const setCard = useUiStore((s) => s.setCycleCard);
  const { prefs } = useCyclePreferences();
  const savePrefs = useSaveCyclePreferences();
  const chosen = resolveItems(storedItems, mode);
  const order = fullOrder(chosen);
  const shortcuts = resolveShortcuts(storedShortcuts);

  const setVisible = (k: CardItem, on: boolean) => setCard({ items: order.filter((x) => (x === k ? on : chosen.includes(x))) });
  const move = (k: CardItem, d: -1 | 1) => setCard({ items: moveItem(order, k, d).filter((x) => chosen.includes(x)) });
  const pickShortcuts = (v: CardShortcut[]) => {
    if (v.length > MAX_SHORTCUTS) return toast(tr('cy.hc.maxShortcuts', { n: MAX_SHORTCUTS }), 'info');
    setCard({ shortcuts: v });
  };

  return (
    <Screen back title={tr('cy.hc.title')} subtitle={tr('cy.hc.subtitle')}>
      <Rise>
        <Glass>
          <SwitchRow label={tr('cy.pv.hideOnHome')} hint={tr('cy.pv.hideOnHomeHint')} value={!!prefs.hide_on_home}
            onChange={async (v) => { try { await savePrefs.mutateAsync({ hide_on_home: v }); } catch (e) { toast(friendlyError(e), 'error'); } }} />
        </Glass>
      </Rise>
      <Rise delay={60}>
        <Glass>
          <Ink variant="heading">{tr('cy.hc.items')}</Ink>
          {order.map((k) => {
            const label = tr(`cy.hc.item.${k}` as TKey);
            const on = chosen.includes(k);
            return (
              <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
                <View style={{ flex: 1, minWidth: 160, opacity: on ? 1 : 0.6 }}>
                  <SwitchRow label={label} value={on} onChange={(v) => setVisible(k, v)} />
                </View>
                {on ? (
                  <View style={{ flexDirection: 'row' }}>
                    <IconButton icon="arrow-up" label={tr('cy.hc.up', { name: label })} onPress={() => move(k, -1)} />
                    <IconButton icon="arrow-down" label={tr('cy.hc.down', { name: label })} onPress={() => move(k, 1)} />
                  </View>
                ) : null}
              </View>
            );
          })}
          <Ink variant="caption" soft>{tr('cy.hc.estimateNote')}</Ink>
        </Glass>
      </Rise>
      <Rise delay={120}>
        <Glass>
          <Choices label={tr('cy.hc.shortcuts', { n: MAX_SHORTCUTS })} options={CARD_SHORTCUTS} value={shortcuts} multi
            onChange={(v) => pickShortcuts((v as CardShortcut[]) ?? [])} labelOf={(s) => tr(`cy.home.sc.${s}` as TKey)} />
        </Glass>
      </Rise>
      <Button label={tr('cy.hc.reset')} variant="secondary" icon="rotate-ccw" onPress={() => { setCard({ items: null, shortcuts: null }); toast(tr('cy.hc.resetDone')); }} full />
      <Ink variant="caption" soft>{tr('cy.hc.deviceNote')}</Ink>
    </Screen>
  );
}
