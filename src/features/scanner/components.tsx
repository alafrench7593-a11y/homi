/**
 * Affichage d'un résultat du scanner (produit ou aliment) : verdict, raisons, sources datées et ouvrables,
 * rappels officiels, informations manquantes, niveau de certitude, explication IA (ou explication des règles).
 * Aucune note chiffrée : le moteur n'en calcule pas (score = null).
 */
import { StaggerItem } from '@/components/Motion';
import React from 'react';
import { Image, Linking, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Banner, Button, Card, Divider, Icon, Row, SectionTitle, Text, type IconName } from '@/components/ui';
import { DataTile, type TileTint } from '@/components/controls';
import { MatteSurface, OpticalGlass } from '@/components/surfaces';
import { useMorphSource } from '@/motion';
import { CERTAINTY_LABEL, DEMO_LABEL, RECALL_DISCLAIMER, type Finding, type FindingLevel, type RecallInfo } from '@/lib/domain/scanCommon';
import { ruleExplanation, type ScanAnalysis } from '@/lib/domain/scanExplain';
import { foodVerdictLabel, type FoodAnalysis } from '@/lib/domain/scanFood';
import { productVerdictLabel, type IngredientLine, type ProductAnalysis } from '@/lib/domain/scanProduct';
import { frDate, type ScanSource } from '@/lib/domain/scanSources';
import { cosingFunctionLabel, type ExplainResponse, type ScanRow } from '@/lib/types-scanner';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { formatDate, t as tr } from '@/i18n';
import { resultTiles, type ResultTile } from './wizard';

/** Résultat tel qu'enregistré (analyse des règles + allergènes déclarés par la base produit). */
export type StoredAnalysis = ScanAnalysis & { declaredAllergens?: string[] };

const open = (url: string | null | undefined) => {
  if (url && /^https:\/\//.test(url)) Linking.openURL(url).catch(() => undefined);
};

export function DemoTag({ label = DEMO_LABEL }: { label?: string }) {
  const t = useTheme();
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: t.colors.dangerSoft }}>
      <Text variant="caption" weight="bold" color={t.colors.danger}>{label.toUpperCase()}</Text>
    </View>
  );
}

type Tone = 'ok' | 'care' | 'avoid' | 'unknown';
export function verdictTone(verdict: string): Tone {
  if (verdict.startsWith('Adapté selon')) return 'ok';
  if (verdict.startsWith('Déconseillé') || verdict.startsWith('À éviter')) return 'avoid';
  if (verdict === 'Informations insuffisantes' || verdict === 'Impossible à confirmer') return 'unknown';
  return 'care';
}

export function useToneColor(tone: Tone) {
  const t = useTheme();
  return tone === 'ok' ? t.colors.success : tone === 'avoid' ? t.colors.danger : tone === 'care' ? t.colors.gold : t.colors.lavender;
}

const TONE_ICON: Record<Tone, IconName> = { ok: 'check-circle', care: 'alert-circle', avoid: 'x-octagon', unknown: 'help-circle' };

export function VerdictBadge({ verdict, small }: { verdict: string; small?: boolean }) {
  const tone = verdictTone(verdict);
  const color = useToneColor(tone);
  return (
    <Row gap={6} style={{ alignItems: 'center' }}>
      <Icon name={TONE_ICON[tone]} size={small ? 16 : 22} color={color} />
      <Text variant={small ? 'small' : 'heading'} weight="bold" color={color} style={{ flex: 1 }}>{foodVerdictLabel(productVerdictLabel(verdict))}</Text>
    </Row>
  );
}

const levelLabel = (l: FindingLevel): string => tr(`u6.sc.level_${l}` as 'u6.sc.level_avoid');

function FindingRow({ f, index }: { f: Finding; index: Map<string, number> }) {
  const t = useTheme();
  const color = f.level === 'avoid' ? t.colors.danger : f.level === 'info' ? t.colors.lavender : t.colors.gold;
  const nums = f.sourceIds.map((id) => index.get(id)).filter((n): n is number => !!n);
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs }}>
      <Icon name={f.level === 'info' ? 'info' : 'alert-circle'} size={18} color={color} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="caption" weight="bold" color={color}>{levelLabel(f.level)}</Text>
        <Text weight="medium">{f.title}</Text>
        <Text variant="small" muted>{tr('u6.sc.why', { text: f.explanation })}</Text>
        {nums.length ? <Text variant="caption" muted>{tr('u6.sc.sources_n', { count: nums.length, list: nums.map((n) => `[${n}]`).join(' ') })}</Text> : null}
      </View>
    </View>
  );
}

