/** Pub 30 s — briques visuelles : temps, textes cinématiques, iPhone 3D, verre liquide, sphère d'Aura, fond. Tout est déterministe (aucun hasard). */
import React from 'react';
import { Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { T } from '../tokens';

export type L = { W: number; H: number; v: boolean };
const EASE = Easing.bezier(0.22, 0.9, 0.24, 1);
export const prog = (t: number, a: number, b: number, e = EASE) =>
  interpolate(t, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e });
export const mix = (p: number, a: number, b: number) => a + (b - a) * p;
/** Enveloppe d'apparition/disparition (0→1→0). */
export const win = (t: number, a: number, b: number, fi = 0.35, fo = 0.35) => Math.min(prog(t, a, a + fi), 1 - prog(t, b - fo, b));

export function useTime() {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return { t: f / fps, fps };
}
export const spr = (t: number, at: number, fps: number, damping = 16, mass = 0.8) =>
  t < at ? 0 : spring({ frame: (t - at) * fps, fps, config: { damping, mass, stiffness: 140 } });

/** Texte façon keynote : flou → net en montant, sortie floue vers le haut. */
export const KText: React.FC<{ t: number; at: number; out?: number; x: number; y: number; size: number; w?: number; align?: 'left' | 'center'; color?: string; weight?: number; children: React.ReactNode; spacing?: string }> =
  ({ t, at, out = 99, x, y, size, w, align = 'center', color = T.ink, weight = 800, children, spacing = '-0.045em' }) => {
    const i = prog(t, at, at + 0.55); const o = prog(t, out, out + 0.4);
    if (i <= 0 || o >= 1) return null;
    const width = w ?? 1800;
    return (
      <div style={{ position: 'absolute', left: align === 'center' ? x - width / 2 : x, top: y, width, textAlign: align, fontSize: size, fontWeight: weight, color, letterSpacing: spacing, lineHeight: 1.06,
        opacity: i * (1 - o), filter: `blur(${(1 - i) * 16 + o * 14}px)`, transform: `translateY(${(1 - i) * size * 0.35 - o * size * 0.3}px) translateY(-50%)` }}>{children}</div>
    );
  };

/** Fond nacré avec halos lents (ou nuit pour Aura). */
export const Backdrop: React.FC<{ t: number; l: L; dark: number }> = ({ t, l, dark }) => {
  const blobs = [
    { c: 'rgba(185,166,255,.28)', x: 0.2, y: 0.25, r: 0.55, s: 0.13 },
    { c: 'rgba(127,209,255,.22)', x: 0.82, y: 0.3, r: 0.5, s: 0.11 },
    { c: 'rgba(255,199,225,.24)', x: 0.55, y: 0.85, r: 0.6, s: 0.09 },
  ];
  const D = Math.max(l.W, l.H);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(120% 90% at 30% 10%, ${T.bg2} 0%, ${T.bg} 65%)` }} />
      {blobs.map((b, k) => (
        <div key={k} style={{ position: 'absolute', left: (b.x + Math.sin(t * b.s * 3 + k) * 0.05) * l.W - b.r * D / 2, top: (b.y + Math.cos(t * b.s * 2.4 + k) * 0.05) * l.H - b.r * D / 2,
          width: b.r * D, height: b.r * D, borderRadius: '50%', background: `radial-gradient(circle, ${b.c}, transparent 65%)` }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, opacity: dark, background: `radial-gradient(110% 80% at 50% 38%, #1C1A2A 0%, #0D0D12 62%, #08080B 100%)` }} />
    </div>
  );
};

