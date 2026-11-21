/**
 * Paywall de conclusion de la « première réussite » — VUE pure (données reçues en propriétés) : utilisée par l'écran
 * réel (/start/offers) et par la prévisualisation (/dev/paywall).
 *
 * Passe « Paywall Designer » (04/12/2026, docs/PAYWALL_ONBOARDING.md § 10) : le paywall porte quatre choses, et rien
 * d'autre — un titre qui reprend la démo, UN héros, les formules, le bouton avec sa ligne légale.
 *  B « Essai expliqué » (intégré) : héros = la frise (aujourd'hui · rappel la veille · premier paiement) ; le titre
 *    reprend déjà la démo (variante « need »), l'aperçu du résultat est donc retiré de B (un seul héros) ;
 *  A « Résultat d'abord »         : héros = le résultat de la démo, en grand ; tout le reste identique (paire A/B) ;
 *  C « Formules comparées »       : ancienne direction (Pour qui / Durée / Combien tu paies), gardée pour comparaison.
 * Formules : l'annuel (présélectionné) et le mensuel en tête, deux lignes au plus par carte, rien de répété d'une carte
 * à l'autre ; 6 mois et Famille derrière « Autres formules ». Le montant facturé est le plus gros prix de la carte.
 * Pied toujours visible : bouton (ce qu'il fait), ligne légale (gabarit fixe), Restaurer · Conditions · Confidentialité.
 * Une seule sortie : la croix (retour au résultat). Changer de formule met à jour frise, bouton et ligne légale.
 */
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTopInset } from '@/components/demoInset';
import { Banner, Button, Icon, IconButton, Loading, Segmented, Text } from '@/components/ui';
import { Cascade, PressableScale } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { resultText } from './demos';
import { BenefitLine, NO_HYPHENS } from './kit';
import { paywallTitleKey, type DemoResult, type NeedId, type TitleVariant } from './model';
import {
  benefitsFor, canBuy, cardDetail, ctaFor, phaseView, splitOffers, termsFor, timelineFor,
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
  /** L'appareil peut programmer le rappel de fin d'essai (iPhone, Android) : étape « rappel » dans la frise */
  reminder?: boolean;
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
    <Text variant="title" center accessibilityRole="header" style={NO_HYPHENS} testID="fw-pw-title">{tr(paywallTitleKey(need, variant))}</Text>
  );
  const preview = result ? <ResultPreview result={result} large={direction === 'A'} /> : null;
  const timeline = card ? <TimelineBlock card={card} now={now} reminder={!!props.reminder} /> : null;
  const plans = catalog === 'ready'
    ? direction === 'C' ? <ComparedPlans cards={cards} selected={card} onSelect={onSelect} now={now} /> : <PlanList cards={cards} selectedKey={selectedKey} onSelect={onSelect} />
    : <CatalogNotice state={catalog} onRetry={props.onRetry} />;
  // Direction C seulement : la liste de bénéfices (A et B ont un héros, donc pas de liste — règle du skill)
  const benefits = direction === 'C' && card ? (
    <View style={{ gap: spacing.xs }} testID="fw-pw-benefits">
      {benefitsFor(card.tier, need, { aiOnline, trial: card.trialDays > 0 }).map((b, i) => <BenefitLine key={i} text={b} testID={`fw-pw-benefit-${i}`} />)}
    </View>
  ) : null;

  const order: React.ReactNode[] = direction === 'A'
    ? [title, preview, plans]
    : direction === 'B'
      ? [title, timeline, plans]
      : [title, preview, plans, benefits];

  return (
    <View style={{ flex: 1, backgroundColor: th.colors.background, paddingTop: top }} testID={`fw-paywall-${direction}`}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: spacing.sm, minHeight: MIN_TOUCH }}>
        <IconButton icon="x" label={tr('fw.pw.close')} tone="filled" onPress={props.onClose} testID="fw-pw-close" />
      </View>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.md, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        {props.resume ? <Banner tone="success" title={tr('fw.pw.resume')} /> : null}
        {order.filter(Boolean).map((n, i) => <Cascade key={i} index={i}>{n}</Cascade>)}
        {card?.demo ? <Text variant="caption" muted center testID="fw-pw-demo-grid">{tr('fw.pw.demoGrid')}</Text> : null}
      </ScrollView>
      {/* Bouton, ligne légale et liens : toujours visibles ensemble, au-dessus du pli (petit iPhone compris) */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: bottom + spacing.xxs, gap: spacing.xs, maxWidth: 560, width: '100%', alignSelf: 'center',
        borderTopWidth: 1, borderTopColor: th.material.lines.separator, backgroundColor: th.colors.background }} testID="fw-pw-footer">
        {pv && phase !== 'buying' && phase !== 'restoring' ? (
          <View accessibilityLiveRegion="polite" testID={`fw-pw-state-${phase}`}><Banner tone={pv.tone}>{tr(pv.text)}</Banner></View>
        ) : null}
        {props.needsAccount && buyable ? <Text variant="caption" muted center style={NO_HYPHENS} testID="fw-pw-account-note">{tr('fw.pw.accountNote')}</Text> : null}
        <Button label={card && catalog === 'ready' ? ctaFor(card.plan) : tr('fw.pw.buyUnavailable')} size="lg" full loading={phase === 'buying' || phase === 'restoring'} disabled={!buyable}
          onPress={props.onBuy} accessibilityHint={card ? termsFor(card.plan) : undefined} testID="fw-pw-cta" />
        {card && catalog === 'ready' ? <Text variant="small" center style={NO_HYPHENS} testID="fw-pw-terms-line">{termsFor(card.plan)}</Text> : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: spacing.xs }}>
          <LinkButton label={tr('fw.pw.restore')} onPress={props.onRestore} disabled={phase === 'buying' || phase === 'restoring' || catalog === 'unavailable'} testID="fw-pw-restore" />
          <LinkButton label={tr('fw.pw.terms')} onPress={() => props.onLegal('terms')} testID="fw-pw-terms" />
          <LinkButton label={tr('fw.pw.privacy')} onPress={() => props.onLegal('privacy')} testID="fw-pw-privacy" />
        </View>
      </View>
    </View>
  );
}

