/**
 * Assistant de scan (produit ou aliment) en 4 étapes — rendu seulement (logique : `useScanWizard`) :
 *   Identifier → Confirmer (« Est-ce bien ce produit ? ») → Pour qui → Préciser, puis analyse et fiche résultat.
 *  - Progression discrète qui avance / recule avec le geste ; étapes franchies accessibles depuis la progression.
 *  - Retour (flèche ronde du pied, flèche de l'en-tête, retour Android, segment de progression) : étape précédente,
 *    SAISIE CONSERVÉE. La flèche de l'en-tête ne quitte l'écran qu'à la première étape.
 *  - Bouton principal unique (point focal) dans le pied d'écran : visible clavier ouvert, largeur stable,
 *    appuis répétés ignorés pendant la recherche / l'analyse.
 *  - États réels : chargement (bouton), produit inconnu des bases, base injoignable, erreur réseau (réessayer),
 *    quota atteint (rappels officiels toujours gratuits), confirmation seulement après l'enregistrement.
 * Surfaces : formulaires et listes en surface MATE ; aucune couleur en dur.
 */
import React, { useContext, useEffect, useRef } from 'react';
import { Image, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router, useIsFocused, useNavigation } from 'expo-router';
import { CameraView } from 'expo-camera';
import { Screen } from '@/components/Screen';
import { KeyboardScopeContext, useKeyboardScopeFor } from '@/components/keyboard';
import { ToolArticles } from '@/features/ToolArticles';
import { ScreenToolContext } from '@/lib/screenTool';
import { Banner, Chip, Divider, Field, Icon, Row, SectionTitle, Text } from '@/components/ui';
import { IconOrb, PrimaryButton, SecondaryButton } from '@/components/controls';
import { MatteSurface } from '@/components/surfaces';
import { ScanFrame } from '@/features/motionViz';
import { usePressScale } from '@/motion';
import { isDemo } from '@/lib/backend';
import { GENERIC_PROFILES } from '@/lib/data/hooks-scanner';
import { profileLabel, RECALL_DISCLAIMER } from '@/lib/domain/scanCommon';
import { PRODUCT_TYPES } from '@/lib/domain/scanFlow';
import { EXPOSURE_LABEL, PRODUCT_TYPE_LABEL, ZONE_LABEL, type Exposure, type Zone } from '@/lib/domain/scanProduct';
import type { ScanKind } from '@/lib/types-scanner';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr, type TKey } from '@/i18n';
import { DemoTag, RecallCard } from './components';
import { useScanWizard, type ScanWizard } from './useScanWizard';
import { StepProgress, StepStage } from './WizardChrome';
import { stepIndex, WIZARD_STEPS } from './wizard';

const OPENED_KEY = 'openedDaysAgo';
const cameraAvailable = Platform.OS === 'ios' || Platform.OS === 'android';
const DEMO_CODES: Record<ScanKind, string[]> = {
  product: ['0000000000062', '0000000000079', '0000000000086', '0000000000017'],
  food: ['0000000000093', '0000000000024', '0000000000031', '0000000000055'],
};
const EXPOSURES: Exposure[] = ['rinse_off', 'leave_on', 'inhaled', 'indirect'];
const ZONES: Zone[] = ['face', 'body', 'diaper_area', 'scalp', 'lips', 'hands', 'air', 'textiles', 'surfaces'];
const STEP_LABEL: Record<(typeof WIZARD_STEPS)[number], TKey> = { identify: 'scn.step.identify', confirm: 'scn.step.confirm', profile: 'scn.step.profile', details: 'scn.step.details' };

