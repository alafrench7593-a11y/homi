/** Publicité HOMI « Trouvez votre village » — Communauté, 30 s, 60 i/s, verticale et 4K.
 *  Écrans RÉELS de la communauté HOMI (mode démo du navigateur) remplis avec un jeu de données FICTIF
 *  (data/community-demo.json : 100 profils, 50 publications, 200 commentaires — aucun membre réel, rien en production).
 *  Avatars = les 12 illustrations réelles de l'app (sans visage). Mention « données de démonstration » affichée. */
import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/fonts';
import { T } from '../tokens';
import { AuraRobot, BotState, Glass, KText, L, Logo, Phone3D, mix, prog, spr, useTime, win } from './parts';

for (const [w, n] of [['500Medium', 500], ['700Bold', 700], ['800ExtraBold', 800]] as const) {
  loadFont({ family: 'Manrope', url: staticFile(`fonts/Manrope_${w}.ttf`), weight: String(n) }).catch(() => undefined);
}
const INK = '#1F1D24'; const MUTED = '#8C8796'; const LILAC = '#A996F0'; const PINK = '#F2C6DC';
type P = { t: number; fps: number; l: L };

/** Les 12 avatars de l'app (src/features/community.tsx, PRESETS) : fond doux + motif, aucun visage. */
const PRESETS: Record<string, { bg: [string, string]; ink: string; d: string; line?: boolean }> = {
  moon: { bg: ['#E7E1FF', '#C9BCFA'], ink: '#5B47B8', d: 'M38 14a18 18 0 1 0 12 30A16 16 0 0 1 38 14z' },
  sun: { bg: ['#F6ECDA', '#E9CFA4'], ink: '#76561D', d: 'M32 22a10 10 0 1 1 0 20a10 10 0 1 1 0-20zM32 8v7M32 49v7M8 32h7M49 32h7M15 15l5 5M44 44l5 5M49 15l-5 5M20 44l-5 5', line: true },
  leaf: { bg: ['#DDF3E4', '#B7E3C4'], ink: '#2E7D4F', d: 'M16 48C16 26 30 14 50 14c0 20-12 34-34 34zM16 48l20-20' },
  cloud: { bg: ['#E2F0FB', '#BFDDF5'], ink: '#2F6E9E', d: 'M20 44a9 9 0 0 1 0-18a12 12 0 0 1 23-3a10 10 0 0 1 2 21z' },
  star: { bg: ['#F6EFE4', '#E9CFA4'], ink: '#76561D', d: 'M32 12l6 13l14 2l-10 10l3 14l-13-7l-13 7l3-14l-10-10l14-2z' },
  heart: { bg: ['#FBE8F1', '#F2C6DC'], ink: '#8E2A5A', d: 'M32 50S12 38 12 25a10 10 0 0 1 20-3a10 10 0 0 1 20 3c0 13-20 25-20 25z' },
  wave: { bg: ['#DDF5F4', '#AEE4E1'], ink: '#1F7C78', d: 'M10 30c6-6 11-6 16 0s10 6 16 0s10-6 16 0M10 42c6-6 11-6 16 0s10 6 16 0s10-6 16 0', line: true },
  flower: { bg: ['#F4E8F7', '#E4C8EE'], ink: '#74348A', d: 'M32 24a6 6 0 1 1 0 12a6 6 0 1 1 0-12zM32 12a7 7 0 0 1 0 12M32 36a7 7 0 0 1 0 12M20 30a7 7 0 0 1 12 0M32 30a7 7 0 0 1 12 0', line: true },
  bird: { bg: ['#E6EEFF', '#C3D3FF'], ink: '#3550A8', d: 'M12 38c10 2 18-2 22-10c4 6 10 8 18 6c-6 8-16 12-26 10c-6-1-10-3-14-6zM40 24l6-4', line: true },
  whale: { bg: ['#DCEBF7', '#B3D2EC'], ink: '#24537D', d: 'M10 34c4-10 20-14 32-8c6 3 10 2 12-2c2 8-4 16-14 18c-12 3-26 0-30-8zM40 22c0-4 2-6 4-8' },
  bear: { bg: ['#F4F0FA', '#D9CCE6'], ink: '#584D72', d: 'M32 22a14 14 0 1 1 0 28a14 14 0 1 1 0-28zM20 22a5 5 0 1 1 0-1M44 22a5 5 0 1 1 0-1M28 36h1M35 36h1M30 42q2 2 4 0', line: true },
  rainbow: { bg: ['#EEE8FB', '#D9CCFA'], ink: '#5B2A86', d: 'M12 46a20 20 0 0 1 40 0M18 46a14 14 0 0 1 28 0M24 46a8 8 0 0 1 16 0', line: true },
};
const KEYS = Object.keys(PRESETS);
const Av: React.FC<{ k: number; s: number; x: number; y: number; o?: number; ring?: boolean }> = ({ k, s, x, y, o = 1, ring }) => {
  const p = PRESETS[KEYS[k % KEYS.length]];
  if (o <= 0.001) return null;
  return (
    <svg width={s} height={s} viewBox="0 0 64 64" style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, opacity: o, filter: 'drop-shadow(0 8px 14px rgba(40,30,70,.25))', overflow: 'visible' }}>
      <defs><linearGradient id={`g${k % 12}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={p.bg[0]} /><stop offset="1" stopColor={p.bg[1]} /></linearGradient></defs>
      <circle cx="32" cy="32" r="32" fill={`url(#g${k % 12})`} stroke={ring ? '#fff' : 'none'} strokeWidth={ring ? 3 : 0} />
      <path d={p.d} fill={p.line ? 'none' : p.ink} stroke={p.ink} strokeWidth={p.line ? 3.2 : 0} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/** Fond : nuit (solitude) → aube lilas et rose (village). */
const Sky: React.FC<{ t: number; l: L; night: number }> = ({ t, l, night }) => {
  const D = Math.max(l.W, l.H);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'radial-gradient(120% 90% at 30% 10%, #FBF9FF 0%, #F1EDF8 55%, #E9E3F3 100%)' }}>
      {[{ c: 'rgba(169,150,240,.30)', x: 0.2, y: 0.25, r: 0.7 }, { c: 'rgba(242,198,220,.35)', x: 0.85, y: 0.5, r: 0.6 }, { c: 'rgba(191,221,245,.35)', x: 0.45, y: 0.95, r: 0.7 }].map((b, k) => (
        <div key={k} style={{ position: 'absolute', left: (b.x + Math.sin(t * 0.3 + k) * 0.05) * l.W - b.r * D / 2, top: (b.y + Math.cos(t * 0.27 + k) * 0.05) * l.H - b.r * D / 2, width: b.r * D, height: b.r * D, borderRadius: '50%', background: `radial-gradient(circle, ${b.c}, transparent 65%)` }} />
      ))}
      <div style={{ position: 'absolute', inset: 0, opacity: night, background: 'radial-gradient(110% 85% at 50% 30%, #2A2440 0%, #17141F 65%, #0E0C14 100%)' }} />
      {Array.from({ length: 26 }).map((_, k) => {
        const x = ((k * 0.137 + 0.05) % 1) * l.W; const y = ((k * 0.291 + 0.03) % 1) * l.H;
        return <div key={k} style={{ position: 'absolute', left: x, top: y, width: 3, height: 3, borderRadius: 3, background: '#fff', opacity: night * (0.2 + 0.5 * Math.sin(t * 1.3 + k) ** 2) }} />;
      })}
    </div>
  );
};
const DemoTag: React.FC<{ l: L; o: number; dark?: boolean }> = ({ l, o, dark }) => o <= 0.001 ? null : (
  <div style={{ position: 'absolute', left: 0, width: l.W, top: l.H - (l.v ? 70 : 52), textAlign: 'center', fontSize: l.v ? 22 : 18, fontWeight: 600, color: dark ? 'rgba(255,255,255,.55)' : 'rgba(31,29,36,.45)', opacity: o, letterSpacing: '0.01em' }}>
    Aperçu de la communauté — données de démonstration
  </div>
);

