/**
 * Paywall de conclusion de la « première réussite » — VUE pure (données reçues en propriétés) : utilisée par l'écran
 * réel (/start/offers) et par la prévisualisation des trois maquettes (/dev/paywall).
 *
 * Trois directions (même contenu réel, même calcul, ordre et poids différents) :
 *  A « Résultat d'abord » : aperçu du résultat en grand, bénéfices, formules, bouton, frise ;
 *  B « Essai expliqué »   : frise accès immédiat → date et montant du premier paiement en tête, puis formules ;
 *  C « Formules comparées » : « Pour qui » (toi + co-parent / tout le foyer), durée, tableau « Combien tu paies ».
 * Toujours : titre qui reprend le bénéfice (variante A/B), ≤ 3 bénéfices de la formule choisie, montant TOTAL facturé,
 * équivalent mensuel en complément, économie avec sa base, bouton au libellé exact (essai seulement s'il est confirmé),
 * conditions lisibles sous le bouton, croix visible (retour au résultat), Restaurer / Conditions / Confidentialité.
 * Changer de formule met à jour bénéfices, prix, période, frise, éligibilité et bouton dans le même rendu.
 */
import React from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTopInset } from '@/components/demoInset';
import { Banner, Button, Icon, IconButton, Loading, Segmented, Text } from '@/components/ui';
import { Cascade, PressableScale } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { resultText } from './demos';
import { BenefitLine } from './kit';
import { paywallTitleKey, type DemoResult, type NeedId, type TitleVariant } from './model';
import {
  benefitsFor, canBuy, ctaFor, phaseView, termsFor, timelineFor,
  type CatalogState, type OfferCard, type PurchasePhase,
} from './offer';

export type Direction = 'A' | 'B' | 'C';
export const DIRECTIONS: Direction[] = ['A', 'B', 'C'];

