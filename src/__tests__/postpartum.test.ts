/** Suivi post-partum : soutien gradué, jamais de diagnostic ni de score, partage contrôlé par la mère. */
import {
  addDays, describeTrend, emergencyContacts, filterShared, helpIdeas, persistentLowDays, supportPlan, trendSeries,
  type CheckinInput, type PostpartumCheckin,
} from '@/lib/domain/postpartum';
import { PARTNER, PHRASES_TO_AVOID, SOURCES, UNDERSTAND, USEFUL_PHRASES } from '@/content/postpartum';

const TODAY = '2026-10-18';
const ck = (date: string, v: Partial<PostpartumCheckin> = {}): PostpartumCheckin => ({
  id: date, user_id: 'u', checkin_date: date, feeling: null, mood: null, fatigue: null, stress: null, sleep_quality: null, supported: null,
  coping: null, rest_need: null, help_need: null, needs: [], need_other: null, comment: null, physical_fatigue: null, pain: null, pain_note: null,
  recovery: null, feeding_note: null, difficulties: null, urgent_orientation_shown: false, created_at: date, ...v,
});

describe('propositions de soutien graduées', () => {
  it('danger signalé → orientation urgente humaine, numéros français vérifiés', () => {
    const p = supportPlan({ mood: 4 }, { danger: ['self'], country: 'FR' });
    expect(p.level).toBe('danger');
    expect(p.actions.map((a) => a.to)).toEqual(['call:3114', 'call:15', 'call:112']);
    // jamais « prévenir le conjoint » à la place de l'aide urgente
    expect(JSON.stringify(p)).not.toMatch(/conjoint|notification|partag/i);
  });
  it('danger hors France → 112 et numéro local', () => {
    expect(emergencyContacts('BE').map((e) => e.phone)).toEqual(['112']);
  });
  it('besoin de repos déclaré → relais et repos, pas de professionnel imposé', () => {
    const p = supportPlan({ needs: ['rest'] });
    expect(p.level).toBe('rest');
    expect(p.actions.map((a) => a.key)).toEqual(expect.arrayContaining(['rest', 'relay']));
  });
  it('fatigue ou stress importants → simplifier + proposer un professionnel', () => {
    const p = supportPlan({ fatigue: 5, stress: 4 });
    expect(p.level).toBe('strain');
    expect(p.actions.some((a) => a.key === 'pro')).toBe(true);
  });
  it('tristesse avec difficulté à faire face → prise de contact rapide, sans délai imposé', () => {
    const p = supportPlan({ mood: 1, coping: 1 });
    expect(p.level).toBe('distress');
    expect(p.actions[0].key).toBe('pro_soon');
    expect(p.message).not.toMatch(/deux semaines|attendez/i);
  });
  it('persistance sur plusieurs jours (déclarée) → distress, même si aujourd’hui va mieux', () => {
    const history = Array.from({ length: 6 }, (_, i) => ck(addDays(TODAY, -i - 1), { mood: 2 }));
    const days = persistentLowDays(history, TODAY);
    expect(days).toBe(6);
    expect(supportPlan({ mood: 4 }, { persistentLowDays: days }).level).toBe('distress');
  });
  it('une seule journée basse sans autre signe ne suffit pas à conclure', () => {
    expect(supportPlan({ mood: 2 }).level).not.toBe('distress');
  });
  it('rien de déclaré → aucune injonction', () => {
    expect(supportPlan({}).actions).toEqual([]);
  });
});

describe('aucun diagnostic, aucun score, aucune culpabilisation', () => {
  const FORBIDDEN = /(vous avez une d[ée]pression|tu as une d[ée]pression|diagnostic de|votre score|score de|vous [êe]tes d[ée]prim[ée]e|mauvaise m[èe]re|[ée]chec de|bravo|f[ée]licitations|s[ée]rie de|nouveau record)/i;
  const inputs: [Partial<CheckinInput>, Parameters<typeof supportPlan>[1]][] = [
    [{}, {}], [{ needs: ['rest', 'practical'] }, {}], [{ fatigue: 5 }, {}], [{ mood: 1, stress: 5 }, {}], [{ mood: 5 }, { persistentLowDays: 9 }],
    [{ needs: ['talk', 'professional'] }, {}], [{}, { danger: ['baby'] }],
  ];
  it.each(inputs)('textes des propositions %#', (c, o) => {
    expect(JSON.stringify(supportPlan(c, o))).not.toMatch(FORBIDDEN);
  });
  it('contenus éducatifs et phrases utiles', () => {
    const all = JSON.stringify([UNDERSTAND, PARTNER, USEFUL_PHRASES]);
    expect(all).not.toMatch(FORBIDDEN);
    for (const p of PHRASES_TO_AVOID) expect(JSON.stringify(USEFUL_PHRASES)).not.toContain(p);
  });
  it('chaque section qui affirme un fait médical cite une source', () => {
    for (const s of [...UNDERSTAND, ...PARTNER].filter((x) => /baby blues|consult|3114|d[ée]pression/i.test(x.body.join(' ')))) {
      expect(s.sources.length).toBeGreaterThan(0);
      for (const k of s.sources) expect(SOURCES[k].url).toMatch(/^https:\/\/(www\.1000-premiers-jours\.fr|sante\.gouv\.fr)\//);
    }
  });
  it('tendances : description neutre, jamais une conclusion médicale', () => {
    const pts = trendSeries([ck(addDays(TODAY, -3), { mood: 4 }), ck(addDays(TODAY, -2), { mood: 4 }), ck(addDays(TODAY, -1), { mood: 2 }), ck(TODAY, { mood: 1 })], 'mood', TODAY, 7);
    expect(pts).toHaveLength(7);
    const d = describeTrend(pts, true);
    expect(d).toMatch(/d’après vos réponses/);
    expect(d).not.toMatch(FORBIDDEN);
    expect(describeTrend(pts.slice(-2), true)).toMatch(/Pas assez/);
  });
  it('les écrans post-partum n’affichent ni score ni série de jours', () => {
    const fs = require('fs') as { readdirSync(p: string): string[]; readFileSync(p: string, enc: 'utf8'): string };
    const dir = 'src/app/postpartum';
    for (const f of fs.readdirSync(dir)) {
      const src = fs.readFileSync(`${dir}/${f}`, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      expect(src).not.toMatch(FORBIDDEN);
    }
  });
});

describe('partage avec le conjoint', () => {
  const none = { share_rest_need: false, share_availability: false, share_relay_requests: false, share_summary: false };
  it('privé par défaut : rien ne passe', () => {
    expect(filterShared(none, { rest_need: 'high', availability: 'resting', relay_requested: true, relay_note: 'x', summary: 'y' }))
      .toEqual({ rest_need: null, availability: null, relay_requested: false, relay_note: null, summary: null });
  });
  it('seuls les champs autorisés passent', () => {
    expect(filterShared({ ...none, share_relay_requests: true }, { rest_need: 'high', relay_requested: true, relay_note: 'La nuit ?' }))
      .toEqual({ rest_need: null, availability: null, relay_requested: true, relay_note: 'La nuit ?', summary: null });
  });
  it('« Comment m’aider ? » ne s’appuie que sur ce qui est partagé', () => {
    const ideas = helpIdeas({ rest_need: 'high', availability: null, relay_requested: true });
    expect(ideas[0]).toMatch(/relais/);
    expect(ideas.join(' ')).not.toMatch(/humeur|tristesse|check-in|réponses/i);
  });
});
