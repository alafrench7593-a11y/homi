/** Publicité HOMI « Neuf mois, une nouvelle vie » — 30 s, 60 i/s, verticale 1080×1920 et horizontale (1920×1080 ×2 = 4K).
 *  Écrans RÉELS de l'espace Grossesse (mode démo, 26 SA), illustrations RÉELLES de l'app (bébé à naître de 4 à 40 SA,
 *  future maman, parent et nouveau-né), robot Aura réel. Aucune échographie inventée : l'app précise que ses visuels
 *  du bébé sont artistiques. Minutage de la voix : scripts/grossesse30_audio.py. */
import React from 'react';
import { AbsoluteFill, Audio, Img, staticFile, useVideoConfig } from 'remotion';
import { loadFont } from '@remotion/fonts';
import { T } from '../tokens';
import { AuraRobot, BotState, Glass, KText, L, Logo, Phone3D, mix, prog, spr, useTime, win } from './parts';

for (const [w, n] of [['500Medium', 500], ['700Bold', 700], ['800ExtraBold', 800]] as const) {
  loadFont({ family: 'Manrope', url: staticFile(`fonts/Manrope_${w}.ttf`), weight: String(n) }).catch(() => undefined);
}
const INK = '#2A2224'; const MUTED = '#9A8A86'; const ROSE = '#E7B7B5'; const GOLD = '#E9C38A';
type P = { t: number; fps: number; l: L };

/** Fond beige / rose poudré / blanc nacré, lumière dorée lente ; « dusk » assombrit doucement pour Aura. */
const Warm: React.FC<{ t: number; l: L; dusk: number }> = ({ t, l, dusk }) => {
  const D = Math.max(l.W, l.H);
  const blobs = [{ c: 'rgba(233,195,138,.35)', x: 0.25, y: 0.2, r: 0.7 }, { c: 'rgba(231,183,181,.35)', x: 0.8, y: 0.45, r: 0.6 }, { c: 'rgba(255,255,255,.7)', x: 0.5, y: 0.9, r: 0.7 }];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'radial-gradient(120% 90% at 40% 10%, #FFF9F3 0%, #F6ECE4 55%, #EEDFD6 100%)' }}>
      {blobs.map((b, k) => <div key={k} style={{ position: 'absolute', left: (b.x + Math.sin(t * 0.35 + k) * 0.05) * l.W - b.r * D / 2, top: (b.y + Math.cos(t * 0.3 + k) * 0.05) * l.H - b.r * D / 2, width: b.r * D, height: b.r * D, borderRadius: '50%', background: `radial-gradient(circle, ${b.c}, transparent 65%)` }} />)}
      <div style={{ position: 'absolute', inset: 0, opacity: dusk, background: 'radial-gradient(110% 85% at 50% 35%, #4A3640 0%, #2A2027 60%, #1C161B 100%)' }} />
      {Array.from({ length: 18 }).map((_, k) => {
        const x = ((k * 0.173 + t * 0.012 * (1 + (k % 3))) % 1) * l.W; const y = (1 - ((k * 0.311 + t * 0.02 * (1 + (k % 4) * 0.4)) % 1)) * l.H;
        return <div key={'p' + k} style={{ position: 'absolute', left: x, top: y, width: 4 + (k % 3) * 2, height: 4 + (k % 3) * 2, borderRadius: 9, background: GOLD, boxShadow: `0 0 12px ${GOLD}`, opacity: 0.25 + 0.3 * Math.sin(t * 1.5 + k) ** 2 }} />;
      })}
    </div>
  );
};
const Art: React.FC<{ src: string; x: number; y: number; s: number; o?: number; blur?: number; round?: boolean; glow?: boolean }> = ({ src, x, y, s, o = 1, blur = 0, round, glow }) => o <= 0.001 ? null : (
  <div style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, opacity: o, filter: blur ? `blur(${blur}px)` : undefined, borderRadius: round ? '50%' : 0, overflow: round ? 'hidden' : 'visible',
    boxShadow: glow ? `0 0 ${s * 0.25}px ${s * 0.05}px rgba(233,195,138,.55)` : undefined }}>
    <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: round ? 'scale(1.34)' : undefined }} />
  </div>
);

