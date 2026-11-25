/** Scènes 01 à 05 : devenir parent, HOMI, de la grossesse aux 10 ans, quotidien du bébé, santé. */
import React from 'react';
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { AuraOrb, Glass, Logo, Phone, Stage, Title, useSpring, useT } from '../components/kit';
import { T } from '../tokens';

const ART = ['projet-bebe', 'grossesse', 'bebe', 'enfants', 'famille'];
const WORDS = ['Sommeil', 'Santé', 'Couple', 'Organisation', 'Souvenirs'];

export const S01: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const conv = useT(8.2, 10.2); const logo = useSpring(9.8);
  return (
    <Stage>
      {ART.map((a, i) => {
        const o = interpolate(t, [i * 1.6, i * 1.6 + 0.6, i * 1.6 + 1.8, i * 1.6 + 2.4], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        return <Img key={a} src={staticFile(`art/${a}.webp`)} style={{ position: 'absolute', left: 960 - 330, top: 120, width: 660, height: 660, objectFit: 'contain', opacity: o * (1 - conv), transform: `scale(${1 + (t - i * 1.6) * 0.02})` }} />;
      })}
      {WORDS.map((w, i) => {
        const a = useT(1 + i * 1.2, 2 + i * 1.2);
        const ang = (i / WORDS.length) * Math.PI * 2 + 0.4; const R = 520 * (1 - conv);
        return <div key={w} style={{ position: 'absolute', left: 960 + Math.cos(ang) * R * 1.3, top: 540 + Math.sin(ang) * R * 0.75, transform: 'translate(-50%,-50%)', opacity: a * (1 - conv * 0.95),
          fontSize: 64, fontWeight: 800, letterSpacing: '-0.04em', color: i % 2 ? T.soft : T.ink, filter: `blur(${(1 - a) * 10}px)` }}>{w}</div>;
      })}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 470, transform: `translateY(-50%) scale(${0.6 + logo * 0.4})`, opacity: logo }}><Logo size={170} /></div>
    </Stage>
  );
};

const CATS = ['Grossesse', 'Bébé', 'Enfant', 'Santé', 'Couple', 'Organisation', 'Repas', 'Communauté'];
// (anneau resserré côté titre pour ne jamais chevaucher le texte)
export const S02: React.FC = () => {
  const rise = useSpring(0.3); const turn = useT(0.3, 3.2);
  return (
    <Stage>
      <Phone src="accueil" x={1240} y={520 + (1 - rise) * 500} w={380} rotY={-28 * (1 - turn) - 8} rotX={6 * (1 - turn)} />
      {CATS.map((c, i) => {
        const a = useSpring(2 + i * 0.25); const ang = -Math.PI / 2 + (i / CATS.length) * Math.PI * 2;
        return <Glass key={c} x={1240 + Math.cos(ang) * (Math.cos(ang) < -0.5 ? 330 : 390)} y={520 + Math.sin(ang) * 400} w={230} h={74} opacity={a} scale={0.8 + a * 0.2}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 30 }}>{c}</Glass>;
      })}
      <Title at={4.5} line1="Toute votre vie" line2="familiale. Enfin réunie." size={76} align="left" x={110} y={540} />
    </Stage>
  );
};

