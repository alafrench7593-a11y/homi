/** Scènes 06 à 09 : Aura, tout est connecté, deux parents, le foyer. */
import React from 'react';
import { Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { AuraOrb, Glass, Phone, Stage, Title, useSpring, useT } from '../components/kit';
import { T } from '../tokens';

/** Démonstration Aura : bulle du parent → cartes d'action (simulation clairement signalée). */
const DEMOS: { at: number; say: string; acts: string[] }[] = [
  { at: 6.5, say: '« Il vient de boire 150 ml. »', acts: ['Biberon enregistré · 150 ml', 'Statistiques du jour à jour', 'Relais parental actualisé'] },
  { at: 10.5, say: '« Il dort depuis 14 h 20. »', acts: ['Sieste démarrée à 14 h 20'] },
  { at: 13.5, say: '« Prépare le relais de cette nuit. »', acts: ['Relais prêt · à relire avant envoi'] },
  { at: 16.5, say: '« Ajoute cette photo à son histoire. »', acts: ['Souvenir à valider dans Mon histoire'] },
  { at: 19.5, say: '« Où retrouver ses vaccins ? »', acts: ['Ouvrir le carnet de vaccins →'] },
];
export const S06: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const orbIn = useSpring(0.4); const move = useT(5.5, 6.8);
  const cur = [...DEMOS].reverse().find((d) => t >= d.at);
  return (
    <Stage dark>
      <AuraOrb x={960 - move * 560} y={540 - move * 40} r={190 - move * 70} energy={cur ? 1 : 0.4} opacity={orbIn} />
      <Title at={1} out={3.2} line1="Bien plus qu’un chatbot." size={92} dark />
      <Title at={3.4} out={5.4} line1="Votre copilote familial." size={92} dark />
      <Phone src="enfant" x={1530} y={560} w={330} opacity={move} rotY={-10} />
      {DEMOS.map((d, i) => {
        const on = t >= d.at && (i === DEMOS.length - 1 ? t < 22.6 : t < DEMOS[i + 1].at);
        const a = interpolate(t, [d.at, d.at + 0.4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        if (!on) return null;
        return <React.Fragment key={i}>
          <div style={{ position: 'absolute', left: 560, top: 300, opacity: a, padding: '20px 30px', borderRadius: 30, background: '#fff', color: T.ink, fontSize: 38, fontWeight: 700, boxShadow: T.shadow, transform: `translateY(${(1 - a) * 20}px)` }}>{d.say}</div>
          {d.acts.map((x, k) => {
            const b = interpolate(t, [d.at + 0.9 + k * 0.45, d.at + 1.3 + k * 0.45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return <div key={k} style={{ position: 'absolute', left: 560, top: 420 + k * 96, opacity: b, transform: `translateX(${(1 - b) * -30}px)`, padding: '18px 26px', borderRadius: 24,
              background: 'rgba(255,255,255,.12)', border: '1.5px solid rgba(255,255,255,.28)', fontSize: 32, fontWeight: 700, color: '#fff' }}>✓ {x}</div>;
          })}
        </React.Fragment>;
      })}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 150, textAlign: 'center', fontSize: 22, color: '#8C8C96', opacity: move }}>Démonstration animée · Aura ne remplace pas un professionnel de santé</div>
    </Stage>
  );
};

const NODES: { id: string; label: string; screen: string }[] = [
  { id: 'bib', label: 'Biberons', screen: 'journee-biberons' }, { id: 'acc', label: 'Tableau de bord', screen: 'accueil' }, { id: 'rel', label: 'Relais', screen: 'relais-nuit' },
  { id: 'som', label: 'Sommeil', screen: 'sommeil' }, { id: 'age', label: 'Agenda', screen: 'agenda' }, { id: 'vac', label: 'Vaccins', screen: 'vaccins' },
  { id: 'his', label: 'Mon histoire', screen: 'mon-histoire' }, { id: 'cou', label: 'Courses', screen: 'courses' }, { id: 'tac', label: 'Tâches', screen: 'taches' },
];
const CHAINS = [['bib', 'acc', 'rel'], ['som', 'acc', 'rel'], ['his', 'acc'], ['vac', 'age'], ['cou', 'tac']];
export const S07: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const pos = (i: number) => { const ang = -Math.PI / 2 + (i / NODES.length) * Math.PI * 2 + t * 0.03; return [960 + Math.cos(ang) * 640, 520 + Math.sin(ang) * 330]; };
  const at = (id: string) => pos(NODES.findIndex((n) => n.id === id));
  return (
    <Stage dark>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {CHAINS.map((c, ci) => c.slice(1).map((id, k) => {
          const [x1, y1] = at(c[k]); const [x2, y2] = at(id); const start = 2 + ci * 2.2 + k * 0.6;
          const g = interpolate(t, [start, start + 0.7], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const pulse = ((t - start) % 1.6) / 1.6;
          return <g key={ci + '-' + k} opacity={g}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(180,170,255,.55)" strokeWidth="3" />
            {t > start ? <circle cx={x1 + (x2 - x1) * pulse} cy={y1 + (y2 - y1) * pulse} r="9" fill="#fff" /> : null}
          </g>;
        }))}
      </svg>
      <AuraOrb x={960} y={520} r={70} energy={0.7} opacity={useSpring(0.3)} />
      {NODES.map((n, i) => {
        const [x, y] = pos(i); const a = useSpring(0.4 + i * 0.12);
        return <div key={n.id} style={{ position: 'absolute', left: x - 95, top: y - 150, width: 190, opacity: a, transform: `scale(${0.7 + a * 0.3})` }}>
          <div style={{ height: 250, borderRadius: 26, overflow: 'hidden', border: '1.5px solid rgba(255,255,255,.35)', boxShadow: '0 20px 50px -20px rgba(0,0,0,.8)' }}>
            <Img src={staticFile(`screens/${n.screen}.webp`)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} /></div>
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 26, fontWeight: 700, color: '#fff' }}>{n.label}</div>
        </div>;
      })}
      <Title at={12} line1="Une seule information." line2="Tout se synchronise." size={64} y={980} dark />
    </Stage>
  );
};

