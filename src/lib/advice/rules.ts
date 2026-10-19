/**
 * Règles du moteur de conseils (déterministes, sourcées, testées : src/__tests__/advice.test.ts).
 * Chaque règle : identifiant, groupe, informations utilisées, garde-fous, variantes de messages, sources, date de révision.
 * Les messages sont dans src/i18n/{fr,en}/advice.ts (clés adv.<id>.<variante>.title|body).
 */
import { ADVICE_REVIEWED_ON as R } from './sources';
import type { AdviceContext, BleedingEvent, DischargeEvent, Match, PainEvent, Rule, SexEvent, Trigger } from './types';

const DAY = 86_400_000;
const has = (list: readonly string[] | null | undefined, ...v: string[]) => !!list && v.some((x) => list.includes(x));
const isPregnancyPossible = (v?: string | null) => v === 'known' || v === 'possible';
/**
 * Grossesse pour une saisie : « yes » si connue/possible ou grossesse en cours enregistrée dans l'app ;
 * « maybe » si la personne a répondu « je ne sais pas » ou si un rapport à la protection incertaine/à risque est noté
 * depuis les dernières règles ; « no » sinon. Une absence de réponse n'est jamais un « non » quand un indice existe.
 */
export function pregnancyFlag(v: string | null | undefined, ctx: AdviceContext | null, iso: string): 'yes' | 'maybe' | 'no' {
  if (isPregnancyPossible(v) || ctx?.pregnant) return 'yes';
  if (v === 'unknown') return 'maybe';
  if (v === 'no' || !ctx) return 'no';
  const last = ctx.data.periods.map((p) => p.start_date).filter((x) => x <= iso).sort().pop();
  const risky = ctx.data.sex.some((x) => (!last || x.occurred_on >= last) && x.occurred_on <= iso && x.kind !== 'other' && (sexRiskFactors(x).length || sexUncertainty(x).length));
  return risky ? 'maybe' : 'no';
}

// ---------------------------------------------------------------- rapports
/** Heures écoulées depuis le rapport. Sans heure : fin de journée (on ne dit jamais « trop tard » à tort). */
export function hoursSince(e: SexEvent, now: Date): number {
  const t = e.occurred_time && /^\d{2}:\d{2}/.test(e.occurred_time) ? e.occurred_time.slice(0, 5) : '23:59';
  // Un rapport du jour (heure inconnue ou à venir dans la journée) compte comme « à l'instant » : jamais ignoré
  return Math.max(0, (now.getTime() - new Date(`${e.occurred_on}T${t}:00`).getTime()) / 3_600_000);
}

/** Facteurs de risque DÉCLARÉS (jamais déduits d'une absence de réponse). */
export function sexRiskFactors(e: SexEvent): Trigger[] {
  const out: Trigger[] = [];
  if (e.condom === 'no' && e.usual_contraception === 'no') out.push({ key: 'unprotected' });
  const contraOk = e.usual_contraception === 'yes' && e.contraception_incident === 'none';
  if ((e.condom === 'yes' || e.condom === 'unsure') && (e.condom_incident === 'broke' || e.condom_incident === 'slipped') && !contraOk) {
    out.push({ key: `condom_${e.condom_incident}` });
    if (e.usual_contraception == null || e.usual_contraception === 'unsure' || e.usual_contraception === 'prefer_not') out.push({ key: 'contra_unknown' });
  }
  if (e.usual_contraception === 'yes' && (e.contraception_incident === 'missed' || e.contraception_incident === 'late' || e.contraception_incident === 'misuse')) out.push({ key: `contra_${e.contraception_incident}` });
  return out;
}
/** Incertitudes qui justifient une question de précision plutôt qu'une conclusion. */
export function sexUncertainty(e: SexEvent): Trigger[] {
  const out: Trigger[] = [];
  if (e.condom === 'unsure') out.push({ key: 'condom_unsure' });
  if (e.condom_incident === 'unsure' || e.condom_incident === 'other') out.push({ key: 'condom_incident_unsure' });
  if (e.condom === 'no' && (e.usual_contraception == null || e.usual_contraception === 'unsure' || e.usual_contraception === 'prefer_not')) out.push({ key: 'contra_unknown' });
  if (e.usual_contraception === 'yes' && (e.contraception_incident === 'unsure' || e.contraception_incident === 'other')) out.push({ key: 'contra_incident_unsure' });
  return out;
}
const wishTrigger = (e: SexEvent): Trigger => ({ key: e.pregnancy_wish === 'no' ? 'wish_no' : 'wish_unknown' });
function fertileTrigger(e: SexEvent, ctx: AdviceContext): Trigger {
  const f = ctx.fertileStatusOn(e.occurred_on);
  return { key: f.status === 'in' || f.status === 'near' ? 'fertile_in' : f.status === 'out' ? 'fertile_out' : 'fertile_unknown' };
}
/** Pas d'alerte de contraception d'urgence : rapport non vaginal, grossesse souhaitée, ou grossesse en cours enregistrée. */
const sexGuardsCommon = (e: SexEvent, ctx: AdviceContext) => e.kind === 'other' || e.pregnancy_wish === 'yes' || ctx.pregnant;

