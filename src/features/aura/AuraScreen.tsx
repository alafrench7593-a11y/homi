/**
 * HOMI Aura — écran de conversation UNIQUE (onglet « Questions » `/ask` et route `/assistant?theme=<id>`).
 *
 *  - Sécurité d'abord, SUR LE TÉLÉPHONE : un message de détresse affiche aussitôt l'orientation humaine (15, 112,
 *    3114…), sans réseau, sans crédit, dans tous les modes ; le serveur refait la même vérification.
 *  - Modes : en ligne (IA serveur, coût affiché avant chaque question), démonstration (réponses simulées, signalées),
 *    LOCAL (repli honnête : recherche par mots dans les outils et les articles, sans faire semblant de comprendre).
 *  - Cartes d'action : propositions confirmées par la personne (ActionCards).
 *  - Thèmes (liste des 200) : contexte, suggestions, outils mis en avant ; 174 = traducteur émotionnel ; 200 = visite
 *    guidée + recherche d'outils.
 *  - Abonnement : HOMI Aura en ligne demande un abonnement ACTIF (l'essai de 3 jours ouvre les outils, pas l'IA) ;
 *    sinon l'écran le dit et propose le mode local.
 *  - Accessibilité : rôles et noms, réponses annoncées (zone vivante), Réduire les animations (aucun mouvement propre
 *    à l'écran ; l'indicateur « Aura prépare une réponse » est immobile), saisie au-dessus du clavier (pied d'écran
 *    `Screen`, portée clavier existante).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Keyboard, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen } from '@/components/Screen';
import { TAB_SCREEN_INSET } from '@/components/Dock';
import { Markdown } from '@/components/Markdown';
import { UrgentCard } from '@/components/Assistant';
import { Sheet, useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { openTool } from '@/components/ToolCard';
import { Banner, Button, Chip, haptic, Icon, IconButton, ListRow, Row, Text, Toggle } from '@/components/ui';
import { SkeletonBone, SkeletonPulse } from '@/motion';
import { useMotion } from '@/motion/useMotion';
import { aiAssistantOnline } from '@/config/features';
import { OutOfCreditsSheet } from '@/features/credits/OutOfCreditsSheet';
import { useAllToolEntries } from '@/features/hubs/ToolSearch';
import { startTour } from '@/features/tour/store';
import { hasRealBackend, isDemo } from '@/lib/backend';
import { useActiveSubject, useChildren, useConsents, useFullArticles, useSetConsent } from '@/lib/data/hooks';
import { useCreditConfig, useCreditStatus, useRefreshCredits } from '@/lib/data/hooks-credits';
import { useEntitlement } from '@/lib/data/hooks-premium';
import { friendlyError } from '@/lib/data/hooks-settings';
import { costOf, totalRemaining } from '@/lib/credits/model';
import { childAge } from '@/lib/domain/child';
import { useEmergencyRegion } from '@/lib/domain/emergencyNumbers';
import { searchCatalog } from '@/lib/domain/toolSearch';
import { toolWordsKey } from '@/lib/journeys/tools';
import { answer as localAnswer, buildIndex, type KbIndex } from '@/lib/localAI/engine';
import { useOfflineStore } from '@/lib/offline';
import { SITUATIONS, type Situation } from '@/lib/domain/understand';
import { uuid } from '@/lib/uuid';
import { getLocale, tMaybe, t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { assessSafety, urgentContacts, type UrgentContact } from '../../../supabase/functions/_shared/safety';
import { MAX_QUESTION_LENGTH, todayIso } from '../../../supabase/functions/_shared/assistant-format';
import { sanitizeActions } from '../../../supabase/functions/_shared/aura-tools';
import { ActionCards } from './ActionCards';
import { AuraBot } from './AuraBot';
import { useAuraBot, type AuraBotState } from './useAuraBot';
import { EmotionTranslator } from './EmotionTranslator';
import { JournalPicker } from './JournalPicker';
import { askAura, classifyAuraError, type AuraErrorKind, type AuraServerReply } from './api';
import {
  auraMode, catalogForServer, creditActionFor, defaultThemeFor, featuredFor, localReply, themeName, themeSuggestions, toAuraTheme,
  type AuraAction, type AuraMode, type AuraTheme, type LocalReply,
} from './model';

type Reply =
  | { kind: 'ai'; answer: string; actions: AuraAction[]; footer: string; charged: boolean; cost: number; replaced: boolean; demo: boolean }
  | LocalReply
  | { kind: 'safety'; level: 'medical_urgent' | 'crisis'; contacts: UrgentContact[]; message: string }
  | { kind: 'error'; error: AuraErrorKind; question: string; requestId: string; journal?: unknown }
  | { kind: 'pending' };
interface Msg { id: string; role: 'user' | 'aura'; text?: string; reply?: Reply }

let INDEX: { n: number; index: KbIndex } | null = null;
/** Index local des articles (repli sans IA), construit une fois, juste après l'affichage. */
function useArticleIndex(enabled: boolean): KbIndex | null {
  const q = useFullArticles(enabled);
  const [index, setIndex] = useState<KbIndex | null>(() => (q.data && INDEX?.n === q.data.length ? INDEX.index : null));
  useEffect(() => {
    const data = q.data;
    if (!data) return;
    if (INDEX?.n === data.length) { setIndex(INDEX.index); return; }
    const id = setTimeout(() => {
      const built = buildIndex(data.map((a) => ({ slug: a.slug, title: a.title, summary: a.summary, body_md: a.body_md, tags: a.tags, sources: a.sources, min_age_months: a.min_age_months, max_age_months: a.max_age_months, journeys: a.journeys })));
      INDEX = { n: data.length, index: built };
      setIndex(built);
    }, 30);
    return () => clearTimeout(id);
  }, [q.data]);
  return index;
}