export interface PaywallViewProps {
  direction: Direction;
  variant: TitleVariant;
  need: NeedId | null;
  result: DemoResult | null;
  cards: OfferCard[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  catalog: CatalogState;
  phase: PurchasePhase;
  aiOnline: boolean;
  now: Date;
  resume?: boolean;
  /** Pas encore de compte : petite note « compte juste avant de payer » */
  needsAccount?: boolean;
  onBuy: () => void;
  onRetry: () => void;
  onRestore: () => void;
  onClose: () => void;
  onLegal: (doc: 'terms' | 'privacy') => void;
}

export function PaywallView(props: PaywallViewProps) {
  const { direction, variant, need, result, cards, selectedKey, onSelect, catalog, phase, aiOnline, now } = props;
  const th = useTheme();
  const top = useTopInset();
  const bottom = useSafeAreaInsets().bottom;
  const card = cards.find((c) => c.key === selectedKey) ?? null;
  const pv = phaseView(phase);
  const buyable = canBuy(catalog, phase, !!card);

  const title = (
    <Text variant="title" center accessibilityRole="header" testID="fw-pw-title">{tr(paywallTitleKey(need, variant))}</Text>
  );
  const preview = result ? <ResultPreview result={result} large={direction === 'A'} /> : null;
  const benefits = card ? (
    <View style={{ gap: spacing.xs }} testID="fw-pw-benefits">
      <Text variant="label" accessibilityRole="header">{tr('fw.pw.benefits')}</Text>
      {benefitsFor(card.tier, need, { aiOnline, trial: card.trialDays > 0 }).map((b, i) => <BenefitLine key={i} text={b} testID={`fw-pw-benefit-${i}`} />)}
    </View>
  ) : null;
  const timeline = card ? <TimelineBlock card={card} now={now} prominent={direction === 'B'} /> : null;
  const plans = catalog === 'ready'
    ? direction === 'C' ? <ComparedPlans cards={cards} selected={card} onSelect={onSelect} now={now} /> : <PlanList cards={cards} selectedKey={selectedKey} onSelect={onSelect} />
    : <CatalogNotice state={catalog} onRetry={props.onRetry} />;

  const order: React.ReactNode[] = direction === 'A'
    ? [title, preview, benefits, plans, timeline]
    : direction === 'B'
      ? [title, preview, timeline, plans, benefits]
      : [title, preview, plans, benefits];

  return (
    <View style={{ flex: 1, backgroundColor: th.colors.background, paddingTop: top }} testID={`fw-paywall-${direction}`}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: spacing.sm, minHeight: MIN_TOUCH }}>
        <IconButton icon="x" label={tr('fw.pw.close')} tone="filled" onPress={props.onClose} testID="fw-pw-close" />
      </View>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.md, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        {props.resume ? <Banner tone="success" title={tr('fw.pw.resume')} /> : null}
        {order.filter(Boolean).map((n, i) => <Cascade key={i} index={i}>{n}</Cascade>)}
        <View style={{ gap: 4 }} testID="fw-pw-fine">
          {card?.demo ? <Text variant="caption" muted testID="fw-pw-demo-grid">{tr('fw.pw.demoGrid')}</Text> : card ? <Text variant="caption" muted>{tr('fw.pw.storePrice')}</Text> : null}
          <Text variant="caption" muted>{tr('fw.pw.cancel')}</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: spacing.sm }}>
          <LinkButton label={tr('fw.pw.restore')} onPress={props.onRestore} disabled={phase === 'buying' || phase === 'restoring' || catalog === 'unavailable'} testID="fw-pw-restore" />
          <LinkButton label={tr('fw.pw.terms')} onPress={() => props.onLegal('terms')} testID="fw-pw-terms" />
          <LinkButton label={tr('fw.pw.privacy')} onPress={() => props.onLegal('privacy')} testID="fw-pw-privacy" />
        </View>
      </ScrollView>
      {/* Bouton et conditions : toujours visibles ensemble, au-dessus du pli */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: bottom + spacing.sm, gap: spacing.xs, maxWidth: 560, width: '100%', alignSelf: 'center',
        borderTopWidth: 1, borderTopColor: th.material.lines.separator, backgroundColor: th.colors.background }} testID="fw-pw-footer">
        {pv && phase !== 'buying' && phase !== 'restoring' ? (
          <View accessibilityLiveRegion="polite" testID={`fw-pw-state-${phase}`}><Banner tone={pv.tone}>{tr(pv.text)}</Banner></View>
        ) : null}
        {props.needsAccount && buyable ? <Text variant="caption" muted center testID="fw-pw-account-note">{tr('fw.pw.accountNote')}</Text> : null}
        <Button label={card ? ctaFor(card.plan) : tr('fw.pw.retry')} size="lg" full loading={phase === 'buying' || phase === 'restoring'} disabled={!buyable}
          onPress={props.onBuy} accessibilityHint={card ? termsFor(card.plan, now) : undefined} testID="fw-pw-cta" />
        {card && catalog === 'ready' ? <Text variant="small" center testID="fw-pw-terms-line">{termsFor(card.plan, now)}</Text> : null}
      </View>
    </View>
  );
}

function LinkButton({ label, onPress, disabled, testID }: { label: string; onPress: () => void; disabled?: boolean; testID?: string }) {
  const th = useTheme();
  return (
    <Pressable accessibilityRole="link" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} hitSlop={6} testID={testID}
      style={{ minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: spacing.xs, opacity: disabled ? 0.5 : 1 }}>
      <Text variant="small" weight="bold" color={th.colors.primary}>{label}</Text>
    </Pressable>
  );
}

/** Aperçu du résultat obtenu dans la démo (ce que la personne vient de faire). */
function ResultPreview({ result, large }: { result: DemoResult; large: boolean }) {
  const th = useTheme();
  return (
    <View testID="fw-pw-preview" accessible accessibilityLabel={`${tr('fw.pw.preview')}. ${resultText(result)}`}
      style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', borderRadius: radius.lg, padding: large ? spacing.md : spacing.sm,
        backgroundColor: th.material.lines.iconWell }}>
      <Icon name="check-circle" size={large ? 24 : 18} color={th.colors.success} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="caption" weight="bold" muted>{tr('fw.pw.preview')}</Text>
        <Text variant={large ? 'body' : 'small'}>{resultText(result)}</Text>
      </View>
    </View>
  );
}