/* ── 00–04 : la solitude parentale ── */
const QUESTIONS = ['Suis-je la seule à vivre ça ?', 'Pourquoi mon bébé ne dort pas ?', 'À qui en parler ?'];
const Lonely: React.FC<P> = ({ t, l }) => {
  const { W, H, v } = l;
  if (t > 5.0) return null;
  const merge = prog(t, 2.55, 3.15); const out = prog(t, 4.3, 4.8);
  const mx = v ? W / 2 : 560; const my = v ? 1130 : 610;
  const pos: [number, number][] = v ? [[W / 2, 400], [W / 2, 560], [W / 2, 720]] : [[1330, 330], [1330, 500], [1330, 670]];
  return (
    <div style={{ opacity: 1 - out }}>
      <div style={{ position: 'absolute', left: mx - 420, top: my - 420, width: 840, height: 840, borderRadius: '50%', background: 'radial-gradient(circle, rgba(233,195,138,.22), transparent 62%)' }} />
      <Img src={staticFile('art/etape-05.png')} style={{ position: 'absolute', left: mx - (v ? 330 : 280), top: my - (v ? 400 : 340), width: v ? 660 : 560, height: v ? 800 : 680, objectFit: 'contain', opacity: prog(t, 0, 0.8) * (1 - merge * 0.6), filter: 'drop-shadow(0 0 30px rgba(233,195,138,.35))' }} />
      {QUESTIONS.map((q, i) => {
        const a = prog(t, 0.4 + i * 0.6, 0.9 + i * 0.6);
        const [x, y] = pos[i]; const cx = v ? W / 2 : 1330; const cy = v ? 560 : 500;
        return <div key={q} style={{ position: 'absolute', left: mix(merge, x, cx) - 400, width: 800, top: mix(merge, y, cy), textAlign: 'center', transform: `translateY(-50%) scale(${mix(merge, 1, 0.4)})`,
          fontSize: v ? 50 : 46, fontWeight: 700, color: '#EDE8FA', letterSpacing: '-0.02em', opacity: a * (1 - merge), filter: `blur(${(1 - a) * 12 + merge * 16}px)` }}>{q}</div>;
      })}
      <div style={{ position: 'absolute', left: (v ? W / 2 : 1330) - 60, top: (v ? 560 : 500) - 60, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, #fff, rgba(169,150,240,.6) 40%, transparent 70%)', opacity: win(t, 2.9, 3.7, 0.2, 0.5), transform: `scale(${1 + prog(t, 2.9, 3.7) * 6})` }} />
      <KText t={t} at={3.15} out={4.3} x={v ? W / 2 : 1330} y={v ? 560 : 500} size={v ? 72 : 64} w={v ? 1000 : 900} color="#fff">Et si vous n’étiez<br /><span style={{ color: '#C9BFEA' }}>plus seule ?</span></KText>
    </div>
  );
};

/* ── 04–09 : une communauté vivante (fil réel, défilement naturel) ── */
const Feed: React.FC<P> = ({ t, fps, l }) => {
  const { W, H, v } = l;
  if (t < 4.1 || t > 9.7) return null;
  const inO = prog(t, 4.2, 4.7); const out = prog(t, 9.1, 9.6);
  const ph = spr(t, 4.3, fps, 18, 1);
  const scroll = prog(t, 5.6, 8.6, (x) => x * x * (3 - 2 * x));
  const shots = ['c-fil-0', 'c-fil-1', 'c-fil-2'];
  const idx = Math.min(2, Math.floor(scroll * 2.999)); const sub = scroll * 2.999 - idx;
  const px = v ? W / 2 : 1240; const py = v ? 1210 : 580; const pw = v ? 440 : 380;
  const notif = (at: number) => spr(t, at, fps, 15);
  const N = [
    { at: 5.4, a: 1, txt: 'Léa_maman a répondu', sub: 'On traverse la même période ❤️', x: v ? 330 : 520, y: v ? 410 : 330 },
    { at: 6.4, a: 9, txt: '+ 12 cœurs', sub: 'sur ta publication', x: v ? 750 : 520, y: v ? 530 : 540 },
    { at: 7.4, a: 4, txt: 'Karim_papa a répondu', sub: 'Le relais nous aide beaucoup.', x: v ? 330 : 520, y: v ? 650 : 750 },
  ];
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: inO * (1 - out), filter: out ? `blur(${out * 10}px)` : undefined }}>
      <KText t={t} at={4.5} out={9.05} x={v ? W / 2 : 560} y={v ? 240 : 160} size={v ? 70 : 56} w={v ? 1000 : 820} color={INK}>Des parents qui comprennent{v ? <br /> : ' '}<span style={{ color: MUTED }}>vraiment votre quotidien.</span></KText>
      <Phone3D x={px} y={py + (1 - ph) * H * 0.6} w={pw} rotY={v ? -6 : -14} rotX={4} opacity={Math.min(1, ph * 2)}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <Img src={staticFile(`screens/${shots[idx]}.webp`)} style={{ position: 'absolute', left: 0, width: 390, top: -sub * 200, height: 780, objectFit: 'cover', objectPosition: 'top' }} />
        </div>
      </Phone3D>
      {N.map((n, i) => {
        const s = notif(n.at); if (s <= 0) return null;
        return <Glass key={i} x={n.x + Math.sin(t + i) * 4} y={n.y} w={v ? 470 : 420} h={v ? 104 : 92} o={Math.min(1, s * 1.5)} s={0.8 + s * 0.2} r={26} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px', color: INK }}>
          <div style={{ position: 'relative', width: v ? 60 : 54, height: v ? 60 : 54, flex: 'none' }}><Av k={n.a} s={v ? 60 : 54} x={v ? 30 : 27} y={v ? 30 : 27} /></div>
          <div><div style={{ fontSize: v ? 26 : 23, fontWeight: 800 }}>{n.txt}</div><div style={{ fontSize: v ? 21 : 19, fontWeight: 600, color: MUTED }}>{n.sub}</div></div>
        </Glass>;
      })}
    </div>
  );
};

