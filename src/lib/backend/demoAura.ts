/**
 * Démonstration (sans serveur) : HOMI Aura passe par le MÊME déroulé que la fonction serveur (`runAura` :
 * sécurité → consentement → crédits → modèle → contrôle de la sortie), avec les crédits de démonstration et un modèle
 * SIMULÉ par des règles (aucune IA, aucun réseau). L'écran le signale : « Démonstration : réponses simulées ».
 * Le modèle simulé appelle les fonctions de la liste blanche comme le ferait Gemini (recherche d'outil, propositions),
 * ce qui permet de tester de bout en bout les cartes d'action et leur confirmation.
 */
import { BackendError } from './types';
import { t as tr } from '@/i18n';
import { runAura, type GeminiContent, type GeminiFunctionCall, type GeminiRequestOptions, type GeminiTurnResult } from '../../../supabase/functions/_shared/aura-run';
import { todayIso } from '../../../supabase/functions/_shared/assistant-format';
import type { CreditAction } from '../credits/model';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface AuraDemoCtx {
  T: (name: string) => Row[];
  me: () => string | undefined;
  credits: {
    reserve(action: CreditAction): { reservation_id: string; cost: number; monthly_remaining: number; purchased_remaining: number };
    commit(id: string): boolean;
    release(id: string, reason: string): boolean;
  };
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const EVENT = /rendez|rdv|agenda|calendrier|appointment|calendar|termin|cita|appuntamento|pediatre|pediatra|kinderarzt/;
const PLAN = /organis|semaine|planning|week|woche|semana|settimana|plan\b/;
const MISSION = /mission|tache|courses|chores|task|aufgabe|tarea|compito|spesa|einkauf|compra/;

function addDays(today: string, n: number) {
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Modèle simulé : un tour à partir des contenus (même interface que geminiGenerateTurn). */
export function simulatedTurn(o: GeminiRequestOptions, today: string): GeminiTurnResult {
  if (o.responseSchema) {
    const draft = o.turns[0]?.text ?? '';
    const options = [tr('aura.demo.ref1', { text: draft }), tr('aura.demo.ref2', { text: draft }), tr('aura.demo.ref3', { text: draft })];
    return { text: JSON.stringify({ options }), calls: [], parts: [], finishReason: 'STOP' };
  }
  const contents: GeminiContent[] = o.contents ?? [];
  if (!o.functions) return { text: simulatedAnalysis(o.system ?? ''), calls: [], parts: [], finishReason: 'STOP' };
  const firstUser = [...contents].reverse().find((c) => c.role === 'user' && typeof c.parts[0]?.text === 'string');
  const q = fold(String(firstUser?.parts[0]?.text ?? ''));
  const last = contents[contents.length - 1];
  const responses = (last?.parts ?? []).map((p) => p.functionResponse as { name: string; response: Record<string, unknown> } | undefined).filter(Boolean);
  const call = (calls: GeminiFunctionCall[]): GeminiTurnResult => ({ text: '', calls, parts: calls.map((c) => ({ functionCall: c })), finishReason: 'STOP' });

  // 1er tour : chercher un outil avec les mots de la personne
  if (!responses.length) return call([{ name: 'search_tools', args: { query: q } }]);
  // 2e tour : propositions selon la recherche et les intentions repérées
  const search = responses.find((r) => r?.name === 'search_tools');
  if (search) {
    const tools = (search.response.tools as { id: string }[] | undefined) ?? [];
    const calls: GeminiFunctionCall[] = [];
    if (tools[0]) calls.push({ name: 'propose_open_tool', args: { tool_id: tools[0].id, reason: tr('aura.demo.reason') } });
    if (EVENT.test(q)) calls.push({ name: 'propose_calendar_event', args: { title: tr('aura.demo.eventTitle'), date: addDays(today, 3), time: '10:00', duration_minutes: 45 } });
    if (PLAN.test(q)) calls.push({ name: 'propose_plan', args: { title: tr('aura.demo.planTitle'), steps: [1, 2, 3].map((i) => ({ title: tr(`aura.demo.step${i}` as never), when: null })) } });
    else if (MISSION.test(q)) calls.push({ name: 'propose_mission', args: { title: tr('aura.demo.missionTitle'), category: 'organization' } });
    if (calls.length) return call(calls.slice(0, 3));
    return { text: tr('aura.demo.noTool'), calls: [], parts: [], finishReason: 'STOP' };
  }
  return { text: tr('aura.demo.final'), calls: [], parts: [], finishReason: 'STOP' };
}

export function createAuraDemo(c: AuraDemoCtx) {
  return async function aura(b: Row): Promise<Row> {
    const me = c.me();
    if (!me) throw new BackendError(tr('l2.dm.signinDot'), '42501', undefined, 401);
    const today = todayIso();
    const out = await runAura({
      userId: me,
      today,
      consented: async () => {
        const last = c.T('consents').filter((x) => x.user_id === me && x.purpose === 'ai_assistant').sort((x, y) => (x.created_at < y.created_at ? 1 : -1))[0];
        return last?.granted === true;
      },
      geminiConfig: async () => ({ apiKey: 'demo', model: 'simulation' }),
      gate: {
        reserve: async (action) => {
          try {
            const r = c.credits.reserve(action as CreditAction);
            return { ok: true, reservation_id: r.reservation_id, cost: r.cost, monthly_remaining: r.monthly_remaining, purchased_remaining: r.purchased_remaining };
          } catch (e) {
            return { ok: false, error: e instanceof BackendError && e.code ? e.code : 'server_error' };
          }
        },
        commit: async (id) => c.credits.commit(id),
        release: async (id, reason) => c.credits.release(id, reason),
      },
      turn: async (_cfg, o) => simulatedTurn(o, today),
    }, b);
    if (out.status !== 200) {
      const err = String(out.body.error ?? 'function_error');
      throw new BackendError(tr(err === 'insufficient_credits' ? 'cr.err.insufficient' : err === 'premium_required' ? 'cr.err.premium' : 'aura.err.unavailable'), err, err === 'premium_required' ? 'premium_required' : undefined, out.status);
    }
    return { ...out.body, demo: true };
  };
}

/**
 * Analyse SIMULÉE (démonstration, aucun modèle) : pour la sieste en cours, le texte reprend UNIQUEMENT les chiffres
 * recalculés par le serveur (aura-data.ts → bloc de données du prompt) ; il commence par « Réponse simulée ».
 */
function simulatedAnalysis(system: string): string {
  const m = /\{"kind":"nap".*\}/.exec(system);
  if (!m) return tr('aura.demo.analysis');
  let d: Record<string, unknown>;
  try { d = JSON.parse(m[0]) as Record<string, unknown>; } catch { return tr('aura.demo.analysis'); }
  if (d.status !== 'ok') return tr('aura.demo.nap.none', { start: String(d.started_hm ?? ''), count: Number(d.comparable_count ?? 0) });
  if (d.ongoing === false) {
    const dur = Number(d.elapsed_minutes); const low = Number(d.range_low_minutes); const high = Number(d.range_high_minutes);
    const where = dur > high ? 'longer' : dur < low ? 'shorter' : 'inside';
    return tr('aura.demo.nap.done', { start: String(d.started_hm), dur, count: Number(d.comparable_count), inRange: Number(d.in_range_count), low, high, where: tr(`aura.demo.nap.where.${where}` as never) });
  }
  const base = tr('aura.demo.nap.ok', {
    start: String(d.started_hm), count: Number(d.comparable_count), inRange: Number(d.in_range_count), low: Number(d.range_low_minutes), high: Number(d.range_high_minutes),
    from: String(d.window_from), to: String(d.window_to),
  });
  return d.progress === 'beyond' ? `${base} ${tr('aura.demo.nap.beyond')}` : base;
}
