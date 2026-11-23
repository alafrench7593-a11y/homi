/** Famille COMPTE (réglages, parcours, modifier, terminer) — entrées de « Mon compte », pas des outils. */
import { circle, n, on, type HomiIconDef } from '../geometry';

/** Roue dentée à 8 dents (dents arrondies par les jonctions du trait). */
function gear() {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = i * 45;
    for (const [r, d] of [[6.4, -15], [8.5, -9], [8.5, 9], [6.4, 15]] as const) {
      const [x, y] = on(12, 12, r, a + d);
      pts.push(`${n(x)} ${n(y)}`);
    }
  }
  return `M${pts.join('L')}Z`;
}
const GEAR = gear();
const SIGNS = 'M5 5h10.5L18 7.5 15.5 10H5zM19 12.5H8.5L6 15l2.5 2.5H19z';
const PENCIL = 'M15.5 4.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z';

export const COMPTE = {
  /** Réglages : la roue dentée. */
  gear: { fill: GEAR, stroke: `${GEAR}${circle(12, 12, 2.75)}` },
  /** Mes parcours : le poteau indicateur. */
  signpost: { fill: SIGNS, stroke: `M12 3v2M12 10v2.5M12 17.5V21M9 21h6${SIGNS}` },
  /** Modifier : le crayon. */
  pencil: { fill: PENCIL, stroke: `${PENCIL}M13.5 6.5l3 3M4 20.5h16` },
} satisfies Record<string, HomiIconDef>;