export const sexRisk: Rule<SexEvent> = {
  id: 'sex_risk', group: 'sex-protection', appliesTo: 'sex',
  uses: ['condom', 'condom_incident', 'usual_contraception', 'contraception_incident', 'pregnancy_wish', 'ec_taken', 'professional_seen', 'date/heure', 'fenêtre fertile estimée'],
  guards: ['aucun facteur de risque déclaré', 'préservatif rompu mais contraception habituelle bien prise', 'grossesse souhaitée', 'grossesse en cours', 'rapport non vaginal', 'contraception d’urgence déjà prise (→ sex_after_ec)'],
  variants: ['h72', 'h120', 'passed', 'seen'],
  sources: ['spEC', 'qsEC', 'nhsPregnancyTest'], reviewedOn: R,
  evaluate(e, ctx) {
    const factors = sexRiskFactors(e);
    if (!factors.length || sexGuardsCommon(e, ctx) || e.ec_taken === 'yes') return null;
    const h = hoursSince(e, ctx.now);
    const triggers = [...factors, fertileTrigger(e, ctx), wishTrigger(e)];
    if (e.professional_seen === 'yes') return { priority: 'followup', variant: 'seen', triggers: [...triggers, { key: 'pro_seen' }], actions: ['pregnancy_risk', 'edit'] };
    if (h <= 72) return { priority: 'prompt', variant: 'h72', triggers, actions: ['ec_info', 'find_pro', 'pregnancy_risk', 'edit'] };
    if (h <= 120) return { priority: 'prompt', variant: 'h120', triggers, actions: ['ec_info', 'find_pro', 'pregnancy_risk', 'edit'] };
    return { priority: 'followup', variant: 'passed', triggers, actions: ['pregnancy_risk', 'find_pro', 'edit'] };
  },
};

export const sexClarify: Rule<SexEvent> = {
  id: 'sex_clarify', group: 'sex-protection', appliesTo: 'sex',
  uses: ['condom', 'condom_incident', 'usual_contraception', 'contraception_incident', 'date/heure'],
  guards: ['facteur de risque déclaré (→ sex_risk)', 'grossesse souhaitée', 'rapport non vaginal', 'contraception d’urgence déjà prise'],
  variants: ['recent', 'later'],
  sources: ['spEC', 'qsEC', 'nhsPregnancyTest'], reviewedOn: R,
  evaluate(e, ctx) {
    if (sexRiskFactors(e).length || sexGuardsCommon(e, ctx) || e.ec_taken === 'yes') return null;
    const unsure = sexUncertainty(e);
    if (!unsure.length) return null;
    const h = hoursSince(e, ctx.now);
    return { priority: 'followup', variant: h <= 120 ? 'recent' : 'later', triggers: [...unsure, fertileTrigger(e, ctx)], actions: ['edit', 'ec_info', 'pregnancy_risk'], clarify: 'protection' };
  },
};

