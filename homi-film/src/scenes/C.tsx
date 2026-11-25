/** Scènes 10 à 13 : Mon histoire, chaque famille, communauté, final. */
import React from 'react';
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { AuraOrb, Glass, Logo, Phone, Stage, Title, useSpring, useT } from '../components/kit';
import { T } from '../tokens';

const CHAPTERS = [['etape-03', 'Avant ma naissance'], ['etape-04', 'Ma naissance'], ['etape-05', 'Mes premiers sourires'], ['etape-06', 'Mes premiers pas'],
  ['etape-07', 'Mon premier anniversaire'], ['etape-09', 'Ma première rentrée'], ['etape-10', 'Mes 10 premières années']];
export const S10: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const p = interpolate(t, [1.5, 14.5], [0, CHAPTERS.length - 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const page = Math.floor(p); const flip = p - page; const open = useSpring(0.3);
  const Page: React.FC<{ i: number; side: 'l' | 'r' }> = ({ i, side }) => {
    const c = CHAPTERS[Math.min(i, CHAPTERS.length - 1)];
    return <div style={{ position: 'absolute', inset: 0, background: '#FBFAF7', borderRadius: side === 'l' ? '22px 6px 6px 22px' : '6px 22px 22px 6px', padding: 40, boxShadow: 'inset 0 0 40px rgba(0,0,0,.05)' }}>
      {side === 'l' ? <Img src={staticFile(`art/${c[0]}.png`)} style={{ width: '100%', height: '80%', objectFit: 'contain' }} />
        : <div><div style={{ fontSize: 22, color: T.muted, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>Chapitre {Math.min(i, CHAPTERS.length - 1) + 1}</div>
          <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-0.03em', marginTop: 16 }}>{c[1]}</div>
          <div style={{ marginTop: 26, height: 14, width: '80%', background: 'rgba(11,11,12,.08)', borderRadius: 7 }} /><div style={{ marginTop: 14, height: 14, width: '62%', background: 'rgba(11,11,12,.08)', borderRadius: 7 }} /></div>}
    </div>;
  };
  return (
    <Stage>
      <Title at={0.2} out={15.5} line1="Il grandit." line2="Son histoire aussi." size={66} align="left" x={120} y={150} />
      <div style={{ position: 'absolute', left: 300, top: 260, width: 1000, height: 640, perspective: 2400, opacity: open, transform: `scale(${0.9 + 0.1 * open})` }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 500, height: 640 }}><Page i={page} side="l" /></div>
        <div style={{ position: 'absolute', left: 500, top: 0, width: 500, height: 640 }}><Page i={page + 1} side="r" /></div>
        <div style={{ position: 'absolute', left: 500, top: 0, width: 500, height: 640, transformOrigin: 'left center', transform: `rotateY(${-180 * flip}deg)`, transformStyle: 'preserve-3d', boxShadow: '0 30px 60px -20px rgba(0,0,0,.35)' }}>
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}><Page i={page} side="r" /></div>
        </div>
      </div>
      <Phone src="mon-histoire" x={1580} y={580} w={300} rotY={-12} opacity={useSpring(1)} />
      <div style={{ position: 'absolute', left: 300, top: 930, fontSize: 22, color: T.muted }}>Illustrations de l’application · dans HOMI, le livre se remplit avec vos propres photos et « premières fois »</div>
    </Stage>
  );
};

const KIDS = [['Camille', 'accueil'], ['Lina', 'enfant'], ['Noé', 'developpement']];
export const S11: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const k = Math.min(KIDS.length - 1, Math.floor(Math.max(0, t - 1) / 2.8));
  return (
    <Stage>
      <Title at={0.2} out={9.5} line1="Chaque famille" line2="est unique." size={70} align="left" x={140} y={300} />
      <div style={{ position: 'absolute', left: 140, top: 520, display: 'flex', gap: 18 }}>
        {KIDS.map(([n], i) => <div key={n} style={{ padding: '16px 28px', borderRadius: 99, fontSize: 32, fontWeight: 700, background: i === k ? T.ink : 'rgba(255,255,255,.7)', color: i === k ? '#fff' : T.ink, boxShadow: T.shadow }}>{n}</div>)}
      </div>
      {KIDS.map(([, s], i) => <Phone key={s} src={s} x={1300} y={560} w={360} rotY={-8} opacity={interpolate(t, [1 + i * 2.8 - 0.3, 1 + i * 2.8 + 0.3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) * (i === k ? 1 : i < k ? 0 : 1)} />)}
    </Stage>
  );
};

const POSTS = ['À quelle heure couches-tu ton bébé ?', 'Biberons la nuit : vos astuces ?', 'Charge mentale des parents : la repérer et mieux la partager'];
export const S12: React.FC = () => (
  <Stage>
    <Phone src="communaute" x={620} y={560} w={360} rotY={10} opacity={useSpring(0.2)} />
    {POSTS.map((p, i) => <Glass key={i} x={1300} y={330 + i * 170} w={720} h={130} opacity={useSpring(1 + i * 0.5)}><div style={{ padding: '24px 30px', fontSize: 30, fontWeight: 700 }}>{p}</div></Glass>)}
    <Title at={3} line1="Vous n’êtes pas seuls." size={64} y={930} x={960} align="center" />
  </Stage>
);

export const S13: React.FC = () => {
  const shrink = useT(0.2, 2.6); const logo = useSpring(6.6);
  return (
    <Stage>
      <AuraOrb x={960} y={540} r={150 * (1 - shrink) + 10} opacity={1 - useT(2.4, 3)} />
      <Title at={2.8} out={6.2} line1="Moins de charge mentale." line2="Plus de moments ensemble." size={86} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 470, transform: `scale(${0.7 + 0.3 * logo})`, opacity: logo }}><Logo size={150} /></div>
      <Title at={7.2} line1="La famille, autrement." size={54} y={680} />
    </Stage>
  );
};