function LinkButton({ label, onPress, disabled, testID }: { label: string; onPress: () => void; disabled?: boolean; testID?: string }) {
  const th = useTheme();
  return (
    <Pressable accessibilityRole="link" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} hitSlop={6} testID={testID}
      style={{ minHeight: MIN_TOUCH, justifyContent: 'center', paddingHorizontal: spacing.xxs, opacity: disabled ? 0.5 : 1 }}>
      <Text variant="caption" weight="bold" color={th.colors.primary}>{label}</Text>
    </Pressable>
  );
}

/** Ce que la personne vient de faire dans la démo : une ligne (B), ou le héros en grand (A). */
function ResultPreview({ result, large }: { result: DemoResult; large: boolean }) {
  const th = useTheme();
  return (
    <View testID="fw-pw-preview" accessible accessibilityLabel={`${tr('fw.pw.preview')}. ${resultText(result)}`}
      style={{ flexDirection: large ? 'column' : 'row', gap: large ? spacing.xs : spacing.sm, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg,
        padding: large ? spacing.lg : spacing.sm, backgroundColor: th.material.lines.iconWell }}>
      <Icon name="check-circle" size={large ? 36 : 18} color={th.colors.success} />
      <Text variant={large ? 'heading' : 'small'} weight={large ? undefined : 'medium'} center={large} style={[{ flexShrink: 1 }, NO_HYPHENS]}>{resultText(result)}</Text>
    </View>
  );
}

/** Héros B : la frise de l'essai — trois arrêts, quelques mots chacun ; le premier paiement en gras. */
function TimelineBlock({ card, now, reminder }: { card: OfferCard; now: Date; reminder: boolean }) {
  const th = useTheme();
  const tl = timelineFor(card.plan, { now, reminder });
  return (
    <View testID="fw-pw-timeline" accessibilityRole="list" accessibilityLabel={tr('fw.tl.title')}
      style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: th.tokens.border.rest, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: th.tokens.surface.opaque }}>
      {tl.steps.map((s, i) => {
        const last = i === tl.steps.length - 1;
        const dot = s.key === 'today' ? th.colors.primary : s.key === 'remind' ? th.colors.surface : th.colors.text;
        return (
          <View key={s.key} style={{ flexDirection: 'row', gap: spacing.sm }} accessible accessibilityLabel={`${s.title}. ${s.body}`} testID={`fw-pw-tl-${s.key}`}>
            <View style={{ width: 16, alignItems: 'center' }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, marginTop: 3, backgroundColor: dot, borderWidth: 2, borderColor: s.key === 'today' ? th.colors.primary : th.colors.text }} />
              {!last ? <View style={{ flex: 1, width: 2, minHeight: 10, backgroundColor: th.colors.border, marginVertical: 2 }} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: last ? 0 : spacing.xs, flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.xs, alignItems: 'baseline' }}>
              <Text variant="small" weight="bold">{s.title}</Text>
              <Text variant="small" muted={!last} weight={last ? 'bold' : undefined} style={NO_HYPHENS}>{s.body}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const slug = (key: string) => key.replace(':', '-');

/** Nom court (« Annuel ») sur les cartes Premium quand la seule autre formule est Famille : « Premium » est dit une fois, sous les cartes. */
function PlanRow({ card, selected, onSelect, othersHaveTrial, othersAreFamily = true }: { card: OfferCard; selected: boolean; onSelect: (k: string) => void; othersHaveTrial: boolean; othersAreFamily?: boolean }) {
  const th = useTheme();
  const d = cardDetail(card, { othersHaveTrial });
  return (
    <PressableScale onPress={() => onSelect(card.key)} haptic="selection" scale={0.985} accessibilityRole="radio" accessibilityState={{ checked: selected, selected }} aria-checked={selected}
      accessibilityLabel={card.a11y} testID={`fw-plan-${slug(card.key)}`}>
      <View style={{ borderRadius: radius.lg, borderWidth: selected ? 2 : 1, borderColor: selected ? th.colors.primary : th.colors.border, backgroundColor: selected ? th.colors.surface : th.colors.surfaceAlt,
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', minHeight: 56 }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected ? th.colors.primary : th.colors.textMuted, alignItems: 'center', justifyContent: 'center' }}>
          {selected ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: th.colors.primary }} /> : null}
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', columnGap: spacing.xs }}>
            <Text weight="bold">{card.tier === 'premium' && othersAreFamily ? tr(`fw.card.${card.period}` as TKey) : card.name}</Text>
            <Text weight="bold" testID={`fw-billed-${slug(card.key)}`}>{card.billed}</Text>
          </View>
          {d.per || d.saving || d.note ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.xs }}>
              {d.per ? <Text variant="caption" muted testID={`fw-per-${slug(card.key)}`}>{d.per}</Text> : null}
              {d.saving ? <Text variant="caption" weight="bold" color={th.colors.success} testID={`fw-saving-${slug(card.key)}`}>{d.saving}</Text> : null}
              {d.note ? <Text variant="caption" muted style={NO_HYPHENS} testID={`fw-note-${slug(card.key)}`}>{d.note}</Text> : null}
            </View>
          ) : null}
        </View>
      </View>
    </PressableScale>
  );
}