export const sexAfterEc: Rule<SexEvent> = {
  id: 'sex_after_ec', group: 'sex-protection', appliesTo: 'sex',
  uses: ['ec_taken'], guards: ['contraception d’urgence non déclarée'], variants: ['default'],
  sources: ['qsEC', 'spEC'], reviewedOn: R,
  evaluate(e) {
    if (e.ec_taken !== 'yes') return null;
    return { priority: 'followup', variant: 'default', triggers: [{ key: 'ec_taken' }], actions: ['learn', 'find_pro', 'edit'] };
  },
};

export const sexTtc: Rule<SexEvent> = {
  id: 'sex_ttc', group: 'sex-ttc', appliesTo: 'sex',
  uses: ['pregnancy_wish', 'fenêtre fertile estimée'], guards: ['grossesse non souhaitée ou non précisée', 'hors fenêtre estimée'], variants: ['default'],
  sources: ['nhsPregnancyTest'], reviewedOn: R,
  evaluate(e, ctx) {
    if (e.pregnancy_wish !== 'yes') return null;
    const f = ctx.fertileStatusOn(e.occurred_on);
    if (f.status !== 'in' && f.status !== 'near') return null;
    return { priority: 'info', variant: 'default', triggers: [{ key: 'wish_yes' }, { key: 'fertile_in' }], actions: ['learn'] };
  },
};

// ---------------------------------------------------------------- douleurs
const SEVERE = 7;
const hasPain = (e: PainEvent) => e.pain_intensity != null;

export const painEmergency: Rule<PainEvent> = {
  id: 'pain_emergency', group: 'pain', appliesTo: 'pain',
  uses: ['pain_intensity', 'pain_associated', 'pain_pregnancy', 'grossesse en cours', 'rapports notés'],
  guards: ['ni malaise, ni fièvre, ni vomissements avec une douleur ≥ 7', 'pas de grossesse connue, possible ou incertaine avec malaise ou saignement'],
  variants: ['signs', 'pregnancy'],
  sources: ['nhsPID', 'nhsEctopic'], reviewedOn: R,
  evaluate(e, ctx) {
    if (!hasPain(e) || e.pain_intensity === 0) return null;
    const i = e.pain_intensity!;
    const a = e.pain_associated ?? [];
    const preg = pregnancyFlag(e.pain_pregnancy, ctx, e.logged_on);
    // Grossesse extra-utérine : douleur (quelle que soit l'intensité) + malaise ou saignement, même sans test positif
    if (preg !== 'no' && has(a, 'faint', 'unusual_bleeding')) {
      return { priority: 'emergency', variant: 'pregnancy', triggers: [{ key: 'pain_level', params: { n: i } }, { key: preg === 'yes' ? 'pregnancy_possible' : 'pregnancy_unknown' }, ...a.filter((x) => x === 'faint' || x === 'unusual_bleeding').map((k) => ({ key: k }))], actions: ['emergency', 'edit'] };
    }
    if (i >= SEVERE && has(a, 'faint', 'fever', 'vomiting')) {
      return { priority: 'emergency', variant: 'signs', triggers: [{ key: 'pain_level', params: { n: i } }, ...a.filter((x) => x === 'faint' || x === 'fever' || x === 'vomiting').map((k) => ({ key: k }))], actions: ['emergency', 'edit'] };
    }
    return null;
  },
};