/* ── 00–04 : une nouvelle aventure ── */
const Intro: React.FC<P> = ({ t, fps, l }) => {
  const { W, H, v } = l;
  if (t > 4.6) return null;
  const mom = prog(t, 0, 0.8); const toBaby = prog(t, 1.7, 2.5); const out = prog(t, 3.5, 3.95);
  const s = v ? 900 : 720;
  const mx = v ? W / 2 : 560; const my = v ? 1000 : 600;
  const bub = spr(t, 1.9, fps, 16);
  return (
    <>
      <Art src="art/grossesse.webp" x={mx} y={my + (1 - mom) * 40} s={s * mix(toBaby, 1, 1.5)} o={mom * (1 - toBaby)} blur={toBaby * 12} />
      {/* lumière douce sur le ventre puis bébé à naître (illustration artistique de l'app, 12 SA) */}
      <div style={{ position: 'absolute', left: mx - 220, top: my + (v ? 40 : 30) - 220, width: 440, height: 440, borderRadius: '50%', background: `radial-gradient(circle, rgba(255,226,180,${0.65 * win(t, 1.2, 2.8, 0.5, 0.6)}), transparent 65%)` }} />
      <Art src="foetus/sa-12.webp" x={mx} y={my - (v ? 80 : 20)} s={(v ? 520 : 440) * (0.6 + bub * 0.4)} o={bub * (1 - prog(t, 3.0, 3.6))} round glow />
      <Phone3D x={v ? W / 2 : 1340} y={(v ? 1140 : 560) + (1 - spr(t, 2.7, fps, 18, 1)) * H * 0.7} w={v ? 470 : 360} rotY={v ? -8 : -16} opacity={prog(t, 2.7, 3.1) * (1 - out)} src="g-accueil-1" />
      <KText t={t} at={0.55} out={3.85} x={W / 2} y={v ? 300 : 110} size={v ? 80 : 70} w={v ? 1000 : 1700} color={INK}>
        Neuf mois qui changent{v ? <br /> : ' '}<span style={{ color: MUTED }}>toute une vie.</span>
      </KText>
    </>
  );
};

/* ── 04–09 : semaine après semaine (frise 4 → 40 SA avec les vraies illustrations de l'app) ── */
const Weeks: React.FC<P> = ({ t, fps, l }) => {
  const { W, v } = l;
  if (t < 3.9 || t > 9.6) return null;
  const inO = prog(t, 3.95, 4.4); const out = prog(t, 9.0, 9.5);
  const wk = Math.round(mix(prog(t, 4.4, 8.3, (x) => x * x * (3 - 2 * x)), 4, 40));
  const img = `foetus/sa-${String(Math.min(41, Math.max(4, wk))).padStart(2, '0')}.webp`;
  const tri = wk < 15 ? 0 : wk < 29 ? 1 : 2; const left = Math.max(0, 41 - wk);
  const cx = v ? W / 2 : 620; const cy = v ? 820 : 470;
  const bub = (v ? 560 : 360) * mix(wk / 40, 0.55, 1);
  const barW = v ? 860 : 900; const bx = v ? W / 2 : 620; const by = v ? 1500 : 850;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: inO * (1 - out), filter: out ? `blur(${out * 10}px)` : undefined }}>
      <KText t={t} at={4.4} out={8.95} x={W / 2} y={v ? 230 : 95} size={v ? 78 : 64} w={v ? 1000 : 1800} color={INK}>Chaque semaine.{v ? <br /> : ' '}<span style={{ color: MUTED }}>Chaque évolution.</span></KText>
      <Art src={img} x={cx} y={cy} s={bub} round glow />
      <div style={{ position: 'absolute', left: cx + (v ? -barW / 2 : bub / 2 + 40), top: cy - (v ? -bub / 2 - 30 : 90), fontWeight: 800, color: INK, letterSpacing: '-0.05em', fontSize: v ? 150 : 150, lineHeight: 1, fontVariantNumeric: 'tabular-nums', width: v ? barW : 520, textAlign: v ? 'center' : 'left' }}>
        {wk}<span style={{ fontSize: '0.3em', marginLeft: 8, letterSpacing: '-0.02em' }}>SA</span>
        <div style={{ fontSize: v ? 34 : 30, fontWeight: 700, color: MUTED, letterSpacing: '-0.01em', marginTop: 6 }}>{left > 0 ? `encore ${left} semaine${left > 1 ? 's' : ''}` : 'Terme prévu'}</div>
      </div>
      {/* progression par trimestre (comme l'écran réel « Progression ») */}
      <div style={{ position: 'absolute', left: bx - barW / 2, top: by, width: barW }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {[0, 1, 2].map((k) => {
            const a = [4, 15, 29][k]; const b = [14, 28, 41][k]; const f = Math.max(0, Math.min(1, (wk - a) / (b - a)));
            return <div key={k} style={{ flex: 1 }}>
              <div style={{ height: 14, borderRadius: 9, background: 'rgba(42,34,36,.1)', overflow: 'hidden' }}><div style={{ width: `${f * 100}%`, height: '100%', background: `linear-gradient(90deg, ${ROSE}, ${GOLD})` }} /></div>
              <div style={{ marginTop: 10, fontSize: v ? 28 : 24, fontWeight: tri === k ? 800 : 600, color: tri === k ? INK : MUTED }}>{['1er trimestre', '2e trimestre', '3e trimestre'][k]}</div>
            </div>;
          })}
        </div>
      </div>
      <Phone3D x={v ? W / 2 : 1500} y={(v ? 1700 : 560) + (v ? 200 : 0)} w={v ? 0 : 340} rotY={-12} opacity={v ? 0 : prog(t, 4.6, 5.2)} src="g-accueil-2" />
    </div>
  );
};

