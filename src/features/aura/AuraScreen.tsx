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
import { NO_HYPHENS } from '@/features/firstWin/kit';
import { DISMISS_ON_DRAG } from '@/components/keyboard';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { whoopEdge } from '@/components/stage/WhoopSheen';
import { glassEdge } from '@/components/glass/GlassRim';
import { VirtualList } from '@/components/States';
import { AppState, FlatList, Keyboard, TextInput, useWindowDimensions, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
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
import { IntentCard } from './IntentCard';
import { isGuideQuestion, matchIntent, withNamedChild, type AuraIntent } from '@/lib/aura/intents';
import { AuraBot } from './AuraBot';
import { useAuraBot, type AuraBotState } from './useAuraBot';
import { EmotionTranslator } from './EmotionTranslator';
import { JournalPicker } from './JournalPicker';
import { askAura, auraErrorAction, classifyAuraError, type AuraErrorKind, type AuraServerReply } from './api';
import { AuraThinkingDots } from './AuraMark';
import { auraToolContext } from './intro';
import { toTranslatorGoal } from './translator';
import { canSpeak, dictationMode, nextDictationPhase, speak, startBrowserDictation, stopSpeaking, voiceStatus, type DictationHandle, type DictationPhase } from './voice';
import { useAuth } from '@/lib/auth';
import { useUiStore } from '@/lib/store';
import {
  auraMode, catalogForServer, creditActionFor, defaultThemeFor, featuredFor, localReply, searchForAura, themeName, themeSuggestions, toAuraTheme,
  type AuraAction, type AuraMode, type AuraTheme, type LocalReply,
} from './model';
import { MotionItem, MotionList } from '@/motion/ListMotion';

type Reply =
  | { kind: 'ai'; answer: string; actions: AuraAction[]; footer: string; charged: boolean; cost: number; replaced: boolean; demo: boolean }
  | LocalReply
  | { kind: 'safety'; level: 'medical_urgent' | 'crisis'; contacts: UrgentContact[]; message: string }
  | { kind: 'error'; error: AuraErrorKind; question: string; requestId: string; journal?: unknown }
  | { kind: 'pending' }
  /** Intention reconnue sur le téléphone (sans IA ni crédit) : carte d'action recalculée à l'affichage et à l'appui */
  | { kind: 'intent'; intent: AuraIntent; /** question d'origine : bouton « Demander quand même à Aura » (payant) */ ask?: string };
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
  const { height: winH } = useWindowDimensions();
  const params = useLocalSearchParams<{ theme?: string; q?: string; mode?: string; draft?: string; situation?: string; tool?: string; voice?: string; focus?: string; goal?: string }>();
  // Entrée contextuelle depuis un outil : identifiant d'outil RÉEL du catalogue, sinon aucun contexte (jamais de lien inventé)
  const toolCtx = auraToolContext(typeof params.tool === 'string' ? params.tool : null);
  const toolName = toolCtx ? tr(toolCtx.labelKey) : '';
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
  // Catalogue envoyé à Aura : les outils du profil affiché PUIS ceux des autres profils du foyer auxquels la personne a accès
  // (« Mon bébé prend le sein » depuis le profil Grossesse trouve l’Allaitement du bébé) ; jamais d’outil hors de ces listes
  const catalogIds = useMemo(() => new Set(allTools.map((x) => x.id)), [allTools]);
  const featured = useMemo(() => featuredFor(theme, catalog), [theme, catalog]);
  // l'outil du contexte n'est proposé que s'il est réellement accessible (profil affiché ou autre profil du foyer)
  const ctxTool = useMemo(() => (toolCtx ? allTools.find((x) => x.id === toolCtx.id) ?? null : null), [toolCtx, allTools]);
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
  const inputRef = useRef<TextInput>(null);
  // Voix (téléphone / navigateur uniquement) : lecture sur demande, dictée sur appui ; jamais d'écoute permanente
  const dictation = dictationMode();
  const ttsAvailable = canSpeak();
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [phase, setPhase] = useState<DictationPhase>('idle');
  const listening = phase === 'listening' || phase === 'processing';
  const setListening = (on: boolean) => setPhase((p) => (on ? 'listening' : p === 'listening' || p === 'processing' ? 'idle' : p));
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const dictated = useRef('');
  const [consentSheet, setConsentSheet] = useState<{ retry?: () => void } | null>(null);
  const dictationRef = useRef<DictationHandle | null>(null);
  const beforeDictation = useRef('');
  const stopVoice = () => {
    stopSpeaking();
    setSpeakingId(null);
    dictationRef.current?.abort();
    dictationRef.current = null;
    setListening(false);
  };
  // Quitter l'écran, passer en arrière-plan (appel, autre app) : lecture et dictée s'arrêtent tout de suite
  useFocusEffect(React.useCallback(() => () => stopVoice(), [])); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => { if (st !== 'active') stopVoice(); });
    return () => { sub.remove(); stopVoice(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  function toggleSpeak(id: string, text: string) {
    if (speakingId === id) { stopSpeaking(); setSpeakingId(null); return; }
    const ok = speak(text, { onEnd: () => setSpeakingId((cur) => (cur === id ? null : cur)) });
    setSpeakingId(ok ? id : null);
    if (!ok) setVoiceNote(tr('ta.voice.ttsOff'));
  }
  function onMic() {
    // « Arrêter » : la transcription se termine (phase « traitement ») jusqu'à la fin annoncée par le navigateur
    if (listening) { setPhase((p) => nextDictationPhase(p, 'stop')); dictationRef.current?.stop(); return; }
    stopSpeaking(); setSpeakingId(null);
    setVoiceNote(null);
    if (dictation === 'browser') {
      beforeDictation.current = input;
      dictated.current = '';
      const h = startBrowserDictation({
        onText: (text) => { dictated.current = text; setInput(text); },
        onError: (e) => { setPhase((p) => nextDictationPhase(p, 'error')); setVoiceNote(tr(e === 'denied' ? 'ta.voice.denied' : e === 'no-speech' ? 'ta.voice.noSpeech' : 'sa.voice.failed')); },
        onEnd: () => {
          dictationRef.current = null;
          setPhase((p) => {
            const n = nextDictationPhase(p, 'end', dictated.current.trim().length > 0);
            if (n === 'done') setVoiceNote(tr('sa.voice.done'));
            return n;
          });
        },
      });
      if (h) { dictationRef.current = h; setPhase('listening'); return; }
      setPhase('error');
      setVoiceNote(tr('sa.voice.failed'));
      return;
    }
    // Téléphone : la dictée du CLAVIER remplit le champ (autorisation demandée par le système à sa première utilisation)
    inputRef.current?.focus();
    setVoiceNote(tr('ta.voice.keyboard'));
  }
  function cancelDictation() {
    dictationRef.current?.abort();
    dictationRef.current = null;
    setPhase((p) => nextDictationPhase(p, 'cancel'));
    setInput(beforeDictation.current);
    setVoiceNote(tr('sa.voice.canceled'));
  }
  // La présentation d'Aura est vue dès qu'on ouvre Aura ; « Écrire » / « Parler » depuis la présentation : champ prêt
  const { session } = useAuth();
  const markIntroSeen = useUiStore((s) => s.markAuraIntroSeen);
  const introRequested = useUiStore((s) => s.auraIntroRequested);
  useEffect(() => { if (session?.userId && !introRequested) markIntroSeen(session.userId); }, [session?.userId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (params.voice === '1') { const id = setTimeout(onMic, 350); return () => clearTimeout(id); }
    if (params.focus === '1') { const id = setTimeout(() => inputRef.current?.focus(), 350); return () => clearTimeout(id); }
    return undefined;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const scrollEnd = () => setTimeout(() => list.current?.scrollToEnd({ animated: !motion.off }), 80);


  const recentTurns = () => msgs.filter((m) => (m.role === 'user' && m.text) || (m.reply?.kind === 'ai' && !m.reply.replaced)).slice(-12)
    .map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.role === 'user' ? m.text! : (m.reply as { answer: string }).answer }));

  function push(...m: Msg[]) { setMsgs((all) => [...all, ...m]); scrollEnd(); }
  function replace(id: string, reply: Reply) { setMsgs((all) => all.map((m) => (m.id === id ? { ...m, reply } : m))); scrollEnd(); }

  /** Réponse locale honnête : outils trouvés par mots (profil affiché, puis tous) et article le plus proche. */
  function local(question: string): LocalReply {
    const res = searchForAura(catalog, allTools, question, searchCatalog);
    return localReply(res, index ? localAnswer(index, question, { asked: question, lang: getLocale(), region }) : null);
  }

  async function send(text?: string, opts: { requestId?: string; journal?: unknown; retryOf?: string; forceAi?: boolean } = {}) {
    const question = (text ?? input).trim().slice(0, MAX_QUESTION_LENGTH);
    if (question.length < 2 || sending) return;
    Keyboard.dismiss();
    stopVoice();
    setVoiceNote(null);
    setPhase('idle');
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
    // 2) Demandes évidentes (ouvrir l'outil du quotidien, corriger une sieste, préparer le relais, ajouter un poids,
    //    changer d'enfant, outils grossesse) : règle LOCALE, carte d'action en un appui, aucun appel au modèle
    const raw = matchIntent(question);
    const matched = raw ? withNamedChild(raw, question, children ?? []) : raw;
    // « je veux suivre les nuits de ma fille » : l'outil du quotidien s'ouvre AVEC son explication (guidage)
    const intent = matched && matched.kind === 'open_tool' && isGuideQuestion(question) ? { ...matched, explain: true } : matched;
    if (intent) {
      const reply: Reply = { kind: 'intent', intent };
      if (opts.retryOf) replace(auraId, reply); else push(userMsg, { id: auraId, role: 'aura', reply });
      return;
    }
    // 2 bis) Guidage (« où se trouve… », « comment partager les tâches… ») : si UN outil du profil répond clairement,
    //        carte « Ouvrir » + explication en une phrase, sans IA ni crédit (sinon : modèle ou mode local)
    if (isGuideQuestion(question)) {
      const res = searchForAura(catalog, allTools, question, searchCatalog);
      const top = res.understood ? res.results[0] : null;
      const second = res.understood ? res.results[1] : null;
      if (top && catalog.some((x) => x.id === top.tool.id) && (!second || top.score >= second.score * 1.25)) {
        const reply: Reply = { kind: 'intent', intent: { kind: 'open_tool', toolId: top.tool.id, explain: true } };
        if (opts.retryOf) replace(auraId, reply); else push(userMsg, { id: auraId, role: 'aura', reply });
        return;
      }
    }
    // 2 ter) Outil d'abord (25/11/2026, demande de la propriétaire) : avant TOUT appel payant, si un outil du profil
    //        correspond à la question, Aura l'ouvre en un appui (gratuit, immédiat) ; « Demander quand même à Aura »
    //        reste proposé pour une vraie réponse de l'IA (crédit débité seulement à ce moment-là)
    if (remote && !opts.forceAi && !opts.journal && !opts.retryOf && !opts.requestId) { // un nouvel essai d'IA reste un essai d'IA
      const res = searchForAura(catalog, allTools, question, searchCatalog);
      const top = res.understood ? res.results[0] : null;
      if (top && catalog.some((x) => x.id === top.tool.id)) {
        const reply: Reply = { kind: 'intent', intent: { kind: 'open_tool', toolId: top.tool.id, explain: true }, ask: question };
        if (opts.retryOf) replace(auraId, reply); else push(userMsg, { id: auraId, role: 'aura', reply });
        return;
      }
    }
    // 3) Mode local : recherche honnête
    if (!remote) {
      const reply = local(question);
      if (opts.retryOf) replace(auraId, reply); else push(userMsg, { id: auraId, role: 'aura', reply });
      return;
    }
    if (needsSub) { toast(tr(inTrial ? 'aura.sub.trial' : 'aura.sub.none'), 'info'); return; }
    if (!consented) { setConsentSheet({ retry: () => void send(question, opts) }); return; }
    const action = creditActionFor('chat', { journal: !!opts.journal });
    const cost = costOf(action, creditConfig.data);
    if (credits.data?.subscribed && totalRemaining(credits.data) < cost) { setOutOfCredits(true); return; }
    const requestId = opts.requestId ?? uuid();
    if (opts.retryOf) replace(auraId, { kind: 'pending' }); else push(userMsg, { id: auraId, role: 'aura', reply: { kind: 'pending' } });
    setSending(true);
    try {
      const r: AuraServerReply = await askAura({
        kind: 'chat', message: question, theme, lang: getLocale(), region, request_id: requestId, credit_action: action,
        recent_turns: recentTurns(), tools: catalogForServer(allTools, (id) => tMaybe(toolWordsKey(id)) || ''),
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
      if (kind === 'credits') { replace(auraId, { kind: 'error', error: 'credits', question, requestId: uuid(), journal: opts.journal }); setOutOfCredits(true); }
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
    if (!consented) { setConsentSheet({}); return null; }
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

  // Pourquoi Aura répond sans IA (dit exactement, jamais une impasse) : choix de la personne, IA coupée par le serveur,
  // ou Aura en ligne pas encore ouverte dans cette version de l'app (interrupteur aiAssistantOnline)
  const localReason: 'chosen' | 'off' | 'soon' | null = mode !== 'local' ? null : forceLocal ? 'chosen' : serverOff ? 'off' : 'soon';
  const voice = useMemo(() => voiceStatus(), []);
  const acceptConsent = (retry?: () => void) => setConsent.mutate({ purpose: 'ai_assistant', granted: true }, {
    onSuccess: () => { setConsentSheet(null); retry?.(); },
    onError: (e) => toast(friendlyError(e), 'error'),
  });
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
        <View testID="aura-needs-sub" style={{ gap: spacing.sm, backgroundColor: t.colors.surface, borderRadius: radius.lg, ...glassEdge(t), padding: spacing.md }}>
          <Text variant="small">{tr(inTrial ? 'aura.sub.trial' : 'aura.sub.none')}</Text>
          <Button label={tr('aura.consent.local')} icon="search" full onPress={() => setForceLocal(true)} testID="aura-sub-local" />
          <Button label={tr('aura.sub.see')} variant="ghost" full onPress={() => router.push('/settings/subscription')} testID="aura-sub-see" />
        </View>
      ) : null}

      {remote && !consented && !needsSub ? (
        <View testID="aura-consent" style={{ gap: spacing.sm, backgroundColor: t.colors.surface, borderRadius: radius.lg, ...glassEdge(t), padding: spacing.md }}>
          <Text weight="bold" accessibilityRole="header">{tr('aura.consent.title')}</Text>
          <Text variant="small" muted>{tr('aura.consent.body')}</Text>
          <Button label={tr('aura.consent.accept')} icon="check" full loading={setConsent.isPending} testID="aura-consent-accept"
            onPress={() => setConsent.mutate({ purpose: 'ai_assistant', granted: true }, { onError: (e) => toast(friendlyError(e), 'error') })} />
          <Button label={tr('aura.consent.local')} variant="ghost" full onPress={() => setForceLocal(true)} testID="aura-consent-local" />
        </View>
      ) : null}

      <View style={empty ? { alignItems: 'center', gap: spacing.sm } : { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
        {/* le personnage d'Aura : en grand à l'ouverture (coucou ; plus petit sur un écran bas), en petit et immobile une fois la conversation lancée */}
        <AuraBot size={empty ? (winH < 700 ? 96 : 140) : 56} state={botState} still={!empty} decorative={false} testID="aura-avatar" />
        <View style={empty ? { alignSelf: 'stretch', gap: 6, alignItems: 'center' } : { flex: 1, gap: 6 }}>
          <View testID="aura-mode" accessibilityLabel={tr('aura.mode.a11y', { mode: modeLabel })}
            style={{ alignSelf: empty ? 'center' : 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, minHeight: 28, borderRadius: radius.pill, backgroundColor: remote ? t.colors.accentSoft : t.colors.surfaceAlt }}>
            <Icon name={mode === 'online' ? 'cloud' : mode === 'demo' ? 'play-circle' : 'smartphone'} size={14} color={t.colors.text} />
            <Text variant="caption" weight="bold">{modeLabel}</Text>
          </View>
          <View style={{ alignSelf: 'stretch', backgroundColor: t.colors.surface, borderRadius: radius.lg, borderTopLeftRadius: empty ? radius.lg : 6, ...glassEdge(t), padding: spacing.md }}>
            <Text variant="small" testID="aura-hello">{tr(remote ? 'aura.hello' : 'aura.helloLocal')}</Text>
            {localReason ? <Text variant="caption" muted testID="aura-local-reason" style={{ marginTop: 4 }}>{tr(`sa.aura.local.${localReason}` as never)}</Text> : null}
            {localReason === 'chosen' && (aiAssistantOnline() || (isDemo && !hasRealBackend)) ? (
              <Button label={tr('sa.aura.useAi')} icon="cloud" size="sm" variant="ghost" style={{ alignSelf: 'flex-start' }} onPress={() => setForceLocal(false)} testID="aura-use-ai" />
            ) : null}
          </View>
        </View>
      </View>


      {toolCtx ? (
        <View testID="aura-tool-context" style={{ gap: spacing.xs, backgroundColor: t.colors.surface, borderRadius: radius.lg, ...glassEdge(t), padding: spacing.md }}>
          <Text variant="label" accessibilityRole="header" testID="aura-tool-name">{tr('ta.ctx.title', { tool: toolName })}</Text>
          <Text variant="caption" muted>{tr('ta.ctx.note', { tool: toolName })}</Text>
          {(['ta.ctx.how', 'ta.ctx.what'] as const).map((k) => (
            <Tappable key={k} accessibilityRole="button" accessibilityLabel={tr('aura.ask', { q: tr(k, { tool: toolName }) })} disabled={blockedByConsent || sending}
              onPress={() => void send(tr(k, { tool: toolName }))} testID="aura-ctx-question"
              style={({ pressed }) => ({ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm, borderRadius: radius.md, backgroundColor: pressed ? t.colors.surfaceAlt : 'transparent', opacity: blockedByConsent ? 0.5 : 1 })}>
              <Icon name="message-circle" size={16} color={t.colors.lavender} />
              <Text variant="small" style={{ flex: 1 }}>{tr(k, { tool: toolName })}</Text>
            </Tappable>
          ))}
          {ctxTool ? <Button label={tr('ta.ctx.open', { tool: toolName })} icon="arrow-left" variant="secondary" size="sm" full
            onPress={() => (router.canGoBack() ? router.back() : openTool(ctxTool))} testID="aura-ctx-open" /> : null}
        </View>
      ) : null}

      {theme ? <Text variant="label" accessibilityRole="header" testID="aura-theme">{tr(themeName(theme))}</Text> : null}

      {theme === 'emotion_translator' ? (
        <EmotionTranslator mode={mode} cost={costOf(creditActionFor('reformulate'), creditConfig.data)} reformulate={reformulate} goal={toTranslatorGoal(params.goal)}
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
              style={({ pressed }) => ({ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, ...glassEdge(t), backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface, opacity: blockedByConsent ? 0.5 : 1 })}>
              <Icon name="message-circle" size={16} color={t.colors.lavender} />
              <Text variant="small" style={{ flex: 1 }}>{tr(k)}</Text>
            </Tappable>
          ))}
        </View>
      ) : null}

      {featured.length ? (
        <View testID="aura-featured">
          <Text variant="caption" muted style={{ letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{tr('aura.featured')}</Text>
          <MotionList>{featured.map((tool) => <MotionItem key={tool.id}><ListRow key={tool.id} icon={tool.icon} title={tool.label} subtitle={tool.sub} onPress={() => openTool(tool)} testID={`aura-featured-${tool.id}`} /></MotionItem>)}</MotionList>
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
          {blockedByConsent ? (
            <View testID="aura-blocked" accessibilityLiveRegion="polite" style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: spacing.xs }}>
              <Text variant="caption" center style={[{ width: '100%', minWidth: 0 }, NO_HYPHENS]}>{tr(needsSub ? 'sa.aura.blockedSub' : 'sa.aura.blockedConsent')}</Text>
              {needsSub
                ? <Button label={tr('sa.aura.seeOffer')} icon="star" size="sm" onPress={() => router.push('/settings/subscription')} testID="aura-blocked-offer" />
                : <Button label={tr('sa.aura.giveConsent')} icon="check" size="sm" onPress={() => setConsentSheet({})} testID="aura-blocked-consent" />}
              <Button label={tr('aura.tryLocal')} icon="search" size="sm" variant="ghost" onPress={() => setForceLocal(true)} testID="aura-blocked-local" />
            </View>
          ) : null}
          {listening ? (
            <View testID={phase === 'processing' ? 'aura-processing' : 'aura-listening'} accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xs }}>
              <AuraThinkingDots color={t.colors.primary} />
              <Text variant="caption" style={{ flex: 1 }}>{tr(phase === 'processing' ? 'sa.voice.processing' : 'ta.voice.listening')}</Text>
              <Button label={tr('ta.voice.cancel')} variant="ghost" size="sm" onPress={cancelDictation} testID="aura-mic-cancel" />
            </View>
          ) : voiceNote ? <Text variant="caption" muted={phase !== 'error'} color={phase === 'error' ? t.colors.warning : undefined} center testID="aura-voice-note">{voiceNote}</Text> : null}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, backgroundColor: t.colors.surface, borderRadius: radius.lg, ...glassEdge(t), padding: 6 }}>
            {dictation !== 'none' ? (
              <Tappable accessibilityRole="button" accessibilityLabel={listening ? tr('ta.voice.end') : tr('ta.voice.talk')} accessibilityState={{ disabled: blockedByConsent, busy: listening }}
                disabled={blockedByConsent} onPress={onMic} testID="aura-mic"
                style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: listening ? t.colors.accentSoft : 'transparent', opacity: blockedByConsent ? 0.4 : 1 }}>
                <Icon name={listening ? 'square' : 'mic'} size={20} color={listening ? t.colors.primary : t.colors.textMuted} />
              </Tappable>
            ) : null}
            <TextInput
              ref={inputRef}
              value={input} onChangeText={setInput} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={tr('aura.ph')} placeholderTextColor={t.colors.textMuted} accessibilityLabel={tr('aura.yourMsg')}
              multiline maxLength={MAX_QUESTION_LENGTH} textAlignVertical="top" editable={!blockedByConsent} testID="aura-input"
              style={{ flex: 1, minHeight: 44, maxHeight: 140, color: t.colors.text, fontFamily: fonts.body, fontSize: 16, paddingHorizontal: spacing.sm, paddingTop: 10 }}
            />
            <Tappable accessibilityRole="button" accessibilityLabel={remote ? tr('aura.sendCost', { count: askCost }) : tr('aura.send')} accessibilityState={{ disabled: sending || input.trim().length < 2 || blockedByConsent, busy: sending }}
              disabled={sending || input.trim().length < 2 || blockedByConsent} onPress={() => void send()} testID="aura-send"
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.tokens.action.fill, ...whoopEdge(t, t.tokens.action.fill), alignItems: 'center', justifyContent: 'center', opacity: sending || input.trim().length < 2 || blockedByConsent ? 0.4 : 1 }}>
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
        {/* VirtualList : portée clavier (le champ « Traduire mes émotions » de l'en-tête remonte au-dessus du clavier) */}
        <VirtualList
          ref={list}
          removeClippedSubviews={false}
          data={msgs}
          keyExtractor={(m) => m.id}
          extraData={`${botState}:${lastAura?.id ?? ''}`}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={DISMISS_ON_DRAG}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: insets.bottom + spacing.lg, gap: spacing.md }}
          renderItem={({ item: m }) => (m.role === 'user' ? (
            <View testID="aura-msg-user" style={{ alignSelf: 'flex-end', maxWidth: '86%', backgroundColor: t.tokens.action.fill, ...whoopEdge(t, t.tokens.action.fill), paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.lg, borderBottomRightRadius: 6 }}>
              <Text color={t.tokens.action.text}>{m.text}</Text>
            </View>
          ) : (
            <AuraReply reply={m.reply!} catalog={allTools} onChooseJournal={setJournal}
              voice={ttsAvailable ? { speaking: speakingId === m.id, onToggle: (text) => toggleSpeak(m.id, text) } : null}
              bot={m.id === lastAura?.id ? { state: botState, still: false } : { state: restingBot(m.reply!), still: true }}
              onRetry={(r) => void send(r.question, { requestId: r.requestId, journal: r.journal, retryOf: m.id })}
              onAskAi={(q) => void send(q, { forceAi: true })} askCost={askCost}
              onCredits={() => setOutOfCredits(true)}
              onConsent={(r) => setConsentSheet({ retry: () => void send(r.question, { journal: r.journal, retryOf: m.id }) })}
              onLocal={(q) => replace(m.id, local(q))} />
          ))}
        />
      </View>

      <Sheet visible={!!consentSheet} onClose={() => setConsentSheet(null)} title={tr('aura.consent.title')}>
        <View style={{ gap: spacing.sm }} testID="aura-consent-sheet">
          <Text variant="small" muted>{tr('aura.consent.body')}</Text>
          <Button label={tr('aura.consent.accept')} icon="check" full loading={setConsent.isPending} testID="aura-consent-sheet-accept" onPress={() => acceptConsent(consentSheet?.retry)} />
          <Button label={tr('aura.consent.local')} variant="ghost" full onPress={() => { setConsentSheet(null); setForceLocal(true); }} />
        </View>
      </Sheet>
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
          <View testID="aura-voice-status" style={{ gap: 2 }}>
            <Text weight="medium">{tr('sa.voice.title')}</Text>
            <Text variant="caption" muted testID="aura-voice-tts">{tr(`sa.voice.tts.${voice.tts}` as never)}</Text>
            <Text variant="caption" muted testID="aura-voice-dictation">{tr(`sa.voice.dict.${voice.dictation}` as never)}</Text>
          </View>
          <Button label={tr('ta.intro.replay')} icon="play-circle" variant="secondary" full onPress={() => { setSettings(false); useUiStore.getState().requestAuraIntro(); }} testID="aura-intro-replay" />
          <Button label={tr('aura.privacy')} icon="lock" variant="ghost" full onPress={() => { setSettings(false); router.push('/settings/privacy'); }} />
        </View>
      </Sheet>
    </Screen>
  );
}