export const painPrompt: Rule<PainEvent> = {
  id: 'pain_prompt', group: 'pain', appliesTo: 'pain',
  uses: ['pain_intensity', 'pain_relief', 'pain_pattern', 'pain_associated', 'pain_pregnancy', 'grossesse en cours'],
  guards: ['critères d’urgence remplis (→ pain_emergency)', 'douleur habituelle ou soulagée, sans fièvre, malaise, vomissements ni grossesse possible'],
  variants: ['severe', 'fever', 'pregnancy', 'signs'],
  sources: ['nhsPeriodPain', 'nhsPID', 'nhsEctopic'], reviewedOn: R,
  evaluate(e, ctx) {
    if (!hasPain(e) || e.pain_intensity === 0 || painEmergency.evaluate(e, ctx)) return null;
    const i = e.pain_intensity!;
    const a = e.pain_associated ?? [];
    if (pregnancyFlag(e.pain_pregnancy, ctx, e.logged_on) === 'yes') return { priority: 'prompt', variant: 'pregnancy', triggers: [{ key: 'pain_level', params: { n: i } }, { key: 'pregnancy_possible' }], actions: ['find_pro', 'emergency', 'edit'] };
    if (has(a, 'fever')) return { priority: 'prompt', variant: 'fever', triggers: [{ key: 'pain_level', params: { n: i } }, { key: 'fever' }], actions: ['find_pro', 'emergency', 'edit'] };
    if (has(a, 'faint', 'vomiting')) return { priority: 'prompt', variant: 'signs', triggers: [{ key: 'pain_level', params: { n: i } }, ...a.filter((x) => x === 'faint' || x === 'vomiting').map((k) => ({ key: k }))], actions: ['find_pro', 'emergency', 'edit'] };
    // NHS : douleur sévère OU pire que d'habitude, ET non soulagée ; ou douleur sévère nouvelle/aggravée
    const changed = e.pain_pattern === 'new' || e.pain_pattern === 'worse';
    if ((e.pain_relief === 'not_helped' && (i >= SEVERE || changed)) || (i >= SEVERE && changed)) {
      const t: Trigger[] = [{ key: 'pain_level', params: { n: i } }];
      if (e.pain_relief === 'not_helped') t.push({ key: 'relief_not_helped' });
      if (changed) t.push({ key: `pattern_${e.pain_pattern}` });
      return { priority: 'prompt', variant: 'severe', triggers: t, actions: ['find_pro', 'emergency', 'learn', 'edit'] };
    }
    return null;
  },
};

/** Cycles (repérés par le début des règles) avec une douleur forte enregistrée. */
export function painfulCycles(ctx: AdviceContext, threshold = 6): string[] {
  const starts = ctx.data.periods.map((p) => p.start_date).sort();
  const cycles = new Set<string>();
  for (const p of ctx.data.pain) {
    if ((p.pain_intensity ?? 0) < threshold) continue;
    const s = [...starts].reverse().find((x) => x <= p.logged_on) ?? 'avant';
    cycles.add(s);
  }
  return [...cycles];
}

export const painConsult: Rule<PainEvent> = {
  id: 'pain_consult', group: 'pain', appliesTo: 'pain',
  uses: ['pain_impact', 'pain_pattern', 'pain_onset', 'pain_associated', 'historique des douleurs'],
  guards: ['critères plus pressants remplis', 'aucun retentissement, douleur habituelle, aucun signe associé'],
  variants: ['impact', 'changed', 'signs', 'recurring', 'strong'],
  sources: ['nhsPeriodPain', 'santeFrDysmenorrhea'], reviewedOn: R,
  evaluate(e, ctx) {
    if (!hasPain(e) || painEmergency.evaluate(e, ctx) || painPrompt.evaluate(e, ctx)) return null;
    const i = e.pain_intensity!;
    const impact = (e.pain_impact ?? []).filter((x) => x !== 'none');
    const a = e.pain_associated ?? [];
    const signs = a.filter((x) => x === 'outside_period' || x === 'painful_sex' || x === 'unusual_bleeding');
    if (e.pain_onset === 'outside_period' && !signs.includes('outside_period')) signs.push('outside_period');
    if (signs.length) return { priority: 'consult', variant: 'signs', triggers: signs.map((k) => ({ key: k })), actions: ['find_pro', 'learn', 'edit'] };
    if (e.pain_pattern === 'new' || e.pain_pattern === 'worse') return { priority: 'consult', variant: 'changed', triggers: [{ key: `pattern_${e.pain_pattern}` }, { key: 'pain_level', params: { n: i } }], actions: ['find_pro', 'learn', 'edit'] };
    if (impact.length && i > 0) return { priority: 'consult', variant: 'impact', triggers: impact.map((k) => ({ key: `impact_${k}` })), actions: ['find_pro', 'learn', 'edit'] };
    const cycles = ctx ? painfulCycles(ctx) : [];
    if (i >= 6 && cycles.length >= 3) return { priority: 'consult', variant: 'recurring', params: { count: cycles.length }, triggers: [{ key: 'painful_cycles', params: { count: cycles.length } }], actions: ['find_pro', 'review'] };
    // Douleur forte, même habituelle : jamais de simple réassurance
    if (i >= SEVERE) return { priority: 'consult', variant: 'strong', triggers: [{ key: 'pain_level', params: { n: i } }, { key: e.pain_relief === 'helped' ? 'relief_helped' : 'relief_unknown' }], actions: ['find_pro', 'learn', 'edit'] };
    return null;
  },
};