/* ── 09–14 : tout pour préparer l'arrivée (outils réels, cartes de verre) ── */
const Mini: React.FC<{ k: string; p: number; t: number }> = ({ k, p, t }) => {
  const sm = { fontSize: 20, fontWeight: 700, color: MUTED } as const;
  switch (k) {
    case 'Rendez-vous': return <div style={{ fontSize: 30, fontWeight: 800 }}>J-{Math.round(mix(p, 34, 30))} <span style={sm}>· échographie</span></div>;
    case 'Échographies': return <div style={{ display: 'flex', gap: 6 }}>{['1re', '2e', '3e'].map((s, i) => <span key={s} style={{ padding: '4px 10px', borderRadius: 10, fontSize: 18, fontWeight: 800, background: i < 2 && p > 0.3 + i * 0.25 ? INK : 'rgba(42,34,36,.08)', color: i < 2 && p > 0.3 + i * 0.25 ? '#fff' : INK }}>{s}</span>)}</div>;
    case 'Symptômes': return <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{['Fatigue', 'Nausées'].map((s, i) => <span key={s} style={{ padding: '4px 10px', borderRadius: 10, fontSize: 18, fontWeight: 700, background: p > 0.3 + i * 0.3 ? ROSE : 'rgba(42,34,36,.07)' }}>{s}</span>)}</div>;
    case 'Mon poids': return <svg width="100%" height="44" viewBox="0 0 240 44"><path d="M4 38 C 60 34, 100 28, 140 20 S 210 10, 236 8" fill="none" stroke={GOLD} strokeWidth="5" strokeLinecap="round" strokeDasharray="260" strokeDashoffset={260 * (1 - p)} /></svg>;
    case 'Mouvements de bébé': return <div style={{ fontSize: 30, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{Math.round(p * 10)} <span style={sm}>mouvements</span></div>;
    case 'Contractions': { const s = Math.floor(Math.max(0, t - 10.2) * 1); return <div style={{ fontSize: 30, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>0:{String(Math.min(59, s * 7)).padStart(2, '0')}</div>; }
    case 'Projet de naissance': return <div style={{ fontSize: 22, fontWeight: 800 }}>{Math.round(p * 3)} <span style={sm}>sections sur 8</span></div>;
    case 'Valise de maternité': case 'Affaires de bébé': case 'Préparer la maison': return <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>{[0, 1, 2, 3].map((i) => <div key={i} style={{ width: 24, height: 24, borderRadius: 7, border: `2.5px solid ${INK}`, background: p > 0.2 + i * 0.2 ? INK : 'transparent', color: '#fff', fontSize: 14, textAlign: 'center', lineHeight: '20px' }}>{p > 0.2 + i * 0.2 ? '✓' : ''}</div>)}</div>;
    default: return null;
  }
};
const TOOLS = ['Rendez-vous', 'Échographies', 'Symptômes', 'Mon poids', 'Mouvements de bébé', 'Contractions', 'Projet de naissance', 'Valise de maternité', 'Affaires de bébé', 'Préparer la maison'];
const Tools: React.FC<P> = ({ t, fps, l }) => {
  const { W, H, v } = l;
  if (t < 8.9 || t > 14.6) return null;
  const inO = prog(t, 9.0, 9.4); const exit = prog(t, 13.9, 14.4);
  const px = W / 2; const py = v ? 1020 : 600;
  const slots: [number, number][] = v
    ? [0, 1, 2, 3, 4].flatMap((r) => [[178, 590 + r * 215], [902, 590 + r * 215]] as [number, number][])
    : [[245, 330], [245, 600], [245, 870], [600, 465], [600, 735], [1320, 465], [1320, 735], [1675, 330], [1675, 600], [1675, 870]];
  const cw = v ? 300 : 320; const ch = v ? 178 : 150;
  const ph = spr(t, 9.0, fps, 18, 1);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: inO }}>
      <KText t={t} at={9.3} out={13.85} x={W / 2} y={v ? 290 : 100} size={v ? 78 : 62} w={v ? 1000 : 1800} color={INK}>Préparez chaque étape,{v ? <br /> : ' '}<span style={{ color: MUTED }}>sereinement.</span></KText>
      {TOOLS.map((name, i) => {
        const at = 9.4 + i * 0.13; const s = spr(t, at, fps, 15, 0.7);
        const [fx, fy] = slots[i];
        const x = mix(s, px, fx) + (fx - px) * exit * 0.5; const y = mix(s, py, fy) + (fy - py) * exit * 0.5 + Math.sin(t * 1.3 + i) * 5;
        return <Glass key={name} x={x} y={y} w={cw} h={ch} o={Math.min(1, s * s * 1.6) * (1 - exit)} s={0.5 + s * 0.5} blur={exit * 10 + Math.max(0, 0.7 - s) * 14} r={28}
          style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 20 - i, color: INK }}>
          <div style={{ fontSize: name.length > 16 ? 22 : 26, fontWeight: 800, letterSpacing: '-0.02em' }}>{name}</div>
          <Mini k={name} p={prog(t, at + 0.2, at + 1.8)} t={t} />
        </Glass>;
      })}
      <Phone3D x={px} y={py + (1 - ph) * H * 0.6} w={v ? 420 : 370} rotY={Math.sin(t * 0.9) * 4} opacity={Math.min(1, ph * 2) * (1 - prog(t, 14.0, 14.5))} blur={prog(t, 14.0, 14.5) * 10}
        src={t < 11.4 ? 'g-accueil-4' : t < 12.6 ? 'g-rdv' : 'g-listes'} />
    </div>
  );
};

