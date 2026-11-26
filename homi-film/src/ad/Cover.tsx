/** Couverture Facebook HOMI — 1640×856 (affichage ordinateur : bande centrale 1640×624 ; mobile : centre 1522×856).
 *  Tout l'essentiel tient dans la zone sûre centrale ; le coin bas-gauche reste libre (photo de profil sur ordinateur).
 *  Écrans réels de l'app (démo), robot Aura réel, logo réel. */
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { loadFont } from '@remotion/fonts';
import { T } from '../tokens';
import { Glass, Logo, Phone3D } from './parts';

for (const [w, n] of [['500Medium', 500], ['700Bold', 700], ['800ExtraBold', 800]] as const) {
  loadFont({ family: 'Manrope', url: staticFile(`fonts/Manrope_${w}.ttf`), weight: String(n) }).catch(() => undefined);
}
const MUTED = '#8A8A93';

export const Cover: React.FC = () => (
  <AbsoluteFill style={{ fontFamily: `${T.font}, sans-serif`, color: T.ink, background: 'radial-gradient(120% 120% at 20% 10%, #FBFAFD 0%, #F1EEF6 55%, #E9E5F1 100%)', overflow: 'hidden' }}>
    {[{ c: 'rgba(185,166,255,.32)', x: 1180, y: 300, r: 900 }, { c: 'rgba(255,199,225,.32)', x: 1500, y: 700, r: 700 }, { c: 'rgba(127,209,255,.22)', x: 300, y: 120, r: 800 }].map((b, k) => (
      <div key={k} style={{ position: 'absolute', left: b.x - b.r / 2, top: b.y - b.r / 2, width: b.r, height: b.r, borderRadius: '50%', background: `radial-gradient(circle, ${b.c}, transparent 65%)` }} />
    ))}
    {/* texte : à gauche dans la zone sûre, au-dessus de l'emplacement de la photo de profil */}
    <div style={{ position: 'absolute', left: 150, top: 230 }}>
      <Logo h={92} />
      <div style={{ marginTop: 34, fontSize: 60, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1.04 }}>
        Toute votre vie familiale.<br /><span style={{ color: MUTED }}>Enfin réunie.</span>
      </div>
      <div style={{ marginTop: 22, fontSize: 27, fontWeight: 600, color: '#5E5A66', letterSpacing: '-0.01em' }}>De la grossesse aux 10 ans · Aura · Communauté</div>
    </div>
    {/* trois téléphones : accueil, grossesse, communauté */}
    <Phone3D x={1000} y={455} w={238} rotY={16} rotZ={-3} src="g-accueil-1" />
    <Phone3D x={1330} y={455} w={238} rotY={-16} rotZ={3} src="c-fil-0" />
    <Phone3D x={1165} y={432} w={272} src="accueil" />
    <Glass x={905} y={250} w={220} h={68} r={24} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 25, fontWeight: 800 }}>Grossesse</Glass>
    <Glass x={1440} y={232} w={220} h={68} r={24} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 25, fontWeight: 800 }}>Communauté</Glass>
    <Glass x={1440} y={672} w={240} h={68} r={24} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 25, fontWeight: 800 }}>Relais de nuit</Glass>
    <Img src={staticFile('aura/aura-greet-0.png')} style={{ position: 'absolute', left: 835, top: 545, width: 190, height: 190, filter: 'drop-shadow(0 20px 30px rgba(30,30,60,.25))' }} />
  </AbsoluteFill>
);