export function RecallCard({ r }: { r: RecallInfo }) {
  return (
    <Banner tone={r.match === 'gtin' ? 'danger' : 'warning'} icon="alert-triangle"
      title={`${r.match === 'gtin' ? tr('u6.sc.recall') : tr('u6.sc.recall_possible')}${r.is_demo ? ` — ${DEMO_LABEL}` : ''} : ${r.title}`}>
      <View style={{ gap: 4 }}>
        {r.reason ? <Text variant="small">{tr('u6.sc.reason', { text: r.reason })}</Text> : null}
        {r.risks ? <Text variant="small">{tr('u6.sc.risks', { text: r.risks })}</Text> : null}
        {r.recommended_action ? <Text variant="small" weight="medium">{tr('u6.sc.action', { text: r.recommended_action })}</Text> : null}
        {r.lot_numbers?.length ? <Text variant="small" muted>{tr('u6.sc.lots', { list: r.lot_numbers.join(', ') })}</Text> : null}
        {r.match === 'brand_name' ? <Text variant="small" muted>{tr('u6.sc.brand_match')}</Text> : null}
        <Text variant="caption" muted>{`${tr('u6.sc.source', { text: r.source })}${r.published_on ? ` · ${tr('u6.sc.published', { date: frDate(r.published_on) })}` : ''}`}</Text>
        {r.official_url ? <Button label={tr('u6.sc.see_notice')} size="sm" variant="ghost" icon="external-link" style={{ alignSelf: 'flex-start' }} onPress={() => open(r.official_url)} /> : null}
      </View>
    </Banner>
  );
}

export function RecallSection({ a }: { a: StoredAnalysis }) {
  const check = a.recallCheck;
  return (
    <>
      <SectionTitle title={tr('u6.sc.recalls_title')} />
      {a.recalls.map((r) => <RecallCard key={r.id} r={r} />)}
      <Card tone="soft">
        {!a.recalls.length ? (
          check?.checked
            ? <Text variant="small">{tr('u6.sc.no_recall', { source: check.source, date: frDate(check.checkedOn) })}</Text>
            : <Text variant="small">{check?.error ?? tr('u6.sc.recall_check_failed')}</Text>
        ) : null}
        <Text variant="small" weight="medium" style={{ marginTop: a.recalls.length ? 0 : 4 }}>{RECALL_DISCLAIMER}</Text>
        <Text variant="caption" muted style={{ marginTop: 4 }}>{tr('u6.sc.recall_free')}</Text>
      </Card>
    </>
  );
}

export function SourcesList({ sources, dataSource }: { sources: ScanSource[]; dataSource: StoredAnalysis['dataSource'] }) {
  return (
    <Card>
      <Text variant="label">{tr('u6.sc.data_origin')}</Text>
      <Text variant="small" style={{ marginTop: 2 }}>{dataSource.label}</Text>
      {dataSource.retrieved_on ? <Text variant="caption" muted>{tr('u6.sc.data_retrieved', { date: frDate(dataSource.retrieved_on) })}</Text> : null}
      {dataSource.url ? <Button label={tr('u6.sc.open_origin')} size="sm" variant="ghost" icon="external-link" style={{ alignSelf: 'flex-start' }} onPress={() => open(dataSource.url)} /> : null}
      <Divider />
      <Text variant="label" style={{ marginTop: spacing.xs }}>{tr('u6.sc.rules_sources')}</Text>
      {sources.map((s, i) => (
        <View key={s.id} style={{ paddingVertical: 4 }}>
          <Text variant="small">{`[${i + 1}] ${s.publisher} — ${s.label}`}</Text>
          <Text variant="caption" muted>
            {`${s.published_on ? `${tr('u6.sc.published_cap', { date: frDate(s.published_on) })} · ` : ''}${tr('u6.sc.consulted', { date: frDate(s.consulted_on) })}${s.review === 'to_review' ? ` · ${tr('u6.sc.under_review')}` : ''}`}
          </Text>
          <Button label={tr('u6.sc.open_source')} size="sm" variant="ghost" icon="external-link" style={{ alignSelf: 'flex-start' }} onPress={() => open(s.url)} />
        </View>
      ))}
    </Card>
  );
}

