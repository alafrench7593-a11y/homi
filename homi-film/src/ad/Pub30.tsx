/** Publicité HOMI 30 s — deux vraies compositions (verticale 1080×1920, horizontale dessinée en 1920×1080 puis ×2 en 4K).
 *  Une seule horloge (secondes) pilote l'image, la voix, les bruitages et les sous-titres : voir data/pub30.ts. */
import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/fonts';
import { T } from '../tokens';
import { Backdrop, Glass, KText, L, Logo, Orb, Phone3D, mix, prog, spr, useTime, win } from './parts';

for (const [w, n] of [['500Medium', 500], ['700Bold', 700], ['800ExtraBold', 800]] as const) {
  loadFont({ family: 'Manrope', url: staticFile(`fonts/Manrope_${w}.ttf`), weight: String(n) }).catch(() => undefined);
}

const MUTED = '#8A8A93';
type P = { t: number; fps: number; l: L };

/* ───────── 00–04 : l'accroche ───────── */
const WORDS = ['Grossesse.', 'Bébé.', 'Couple.', 'Famille.'];
const Hook: React.FC<P> = ({ t, fps, l }) => {
  const { W, H, v } = l;
  const conv = prog(t, 1.85, 2.35);
  const logoIn = spr(t, 1.98, fps, 14);
  const settle = prog(t, 2.75, 3.4);
  const fs = v ? 150 : 118; const lh = fs * 1.02;
  const top = H / 2 - (lh * 4) / 2 + lh / 2;
  // logo : naît au centre puis rejoint la colonne du titre
  const lx = mix(settle, W / 2, v ? W / 2 : 470); const ly = mix(settle, H / 2, v ? 330 : 380);
  const lh2 = mix(settle, v ? 150 : 140, v ? 92 : 84);
  const out = prog(t, 3.9, 4.3);
  return (
    <>
      {WORDS.map((w, i) => {
        const a = prog(t, 0.2 + i * 0.42, 0.65 + i * 0.42);
        if (a <= 0 || conv >= 1) return null;
        const y = top + i * lh;
        return <div key={w} style={{ position: 'absolute', left: 0, width: W, top: mix(conv, y, H / 2), textAlign: 'center', fontSize: fs, fontWeight: 800, letterSpacing: '-0.05em',
          color: i % 2 ? MUTED : T.ink, opacity: a * (1 - conv), filter: `blur(${(1 - a) * 18 + conv * 22}px)`,
          transform: `translateY(-50%) translateY(${(1 - a) * 40}px) scale(${mix(conv, 1, 0.35)})` }}>{w}</div>;
      })}
      <div style={{ position: 'absolute', left: lx, top: ly, transform: `translate(-50%,-50%) scale(${0.7 + logoIn * 0.3})`, opacity: logoIn * (1 - out), filter: `blur(${(1 - logoIn) * 12 + out * 10}px)` }}>
        <Logo h={lh2} />
      </div>
      <KText t={t} at={2.95} out={3.85} x={v ? W / 2 : 150} y={v ? 520 : 600} size={v ? 78 : 74} w={v ? 960 : 680} align={v ? 'center' : 'left'}>
        Toute votre vie familiale.<br /><span style={{ color: MUTED }}>Enfin réunie.</span>
      </KText>
    </>
  );
};

/* Téléphone « héros » continu de 2,6 s à 9,4 s (entrée 3D, accueil réel, poussée vers Aura). */
const HeroPhone: React.FC<P> = ({ t, fps, l }) => {
  const { W, H, v } = l;
  if (t < 2.5 || t > 9.5) return null;
  const rise = spr(t, 2.6, fps, 18, 1);
  const center = prog(t, 3.8, 4.6);
  const push = prog(t, 8.85, 9.45, (x) => x * x);
  const w0 = v ? 470 : 360; const w1 = v ? 420 : 370;
  const x = mix(center, v ? W / 2 : 1330, W / 2);
  const y = mix(center, v ? 1330 : 560, v ? 1020 : 600) + (1 - rise) * H * 0.7;
  const rotY = mix(center, -26 * (1 - rise) - 14, 0) + Math.sin(t * 0.9) * 3 * center;
  const rotX = 8 * (1 - rise);
  return <Phone3D x={x} y={y} w={mix(center, w0, w1)} rotY={rotY} rotX={rotX} scale={1 + push * 1.6} opacity={1 - push} blur={push * 14}
    src="accueil" src2={t < 7.3 ? 'sommeil' : 'journee-biberons'} swap={t < 7.3 ? win(t, 6.0, 7.35, 0.4, 0.3) : prog(t, 7.25, 7.6)} />;
};

