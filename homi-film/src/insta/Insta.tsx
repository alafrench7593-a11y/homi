/** Instagram HOMI — gabarits (publication 1080×1350, carrousel, story 1080×1920, couverture de reel, story à la une, reel 15 s).
 *  Tout le contenu vient de data.ts : ces composants sont les modèles réutilisables des prochaines publications. */
import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile } from 'remotion';
import { loadFont } from '@remotion/fonts';
import { T } from '../tokens';
import { AuraRobot, Glass, KText, Logo, Phone3D, prog, spr, useTime } from '../ad/parts';
import { HIGHLIGHTS, POSTS, Post, Slide } from './data';

for (const [w, n] of [['500Medium', 500], ['700Bold', 700], ['800ExtraBold', 800]] as const) {
  loadFont({ family: 'Manrope', url: staticFile(`fonts/Manrope_${w}.ttf`), weight: String(n) }).catch(() => undefined);
}
const INK = '#17161B'; const MUTED = '#8C8796';
/** Une ambiance par colonne de la grille : émotion (chaud), produit (lilas), éducation (nacre). */
const BG = {
  emotion: 'radial-gradient(120% 90% at 20% 0%, #FFF8F1 0%, #F7ECE4 55%, #EFDFD6 100%)',
  produit: 'radial-gradient(120% 90% at 80% 0%, #FBF9FF 0%, #EEE9F8 55%, #E3DCF2 100%)',
  education: 'radial-gradient(120% 90% at 50% 0%, #FFFFFF 0%, #F4F3F6 60%, #ECEBF0 100%)',
  nuit: 'radial-gradient(110% 85% at 50% 30%, #2A2440 0%, #17141F 65%, #0E0C14 100%)',
};
const Frame: React.FC<{ bg: string; children: React.ReactNode; dark?: boolean }> = ({ bg, children, dark }) => (
  <AbsoluteFill style={{ background: bg, fontFamily: `${T.font}, sans-serif`, color: dark ? '#F4F2F8' : INK, overflow: 'hidden' }}>{children}</AbsoluteFill>
);
const Tag: React.FC<{ text: string; x: number; y: number; dark?: boolean }> = ({ text, x, y, dark }) => (
  <div style={{ position: 'absolute', left: x, top: y, padding: '12px 24px', borderRadius: 99, fontSize: 26, fontWeight: 800, letterSpacing: '0.02em',
    background: dark ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.75)', border: `1.5px solid ${dark ? 'rgba(255,255,255,.2)' : 'rgba(255,255,255,.95)'}`, color: dark ? '#E7E3F2' : '#5E5A66' }}>{text}</div>
);
const Brand: React.FC<{ x: number; y: number; dark?: boolean; h?: number }> = ({ x, y, dark, h = 44 }) => (
  <div style={{ position: 'absolute', left: x, top: y }}><Logo h={h} color={dark ? 'white' : undefined} /></div>
);
const Hook: React.FC<{ text: string; x: number; y: number; w: number; size: number; align?: 'left' | 'center'; dark?: boolean }> = ({ text, x, y, w, size, align = 'left', dark }) => {
  // dernière phrase en gris (signature Keynote) quand l'accroche en compte deux
  text = text.replace(/ ([?!:;»])/g, '\u00A0$1').replace(/« /g, '«\u00A0');
  const parts = text.match(/[^.?!]+[.?!»]*\s*/g) ?? [text];
  const head = parts.length > 1 ? parts.slice(0, -1).join('') : text; const tail = parts.length > 1 ? parts[parts.length - 1] : '';
  return <div style={{ position: 'absolute', left: x, top: y, width: w, fontSize: size, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1.04, textAlign: align }}>
    {head}{tail ? <span style={{ color: dark ? '#A9A2BD' : MUTED }}>{tail}</span> : null}
  </div>;
};
const Chip: React.FC<{ text: string; x: number; y: number; dark?: boolean; w?: number }> = ({ text, x, y, dark, w }) => (
  <Glass x={x} y={y} w={w ?? Math.min(440, 60 + text.length * 17)} h={76} r={26} dark={dark} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 27, fontWeight: 800, color: dark ? '#F4F2F8' : INK }}>{text}</Glass>
);
const art = (a?: string) => (a ? `art/${a}.webp` : '');