function IngredientRow({ i }: { i: IngredientLine }) {
  const t = useTheme();
  const flags: string[] = [];
  if (i.flags.includes('declared_allergy')) flags.push(tr('u6.sc.flag_allergy'));
  if (i.flags.includes('fragrance_allergen')) flags.push(tr('u6.sc.flag_fragrance'));
  if (i.flags.includes('perfume')) flags.push(tr('u6.sc.flag_perfume'));
  if (i.flags.includes('essential_oil')) flags.push(tr('u6.sc.flag_oil'));
  if (i.flags.includes('phenoxyethanol')) flags.push(tr('u6.sc.flag_phenoxy'));
  return (
    <View style={{ paddingVertical: 3 }}>
      <Text variant="small" weight="medium">{i.name}</Text>
      <Text variant="caption" muted>
        {i.functions
          ? tr('u6.sc.function', { demo: i.functionSource === 'cosing_demo' ? `, ${DEMO_LABEL}` : '', list: i.functions.map(cosingFunctionLabel).join(', ') })
          : tr('u6.sc.function_na')}
      </Text>
      {flags.length ? <Text variant="caption" color={t.colors.gold}>{flags.join(' · ')}</Text> : null}
    </View>
  );
}

function List({ title, items, empty }: { title: string; items: string[]; empty?: string }) {
  if (!items.length && !empty) return null;
  return (
    <Card>
      <Text variant="label">{title}</Text>
      {items.length ? items.map((x, i) => <Text key={`${i}${x}`} variant="small">{`• ${x}`}</Text>) : <Text variant="small" muted>{empty}</Text>}
    </Card>
  );
}

const perfumeLabel = (k: 'present' | 'absent' | 'unknown') => ({ present: tr('u6.sc.perfume_yes'), absent: tr('u6.sc.perfume_no'), unknown: tr('u6.sc.perfume_unknown') })[k];

function ProductDetails({ a }: { a: ProductAnalysis & { declaredAllergens?: string[] } }) {
  return (
    <>
      <SectionTitle title={tr('u6.sc.composition')} />
      <Card>
        <Text variant="small">{tr('u6.sc.type_zone', { type: a.product.typeLabel, exposure: a.exposure.label, zone: a.zone.label })}</Text>
        <Text variant="caption" muted>{a.exposure.explanation}</Text>
        <Divider />
        {a.ingredients.length
          ? a.ingredients.map((i, k) => <IngredientRow key={`${k}${i.name}`} i={i} />)
          : <Text variant="small" muted>{tr('u6.sc.ingredients_na')}</Text>}
      </Card>
      <Card>
        <Text variant="label">{tr('u6.sc.perfume')}</Text>
        <Text variant="small">{perfumeLabel(a.perfume)}</Text>
        <Text variant="label" style={{ marginTop: spacing.xs }}>{tr('u6.sc.declared_allergens')}</Text>
        <Text variant="small">
          {[...a.fragranceAllergens, ...(a.declaredAllergens ?? [])].length
            ? [...new Set([...a.fragranceAllergens, ...(a.declaredAllergens ?? [])])].join(', ')
            : a.ingredients.length ? tr('u6.sc.no_fragrance_allergen') : tr('u6.sc.na')}
        </Text>
        {a.essentialOils.length ? (
          <>
            <Text variant="label" style={{ marginTop: spacing.xs }}>{tr('u6.sc.essential_oils')}</Text>
            <Text variant="small">{a.essentialOils.join(', ')}</Text>
          </>
        ) : null}
        <Text variant="label" style={{ marginTop: spacing.xs }}>{tr('u6.sc.packaging')}</Text>
        <Text variant="small">{a.packagingPrecautions ?? tr('u6.sc.na')}</Text>
        {a.periodAfterOpening ? <Text variant="small">{tr('u6.sc.pao', { text: a.periodAfterOpening })}</Text> : null}
      </Card>
      {a.profile.kind === 'pregnant' || a.profile.kind === 'breastfeeding' ? <List title={tr('u6.sc.pregnancy')} items={a.pregnancyInfo} /> : null}
      {a.childInfo.length ? <List title={tr('u6.sc.by_age')} items={a.childInfo} /> : null}
    </>
  );
}