/* ───────── 04–09 : tous vos outils (cartes de verre animées) ───────── */
const Mini: React.FC<{ kind: string; p: number; t: number }> = ({ kind, p, t }) => {
  const bar = (w: number, c = T.ink) => <div style={{ height: 8, borderRadius: 8, background: 'rgba(11,11,12,.08)' }}><div style={{ width: `${w * 100}%`, height: '100%', borderRadius: 8, background: c }} /></div>;
  switch (kind) {
    case 'Grossesse': return <><div style={{ fontSize: 22, color: MUTED, fontWeight: 700 }}>Semaine {Math.round(mix(p, 12, 24))}</div>{bar(p * 0.6, '#C9A6FF')}</>;
    case 'Sommeil': { const s = Math.floor(8400 + (t - 4.6) * 1); return <div style={{ fontSize: 34, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{Math.floor(s / 3600)} h {String(Math.floor((s % 3600) / 60)).padStart(2, '0')}<span style={{ fontSize: 22, color: MUTED }}> :{String(s % 60).padStart(2, '0')}</span></div>; }
    case 'Biberon': return <div style={{ fontSize: 34, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{Math.round(150 * p)} <span style={{ fontSize: 22, color: MUTED }}>ml</span></div>;
    case 'Allaitement': return <div style={{ display: 'flex', gap: 8 }}>{['Gauche', 'Droite'].map((s, i) => <div key={s} style={{ flex: 1, padding: '6px 0', textAlign: 'center', borderRadius: 12, fontSize: 18, fontWeight: 700, background: i === 0 ? T.ink : 'rgba(11,11,12,.07)', color: i === 0 ? '#fff' : T.ink }}>{s}{i === 0 ? ` · ${Math.round(12 * p)} min` : ''}</div>)}</div>;
    case 'Croissance': return <svg width="100%" height="46" viewBox="0 0 240 46"><path d="M4 42 C 50 38, 80 26, 120 20 S 200 8, 236 5" fill="none" stroke="#7FB8FF" strokeWidth="5" strokeLinecap="round" strokeDasharray="260" strokeDashoffset={260 * (1 - p)} /></svg>;
    case 'Santé': return <div style={{ display: 'flex', gap: 8, fontSize: 18, fontWeight: 700 }}>{['Vaccins', 'Rendez-vous'].map((s, i) => <span key={s} style={{ opacity: prog(p, i * 0.4, i * 0.4 + 0.4), padding: '4px 10px', borderRadius: 10, background: 'rgba(76,175,120,.14)', color: '#2E7D57' }}>✓ {s}</span>)}</div>;
    case 'Organisation familiale': return <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>{[0, 1, 2].map((i) => <div key={i} style={{ width: 26, height: 26, borderRadius: 8, border: '2.5px solid ' + T.ink, background: p > 0.3 + i * 0.25 ? T.ink : 'transparent', color: '#fff', fontSize: 16, textAlign: 'center', lineHeight: '22px' }}>{p > 0.3 + i * 0.25 ? '✓' : ''}</div>)}<span style={{ fontSize: 20, color: MUTED, fontWeight: 700, marginLeft: 6 }}>Tâches</span></div>;
    case 'Couple': return <div style={{ fontSize: 20, fontWeight: 700, color: MUTED }}>Mission à deux · <span style={{ color: '#E06A9A' }}>{Math.round(p * 3)}/3</span></div>;
    case 'Budget': return <div style={{ display: 'flex', gap: 7, alignItems: 'flex-end', height: 46 }}>{[0.5, 0.8, 0.35, 0.65, 0.9].map((hh, i) => <div key={i} style={{ flex: 1, height: `${hh * 100 * prog(p, i * 0.1, i * 0.1 + 0.5)}%`, borderRadius: 6, background: i === 4 ? '#7FD1FF' : 'rgba(11,11,12,.16)' }} />)}</div>;
    case 'Communauté': return <div style={{ display: 'flex' }}>{['#B9A6FF', '#7FD1FF', '#FFC7E1', '#FFD99A'].map((c, i) => <div key={c} style={{ width: 36, height: 36, borderRadius: 99, background: c, border: '3px solid #fff', marginLeft: i ? -10 : 0, transform: `scale(${prog(p, i * 0.15, i * 0.15 + 0.4)})` }} />)}</div>;
    default: return null;
  }
};
const TOOLS = ['Grossesse', 'Sommeil', 'Biberon', 'Allaitement', 'Croissance', 'Santé', 'Organisation familiale', 'Couple', 'Budget', 'Communauté'];
const Tools: React.FC<P> = ({ t, fps, l }) => {
  const { W, v } = l;
  if (t < 4.1 || t > 9.4) return null;
  const px = W / 2; const py = v ? 1020 : 600;
  const exit = prog(t, 8.7, 9.3);
  // positions finales : V = deux colonnes de 5 de part et d'autre du téléphone ; H = 4 colonnes (3-2-2-3)
  const slots: [number, number][] = v
    ? [0, 1, 2, 3, 4].flatMap((r) => [[178, 590 + r * 215], [902, 590 + r * 215]] as [number, number][])
    : [[245, 330], [245, 600], [245, 870], [600, 465], [600, 735], [1320, 465], [1320, 735], [1675, 330], [1675, 600], [1675, 870]];
  const cw = v ? 300 : 320; const ch = v ? 178 : 150;
  return (
    <>
      <KText t={t} at={4.5} out={8.6} x={W / 2} y={v ? 290 : 112} size={v ? 84 : 66} w={v ? 1000 : 1700}>De la grossesse{v ? <br /> : ' '}<span style={{ color: MUTED }}>à ses 10 ans.</span></KText>
      {TOOLS.map((name, i) => {
        const at = 4.7 + i * 0.13;
        const s = spr(t, at, fps, 15, 0.7);
        const [fx, fy] = slots[i];
        const dirx = fx - px; const diry = fy - py;
        const x = mix(s, px, fx) + dirx * exit * 0.5; const y = mix(s, py, fy) + diry * exit * 0.5 + Math.sin(t * 1.3 + i) * 5;
        const p = prog(t, at + 0.2, at + 1.6);
        return <Glass key={name} x={x} y={y} w={cw} h={ch} o={Math.min(1, s * 1.4) * (1 - exit)} s={0.5 + s * 0.5} blur={exit * 10} r={28}
          style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ fontSize: name.length > 14 ? 22 : 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{name}</div>
          <Mini kind={name} p={p} t={t} />
        </Glass>;
      })}
      {/* pastille repère du téléphone */}
      <div style={{ position: 'absolute', left: px, top: py }} />
    </>
  );
};

/* ───────── 09–16 : Aura (interface de conversation, chaînes réelles de l'app) ───────── */
const Typed: React.FC<{ t: number; a: number; b: number; text: string }> = ({ t, a, b, text }) => {
  const n = Math.floor(prog(t, a, b, (x) => x) * text.length);
  return <>{text.slice(0, n)}{t > a && t < b + 0.15 ? <span style={{ display: 'inline-block', width: 2, height: 18, background: '#7B6CF6', marginLeft: 1, verticalAlign: 'middle' }} /> : null}</>;
};
const Bubble: React.FC<{ o: number; children: React.ReactNode }> = ({ o, children }) => (
  <div style={{ alignSelf: 'flex-end', maxWidth: 280, padding: '11px 15px', borderRadius: 20, borderBottomRightRadius: 6, background: T.ink, color: '#fff', fontSize: 16, fontWeight: 600, opacity: o, transform: `translateY(${(1 - o) * 14}px) scale(${0.94 + o * 0.06})`, transformOrigin: 'right bottom' }}>{children}</div>
);
const Card: React.FC<{ o: number; children: React.ReactNode }> = ({ o, children }) => (
  <div style={{ alignSelf: 'stretch', padding: 14, borderRadius: 20, background: '#fff', border: '1px solid #E7E7EC', boxShadow: '0 10px 24px -16px rgba(0,0,0,.25)', opacity: o, transform: `translateY(${(1 - o) * 18}px)` }}>{children}</div>
);
const AuraChat: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const saved = prog(t, 11.55, 11.8);
  const m1 = spr(t, 10.75, fps, 18); const c1 = spr(t, 11.1, fps, 18); const m2 = spr(t, 13.35, fps, 18); const c2 = spr(t, 13.75, fps, 18);
  const stats = prog(t, 11.9, 12.6);
  const line = (k: number) => prog(t, 13.95 + k * 0.18, 14.2 + k * 0.18);
  const typing1 = t >= 9.9 && t < 10.75; const typing2 = t >= 12.55 && t < 13.35;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#F6F6F8', fontFamily: 'Manrope', color: T.ink }}>
      <div style={{ position: 'absolute', left: 26, top: 16, fontSize: 15, fontWeight: 800 }}>21:42</div>
      <div style={{ position: 'absolute', left: 22, top: 62 }}>
        <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em' }}>Aura</div>
        <div style={{ fontSize: 14, color: MUTED, fontWeight: 600 }}>Ton assistante HOMI</div>
      </div>
      <div style={{ position: 'absolute', left: 16, right: 16, top: 140, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {m1 > 0 ? <Bubble o={m1}>Il vient de boire 150 ml.</Bubble> : null}
        {c1 > 0 ? <Card o={c1}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 99, background: saved > 0.5 ? '#2E9E6A' : '#EEEAFE', color: '#fff', fontSize: 17, fontWeight: 800, textAlign: 'center', lineHeight: '30px', transform: `scale(${1 + Math.sin(saved * Math.PI) * 0.25})` }}>{saved > 0.5 ? '✓' : ''}</div>
            <div style={{ flex: 1, fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>{saved > 0.5 ? 'Biberon enregistré — 150 ml' : 'Biberon de Lina : 150 ml bus à 21:42'}</div>
            {saved > 0.5 ? <div style={{ fontSize: 14, fontWeight: 700, color: '#6B5BE6', opacity: saved }}>Annuler</div> : null}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12, opacity: stats, height: stats * 62, overflow: 'hidden' }}>
            {[['Biberons', `${Math.round(mix(prog(t, 12.0, 12.4), 4, 5))}`], ['Aujourd’hui', `${Math.round(mix(prog(t, 12.0, 12.7), 600, 750))} ml`], ['Relais', 'À jour']].map(([k, val], i) => (
              <div key={k} style={{ flex: 1, padding: '8px 10px', borderRadius: 14, background: i === 2 ? 'rgba(123,108,246,.12)' : '#F3F3F6' }}>
                <div style={{ fontSize: 11, color: MUTED, fontWeight: 700 }}>{k}</div>
                <div style={{ fontSize: 18, fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: i === 2 ? '#5B4BD6' : T.ink }}>{val}</div>
              </div>
            ))}
          </div>
        </Card> : null}
        {m2 > 0 ? <Bubble o={m2}>Prépare le relais de cette nuit.</Bubble> : null}
        {c2 > 0 ? <Card o={c2}>
          <div style={{ fontSize: 16, fontWeight: 800 }}>Préparer le relais de Lina</div>
          {[['Biberon', '150 ml à 21:42'], ['Sieste', '14:20 – 15:40'], ['Couche', '21:30']].map(([a, b], k) => (
            <div key={a} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, fontSize: 14, opacity: line(k), transform: `translateX(${(1 - line(k)) * 16}px)` }}>
              <span style={{ fontWeight: 700 }}>{a}</span><span style={{ color: MUTED, fontWeight: 600 }}>{b}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, fontSize: 12, color: MUTED, lineHeight: 1.35, opacity: line(3) }}>Le brouillon s’ouvre : tu relis et choisis ce que tu partages avant d’envoyer.</div>
        </Card> : null}
      </div>
      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 30, height: 50, borderRadius: 25, background: '#fff', border: '1px solid #E4E4EA', display: 'flex', alignItems: 'center', padding: '0 8px 0 18px', fontSize: 16, fontWeight: 600 }}>
        <div style={{ flex: 1, color: typing1 || typing2 ? T.ink : '#A3A3AB' }}>
          {typing1 ? <Typed t={t} a={9.9} b={10.6} text="Il vient de boire 150 ml." /> : typing2 ? <Typed t={t} a={12.55} b={13.2} text="Prépare le relais de cette nuit." /> : 'Écris à Aura…'}
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 99, background: typing1 || typing2 ? T.ink : '#D9D9DF', color: '#fff', textAlign: 'center', lineHeight: '36px', fontWeight: 800 }}>↑</div>
      </div>
    </div>
  );
};
const AuraScene: React.FC<P> = ({ t, fps, l }) => {
  const { W, v } = l;
  if (t < 8.9 || t > 16.5) return null;
  const inO = prog(t, 9.0, 9.7); const out = prog(t, 15.95, 16.4);
  const think = Math.max(win(t, 10.7, 11.5, 0.15, 0.3), win(t, 13.3, 14.0, 0.15, 0.3));
  const orbIn = spr(t, 9.05, fps, 12, 1);
  const ox = v ? W / 2 : 560; const oy = v ? 300 : 430; const orr = (v ? 108 : 128) * (0.4 + orbIn * 0.6) * (1 + think * 0.12);
  const ph = spr(t, 9.5, fps, 18, 1);
  const pw = v ? 480 : 420; const pxx = v ? W / 2 : 1330; const pyy = (v ? 1330 : 560) + (1 - ph) * 500;
  // cartes qui convergent vers le relais (13,8 s)
  const chips = ['Biberon', 'Sommeil', 'Couches'];
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - out, filter: out ? `blur(${out * 12}px)` : undefined }}>
      <Orb t={t} x={ox} y={oy} r={orr} energy={0.35 + think * 0.9} o={inO} />
      <Phone3D x={pxx} y={pyy} w={pw} rotY={v ? 0 : -10 + Math.sin(t * 0.8) * 2} rotX={v ? 4 : 0} opacity={Math.min(1, ph * 2.5)} dark><AuraChat t={t} fps={fps} /></Phone3D>
      {chips.map((c, i) => {
        const p = prog(t, 13.45 + i * 0.08, 14.15 + i * 0.08);
        if (p <= 0 || p >= 1) return null;
        const sx = ox + (i - 1) * (v ? 210 : 180); const sy = oy + (v ? 150 : 190);
        const tx = pxx; const ty = pyy - (v ? 0 : 60);
        return <Glass key={c} dark x={mix(p, sx, tx)} y={mix(p, sy, ty) - Math.sin(p * Math.PI) * 120} w={170} h={56} o={Math.sin(p * Math.PI)} s={mix(p, 1, 0.5)} r={20}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800 }}>{c}</Glass>;
      })}
      {['Elle comprend.', 'Elle organise.', 'Elle agit.'].map((s, i) => (
        <KText key={s} t={t} at={13.95 + i * 0.32} out={14.95} x={v ? W / 2 : 560} y={v ? 590 : 760} size={v ? 54 : 58} w={v ? 1000 : 900} color={i === 2 ? '#fff' : '#BDBDC8'}>
          <span style={{ position: 'relative', top: (i - 1) * (v ? 66 : 70) }}>{s}</span>
        </KText>
      ))}
      <KText t={t} at={15.0} out={16.0} x={v ? W / 2 : 560} y={v ? 590 : 760} size={v ? 60 : 64} w={v ? 1000 : 900} color="#fff">
        Aura.<br /><span style={{ color: '#BDBDC8', fontSize: '0.62em', letterSpacing: '-0.02em' }}>Votre copilote familial intelligent.</span>
      </KText>
    </div>
  );
};