export const painComfort: Rule<PainEvent> = {
  id: 'pain_comfort', group: 'pain', appliesTo: 'pain',
  uses: ['pain_intensity', 'pain_pattern', 'pain_impact', 'pain_associated'],
  guards: ['douleur ≥ 7', 'douleur nouvelle ou aggravée', 'retentissement sur le quotidien', 'signe associé', 'grossesse possible'],
  variants: ['default'],
  sources: ['nhsPeriodPain', 'santeFrDysmenorrhea'], reviewedOn: R,
  evaluate(e, ctx) {
    if (!hasPain(e) || e.pain_intensity! === 0) return null;
    if (painEmergency.evaluate(e, ctx) || painPrompt.evaluate(e, ctx) || painConsult.evaluate(e, ctx)) return null;
    if (e.pain_intensity! >= SEVERE) return null;
    return { priority: 'practical', variant: 'default', triggers: [{ key: 'pain_level', params: { n: e.pain_intensity! } }, { key: e.pain_pattern === 'usual' ? 'pattern_usual' : 'pattern_unknown' }], actions: ['learn', 'edit'] };
  },
};

// ---------------------------------------------------------------- pertes
const BLOODY = ['pink', 'brown', 'blood'];
const YG = ['yellowish', 'greenish', 'greyish'];
const noSymptoms = (e: DischargeEvent) => !(e.symptoms ?? []).some((s) => s !== 'none');
const dateOf = (e: DischargeEvent) => e.observed_at.slice(0, 10);

export const disUrgent: Rule<DischargeEvent> = {
  id: 'dis_urgent', group: 'dis-signs', appliesTo: 'discharge',
  uses: ['pregnancy', 'color', 'symptoms'], guards: ['grossesse non possible', 'pas de sang ni de couleur rosée/brune', 'pas de douleur'], variants: ['default'],
  sources: ['nhsPregnancyBleeding', 'nhsEctopic'], reviewedOn: R,
  evaluate(e, ctx) {
    const bloody = BLOODY.includes(e.color ?? '') || has(e.symptoms, 'bleeding');
    const preg = pregnancyFlag(e.pregnancy, ctx, dateOf(e));
    if (preg === 'no' || !bloody || !has(e.symptoms, 'pain', 'pelvic_pain')) return null;
    return { priority: 'emergency', variant: 'default', triggers: [{ key: preg === 'yes' ? 'pregnancy_possible' : 'pregnancy_unknown' }, { key: 'blood_seen' }, { key: 'pain' }], actions: ['emergency', 'edit'] };
  },
};

export const disFever: Rule<DischargeEvent> = {
  id: 'dis_fever', group: 'dis-signs', appliesTo: 'discharge',
  uses: ['symptoms'], guards: ['pas de fièvre déclarée', 'urgence déjà indiquée'], variants: ['default'],
  sources: ['nhsPID'], reviewedOn: R,
  evaluate(e, ctx) {
    if (!has(e.symptoms, 'fever') || disUrgent.evaluate(e, ctx)) return null;
    // Sang avec grossesse possible : le message « grossesse » (dis_blood) est prioritaire, la fièvre y est ajoutée
    if ((BLOODY.includes(e.color ?? '') || has(e.symptoms, 'bleeding')) && pregnancyFlag(e.pregnancy, ctx, dateOf(e)) === 'yes') return null;
    const t: Trigger[] = [{ key: 'fever' }];
    if (has(e.symptoms, 'pelvic_pain', 'pain')) t.push({ key: 'pain' });
    return { priority: 'prompt', variant: 'default', triggers: t, actions: ['find_pro', 'emergency', 'edit'] };
  },
};