function TimelineBlock({ card, now, prominent }: { card: OfferCard; now: Date; prominent: boolean }) {
  const th = useTheme();
  const tl = timelineFor(card.plan, { now });
  return (
    <View testID="fw-pw-timeline" style={{ gap: spacing.xs, ...(prominent ? { borderRadius: radius.lg, borderWidth: 1, borderColor: th.tokens.border.rest, padding: spacing.md, backgroundColor: th.tokens.surface.opaque } : null) }}>
      <Text variant="label" accessibilityRole="header">{tr('fw.tl.title')}</Text>
      <View accessibilityRole="list">
        {tl.steps.map((s, i) => {
          const last = i === tl.steps.length - 1;
          return (
            <View key={s.key} style={{ flexDirection: 'row', gap: spacing.sm }} accessible accessibilityLabel={`${s.title}. ${s.body}`} testID={`fw-pw-tl-${s.key}`}>
              <View style={{ width: 16, alignItems: 'center' }}>
                <View style={{ width: 14, height: 14, borderRadius: 7, marginTop: 3, backgroundColor: i === 0 ? th.colors.primary : th.colors.surface, borderWidth: 2, borderColor: i === 0 ? th.colors.primary : th.colors.text }} />
                {!last ? <View style={{ flex: 1, width: 2, minHeight: 18, backgroundColor: th.colors.border, marginVertical: 2 }} /> : null}
              </View>
              <View style={{ flex: 1, paddingBottom: last ? 0 : spacing.sm, gap: 2 }}>
                <Text weight="bold">{s.title}</Text>
                <Text variant="small" muted={!last} weight={last ? 'medium' : undefined}>{s.body}</Text>
              </View>
            </View>
          );
        })}
      </View>
      <Text variant="caption" muted testID="fw-pw-tl-caption">{tl.caption}</Text>
    </View>
  );
}

function PlanRow({ card, selected, onSelect }: { card: OfferCard; selected: boolean; onSelect: (k: string) => void }) {
  const th = useTheme();
  return (
    <PressableScale onPress={() => onSelect(card.key)} haptic="selection" scale={0.985} accessibilityRole="radio" accessibilityState={{ checked: selected, selected }} aria-checked={selected}
      accessibilityLabel={card.a11y} testID={`fw-plan-${card.key.replace(':', '-')}`}>
      <View style={{ borderRadius: radius.lg, borderWidth: selected ? 2 : 1, borderColor: selected ? th.colors.primary : th.colors.border, backgroundColor: selected ? th.colors.surface : th.colors.surfaceAlt,
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', minHeight: 64 }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected ? th.colors.primary : th.colors.textMuted, alignItems: 'center', justifyContent: 'center' }}>
          {selected ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: th.colors.primary }} /> : null}
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
          <Text weight="bold">{card.name}</Text>
          <Text variant="small" muted>{card.access}</Text>
          {card.monthly || card.saving ? <Text variant="caption" muted>{[card.monthly, card.saving].filter(Boolean).join(' · ')}</Text> : null}
          {card.trialDays > 0 ? <Text variant="caption" weight="bold" color={th.colors.primary}>{tr('fw.trialBadge', { count: card.trialDays })}</Text> : null}
        </View>
        <View style={{ alignItems: 'flex-end', maxWidth: '40%' }}>
          <Text weight="bold" style={{ textAlign: 'right' }} testID={`fw-billed-${card.key.replace(':', '-')}`}>{card.billed}</Text>
        </View>
      </View>
    </PressableScale>
  );
}