function PlanList({ cards, selectedKey, onSelect }: { cards: OfferCard[]; selectedKey: string | null; onSelect: (k: string) => void }) {
  const th = useTheme();
  const { lead, more } = splitOffers(cards);
  const [open, setOpen] = useState(false);
  const shown = open || more.some((c) => c.key === selectedKey) ? [...lead, ...more] : lead;
  const othersHaveTrial = cards.some((c) => c.trialDays > 0);
  return (
    <View style={{ gap: spacing.xs }}>
      <View accessibilityRole="radiogroup" accessibilityLabel={tr('fw.pw.plans')} style={{ gap: spacing.xs }} testID="fw-pw-plans">
        {shown.map((c) => <PlanRow key={c.key} card={c} selected={c.key === selectedKey} onSelect={onSelect} othersHaveTrial={othersHaveTrial} />)}
      </View>
      {shown.length < cards.length ? (
        <Pressable accessibilityRole="button" onPress={() => setOpen(true)} hitSlop={6} testID="fw-pw-more"
          style={{ minHeight: MIN_TOUCH, justifyContent: 'center', alignItems: 'center' }}>
          <Text variant="small" weight="bold" color={th.colors.primary}>{tr('fw.pw.more')}</Text>
        </Pressable>
      ) : null}
      {cards.some((c) => c.tier === 'premium') ? <Text variant="caption" muted center style={NO_HYPHENS} testID="fw-pw-coparent">{tr('fw.pw.coparent')}</Text> : null}
    </View>
  );
}

/** Direction C (ancienne, gardée pour comparaison) : à deux ou tout le foyer, puis la durée, puis « Combien tu paies ». */
function ComparedPlans({ cards, selected, onSelect, now }: { cards: OfferCard[]; selected: OfferCard | null; onSelect: (k: string) => void; now: Date }) {
  const th = useTheme();
  const tier = selected?.tier ?? 'premium';
  const tiers = (['premium', 'family'] as const).filter((t) => cards.some((c) => c.tier === t));
  const sameTier = cards.filter((c) => c.tier === tier);
  const tl = selected ? timelineFor(selected.plan, { now }) : null;
  const othersHaveTrial = cards.some((c) => c.trialDays > 0);
  return (
    <View style={{ gap: spacing.sm }} testID="fw-pw-compare">
      {tiers.length > 1 ? (
        <View style={{ gap: spacing.xs }}>
          <Text variant="label">{tr('fw.pw.who')}</Text>
          <Segmented label={tr('fw.pw.who')} value={tier}
            options={tiers.map((t) => ({ value: t, label: tr(`fw.pw.who.${t}` as TKey), testID: `fw-tier-${t}` }))}
            onChange={(t) => { const first = cards.find((c) => c.tier === t && (t === 'family' || c.period === 'annual')) ?? cards.find((c) => c.tier === t); if (first) onSelect(first.key); }} />
        </View>
      ) : null}
      {sameTier.length > 1 ? (
        <View style={{ gap: spacing.xs }}>
          <Text variant="label">{tr('fw.pw.duration')}</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel={tr('fw.pw.duration')} style={{ gap: spacing.xs }} testID="fw-pw-plans">
            {sameTier.map((c) => <PlanRow key={c.key} card={c} selected={c.key === selected?.key} onSelect={onSelect} othersHaveTrial={othersHaveTrial} othersAreFamily={false} />)}
          </View>
        </View>
      ) : selected ? <PlanRow card={selected} selected onSelect={onSelect} othersHaveTrial={othersHaveTrial} othersAreFamily={false} /> : null}
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