const answerLabel = (k: string, v: string): string => {
  const map: Record<string, Record<string, string>> = {
    cooking: { cooked: tr('u6.sc.a_cooked'), undercooked: tr('u6.sc.a_undercooked'), raw: tr('u6.sc.a_raw'), unknown: tr('u6.sc.a_unknown') },
    milk: { pasteurized: tr('u6.sc.a_pasteurized'), raw: tr('u6.sc.a_raw_milk'), unknown: tr('u6.sc.a_unknown') },
    origin: { homemade: tr('u6.sc.a_homemade'), industrial: tr('u6.sc.a_industrial'), unknown: tr('u6.sc.a_unknown') },
    texture: { smooth: tr('u6.sc.a_smooth'), mashed: tr('u6.sc.a_mashed'), soft_pieces: tr('u6.sc.a_soft_pieces'), pieces: tr('u6.sc.a_pieces'), whole: tr('u6.sc.a_whole'), unknown: tr('u6.sc.a_unknown') },
    cut: { whole: tr('u6.sc.a_whole'), cut_small: tr('u6.sc.a_cut_small'), crushed: tr('u6.sc.a_crushed'), unknown: tr('u6.sc.a_unknown') },
    storage: { fridge: tr('u6.sc.a_fridge'), room: tr('u6.sc.a_room'), frozen: tr('u6.sc.a_frozen'), unknown: tr('u6.sc.a_unknown') },
    diversification: { started: tr('u6.sc.a_started'), not_started: tr('u6.sc.a_not_started'), unknown: tr('u6.sc.a_unknown') },
  };
  return map[k]?.[v] ?? v;
};
const answerKey = (k: string): string => ({ cooking: tr('u6.sc.k_cooking'), milk: tr('u6.sc.k_milk'), origin: tr('u6.sc.k_origin'), texture: tr('u6.sc.k_texture'), cut: tr('u6.sc.k_cut'), storage: tr('u6.sc.k_storage'), diversification: tr('u6.sc.k_diversification') } as Record<string, string>)[k] ?? k;

function FoodDetails({ a }: { a: FoodAnalysis & { declaredAllergens?: string[] } }) {
  const answers = Object.entries(a.answers ?? {})
    .filter(([k, v]) => v != null && k !== 'allergies' && k !== 'openedDaysAgo')
    .map(([k, v]) => tr('u6.sc.answer_line', { key: answerKey(k), value: answerLabel(k, String(v)) }));
  if (a.answers?.openedDaysAgo != null) answers.push(tr('u6.sc.opened_days', { count: a.answers.openedDaysAgo }));
  if (a.answers?.allergies?.length) answers.push(tr('u6.sc.known_allergies', { list: a.answers.allergies.join(', ') }));
  const pregnancy = a.findings.filter((f) => f.id.startsWith('p_') || f.id.startsWith('b_')).map((f) => f.title);
  const child = a.findings.filter((f) => f.id.startsWith('c_')).map((f) => f.title);
  const n = a.nutrition;
  return (
    <>
      <SectionTitle title={tr('u6.sc.composition')} />
      <Card>
        <Text variant="label">{tr('u6.sc.ingredients')}</Text>
        <Text variant="small">{a.ingredients.length ? a.ingredients.join(', ') : tr('u6.sc.na')}</Text>
        <Text variant="label" style={{ marginTop: spacing.xs }}>{tr('u6.sc.declared_allergens')}</Text>
        <Text variant="small">{a.declaredAllergens?.length ? a.declaredAllergens.join(', ') : tr('u6.sc.na')}</Text>
        <Text variant="label" style={{ marginTop: spacing.xs }}>{tr('u6.sc.nutrition')}</Text>
        {n ? (
          <>
            <Text variant="small">{[n.salt_g_100g != null ? tr('u6.sc.salt', { n: n.salt_g_100g }) : null, n.sugars_g_100g != null ? tr('u6.sc.sugars', { n: n.sugars_g_100g }) : null, n.energy_kcal_100g != null ? tr('u6.sc.kcal', { n: n.energy_kcal_100g }) : null].filter(Boolean).join(' · ') || tr('u6.sc.na')}</Text>
            <Text variant="caption" muted>{tr('u6.sc.source', { text: n.sourceLabel })}</Text>
          </>
        ) : <Text variant="small" muted>{tr('u6.sc.nutrition_na')}</Text>}
      </Card>
      {answers.length ? <List title={tr('u6.sc.your_answers')} items={answers} /> : null}
      {a.profile.kind === 'pregnant' || a.profile.kind === 'breastfeeding' ? <List title={tr('u6.sc.pregnancy')} items={pregnancy} empty={tr('u6.sc.no_pregnancy_rule')} /> : null}
      {['newborn', 'baby', 'child'].includes(a.profile.kind) ? <List title={tr('u6.sc.by_age')} items={child} empty={tr('u6.sc.no_age_rule')} /> : null}
    </>
  );
}