function PlanList({ cards, selectedKey, onSelect }: { cards: OfferCard[]; selectedKey: string | null; onSelect: (k: string) => void }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label" accessibilityRole="header">{tr('fw.pw.plans')}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={tr('fw.pw.plans')} style={{ gap: spacing.xs }} testID="fw-pw-plans">
        {cards.map((c) => <PlanRow key={c.key} card={c} selected={c.key === selectedKey} onSelect={onSelect} />)}
      </View>
    </View>
  );
}

/** Direction C : seul·e à deux ou tout le foyer, puis la durée, puis « Combien tu paies ». */
function ComparedPlans({ cards, selected, onSelect, now }: { cards: OfferCard[]; selected: OfferCard | null; onSelect: (k: string) => void; now: Date }) {
  const th = useTheme();
  const tier = selected?.tier ?? 'premium';
  const tiers = (['premium', 'family'] as const).filter((t) => cards.some((c) => c.tier === t));
  const sameTier = cards.filter((c) => c.tier === tier);
  const tl = selected ? timelineFor(selected.plan, { now }) : null;
  return (
    <View style={{ gap: spacing.sm }} testID="fw-pw-compare">
      {tiers.length > 1 ? (
        <View style={{ gap: spacing.xs }}>
          <Text variant="label">{tr('fw.pw.who')}</Text>
          <Segmented label={tr('fw.pw.who')} value={tier}
            options={tiers.map((t) => ({ value: t, label: tr(`fw.pw.who.${t}` as TKey), testID: `fw-tier-${t}` }))}
            onChange={(t) => { const first = cards.find((c) => c.tier === t && (t === 'family' || c.period === 'monthly')) ?? cards.find((c) => c.tier === t); if (first) onSelect(first.key); }} />
          {selected ? <Text variant="small" muted>{selected.access}</Text> : null}
        </View>
      ) : null}
      {sameTier.length > 1 ? (
        <View style={{ gap: spacing.xs }}>
          <Text variant="label">{tr('fw.pw.duration')}</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel={tr('fw.pw.duration')} style={{ gap: spacing.xs }} testID="fw-pw-plans">
            {sameTier.map((c) => <PlanRow key={c.key} card={c} selected={c.key === selected?.key} onSelect={onSelect} />)}
          </View>
        </View>
      ) : selected ? <PlanRow card={selected} selected onSelect={onSelect} /> : null}
      {selected && tl ? (
        <View testID="fw-pw-howmuch" style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: th.tokens.border.rest, padding: spacing.md, gap: spacing.xs, backgroundColor: th.tokens.surface.opaque }}>
          <Text variant="label" accessibilityRole="header">{tr('fw.pw.howMuch')}</Text>
          {tl.steps.map((s) => (
            <View key={s.key} accessible accessibilityLabel={`${s.title}. ${s.body}`} style={{ flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <Text weight="bold">{s.title}</Text>
              <Text variant="small" style={{ flexShrink: 1, textAlign: 'right' }}>{s.body}</Text>
            </View>
          ))}
          <Text variant="caption" muted>{tl.caption}</Text>
        </View>
      ) : null}
    </View>
  );
}

function CatalogNotice({ state, onRetry }: { state: CatalogState; onRetry: () => void }) {
  if (state === 'loading') return <Loading label={tr('fw.pw.loading')} />;
  const key: TKey = state === 'offline' ? 'fw.pw.offline' : state === 'error' ? 'fw.pw.error' : state === 'empty' ? 'fw.pw.empty' : 'fw.pw.unavailable';
  return (
    <View style={{ gap: spacing.xs }} testID={`fw-pw-catalog-${state}`}>
      <Banner tone={state === 'unavailable' ? 'info' : 'warning'}>{tr(key)}</Banner>
      {state !== 'unavailable' ? <Button label={tr('fw.pw.retry')} icon="refresh-cw" variant="secondary" onPress={onRetry} testID="fw-pw-retry" /> : null}
    </View>
  );
}
