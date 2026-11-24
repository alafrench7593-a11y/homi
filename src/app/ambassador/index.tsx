/**
 * Programme Ambassadeurs (24/11/2026) — candidature, tableau de bord, code d'un parent recommandé.
 * Conditions lues en direct (vue `ambassador_terms_public`) ; montants du tableau de bord fournis par le serveur
 * (`my_ambassador`), jamais estimés ici ; simulateur calculé par src/lib/ambassador/commission.ts (même formule que
 * le serveur et le site). Accessible sans abonnement (règle d'accès : écran libre).
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Share, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen } from '@/components/Screen';
import { Banner, Button, Card, Chip, Field, Loading, Row, SectionTitle, Text, Toggle } from '@/components/ui';
import { backend } from '@/lib/backend';
import { useAuth } from '@/lib/auth';
import { euros, nextTier, normalizeCode, rateFor, simulate, type AmbassadorTerms } from '@/lib/ambassador/commission';
import { formatDate, localeTag, t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';

type Mine = {
  status: 'pending' | 'approved' | 'suspended' | 'rejected'; code: string; tier: string; rate: number; referred: number; converted: number;
  pending_cents: number; payable_cents: number; paid_cents: number; month_cents: number; next_available_at: string | null;
  payout_threshold_cents: number; currency: string; demo_auto_approved?: boolean;
} | null;
type Attribution = { code: string } | null;

const SIM_STEPS = [10, 50, 100, 500, 1000];
const STATUSES = ['particulier', 'auto_entrepreneur', 'societe'] as const;

/** Lien public de l'ambassadeur : adresse du site (configurée ou, sur le web, celle de la page) + ?ref=CODE */
function shareLink(code: string): string | null {
  const base = (process.env.EXPO_PUBLIC_SITE_URL || (Platform.OS === 'web' && typeof location !== 'undefined' ? location.origin : '')).replace(/\/$/, '');
  return base ? `${base}/?ref=${code}` : null;
}
/** Code reçu par le lien du site (même appareil, web) : proposé, jamais appliqué seul */
function linkCode(): string | null {
  if (Platform.OS !== 'web') return null;
  try {
    const raw = JSON.parse(localStorage.getItem('homi.ref') || 'null') as { code?: string; at?: number } | null;
    if (!raw?.code || !raw.at || Date.now() - raw.at > 60 * 864e5) return null;
    return normalizeCode(raw.code);
  } catch { return null; }
}

export default function AmbassadorScreen() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const loc = localeTag();
  const termsQ = useQuery({ queryKey: ['ambassador', 'terms'], queryFn: async () => (await backend.select<AmbassadorTerms>({ table: 'ambassador_terms_public' }))[0] ?? null, staleTime: 300_000 });
  const mineQ = useQuery({ queryKey: [session?.userId, 'ambassador', 'mine'], queryFn: () => backend.rpc<Mine>('my_ambassador'), enabled: !!session });
  const attrQ = useQuery({ queryKey: [session?.userId, 'ambassador', 'attribution'], queryFn: async () => (await backend.select<Attribution & object>({ table: 'referral_attributions' }))[0] ?? null, enabled: !!session });
  const terms = termsQ.data ?? null;
  const mine = mineQ.data ?? null;
  const cur = terms?.reference.currency ?? 'EUR';
  const money = (c: number) => euros(c, cur, loc);
  const refresh = () => { void qc.invalidateQueries({ queryKey: [session?.userId, 'ambassador'] }); };

  return (
    <Screen title={tr('amb.title')} subtitle={tr('amb.sub')} back>
      {termsQ.isLoading ? <Loading label={tr('amb.loading')} /> : !terms ? <Banner tone="warning" icon="alert-circle" title={tr('amb.unavailable')} /> : (
        <View style={{ gap: spacing.md }} testID="amb-screen">
          {mine ? <Dashboard mine={mine} terms={terms} money={money} /> : (
            <>
              <Card>
                <Text testID="amb-pitch">{tr('amb.pitch', { rate: `${terms.base_rate} %`, months: terms.commission_months })}</Text>
                <Text variant="small" muted style={{ marginTop: spacing.xs }}>{tr('amb.rules', { threshold: money(terms.payout_threshold_cents) })}</Text>
              </Card>
              <Simulator terms={terms} money={money} />
              <ApplyForm terms={terms} email={session?.email ?? ''} onDone={refresh} />
            </>
          )}
          {mine ? null : <Claim attribution={attrQ.data ?? null} onDone={refresh} />}
        </View>
      )}
    </Screen>
  );
}