/** iPhone 3D : cadre titane, verre, Dynamic Island, reflet qui suit la rotation, ombre portée. Écran = capture réelle ou interface en points (390×844). */
export const Phone3D: React.FC<{ x: number; y: number; w: number; rotY?: number; rotX?: number; rotZ?: number; scale?: number; opacity?: number; blur?: number; src?: string; src2?: string; swap?: number; children?: React.ReactNode; dark?: boolean }> =
  ({ x, y, w, rotY = 0, rotX = 0, rotZ = 0, scale = 1, opacity = 1, blur = 0, src, src2, swap = 0, children, dark }) => {
    const h = w * 2.06; const bez = w * 0.032; const innerW = w - bez * 2; const k = innerW / 390;
    const glare = 50 + rotY * 2.2;
    if (opacity <= 0.001) return null;
    return (
      <div style={{ position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, opacity, perspective: w * 4.5, filter: blur ? `blur(${blur}px)` : undefined }}>
        <div style={{ position: 'absolute', left: w * 0.08, right: w * 0.08, bottom: -h * 0.07, height: h * 0.08, borderRadius: '50%', background: dark ? 'rgba(0,0,0,.6)' : 'rgba(20,20,40,.22)', filter: `blur(${w * 0.06}px)`, transform: `scale(${scale}) translateX(${rotY * 1.2}px)` }} />
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${scale}) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`, transformStyle: 'preserve-3d', borderRadius: w * 0.155,
          background: 'linear-gradient(135deg, #8E8E96 0%, #3A3A40 18%, #1A1A1E 50%, #45454C 82%, #A4A4AC 100%)', padding: w * 0.008,
          boxShadow: `${-rotY * 0.9}px ${w * 0.12}px ${w * 0.3}px -${w * 0.08}px rgba(10,10,25,.45), inset 0 0 0 1px rgba(255,255,255,.25)` }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: w * 0.148, background: '#050506', padding: bez - w * 0.008 }}>
            <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: w * 0.122, overflow: 'hidden', background: '#fff' }}>
              {src ? <Img src={staticFile(`screens/${src}.webp`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} /> : null}
              {src2 ? <Img src={staticFile(`screens/${src2}.webp`)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', opacity: swap }} /> : null}
              {children ? <div style={{ position: 'absolute', left: 0, top: 0, width: 390, height: (h - bez * 2) / k, transform: `scale(${k})`, transformOrigin: 'top left' }}>{children}</div> : null}
              <div style={{ position: 'absolute', left: '50%', top: w * 0.028, width: w * 0.29, height: w * 0.082, marginLeft: -w * 0.145, borderRadius: 99, background: '#050506' }} />
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(115deg, transparent ${glare - 22}%, rgba(255,255,255,.22) ${glare}%, transparent ${glare + 16}%)`, mixBlendMode: 'screen' }} />
            </div>
          </div>
        </div>
      </div>
    );
  };

/** Carte « verre liquide » : flou d'arrière-plan, liseré lumineux, reflet interne. */
export const Glass: React.FC<{ x: number; y: number; w: number; h: number; o?: number; s?: number; blur?: number; r?: number; dark?: boolean; children?: React.ReactNode; style?: React.CSSProperties }> =
  ({ x, y, w, h, o = 1, s = 1, blur = 0, r = 30, dark, children, style }) => {
    if (o <= 0.001) return null;
    return (
      <div style={{ position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, opacity: o, transform: `scale(${s})`, filter: blur ? `blur(${blur}px)` : undefined, borderRadius: r,
        background: dark ? 'linear-gradient(140deg, rgba(255,255,255,.16), rgba(255,255,255,.05))' : 'linear-gradient(140deg, rgba(255,255,255,.86), rgba(255,255,255,.52))',
        border: `1.5px solid ${dark ? 'rgba(255,255,255,.22)' : 'rgba(255,255,255,.95)'}`, boxShadow: dark ? '0 30px 70px -30px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.25)' : '0 28px 60px -28px rgba(30,30,60,.35), inset 0 1px 0 #fff',
        backdropFilter: 'blur(22px) saturate(1.4)', overflow: 'hidden', color: dark ? '#F4F4F6' : T.ink, ...style }}>{children}</div>
    );
  };