/* ───────── Publication 1080×1350 ───────── */
export const PostVisual: React.FC<{ n: number }> = ({ n }) => {
  const p = POSTS.find((x) => x.n === n)!;
  if (p.kind === 'emotion') return (
    <Frame bg={BG.emotion}>
      <div style={{ position: 'absolute', right: -60, bottom: -40, width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,226,190,.7), transparent 65%)' }} />
      {p.robot ? <Img src={staticFile('aura/aura-greet-0.png')} style={{ position: 'absolute', right: 40, bottom: 120, width: 640, height: 640 }} />
        : <Img src={staticFile(art(p.art))} style={{ position: 'absolute', right: -10, bottom: 0, width: 700, height: 700, objectFit: 'contain' }} />}
      <Tag text={p.sujet} x={80} y={84} />
      <Hook text={p.accroche} x={80} y={190} w={880} size={p.accroche.length > 40 ? 82 : 96} />
      {p.sous ? <div style={{ position: 'absolute', left: 80, top: p.accroche.length > 40 ? 560 : 470, width: 560, fontSize: 34, fontWeight: 600, color: '#5E5A66', lineHeight: 1.3 }}>{p.sous}</div> : null}
      <Brand x={80} y={1240} />
    </Frame>
  );
  if (p.kind === 'produit') {
    const dark = !!p.dark;
    return (
      <Frame bg={dark ? BG.nuit : BG.produit} dark={dark}>
        <Hook text={p.accroche} x={80} y={90} w={920} size={p.accroche.length > 40 ? 72 : 84} dark={dark} />
        {p.screen2 ? (<>
          <Phone3D x={380} y={880} w={350} rotY={12} src={p.screen} dark={dark} />
          <Phone3D x={720} y={900} w={350} rotY={-12} src={p.screen2} dark={dark} />
        </>) : <Phone3D x={560} y={890} w={430} rotY={-10} rotX={3} src={p.screen} dark={dark} />}
        {p.robot ? <Img src={staticFile('aura/aura-answer-0.png')} style={{ position: 'absolute', left: 40, top: 860, width: 260, height: 260 }} /> : null}
        {(p.chips ?? []).map((c, i) => <Chip key={c} text={c} dark={dark} x={i === 1 ? 830 : i === 0 ? 290 : 800} y={[700, 940, 1170][i]} />)}
        <Brand x={80} y={1250} dark={dark} h={40} />
      </Frame>
    );
  }
  return <Carousel n={n} i={0} />;
};

/* ───────── Carrousel (éducation) : couverture, 3 diapositives, appel à l'action ───────── */
export const Carousel: React.FC<{ n: number; i: number }> = ({ n, i }) => {
  const p = POSTS.find((x) => x.n === n)!;
  const slides = p.slides ?? [];
  const total = slides.length + 2;
  const dots = <div style={{ position: 'absolute', left: 0, right: 0, bottom: 70, display: 'flex', justifyContent: 'center', gap: 12 }}>{Array.from({ length: total }).map((_, k) => <div key={k} style={{ width: k === i ? 34 : 12, height: 12, borderRadius: 9, background: k === i ? INK : 'rgba(23,22,27,.18)' }} />)}</div>;
  if (i === 0) return (
    <Frame bg={BG.education}>
      {p.art ? <Img src={staticFile(art(p.art))} style={{ position: 'absolute', right: -40, bottom: 120, width: 640, height: 640, objectFit: 'contain', opacity: 0.95 }} /> : null}
      <Tag text={p.sujet} x={80} y={84} />
      <Hook text={p.accroche} x={80} y={190} w={900} size={p.accroche.length > 40 ? 84 : 98} />
      {p.sous ? <div style={{ position: 'absolute', left: 80, top: 640, width: 470, fontSize: 36, fontWeight: 700, color: '#4E4A57', lineHeight: 1.25 }}>{p.sous}</div> : null}
      <div style={{ position: 'absolute', left: 80, top: 820, padding: '16px 30px', borderRadius: 99, background: INK, color: '#fff', fontSize: 30, fontWeight: 800 }}>Glissez →</div>
      <Brand x={80} y={1180} h={44} />{dots}
    </Frame>
  );
  if (i === total - 1) return (
    <Frame bg={BG.emotion}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 420, display: 'flex', justifyContent: 'center' }}><Logo h={120} /></div>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 600, textAlign: 'center', fontSize: 52, fontWeight: 800, letterSpacing: '-0.035em' }}>La famille, autrement.</div>
      <div style={{ position: 'absolute', left: 120, right: 120, top: 720, textAlign: 'center', fontSize: 34, fontWeight: 600, color: '#5E5A66', lineHeight: 1.3 }}>{p.cta}</div>
      {dots}
    </Frame>
  );
  const s: Slide = slides[i - 1];
  return (
    <Frame bg={BG.education}>
      <div style={{ position: 'absolute', left: 80, top: 90, fontSize: 28, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8E7AE0' }}>{s.kicker}</div>
      <div style={{ position: 'absolute', left: 80, top: 150, width: s.screen ? 560 : 920, fontSize: s.screen ? 58 : 70, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.06 }}>{s.title}</div>
      <div style={{ position: 'absolute', left: 80, top: s.screen ? 560 : 520, width: s.screen ? 520 : 880, fontSize: 34, fontWeight: 600, color: '#4E4A57', lineHeight: 1.35 }}>{s.body}</div>
      {s.screen ? <Phone3D x={820} y={760} w={380} rotY={-12} src={s.screen} /> : null}
      {(s.chips ?? []).map((c, k) => <Chip key={c} text={c} x={300 + k * 470} y={880} w={420} />)}
      <Brand x={80} y={1180} h={40} />{dots}
    </Frame>
  );
};

/* ───────── Story 1080×1920 (zones sûres : 250 px en haut et en bas) ───────── */
export const Story: React.FC<{ n: number }> = ({ n }) => {
  const p = POSTS.find((x) => x.n === n)!;
  const dark = !!p.dark;
  return (
    <Frame bg={dark ? BG.nuit : BG[p.kind]} dark={dark}>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 300, textAlign: 'center', fontSize: 88, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1.04 }}>
        {p.story.haut}<br /><span style={{ color: dark ? '#A9A2BD' : MUTED }}>{p.story.bas}</span>
      </div>
      {p.screen && p.kind === 'produit' ? <Phone3D x={540} y={1075} w={430} src={p.screen} dark={dark} />
        : p.robot ? <Img src={staticFile('aura/aura-greet-0.png')} style={{ position: 'absolute', left: 190, top: 720, width: 700, height: 700 }} />
        : p.art ? <Img src={staticFile(art(p.art))} style={{ position: 'absolute', left: 120, top: 700, width: 840, height: 840, objectFit: 'contain' }} />
        : p.slides?.[0]?.screen ? <Phone3D x={540} y={1075} w={430} src={p.slides[0].screen} /> : null}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1575, display: 'flex', justifyContent: 'center' }}>
        <div style={{ padding: '18px 36px', borderRadius: 99, background: dark ? '#fff' : INK, color: dark ? INK : '#fff', fontSize: 32, fontWeight: 800 }}>Découvrir HOMI</div>
      </div>
    </Frame>
  );
};

