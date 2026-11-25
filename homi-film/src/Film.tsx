/** Film HOMI : 13 scènes en séquence (minutage dans data/script.ts), sous-titres, mise à l'échelle 1920×1080 → sortie. */
import React from 'react';
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/fonts';
import { SCENES } from './data/script';
import { Captions } from './components/kit';
import { S01, S02, S03, S04, S05 } from './scenes/A';
import { S06, S07, S08, S09 } from './scenes/B';
import { S10, S11, S12, S13 } from './scenes/C';
import { T } from './tokens';

const MAP: Record<string, React.FC> = { s01: S01, s02: S02, s03: S03, s04: S04, s05: S05, s06: S06, s07: S07, s08: S08, s09: S09, s10: S10, s11: S11, s12: S12, s13: S13 };
const DARK = new Set(['s06', 's07']);
// scènes où le texte est déjà à l'écran (logo, phrase finale) : pas de sous-titre incrusté (il reste dans le SRT)
const NO_CAPTION_OVERLAY = new Set(['s13']);

// Polices : chargeur officiel (gère lui-même l'attente du rendu, onglet par onglet)
for (const [w, n] of [['500Medium', 500], ['700Bold', 700], ['800ExtraBold', 800]] as const) {
  loadFont({ family: 'Manrope', url: staticFile(`fonts/Manrope_${w}.ttf`), weight: String(n) }).catch(() => undefined);
}

export const Film: React.FC<{ captions?: boolean; only?: string }> = ({ captions = true, only }) => {
  const { fps, width } = useVideoConfig();
  const k = width / T.W;
  const list = only ? SCENES.filter((s) => s.id === only) : SCENES;
  const base = only ? list[0].from : 0;
  return (
    <AbsoluteFill style={{ background: T.bg }}>
      <div style={{ width: T.W, height: T.H, transform: `scale(${k})`, transformOrigin: 'top left', position: 'relative', fontFamily: `${T.font}, sans-serif` }}>
        {list.map((s) => {
          const C = MAP[s.id];
          return <Sequence key={s.id} from={Math.round((s.from - base) * fps)} durationInFrames={Math.round((s.to - s.from) * fps)} name={`${s.id} · ${s.title}`}>
            <C />
            {captions && !NO_CAPTION_OVERLAY.has(s.id) ? <Captions dark={DARK.has(s.id)} cues={(s.vo ?? []).map((c) => ({ ...c, from: c.from - s.from, to: c.to - s.from }))} /> : null}
          </Sequence>;
        })}
      </div>
    </AbsoluteFill>
  );
};
