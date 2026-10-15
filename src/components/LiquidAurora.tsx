/**
 * Fond vivant « aurore liquide » (shader GPU) : des vagues de lumière soyeuse qui respirent très lentement,
 * et de fines étincelles qui montent. Couleurs douces : crème, pêche, rose et lavande le jour ;
 * prune profonde traversée de reflets rose, lavande et menthe le soir.
 * Un seul fond pour toute l'app (posé à la racine, derrière la navigation).
 * Décoratif : masqué aux lecteurs d'écran ; figé si « Réduire les animations » est activé.
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform float uTime;
uniform vec2 uRes;
uniform float uNight;   // 0 = jour, 1 = nuit
uniform float uDim;     // 1 = normal, < 1 = mode nuit très tamisé

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes.xy) / uRes.y;
  float time = uTime * 0.08;
  float breathe = sin(uTime * 0.03) * 0.5 + 0.5;
  float deform = breathe * 2.5;

  vec2 w = uv;
  w.x += sin(uv.y * 2.5 + time * 0.2 + deform) * 0.35;
  w.y += cos(uv.x * 2.5 - time * 0.15 - deform * 0.8) * 0.35;
  w.x += sin(uv.y * 1.2 - time * 0.1 - deform * 1.5) * 0.25;
  w.y += cos(uv.x * 1.2 + time * 0.18 + deform * 1.2) * 0.25;

  vec2 d1 = vec2(cos(0.6), sin(0.6));
  vec2 d2 = vec2(cos(-0.7), sin(-0.7));
  vec2 d3 = vec2(cos(1.2), sin(1.2));
  float w1 = sin(dot(w, d1) * 2.4 + time * 1.0);
  float w2 = cos(dot(w, d2) * 3.2 - time * 1.4 + w1 * 0.4);
  float w3 = sin(dot(w, d3) * 4.0 + time * 1.8 + w2 * 0.5);
  float field = w1 * 0.50 + w2 * 0.35 + w3 * 0.15;

  float sheen = pow(max(0.0, 1.0 - abs(field - 0.1)), 2.5);
  float spec = pow(max(0.0, 1.0 - abs(field - 0.15)), 8.0);
  float crest = sheen * 0.5 + spec * 0.9;

  // Teinte d'aurore qui glisse à travers l'écran : pêche -> rose -> lavande -> menthe
  float hue = clamp(uv.y * 0.9 + 0.5 + sin(w.x * 1.3 + time) * 0.18, 0.0, 1.0);
  vec3 peach = vec3(1.00, 0.76, 0.62);
  vec3 rose = vec3(1.00, 0.62, 0.76);
  vec3 lav = vec3(0.74, 0.64, 1.00);
  vec3 mint = vec3(0.56, 0.90, 0.80);
  vec3 aur = mix(peach, rose, smoothstep(0.0, 0.35, hue));
  aur = mix(aur, lav, smoothstep(0.35, 0.7, hue));
  aur = mix(aur, mint, smoothstep(0.75, 1.0, hue) * 0.8);

  // Jour : crème lumineuse, voiles pastel, reflets presque blancs
  vec3 dBase = vec3(1.00, 0.965, 0.945);
  vec3 dBody = mix(vec3(1.00, 0.90, 0.90), vec3(0.95, 0.91, 1.00), hue);
  vec3 day = dBase;
  day = mix(day, dBody, smoothstep(-0.6, 0.2, field) * 0.75);
  day = mix(day, mix(aur, vec3(1.0), 0.35), smoothstep(0.0, 0.8, field) * 0.55);
  day = mix(day, vec3(1.0, 0.99, 0.98), crest * 0.55);

  // Nuit : prune profonde, voiles d'aurore lumineux
  vec3 nBase = vec3(0.075, 0.045, 0.105);
  vec3 nBody = vec3(0.16, 0.085, 0.20);
  vec3 night = nBase;
  night = mix(night, nBody, smoothstep(-0.6, 0.2, field));
  night = mix(night, aur * 0.42, smoothstep(0.0, 0.8, field) * 0.8);
  night += aur * crest * 0.55;

  vec3 col = mix(day, night, uNight);
  float vig = 1.0 - dot(uv, uv) * mix(0.06, 0.16, uNight);
  col *= vig;
  col *= uDim;
  gl_FragColor = vec4(col, 1.0);
}
`;

const P_VERT = `
attribute vec2 aPos;
attribute vec4 aCol;
uniform float uSize;
varying vec4 vCol;
void main() { vCol = aCol; gl_Position = vec4(aPos, 0.0, 1.0); gl_PointSize = uSize; }
`;

const P_FRAG = `
precision mediump float;
varying vec4 vCol;
uniform float uAlpha;
void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float a = smoothstep(0.5, 0.0, d);
  a = a * a;
  gl_FragColor = vec4(vCol.rgb, vCol.a * a * uAlpha);
}
`;

const SPARKS = 90;
const SPARK_COLORS: [number, number, number][] = [
  [1.0, 0.72, 0.62], [1.0, 0.62, 0.78], [1.0, 0.82, 0.7], // chauds
  [0.78, 0.7, 1.0], [0.62, 0.92, 0.84], // froids
];

function compile(gl: ExpoWebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
  return s;
}
function program(gl: ExpoWebGLRenderingContext, v: string, f: string) {
  const p = gl.createProgram()!;
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, v));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, f));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link');
  return p;
}

export function LiquidAurora({ fallback }: { fallback?: React.ReactNode }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const target = useRef({ night: 0, dim: 1 });
  target.current = {
    night: t.isDark ? (t.phase === 'dusk' ? 0.9 : 1) : 0,
    dim: t.name === 'night' ? 0.45 : 1,
  };
  const raf = useRef<number | null>(null);
  const reduceRef = useRef(reduce);
  reduceRef.current = reduce;
  const [failed, setFailed] = React.useState(false);

  useEffect(() => () => { if (raf.current != null) cancelAnimationFrame(raf.current); }, []);

  if (failed) return <>{fallback ?? null}</>;

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    try {
      const bg = program(gl, VERT, FRAG);
      const pp = program(gl, P_VERT, P_FRAG);
      const quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

      const pos = new Float32Array(SPARKS * 2);
      const col = new Float32Array(SPARKS * 4);
      const vel = Array.from({ length: SPARKS }, () => ({ vy: 0.012 + Math.random() * 0.03, vx: (Math.random() - 0.5) * 0.01, sway: 0.4 + Math.random() * 1.2, ph: Math.random() * 6.28 }));
      for (let i = 0; i < SPARKS; i++) {
        pos[i * 2] = Math.random() * 2 - 1;
        pos[i * 2 + 1] = Math.random() * 2 - 1;
        const c = SPARK_COLORS[i % SPARK_COLORS.length];
        col.set([c[0], c[1], c[2], 0.35 + Math.random() * 0.6], i * 4);
      }
      const pBuf = gl.createBuffer();
      const cBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, cBuf);
      gl.bufferData(gl.ARRAY_BUFFER, col, gl.STATIC_DRAW);

      const W = gl.drawingBufferWidth;
      const H = gl.drawingBufferHeight;
      const u = {
        time: gl.getUniformLocation(bg, 'uTime'), res: gl.getUniformLocation(bg, 'uRes'),
        night: gl.getUniformLocation(bg, 'uNight'), dim: gl.getUniformLocation(bg, 'uDim'),
        size: gl.getUniformLocation(pp, 'uSize'), alpha: gl.getUniformLocation(pp, 'uAlpha'),
      };
      const aBg = gl.getAttribLocation(bg, 'aPos');
      const aP = gl.getAttribLocation(pp, 'aPos');
      const aC = gl.getAttribLocation(pp, 'aCol');
      const start = Date.now();
      let last = start;
      let night = target.current.night;
      let dim = target.current.dim;
      const dpr = W / Math.max(1, gl.drawingBufferWidth);

      const frame = () => {
        const now = Date.now();
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const time = (now - start) / 1000;
        night += (target.current.night - night) * 0.04;
        dim += (target.current.dim - dim) * 0.04;
        gl.viewport(0, 0, W, H);

        gl.disable(gl.BLEND);
        gl.useProgram(bg);
        gl.bindBuffer(gl.ARRAY_BUFFER, quad);
        gl.enableVertexAttribArray(aBg);
        gl.vertexAttribPointer(aBg, 2, gl.FLOAT, false, 0, 0);
        gl.uniform1f(u.time, reduceRef.current ? 40 : time);
        gl.uniform2f(u.res, W, H);
        gl.uniform1f(u.night, night);
        gl.uniform1f(u.dim, dim);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        if (!reduceRef.current) {
          for (let i = 0; i < SPARKS; i++) {
            const v = vel[i];
            pos[i * 2] += (v.vx + Math.sin(time * v.sway + v.ph) * 0.004) * dt * 6;
            pos[i * 2 + 1] += v.vy * dt * 6;
            if (pos[i * 2 + 1] > 1.05) { pos[i * 2 + 1] = -1.05; pos[i * 2] = Math.random() * 2 - 1; }
          }
        }
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, night > 0.5 ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(pp);
        gl.bindBuffer(gl.ARRAY_BUFFER, pBuf);
        gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(aP);
        gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, cBuf);
        gl.enableVertexAttribArray(aC);
        gl.vertexAttribPointer(aC, 4, gl.FLOAT, false, 0, 0);
        gl.uniform1f(u.size, Math.max(4, Math.round(H / 220)) * (dpr || 1));
        gl.uniform1f(u.alpha, (night > 0.5 ? 0.9 : 0.55) * dim);
        gl.drawArrays(gl.POINTS, 0, SPARKS);

        gl.flush();
        gl.endFrameEXP();
        raf.current = requestAnimationFrame(frame);
      };
      frame();
    } catch {
      setFailed(true);
    }
  };

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
    </View>
  );
}
