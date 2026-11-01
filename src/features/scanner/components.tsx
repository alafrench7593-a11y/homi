/**
 * Affichage d'un résultat du scanner (produit ou aliment) : verdict, raisons, sources datées et ouvrables,
 * rappels officiels, informations manquantes, niveau de certitude, explication IA (ou explication des règles).
 * Aucune note chiffrée : le moteur n'en calcule pas (score = null).
 */
import { StaggerItem } from '@/components/Motion';
import React from 'react';
import { Image, Linking, View } from 'react-native';
import { router } from 'expo-router';
import { Banner, Button, Card, Divider, Icon, Row, SectionTitle, Text, type IconName } from '@/components/ui';
import { CERTAINTY_LABEL, DEMO_LABEL, RECALL_DISCLAIMER, type Finding, type FindingLevel, type RecallInfo } from '@/lib/domain/scanCommon';
import { ruleExplanation, type ScanAnalysis } from '@/lib/domain/scanExplain';
import type { FoodAnalysis } from '@/lib/domain/scanFood';
import type { IngredientLine, ProductAnalysis } from '@/lib/domain/scanProduct';
import { frDate, type ScanSource } from '@/lib/domain/scanSources';
import { cosingFunctionLabel, type ExplainResponse, type ScanRow } from '@/lib/types-scanner';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

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
      <Text variant={small ? 'small' : 'heading'} weight="bold" color={color} style={{ flex: 1 }}>{verdict}</Text>
    </Row>
  );
}

export const LEVEL_LABEL: Record<FindingLevel, string> = {
  avoid: 'À éviter selon la source', missing: 'Information manquante', prepare: 'À préparer autrement',
  professional: 'Avis d’un professionnel', precaution: 'Précaution', info: 'Information',
};

function FindingRow({ f, index }: { f: Finding; index: Map<string, number> }) {
  const t = useTheme();
  const color = f.level === 'avoid' ? t.colors.danger : f.level === 'info' ? t.colors.lavender : t.colors.gold;
  const nums = f.sourceIds.map((id) => index.get(id)).filter((n): n is number => !!n);
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.xs }}>
      <Icon name={f.level === 'info' ? 'info' : 'alert-circle'} size={18} color={color} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="caption" weight="bold" color={color}>{LEVEL_LABEL[f.level]}</Text>
        <Text weight="medium">{f.title}</Text>
        <Text variant="small" muted>{`Pourquoi : ${f.explanation}`}</Text>
        {nums.length ? <Text variant="caption" muted>{`Source${nums.length > 1 ? 's' : ''} : ${nums.map((n) => `[${n}]`).join(' ')}`}</Text> : null}
      </View>
    </View>
  );
}

export function RecallCard({ r }: { r: RecallInfo }) {
  return (
    <Banner tone={r.match === 'gtin' ? 'danger' : 'warning'} icon="alert-triangle"
      title={`${r.match === 'gtin' ? 'Rappel officiel' : 'Rappel officiel possible (à vérifier)'}${r.is_demo ? ` — ${DEMO_LABEL}` : ''} : ${r.title}`}>
      <View style={{ gap: 4 }}>
        {r.reason ? <Text variant="small">{`Motif : ${r.reason}`}</Text> : null}
        {r.risks ? <Text variant="small">{`Risques : ${r.risks}`}</Text> : null}
        {r.recommended_action ? <Text variant="small" weight="medium">{`Conduite à tenir : ${r.recommended_action}`}</Text> : null}
        {r.lot_numbers?.length ? <Text variant="small" muted>{`Lots concernés : ${r.lot_numbers.join(', ')}`}</Text> : null}
        {r.match === 'brand_name' ? <Text variant="small" muted>Correspondance trouvée par la marque et le nom, pas par le code-barres : comparez la référence et le lot.</Text> : null}
        <Text variant="caption" muted>{`Source : ${r.source}${r.published_on ? ` · publié le ${frDate(r.published_on)}` : ''}`}</Text>
        {r.official_url ? <Button label="Voir l’avis officiel" size="sm" variant="ghost" icon="external-link" style={{ alignSelf: 'flex-start' }} onPress={() => open(r.official_url)} /> : null}
      </View>
    </Banner>
  );
}

