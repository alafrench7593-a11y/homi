/**
 * Paywall blanc « Apple Premium · Liquid Glass » (accent Blanc nacré depuis le retrait de l'olive, 22/11/2026) (refonte du 21/11/2026) — VUE pure, données reçues en propriétés.
 *
 * Ordre : (1) croix visible (retour à la démo, résultat gardé) ; (2) titre lié au besoin ; (3) aperçu du résultat dans
 * le VRAI composant + Aura (orbe dont les trois lumières se rapprochent à l'arrivée, message prédéfini de deux lignes,
 * « Une question ? ») ; (4) formules — Premium mensuel en tête et présélectionné, l'annuel en second, « Autres formules »
 * (6 mois, Famille) — avec un indicateur de verre qui glisse ; (5) frise de facturation, puis bouton et conditions dans
 * le pied ; (6) preuve sociale vérifiée, « Tout est parti d'une maman et de son idée », Restaurer · Conditions ·
 * Confidentialité. Fond #FFFFFF sur toute la surface (thème clair Blanc nacré imposé), prix et dates sur fond plein.
 * Le prix et le bouton sont utilisables dès l'arrivée (l'animation d'Aura ne bloque rien). Aucun appel IA ni son.
 */
import { PaywallFaq, PaywallShowcase } from './PaywallExtras';
import { AmbassadorCode } from './AmbassadorCode';
import { ambassadorOfferCodes } from '@/config/features';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTopInset } from '@/components/demoInset';
import { Banner, Button, Loading, Text } from '@/components/ui';
import { Glass, GlassIconButton, GlassSheet } from '@/components/glass';
import { FOUNDER_STORY, TESTER_PROOF } from '@/config/socialProof';
import { DEFAULT_GRANTS } from '@/lib/credits/model';
import { AuraOrb } from '@/features/aura/AuraMark';
import { HeroArt } from '@/features/entry/HeroArt';
import { Cascade, PressableScale, useMotion } from '@/motion';
import { ThemeScope, useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, NEUTRALS, radius, spacing } from '@/theme/tokens';
import { formatDate, formatNumber, t as tr, type TKey } from '@/i18n';
import { DEMOS } from './demos';
import { NO_HYPHENS } from './kit';
import { PAYWALL_AURA, paywallTitleKey, type NeedId } from './model';
import {
  canBuy, cardDetail, ctaFor, perEvery, phaseView, splitOffers, termsFor, timelineFor,
  type CatalogState, type OfferCard,
} from './offer';
import { TimelineBlock, type PaywallViewProps } from './PaywallView';

/** Fond du paywall : le blanc pur des neutres HOMI (#FFFFFF), sur toute la surface. */
export const PAYWALL_WHITE = NEUTRALS.white;

export function PaywallWhite(props: PaywallViewProps) {
  return <ThemeScope mode="light" palette="nacre"><WhiteBody {...props} /></ThemeScope>;
}