export function ExplanationCard({ a, explanation, loading }: { a: StoredAnalysis; explanation: ExplainResponse | null; loading?: boolean }) {
  const rules = ruleExplanation(a);
  if (explanation?.ai === 'ok') {
    const e = explanation.explanation;
    return (
      <Card tone="lavender">
        <Text variant="label">{tr('u6.sc.ai_title')}</Text>
        <Text style={{ marginTop: 4 }}>{e.summary}</Text>
        {e.points.map((p, i) => <Text key={i} variant="small" style={{ marginTop: 2 }}>{`• ${p}`}</Text>)}
        {e.missing.length ? <Text variant="small" muted style={{ marginTop: 4 }}>{tr('u6.sc.to_check', { list: e.missing.join(' ; ') })}</Text> : null}
        {e.next_step ? <Text variant="small" weight="medium" style={{ marginTop: 4 }}>{e.next_step}</Text> : null}
        <Text variant="caption" muted style={{ marginTop: 6 }}>
          {tr('u6.sc.ai_credit', { model: explanation.model, date: frDate(explanation.generated_on) })}
        </Text>
      </Card>
    );
  }
  const title = loading ? tr('u6.sc.ai_loading') : explanation?.ai === 'not_configured' || !explanation ? tr('u6.sc.ai_not_configured') : explanation.ai === 'consent_required' ? tr('u6.sc.ai_disabled') : tr('u6.sc.ai_unavailable');
  return (
    <Card tone="soft">
      <Text variant="label">{title}</Text>
      {explanation && explanation.ai !== 'not_configured' && explanation.message ? <Text variant="caption" muted>{explanation.message}</Text> : null}
      <Text variant="small" weight="medium" style={{ marginTop: 4 }}>{tr('u6.sc.rules_explanation')}</Text>
      <Text variant="small">{rules.summary}</Text>
      {rules.points.map((p, i) => <Text key={i} variant="small" style={{ marginTop: 2 }}>{`• ${p}`}</Text>)}
    </Card>
  );
}

/** Fiche résultat complète. */
export function ResultView({ a, explanation, explaining, actions }: { a: StoredAnalysis; explanation: ExplainResponse | null; explaining?: boolean; actions?: React.ReactNode }) {
  const index = new Map(a.sources.map((s, i) => [s.id, i + 1]));
  return (
    <>
      {/* Point focal : le verdict, sur verre optique éclairé par la teinte du verdict */}
      <StaggerItem index={0}><VerdictHero a={a} actions={actions} /></StaggerItem>
      <StaggerItem index={1}><ResultTiles a={a} /></StaggerItem>
      {/* Démonstration : étiquette dans l'en-tête, explication ici (le verdict reste visible sans défiler) */}
      {a.demo ? <Banner tone="demo" title={DEMO_LABEL}>{tr('u6.sc.demo_banner')}</Banner> : null}

      {a.askProfessional ? <Banner tone="info" icon="user">{a.askProfessional}</Banner> : null}

      <RecallSection a={a} />

      <SectionTitle title={tr('u6.sc.findings')} />
      <Card>
        {a.findings.length ? a.findings.map((f, i) => (
          // Les constats apparaissent un à un ; aucun effet ne suggère qu'un produit est « sûr »
          <StaggerItem key={f.id} index={i + 2}>
            {i > 0 ? <Divider /> : null}
            <FindingRow f={f} index={index} />
          </StaggerItem>
        )) : <Text variant="small">{tr('u6.sc.no_rules')}</Text>}
      </Card>

      {a.kind === 'product' ? <ProductDetails a={a} /> : <FoodDetails a={a} />}

      <List title={tr('u6.sc.missing')} items={a.missing} empty={tr('u6.sc.no_missing')} />

      <SectionTitle title={tr('u6.sc.explanation')} />
      <ExplanationCard a={a} explanation={explanation} loading={explaining} />

      <SectionTitle title={tr('u6.sc.sources')} />
      <SourcesList sources={a.sources} dataSource={a.dataSource} />
      <Text variant="caption" muted>{a.disclaimer}</Text>
      <Text variant="caption" muted>{tr('u6.sc.engine', { version: a.engineVersion })}</Text>
    </>
  );
}