export function AuraScreen({ inTab = false }: { inTab?: boolean }) {
  const t = useTheme();
  const toast = useToast();
  const motion = useMotion();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ theme?: string; q?: string; mode?: string; draft?: string; situation?: string }>();
  const theme: AuraTheme | null = toAuraTheme(params.theme);
  const { subject } = useActiveSubject();
  const { data: children } = useChildren();
  const childMonths = subject?.type === 'child' ? (() => { const c = (children ?? []).find((x) => x.id === subject.id); return c ? childAge(c.birth_date).months : null; })() : null;
  const suggestTheme = theme ?? defaultThemeFor(subject, { childMonths });
  const region = useEmergencyRegion();
  const online = useOfflineStore((s) => s.online);

  const [forceLocal, setForceLocal] = useState(params.mode === 'local');
  const [serverOff, setServerOff] = useState(false);
  const mode: AuraMode = auraMode({ aiOnline: aiAssistantOnline(), demoBackend: isDemo && !hasRealBackend, forceLocal, serverOff });
  const remote = mode !== 'local';

  const { catalog, entries } = useAllToolEntries();
  const allTools = useMemo(() => { const seen = new Set<string>(); return entries.map((e) => e.tool).filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true))); }, [entries]);
  const catalogIds = useMemo(() => new Set(catalog.map((x) => x.id)), [catalog]);
  const featured = useMemo(() => featuredFor(theme, catalog), [theme, catalog]);
  const index = useArticleIndex(true);

  const credits = useCreditStatus();
  const creditConfig = useCreditConfig();
  const refreshCredits = useRefreshCredits();
  const askCost = costOf('assistant_question', creditConfig.data);
  const journalCost = costOf(creditActionFor('chat', { journal: true }), creditConfig.data);
  const { latest } = useConsents();
  const setConsent = useSetConsent();
  const consented = latest.get('ai_assistant') === true;
  // HOMI Aura en ligne demande un abonnement ACTIF : l'essai de 3 jours ouvre les outils, pas l'IA (aucun crédit d'essai)
  const ent = useEntitlement();
  const inTrial = ent.state === 'trial';
  const noSub = credits.data?.subscribed === false;
  const needsSub = remote && (inTrial || noSub);

  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [outOfCredits, setOutOfCredits] = useState(false);
  const [journal, setJournal] = useState<'mood' | 'diary' | null>(null);
  const [settings, setSettings] = useState(false);
  const [focused, setFocused] = useState(false);
  const list = useRef<FlatList<Msg>>(null);
  const scrollEnd = () => setTimeout(() => list.current?.scrollToEnd({ animated: !motion.off }), 80);


  const recentTurns = () => msgs.filter((m) => (m.role === 'user' && m.text) || (m.reply?.kind === 'ai' && !m.reply.replaced)).slice(-12)
    .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.role === 'user' ? m.text! : (m.reply as { answer: string }).answer }));

  function push(...m: Msg[]) { setMsgs((all) => [...all, ...m]); scrollEnd(); }
  function replace(id: string, reply: Reply) { setMsgs((all) => all.map((m) => (m.id === id ? { ...m, reply } : m))); scrollEnd(); }

  /** Réponse locale honnête : outils trouvés par mots (profil affiché, puis tous) et article le plus proche. */
  function local(question: string): LocalReply {
    const s = searchCatalog(catalog, question);
    const res = s.understood ? s : searchCatalog(allTools, question);
    return localReply(res, index ? localAnswer(index, question, { asked: question, lang: getLocale(), region }) : null);
  }

  async function send(text?: string, opts: { requestId?: string; journal?: unknown; retryOf?: string } = {}) {
    const question = (text ?? input).trim().slice(0, MAX_QUESTION_LENGTH);
    if (question.length < 2 || sending) return;
    Keyboard.dismiss();
    if (!opts.retryOf) { setInput(''); }
    haptic('light');
    const now = Date.now();
    const userMsg: Msg = { id: `u${now}`, role: 'user', text: question };
    const auraId = opts.retryOf ?? `a${now}`;
    // 1) Sécurité, sur le téléphone, avant tout (gratuit, sans réseau, dans tous les modes)
    const safety = assessSafety(question);
    if (safety.level !== 'none') {
      const where = { lang: getLocale(), region };
      const reply: Reply = { kind: 'safety', level: safety.level, contacts: urgentContacts(safety.level, where as never), message: '' };
      if (opts.retryOf) replace(auraId, reply); else push(userMsg, { id: auraId, role: 'aura', reply });
      haptic('warning');
      return;
    }
    // 2) Mode local : recherche honnête
    if (!remote) {
      const reply = local(question);
      if (opts.retryOf) replace(auraId, reply); else push(userMsg, { id: auraId, role: 'aura', reply });
      return;
    }
    if (needsSub) { toast(tr(inTrial ? 'aura.sub.trial' : 'aura.sub.none'), 'info'); return; }
    if (!consented) { toast(tr('aura.consent.needed'), 'info'); return; }
    const action = creditActionFor('chat', { journal: !!opts.journal });
    const cost = costOf(action, creditConfig.data);
    if (credits.data?.subscribed && totalRemaining(credits.data) < cost) { setOutOfCredits(true); return; }
    const requestId = opts.requestId ?? uuid();
    if (opts.retryOf) replace(auraId, { kind: 'pending' }); else push(userMsg, { id: auraId, role: 'aura', reply: { kind: 'pending' } });
    setSending(true);
    try {
      const r: AuraServerReply = await askAura({
        kind: 'chat', message: question, theme, lang: getLocale(), region, request_id: requestId, credit_action: action,
        recent_turns: recentTurns(), tools: catalogForServer(catalog, (id) => tMaybe(toolWordsKey(id)) || ''),
        ...(opts.journal ? { journal: opts.journal, data_consent: true } : {}),
      });
      if (r.safety && r.safety !== 'none') {
        replace(auraId, { kind: 'safety', level: r.safety, contacts: r.urgent_contacts ?? [], message: r.answer ?? '' });
      } else {
        replace(auraId, {
          kind: 'ai', answer: r.answer ?? '', actions: sanitizeActions(r.actions, catalogIds, todayIso()), footer: r.footer ?? tr('aura.aiNote'),
          charged: r.credits?.charged === true, cost: r.credits?.cost ?? cost, replaced: r.replaced === true || r.refused === true, demo: r.demo === true,
        });
      }
    } catch (e) {
      const kind = classifyAuraError(e, online);
      if (kind === 'credits') { setMsgs((all) => all.filter((m) => m.id !== auraId)); setOutOfCredits(true); }
      else if (kind === 'off') { setServerOff(true); replace(auraId, local(question)); toast(tr('aura.err.off'), 'info'); }
      else replace(auraId, { kind: 'error', error: kind, question, requestId, journal: opts.journal });
    } finally {
      setSending(false);
      void refreshCredits();
    }
  }

  async function reformulate(draft: string): Promise<string[] | null> {
    const safety = assessSafety(draft);
    if (safety.level !== 'none') { push({ id: `a${Date.now()}`, role: 'aura', reply: { kind: 'safety', level: safety.level, contacts: urgentContacts(safety.level, { lang: getLocale(), region } as never), message: '' } }); return null; }
    if (needsSub) { toast(tr(inTrial ? 'aura.sub.trial' : 'aura.sub.none'), 'info'); return null; }
    if (!consented) { toast(tr('aura.consent.needed'), 'info'); return null; }
    try {
      const r = await askAura({ kind: 'reformulate', draft, theme: 'emotion_translator', lang: getLocale(), region, request_id: uuid(), credit_action: creditActionFor('reformulate') });
      if (r.safety && r.safety !== 'none') { push({ id: `a${Date.now()}`, role: 'aura', reply: { kind: 'safety', level: r.safety, contacts: r.urgent_contacts ?? [], message: r.answer ?? '' } }); return null; }
      if (!r.options?.length) { toast(tr('aura.replaced'), 'info'); return null; }
      return r.options;
    } catch (e) {
      const kind = classifyAuraError(e, online);
      if (kind === 'credits') setOutOfCredits(true);
      else if (kind === 'off') { setServerOff(true); toast(tr('aura.err.off'), 'info'); }
      else toast(tr(`aura.err.${kind}` as never), 'error');
      return null;
    } finally { void refreshCredits(); }
  }

  // Question reçue en paramètre (« Demander à Aura » depuis un autre écran) : posée une fois, quand tout est prêt
  const asked = useRef(false);
  useEffect(() => {
    if (asked.current || typeof params.q !== 'string' || params.q.trim().length < 2) return;
    if (remote ? !consented : !index) return;
    asked.current = true;
    void send(params.q);
  }, [index, consented, remote]); // eslint-disable-line react-hooks/exhaustive-deps

  const modeLabel = tr(mode === 'online' ? 'aura.mode.online' : mode === 'demo' ? 'aura.mode.demo' : 'aura.mode.local');
  const costLine = !remote ? tr('aura.free')
    : `${tr('aura.cost', { count: askCost })}${credits.data?.subscribed ? ` · ${tr('cr.balance.total', { count: totalRemaining(credits.data) })}` : ''}`;
  const empty = msgs.length === 0;
  // Robot d'Aura : coucou à l'ouverture, écoute pendant la saisie, réflexion, sursaut à la réponse, inquiétude douce
  // sur une erreur ou une réponse de sécurité (aucune logique d'IA ni de crédits ici : il ne fait que refléter l'écran)
  const lastAura = useMemo(() => { for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i].role === 'aura') return msgs[i]; return null; }, [msgs]);
  const lastKind = lastAura?.reply?.kind;
  const botState = useAuraBot({
    thinking: sending || lastKind === 'pending',
    listening: focused && input.trim().length > 0,
    concern: lastKind === 'safety' || lastKind === 'error',
    answerKey: lastAura && (lastKind === 'ai' || lastKind === 'local') ? `${lastAura.id}:${lastKind}` : null,
  });
  const blockedByConsent = remote && (!consented || needsSub);

  const header = (
    <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
      {/* Accès d’abord (abonnement actif, accord) : visible sans défiler, même à 320 × 568 */}
      {needsSub ? (
        <View testID="aura-needs-sub" style={{ gap: spacing.sm, backgroundColor: t.colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, padding: spacing.md }}>
          <Text variant="small">{tr(inTrial ? 'aura.sub.trial' : 'aura.sub.none')}</Text>
          <Button label={tr('aura.consent.local')} icon="search" full onPress={() => setForceLocal(true)} testID="aura-sub-local" />
          <Button label={tr('aura.sub.see')} variant="ghost" full onPress={() => router.push('/settings/subscription')} testID="aura-sub-see" />
        </View>
      ) : null}

      {remote && !consented && !needsSub ? (
        <View testID="aura-consent" style={{ gap: spacing.sm, backgroundColor: t.colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, padding: spacing.md }}>
          <Text weight="bold" accessibilityRole="header">{tr('aura.consent.title')}</Text>
          <Text variant="small" muted>{tr('aura.consent.body')}</Text>
          <Button label={tr('aura.consent.accept')} icon="check" full loading={setConsent.isPending} testID="aura-consent-accept"
            onPress={() => setConsent.mutate({ purpose: 'ai_assistant', granted: true }, { onError: (e) => toast(friendlyError(e), 'error') })} />
          <Button label={tr('aura.consent.local')} variant="ghost" full onPress={() => setForceLocal(true)} testID="aura-consent-local" />
        </View>
      ) : null}

      <View style={empty ? { alignItems: 'center', gap: spacing.sm } : { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
        {/* le personnage d'Aura : en grand à l'ouverture (coucou), en petit et immobile une fois la conversation lancée */}
        <AuraBot size={empty ? 140 : 56} state={botState} still={!empty} decorative={false} testID="aura-avatar" />
        <View style={empty ? { alignSelf: 'stretch', gap: 6, alignItems: 'center' } : { flex: 1, gap: 6 }}>
          <View testID="aura-mode" accessibilityLabel={tr('aura.mode.a11y', { mode: modeLabel })}
            style={{ alignSelf: empty ? 'center' : 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, minHeight: 28, borderRadius: radius.pill, backgroundColor: remote ? t.colors.accentSoft : t.colors.surfaceAlt }}>
            <Icon name={mode === 'online' ? 'cloud' : mode === 'demo' ? 'play-circle' : 'smartphone'} size={14} color={t.colors.text} />
            <Text variant="caption" weight="bold">{modeLabel}</Text>
          </View>
          <View style={{ alignSelf: 'stretch', backgroundColor: t.colors.surface, borderRadius: radius.lg, borderTopLeftRadius: empty ? radius.lg : 6, borderWidth: 1, borderColor: t.colors.border, padding: spacing.md }}>
            <Text variant="small" testID="aura-hello">{tr(remote ? 'aura.hello' : 'aura.helloLocal')}</Text>
          </View>
        </View>
      </View>


      {theme ? <Text variant="label" accessibilityRole="header" testID="aura-theme">{tr(themeName(theme))}</Text> : null}

      {theme === 'emotion_translator' ? (
        <EmotionTranslator mode={mode} cost={costOf('assistant_question', creditConfig.data)} reformulate={reformulate}
          initialDraft={typeof params.draft === 'string' ? params.draft.slice(0, MAX_QUESTION_LENGTH) : ''}
          initialSituation={(SITUATIONS as readonly string[]).includes(params.situation ?? '') ? (params.situation as Situation) : null} />
      ) : null}

      {theme === 'discovery' ? (
        <View testID="aura-discovery" style={{ gap: spacing.xs }}>
          <Text variant="small" muted>{tr('aura.disc.body')}</Text>
          <Button label={tr('aura.disc.tour')} icon="compass" variant="secondary" full onPress={() => startTour()} testID="aura-tour" />
        </View>
      ) : null}

      {empty && theme !== 'emotion_translator' ? (
        <View style={{ gap: spacing.xs }}>
          <Text variant="caption" muted style={{ letterSpacing: 1, textTransform: 'uppercase' }}>{tr('aura.ideas')}</Text>
          {themeSuggestions(suggestTheme).map((k) => (
            <Tappable key={k} accessibilityRole="button" accessibilityLabel={tr('aura.ask', { q: tr(k) })} disabled={blockedByConsent || sending} onPress={() => void send(tr(k))} testID="aura-suggestion"
              style={({ pressed }) => ({ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: t.colors.border, backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface, opacity: blockedByConsent ? 0.5 : 1 })}>
              <Icon name="message-circle" size={16} color={t.colors.lavender} />
              <Text variant="small" style={{ flex: 1 }}>{tr(k)}</Text>
            </Tappable>
          ))}
        </View>
      ) : null}

      {featured.length ? (
        <View testID="aura-featured">
          <Text variant="caption" muted style={{ letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{tr('aura.featured')}</Text>
          {featured.map((tool) => <ListRow key={tool.id} icon={tool.icon} title={tool.label} subtitle={tool.sub} onPress={() => openTool(tool)} testID={`aura-featured-${tool.id}`} />)}
        </View>
      ) : null}
    </View>
  );

  return (
    <Screen
      back
      account={inTab}
      // Aura a sa propre signature (lentille à trois lumières) : pas de logo d'outil dans l'en-tête
      tool={false}
      title={tr('aura.name')}
      subtitle={theme ? tr(themeName(theme)) : tr('aura.sub')}
      scroll={false}
      padded={false}
      bottomInset={inTab ? TAB_SCREEN_INSET : 0}
      right={<IconButton icon="sliders" label={tr('aura.settings.a11y')} onPress={() => setSettings(true)} testID="aura-settings" />}
      footer={(
        <View style={{ gap: 4 }} testID="aura-composer">
          <Text variant="caption" muted center testID="aura-cost">{costLine}</Text>
          {!online && remote ? <Text variant="caption" color={t.colors.warning} center testID="aura-offline">{tr('aura.err.network')}</Text> : null}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, backgroundColor: t.colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, padding: 6 }}>
            <TextInput
              value={input} onChangeText={setInput} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={tr('aura.ph')} placeholderTextColor={t.colors.textMuted} accessibilityLabel={tr('aura.yourMsg')}
              multiline maxLength={MAX_QUESTION_LENGTH} textAlignVertical="top" editable={!blockedByConsent} testID="aura-input"
              style={{ flex: 1, minHeight: 44, maxHeight: 140, color: t.colors.text, fontFamily: fonts.body, fontSize: 16, paddingHorizontal: spacing.sm, paddingTop: 10 }}
            />
            <Tappable accessibilityRole="button" accessibilityLabel={remote ? tr('aura.sendCost', { count: askCost }) : tr('aura.send')} accessibilityState={{ disabled: sending || input.trim().length < 2 || blockedByConsent, busy: sending }}
              disabled={sending || input.trim().length < 2 || blockedByConsent} onPress={() => void send()} testID="aura-send"
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.tokens.action.fill, alignItems: 'center', justifyContent: 'center', opacity: sending || input.trim().length < 2 || blockedByConsent ? 0.4 : 1 }}>
              <Icon name="arrow-up" color={t.tokens.action.text} />
            </Tappable>
          </View>
          <Tappable accessibilityRole="link" accessibilityLabel={tr('u8.chat.emergA11y')} onPress={() => router.push('/emergency')} style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }}>
            <Text variant="caption" color={t.colors.danger} center>{tr('u8.chat.emerg')}</Text>
          </Tappable>
        </View>
      )}
    >
      <View style={{ flex: 1 }} testID="aura-screen">
        <FlatList
          ref={list}
          data={msgs}
          keyExtractor={(m) => m.id}
          extraData={`${botState}:${lastAura?.id ?? ''}`}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.lg, gap: spacing.md }}
          renderItem={({ item: m }) => (m.role === 'user' ? (
            <View testID="aura-msg-user" style={{ alignSelf: 'flex-end', maxWidth: '86%', backgroundColor: t.tokens.action.fill, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.lg, borderBottomRightRadius: 6 }}>
              <Text color={t.tokens.action.text}>{m.text}</Text>
            </View>
          ) : (
            <AuraReply reply={m.reply!} catalog={catalog} onChooseJournal={setJournal}
              bot={m.id === lastAura?.id ? { state: botState, still: false } : { state: restingBot(m.reply!), still: true }}
              onRetry={(r) => void send(r.question, { requestId: r.requestId, journal: r.journal, retryOf: m.id })}
              onLocal={(q) => replace(m.id, local(q))} />
          ))}
        />
      </View>

      <OutOfCreditsSheet visible={outOfCredits} onClose={() => setOutOfCredits(false)} cost={askCost} />
      <JournalPicker journal={journal} cost={journalCost} onClose={() => setJournal(null)}
        onSend={(p) => void send(tr('aura.journal.ask'), { journal: p })} />
      <Sheet visible={settings} onClose={() => setSettings(false)} title={tr('aura.settings')}>
        <View style={{ gap: spacing.md }} testID="aura-settings-sheet">
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text weight="medium">{tr('aura.settings.local')}</Text>
              <Text variant="caption" muted>{tr('aura.settings.localD')}</Text>
            </View>
            <Toggle label={tr('aura.settings.local')} value={forceLocal} onChange={setForceLocal} />
          </Row>
          {aiAssistantOnline() ? <Button label={tr('aura.history')} icon="clock" variant="secondary" full onPress={() => { setSettings(false); router.push('/assistant/history'); }} /> : null}
          <Button label={tr('aura.privacy')} icon="lock" variant="ghost" full onPress={() => { setSettings(false); router.push('/settings/privacy'); }} />
        </View>
      </Sheet>
    </Screen>
  );
}