export const disBlood: Rule<DischargeEvent> = {
  id: 'dis_blood', group: 'dis-signs', appliesTo: 'discharge',
  uses: ['color', 'symptoms', 'pregnancy', 'règles enregistrées'], guards: ['pas de sang ni de couleur rosée/brune', 'urgence déjà indiquée'],
  variants: ['near_period', 'pregnancy', 'pain', 'unexplained'],
  sources: ['nhsBleeding', 'nhsPregnancyBleeding'], reviewedOn: R,
  evaluate(e, ctx) {
    const bloody = BLOODY.includes(e.color ?? '') || has(e.symptoms, 'bleeding');
    if (!bloody || disUrgent.evaluate(e, ctx)) return null;
    const t: Trigger[] = [{ key: 'blood_seen' }];
    if (pregnancyFlag(e.pregnancy, ctx, dateOf(e)) === 'yes') return { priority: 'prompt', variant: 'pregnancy', triggers: [...t, { key: 'pregnancy_possible' }, ...(has(e.symptoms, 'fever') ? [{ key: 'fever' }] : [])], actions: ['find_pro', 'emergency', 'edit'] };
    if (has(e.symptoms, 'pain', 'pelvic_pain')) return { priority: 'consult', variant: 'pain', triggers: [...t, { key: 'pain' }], actions: ['find_pro', 'learn', 'edit'] };
    if (ctx.nearRecordedPeriod(dateOf(e))) return { priority: 'info', variant: 'near_period', triggers: [...t, { key: 'near_period' }], actions: ['learn'] };
    return { priority: 'followup', variant: 'unexplained', triggers: t, actions: ['edit', 'find_pro', 'learn'], clarify: 'blood_context' };
  },
};

export const disSigns: Rule<DischargeEvent> = {
  id: 'dis_signs', group: 'dis-signs', appliesTo: 'discharge',
  uses: ['symptoms', 'odor', 'color'],
  guards: ['ni démangeaison, brûlure, irritation, douleur, gêne urinaire, douleur pendant les rapports', 'odeur habituelle', 'règle plus pressante remplie'],
  variants: ['itch', 'odor', 'pain'],
  sources: ['nhsDischarge', 'acogVaginitis'], reviewedOn: R,
  evaluate(e, ctx) {
    if (disUrgent.evaluate(e, ctx) || disFever.evaluate(e, ctx)) return null;
    const s = e.symptoms ?? [];
    const itch = s.filter((x) => x === 'itching' || x === 'burning' || x === 'irritation');
    const pain = s.filter((x) => x === 'pain' || x === 'pelvic_pain' || x === 'urinary' || x === 'painful_sex');
    const odd = e.odor === 'unusual' || e.odor === 'unpleasant' || (e.odor === 'stronger' && (itch.length || pain.length));
    const t: Trigger[] = [...itch, ...pain].map((k) => ({ key: k }));
    if (odd) t.push({ key: `odor_${e.odor}` });
    if (YG.includes(e.color ?? '')) t.push({ key: 'color_yg' });
    if (itch.length) return { priority: 'consult', variant: 'itch', triggers: t, actions: ['learn', 'find_pro', 'edit'] };
    if (pain.length) return { priority: 'consult', variant: 'pain', triggers: t, actions: ['find_pro', 'learn', 'edit'] };
    if (odd) return { priority: 'consult', variant: 'odor', triggers: t, actions: ['learn', 'find_pro', 'edit'] };
    return null;
  },
};

export const disColor: Rule<DischargeEvent> = {
  id: 'dis_color', group: 'dis-signs', appliesTo: 'discharge',
  uses: ['color'], guards: ['couleur ni jaunâtre, ni verdâtre, ni grisâtre', 'autre signe déclaré (→ dis_signs)'], variants: ['alone'],
  sources: ['nhsDischarge'], reviewedOn: R,
  evaluate(e, ctx) {
    if (!YG.includes(e.color ?? '') || disSigns.evaluate(e, ctx) || disFever.evaluate(e, ctx) || disUrgent.evaluate(e, ctx)) return null;
    return { priority: 'followup', variant: 'alone', triggers: [{ key: 'color_yg' }], actions: ['learn', 'edit'] };
  },
};

