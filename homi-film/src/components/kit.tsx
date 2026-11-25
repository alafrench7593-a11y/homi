/** Composants réutilisables du film : fond, téléphone, titres, carte en verre, sphère d'Aura, sous-titres. */
import React from 'react';
import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing } from 'remotion';
import { T } from '../tokens';

export const sec = (s: number, fps: number) => Math.round(s * fps);
/** Progression 0→1 entre deux instants (en secondes, relatifs à la scène), lissée. */
export function useT(a: number, b: number, ease = Easing.bezier(0.2, 0.8, 0.2, 1)) {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return interpolate(f, [a * fps, b * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease });
}
export function useSpring(at: number, cfg = { damping: 200, mass: 0.9 }) {
  const f = useCurrentFrame(); const { fps } = useVideoConfig();
  return spring({ frame: f - at * fps, fps, config: cfg });
}

export const Stage: React.FC<{ children: React.ReactNode; dark?: boolean }> = ({ children, dark }) => (
  <AbsoluteFill style={{ background: dark ? `radial-gradient(120% 90% at 50% 40%, #1A1A22 0%, ${T.night} 70%)` : `radial-gradient(130% 100% at 20% 0%, ${T.bg2} 0%, ${T.bg} 60%)`, fontFamily: T.font, color: dark ? '#F4F4F6' : T.ink }}>
    {children}
  </AbsoluteFill>
);

/** iPhone stylisé (proportions 390×844), capture RÉELLE de l'app, rotation 3D douce. */
export const Phone: React.FC<{ src: string; x?: number; y?: number; w?: number; rotY?: number; rotX?: number; rotZ?: number; opacity?: number; scale?: number; z?: number; children?: React.ReactNode }> =
  ({ src, x = 960, y = 540, w = 360, rotY = 0, rotX = 0, rotZ = 0, opacity = 1, scale = 1, z = 0, children }) => {
    const h = w * (810 / 390) + w * 0.06;
    return (
      <div style={{ position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, opacity, perspective: 1600, zIndex: z }}>
        <div style={{ width: '100%', height: '100%', transform: `scale(${scale}) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`, transformStyle: 'preserve-3d',
          borderRadius: w * 0.16, background: '#0B0B0C', padding: w * 0.03, boxShadow: '0 60px 120px -40px rgba(10,10,20,.55), inset 0 0 0 2px #2A2A30' }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: w * 0.13, overflow: 'hidden', background: '#fff' }}>
            <Img src={staticFile(`screens/${src}.webp`)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
            <div style={{ position: 'absolute', left: '50%', top: w * 0.025, width: w * 0.3, height: w * 0.085, marginLeft: -w * 0.15, borderRadius: 99, background: '#0B0B0C' }} />
            {children}
          </div>
        </div>
      </div>
    );
  };

/** Titre façon Keynote : apparition douce (flou → net), deux lignes possibles (seconde en gris). */
export const Title: React.FC<{ at: number; out?: number; line1: string; line2?: string; size?: number; y?: number; x?: number; align?: 'center' | 'left'; dark?: boolean }> =
  ({ at, out = 999, line1, line2, size = 96, y = 540, x = 960, align = 'center', dark }) => {
    const i = useT(at, at + 0.9); const o = 1 - useT(out, out + 0.6);
    const a = Math.min(i, o);
    return (
      <div style={{ position: 'absolute', left: align === 'center' ? 0 : x, right: align === 'center' ? 0 : undefined, top: y, transform: `translateY(-50%) translateY(${(1 - i) * 30}px)`,
        textAlign: align, opacity: a, filter: `blur(${(1 - i) * 14}px)`, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1.02, fontSize: size }}>
        <div>{line1}</div>{line2 ? <div style={{ color: dark ? '#8C8C96' : T.soft }}>{line2}</div> : null}
      </div>
    );
  };