export function ScanFlow({ kind, title, subtitle }: { kind: ScanKind; title: string; subtitle?: string }) {
  const w = useScanWizard(kind);
  const navigation = useNavigation();
  const back = w.back;
  // Flèche de l'en-tête / retour Android : étape précédente, saisie conservée (l'écran n'est quitté qu'à la 1re étape)
  useEffect(() => navigation.addListener('beforeRemove', (e) => {
    if (w.leaving.current || w.step === 'identify') return;
    e.preventDefault();
    back();
  }), [navigation, w.step]); // eslint-disable-line react-hooks/exhaustive-deps

  const labels = WIZARD_STEPS.map((s) => tr(STEP_LABEL[s]));
  const index = stepIndex(w.step);
  return (
    <Screen back title={title} subtitle={subtitle} scroll={false} footer={<WizardFooter w={w} />}>
      <StepScroll step={w.step}>
        <StepProgress labels={labels} index={index} onJump={(i) => w.goTo(WIZARD_STEPS[i])} />
        <StepStage key={w.step} dir={w.dir.current} testID={`scan-step-${w.step}`}>
          {w.step === 'identify' ? <IdentifyStep w={w} /> : null}
          {w.step === 'confirm' ? <ConfirmStep w={w} /> : null}
          {w.step === 'profile' ? <ProfileStep w={w} /> : null}
          {w.step === 'details' ? <DetailsStep w={w} /> : null}
        </StepStage>
      </StepScroll>
    </Screen>
  );
}

/**
 * Zone qui défile propre à l'assistant : chaque nouvelle étape commence EN HAUT (progression et point d'entrée
 * visibles), même si l'étape précédente avait défilé. Même comportement clavier que `Screen` (champ actif gardé
 * visible, « Suivant », clavier fermé en quittant l'écran) ; « Pour aller plus loin » reste en bas.
 */
function StepScroll({ step, children }: { step: string; children: React.ReactNode }) {
  const ref = useRef<ScrollView>(null);
  const { scope, onScroll } = useKeyboardScopeFor(ref);
  const focused = useIsFocused();
  const toolId = useContext(ScreenToolContext);
  useEffect(() => { ref.current?.scrollTo({ y: 0, animated: false }); }, [step]);
  useEffect(() => { if (!focused) scope.dismissIfOwned(); }, [focused, scope]);
  useEffect(() => () => scope.dismissIfOwned(), [scope]);
  return (
    <KeyboardScopeContext.Provider value={scope}>
      <ScrollView ref={ref} onScroll={onScroll} onScrollEndDrag={onScroll} onMomentumScrollEnd={onScroll} scrollEventThrottle={64}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} testID="scan-scroll"
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.md }}>
        {children}
        {toolId ? <ToolArticles toolId={toolId} /> : null}
      </ScrollView>
    </KeyboardScopeContext.Provider>
  );
}

// ------------------------------------------------------------ pied : retour + action principale
function WizardFooter({ w }: { w: ScanWizard }) {
  const busy = !!w.busy;
  let primary: { label: string; shortLabel?: string; icon?: 'search' | 'check' | 'arrow-right'; onPress: () => unknown; disabled: boolean; testID: string };
  if (w.step === 'identify') {
    primary = { label: tr('u6.sf.search'), icon: 'search', onPress: () => w.runSearch(w.query, 'search'), disabled: w.query.trim().length < 2, testID: 'scan-search' };
  } else if (w.step === 'confirm') {
    const nothing = !w.candidates.length && !w.ciqual.length;
    const label = w.pick?.kind === 'manual' || nothing ? tr('u6.sf.continue_name') : w.pick?.kind === 'ciqual' ? tr('u6.sf.yes_food') : tr('u6.sf.yes_product');
    // texte agrandi / 320 px : « Continuer avec ce nom » passait sur 2 lignes → « Continuer » (le lecteur d'écran lit le libellé complet)
    primary = { label, shortLabel: tr('scn.next'), onPress: () => w.confirmSubject(), disabled: !w.picked, testID: 'scan-confirm' };
  } else if (w.step === 'profile') {
    primary = { label: tr('scn.next'), icon: 'arrow-right', onPress: w.continueProfile, disabled: !w.profile || w.needsAge, testID: 'scan-next' };
  } else {
    primary = { label: tr('u6.sf.analyse'), icon: 'check', onPress: w.analyse, disabled: !w.profile || w.needsAge || w.quotaReached, testID: 'scan-analyse' };
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      {w.step !== 'identify' ? <IconOrb icon="arrow-left" label={tr('scn.prev')} onPress={w.back} testID="scan-prev" /> : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <PrimaryButton label={primary.label} shortLabel={primary.shortLabel} icon={primary.icon} size="lg" full loading={busy} disabled={primary.disabled}
          onPress={primary.onPress as () => void} testID={primary.testID} />
      </View>
    </View>
  );
}

// ------------------------------------------------------------ éléments partagés
/** Réponse à choisir (« Est-ce bien ce produit ? ») : surface mate, sélection = liseré de la palette + coche + gras. */
function ChoiceCard({ selected, onPress, label, testID, children }: { selected: boolean; onPress: () => void; label: string; testID?: string; children: React.ReactNode }) {
  const t = useTheme();
  const p = usePressScale({ scale: 0.985, haptic: 'none' });
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected, selected }} aria-checked={selected} accessibilityLabel={label}
      onPress={onPress} onPressIn={p.onPressIn} onPressOut={p.onPressOut} testID={testID}>
      <Animated.View style={p.style}>
        <MatteSurface radius={radius.lg} padded={spacing.md} style={selected ? { borderColor: t.colors.primary, borderWidth: 2 } : null}>
          <Row gap={spacing.md} style={{ alignItems: 'flex-start' }}>
            <View style={{ flex: 1, minWidth: 0, gap: 2 }}>{children}</View>
            <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2,
              borderColor: selected ? t.colors.primary : t.material.lines.track, backgroundColor: selected ? t.colors.primary : 'transparent' }}>
              {selected ? <Icon name="check" size={14} color={t.colors.primaryText} /> : null}
            </View>
          </Row>
        </MatteSurface>
      </Animated.View>
    </Pressable>
  );
}