/** Sphère d'Aura : noyau irisé, ondes, particules (positions calculées, pas de hasard). */
export const Orb: React.FC<{ t: number; x: number; y: number; r: number; energy?: number; o?: number }> = ({ t, x, y, r, energy = 0.4, o = 1 }) => {
  if (o <= 0.001) return null;
  const br = 1 + Math.sin(t * 2.4) * 0.03 * (1 + energy * 2);
  const waves = [0, 1, 2].map((k) => (t * (0.35 + energy * 0.6) + k / 3) % 1);
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity: o }}>
      <div style={{ position: 'absolute', left: -r * 2.4, top: -r * 2.4, width: r * 4.8, height: r * 4.8, borderRadius: '50%', background: `radial-gradient(circle, rgba(160,140,255,${0.28 + energy * 0.2}), transparent 62%)` }} />
      {waves.map((p, k) => (
        <div key={k} style={{ position: 'absolute', left: -r * (1 + p * 0.9), top: -r * (1 + p * 0.9), width: r * 2 * (1 + p * 0.9), height: r * 2 * (1 + p * 0.9), borderRadius: '50%', border: `${Math.max(1, r * 0.012)}px solid rgba(190,180,255,${(1 - p) * 0.4})` }} />
      ))}
      <div style={{ position: 'absolute', left: -r * br, top: -r * br, width: 2 * r * br, height: 2 * r * br, borderRadius: '50%',
        background: `conic-gradient(from ${t * 50}deg, ${T.aura[0]}, ${T.aura[1]}, ${T.aura[2]}, #CDBBFF, ${T.aura[0]})`, filter: `blur(${r * 0.1}px)`, boxShadow: `0 0 ${r * 0.9}px ${r * 0.2}px rgba(170,160,255,.5)` }} />
      <div style={{ position: 'absolute', left: -r * 0.7, top: -r * 0.78, width: r * 1.2, height: r * 1.1, borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, rgba(255,255,255,.95), rgba(255,255,255,.15) 55%, transparent 70%)' }} />
      {Array.from({ length: 22 }).map((_, k) => {
        const a = k * 2.39996 + t * (0.25 + (k % 4) * 0.08) * (1 + energy); const d = r * (1.3 + ((k * 37) % 11) / 9);
        const sz = Math.max(2, r * (0.018 + (k % 3) * 0.008));
        return <div key={k} style={{ position: 'absolute', left: Math.cos(a) * d - sz / 2, top: Math.sin(a) * d * 0.92 - sz / 2, width: sz, height: sz, borderRadius: 9, background: '#fff', boxShadow: `0 0 ${sz * 3}px #fff`, opacity: 0.25 + 0.55 * Math.sin(t * 2.6 + k) ** 2 }} />;
      })}
    </div>
  );
};

export const Logo: React.FC<{ h: number; color?: string }> = ({ h, color }) => (
  <Img src={staticFile('art/logo.svg')} style={{ height: h, filter: color === 'white' ? 'invert(1)' : undefined }} />
);

/** Aura = le robot compagnon RÉEL de l'app (captures transparentes de /dev/aura-bot, palette noir-blanc-gris), flottant, avec halo doux. */
export type BotState = 'idle' | 'greet' | 'listening' | 'thinking' | 'answer';
export const AuraRobot: React.FC<{ t: number; x: number; y: number; size: number; state: BotState; o?: number; since?: number; dark?: boolean }> = ({ t, x, y, size, state, o = 1, since = 0, dark }) => {
  if (o <= 0.001) return null;
  const v = state === 'thinking' ? Math.floor(t / 0.22) % 3 : 0;
  const pop = since > 0 ? Math.exp(-Math.max(0, t - since) * 7) * Math.sin(Math.max(0, t - since) * 18) * 0.06 : 0;
  const bob = Math.sin(t * 2.1) * size * 0.025; const tilt = Math.sin(t * 1.3) * 2.2 + (state === 'listening' ? -5 : 0);
  return (
    <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, opacity: o }}>
      <div style={{ position: 'absolute', left: -size * 0.35, top: -size * 0.35, width: size * 1.7, height: size * 1.7, borderRadius: '50%',
        background: `radial-gradient(circle, ${dark ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.9)'}, transparent 62%)`, transform: `scale(${1 + Math.sin(t * 1.7) * 0.04 + (state === 'thinking' ? 0.08 : 0)})` }} />
      <Img src={staticFile(`aura/aura-${state}-${v}.png`)} style={{ position: 'absolute', inset: 0, width: size, height: size, transform: `translateY(${bob}px) rotate(${tilt}deg) scale(${1 + pop})` }} />
    </div>
  );
};