export const disInfo: Rule<DischargeEvent> = {
  id: 'dis_info', group: 'dis-info', appliesTo: 'discharge',
  uses: ['color', 'textures', 'odor', 'symptoms', 'fenêtre fertile estimée'],
  guards: ['symptôme associé', 'odeur inhabituelle', 'couleur jaunâtre/verdâtre/grisâtre', 'sang'],
  variants: ['clear_fertile', 'clear', 'white'],
  sources: ['nhsDischarge'], reviewedOn: R,
  evaluate(e, ctx) {
    if (!noSymptoms(e) || e.odor === 'unusual' || e.odor === 'unpleasant' || e.odor === 'stronger' || YG.includes(e.color ?? '') || BLOODY.includes(e.color ?? '')) return null;
    const tx = e.textures ?? [];
    const clear = e.color === 'clear' || has(tx, 'elastic', 'stringy', 'slippery', 'watery');
    const white = e.color === 'white' || e.color === 'creamy_white' || e.color === 'milky' || has(tx, 'creamy');
    if (clear) {
      const f = ctx.fertileStatusOn(dateOf(e));
      const fertile = f.status === 'in' || f.status === 'near';
      return { priority: 'info', variant: fertile ? 'clear_fertile' : 'clear', triggers: [{ key: 'clear_stretchy' }, ...(fertile ? [{ key: 'fertile_in' }] : [])], actions: ['learn'] };
    }
    if (white) return { priority: 'info', variant: 'white', triggers: [{ key: 'white_creamy' }], actions: ['learn'] };
    return null;
  },
};

// ---------------------------------------------------------------- saignements inhabituels
export const bleedOrient: Rule<BleedingEvent> = {
  id: 'bleed', group: 'bleed', appliesTo: 'bleeding',
  uses: ['kind', 'amount', 'pain', 'pregnancy'], guards: ['aucun'], variants: ['urgent', 'pregnancy', 'consult', 'note'],
  sources: ['nhsBleeding', 'nhsPregnancyBleeding'], reviewedOn: R,
  evaluate(b, ctx) {
    const pregnant = b.kind === 'during_pregnancy' || pregnancyFlag(b.pregnancy, ctx, b.occurred_on) === 'yes';
    const heavy = b.amount === 'heavy' || b.amount === 'very_heavy';
    const t: Trigger[] = [{ key: `bleed_${b.kind}` }];
    if (heavy) t.push({ key: 'heavy' });
    if (b.pain) t.push({ key: 'pain' });
    if (b.amount === 'very_heavy' || (pregnant && (heavy || b.pain))) return { priority: 'emergency', variant: 'urgent', triggers: t, actions: ['emergency', 'edit'] };
    if (pregnant) return { priority: 'prompt', variant: 'pregnancy', triggers: [...t, { key: 'pregnancy_possible' }], actions: ['find_pro', 'emergency', 'edit'] };
    if (b.kind === 'between_periods' || b.kind === 'after_sex' || b.kind === 'unknown_origin' || b.pain) return { priority: 'consult', variant: 'consult', triggers: t, actions: ['find_pro', 'learn', 'edit'] };
    return { priority: 'info', variant: 'note', triggers: t, actions: ['edit'] };
  },
};

// ---------------------------------------------------------------- cycle
export interface CycleEvent { id: 'current'; today: string }
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);
const lastStart = (ctx: AdviceContext) => ctx.data.periods.map((p) => p.start_date).filter((s) => s <= ctx.today).sort().pop() ?? null;

export const cycleAbsent: Rule<CycleEvent> = {
  id: 'cycle_absent', group: 'cycle-timing', appliesTo: 'cycle',
  uses: ['dernières règles enregistrées'], guards: ['grossesse en cours', 'moins de 90 jours'], variants: ['default'],
  sources: ['nhsMissedPeriods'], reviewedOn: R,
  evaluate(_e, ctx) {
    const last = lastStart(ctx);
    if (!last || ctx.pregnant) return null;
    const d = daysBetween(last, ctx.today);
    if (d < 90) return null;
    return { priority: 'consult', variant: 'default', params: { days: d }, triggers: [{ key: 'no_period_days', params: { days: d } }], actions: ['find_pro', 'learn', 'review'] };
  },
};