function FailureBanner({ w }: { w: ScanWizard }) {
  if (!w.failure) return null;
  const f = w.failure;
  return (
    <View testID={f.kind === 'network' ? 'scan-error-network' : 'scan-error'}>
      <Banner tone="danger" icon={f.kind === 'network' ? 'wifi-off' : 'alert-triangle'} title={f.kind === 'network' ? tr('scn.err.network') : tr('scn.err.other')}
        action={<SecondaryButton label={tr('scn.retry')} icon="refresh-cw" size="sm" style={{ marginTop: spacing.xs, alignSelf: 'flex-start' }} onPress={() => f.retry()} testID="scan-retry" />}>
        {f.message}
      </Banner>
    </View>
  );
}

function RecallsBlock({ w }: { w: ScanWizard }) {
  if (!w.lookup.recalls.length) return null;
  return (
    <View style={{ gap: spacing.sm }} testID="scan-recalls">
      <SectionTitle title={tr('u6.sc.recalls_title')} />
      {w.lookup.recalls.map((r) => <RecallCard key={r.id} r={{ ...r, lot_numbers: r.lot_numbers ?? [], match: r.match ?? 'gtin' }} />)}
      <Text variant="caption" muted>{RECALL_DISCLAIMER}</Text>
    </View>
  );
}

/** Produit confirmé, rappelé en tête des étapes suivantes ; « Modifier » revient à la confirmation (saisie conservée). */
function SubjectSummary({ w }: { w: ScanWizard }) {
  const s = w.subject;
  const check = w.lookup.recall_check;
  return (
    <MatteSurface radius={radius.lg} padded={spacing.md} testID="scan-subject">
      <Row style={{ alignItems: 'center' }}>
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          <Text variant="caption" muted>{tr('u6.sf.confirmed')}</Text>
          {s?.candidate?.is_demo || isDemo ? <DemoTag /> : null}
          <Text weight="bold" numberOfLines={2}>{s?.name ?? '—'}</Text>
          <Text variant="small" muted>{[s?.brand, s?.barcode ? `EAN ${s.barcode}` : null].filter(Boolean).join(' · ') || (s?.candidate ? '' : tr('u6.sf.manual'))}</Text>
        </View>
        <SecondaryButton label={tr('scn.edit')} size="sm" onPress={() => w.goTo('confirm')} testID="scan-edit-subject" />
      </Row>
      {!w.lookup.recalls.length && check ? (
        <Text variant="caption" muted style={{ marginTop: spacing.xs }}>{check.checked ? tr('u6.sf.no_recall', { disclaimer: RECALL_DISCLAIMER }) : check.error ?? ''}</Text>
      ) : null}
    </MatteSurface>
  );
}

function ChipGroup<T extends string>({ label, values, value, labelOf, onChange }: { label: string; values: T[]; value: T | null; labelOf: (v: T) => string; onChange: (v: T | null) => void }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text variant="label">{label}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {values.map((x) => <Chip key={x} label={labelOf(x)} selected={value === x} onPress={() => onChange(value === x ? null : x)} />)}
      </View>
    </View>
  );
}