/* ───────── 16–21 : tout se synchronise (deux téléphones, impulsions) ───────── */
const Toast: React.FC<{ o: number; a: string; b: string }> = ({ o, a, b }) => (
  <div style={{ position: 'absolute', left: 12, right: 12, top: 58, padding: '12px 14px', borderRadius: 22, background: 'rgba(255,255,255,.92)', boxShadow: '0 14px 30px -14px rgba(0,0,0,.35)', border: '1px solid #ECECF0',
    opacity: o, transform: `translateY(${(1 - o) * -30}px) scale(${0.92 + o * 0.08})`, fontFamily: 'Manrope' }}>
    <div style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{a}</div><div style={{ fontSize: 13, fontWeight: 600, color: MUTED, marginTop: 2 }}>{b}</div>
  </div>
);
const Sync: React.FC<P> = ({ t, fps, l }) => {
  const { W, v } = l;
  if (t < 15.9 || t > 21.6) return null;
  const inO = prog(t, 16.0, 16.6); const out = prog(t, 20.95, 21.4);
  const pA = spr(t, 16.1, fps, 18, 1); const pB = spr(t, 16.3, fps, 18, 1);
  const A = { x: v ? 300 : 700, y: v ? 1040 : 590 }; const B = { x: v ? 780 : 1220, y: v ? 1040 : 590 };
  const pw = v ? 400 : 330;
  const C: Record<string, [number, number]> = v
    ? { Biberon: [190, 470], Statistiques: [540, 470], Relais: [890, 470], Coparent: [890, 1610], Sommeil: [190, 1790], Planning: [540, 1790], Accueil: [890, 1790] }
    : { Biberon: [240, 270], Statistiques: [240, 530], Relais: [240, 790], Coparent: [960, 975], Sommeil: [1680, 270], Planning: [1680, 530], Accueil: [1680, 790] };
  const flows: [string[], number][] = [[['Biberon', 'Statistiques', 'Relais', 'Coparent'], 16.7], [['Sommeil', 'Planning', 'Accueil'], 17.4]];
  const toastA = spr(t, 18.55, fps, 16); const toastB = spr(t, 19.25, fps, 16);
  const hop = prog(t, 18.7, 19.25, (x) => x);
  const ax = A.x; const ay = A.y - (v ? 330 : 280); const bx = B.x; const by = B.y - (v ? 330 : 280);
  const lit = (name: string) => flows.some(([path, at]) => path.some((n, k) => n === name && t > at + k * 0.38 && t < at + k * 0.38 + 0.6));
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: inO * (1 - out), filter: out ? `blur(${out * 10}px)` : undefined }}>
      <KText t={t} at={16.3} out={20.9} x={W / 2} y={v ? 230 : 90} size={v ? 76 : 62} w={v ? 1000 : 1800}>
        Une seule action.{v ? <br /> : ' '}<span style={{ color: MUTED }}>Tout se synchronise.</span>
      </KText>
      <svg width={l.W} height={l.H} style={{ position: 'absolute', inset: 0 }}>
        {flows.map(([path, at]) => path.slice(1).map((n, k) => {
          const [x1, y1] = C[path[k]]; const [x2, y2] = C[n];
          const p = prog(t, at + k * 0.38, at + k * 0.38 + 0.38, (x) => x);
          const bend = v && path[k] === 'Relais' ? 160 : 0;
          const d = `M${x1} ${y1} Q ${(x1 + x2) / 2 + (bend || (y1 === y2 ? 0 : -60))} ${(y1 + y2) / 2 + (y1 === y2 ? -70 : 0)} ${x2} ${y2}`;
          return <g key={path[k] + n}>
            <path d={d} fill="none" stroke="rgba(123,108,246,.22)" strokeWidth={3} strokeDasharray="6 10" />
            <path d={d} fill="none" stroke="url(#pulse)" strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray="0.18 1" strokeDashoffset={0.18 - p * 1.18} opacity={p > 0 && p < 1 ? 1 : 0} />
          </g>;
        }))}
        <defs><linearGradient id="pulse"><stop offset="0" stopColor="#7FD1FF" /><stop offset="1" stopColor="#B9A6FF" /></linearGradient></defs>
        {hop > 0 && hop < 1 ? (() => {
          const qx = (ax + bx) / 2; const qy = Math.min(ay, by) - (v ? 120 : 150);
          const x = (1 - hop) ** 2 * ax + 2 * (1 - hop) * hop * qx + hop ** 2 * bx; const y = (1 - hop) ** 2 * ay + 2 * (1 - hop) * hop * qy + hop ** 2 * by;
          return <g><circle cx={x} cy={y} r={26} fill="rgba(185,166,255,.35)" /><circle cx={x} cy={y} r={11} fill="#fff" stroke="#9C8BFF" strokeWidth={4} /></g>;
        })() : null}
      </svg>
      <Phone3D x={A.x} y={A.y + (1 - pA) * 400} w={pw} rotY={v ? 8 : 14} opacity={pA} src="journee-biberons"><Toast o={toastA} a="Biberon · 150 ml" b="Noté à 21:42" /></Phone3D>
      <Phone3D x={B.x} y={B.y + (1 - pB) * 400} w={pw} rotY={v ? -8 : -14} opacity={pB} src="relais-nuit"><Toast o={toastB} a="Camille a noté un biberon" b="150 ml · à l’instant" /></Phone3D>
      {[['Camille', A], ['Sam', B]].map(([n, P]) => {
        const pp = P as { x: number; y: number };
        return <div key={n as string} style={{ position: 'absolute', left: pp.x - 150, width: 300, top: pp.y + pw * 1.03 + 18, textAlign: 'center', fontSize: v ? 30 : 26, fontWeight: 800, color: '#55555C', opacity: prog(t, 16.6, 17.0) }}>{n as string}</div>;
      })}
      {Object.entries(C).map(([n, [x, y]], i) => {
        const s = spr(t, 16.25 + i * 0.07, fps, 15);
        const on = lit(n);
        return <Glass key={n} x={x} y={y + Math.sin(t * 1.4 + i) * 6} w={v ? 250 : 240} h={v ? 74 : 66} o={s} s={(0.7 + s * 0.3) * (on ? 1.06 : 1)} r={22}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: v ? 28 : 26, fontWeight: 800, boxShadow: on ? '0 0 0 3px rgba(155,139,255,.55), 0 20px 50px -20px rgba(123,108,246,.6)' : undefined }}>
          <span style={{ width: 10, height: 10, borderRadius: 9, background: on ? '#8C7BFF' : '#C9C9D1' }} />{n}
        </Glass>;
      })}
    </div>
  );
};