/* ── 09–15 : trouvez votre communauté (groupes RÉELS de l'app) ── */
const GROUPS: [string, string, number][] = [
  ['Grossesse', 'Des conseils pour préparer la maternité ?', 0], ['Nouveau-né', 'Premier bain à la maison…', 1], ['Allaitement', 'Premières semaines d’allaitement', 2],
  ['Sommeil', 'Régression des 4 mois', 3], ['Post-partum', 'Je me sens enfin mieux', 4], ['Papas', 'Peau à peau avec papa', 5],
  ['Troubles neurodéveloppementaux', 'TDAH, autisme : on échange ?', 6], ['Parents solos', 'S’organiser seul·e, se soutenir', 7], ['Retour au travail', 'Reprendre sans culpabiliser', 8],
  ['Naissance prématurée', 'Néonatologie, retour à la maison', 9], ['Plusieurs enfants', 'L’aîné jaloux du bébé', 10],
];
const Groups: React.FC<P> = ({ t, fps, l }) => {
  const { W, H, v } = l;
  if (t < 9.0 || t > 15.6) return null;
  const inO = prog(t, 9.1, 9.5); const exit = prog(t, 14.9, 15.4);
  const px = W / 2; const py = v ? 1080 : 600;
  const slots: [number, number][] = v
    ? [[180, 560], [900, 560], [180, 780], [900, 780], [180, 1000], [900, 1000], [180, 1220], [900, 1220], [180, 1440], [900, 1440], [540, 1680]]
    : [[250, 300], [250, 540], [250, 780], [600, 420], [600, 660], [600, 900], [1320, 420], [1320, 660], [1320, 900], [1670, 380], [1670, 640]];
  const cw = v ? 320 : 330; const ch = v ? 190 : 170;
  const ph = spr(t, 9.15, fps, 18, 1);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: inO }}>
      <KText t={t} at={9.4} out={14.85} x={W / 2} y={v ? 300 : 100} size={v ? 74 : 60} w={v ? 1000 : 1800} color={INK}>À chaque étape,{v ? <br /> : ' '}<span style={{ color: MUTED }}>une communauté.</span></KText>
      {/* liens lumineux entre groupes */}
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {slots.slice(0, -1).map(([x1, y1], i) => {
          const [x2, y2] = slots[(i + 3) % slots.length]; const p = prog(t, 11.0 + i * 0.12, 11.8 + i * 0.12);
          return <line key={i} x1={x1} y1={y1} x2={mix(p, x1, x2)} y2={mix(p, y1, y2)} stroke="rgba(169,150,240,.35)" strokeWidth={2} strokeDasharray="4 8" opacity={1 - exit} />;
        })}
      </svg>
      {GROUPS.map(([name, prev, a], i) => {
        const at = 9.5 + i * 0.12; const s = spr(t, at, fps, 15, 0.7);
        const [fx, fy] = slots[i];
        const x = mix(s, px, fx) + (fx - px) * exit * 0.5; const y = mix(s, py, fy) + (fy - py) * exit * 0.5 + Math.sin(t * 1.2 + i) * 5;
        return <Glass key={name} x={x} y={y} w={cw} h={ch} o={Math.min(1, s * s * 1.6) * (1 - exit)} s={0.5 + s * 0.5} blur={exit * 10 + Math.max(0, 0.7 - s) * 14} r={28}
          style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 20 - i, color: INK }}>
          <div style={{ fontSize: name.length > 22 ? 19 : name.length > 15 ? 22 : 26, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{name}</div>
          <div style={{ fontSize: v ? 18 : 16, fontWeight: 600, color: MUTED, lineHeight: 1.25 }}>{prev}</div>
          <div style={{ position: 'relative', height: 34 }}>{[0, 1, 2].map((k) => <Av key={k} k={a + k * 4} s={34} x={17 + k * 24} y={17} ring />)}</div>
        </Glass>;
      })}
      <Phone3D x={px} y={py + (1 - ph) * H * 0.6} w={v ? 400 : 360} rotY={Math.sin(t * 0.9) * 4} opacity={Math.min(1, ph * 2) * (1 - exit)} blur={exit * 10} src="c-groupes-1" />
      <DemoTag l={l} o={win(t, 9.6, 14.9) * 0} />
    </div>
  );
};