// ------------------------------------------------------------ 1. Identifier
function IdentifyStep({ w }: { w: ScanWizard }) {
  const t = useTheme();
  const { kind } = w;
  return (
    <>
      <MatteSurface radius={radius.lg} padded={spacing.md} contentStyle={{ gap: spacing.sm }}>
        <Field label={kind === 'food' ? tr('u6.sf.food_name_or_code') : tr('u6.sf.product_name_or_code')} value={w.query} onChangeText={w.setQuery}
          hint={kind === 'food' ? tr('u6.sf.hint_food') : tr('u6.sf.hint_product')} autoCorrect={false} testID="scan-query"
          returnKeyType="search" onSubmitEditing={() => { void w.runSearch(w.query, 'search'); }} />
        {isDemo ? (
          <View style={{ gap: spacing.xs }}>
            <Text variant="caption" muted>{tr('scn.demoCodes')}</Text>
            <Row wrap>
              {DEMO_CODES[kind].map((c) => <Chip key={c} label={c} onPress={() => { w.setQuery(c); void w.identifyBarcode(c, 'manual'); }} testID={`scan-demo-${c}`} />)}
            </Row>
          </View>
        ) : null}
      </MatteSurface>

      <FailureBanner w={w} />
      {isDemo ? (
        <Banner tone="demo" title={tr('u6.sc.demo_data')}>{tr('u6.sf.demo_note', { codes: DEMO_CODES[kind].slice(0, 2).join(tr('u6.sf.or')) })}</Banner>
      ) : null}
      {w.notice ? <Banner tone="info">{w.notice}</Banner> : null}
      {w.ocr && w.method === 'ingredients_photo' ? <Banner tone="success">{tr('u6.sf.ingredients_read_banner')}</Banner> : null}
      {w.busy ? <Text variant="small" muted accessibilityLiveRegion="polite" testID="scan-busy">{w.busy}</Text> : null}

      <MatteSurface radius={radius.lg} padded={spacing.md} contentStyle={{ gap: spacing.xs }}>
        <Text variant="label">{tr('u6.sf.barcode')}</Text>
        {cameraAvailable ? (
          w.camera.on ? (
            <View style={[styles.camera, { borderColor: t.colors.border, backgroundColor: t.colors.surfaceAlt }]}>
              <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }} onBarcodeScanned={w.camera.onScanned} />
              <ScanFrame reading={w.camera.reading} />
              <View style={styles.cameraFooter}>
                <SecondaryButton label={tr('u6.sf.close_camera')} size="sm" onPress={() => w.camera.setOn(false)} />
              </View>
            </View>
          ) : (
            <>
              <Text variant="caption" muted>{tr('u6.sf.camera_note')}</Text>
              <SecondaryButton label={tr('u6.sf.scan_barcode')} icon="camera" onPress={w.camera.open} style={{ alignSelf: 'flex-start' }} />
            </>
          )
        ) : (
          <Text variant="small" muted>{tr('u6.sf.no_camera_here')}</Text>
        )}
        {w.camera.denied ? (
          <Banner tone="warning" title={tr('u6.sf.camera_denied')}
            action={w.camera.denied === 'settings' ? <SecondaryButton label={tr('u6.sf.open_settings')} size="sm" style={{ marginTop: 6, alignSelf: 'flex-start' }} onPress={() => Linking.openSettings().catch(() => undefined)} /> : undefined}>
            {w.camera.denied === 'settings' ? tr('u6.sf.camera_denied_settings') : tr('u6.sf.camera_denied_ask')}
          </Banner>
        ) : null}
        <Divider />
        <Text variant="label">{tr('u6.sf.photo')}</Text>
        {w.photo.localText || w.photo.localBarcode ? (
          <>
            <Text variant="caption" muted>{tr('u6.sf.photo_local')}</Text>
            <Row wrap>
              <SecondaryButton label={kind === 'food' ? tr('u6.sf.photo_packaging') : tr('u6.sf.take_photo')} icon="camera" size="sm" onPress={() => w.photo.fromPhoto('camera', 'product')} />
              <SecondaryButton label={tr('u6.sf.photo_ingredients')} icon="file-text" size="sm" onPress={() => w.photo.fromPhoto('camera', 'ingredients')} />
              <SecondaryButton label={tr('u6.sf.import_photo')} icon="image" size="sm" onPress={() => w.photo.fromPhoto('library', 'product')} />
            </Row>
          </>
        ) : (
          <Text variant="caption" muted>{tr('u6.sf.photo_needs_app', { reason: tr('l7.recog.unavailable') })}</Text>
        )}
      </MatteSurface>
    </>
  );
}