function WhiteBody(props: PaywallViewProps) {
  const { variant, need, result, cards, selectedKey, onSelect, catalog, phase, now } = props;
  const th = useTheme();
  const top = useTopInset();
  const bottom = useSafeAreaInsets().bottom;
  const card = cards.find((c) => c.key === selectedKey) ?? null;
  const pv = phaseView(phase);
  const buyable = canBuy(catalog, phase, !!card);
  const [webInfo, setWebInfo] = useState(false);
  const [help, setHelp] = useState(false);
  const [story, setStory] = useState(false);
  const Demo = result ? DEMOS[result.kind] : null;
  const winH = useWindowDimensions().height;
  // Au revoir d'Aura à la fermeture (variante « histoire ») : un coucou court, puis la fermeture ; immédiat sans animations
  const motion = useMotion();
  const [bye, setBye] = useState(false);
  const close = () => {
    if (!props.storyMode || motion.off || bye) { props.onClose(); return; }
    setBye(true);
    setTimeout(props.onClose, 1300);
  };

  const blocks: React.ReactNode[] = [
    // Variante « histoire » : titre plus compact, sous-titre seulement sur les grands écrans → les prix d'abord (iPhone SE compris)
    <Text key="title" variant={props.storyMode ? 'heading' : 'title'} center accessibilityRole="header" style={NO_HYPHENS} testID="fw-pw-title">{tr(props.storyMode ? 'pw4.offers.title' : paywallTitleKey(need, variant))}</Text>,
    props.storyMode && winH >= 700 ? <Text key="sub" center muted style={NO_HYPHENS} testID="fw-pw-sub">{tr('pw4.offers.sub')}</Text> : null,
    // Variante « histoire » : pas de message d'Aura ici (déjà vu en slide 1) → annuel et mensuel visibles dès l'arrivée
    props.storyMode ? null : <AuraLine key="aura" need={need} onAsk={() => { setHelp(true); props.onHelp?.(); }} />,
    // Prix tout de suite sous le titre (24/11/2026 : visibles dès l'arrivée sur un écran de téléphone), puis l'aperçu
    catalog === 'ready' ? <PlanList key="plans" cards={cards} selectedKey={selectedKey} onSelect={onSelect} annualFirst={!!props.storyMode} /> : <CatalogNotice key="plans" state={catalog} onRetry={props.onRetry} />,
    // aperçu du résultat : le même composant que dans la démo (la sieste à côté du dernier repas)
    <View key="preview" style={{ gap: spacing.sm }} testID="fw-pw-preview">
      {Demo && result ? (
        <View accessible accessibilityLabel={tr('fw.pw.previewLabel')} style={{ gap: spacing.xs }}>
          <Demo onDone={() => undefined} result={result} compact />
          {result.kind === 'relay' ? <Text variant="caption" muted center testID="fw-pw-included">{tr('fw.pw.included.relay')}</Text> : null}
        </View>
      ) : null}
    </View>,
    card && catalog === 'ready' ? <TimelineBlock key="tl" card={card} now={now} reminder={!!props.reminder} /> : null,
    // Code ambassadeur (discret, sous les formules) : vérifié par le serveur, réduction appliquée par Apple
    catalog === 'ready' && ambassadorOfferCodes() ? <AmbassadorCode key="code" signedIn={!props.needsAccount} webShowcase={props.webShowcase} onRedeemOpened={props.onRedeemOpened} /> : null,
    // Vitrine : vraies captures de l'app (24/11/2026), puis preuves
    <PaywallShowcase key="showcase" />,
    // Variante « histoire » : note et histoire déjà vues sur les slides précédentes
    TESTER_PROOF.enabled && !props.storyMode ? <TesterProof key="proof" /> : null,
    FOUNDER_STORY.enabled && !props.storyMode ? (
      <Pressable key="origin" accessibilityRole="button" onPress={() => { setStory(true); props.onStory?.(); }} testID="fw-pw-story"
        style={{ minHeight: MIN_TOUCH, alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: spacing.xs }}>
        <Text variant="small" center muted style={NO_HYPHENS}>{tr('fw.pw.origin')}</Text>
        <Text variant="small" weight="bold" color={th.colors.primary}>{tr('fw.pw.story.link')}</Text>
      </Pressable>
    ) : null,
    card?.demo ? <Text key="demo" variant="caption" muted center testID="fw-pw-demo-grid">{tr('fw.pw.demoGrid')}</Text> : null,
    // Questions qui freinent l'achat + contact (24/11/2026)
    <PaywallFaq key="faq" />,
  ];

  return (
    <View style={{ flex: 1, backgroundColor: PAYWALL_WHITE, paddingTop: top }} testID="fw-paywall-W">
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: spacing.sm, minHeight: MIN_TOUCH }}>
        <GlassIconButton icon="x" label={tr('fw.pw.close')} onPress={close} testID="fw-pw-close" />
      </View>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.md, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        {props.resume ? <Banner tone="success" title={tr('fw.pw.resume')} /> : null}
        {blocks.filter(Boolean).map((n, i) => <Cascade key={i} index={i}>{n}</Cascade>)}
      </ScrollView>
      {/* Bouton, conditions et liens : toujours visibles ensemble, sur fond blanc plein (jamais de texte sur du verre) */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: bottom + spacing.xxs, gap: spacing.xs, maxWidth: 560, width: '100%', alignSelf: 'center',
        borderTopWidth: 1, borderTopColor: th.material.lines.separator, backgroundColor: PAYWALL_WHITE }} testID="fw-pw-footer">
        {pv && phase !== 'buying' && phase !== 'restoring' ? (
          <View accessibilityLiveRegion="polite" testID={`fw-pw-state-${phase}`}><Banner tone={pv.tone}>{tr(pv.text)}</Banner></View>
        ) : null}
        {props.needsAccount && buyable && !props.webShowcase ? <Text variant="caption" muted center style={NO_HYPHENS} testID="fw-pw-account-note">{tr('fw.pw.accountNote')}</Text> : null}
        {props.webShowcase ? (
          <View style={{ gap: spacing.xs }} testID="fw-pw-web">
            {webInfo ? <View accessibilityLiveRegion="polite"><Banner tone="info">{tr('fw.pw.webInfo')}</Banner></View> : null}
            {/* Même libellé que sur iPhone (24/11/2026, demande de la propriétaire) ; sur le web, l'appui explique que l'achat se fait dans l'app */}
            <Button label={card && catalog === 'ready' ? ctaFor(card.plan) : tr('fw.pw.webCta')} size="lg" full onPress={() => setWebInfo(true)} testID="fw-pw-cta" />
          </View>
        ) : (
        <Button label={card && catalog === 'ready' ? ctaFor(card.plan, { needsAccount: props.needsAccount }) : tr('fw.pw.buyUnavailable')} size="lg" full
          loading={phase === 'buying' || phase === 'restoring'} disabled={!buyable}
          onPress={props.onBuy} accessibilityHint={card ? termsFor(card.plan) : undefined} testID="fw-pw-cta" />
        )}
        {card && catalog === 'ready' ? <Text variant="caption" center style={NO_HYPHENS} testID="fw-pw-terms-line">{props.webShowcase ? `${tr('fw.pw.webPrices')} ${termsFor(card.plan)}` : termsFor(card.plan)}</Text> : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: spacing.xs }}>
          {/* Web : « Créer un compte » et « Voir la démo » en liens, sur la même ligne que les conditions (bas fixe compact) */}
          {props.webShowcase ? <LinkButton label={tr('auth.signUp')} onPress={() => props.onSignUp?.()} testID="fw-pw-web-signup" /> : null}
          {props.webShowcase ? <LinkButton label={tr('webDemo.openDemo')} onPress={() => props.onDemo?.()} testID="fw-pw-web-demo" /> : null}
          {props.webShowcase ? null : <LinkButton label={tr('fw.pw.restore')} onPress={props.onRestore} disabled={phase === 'buying' || phase === 'restoring' || catalog === 'unavailable'} testID="fw-pw-restore" />}
          <LinkButton label={tr('fw.pw.terms')} onPress={() => props.onLegal('terms')} testID="fw-pw-terms" />
          <LinkButton label={tr('fw.pw.privacy')} onPress={() => props.onLegal('privacy')} testID="fw-pw-privacy" />
        </View>
      </View>

      {bye ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: PAYWALL_WHITE, gap: spacing.md }}
          accessibilityLiveRegion="polite" testID="fw-pw-bye">
          <AuraOrb size={96} gather />
          <Text variant="heading" center style={NO_HYPHENS}>{tr('pw4.bye')}</Text>
        </View>
      ) : null}
      {/* Feuilles : l'état du paywall (formule choisie, défilement) reste en place pendant et après la lecture */}
      <GlassSheet visible={help} onClose={() => setHelp(false)} title={tr('fw.pw.ask')}>
        <HelpAnswers card={card} now={now} />
      </GlassSheet>
      <GlassSheet visible={story} onClose={() => setStory(false)} title={tr('fw.pw.story.title')}>
        <View style={{ gap: spacing.md, paddingBottom: spacing.md }} testID="fw-story">
          <View style={{ alignItems: 'center' }}><HeroArt name="famille" size={120} testID="fw-story-art" /></View>
          {tr('fw.pw.story.body').split('\n\n').map((para, i) => <Text key={i} style={NO_HYPHENS}>{para}</Text>)}
          <Text weight="bold">{tr('fw.pw.story.sign')}</Text>
        </View>
      </GlassSheet>
    </View>
  );
}