/* ───────── 21–25 : Mon histoire (album → livre, pages qui tournent) ───────── */
const CHAPTERS: [string, string, string][] = [
  ['Naissance', 'etape-05', '21 octobre 2025'], ['Premiers sourires', 'etape-06', '6 semaines'], ['Premiers pas', 'etape-07', '13 mois'],
  ['Premier anniversaire', 'etape-08', '1 an'], ['Première rentrée', 'etape-09', '3 ans'], ['10 ans', 'etape-10', '10 ans'],
];
const Page: React.FC<{ c: [string, string, string]; w: number; h: number; photo?: number }> = ({ c, w, h, photo = 0 }) => (
  <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: 'linear-gradient(160deg,#FFFDF9,#F6F1EA)', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.05)', padding: w * 0.08, fontFamily: 'Manrope', color: T.ink, overflow: 'hidden' }}>
    <div style={{ fontSize: w * 0.04, fontWeight: 700, color: '#B08A5B', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Mon histoire</div>
    <div style={{ fontSize: w * 0.085, fontWeight: 800, letterSpacing: '-0.035em', marginTop: w * 0.02, lineHeight: 1.05 }}>{c[0]}</div>
    <div style={{ fontSize: w * 0.04, fontWeight: 600, color: MUTED, marginTop: w * 0.015 }}>{c[2]}</div>
    <div style={{ position: 'absolute', left: w * 0.08, right: w * 0.08, bottom: w * 0.08, top: h * 0.3, borderRadius: 14, background: '#F2EBE1', overflow: 'hidden' }}>
      {photo ? <Img src={staticFile('art/bebe.webp')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: photo }} /> : null}
      <Img src={staticFile(`art/${c[1]}.png`)} style={{ position: 'absolute', inset: '6%', width: '88%', height: '88%', objectFit: 'contain', opacity: 1 - photo }} />
    </div>
  </div>
);
const Story: React.FC<P> = ({ t, fps, l }) => {
  const { W, H, v } = l;
  if (t < 20.9 || t > 25.8) return null;
  const inO = prog(t, 21.0, 21.5); const out = prog(t, 25.15, 25.6);
  const pw = v ? 760 : 560; const ph = v ? 1000 : 740;
  const bx = W / 2 + (v ? 0 : 280); const by = v ? 1060 : 560;
  // 21,2 → 22,6 : la photo de l'album (tuile) grandit et devient la page « Naissance »
  const tile = spr(t, 21.2, fps, 16);
  const grow = prog(t, 22.05, 22.85);
  const tw = mix(grow, v ? 300 : 260, pw); const th = mix(grow, v ? 300 : 260, ph);
  const tx = mix(grow, v ? 540 : 520, bx); const ty = mix(grow, v ? 900 : 560, by);
  const flips = [23.0, 23.38, 23.76, 24.14, 24.52];
  const idx = flips.filter((f) => t >= f + 0.36).length; // pages entièrement tournées
  const auraChip = win(t, 21.7, 22.9, 0.25, 0.3);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: inO * (1 - out), filter: out ? `blur(${out * 10}px)` : undefined }}>
      <KText t={t} at={21.5} out={25.1} x={v ? W / 2 : 140} y={v ? 270 : 470} size={v ? 82 : 76} w={v ? 1000 : 640} align={v ? 'center' : 'left'}>
        Il grandit.<br /><span style={{ color: MUTED }}>Son histoire aussi.</span>
      </KText>
      {/* album : grille réelle de souvenirs (tuiles) */}
      {grow < 1 ? [0, 1, 2, 3].map((k) => k === 0 ? null : (
        <div key={k} style={{ position: 'absolute', left: (v ? 540 : 520) + ((k % 2) * 2 - 1) * (v ? 320 : 280) * (k === 3 ? 0 : 1) - (v ? 150 : 130), top: (v ? 900 : 560) + (k === 3 ? (v ? 330 : 290) : 0) - (v ? 150 : 130),
          width: v ? 300 : 260, height: v ? 300 : 260, borderRadius: 22, background: 'linear-gradient(140deg,#EFE9F7,#E6EEF6)', opacity: tile * 0.8 * (1 - grow), transform: `scale(${0.9 + tile * 0.1})` }} />
      )) : null}
      <div style={{ position: 'absolute', left: tx - tw / 2, top: ty - th / 2, width: tw, height: th, borderRadius: mix(grow, 22, 18), overflow: 'hidden', opacity: tile, transform: `scale(${0.85 + tile * 0.15})`, boxShadow: '0 40px 80px -40px rgba(60,40,20,.45)' }}>
        {grow < 0.98 ? <Img src={staticFile('art/bebe.webp')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', background: '#F2EBE1', opacity: 1 - grow }} /> : null}
        <div style={{ position: 'absolute', inset: 0, opacity: grow }}><Page c={CHAPTERS[0]} w={pw} h={ph} photo={1} /></div>
      </div>
      <Glass x={v ? W / 2 : 520} y={v ? 455 : 250} w={v ? 620 : 520} h={v ? 84 : 72} o={auraChip} r={40} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 22px', fontSize: v ? 28 : 24, fontWeight: 800 }}>
        <div style={{ width: v ? 40 : 34, height: v ? 40 : 34, borderRadius: 99, background: `conic-gradient(from ${t * 90}deg, ${T.aura.join(',')}, ${T.aura[0]})` }} />Je construis l’histoire de Lina
      </Glass>
      {/* livre : pile de pages, la page du dessus tourne autour de son bord gauche */}
      {t >= 22.85 ? (
        <div style={{ position: 'absolute', left: bx - pw / 2, top: by - ph / 2, width: pw, height: ph, perspective: pw * 3.2 }}>
          {CHAPTERS.slice(idx + 1, idx + 2).map((c) => <div key={c[0]} style={{ position: 'absolute', inset: 0 }}><Page c={c} w={pw} h={ph} /></div>)}
          {(() => {
            const f = flips[idx]; const p = f !== undefined ? prog(t, f, f + 0.36, (x) => x * x * (3 - 2 * x)) : 0;
            const c = CHAPTERS[idx];
            return <div style={{ position: 'absolute', inset: 0, transformOrigin: 'left center', transform: `rotateY(${-p * 178}deg)`, transformStyle: 'preserve-3d' }}>
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}><Page c={c} w={pw} h={ph} photo={idx === 0 ? 1 : 0} /></div>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: 'linear-gradient(200deg,#F3ECE2,#E9E0D3)', transform: 'rotateY(180deg)', backfaceVisibility: 'hidden' }} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: `linear-gradient(90deg, rgba(0,0,0,${Math.sin(p * Math.PI) * 0.18}), transparent 60%)`, pointerEvents: 'none' }} />
            </div>;
          })()}
        </div>
      ) : null}
    </div>
  );
};