// ------------------------------------------------------------ 2. Confirmer
function ConfirmStep({ w }: { w: ScanWizard }) {
  const { kind, candidates, ciqual, lookup } = w;
  const nothing = !candidates.length && !ciqual.length;
  const date = (iso: string) => iso.split('-').reverse().join('/');
  return (
    <>
      {w.notice ? <Banner tone="warning">{w.notice}</Banner> : null}
      <RecallsBlock w={w} />
      <SectionTitle title={tr('u6.sf.is_it')} />
      {lookup.outage ? (
        <View testID="scan-outage"><Banner tone="warning" icon="cloud-off" title={tr('scn.outage')}>{lookup.message ?? tr('scn.outageBody')}</Banner></View>
      ) : lookup.message && lookup.database === 'demo' && !nothing ? <Banner tone="info">{lookup.message}</Banner> : null}
      {lookup.stale && candidates[0] ? <Banner tone="warning">{tr('u6.sf.stale', { date: date(candidates[0].data_retrieved_at) })}</Banner> : null}

      {nothing ? (
        // Produit inconnu : on le dit, rien n'est deviné
        <MatteSurface radius={radius.lg} padded={spacing.md} testID="scan-unknown" contentStyle={{ gap: spacing.xs }}>
          <Row gap={spacing.sm}><Icon name="help-circle" size={20} /><Text weight="bold" style={{ flex: 1 }}>{tr('u6.sf.not_found')}</Text></Row>
          {w.scannedBarcode ? <Text variant="small" muted>{tr('scn.unknownCode', { code: w.scannedBarcode })}</Text> : null}
          {lookup.message && !lookup.outage ? <Text variant="small" muted>{lookup.message}</Text> : null}
          <Text variant="small">{tr('scn.unknownBody')}</Text>
        </MatteSurface>
      ) : null}

      {candidates.length ? (
        <View accessibilityRole="radiogroup" accessibilityLabel={tr('u6.sf.is_it')} style={{ gap: spacing.sm }}>
          {candidates.map((c, i) => (
            <ChoiceCard key={`${c.barcode}${i}`} selected={w.pick?.kind === 'candidate' && w.pick.index === i} onPress={() => w.setPick({ kind: 'candidate', index: i })}
              label={[c.name ?? tr('u6.sf.name_missing'), c.brand].filter(Boolean).join(', ')} testID={`scan-candidate-${i}`}>
              <Row gap={spacing.md} style={{ alignItems: 'flex-start' }}>
                {c.image_url ? <Image source={{ uri: c.image_url }} style={{ width: 56, height: 56, borderRadius: radius.sm }} resizeMode="contain" accessibilityLabel={tr('u6.sc.photo')} /> : null}
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  {c.is_demo || isDemo ? <DemoTag /> : null}
                  <Text weight="bold">{c.name ?? tr('u6.sf.name_missing')}</Text>
                  <Text variant="small" muted>{[c.brand, c.barcode ? `EAN ${c.barcode}` : null].filter(Boolean).join(' · ')}</Text>
                  <Text variant="caption" muted>{`${tr('u6.sc.source', { text: c.data_source })}${c.data_retrieved_at ? `, ${tr('u6.sf.consulted', { date: date(c.data_retrieved_at) })}` : ''}`}</Text>
                </View>
              </Row>
            </ChoiceCard>
          ))}
        </View>
      ) : null}
      {ciqual.length ? (
        <View accessibilityRole="radiogroup" accessibilityLabel={tr('u6.sf.is_it')} style={{ gap: spacing.sm }}>
          {ciqual.map((f, i) => (
            <ChoiceCard key={f.code} selected={w.pick?.kind === 'ciqual' && w.pick.index === i} onPress={() => w.setPick({ kind: 'ciqual', index: i })} label={f.nom} testID={`scan-ciqual-${i}`}>
              {f.is_demo || isDemo ? <DemoTag /> : null}
              <Text weight="bold">{f.nom}</Text>
              <Text variant="caption" muted>{tr('u6.sf.generic_food', { version: f.source_version })}</Text>
            </ChoiceCard>
          ))}
        </View>
      ) : null}
      {!nothing && !w.pick ? <Text variant="caption" muted>{tr('scn.pickOne')}</Text> : null}

      <MatteSurface radius={radius.lg} padded={spacing.md} contentStyle={{ gap: spacing.sm }} testID="scan-manual">
        <View style={{ gap: 2 }}>
          <Text weight="medium">{nothing ? tr('scn.nameIt') : tr('u6.sf.none_match')}</Text>
          <Text variant="small" muted>{tr('u6.sf.enter_yourself')}</Text>
        </View>
        <Field label={kind === 'food' ? tr('u6.sf.food_name') : tr('u6.sf.product_name')} value={w.manualName} onChangeText={w.setManualName} testID="scan-manual-name" maxLength={160} />
        {kind === 'product' || w.scannedBarcode ? <Field label={tr('u6.sf.brand')} optional value={w.manualBrand} onChangeText={w.setManualBrand} maxLength={120} testID="scan-manual-brand" /> : null}
      </MatteSurface>
    </>
  );
}