export const cycleLate: Rule<CycleEvent> = {
  id: 'cycle_late', group: 'cycle-timing', appliesTo: 'cycle',
  uses: ['prochaines règles estimées', 'variabilité', 'rapports enregistrés (facultatif)'],
  guards: ['grossesse en cours', 'estimation impossible', 'retard < 5 jours ou dans la variabilité habituelle', 'absence ≥ 90 jours (→ cycle_absent)'],
  variants: ['possible', 'possible_recent', 'unknown'],
  sources: ['nhsPregnancyTest', 'nhsMissedPeriods'], reviewedOn: R,
  evaluate(_e, ctx): Match | null {
    const next = ctx.estimate.expectedNext;
    const last = lastStart(ctx);
    if (!next || !last || ctx.pregnant || cycleAbsent.evaluate(_e, ctx)) return null;
    const late = daysBetween(next, ctx.today);
    if (late < Math.max(5, ctx.estimate.variability ?? 0)) return null;
    const risky = ctx.data.sex.filter((s) => s.occurred_on >= last && s.kind !== 'other' && s.pregnancy_wish !== 'yes' && (sexRiskFactors(s).length || sexUncertainty(s).length))
      .map((s) => s.occurred_on).sort();
    const triggers: Trigger[] = [{ key: 'late_days', params: { days: late } }, ...(risky.length ? [{ key: 'sex_at_risk_logged' }] : [])];
    if (!risky.length) return { priority: 'followup', variant: 'unknown', params: { days: late }, triggers, actions: ['pregnancy_risk', 'learn', 'review'] };
    // Un test détecte une grossesse au plus tôt ~21 jours après le rapport concerné (NHS) : on le dit pour le plus récent
    const reliableFrom = new Date(Date.parse(`${risky[risky.length - 1]}T00:00:00Z`) + 21 * DAY).toISOString().slice(0, 10);
    if (reliableFrom > ctx.today) return { priority: 'followup', variant: 'possible_recent', params: { days: late, date: reliableFrom }, triggers, actions: ['pregnancy_risk', 'learn', 'review'] };
    return { priority: 'followup', variant: 'possible', params: { days: late }, triggers, actions: ['pregnancy_risk', 'learn', 'review'] };
  },
};

export const cycleIrregular: Rule<CycleEvent> = {
  id: 'cycle_irregular', group: 'cycle-reliability', appliesTo: 'cycle',
  uses: ['fiabilité de l’estimation', 'variabilité'], guards: ['estimation modérément fiable'], variants: ['insufficient', 'irregular'],
  sources: ['nhsMissedPeriods'], reviewedOn: R,
  evaluate(_e, ctx) {
    if (!ctx.data.periods.length) return null;
    if (ctx.estimate.reliability === 'insufficient') return { priority: 'info', variant: 'insufficient', triggers: [{ key: 'few_cycles' }], actions: ['review'] };
    if (ctx.estimate.reliability === 'low') return { priority: 'info', variant: 'irregular', params: { days: ctx.estimate.variability ?? 0 }, triggers: [{ key: 'variable_cycles', params: { days: ctx.estimate.variability ?? 0 } }], actions: ['review'] };
    return null;
  },
};

export const RULES = {
  sex: [sexRisk, sexClarify, sexAfterEc, sexTtc] as Rule<SexEvent>[],
  pain: [painEmergency, painPrompt, painConsult, painComfort] as Rule<PainEvent>[],
  discharge: [disUrgent, disFever, disBlood, disSigns, disColor, disInfo] as Rule<DischargeEvent>[],
  bleeding: [bleedOrient] as Rule<BleedingEvent>[],
  cycle: [cycleAbsent, cycleLate, cycleIrregular] as Rule<CycleEvent>[],
};
export const ALL_RULES = [...RULES.sex, ...RULES.pain, ...RULES.discharge, ...RULES.bleeding, ...RULES.cycle] as Rule<unknown>[];
export type { Match };
