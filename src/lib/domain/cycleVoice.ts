/**
 * Saisie vocale (ou écrite) d'une journée du cycle → pastilles proposées, À CONFIRMER avant tout enregistrement.
 * Reconnaissance par mots-clés, en français et en anglais ; rien n'est deviné au-delà des mots prononcés.
 */
const RULES: [RegExp, string][] = [
  [/\b(r[eè]gles? (ont )?commenc|d[ée]but (de[s]? )?r[eè]gles|period start)/i, 'period_start'],
  [/\b(r[eè]gles? (sont )?termin|fin (de[s]? )?r[eè]gles|period end)/i, 'period_end'],
  [/\b(flux|saignements?) (l[ée]gers?|faibles?)|light flow/i, 'flow_light'],
  [/\b(flux|saignements?) (moyens?|mod[ée]r[ée]s?)|medium flow/i, 'flow_medium'],
  [/\b(flux|saignements?|r[eè]gles) (importants?|abondant(e)?s?|fort(e)?s?)|heavy flow/i, 'flow_heavy'],
  [/\b(petites pertes|spotting)/i, 'spotting'],
  [/\bfuites?\b|\bleak/i, 'leak'],
  [/\bcrampes?|cramps?/i, 'cramps'],
  [/\bmal (au|de) dos|back pain/i, 'back_pain'],
  [/\bmigraines?/i, 'migraine'],
  [/\bmal (à la|de) t[eê]te|maux de t[eê]te|headache/i, 'headache'],
  [/\bdouleurs? pelviennes?|pelvic pain/i, 'pelvic_pain'],
  [/\bseins (sensibles|douloureux)|tender breasts?/i, 'breast_tenderness'],
  [/\bheureuse|happy/i, 'happy'],
  [/\bcalme\b|\bcalm\b/i, 'calm'],
  [/\b[ée]nergique|energetic/i, 'energetic'],
  [/\bsensible\b|\bsensitive/i, 'sensitive'],
  [/\birritable/i, 'irritable'],
  [/\banxieuse|anxi[eé]t[ée]|anxious/i, 'anxious'],
  [/\btriste|\bsad\b/i, 'sad'],
  [/\bstress[ée]e?\b|stressed/i, 'stressed'],
  [/\bmoral (difficile|bas)|feeling low/i, 'low'],
  [/\bballonn|bloat/i, 'bloating'],
  [/\bfatigu|[ée]puis[ée]|tired|fatigue/i, 'fatigue'],
  [/\bnaus[ée]es?|nausea/i, 'nausea'],
  [/\bfringales?|envies? de sucre|cravings?/i, 'cravings'],
  [/\bacn[ée]|boutons?\b|\bacne/i, 'acne'],
  [/\bvertiges?|dizz/i, 'dizziness'],
  [/\bbouff[ée]es? de chaleur|hot flush|hot flash/i, 'hot_flashes'],
  [/\bsommeil difficile|mal dormi|insomni|slept badly|bad sleep/i, 'difficult'],
  [/\b(bien dormi|sommeil r[ée]parateur|slept well)/i, 'restful'],
  [/\bsieste|\bnap\b/i, 'nap'],
  [/\bglaire (transparente|[ée]tirable|blanc d.?oeuf)|egg.?white/i, 'mucus_egg_white'],
  [/\bpertes? cr[ée]meuses?|creamy/i, 'mucus_creamy'],
  [/\bpertes? aqueuses?|watery/i, 'mucus_watery'],
  [/\bsensation s[eè]che|\bdry\b/i, 'mucus_dry'],
  [/\btest d.?ovulation positif|ovulation test positive/i, 'ovu_positive'],
  [/\btest d.?ovulation n[ée]gatif|ovulation test negative/i, 'ovu_negative'],
  [/\bpilule prise|pris (ma|la) pilule|took (my|the) pill/i, 'pill_taken'],
  [/\boubli[ée]? (ma|la) pilule|pilule oubli[ée]e|missed (my|the) pill|forgot (my|the) pill/i, 'pill_missed'],
  [/\bsport\b|exercise|workout/i, 'sport'],
  [/\bmarche\b|\bwalk/i, 'walk'],
  [/\balcool|alcohol/i, 'alcohol'],
];

export interface VoiceParse { pills: string[]; painIntensity: number | null; temperature: number | null }

export function parseCycleVoice(text: string): VoiceParse {
  const s = text.normalize('NFC');
  const pills: string[] = [];
  for (const [re, pill] of RULES) if (re.test(s) && !pills.includes(pill)) pills.push(pill);
  // « pilule oubliée » ne doit pas aussi compter comme « pilule prise »
  if (pills.includes('pill_missed') && pills.includes('pill_taken')) pills.splice(pills.indexOf('pill_taken'), 1);
  let painIntensity: number | null = null;
  const n = s.match(/(\d{1,2})\s*(\/|sur|out of)\s*10/i);
  if (n) painIntensity = Math.min(10, Math.max(1, Number(n[1])));
  else if (/\btr[eè]s (fortes?|intenses?)|very (strong|bad)/i.test(s)) painIntensity = 9;
  else if (/\b(fortes?|intenses?)\b|\bstrong\b|\bbad\b/i.test(s)) painIntensity = 7;
  else if (/\bmod[ée]r[ée]e?s?|moderate/i.test(s)) painIntensity = 5;
  else if (/\bl[ée]g[eè]re?s?|\bmild\b|\blight\b/i.test(s)) painIntensity = 2;
  const hasPain = pills.some((p) => ['cramps', 'back_pain', 'migraine', 'headache', 'pelvic_pain', 'breast_tenderness'].includes(p));
  if (!hasPain) painIntensity = null;
  const tm = s.match(/\b(3[5-9])[.,](\d{1,2})\s*(°|degr)/i);
  const temperature = tm ? Number(`${tm[1]}.${tm[2]}`) : null;
  return { pills, painIntensity, temperature };
}