/* ── 14–20 : Aura vous accompagne (robot réel, suggestions et liste réelles de l'app) ── */
const BAG = ['Carte Vitale et pièce d’identité', 'Dossier de suivi de grossesse', 'Vêtements confortables et chaussons', 'Chargeur de téléphone', 'Bodies, pyjamas, bonnet pour bébé', 'Siège auto adapté pour le retour'];
const Typed: React.FC<{ t: number; a: number; b: number; s: string }> = ({ t, a, b, s }) => <>{s.slice(0, Math.floor(prog(t, a, b, (x) => x) * s.length))}</>;
const Chat: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const m1 = spr(t, 15.55, fps, 18); const c1 = spr(t, 16.0, fps, 18); const m2 = spr(t, 17.35, fps, 18); const c2 = spr(t, 17.75, fps, 18);
  const typing1 = t >= 14.75 && t < 15.55; const typing2 = t >= 16.75 && t < 17.35;
  const bub = (o: number, s: string) => o > 0 ? <div style={{ alignSelf: 'flex-end', maxWidth: 290, padding: '11px 15px', borderRadius: 20, borderBottomRightRadius: 6, background: INK, color: '#fff', fontSize: 15.5, fontWeight: 600, opacity: o, transform: `translateY(${(1 - o) * 14}px)` }}>{s}</div> : null;
  const card = (o: number, c: React.ReactNode) => o > 0 ? <div style={{ padding: 14, borderRadius: 20, background: '#fff', border: '1px solid #EFE6E2', opacity: o, transform: `translateY(${(1 - o) * 18}px)` }}>{c}</div> : null;
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#FAF6F3', fontFamily: 'Manrope', color: INK }}>
      <div style={{ position: 'absolute', left: 26, top: 16, fontSize: 15, fontWeight: 800 }}>20:15</div>
      <div style={{ position: 'absolute', left: 22, top: 60, fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em' }}>Aura</div>
      <div style={{ position: 'absolute', left: 16, right: 16, top: 112, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {bub(m1, 'Je suis enceinte de 28 semaines. Que dois-je préparer ?')}
        {card(c1, <>
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>Voici les outils qui t’aident à préparer la suite :</div>
          {['Listes de préparation', 'Projet de naissance', 'Rendez-vous · 3e échographie'].map((s, k) => (
            <div key={s} style={{ marginTop: 8, padding: '8px 12px', borderRadius: 12, background: '#F6EEEA', fontSize: 14, fontWeight: 800, display: 'flex', justifyContent: 'space-between', opacity: prog(t, 16.25 + k * 0.15, 16.5 + k * 0.15) }}><span>{s}</span><span style={{ color: MUTED }}>›</span></div>
          ))}
          <div style={{ marginTop: 8, fontSize: 11, color: MUTED, lineHeight: 1.3 }}>Aura ne remplace pas l’avis d’un professionnel.</div>
        </>)}
        {bub(m2, 'Aide-moi à préparer ma valise de maternité.')}
        {card(c2, <>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800 }}><span>Valise de maternité</span><span style={{ color: MUTED, fontSize: 13 }}>{Math.round(mix(prog(t, 18.3, 19.4), 0, 3))} sur 10 prêtes</span></div>
          {BAG.map((s, k) => {
            const a = prog(t, 18.0 + k * 0.12, 18.25 + k * 0.12); const done = t > 18.4 + k * 0.33 && k < 3;
            return <div key={s} style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 7, fontSize: 13, fontWeight: 600, opacity: a, transform: `translateX(${(1 - a) * 14}px)` }}>
              <div style={{ width: 18, height: 18, borderRadius: 6, border: `2px solid ${INK}`, background: done ? INK : 'transparent', color: '#fff', fontSize: 11, textAlign: 'center', lineHeight: '15px' }}>{done ? '✓' : ''}</div>{s}</div>;
          })}
        </>)}
      </div>
      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 30, height: 50, borderRadius: 25, background: '#fff', border: '1px solid #EADFDA', display: 'flex', alignItems: 'center', padding: '0 8px 0 18px', fontSize: 15, fontWeight: 600 }}>
        <div style={{ flex: 1, color: typing1 || typing2 ? INK : '#B5A9A5', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {typing1 ? <Typed t={t} a={14.75} b={15.45} s="Je suis enceinte de 28 semaines…" /> : typing2 ? <Typed t={t} a={16.75} b={17.25} s="Aide-moi à préparer ma valise…" /> : 'Écris à Aura…'}
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 99, background: typing1 || typing2 ? INK : '#E3D9D5', color: '#fff', textAlign: 'center', lineHeight: '36px', fontWeight: 800 }}>↑</div>
      </div>
    </div>
  );
};
const botAt = (t: number): [BotState, number] => {
  const st: [number, BotState][] = [[14.2, 'greet'], [14.75, 'listening'], [15.55, 'thinking'], [16.0, 'answer'], [16.75, 'listening'], [17.35, 'thinking'], [17.75, 'answer'], [19.2, 'greet']];
  let c: [BotState, number] = ['idle', 0]; for (const [a, s] of st) if (t >= a) c = [s, a]; return c;
};
const AuraG: React.FC<P> = ({ t, fps, l }) => {
  const { W, v } = l;
  if (t < 13.9 || t > 20.6) return null;
  const inO = prog(t, 14.0, 14.5); const out = prog(t, 19.95, 20.4);
  const bot = spr(t, 14.1, fps, 12, 1);
  const ox = v ? W / 2 : 560; const oy = v ? 300 : 400;
  const ph = spr(t, 14.4, fps, 18, 1);
  const pxx = v ? W / 2 : 1330; const pyy = (v ? 1330 : 560) + (1 - ph) * 500;
  const links = ['Calendrier de grossesse', 'Listes de préparation', 'Projet de naissance'];
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - out, filter: out ? `blur(${out * 12}px)` : undefined }}>
      <AuraRobot t={t} x={ox} y={oy} size={(v ? 330 : 300) * (0.5 + bot * 0.5)} state={botAt(t)[0]} since={botAt(t)[1]} o={inO} dark />
      <Phone3D x={pxx} y={pyy} w={v ? 480 : 420} rotY={v ? 0 : -10 + Math.sin(t * 0.8) * 2} opacity={Math.min(1, ph * 2.5)} dark><Chat t={t} fps={fps} /></Phone3D>
      {links.map((c, i) => {
        const p = prog(t, 16.1 + i * 0.1, 16.9 + i * 0.1);
        if (p <= 0 || p >= 1) return null;
        const sx = ox + (i - 1) * (v ? 250 : 200); const sy = oy + (v ? 210 : 230);
        return <Glass key={c} dark x={mix(p, sx, pxx)} y={mix(p, sy, pyy - 80) - Math.sin(p * Math.PI) * 110} w={v ? 300 : 280} h={58} o={Math.sin(p * Math.PI)} s={mix(p, 1, 0.5)} r={20}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, fontWeight: 800 }}>{c}</Glass>;
      })}
      <KText t={t} at={18.3} out={19.95} x={v ? W / 2 : 560} y={v ? 600 : 760} size={v ? 60 : 62} w={v ? 1000 : 900} color="#fff">
        Aura.<br /><span style={{ color: '#D9C9C4', fontSize: '0.66em', letterSpacing: '-0.02em' }}>Votre copilote pendant la grossesse.</span>
      </KText>
    </div>
  );
};