// ------------------------------------------------------------ 3. Pour qui
function ProfileStep({ w }: { w: ScanWizard }) {
  return (
    <>
      <SubjectSummary w={w} />
      <RecallsBlock w={w} />
      <SectionTitle title={tr('u6.sf.for_whom')} />
      <MatteSurface radius={radius.lg} padded={spacing.md} contentStyle={{ gap: spacing.sm }}>
        <View accessibilityRole="radiogroup" accessibilityLabel={tr('u6.sf.for_whom')} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {w.options.map((o) => <Chip key={o.key} label={o.label} selected={w.selectedKey === o.key} onPress={() => w.setProfileKey(o.key)} />)}
          {GENERIC_PROFILES.map((g) => <Chip key={g.key} label={g.label} selected={w.selectedKey === g.key} onPress={() => w.setProfileKey(g.key)} testID={`scan-profile-${g.key.replace(/^g:/, '')}`} />)}
        </View>
        {w.generic?.needsAge ? (
          <Field label={w.generic.kind === 'child' ? tr('u6.sf.age_years') : tr('u6.sf.age_months')} keyboardType="number-pad" value={w.ageText} onChangeText={w.setAgeText}
            error={w.needsAge && w.ageText.trim() ? tr('u6.sf.age_invalid') : null} hint={tr('u6.sf.age_hint')} testID="scan-age" maxLength={3} />
        ) : null}
        <Field label={tr('u6.sf.allergies')} optional value={w.allergiesText} onChangeText={w.setAllergiesText} hint={tr('u6.sf.allergies_hint')} testID="scan-allergies" maxLength={300} />
        {w.profile ? <Text variant="caption" muted>{tr('u6.sf.analysis_for', { profile: profileLabel(w.profile) })}</Text> : null}
        {w.needsAge ? <Text variant="caption" muted>{tr('u6.sf.need_age')}</Text> : null}
      </MatteSurface>
    </>
  );
}