/**
 * En-tête du résultat (point focal) : produit, profil, date d'analyse, verdict et sa raison, niveau de certitude.
 * Verre optique teinté par le verdict (couleur + icône + libellé, jamais la couleur seule).
 */
export function VerdictHero({ a, actions }: { a: StoredAnalysis; actions?: React.ReactNode }) {
  const t = useTheme();
  const tone = useToneColor(verdictTone(a.verdict));
  const subject = a.kind === 'product' ? a.product : a.food;
  return (
    <OpticalGlass radius={radius.xl} padded={spacing.lg} tint={tone} contentStyle={{ gap: spacing.sm }} testID="scan-verdict">
      <Row gap={spacing.md} style={{ alignItems: 'flex-start' }}>
        {subject.imageUrl && /^https:\/\//.test(subject.imageUrl) ? (
          <Image source={{ uri: subject.imageUrl }} style={{ width: 64, height: 64, borderRadius: radius.md, backgroundColor: t.colors.surfaceAlt }} resizeMode="contain" accessibilityLabel={tr('u6.sc.photo')} />
        ) : null}
        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
          {a.demo ? <DemoTag /> : null}
          <Text variant="heading" accessibilityRole="header">{subject.name ?? tr('u6.sc.unnamed_product')}</Text>
          <Text variant="small" muted>{[subject.brand, a.kind === 'product' ? a.product.typeLabel : tr('u6.sc.food'), subject.barcode ? `EAN ${subject.barcode}` : null].filter(Boolean).join(' · ')}</Text>
          <Text variant="caption" muted>{tr('u6.sc.for_analysed', { profile: a.profileLabel, date: frDate(a.analysedOn) })}</Text>
        </View>
      </Row>
      <View style={{ gap: 4 }}>
        <Text variant="label">{tr('u6.sc.verdict')}</Text>
        <VerdictBadge verdict={a.verdict} />
        <Text variant="small">{tr('u6.sc.why', { text: a.verdictReason })}</Text>
        <Text variant="small" weight="medium">{tr('u6.sc.certainty', { level: CERTAINTY_LABEL[a.certainty] })}</Text>
        {a.certaintyReasons.map((r) => <Text key={r} variant="caption" muted>{`• ${r}`}</Text>)}
        <Text variant="caption" muted>{tr('u6.sc.no_score')}</Text>
      </View>
      {actions ? <View>{actions}</View> : null}
    </OpticalGlass>
  );
}

const TILE_TINT: Record<ResultTile['tone'], TileTint> = { neutral: 'accent2', warning: 'warning', danger: 'danger' };
const shortList = (items: string[], max = 3) => (items.length > max ? `${items.slice(0, max).join(', ')}${tr('scn.tile.more', { count: items.length - max })}` : items.join(', '));
const isoDay = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);

/**
 * Tuiles de résultat (DataTile) : valeurs RÉELLES de l'analyse enregistrée. Une information absente de la source
 * est un état inconnu explicite (« — » + raison), jamais « 0 ».
 */
