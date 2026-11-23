/**
 * Minimisation (audit du 23/11/2026) : les prénoms du foyer (enfants, membres) ne partent JAMAIS chez le fournisseur
 * d'IA. Ils sont remplacés par des jetons « [P1] », « [P2] »… dans tout ce qui est envoyé (message, brouillon,
 * historique), puis remis à leur place dans la réponse et les actions proposées. Comparaison sans accents ni casse,
 * mots entiers seulement (« Lina » masqué, « Linaire » intact).
 */
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export interface Pseudonymizer { mask(text: string): string; unmask(text: string): string; count: number }

export function pseudonymizer(rawNames: (string | null | undefined)[]): Pseudonymizer {
  const names = [...new Set(rawNames.map((n) => (n ?? '').trim()).filter((n) => n.length >= 2))]
    .sort((a, b) => b.length - a.length); // « Marie-Lou » avant « Marie »
  const tokens = names.map((_, i) => `[P${i + 1}]`);
  // Le texte est replié (accents, casse) pour la recherche ; les positions restent celles du texte d'origine
  const res = names.map((n) => new RegExp(`(^|[^\\p{L}\\p{N}])(${esc(fold(n))})(?=$|[^\\p{L}\\p{N}])`, 'gu'));
  return {
    count: names.length,
    mask(text: string) {
      if (!text || !names.length) return text;
      let out = text;
      res.forEach((re, i) => {
        const f = fold(out);
        if (f.length !== out.length) return; // repli non aligné (rare) : on garde le chemin sûr ci-dessous
        let res2 = ''; let last = 0; let m: RegExpExecArray | null; re.lastIndex = 0;
        while ((m = re.exec(f))) { const start = m.index + m[1].length; res2 += out.slice(last, start) + tokens[i]; last = start + m[2].length; }
        out = res2 + out.slice(last);
      });
      // Chemin sûr si le repli change la longueur : remplacement direct, insensible à la casse
      names.forEach((n, i) => { out = out.replace(new RegExp(`(^|[^\\p{L}\\p{N}])${esc(n)}(?=$|[^\\p{L}\\p{N}])`, 'giu'), `$1${tokens[i]}`); });
      return out;
    },
    unmask(text: string) {
      if (!text || !names.length) return text;
      return text.replace(/\[P(\d{1,3})\]/g, (all, d) => names[Number(d) - 1] ?? all);
    },
  };
}