/* ── 15–21 : des échanges authentiques (discussion réelle, réponses fictives) ── */
const Thread: React.FC<P> = ({ t, fps, l }) => {
  const { W, H, v } = l;
  if (t < 14.9 || t > 21.6) return null;
  const inO = prog(t, 15.0, 15.5); const out = prog(t, 20.9, 21.4);
  const zoom = prog(t, 15.0, 16.2);
  const px = v ? W / 2 : 1300; const py = v ? 1290 : 560;
  const replies: [string, string, number, number][] = [['Léa_maman', 'On traverse la même période ❤️', 1, 16.4], ['Karim_papa', 'Le relais avec mon conjoint nous aide beaucoup.', 4, 17.3], ['Inès.rennes', 'Courage, tu peux aussi demander de l’aide autour de toi.', 7, 18.2]];
  const hearts = Array.from({ length: 9 }).map((_, k) => ({ at: 16.6 + k * 0.32, x: (v ? 820 : 1600) + ((k * 37) % 60) - 30 }));
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: inO * (1 - out), filter: out ? `blur(${out * 10}px)` : undefined }}>
      <KText t={t} at={15.4} out={20.85} x={v ? W / 2 : 560} y={v ? 220 : 470} size={v ? 66 : 66} w={v ? 1000 : 820} color={INK}>Partager. Échanger.<br /><span style={{ color: MUTED }}>Se soutenir.</span></KText>
      <Phone3D x={px} y={py} w={(v ? 420 : 380) * mix(zoom, 0.8, 1)} rotY={v ? 0 : -8} opacity={zoom} src={t < 17.9 ? 'c-epuisee' : 'c-epuisee-2'} />
      {replies.map(([who, txt, a, at], i) => {
        const s = spr(t, at, fps, 15); if (s <= 0) return null;
        const x = v ? W / 2 + (i % 2 ? 60 : -60) : 560; const y = v ? 460 + i * 132 : 650;
        if (!v && t > at + 0.95 && i < 2) return null;
        return <Glass key={who} x={x} y={v ? y : 770} w={v ? 780 : 720} h={v ? 120 : 108} o={Math.min(1, s * 1.5) * (v ? 1 : 1 - prog(t, at + 0.75, at + 0.95))} s={0.85 + s * 0.15} r={30} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 22px', color: INK }}>
          <div style={{ position: 'relative', width: 60, height: 60, flex: 'none' }}><Av k={a} s={60} x={30} y={30} /></div>
          <div><div style={{ fontSize: v ? 24 : 22, fontWeight: 800 }}>{who}</div><div style={{ fontSize: v ? 25 : 23, fontWeight: 600, color: '#3A3644' }}>{txt}</div></div>
        </Glass>;
      })}
      {hearts.map((h, k) => {
        const p = prog(t, h.at, h.at + 1.2, (x) => x); if (p <= 0 || p >= 1) return null;
        return <div key={k} style={{ position: 'absolute', left: h.x, top: (v ? 1620 : 900) - p * 300, fontSize: 40, color: '#E0638F', opacity: Math.sin(p * Math.PI), transform: `scale(${0.6 + p * 0.6})` }}>♥</div>;
      })}
      <div style={{ position: 'absolute', left: 0, width: W, top: H - (v ? 120 : 90), textAlign: 'center', fontSize: v ? 24 : 20, fontWeight: 600, color: MUTED, opacity: win(t, 16.0, 20.8) }}>Témoignages de parents, pas des avis médicaux.</div>
    </div>
  );
};