/* ───────── Couverture de reel : l'essentiel dans le centre 1080×1350 (vue grille du profil) ───────── */
export const ReelCover: React.FC<{ n: number }> = ({ n }) => {
  const p = POSTS.find((x) => x.n === n)!;
  const dark = !!p.dark;
  return (
    <Frame bg={dark ? BG.nuit : BG.produit} dark={dark}>
      <Hook text={p.accroche} x={80} y={330} w={920} size={p.accroche.length > 40 ? 76 : 88} dark={dark} align="center" />
      <Phone3D x={540} y={1180} w={420} src={p.screen} dark={dark} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1700, textAlign: 'center', fontSize: 30, fontWeight: 800, color: dark ? '#CFC9DE' : '#5E5A66' }}>▶ Reel · 15 s</div>
    </Frame>
  );
};

/* ───────── Story à la une : cercle central (Instagram recadre en rond) ───────── */
const ICONS: Record<string, { bg: [string, string]; ink: string; d: string; line?: boolean }> = {
  heart: { bg: ['#FBE8F1', '#F2C6DC'], ink: '#8E2A5A', d: 'M32 50S12 38 12 25a10 10 0 0 1 20-3a10 10 0 0 1 20 3c0 13-20 25-20 25z' },
  star: { bg: ['#F6EFE4', '#E9CFA4'], ink: '#76561D', d: 'M32 12l6 13l14 2l-10 10l3 14l-13-7l-13 7l3-14l-10-10l14-2z' },
};
export const Highlight: React.FC<{ id: string }> = ({ id }) => {
  const h = HIGHLIGHTS.find((x) => x.id === id)!;
  const ic = h.preset ? ICONS[h.preset] : null;
  return (
    <Frame bg="linear-gradient(160deg, #F7F2FB 0%, #EADFF2 100%)">
      <div style={{ position: 'absolute', left: 140, top: 560, width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #FFFFFF, #F3ECF8 60%, #E6DCF0)', boxShadow: 'inset 0 0 0 3px rgba(255,255,255,.9), 0 40px 80px -30px rgba(80,60,120,.35)', overflow: 'hidden' }}>
        {h.robot ? <Img src={staticFile('aura/aura-greet-0.png')} style={{ position: 'absolute', left: 90, top: 90, width: 620, height: 620 }} />
          : ic ? <svg viewBox="0 0 64 64" style={{ position: 'absolute', left: 170, top: 170, width: 460, height: 460 }}><defs><linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={ic.bg[0]} /><stop offset="1" stopColor={ic.bg[1]} /></linearGradient></defs><circle cx="32" cy="32" r="32" fill="url(#hg)" /><path d={ic.d} fill={ic.ink} /></svg>
          : h.id === 'grossesse' ? <Img src={staticFile(h.art!)} style={{ position: 'absolute', left: -80, top: -80, width: 960, height: 960, objectFit: 'cover' }} />
          : <Img src={staticFile(h.art!)} style={{ position: 'absolute', left: 60, top: 70, width: 680, height: 680, objectFit: 'contain' }} />}
        {h.id === 'faq' ? null : null}
      </div>
    </Frame>
  );
};

/* ───────── Reel produit 15 s, 60 i/s ───────── */
export const Reel: React.FC<{ n: number }> = ({ n }) => {
  const { t, fps } = useTime();
  const p = POSTS.find((x) => x.n === n)!;
  const dark = !!p.dark;
  const ph = spr(t, 2.6, fps, 18, 1); const end = prog(t, 11.2, 11.8);
  const logo = spr(t, 11.8, fps, 14);
  return (
    <Frame bg={dark ? BG.nuit : BG.produit} dark={dark}>
      <Audio src={staticFile(`audio/reel-${String(n).padStart(2, '0')}.wav`)} />
      {[{ c: dark ? 'rgba(140,120,230,.25)' : 'rgba(185,166,255,.35)', x: 0.25, y: 0.3 }, { c: dark ? 'rgba(90,140,220,.18)' : 'rgba(255,199,225,.35)', x: 0.8, y: 0.7 }].map((b, k) => (
        <div key={k} style={{ position: 'absolute', left: (b.x + Math.sin(t * 0.5 + k * 2) * 0.12) * 1080 - 700, top: (b.y + Math.cos(t * 0.4 + k) * 0.08) * 1920 - 700, width: 1400, height: 1400, borderRadius: '50%', background: `radial-gradient(circle, ${b.c}, transparent 65%)` }} />
      ))}
      <KText t={t} at={0.25} out={11.0} x={540} y={860 - prog(t, 2.2, 3.0) * 530 - Math.min(t, 2.2) * 12} size={(96 - prog(t, 2.2, 3.0) * 24) * (1 + Math.min(t, 2.2) * 0.02)} w={960} color={dark ? '#F4F2F8' : INK}>{p.accroche}</KText>
      <div style={{ opacity: 1 - end, filter: end ? `blur(${end * 12}px)` : undefined }}>
        {p.screen2 ? (<>
          <Phone3D x={330} y={1150 + (1 - ph) * 1500} w={380} rotY={12 + Math.sin(t * 0.9) * 5} src={p.screen} dark={dark} />
          <Phone3D x={750} y={1170 + (1 - spr(t, 2.8, fps, 18, 1)) * 1500} w={380} rotY={-12 + Math.sin(t * 0.9 + 1) * 5} src={p.screen2} dark={dark} />
        </>) : <Phone3D x={540} y={1180 + (1 - ph) * 1500} w={500} rotY={-8 + Math.sin(t * 0.8) * 4} rotX={3} src={p.screen} dark={dark} />}
        {p.robot ? <AuraRobot t={t} x={210} y={1500} size={300} state={t < 6 ? 'listening' : t < 7 ? 'thinking' : 'answer'} since={t < 6 ? 0 : t < 7 ? 6 : 7} o={prog(t, 4.5, 5)} /> : null}
        {(p.chips ?? []).map((c, i) => {
          const s = spr(t, 4.2 + i * 1.3, fps, 14);
          return <Glass key={c} x={[300, 780, 540][i]} y={[520, 600, 1770][i]} w={Math.min(480, 70 + c.length * 18)} h={84} o={s} s={0.8 + s * 0.2} r={28} dark={dark}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 29, fontWeight: 800, color: dark ? '#F4F2F8' : INK }}>{c}</Glass>;
        })}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 820, display: 'flex', justifyContent: 'center', opacity: logo, transform: `scale(${(0.85 + logo * 0.15) * (1 + Math.max(0, t - 12) * 0.03)})` }}><Logo h={130} color={dark ? 'white' : undefined} /></div>
      <div style={{ position: 'absolute', left: 80, right: 80, top: 1010, textAlign: 'center', fontSize: 44, fontWeight: 700, color: dark ? '#CFC9DE' : MUTED, opacity: prog(t, 12.3, 12.9) }}>La famille, autrement.</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1150, display: 'flex', justifyContent: 'center', opacity: prog(t, 12.8, 13.3) }}>
        <div style={{ padding: '18px 36px', borderRadius: 99, background: dark ? '#fff' : INK, color: dark ? INK : '#fff', fontSize: 32, fontWeight: 800 }}>Lien en bio</div>
      </div>
    </Frame>
  );
};
export const REEL_POSTS = POSTS.filter((p) => p.reel).map((p) => p.n);
export const CAROUSELS = POSTS.filter((p) => p.slides).map((p) => ({ n: p.n, count: (p.slides?.length ?? 0) + 2 }));