export function ResultTiles({ a }: { a: StoredAnalysis }) {
  const tiles = resultTiles(a);
  const one = (x: ResultTile) => {
    const unknown = x.unknown === 'no_composition' ? tr('scn.tile.unknownComposition') : x.unknown === 'not_declared' ? tr('scn.tile.unknownDeclared')
      : x.unknown === 'not_checked' ? tr('scn.tile.unknownRecall') : x.unknown === 'no_date' ? tr('scn.tile.unknownDate') : undefined;
    if (x.key === 'source') {
      const d = x.date ? isoDay(x.date) : null;
      return (
        <DataTile key={x.key} label={tr('scn.tile.source')} icon="database" tint="accent"
          value={d ? formatDate(d, { day: 'numeric', month: 'short' }) : null} unit={d ? String(d.getFullYear()) : undefined}
          context={x.items[0]} emptyText={[unknown, x.items[0]].filter(Boolean).join(' · ')} testID="scan-tile-source" style={{ flexBasis: '100%', flexGrow: 1 }} />
      );
    }
    const label = x.key === 'allergens' ? tr('scn.tile.allergens') : x.key === 'recalls' ? tr('scn.tile.recalls') : a.kind === 'product' ? tr('scn.tile.watch') : tr('scn.tile.watchFood');
    const none = x.key === 'allergens' ? (a.kind === 'product' ? tr('scn.tile.allergensNone') : '') : x.key === 'recalls' ? '' : tr('scn.tile.watchNone');
    const context = x.key === 'recalls'
      ? [x.items.length ? shortList(x.items, 1) : null, x.date ? tr('scn.tile.recallChecked', { source: a.recallCheck?.source ?? 'RappelConso', date: frDate(x.date) }) : null].filter(Boolean).join(' · ')
      : x.items.length ? shortList(x.items) : none;
    const icon: IconName = x.key === 'allergens' ? 'alert-circle' : x.key === 'recalls' ? 'bell' : 'eye';
    return (
      <DataTile key={x.key} label={label} icon={icon} tint={TILE_TINT[x.tone]} value={x.count == null ? null : String(x.count)}
        context={context || undefined} emptyText={unknown} testID={`scan-tile-${x.key}`} style={{ flexBasis: 130, flexGrow: 1 }} />
    );
  };
  return (
    <View testID="scan-tiles" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {tiles.map(one)}
    </View>
  );
}

/**
 * Ligne d'historique (surface MATE) : nom, type, date, verdict. L'ouvrir agrandit la surface vers la fiche résultat
 * (morph `scan-<id>`, retour vers la même ligne). `trailing` : commandes de la ligne (favori, suppression).
 */
export function ScanListRow({ s, favorite, trailing, testID }: { s: ScanRow; favorite?: boolean; trailing?: React.ReactNode; testID?: string }) {
  const src = useMorphSource(`scan-${s.id}`, { radius: radius.lg });
  const name = s.product_snapshot?.name ?? tr('u6.sc.no_name');
  return (
    <View ref={src.ref} collapsable={false} testID={testID ?? `scan-row-${s.id}`}>
      <MatteSurface radius={radius.lg} padded={spacing.sm}>
        <Row style={{ alignItems: 'center' }}>
          <Pressable accessibilityRole="button" accessibilityLabel={tr('u6.sc.see_result', { name })} onPress={() => src.open(() => router.push(`/scanner/result/${s.id}`))}
            style={{ flex: 1, minWidth: 0, minHeight: 48, paddingHorizontal: spacing.xs, paddingVertical: 4, justifyContent: 'center' }} testID={`scan-open-${s.id}`}>
            <View style={{ gap: 2 }}>
              <Text weight="bold" numberOfLines={2}>{`${name}${favorite ? ' ★' : ''}`}</Text>
              <Text variant="caption" muted>
                {[s.kind === 'food' ? tr('u6.sc.food') : tr('u6.sc.product'), s.product_snapshot?.brand, s.analysed_at ? frDate(s.analysed_at) : null, s.is_demo ? tr('u6.sc.demo_data') : null].filter(Boolean).join(' · ')}
              </Text>
              {s.verdict ? <VerdictBadge verdict={s.verdict} small /> : <Text variant="caption" muted>{tr('scn.notAnalysed')}</Text>}
            </View>
          </Pressable>
          {trailing ?? <Icon name="chevron-right" size={18} />}
        </Row>
      </MatteSurface>
    </View>
  );
}