/** Aura près de l'aperçu : orbe qui s'assemble à l'arrivée, puis message court et « Une question ? ». */
function AuraLine({ need, onAsk }: { need: NeedId | null; onAsk: () => void }) {
  const th = useTheme();
  const text = tr(need ? PAYWALL_AURA[need] : 'fw.pw.aura.generic');
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }} testID="fw-pw-aura">
      <AuraOrb size={44} gather testID="fw-pw-orb" />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="small" accessibilityLabel={`${tr('fw.auraA11y')}. ${text}`} style={NO_HYPHENS} testID="fw-pw-aura-text">{text}</Text>
        <Pressable accessibilityRole="button" onPress={onAsk} testID="fw-pw-ask" style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' }}>
          <Text variant="small" weight="bold" color={th.colors.primary}>{tr('fw.pw.ask')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Réponses rapides de l'aide : calculées depuis la formule choisie et les droits réels (aucune réponse générée). */
export function helpAnswers(card: OfferCard | null, now: Date): { q: string; a: string }[] {
  if (!card) return [];
  const credits = card.tier === 'family' ? DEFAULT_GRANTS.family : DEFAULT_GRANTS.premium;
  const tl = timelineFor(card.plan, { now });
  const every = perEvery(card.period);
  const trial = card.trialDays > 0
    ? tr('fw.pw.help.trialA', { count: card.trialDays, date: formatDate(tl.firstCharge, { day: 'numeric', month: 'long' }), credits })
    : tr('fw.pw.help.noTrialA', { price: card.plan.price, every, credits });
  const coparent = card.tier === 'family'
    ? tr('fw.pw.help.coparentFamily', { credits: DEFAULT_GRANTS.family })
    : `${tr('fw.pw.help.coparentPremium')} ${tr('fw.pw.help.familyDiff', { credits: DEFAULT_GRANTS.family })}`;
  return [
    { q: tr('fw.pw.help.trialQ'), a: trial },
    { q: tr('fw.pw.help.billingQ'), a: tr('fw.pw.help.billingA', { price: card.plan.price, every }) },
    { q: tr('fw.pw.help.coparentQ'), a: coparent },
  ];
}

function HelpAnswers({ card, now }: { card: OfferCard | null; now: Date }) {
  return (
    <View style={{ gap: spacing.md, paddingBottom: spacing.md }} testID="fw-help">
      {helpAnswers(card, now).map((x, i) => (
        <View key={i} style={{ gap: 4 }} testID={`fw-help-${i}`}>
          <Text weight="bold" accessibilityRole="header">{x.q}</Text>
          <Text variant="small" style={NO_HYPHENS}>{x.a}</Text>
        </View>
      ))}
      <Text variant="caption" muted style={NO_HYPHENS}>{tr('fw.pw.help.estimated')}</Text>
    </View>
  );
}

/** Note du programme de test (source : src/config/socialProof.ts), crème pâle, étoiles discrètes. */
function TesterProof() {
  const th = useTheme();
  const rating = formatNumber(TESTER_PROOF.rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const full = Math.floor(TESTER_PROOF.rating);
  const half = TESTER_PROOF.rating - full >= 0.25;
  return (
    <View testID="fw-pw-proof" style={{ borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs, backgroundColor: th.colors.surface, borderWidth: 1, borderColor: th.tokens.border.rest }}>
      <View accessible accessibilityLabel={tr('fw.pw.proof.a11y', { rating, count: TESTER_PROOF.ratingCount })} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
        <View style={{ flexDirection: 'row', gap: 1 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <MaterialCommunityIcons key={i} name={i < full ? 'star' : i === full && half ? 'star-half-full' : 'star-outline'} size={15} color={th.colors.primary} />
          ))}
        </View>
        <Text variant="small" weight="bold" testID="fw-pw-proof-score">{tr('fw.pw.proof.score', { rating, count: TESTER_PROOF.ratingCount })}</Text>
      </View>
      <Text variant="small" style={NO_HYPHENS}>{tr('fw.pw.proof.body')}</Text>
      <Text variant="caption" muted>{tr('fw.pw.proof.source')}</Text>
    </View>
  );
}

const slug = (key: string) => key.replace(':', '-');

/** Formules en liste ; un indicateur de verre glisse vers la formule choisie (pose immédiate avec Réduire les animations). */
function PlanList({ cards, selectedKey, onSelect, annualFirst }: { cards: OfferCard[]; selectedKey: string | null; onSelect: (k: string) => void; annualFirst?: boolean }) {
  const th = useTheme();
  const m = useMotion();
  const { lead, more } = splitOffers(cards);
  // Tous les prix visibles d'emblée (demande de la propriétaire, 24/11/2026) : mensuel et annuel en tête, puis les autres
  const all = [...lead, ...more];
  // Variante « histoire » : l'annuel (présélectionné) en tête, le mensuel juste dessous
  const shown = annualFirst ? [...all.filter((c) => c.key === 'premium:annual'), ...all.filter((c) => c.key !== 'premium:annual')] : all;
  const othersHaveTrial = cards.some((c) => c.trialDays > 0);
  const [rows, setRows] = useState<Record<string, { y: number; h: number }>>({});
  const y = useSharedValue(0);
  const h = useSharedValue(0);
  const shownV = useSharedValue(0);
  const target = selectedKey ? rows[selectedKey] : undefined;
  React.useEffect(() => {
    if (!target) return;
    if (shownV.value === 0) { y.value = target.y; h.value = target.h; shownV.value = 1; return; }
    y.value = m.spring(target.y, 'panneau');
    h.value = m.spring(target.h, 'panneau');
  }, [target?.y, target?.h]); // eslint-disable-line react-hooks/exhaustive-deps
  const indicator = useAnimatedStyle(() => ({ opacity: shownV.value, height: h.value, transform: [{ translateY: y.value }] }));
  const onRow = (key: string) => (e: LayoutChangeEvent) => {
    const { y: ry, height } = e.nativeEvent.layout;
    setRows((cur) => (cur[key] && Math.abs(cur[key].y - ry) < 0.5 && Math.abs(cur[key].h - height) < 0.5 ? cur : { ...cur, [key]: { y: ry, h: height } }));
  };
  return (
    <View style={{ gap: spacing.xs }}>
      <View accessibilityRole="radiogroup" accessibilityLabel={tr('fw.pw.plans')} testID="fw-pw-plans" style={{ position: 'relative' }}>
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: 0, right: 0, top: 0 }, indicator]} testID="fw-pw-indicator">
          <Glass variant="card" radius={radius.lg} style={{ flex: 1, borderWidth: 2, borderColor: th.colors.primary, borderRadius: radius.lg }} />
        </Animated.View>
        {shown.map((c, i) => (
          <View key={c.key} onLayout={onRow(c.key)} style={{ paddingTop: i ? spacing.xs : 0 }}>
            <PlanRow card={c} selected={c.key === selectedKey} onSelect={onSelect} othersHaveTrial={othersHaveTrial} />
          </View>
        ))}
      </View>
      {cards.some((c) => c.tier === 'premium') ? <Text variant="caption" muted center style={NO_HYPHENS} testID="fw-pw-coparent">{tr('fw.pw.coparent')}</Text> : null}
    </View>
  );
}