export function RecallSection({ a }: { a: StoredAnalysis }) {
  const check = a.recallCheck;
  return (
    <>
      <SectionTitle title="Rappels officiels" />
      {a.recalls.map((r) => <RecallCard key={r.id} r={r} />)}
      <Card tone="soft">
        {!a.recalls.length ? (
          check?.checked
            ? <Text variant="small">{`Aucun rappel officiel trouvé pour ce produit dans ${check.source} (vérifié le ${frDate(check.checkedOn)}).`}</Text>
            : <Text variant="small">{check?.error ?? 'La vérification des rappels officiels n’a pas pu être faite. Consultez rappel.conso.gouv.fr.'}</Text>
        ) : null}
        <Text variant="small" weight="medium" style={{ marginTop: a.recalls.length ? 0 : 4 }}>{RECALL_DISCLAIMER}</Text>
        <Text variant="caption" muted style={{ marginTop: 4 }}>Les alertes de rappel sont toujours gratuites.</Text>
      </Card>
    </>
  );
}

export function SourcesList({ sources, dataSource }: { sources: ScanSource[]; dataSource: StoredAnalysis['dataSource'] }) {
  return (
    <Card>
      <Text variant="label">Origine des données</Text>
      <Text variant="small" style={{ marginTop: 2 }}>{dataSource.label}</Text>
      {dataSource.retrieved_on ? <Text variant="caption" muted>{`Données récupérées le ${frDate(dataSource.retrieved_on)}`}</Text> : null}
      {dataSource.url ? <Button label="Ouvrir la fiche d’origine" size="sm" variant="ghost" icon="external-link" style={{ alignSelf: 'flex-start' }} onPress={() => open(dataSource.url)} /> : null}
      <Divider />
      <Text variant="label" style={{ marginTop: spacing.xs }}>Sources des règles</Text>
      {sources.map((s, i) => (
        <View key={s.id} style={{ paddingVertical: 4 }}>
          <Text variant="small">{`[${i + 1}] ${s.publisher} — ${s.label}`}</Text>
          <Text variant="caption" muted>
            {`${s.published_on ? `Publié le ${frDate(s.published_on)} · ` : ''}consulté le ${frDate(s.consulted_on)}${s.review === 'to_review' ? ' · passage précis en cours de relecture' : ''}`}
          </Text>
          <Button label="Ouvrir la source" size="sm" variant="ghost" icon="external-link" style={{ alignSelf: 'flex-start' }} onPress={() => open(s.url)} />
        </View>
      ))}
    </Card>
  );
}