function Simulator({ terms, money }: { terms: AmbassadorTerms; money: (c: number) => string }) {
  const [n, setN] = useState(100);
  const r = simulate(terms, n, rateFor(terms, 'starter'));
  return (
    <Card testID="amb-sim">
      <SectionTitle title={tr('amb.sim.title')} />
      <Row wrap>{SIM_STEPS.map((v) => <Chip key={v} label={tr('amb.sim.subs', { n: v })} selected={n === v} onPress={() => setN(v)} testID={`amb-sim-${v}`} />)}</Row>
      <Row style={{ marginTop: spacing.sm }}>
        <View style={{ flex: 1 }}><Text variant="caption" muted>{tr('amb.sim.month')}</Text><Text variant="title" testID="amb-sim-month">{money(r.monthlyCents)}</Text></View>
        <View style={{ flex: 1 }}><Text variant="caption" muted>{tr('amb.sim.total', { months: r.months })}</Text><Text variant="title" testID="amb-sim-total">{money(r.totalCents)}</Text></View>
      </Row>
      <Text variant="small" muted>{tr('amb.sim.per', { amount: money(r.perSubscriberCents) })}</Text>
      <Text variant="caption" muted>{tr('amb.sim.disclaimer')}</Text>
    </Card>
  );
}

function ApplyForm({ terms, email: initialEmail, onDone }: { terms: AmbassadorTerms; email: string; onDone: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('particulier');
  const [siret, setSiret] = useState('');
  const [social, setSocial] = useState('');
  const [audience, setAudience] = useState('');
  const [accept, setAccept] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  void terms;
  const submit = async () => {
    setMsg(null);
    if (!accept) return setMsg({ tone: 'error', text: tr('amb.err.terms') });
    if (!normalizeCode(code)) return setMsg({ tone: 'error', text: tr('amb.err.code_format') });
    setBusy(true);
    try {
      const r = await backend.rpc<{ ok: boolean; reason?: string; demo?: boolean }>('ambassador_apply', {
        p_name: name, p_email: email, p_code: code, p_legal_status: status, p_siret: status === 'particulier' ? null : siret.replace(/\s/g, ''),
        p_social: social.trim() ? [social.trim()] : [], p_audience: audience, p_accept: accept,
      });
      if (!r.ok) setMsg({ tone: 'error', text: tr(`amb.err.${r.reason ?? 'invalid'}` as TKey) });
      else { setMsg({ tone: 'success', text: tr(r.demo ? 'amb.demoApproved' : 'amb.sent') }); onDone(); }
    } catch { setMsg({ tone: 'error', text: tr('amb.err.invalid') }); }
    setBusy(false);
  };
  return (
    <Card testID="amb-form">
      <SectionTitle title={tr('amb.form.title')} />
      <View style={{ gap: spacing.sm }}>
        <Field label={tr('amb.form.name')} value={name} onChangeText={setName} maxLength={80} testID="amb-name" />
        <Field label={tr('amb.form.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" testID="amb-email" />
        <Field label={tr('amb.form.code')} value={code} onChangeText={(v) => setCode(v.toUpperCase())} placeholder={tr('amb.form.codePh')} autoCapitalize="characters" maxLength={16} testID="amb-code" />
        <Text variant="label">{tr('amb.form.status')}</Text>
        <Row wrap>{STATUSES.map((s) => <Chip key={s} label={tr(`amb.form.st.${s}` as TKey)} selected={status === s} onPress={() => setStatus(s)} testID={`amb-status-${s}`} />)}</Row>
        {status === 'particulier' ? null : <Field label={tr('amb.form.siret')} value={siret} onChangeText={setSiret} keyboardType="number-pad" maxLength={17} testID="amb-siret" />}
        <Field label={tr('amb.form.social')} optional value={social} onChangeText={setSocial} autoCapitalize="none" maxLength={200} testID="amb-social" />
        <Field label={tr('amb.form.audience')} optional value={audience} onChangeText={setAudience} multiline maxLength={500} testID="amb-audience" />
        <Row style={{ alignItems: 'center' }}>
          <Text variant="small" style={{ flex: 1 }}>{tr('amb.form.accept')}</Text>
          <Toggle label={tr('amb.form.accept')} value={accept} onChange={setAccept} />
        </Row>
        {msg ? <Banner tone={msg.tone === 'error' ? 'danger' : 'success'} title={msg.text} /> : null}
        <Button label={tr('amb.form.submit')} loading={busy} onPress={() => void submit()} full testID="amb-submit" />
      </View>
    </Card>
  );
}

function Dashboard({ mine, terms, money }: { mine: NonNullable<Mine>; terms: AmbassadorTerms; money: (c: number) => string }) {
  const link = useMemo(() => shareLink(mine.code), [mine.code]);
  const tier = terms.tiers.find((t) => t.key === mine.tier);
  const next = nextTier(terms, mine.converted);
  const stat = (label: string, value: string, id: string) => (
    <View style={{ flexBasis: '47%', flexGrow: 1, gap: 2 }} testID={`amb-stat-${id}`}><Text variant="caption" muted>{label}</Text><Text weight="bold">{value}</Text></View>
  );
  return (
    <View style={{ gap: spacing.md }} testID="amb-dashboard">
      <Banner tone={mine.status === 'approved' ? 'success' : mine.status === 'pending' ? 'info' : 'warning'} title={tr(`amb.st.${mine.status}` as TKey)} />
      {mine.demo_auto_approved ? <Text variant="caption" muted>{tr('amb.demoApproved')}</Text> : null}
      <Card>
        <Text variant="caption" muted>{tr('amb.dash.code')}</Text>
        <Text variant="title" testID="amb-my-code" selectable>{mine.code}</Text>
        {link ? <><Text variant="caption" muted style={{ marginTop: spacing.xs }}>{tr('amb.dash.link')}</Text><Text selectable testID="amb-my-link">{link}</Text></> : null}
        <Text variant="small" muted style={{ marginTop: spacing.xs }}>{tr('amb.dash.rate', { tier: tier?.label ?? mine.tier, rate: `${mine.rate} %` })}</Text>
        {mine.status === 'approved' ? (
          <Button label={tr('amb.dash.share')} icon="share-2" style={{ marginTop: spacing.sm }} testID="amb-share"
            onPress={() => void Share.share({ message: tr('amb.dash.shareMsg', { code: mine.code, link: link ?? '' }) })} />
        ) : null}
      </Card>
      <Card>
        <Row wrap style={{ rowGap: spacing.sm }}>
          {stat(tr('amb.dash.referred'), String(mine.referred), 'referred')}
          {stat(tr('amb.dash.converted'), String(mine.converted), 'converted')}
          {stat(tr('amb.dash.month'), money(mine.month_cents), 'month')}
          {stat(tr('amb.dash.pending'), money(mine.pending_cents), 'pending')}
          {stat(tr('amb.dash.payable'), money(mine.payable_cents), 'payable')}
          {stat(tr('amb.dash.paid'), money(mine.paid_cents), 'paid')}
        </Row>
        <Text variant="small" muted style={{ marginTop: spacing.sm }}>
          {mine.next_available_at ? tr('amb.dash.payout', { threshold: money(mine.payout_threshold_cents), date: formatDate(mine.next_available_at) }) : tr('amb.dash.payoutNone', { threshold: money(mine.payout_threshold_cents) })}
        </Text>
        {next ? <Text variant="small" muted>{tr('amb.dash.next', { tier: next.label, n: next.min_conversions })}</Text> : null}
      </Card>
      <Text variant="caption" muted>{tr('amb.dash.mention')}</Text>
      <Simulator terms={terms} money={money} />
    </View>
  );
}

function Claim({ attribution, onDone }: { attribution: Attribution; onDone: () => void }) {
  const fromLink = useMemo(linkCode, []);
  const [code, setCode] = useState(fromLink ?? '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  useEffect(() => { if (fromLink && !code) setCode(fromLink); }, [fromLink, code]);
  if (attribution) return <Card testID="amb-claimed"><Text>{tr('amb.claim.done', { code: attribution.code })}</Text></Card>;
  const submit = async () => {
    setMsg(null); setBusy(true);
    try {
      const r = await backend.rpc<{ ok: boolean; reason?: string; name?: string }>('ambassador_claim', { p_code: code, p_source: fromLink && normalizeCode(code) === fromLink ? 'link' : 'code' });
      if (r.ok) { setMsg({ tone: 'success', text: tr('amb.claim.ok', { name: r.name ?? '' }) }); onDone(); }
      else setMsg({ tone: 'error', text: tr(`amb.claim.err.${r.reason ?? 'unknown'}` as TKey) });
    } catch { setMsg({ tone: 'error', text: tr('amb.claim.err.unknown') }); }
    setBusy(false);
  };
  return (
    <Card testID="amb-claim">
      <SectionTitle title={tr('amb.claim.title')} />
      <Text variant="small" muted>{tr('amb.claim.body')}</Text>
      {fromLink ? <Text variant="small" style={{ marginTop: spacing.xs }}>{tr('amb.claim.fromLink', { code: fromLink })}</Text> : null}
      <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
        <Field label={tr('amb.claim.field')} value={code} onChangeText={(v) => setCode(v.toUpperCase())} autoCapitalize="characters" maxLength={16} testID="amb-claim-code" />
        {msg ? <Banner tone={msg.tone === 'error' ? 'danger' : 'success'} title={msg.text} /> : null}
        <Button label={tr('amb.claim.submit')} variant="secondary" loading={busy} disabled={!normalizeCode(code)} onPress={() => void submit()} full testID="amb-claim-submit" />
      </View>
    </Card>
  );
}