/** Expression du petit robot à côté d'une ancienne réponse (pose statique). */
const restingBot = (r: Reply): AuraBotState => (r.kind === 'pending' ? 'thinking' : r.kind === 'safety' || r.kind === 'error' ? 'concern' : 'idle');
const BOT_SIZE = 32;

/** « Écouter la réponse » : voix du téléphone, sur demande seulement, arrêt immédiat. */
function ListenButton({ text, voice }: { text: string; voice: { speaking: boolean; onToggle: (text: string) => void } }) {
  return (
    <Button label={tr(voice.speaking ? 'ta.voice.stop' : 'ta.voice.read')} icon={voice.speaking ? 'square' : 'volume-2'} variant="ghost" size="sm"
      style={{ alignSelf: 'flex-start' }} onPress={() => voice.onToggle(text)} testID="aura-listen" />
  );
}

function AuraReply({ reply, catalog, onChooseJournal, onRetry, onLocal, onCredits, onConsent, onAskAi, askCost, bot, voice }: {
  reply: Reply; catalog: ReturnType<typeof useAllToolEntries>['catalog'];
  voice: { speaking: boolean; onToggle: (text: string) => void } | null;
  /** robot à côté de la réponse : vivant pour la dernière, immobile pour les précédentes */
  bot: { state: AuraBotState; still: boolean };
  onChooseJournal: (j: 'mood' | 'diary') => void;
  onRetry: (r: Extract<Reply, { kind: 'error' }>) => void;
  onLocal: (q: string) => void;
  onCredits: () => void;
  onConsent: (r: Extract<Reply, { kind: 'error' }>) => void;
  onAskAi?: (question: string) => void;
  askCost?: number;
}) {
  const t = useTheme();
  const bubble = { backgroundColor: t.colors.surface, padding: spacing.md, borderRadius: radius.lg, borderBottomLeftRadius: 6, ...glassEdge(t), gap: spacing.sm } as const;
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
          {auraErrorAction(reply.error) === 'retry' ? <Button label={tr('aura.retry')} icon="refresh-cw" size="sm" variant="secondary" onPress={() => onRetry(reply)} testID="aura-retry" /> : null}
          {auraErrorAction(reply.error) === 'offer' ? <Button label={tr('sa.aura.seeOffer')} icon="star" size="sm" variant="secondary" onPress={() => router.push('/settings/subscription')} testID="aura-err-offer" /> : null}
          {auraErrorAction(reply.error) === 'credits' ? <Button label={tr('sa.aura.buyCredits')} icon="plus-circle" size="sm" variant="secondary" onPress={onCredits} testID="aura-err-credits" /> : null}
          {auraErrorAction(reply.error) === 'consent' ? <Button label={tr('sa.aura.giveConsent')} icon="check" size="sm" variant="secondary" onPress={() => onConsent(reply)} testID="aura-err-consent" /> : null}
          <Button label={tr('aura.tryLocal')} icon="search" size="sm" variant="ghost" onPress={() => onLocal(reply.question)} testID="aura-try-local" />
        </Row>
      </View>
    );
  }
  if (reply.kind === 'intent') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs }}>
        <AuraBot size={BOT_SIZE} state={bot.state} still={bot.still} testID="aura-reply-bot" />
        <View style={[bubble, { flex: 1 }]} accessibilityLiveRegion="polite">
          <IntentCard intent={reply.intent} catalog={catalog} allTools={catalog} />
          {reply.ask && onAskAi ? (
            <Button label={tr('aura.askAnyway', { count: askCost ?? 1 })} icon="message-circle" size="sm" variant="ghost" onPress={() => onAskAi(reply.ask!)} testID="aura-ask-anyway" />
          ) : null}
        </View>
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
        {voice ? <ListenButton voice={voice} text={[tr('aura.local.intro'), ...reply.tools.map((x) => x.label)].join('. ')} /> : null}
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
        {voice && reply.answer ? <ListenButton voice={voice} text={reply.answer} /> : null}
      </View>
      </View>
      <ActionCards actions={reply.actions} catalog={catalog} onChooseJournal={onChooseJournal} />
      <Text variant="caption" muted testID="aura-charged">{`${reply.footer} ${reply.charged ? tr('aura.charged', { count: reply.cost }) : tr('aura.notCharged')}`}</Text>
    </View>
  );
}