// ------------------------------------------------------------ 4. Préciser + analyser
function DetailsStep({ w }: { w: ScanWizard }) {
  const { kind } = w;
  return (
    <>
      <SubjectSummary w={w} />
      <RecallsBlock w={w} />
      {kind === 'product' ? (
        <>
          <SectionTitle title={tr('u6.sf.type_use')} />
          <MatteSurface radius={radius.lg} padded={spacing.md} contentStyle={{ gap: spacing.sm }}>
            <ChipGroup label={tr('u6.sf.product_type')} values={PRODUCT_TYPES.filter((x) => x !== 'other')} value={w.ptype} labelOf={(x) => PRODUCT_TYPE_LABEL[x]} onChange={w.setPtype} />
            <ChipGroup label={tr('u6.sf.use')} values={EXPOSURES} value={w.exposure} labelOf={(x) => EXPOSURE_LABEL[x]} onChange={w.setExposure} />
            <ChipGroup label={tr('u6.sf.zone')} values={ZONES} value={w.zone} labelOf={(x) => ZONE_LABEL[x]} onChange={w.setZone} />
            <Text variant="caption" muted>{tr('u6.sf.no_precision')}</Text>
          </MatteSurface>
        </>
      ) : null}

      <SectionTitle title={tr('u6.sc.ingredients')} />
      <MatteSurface radius={radius.lg} padded={spacing.md} contentStyle={{ gap: spacing.sm }}>
        <Field label={kind === 'food' ? tr('u6.sf.list_food') : tr('u6.sf.list_inci')} optional multiline value={w.ingredients} testID="scan-ingredients"
          onChangeText={(v) => { w.setIngredients(v); if (w.origin === 'database' || w.origin === null) w.setOrigin(v.trim() ? 'manual' : null); }}
          hint={w.origin === 'database' ? tr('u6.sf.hint_db') : w.origin === 'ocr_reviewed' ? tr('u6.sf.hint_ocr') : tr('u6.sf.hint_manual')} />
        {w.origin === 'ocr_reviewed' && w.ocr ? <Text variant="caption" muted>{tr('u6.sf.readability', { pct: Math.round(w.ocr.readability * 100) })}</Text> : null}
        {w.photo.localText ? (
          <SecondaryButton label={tr('u6.sf.photo_list')} icon="camera" size="sm" style={{ alignSelf: 'flex-start' }} onPress={() => w.photo.fromPhoto('camera', 'ingredients')} />
        ) : null}
        {kind === 'product' ? (
          <>
            <Field label={tr('u6.sf.precautions')} optional multiline value={w.precautions} onChangeText={w.setPrecautions} maxLength={1000} />
            <Field label={tr('u6.sf.pao')} optional value={w.pao} onChangeText={w.setPao} maxLength={20} />
          </>
        ) : null}
      </MatteSurface>

      {kind === 'food' && w.questions.length ? (
        <>
          <SectionTitle title={tr('u6.sf.questions')} />
          <MatteSurface radius={radius.lg} padded={spacing.md} contentStyle={{ gap: spacing.sm }}>
            <Text variant="caption" muted>{tr('u6.sf.questions_note')}</Text>
            {w.questions.map((q, i) => (
              <View key={q.key} style={{ gap: 4 }}>
                {i > 0 ? <Divider /> : null}
                <Text weight="medium">{q.label}{q.critical ? ' *' : ''}</Text>
                <Text variant="caption" muted>{q.why}</Text>
                {q.options ? (
                  <View accessibilityRole="radiogroup" accessibilityLabel={q.label} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {q.options.map((o) => (
                      <Chip key={o.value} label={o.label} selected={(w.answers as Record<string, unknown>)[q.key] === o.value}
                        onPress={() => w.setAnswers((a) => ({ ...a, [q.key]: o.value }))} />
                    ))}
                  </View>
                ) : q.key === OPENED_KEY ? (
                  <Field label={tr('u6.sf.days')} optional keyboardType="number-pad" value={w.openedText} onChangeText={w.setOpenedText} maxLength={4} />
                ) : null}
              </View>
            ))}
            <Text variant="caption" muted>{tr('u6.sf.unanswered')}</Text>
          </MatteSurface>
        </>
      ) : null}

      <FailureBanner w={w} />
      {w.quotaReached ? (
        <View testID="scan-quota">
          <Banner tone="info" title={tr('u6.sf.quota_used')}
            action={(
              <Row wrap style={{ marginTop: spacing.xs }}>
                <SecondaryButton label={tr('scn.freeRecalls')} icon="bell" size="sm" onPress={() => router.push('/scanner/recalls')} />
                <SecondaryButton label={tr('u6.sf.discover')} size="sm" onPress={() => router.push('/settings/subscription')} />
              </Row>
            )}>
            {tr('u6.sf.quota_body')}
          </Banner>
        </View>
      ) : w.quota ? (
        <Text variant="caption" muted>{tr('u6.sf.quota_left', { remaining: w.quota.remaining, quota: w.quota.quota })}</Text>
      ) : null}
      {w.busy ? <Text variant="small" muted accessibilityLiveRegion="polite">{w.busy}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  camera: { height: 300, borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1 },
  cameraFooter: { position: 'absolute', bottom: spacing.sm, left: 0, right: 0, alignItems: 'center' },
});