/* ── 20–25 : une aventure à partager, son histoire commence ── */
const Toast: React.FC<{ o: number; a: string; b: string }> = ({ o, a, b }) => (
  <div style={{ position: 'absolute', left: 12, right: 12, top: 58, padding: '12px 14px', borderRadius: 22, background: 'rgba(255,255,255,.94)', boxShadow: '0 14px 30px -14px rgba(0,0,0,.35)', border: '1px solid #EFE6E2', opacity: o, transform: `translateY(${(1 - o) * -30}px)`, fontFamily: 'Manrope' }}>
    <div style={{ fontSize: 15, fontWeight: 800, color: INK }}>{a}</div><div style={{ fontSize: 13, fontWeight: 600, color: MUTED, marginTop: 2 }}>{b}</div>
  </div>
);
const SHARE = ['Rendez-vous', 'Valise de maternité', 'Listes', 'Tâches', 'Échographies', 'Souvenirs'];
const Share: React.FC<P> = ({ t, fps, l }) => {
  const { W, H, v } = l;
  if (t < 20.0 || t > 25.6) return null;
  const inO = prog(t, 20.1, 20.6); const out = prog(t, 25.0, 25.45);
  const phonesOut = prog(t, 22.4, 22.9);
  const A = { x: v ? 300 : 700, y: v ? 1080 : 590 }; const B = { x: v ? 780 : 1220, y: v ? 1080 : 590 }; const pw = v ? 400 : 330;
  const pA = spr(t, 20.2, fps, 18, 1); const pB = spr(t, 20.35, fps, 18, 1);
  const hop = prog(t, 21.3, 21.8, (x) => x);
  // album → page « Avant notre rencontre » de Mon histoire
  const pg = spr(t, 22.7, fps, 16); const pw2 = v ? 720 : 540; const ph2 = v ? 940 : 680;
  const chip = win(t, 22.9, 24.9, 0.3, 0.3);
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: inO * (1 - out), filter: out ? `blur(${out * 10}px)` : undefined }}>
      <KText t={t} at={22.8} out={24.95} x={W / 2} y={v ? 260 : 990} size={v ? 74 : 60} w={v ? 1000 : 1800} color={INK}>Son histoire commence{v ? <br /> : ' '}<span style={{ color: MUTED }}>avant sa naissance.</span></KText>
      <div style={{ opacity: 1 - phonesOut, filter: phonesOut ? `blur(${phonesOut * 10}px)` : undefined }}>
        {SHARE.map((s, i) => {
          const a = (i / SHARE.length) * Math.PI * 2 - Math.PI / 2; const R = 470;
          const x = v ? 200 + (i % 3) * 340 : W / 2 + Math.cos(a) * R * 1.55; const y = v ? (i < 3 ? 560 : 1610) : 560 + Math.sin(a) * R * 0.82;
          const sp = spr(t, 20.3 + i * 0.07, fps, 15);
          return <Glass key={s} x={x} y={y + Math.sin(t * 1.4 + i) * 6} w={v ? 270 : 250} h={v ? 72 : 64} o={sp} s={0.7 + sp * 0.3} r={22}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: v ? 26 : 24, fontWeight: 800, color: INK }}>{s}</Glass>;
        })}
        <Phone3D x={A.x} y={A.y + (1 - pA) * 400} w={pw} rotY={v ? 8 : 14} opacity={pA} src="g-rdv"><Toast o={spr(t, 21.1, fps, 16)} a="Rendez-vous ajouté" b="Échographie du 3e trimestre" /></Phone3D>
        <Phone3D x={B.x} y={B.y + (1 - pB) * 400} w={pw} rotY={v ? -8 : -14} opacity={pB} src="g-listes"><Toast o={spr(t, 21.8, fps, 16)} a="Camille a ajouté un rendez-vous" b="Échographie · à l’instant" /></Phone3D>
        {hop > 0 && hop < 1 ? (() => {
          const ax = A.x, ay = A.y - (v ? 330 : 280), bx = B.x, by = B.y - (v ? 330 : 280); const qx = (ax + bx) / 2, qy = ay - 150;
          const x = (1 - hop) ** 2 * ax + 2 * (1 - hop) * hop * qx + hop ** 2 * bx; const y = (1 - hop) ** 2 * ay + 2 * (1 - hop) * hop * qy + hop ** 2 * by;
          return <div style={{ position: 'absolute', left: x - 14, top: y - 14, width: 28, height: 28, borderRadius: 99, background: '#fff', border: `5px solid ${GOLD}`, boxShadow: `0 0 30px 10px rgba(233,195,138,.6)` }} />;
        })() : null}
      </div>
      {pg > 0 ? (
        <div style={{ position: 'absolute', left: (v ? W / 2 : W / 2) - pw2 / 2, top: (v ? 1060 : 530) - ph2 / 2, width: pw2, height: ph2, borderRadius: 20, overflow: 'hidden', opacity: pg, transform: `scale(${(0.85 + pg * 0.15) * (1 + Math.max(0, t - 22.7) * 0.025)}) rotate(${(1 - pg) * -4 + Math.max(0, t - 23.2) * 0.6}deg)`,
          background: 'linear-gradient(160deg,#FFFDF9,#F6EEE6)', boxShadow: '0 50px 90px -40px rgba(80,50,40,.45)', padding: pw2 * 0.08, color: INK, fontFamily: 'Manrope' }}>
          <div style={{ fontSize: pw2 * 0.036, fontWeight: 700, color: '#B08A5B', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Mon histoire · Grossesse</div>
          <div style={{ fontSize: pw2 * 0.08, fontWeight: 800, letterSpacing: '-0.035em', marginTop: pw2 * 0.02 }}>Avant notre rencontre</div>
          <div style={{ position: 'absolute', left: pw2 * 0.08, right: pw2 * 0.08, top: ph2 * 0.25, bottom: pw2 * 0.08, borderRadius: 16, background: '#F4E9E1', overflow: 'hidden' }}>
            <Img src={staticFile('art/grossesse.webp')} style={{ position: 'absolute', inset: '4%', width: '92%', height: '92%', objectFit: 'contain' }} />
          </div>
        </div>
      ) : null}
      <Glass x={W / 2} y={v ? 470 : 85} w={v ? 640 : 560} h={v ? 84 : 72} o={chip} r={40} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px', fontSize: v ? 28 : 24, fontWeight: 800, color: INK }}>
        <Img src={staticFile('aura/aura-thinking-' + (Math.floor(t / 0.22) % 3) + '.png')} style={{ width: v ? 64 : 54, height: v ? 64 : 54, marginLeft: -10 }} />Je construis l’histoire de bébé
      </Glass>
    </div>
  );
};