/* ── 21–26 : Aura relie la communauté aux outils ── */
const botAt = (t: number): [BotState, number] => {
  const st: [number, BotState][] = [[21.2, 'greet'], [21.7, 'listening'], [22.6, 'thinking'], [23.1, 'answer'], [25.0, 'greet']];
  let c: [BotState, number] = ['idle', 0]; for (const [a, s] of st) if (t >= a) c = [s, a]; return c;
};
const AuraC: React.FC<P> = ({ t, fps, l }) => {
  const { W, H, v } = l;
  if (t < 20.9 || t > 26.5) return null;
  const inO = prog(t, 21.0, 21.5); const out = prog(t, 25.85, 26.3);
  const ox = W / 2; const oy = v ? 760 : 470;
  const q = spr(t, 21.7, fps, 16);
  const tools: [string, number, number][] = v ? [['Sommeil de l’enfant', 220, 1250], ['Relais de nuit', 860, 1250], ['Point de couple', 220, 1500], ['Communauté', 860, 1500]] : [['Sommeil de l’enfant', 330, 380], ['Relais de nuit', 1590, 380], ['Point de couple', 330, 720], ['Communauté', 1590, 720]];
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: inO * (1 - out), filter: out ? `blur(${out * 10}px)` : undefined }}>
      <KText t={t} at={21.3} out={25.8} x={W / 2} y={v ? 240 : 95} size={v ? 70 : 58} w={v ? 1000 : 1800} color={INK}>Du soutien{v ? <br /> : ' '}<span style={{ color: MUTED }}>aux solutions concrètes.</span></KText>
      <AuraRobot t={t} x={ox} y={oy} size={v ? 330 : 300} state={botAt(t)[0]} since={botAt(t)[1]} o={prog(t, 21.1, 21.6)} />
      <Glass x={ox} y={oy + (v ? 260 : 235)} w={v ? 760 : 640} h={v ? 90 : 78} o={q} s={0.9 + q * 0.1} r={40} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: v ? 30 : 27, fontWeight: 700, color: INK }}>
        « Comment mieux organiser nos nuits ? »
      </Glass>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {tools.map(([n, x, y], i) => { const p = prog(t, 23.1 + i * 0.15, 23.6 + i * 0.15); return <line key={n} x1={ox} y1={oy} x2={mix(p, ox, x)} y2={mix(p, oy, y)} stroke="rgba(169,150,240,.6)" strokeWidth={3} strokeLinecap="round" />; })}
      </svg>
      {tools.map(([n, x, y], i) => {
        const s = spr(t, 23.35 + i * 0.15, fps, 15);
        return <Glass key={n} x={x} y={y} w={v ? 390 : 380} h={v ? 100 : 92} o={s} s={0.7 + s * 0.3} r={28} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: v ? 28 : 26, fontWeight: 800, color: INK, boxShadow: i === 3 ? '0 0 0 3px rgba(169,150,240,.5), 0 20px 50px -20px rgba(120,100,220,.6)' : undefined }}>
          {n}<span style={{ color: MUTED }}>›</span>
        </Glass>;
      })}
      <div style={{ position: 'absolute', left: 0, width: W, top: H - (v ? 120 : 80), textAlign: 'center', fontSize: v ? 24 : 20, fontWeight: 600, color: MUTED, opacity: win(t, 23.6, 25.8) }}>Rien de ta famille n’est partagé avec la communauté sans ton accord.</div>
    </div>
  );
};