export const Glass: React.FC<{ x: number; y: number; w: number; h: number; children?: React.ReactNode; opacity?: number; scale?: number; style?: React.CSSProperties }> =
  ({ x, y, w, h, children, opacity = 1, scale = 1, style }) => (
    <div style={{ position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, opacity, transform: `scale(${scale})`, borderRadius: 34,
      background: T.glass, border: `1.5px solid ${T.glassLine}`, boxShadow: T.shadow, backdropFilter: 'blur(24px)', overflow: 'hidden', ...style }}>{children}</div>
  );

/** Aura : sphère lumineuse (halo, ondes, particules) ; « state » module la respiration (écoute → réflexion → action). */
export const AuraOrb: React.FC<{ x?: number; y?: number; r?: number; energy?: number; opacity?: number }> = ({ x = 960, y = 540, r = 160, energy = 0.5, opacity = 1 }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const breathe = 1 + Math.sin(t * 2.2) * 0.035 * (1 + energy);
  const waves = [0, 1, 2].map((k) => ((t * (0.45 + energy * 0.4) + k / 3) % 1));
  return (
    <div style={{ position: 'absolute', left: x, top: y, opacity }}>
      {waves.map((p, k) => (
        <div key={k} style={{ position: 'absolute', left: -r * (1 + p * 1.6), top: -r * (1 + p * 1.6), width: r * 2 * (1 + p * 1.6), height: r * 2 * (1 + p * 1.6), borderRadius: '50%',
          border: `2px solid rgba(160,150,255,${(1 - p) * 0.35})` }} />
      ))}
      <div style={{ position: 'absolute', left: -r * breathe, top: -r * breathe, width: 2 * r * breathe, height: 2 * r * breathe, borderRadius: '50%',
        background: `conic-gradient(from ${t * 40}deg, ${T.aura[0]}, ${T.aura[1]}, ${T.aura[2]}, ${T.aura[0]})`, filter: `blur(${r * 0.12}px)`, boxShadow: `0 0 ${r * 1.2}px ${r * 0.3}px rgba(170,160,255,.45)` }} />
      <div style={{ position: 'absolute', left: -r * 0.62, top: -r * 0.62, width: r * 1.24, height: r * 1.24, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #fff, rgba(255,255,255,.2) 60%, transparent 70%)', opacity: 0.85 }} />
      {Array.from({ length: 14 }).map((_, k) => {
        const ang = k * 2.4 + t * (0.3 + (k % 3) * 0.1); const d = r * (1.35 + ((k * 37) % 10) / 14);
        return <div key={'p' + k} style={{ position: 'absolute', left: Math.cos(ang) * d, top: Math.sin(ang) * d, width: 5, height: 5, borderRadius: 9, background: '#fff', opacity: 0.35 + 0.4 * Math.sin(t * 3 + k) ** 2 }} />;
      })}
    </div>
  );
};

/** Sous-titres (incrustés pour l'animatic ; exportés aussi en SRT/VTT). */
export const Captions: React.FC<{ cues: { from: number; to: number; text: string }[]; dark?: boolean }> = ({ cues, dark }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const c = cues.find((q) => t >= q.from && t < q.to);
  if (!c) return null;
  const a = Math.min(1, (t - c.from) * 4, (c.to - t) * 4);
  return (
    <div style={{ position: 'absolute', left: 0, width: T.W, top: T.H - 92, textAlign: 'center', opacity: a, zIndex: 50 }}>
      <span style={{ display: 'inline-block', padding: '10px 24px', borderRadius: 16, fontSize: 32, fontWeight: 700, letterSpacing: '-0.01em',
        background: dark ? 'rgba(0,0,0,.55)' : 'rgba(11,11,12,.78)', color: '#fff' }}>{c.text}</span>
    </div>
  );
};

export const Logo: React.FC<{ size?: number; color?: string }> = ({ size = 160, color = T.ink }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: size * 0.18, color }}>
    <Img src={staticFile('art/logo.svg')} style={{ height: size, filter: color === '#fff' || color === '#F4F4F6' ? 'invert(1)' : undefined }} />
  </div>
);
export const Fill = AbsoluteFill;