/** Expression du petit robot à côté d'une ancienne réponse (pose statique). */
const restingBot = (r: Reply): AuraBotState => (r.kind === 'pending' ? 'thinking' : r.kind === 'safety' || r.kind === 'error' ? 'concern' : 'idle');
const BOT_SIZE = 32;

function AuraReply({ reply, catalog, onChooseJournal, onRetry, onLocal, bot }: {
  reply: Reply; catalog: ReturnType<typeof useAllToolEntries>['catalog'];
  /** robot à côté de la réponse : vivant pour la dernière, immobile pour les précédentes */
  bot: { state: AuraBotState; still: boolean };
  onChooseJournal: (j: 'mood' | 'diary') => void;
  onRetry: (r: Extract<Reply, { kind: 'error' }>) => void;
  onLocal: (q: string) => void;
}) {
  const t = useTheme();
  const bubble = { backgroundColor: t.colors.surface, padding: spacing.md, borderRadius: radius.lg, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: t.colors.border, gap: spacing.sm } as const;
  if (reply.kind === 'pending') {
    return (
      // Aura prépare sa réponse : le robot réfléchit (trois points dans sa visière, cœur qui tourne) ; le texte le dit
      <View testID="aura-pending" accessibilityLabel={tr('aura.thinking')} accessibilityRole="progressbar" accessibilityState={{ busy: true }}
        style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs }}>
        <AuraBot size={44} state="thinking" still={bot.still} testID="aura-pending-bot" />
        <View style={[bubble, { maxWidth: '70%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm }]}>
          <Text variant="small" muted>{tr('aura.thinking')}</Text>
        </View>
      </View>
    );
  }
  // sécurité : le robot reste sobre (regard doux et inquiet, aucun sursaut) ; la carte d'orientation passe en premier
  if (reply.kind === 'safety') {
    return (
      <View testID="aura-safety" style={{ gap: spacing.xs }}>
        <AuraBot size={BOT_SIZE} state={bot.state === 'listening' || bot.state === 'thinking' ? bot.state : 'concern'} still={bot.still} testID="aura-safety-bot" />
        <UrgentCard level={reply.level} contacts={reply.contacts} message={reply.message || undefined} />
      </View>
    );
  }
  if (reply.kind === 'error') {
    return (
      <View style={{ gap: spacing.xs }} testID="aura-error" accessibilityLiveRegion="polite">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <AuraBot size={BOT_SIZE} state={bot.state === 'listening' || bot.state === 'thinking' ? bot.state : 'concern'} still={bot.still} testID="aura-error-bot" />
          <View style={{ flex: 1 }}><Banner tone={reply.error === 'network' ? 'warning' : 'info'}>{tr(`aura.err.${reply.error}` as never)}</Banner></View>
        </View>
        <Row wrap>
          {reply.error === 'network' || reply.error === 'unavailable' ? <Button label={tr('aura.retry')} icon="refresh-cw" size="sm" variant="secondary" onPress={() => onRetry(reply)} testID="aura-retry" /> : null}
          <Button label={tr('aura.tryLocal')} icon="search" size="sm" variant="ghost" onPress={() => onLocal(reply.question)} testID="aura-try-local" />
        </Row>
      </View>
    );
  }
  if (reply.kind === 'local') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs }}>
      <AuraBot size={BOT_SIZE} state={bot.state} still={bot.still} testID="aura-reply-bot" />
      <View style={[bubble, { flex: 1 }]} testID="aura-local-reply" accessibilityLiveRegion="polite">
        <Text variant="small">{tr('aura.local.intro')}</Text>
        {reply.tools.length ? <Text variant="label">{tr('aura.local.tools')}</Text> : null}
        {reply.tools.map((tool) => (
          <Button key={tool.id} label={tr('aura.act.open', { name: tool.label })} icon="arrow-right" variant="secondary" full onPress={() => openTool(tool)} testID={`aura-local-open-${tool.id}`} />
        ))}
        {reply.article ? (
          <View style={{ gap: 4 }} testID="aura-local-article">
            <Text variant="label">{tr('aura.local.article')}</Text>
            <Text variant="small" weight="bold">{reply.article.title}</Text>
            <Text variant="small" muted>{reply.article.excerpt}</Text>
            <Button label={tr('aura.local.read')} icon="book-open" size="sm" variant="ghost" style={{ alignSelf: 'flex-start' }} onPress={() => router.push(`/article/${reply.article!.slug}`)} />
          </View>
        ) : null}
        {!reply.found ? (
          <>
            <Text variant="small" muted testID="aura-local-none">{tr('aura.local.none')}</Text>
            <Button label={tr('aura.local.allTools')} icon="grid" size="sm" variant="ghost" style={{ alignSelf: 'flex-start' }} onPress={() => router.push('/tools')} />
          </>
        ) : null}
        <Text variant="caption" muted>{tr('aura.footer.local')}</Text>
      </View>
      </View>
    );
  }
  return (
    <View style={{ gap: spacing.sm }} testID="aura-reply" accessibilityLiveRegion="polite">
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs }}>
      <AuraBot size={BOT_SIZE} state={bot.state} still={bot.still} testID="aura-reply-bot" />
      <View style={[bubble, { flex: 1 }]}>
        {reply.demo ? <Text variant="caption" color={t.colors.lavender}>{tr('aura.mode.demo')}</Text> : null}
        {reply.answer ? <Markdown source={reply.answer} /> : null}
        {reply.replaced ? <Text variant="caption" muted>{tr('aura.replaced')}</Text> : null}
      </View>
      </View>
      <ActionCards actions={reply.actions} catalog={catalog} onChooseJournal={onChooseJournal} />
      <Text variant="caption" muted testID="aura-charged">{`${reply.footer} ${reply.charged ? tr('aura.charged', { count: reply.cost }) : tr('aura.notCharged')}`}</Text>
    </View>
  );
}