export const S08: React.FC = () => {
  const f = useCurrentFrame(); const { fps } = useVideoConfig(); const t = f / fps;
  const flow = ((t - 3) % 2) / 2; const swap = useT(8, 9);
  const notif = useSpring(4.2);
  return (
    <Stage>
      <Title at={0.2} out={14} line1="Deux parents." line2="Une même équipe." size={70} y={150} />
      <Phone src={swap > 0.5 ? 'agenda' : 'biberon'} x={640} y={610} w={330} rotY={10} />
      <Phone src={swap > 0.5 ? 'taches' : 'relais-nuit'} x={1280} y={610} w={330} rotY={-10}>
        <div style={{ position: 'absolute', left: 14, right: 14, top: 70, opacity: notif * (1 - swap), transform: `translateY(${(1 - notif) * -40}px)`, padding: '14px 16px', borderRadius: 18, background: 'rgba(255,255,255,.96)', boxShadow: '0 10px 30px rgba(0,0,0,.25)', fontSize: 15, fontWeight: 700 }}>
          Camille a noté un biberon · 150 ml</div>
      </Phone>
      {t > 3 && t < 8 ? <div style={{ position: 'absolute', left: 820 + flow * 280, top: 600, width: 18, height: 18, borderRadius: 99, background: T.ink, boxShadow: '0 0 30px rgba(0,0,0,.4)' }} /> : null}
      <div style={{ position: 'absolute', left: 520, top: 1000, fontSize: 28, fontWeight: 700, color: T.muted }}>Camille</div>
      <div style={{ position: 'absolute', left: 1240, top: 1000, fontSize: 28, fontWeight: 700, color: T.muted }}>Sam</div>
    </Stage>
  );
};

const HOME = ['menu', 'courses', 'taches', 'agenda', 'garde', 'charge-mentale', 'resume', 'journal'];
export const S09: React.FC = () => {
  const bars = useT(5, 7.5);
  return (
    <Stage>
      <Title at={0.2} out={12.5} line1="Tout le foyer." line2="Au même endroit." size={70} align="left" x={120} y={160} />
      {HOME.map((s, i) => {
        const a = useSpring(0.6 + i * 0.18); const col = i % 4, row = Math.floor(i / 4);
        return <Phone key={s} src={s} x={860 + col * 300} y={330 + row * 440} w={180} scale={0.8 + a * 0.2} opacity={a} />;
      })}
      <Glass x={380} y={640} w={440} h={300} opacity={useSpring(4.6)}><div style={{ padding: 26 }}>
        <div style={{ fontSize: 26, color: T.muted, fontWeight: 700 }}>Charge mentale · cette semaine</div>
        {[['Camille', 0.58], ['Sam', 0.42]].map(([n, v]) => <div key={n as string} style={{ marginTop: 22 }}><div style={{ fontSize: 26, fontWeight: 700 }}>{n}</div>
          <div style={{ height: 22, borderRadius: 11, background: 'rgba(11,11,12,.08)', marginTop: 8 }}><div style={{ height: 22, width: `${(v as number) * 100 * bars}%`, borderRadius: 11, background: T.ink }} /></div></div>)}
      </div></Glass>
    </Stage>
  );
};