/* ───────── 25–30 : final ───────── */
const FINAL_CHIPS = ['Sommeil', 'Biberon', 'Grossesse', 'Relais', 'Santé', 'Couple', 'Budget', 'Mon histoire'];
const Finale: React.FC<P> = ({ t, fps, l }) => {
  const { W, H, v } = l;
  if (t < 25.1) return null;
  const inO = prog(t, 25.2, 25.7);
  const ph = spr(t, 25.25, fps, 18, 1);
  const conv = prog(t, 25.6, 26.6);
  const leave = prog(t, 27.55, 28.15);
  const px = v ? W / 2 : 1330; const py = v ? 1180 : 560; const pw = v ? 470 : 380;
  const rotY = mix(ph, 38, -10) + mix(prog(t, 26.0, 27.6), 0, 16);
  const logo = spr(t, 27.8, fps, 14); const tag = prog(t, 28.25, 28.85);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: inO }}>
      <Orb t={t} x={px} y={py} r={(v ? 150 : 130) * (0.6 + conv * 0.4)} energy={0.5} o={conv * (1 - leave) * 0.9} />
      {FINAL_CHIPS.map((c, i) => {
        const a = (i / FINAL_CHIPS.length) * Math.PI * 2 + 0.3; const R = (v ? 520 : 600) * (1 - conv) + 40;
        const x = px + Math.cos(a) * R * (v ? 0.95 : 1.15); const y = py + Math.sin(a) * R * (v ? 1.25 : 0.75);
        return <Glass key={c} x={x} y={y} w={v ? 240 : 220} h={v ? 70 : 62} o={prog(t, 25.25 + i * 0.04, 25.6 + i * 0.04) * (1 - conv)} s={1 - conv * 0.6} r={22}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: v ? 26 : 24, fontWeight: 800 }}>{c}</Glass>;
      })}
      <Phone3D x={mix(leave, px, px)} y={py + (1 - ph) * 500 + leave * 60} w={pw} rotY={rotY} opacity={ph * (1 - leave)} blur={leave * 10} scale={1 - leave * 0.08} src="accueil" />
      {/* balayage de lumière studio sur le téléphone */}
      <KText t={t} at={25.25} out={26.45} x={v ? W / 2 : 150} y={v ? 330 : 540} size={v ? 84 : 84} w={v ? 1000 : 820} align={v ? 'center' : 'left'}>Moins de charge mentale.</KText>
      <KText t={t} at={26.55} out={27.6} x={v ? W / 2 : 150} y={v ? 330 : 540} size={v ? 84 : 84} w={v ? 1000 : 820} align={v ? 'center' : 'left'} color={'#6E5CE6'}>Plus de moments ensemble.</KText>
      <div style={{ position: 'absolute', left: W / 2, top: H / 2 - (v ? 60 : 50), transform: `translate(-50%,-50%) scale(${0.8 + logo * 0.2})`, opacity: logo, filter: `blur(${(1 - logo) * 14}px)` }}>
        <Logo h={v ? 150 : 150} />
      </div>
      <div style={{ position: 'absolute', left: 0, width: W, top: H / 2 + (v ? 90 : 90), textAlign: 'center', fontSize: v ? 50 : 50, fontWeight: 700, letterSpacing: '-0.02em', color: MUTED, opacity: tag, transform: `translateY(${(1 - tag) * 16}px)`, filter: `blur(${(1 - tag) * 8}px)` }}>
        La famille, autrement.
      </div>
    </div>
  );
};

export const Pub30: React.FC<{ vertical: boolean; voice: boolean }> = ({ vertical, voice }) => {
  const { t, fps } = useTime();
  const { width } = useVideoConfig();
  const l: L = vertical ? { W: 1080, H: 1920, v: true } : { W: 1920, H: 1080, v: false };
  const k = width / l.W;
  const dark = Math.min(prog(t, 8.95, 9.5), 1 - prog(t, 15.95, 16.5));
  const p = { t, fps, l };
  return (
    <AbsoluteFill style={{ background: T.bg }}>
      <Audio src={staticFile(voice ? 'audio/pub30-mix.wav' : 'audio/pub30-mix-sans-voix.wav')} />
      <div style={{ width: l.W, height: l.H, transform: `scale(${k})`, transformOrigin: 'top left', position: 'relative', overflow: 'hidden', fontFamily: `${T.font}, sans-serif`, color: T.ink }}>
        <Backdrop t={t} l={l} dark={dark} />
        <Hook {...p} />
        <Tools {...p} />
        <HeroPhone {...p} />
        <AuraScene {...p} />
        <Sync {...p} />
        <Story {...p} />
        <Finale {...p} />
      </div>
    </AbsoluteFill>
  );
};