/* ── 25–30 : la naissance, et HOMI continue ── */
const PREG = ['Rendez-vous', 'Contractions', 'Valise de maternité', 'Mouvements de bébé', 'Projet de naissance'];
const BABY = ['Sommeil', 'Biberon', 'Allaitement', 'Croissance', 'Relais de nuit'];
const Finale: React.FC<P> = ({ t, fps, l }) => {
  const { W, H, v } = l;
  if (t < 25.1) return null;
  const inO = prog(t, 25.2, 25.8); const leave = prog(t, 27.6, 28.1);
  const art = spr(t, 25.25, fps, 18, 1);
  const flip = (i: number) => prog(t, 26.1 + i * 0.16, 26.5 + i * 0.16);
  const logo = spr(t, 27.85, fps, 14); const tag = prog(t, 28.45, 29.0);
  const ax = v ? W / 2 : 560; const ay = v ? 860 : 560;
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: inO }}>
      <div style={{ position: 'absolute', left: ax - 380, top: ay - 380, width: 760, height: 760, borderRadius: '50%', background: `radial-gradient(circle, rgba(255,226,180,${0.7 * (1 - leave)}), transparent 65%)` }} />
      <Art src="art/bebe.webp" x={ax} y={ay} s={(v ? 760 : 640) * (0.92 + art * 0.08)} o={art * (1 - leave)} blur={leave * 12} />
      {PREG.map((p, i) => {
        const f = flip(i); const x = v ? 190 + (i % 3) * 350 : 1340 + (i % 2) * 330; const y = v ? 1420 + Math.floor(i / 3) * 150 : 230 + i * 150 - (i % 2) * 0;
        const rot = f * 180; const front = rot < 90;
        return <Glass key={p} x={v ? (i < 3 ? x : 365 + (i - 3) * 350) : x} y={y} w={v ? 320 : 300} h={v ? 100 : 96} o={prog(t, 25.3 + i * 0.05, 25.7 + i * 0.05) * (1 - leave)} r={24}
          style={{ transform: `perspective(800px) rotateX(${front ? rot : rot - 180}deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: v ? 28 : 26, fontWeight: 800, color: INK }}>{front ? p : BABY[i]}</Glass>;
      })}
      <KText t={t} at={25.55} out={27.6} x={W / 2} y={v ? 260 : 100} size={v ? 74 : 64} w={v ? 1000 : 1800} color={INK}>De votre grossesse{v ? <br /> : ' '}<span style={{ color: MUTED }}>à ses 10 ans.</span></KText>
      <div style={{ position: 'absolute', left: W / 2, top: H / 2 - (v ? 60 : 50), transform: `translate(-50%,-50%) scale(${(0.8 + logo * 0.2) * (1 + prog(t, 28.2, 30, (x) => x) * 0.04)})`, opacity: logo, filter: `blur(${(1 - logo) * 14}px)` }}>
        <Logo h={150} />
      </div>
      <div style={{ position: 'absolute', left: 0, width: W, top: H / 2 + 90, textAlign: 'center', fontSize: 50, fontWeight: 700, letterSpacing: '-0.02em', color: MUTED, opacity: tag, transform: `translateY(${(1 - tag) * 16}px)`, filter: `blur(${(1 - tag) * 8}px)` }}>Grandir ensemble.</div>
    </div>
  );
};

export const Grossesse30: React.FC<{ vertical: boolean; voice: boolean }> = ({ vertical, voice }) => {
  const { t, fps } = useTime(); const { width } = useVideoConfig();
  const l: L = vertical ? { W: 1080, H: 1920, v: true } : { W: 1920, H: 1080, v: false };
  const k = width / l.W; const p = { t, fps, l };
  const dusk = Math.min(prog(t, 13.9, 14.5), 1 - prog(t, 19.9, 20.5));
  return (
    <AbsoluteFill style={{ background: '#F6ECE4' }}>
      <Audio src={staticFile(voice ? 'audio/g30-mix.wav' : 'audio/g30-mix-sans-voix.wav')} />
      <div style={{ width: l.W, height: l.H, transform: `scale(${k})`, transformOrigin: 'top left', position: 'relative', overflow: 'hidden', fontFamily: `${T.font}, sans-serif`, color: INK }}>
        <Warm t={t} l={l} dusk={dusk} />
        <Intro {...p} /><Weeks {...p} /><Tools {...p} /><AuraG {...p} /><Share {...p} /><Finale {...p} />
      </div>
    </AbsoluteFill>
  );
};