/* ── 26–30 : le village ── */
const Village: React.FC<P> = ({ t, fps, l }) => {
  const { W, H, v } = l;
  if (t < 25.7) return null;
  const inO = prog(t, 25.8, 26.3);
  const conv = prog(t, 27.7, 28.5, (x) => x * x);
  const logo = spr(t, 28.2, fps, 14); const tag = prog(t, 28.6, 29.2);
  const cx = W / 2; const cy = H / 2 - (v ? 60 : 50);
  const N = 48;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: inO }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0, opacity: 1 - conv }}>
        {Array.from({ length: N }).map((_, i) => {
          const j = (i * 7 + 3) % N; const a1 = i * 2.39996; const a2 = j * 2.39996; const r1 = (v ? 160 : 130) + (i % 6) * (v ? 70 : 62); const r2 = (v ? 160 : 130) + (j % 6) * (v ? 70 : 62);
          const p = prog(t, 26.4 + (i % 12) * 0.05, 27.0 + (i % 12) * 0.05);
          return <line key={i} x1={cx + Math.cos(a1) * r1 * (v ? 1 : 1.6)} y1={cy + Math.sin(a1) * r1 * (v ? 1.2 : 0.8)} x2={cx + Math.cos(a2) * r2 * (v ? 1 : 1.6)} y2={cy + Math.sin(a2) * r2 * (v ? 1.2 : 0.8)} stroke="rgba(169,150,240,.35)" strokeWidth={2} opacity={p} />;
        })}
      </svg>
      {Array.from({ length: N }).map((_, i) => {
        const a = i * 2.39996 + t * 0.05; const r = ((v ? 160 : 130) + (i % 6) * (v ? 70 : 62)) * (1 - conv);
        const s = spr(t, 25.9 + (i % 16) * 0.04, fps, 14);
        return <Av key={i} k={i} s={(v ? 66 : 58) * (0.6 + s * 0.4) * (1 - conv * 0.7)} x={cx + Math.cos(a) * r * (v ? 1 : 1.6)} y={cy + Math.sin(a) * r * (v ? 1.2 : 0.8)} o={s * (1 - prog(t, 28.2, 28.6))} />;
      })}
      <KText t={t} at={26.0} out={27.75} x={W / 2} y={v ? 150 : 62} size={v ? 60 : 48} w={v ? 1000 : 1800} color={INK}>Parce qu’il faut tout un village{v ? <br /> : ' '}<span style={{ color: MUTED }}>pour élever un enfant.</span></KText>
      <div style={{ position: 'absolute', left: cx, top: cy, transform: `translate(-50%,-50%) scale(${(0.8 + logo * 0.2) * (1 + prog(t, 28.4, 30, (x) => x) * 0.04)})`, opacity: logo, filter: `blur(${(1 - logo) * 14}px)` }}><Logo h={150} /></div>
      <div style={{ position: 'absolute', left: 0, width: W, top: cy + 140, textAlign: 'center', fontSize: 50, fontWeight: 700, letterSpacing: '-0.02em', color: MUTED, opacity: tag, transform: `translateY(${(1 - tag) * 16}px)`, filter: `blur(${(1 - tag) * 8}px)` }}>Trouvez votre village.</div>
      <DemoTag l={l} o={win(t, 26.0, 28.3)} />
    </div>
  );
};

export const Communaute30: React.FC<{ vertical: boolean; voice: boolean }> = ({ vertical, voice }) => {
  const { t, fps } = useTime(); const { width } = useVideoConfig();
  const l: L = vertical ? { W: 1080, H: 1920, v: true } : { W: 1920, H: 1080, v: false };
  const k = width / l.W; const p = { t, fps, l };
  const night = 1 - prog(t, 3.6, 4.6);
  return (
    <AbsoluteFill style={{ background: '#F1EDF8' }}>
      <Audio src={staticFile(voice ? 'audio/c30-mix.wav' : 'audio/c30-mix-sans-voix.wav')} />
      <div style={{ width: l.W, height: l.H, transform: `scale(${k})`, transformOrigin: 'top left', position: 'relative', overflow: 'hidden', fontFamily: `${T.font}, sans-serif`, color: INK }}>
        <Sky t={t} l={l} night={night} />
        <Lonely {...p} /><Feed {...p} /><Groups {...p} /><Thread {...p} /><AuraC {...p} /><Village {...p} />
        <DemoTag l={l} o={win(t, 4.4, 20.8) * (t > 9 && t < 15.2 ? 1 : 1)} />
      </div>
    </AbsoluteFill>
  );
};