const STEPS: { label: string; art: string; screen?: string }[] = [
  { label: 'Cycle', art: 'etape-01' }, { label: 'Fertilité', art: 'etape-02' }, { label: 'Grossesse', art: 'etape-03', screen: 'contractions' },
  { label: 'Naissance', art: 'etape-04' }, { label: 'Bébé', art: 'etape-05', screen: 'journee-biberons' }, { label: 'Enfance', art: 'etape-07', screen: 'developpement' },
  { label: 'École', art: 'etape-09', screen: 'garde' }, { label: '10 ans', art: 'etape-10', screen: 'enfant' },
];
export const S03: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const p = interpolate(t, [0.8, 12], [0, STEPS.length - 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const idx = Math.round(p); const x0 = 200, x1 = 1720;
  return (
    <Stage>
      <div style={{ position: 'absolute', left: x0, right: 1920 - x1, top: 900, height: 4, background: 'rgba(11,11,12,.12)', borderRadius: 4 }} />
      <div style={{ position: 'absolute', left: x0, width: (x1 - x0) * (p / (STEPS.length - 1)), top: 900, height: 4, background: T.ink, borderRadius: 4 }} />
      {STEPS.map((s, i) => {
        const x = x0 + ((x1 - x0) * i) / (STEPS.length - 1); const on = Math.max(0, 1 - Math.abs(p - i));
        return <div key={s.label} style={{ position: 'absolute', left: x, top: 900, transform: 'translate(-50%,-50%)' }}>
          <div style={{ width: 22 + on * 14, height: 22 + on * 14, borderRadius: 99, background: i <= p + 0.01 ? T.ink : '#fff', border: `3px solid ${T.ink}` }} />
          <div style={{ position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: 30, fontWeight: 700, opacity: 0.4 + on * 0.6 }}>{s.label}</div>
        </div>;
      })}
      {STEPS.map((s, i) => {
        const on = Math.max(0, 1 - Math.abs(p - i) * 1.4);
        return <React.Fragment key={'v' + i}>
          <Img src={staticFile(`art/${s.art}.png`)} style={{ position: 'absolute', left: 300, top: 110, height: 640, opacity: on, transform: `translateX(${(p - i) * -60}px)` }} />
          {s.screen ? <Phone src={s.screen} x={1350} y={450} w={330} opacity={on} rotY={(p - i) * -20} /> : null}
        </React.Fragment>;
      })}
      <div style={{ position: 'absolute', right: 140, top: 120, fontSize: 30, fontWeight: 700, color: T.muted }}>{STEPS[idx].label}</div>
    </Stage>
  );
};

/** Compteurs et graphiques animés autour des vrais écrans (simulation d'usage, clairement une démonstration). */
const Counter: React.FC<{ at: number; to: number; unit: string; label: string; x: number; y: number }> = ({ at, to, unit, label, x, y }) => {
  const a = useSpring(at); const v = Math.round(useT(at, at + 1.6) * to);
  return <Glass x={x} y={y} w={300} h={150} opacity={a} scale={0.85 + 0.15 * a}>
    <div style={{ padding: '22px 28px' }}><div style={{ fontSize: 26, color: T.muted, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: '-0.04em' }}>{v}<span style={{ fontSize: 34, color: T.muted }}> {unit}</span></div></div></Glass>;
};
const Timer: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const a = useSpring(at);
  const s = Math.max(0, f / fps - at) * 9; const mm = String(Math.floor(s / 60)).padStart(2, '0'); const ss = String(Math.floor(s % 60)).padStart(2, '0');
  return <Glass x={x} y={y} w={300} h={150} opacity={a}><div style={{ padding: '22px 28px' }}><div style={{ fontSize: 26, color: T.muted, fontWeight: 700 }}>Tétée · gauche</div>
    <div style={{ fontSize: 64, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{mm}:{ss}</div></div></Glass>;
};
const SleepBar: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const g = useT(at, at + 2.2); const a = useSpring(at);
  const naps = [[1.5, 3], [8, 9.7], [13.2, 14.4], [19.5, 24]];
  return <Glass x={x} y={y} w={620} h={150} opacity={a}><div style={{ padding: '20px 26px' }}><div style={{ fontSize: 26, color: T.muted, fontWeight: 700 }}>Sommeil · 24 h</div>
    <div style={{ position: 'relative', height: 40, marginTop: 18, background: 'rgba(11,11,12,.07)', borderRadius: 12, overflow: 'hidden' }}>
      {naps.map(([s, e], i) => <div key={i} style={{ position: 'absolute', left: `${(s / 24) * 100}%`, width: `${((e - s) / 24) * 100 * Math.min(1, Math.max(0, g * 4 - i))}%`, top: 0, bottom: 0, background: T.ink, borderRadius: 10 }} />)}
    </div></div></Glass>;
};
const Growth: React.FC<{ at: number; x: number; y: number }> = ({ at, x, y }) => {
  const g = useT(at, at + 2.4); const a = useSpring(at);
  const pts = [[0, 92], [60, 70], [120, 56], [180, 46], [240, 38], [300, 32], [360, 28], [420, 24], [480, 21]];
  const d = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px},${py}`).join(' ');
  return <Glass x={x} y={y} w={560} h={190} opacity={a}><div style={{ padding: '18px 26px' }}><div style={{ fontSize: 26, color: T.muted, fontWeight: 700 }}>Poids · repères OMS</div>
    <svg width="500" height="110" viewBox="0 0 500 110"><path d="M0,100 L480,30" stroke="rgba(11,11,12,.12)" strokeWidth="18" strokeLinecap="round" />
      <path d={d} fill="none" stroke={T.ink} strokeWidth="5" strokeLinecap="round" strokeDasharray="700" strokeDashoffset={700 * (1 - g)} /></svg></div></Glass>;
};
export const S04: React.FC = () => {
  const a = useSpring(0.2);
  return (
    <Stage>
      <Phone src="journee-biberons" x={360} y={600 + (1 - a) * 300} w={280} rotY={14} />
      <Phone src="allaitement" x={760} y={600 + (1 - useSpring(0.5)) * 300} w={280} rotY={6} />
      <Phone src="sommeil" x={1160} y={600 + (1 - useSpring(0.8)) * 300} w={280} rotY={-6} />
      <Phone src="croissance" x={1560} y={600 + (1 - useSpring(1.1)) * 300} w={280} rotY={-14} />
      <Counter at={3} to={150} unit="ml" label="Biberon" x={360} y={170} />
      <Timer at={5} x={760} y={170} />
      <SleepBar at={7} x={1160} y={170} />
      <Growth at={9.5} x={1560} y={180} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 96, textAlign: 'center', fontSize: 22, color: T.muted }}>Écrans réels de l’application, famille fictive · valeurs animées pour la démonstration</div>
    </Stage>
  );
};

export const S05: React.FC = () => (
  <Stage>
    <Title at={0.3} out={11.5} line1="La santé de la famille," line2="au même endroit." size={78} align="left" x={140} y={300} />
    <Phone src="vaccins" x={1020} y={560 + (1 - useSpring(1)) * 300} w={290} rotY={10} />
    <Phone src="medicaments" x={1360} y={560 + (1 - useSpring(1.4)) * 300} w={290} />
    <Phone src="sante" x={1700} y={560 + (1 - useSpring(1.8)) * 300} w={290} rotY={-10} />
    <Glass x={430} y={640} w={560} h={210} opacity={useSpring(4)}><div style={{ padding: 28, fontSize: 30, lineHeight: 1.35 }}>
      <b>Médicaments</b><br /><span style={{ color: T.muted }}>Nom et dose recopiés de l’ordonnance. Aucune dose n’est jamais calculée.</span></div></Glass>
    <Glass x={430} y={880} w={560} h={150} opacity={useSpring(6)}><div style={{ padding: 28, fontSize: 30 }}><b>Calendrier des vaccinations</b><br /><span style={{ color: T.muted }}>Repères officiels, sources citées.</span></div></Glass>
  </Stage>
);
export { AuraOrb };