function IngredientRow({ i }: { i: IngredientLine }) {
  const t = useTheme();
  const flags: string[] = [];
  if (i.flags.includes('declared_allergy')) flags.push('allergie déclarée');
  if (i.flags.includes('fragrance_allergen')) flags.push('allergène de parfum');
  if (i.flags.includes('perfume')) flags.push('parfum');
  if (i.flags.includes('essential_oil')) flags.push('huile essentielle');
  if (i.flags.includes('phenoxyethanol')) flags.push('phénoxyéthanol');
  return (
    <View style={{ paddingVertical: 3 }}>
      <Text variant="small" weight="medium">{i.name}</Text>
      <Text variant="caption" muted>
        {i.functions
          ? `Fonction (CosIng${i.functionSource === 'cosing_demo' ? `, ${DEMO_LABEL}` : ''}) : ${i.functions.map(cosingFunctionLabel).join(', ')}`
          : 'Fonction : information non disponible'}
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

const PERFUME_LABEL = { present: 'Oui (parfum ou fragrance dans la liste)', absent: 'Non indiqué dans la liste des ingrédients', unknown: 'Information non disponible (composition inconnue)' };

function ProductDetails({ a }: { a: ProductAnalysis & { declaredAllergens?: string[] } }) {
  return (
    <>
      <SectionTitle title="Composition" />
      <Card>
        <Text variant="small">{`Type : ${a.product.typeLabel} · ${a.exposure.label} · Zone : ${a.zone.label}`}</Text>
        <Text variant="caption" muted>{a.exposure.explanation}</Text>
        <Divider />
        {a.ingredients.length
          ? a.ingredients.map((i, k) => <IngredientRow key={`${k}${i.name}`} i={i} />)
          : <Text variant="small" muted>Liste des ingrédients : information non disponible.</Text>}
      </Card>
      <Card>
        <Text variant="label">Parfum</Text>
        <Text variant="small">{PERFUME_LABEL[a.perfume]}</Text>
        <Text variant="label" style={{ marginTop: spacing.xs }}>Allergènes déclarés</Text>
        <Text variant="small">
          {[...a.fragranceAllergens, ...(a.declaredAllergens ?? [])].length
            ? [...new Set([...a.fragranceAllergens, ...(a.declaredAllergens ?? [])])].join(', ')
            : a.ingredients.length ? 'Aucun allergène de parfum réglementé repéré dans la liste.' : 'Information non disponible.'}
        </Text>
        {a.essentialOils.length ? (
          <>
            <Text variant="label" style={{ marginTop: spacing.xs }}>Huiles essentielles</Text>
            <Text variant="small">{a.essentialOils.join(', ')}</Text>
          </>
        ) : null}
        <Text variant="label" style={{ marginTop: spacing.xs }}>Précautions de l’emballage</Text>
        <Text variant="small">{a.packagingPrecautions ?? 'Information non disponible.'}</Text>
        {a.periodAfterOpening ? <Text variant="small">{`Durée après ouverture : ${a.periodAfterOpening}`}</Text> : null}
      </Card>
      {a.profile.kind === 'pregnant' || a.profile.kind === 'breastfeeding' ? <List title="Grossesse et allaitement" items={a.pregnancyInfo} /> : null}
      {a.childInfo.length ? <List title="Selon l’âge de l’enfant" items={a.childInfo} /> : null}
    </>
  );
}

const ANSWER_LABEL: Record<string, Record<string, string>> = {
  cooking: { cooked: 'bien cuit', undercooked: 'peu cuit', raw: 'cru', unknown: 'je ne sais pas' },
  milk: { pasteurized: 'pasteurisé', raw: 'lait cru', unknown: 'je ne sais pas' },
  origin: { homemade: 'fait maison', industrial: 'industriel', unknown: 'je ne sais pas' },
  texture: { smooth: 'lisse', mashed: 'écrasée', soft_pieces: 'petits morceaux fondants', pieces: 'morceaux', whole: 'entier', unknown: 'je ne sais pas' },
  cut: { whole: 'entier', cut_small: 'coupé finement', crushed: 'mixé ou râpé', unknown: 'je ne sais pas' },
  storage: { fridge: 'réfrigérateur', room: 'température ambiante', frozen: 'congelé', unknown: 'je ne sais pas' },
  diversification: { started: 'commencée', not_started: 'pas encore', unknown: 'je ne sais pas' },
};
const ANSWER_KEY: Record<string, string> = { cooking: 'Cuisson', milk: 'Lait', origin: 'Origine', texture: 'Texture', cut: 'Forme', storage: 'Conservation', diversification: 'Diversification' };

function FoodDetails({ a }: { a: FoodAnalysis & { declaredAllergens?: string[] } }) {
  const answers = Object.entries(a.answers ?? {})
    .filter(([k, v]) => v != null && k !== 'allergies' && k !== 'openedDaysAgo')
    .map(([k, v]) => `${ANSWER_KEY[k] ?? k} : ${ANSWER_LABEL[k]?.[String(v)] ?? String(v)}`);
  if (a.answers?.openedDaysAgo != null) answers.push(`Ouvert depuis ${a.answers.openedDaysAgo} jour(s)`);
  if (a.answers?.allergies?.length) answers.push(`Allergies connues : ${a.answers.allergies.join(', ')}`);
  const pregnancy = a.findings.filter((f) => f.id.startsWith('p_') || f.id.startsWith('b_')).map((f) => f.title);
  const child = a.findings.filter((f) => f.id.startsWith('c_')).map((f) => f.title);
  const n = a.nutrition;
  return (
    <>
      <SectionTitle title="Composition" />
      <Card>
        <Text variant="label">Ingrédients</Text>
        <Text variant="small">{a.ingredients.length ? a.ingredients.join(', ') : 'Information non disponible.'}</Text>
        <Text variant="label" style={{ marginTop: spacing.xs }}>Allergènes déclarés</Text>
        <Text variant="small">{a.declaredAllergens?.length ? a.declaredAllergens.join(', ') : 'Information non disponible.'}</Text>
        <Text variant="label" style={{ marginTop: spacing.xs }}>Repères nutritionnels (pour 100 g)</Text>
        {n ? (
          <>
            <Text variant="small">{[n.salt_g_100g != null ? `sel ${n.salt_g_100g} g` : null, n.sugars_g_100g != null ? `sucres ${n.sugars_g_100g} g` : null, n.energy_kcal_100g != null ? `${n.energy_kcal_100g} kcal` : null].filter(Boolean).join(' · ') || 'Information non disponible.'}</Text>
            <Text variant="caption" muted>{`Source : ${n.sourceLabel}`}</Text>
          </>
        ) : <Text variant="small" muted>Information non disponible (ni fiche produit, ni ligne de la table Ciqual importée pour cet aliment).</Text>}
      </Card>
      {answers.length ? <List title="Vos réponses" items={answers} /> : null}
      {a.profile.kind === 'pregnant' || a.profile.kind === 'breastfeeding' ? <List title="Grossesse et allaitement" items={pregnancy} empty="Aucune règle spécifique à la grossesse ou à l’allaitement ne s’applique d’après les informations disponibles." /> : null}
      {['newborn', 'baby', 'child'].includes(a.profile.kind) ? <List title="Selon l’âge de l’enfant" items={child} empty="Aucune règle liée à l’âge ne s’applique d’après les informations disponibles." /> : null}
    </>
  );
}

export function ExplanationCard({ a, explanation, loading }: { a: StoredAnalysis; explanation: ExplainResponse | null; loading?: boolean }) {
  const rules = ruleExplanation(a);
  if (explanation?.ai === 'ok') {
    const e = explanation.explanation;
    return (
      <Card tone="lavender">
        <Text variant="label">Explication en langage clair (IA)</Text>
        <Text style={{ marginTop: 4 }}>{e.summary}</Text>
        {e.points.map((p, i) => <Text key={i} variant="small" style={{ marginTop: 2 }}>{`• ${p}`}</Text>)}
        {e.missing.length ? <Text variant="small" muted style={{ marginTop: 4 }}>{`À vérifier : ${e.missing.join(' ; ')}`}</Text> : null}
        {e.next_step ? <Text variant="small" weight="medium" style={{ marginTop: 4 }}>{e.next_step}</Text> : null}
        <Text variant="caption" muted style={{ marginTop: 6 }}>
          {`Rédigée par Gemini (${explanation.model}) le ${frDate(explanation.generated_on)} à partir du verdict et des sources des règles. L’IA ne décide pas du verdict.`}
        </Text>
      </Card>
    );
  }
  const title = loading ? 'Explication IA en cours…' : explanation?.ai === 'not_configured' || !explanation ? 'Explication IA non configurée' : explanation.ai === 'consent_required' ? 'Explication IA désactivée' : 'Explication IA indisponible';
  return (
    <Card tone="soft">
      <Text variant="label">{title}</Text>
      {explanation && explanation.ai !== 'not_configured' && explanation.message ? <Text variant="caption" muted>{explanation.message}</Text> : null}
      <Text variant="small" weight="medium" style={{ marginTop: 4 }}>Explication des règles :</Text>
      <Text variant="small">{rules.summary}</Text>
      {rules.points.map((p, i) => <Text key={i} variant="small" style={{ marginTop: 2 }}>{`• ${p}`}</Text>)}
    </Card>
  );
}

/** Fiche résultat complète. */
export function ResultView({ a, explanation, explaining, actions }: { a: StoredAnalysis; explanation: ExplainResponse | null; explaining?: boolean; actions?: React.ReactNode }) {
  const t = useTheme();
  const subject = a.kind === 'product' ? a.product : a.food;
  const index = new Map(a.sources.map((s, i) => [s.id, i + 1]));
  return (
    <>
      {a.demo ? (
        <Banner tone="demo" title={DEMO_LABEL}>{'Ce résultat repose sur des données fictives de démonstration : ce n’est pas une analyse réelle.'}</Banner>
      ) : null}
      <StaggerItem index={0}><Card>
        <Row gap={spacing.md} style={{ alignItems: 'flex-start' }}>
          {subject.imageUrl && /^https:\/\//.test(subject.imageUrl) ? (
            <Image source={{ uri: subject.imageUrl }} style={{ width: 72, height: 72, borderRadius: radius.md, backgroundColor: t.colors.surfaceAlt }} resizeMode="contain" accessibilityLabel="Photo du produit" />
          ) : null}
          <View style={{ flex: 1, gap: 2 }}>
            {a.demo ? <DemoTag /> : null}
            <Text variant="heading">{subject.name ?? 'Produit sans nom'}</Text>
            <Text variant="small" muted>{[subject.brand, a.kind === 'product' ? a.product.typeLabel : 'Aliment', subject.barcode ? `EAN ${subject.barcode}` : null].filter(Boolean).join(' · ')}</Text>
            <Text variant="caption" muted>{`Pour : ${a.profileLabel} · analysé le ${frDate(a.analysedOn)}`}</Text>
          </View>
        </Row>
        {actions ? <View style={{ marginTop: spacing.sm }}>{actions}</View> : null}
      </Card></StaggerItem>

      <StaggerItem index={1}><Card>
        <Text variant="label">Verdict</Text>
        <View style={{ marginTop: 4 }}><VerdictBadge verdict={a.verdict} /></View>
        <Text variant="small" style={{ marginTop: 4 }}>{`Pourquoi : ${a.verdictReason}`}</Text>
        <Text variant="small" style={{ marginTop: 6 }} weight="medium">{`Niveau de certitude : ${CERTAINTY_LABEL[a.certainty]}`}</Text>
        {a.certaintyReasons.map((r) => <Text key={r} variant="caption" muted>{`• ${r}`}</Text>)}
        <Text variant="caption" muted style={{ marginTop: 6 }}>Aucune note chiffrée n’est calculée : le verdict repose uniquement sur les règles et les sources citées ci-dessous.</Text>
      </Card></StaggerItem>

      {a.askProfessional ? <Banner tone="info" icon="user">{a.askProfessional}</Banner> : null}

      <RecallSection a={a} />

      <SectionTitle title="Constats" />
      <Card>
        {a.findings.length ? a.findings.map((f, i) => (
          // Les constats apparaissent un à un ; aucun effet ne suggère qu'un produit est « sûr »
          <StaggerItem key={f.id} index={i + 2}>
            {i > 0 ? <Divider /> : null}
            <FindingRow f={f} index={index} />
          </StaggerItem>
        )) : <Text variant="small">Aucune des règles suivies ne s’applique d’après les informations disponibles.</Text>}
      </Card>

      {a.kind === 'product' ? <ProductDetails a={a} /> : <FoodDetails a={a} />}

      <List title="Informations manquantes" items={a.missing} empty="Aucune information manquante signalée par les règles." />

      <SectionTitle title="Explication" />
      <ExplanationCard a={a} explanation={explanation} loading={explaining} />

      <SectionTitle title="Sources" />
      <SourcesList sources={a.sources} dataSource={a.dataSource} />
      <Text variant="caption" muted>{a.disclaimer}</Text>
      <Text variant="caption" muted>{`Moteur de règles : ${a.engineVersion}`}</Text>
    </>
  );
}

/** Ligne d'historique : nom, type, date, verdict ; ouvre la fiche résultat. */
export function ScanListRow({ s, favorite }: { s: ScanRow; favorite?: boolean }) {
  return (
    <Card onPress={() => router.push(`/scanner/result/${s.id}`)} accessibilityLabel={`Voir le résultat pour ${s.product_snapshot?.name ?? 'ce produit'}`}>
      <Row style={{ alignItems: 'center' }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight="bold">{`${s.product_snapshot?.name ?? 'Sans nom'}${favorite ? ' ★' : ''}`}</Text>
          <Text variant="caption" muted>
            {[s.kind === 'food' ? 'Aliment' : 'Produit', s.product_snapshot?.brand, s.analysed_at ? frDate(s.analysed_at) : null, s.is_demo ? 'Données de démonstration' : null].filter(Boolean).join(' · ')}
          </Text>
          {s.verdict ? <VerdictBadge verdict={s.verdict} small /> : null}
        </View>
        <Icon name="chevron-right" size={18} />
      </Row>
    </Card>
  );
}