/** Slogan court sous le prix : la raison de choisir CETTE formule (vrai pour chacune : résiliable à tout moment). */
const sloganKey = (c: OfferCard): TKey => (c.tier === 'premium' ? `pw3.slogan.${c.period}` : 'pw3.slogan.family') as TKey;

function PlanRow({ card, selected, onSelect, othersHaveTrial }: { card: OfferCard; selected: boolean; onSelect: (k: string) => void; othersHaveTrial: boolean }) {
  const th = useTheme();
  const d = cardDetail(card, { othersHaveTrial });
  return (
    <PressableScale onPress={() => onSelect(card.key)} haptic="selection" scale={0.985} accessibilityRole="radio" accessibilityState={{ checked: selected, selected }} aria-checked={selected}
      accessibilityLabel={card.a11y} testID={`fw-plan-${slug(card.key)}`}>
      {/* La ligne reste lisible sans le verre : le contour au repos, l'indicateur de verre posé dessous quand elle est choisie */}
      <View style={{ borderRadius: radius.lg, borderWidth: 1, borderColor: selected ? 'transparent' : th.colors.border,
        paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', minHeight: 56 }}>
        <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected ? th.colors.primary : th.colors.textMuted, alignItems: 'center', justifyContent: 'center' }}>
          {selected ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: th.colors.primary }} /> : null}
        </View>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', columnGap: spacing.xs }}>
            <Text weight="bold">{card.tier === 'premium' ? tr(`fw.card.${card.period}` as TKey) : card.name}</Text>
            <Text weight="bold" testID={`fw-billed-${slug(card.key)}`}>{card.billed}</Text>
          </View>
          <Text variant="caption" weight="medium" color={th.colors.primary} style={NO_HYPHENS} testID={`fw-slogan-${slug(card.key)}`}>{tr(sloganKey(card))}</Text>
          {d.per || d.saving || d.note ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.xs }}>
              {d.per ? <Text variant="caption" muted testID={`fw-per-${slug(card.key)}`}>{d.per}</Text> : null}
              {d.saving ? <Text variant="caption" weight="bold" color={th.colors.text} testID={`fw-saving-${slug(card.key)}`}>{d.saving}</Text> : null}
              {d.note ? <Text variant="caption" muted style={NO_HYPHENS} testID={`fw-note-${slug(card.key)}`}>{d.note}</Text> : null}
            </View>
          ) : null}
          {card.trialDays > 0 ? <Text variant="caption" color={th.colors.primary} testID={`fw-trial-${slug(card.key)}`}>{tr('fw.trialBadge', { count: card.trialDays })}</Text> : null}
        </View>
      </View>
    </PressableScale>
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

