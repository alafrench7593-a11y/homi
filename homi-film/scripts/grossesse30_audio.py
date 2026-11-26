"""Pub Grossesse 30 s : place la voix (phrases calées sur l'image), synthétise les bruitages (aucune banque tierce), mixe avec la musique.
Sorties : public/audio/g30-mix.wav (voix+musique+bruitages), g30-mix-sans-voix.wav, g30-voix.wav (voix seule calée)."""
import subprocess, numpy as np, wave, sys, os
SR = 48000; N = SR * 30
A = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')
def load(name):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(A, name), '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768
def save(name, x):
    x = np.clip(x, -1, 1); st = np.stack([x, x], 1)
    with wave.open(os.path.join(A, name), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
# ── voix : (début source, fin source, position dans le film) — voir src/data/pub30.ts
VO = [(0.00, 2.42, 0.50), (3.05, 5.90, 4.40), (6.10, 7.41, 9.60), (7.64, 9.27, 11.60), (9.64, 12.35, 14.80), (12.56, 14.66, 21.60), (15.10, 17.30, 25.60), (17.76, 18.16, 28.00), (18.50, 19.60, 28.55)]
src = load('g-voix-brute.mp3'); voice = np.zeros(N, np.float32)
for a, b, at in VO:
    seg = src[int(a * SR):int(b * SR)].copy(); f = int(0.012 * SR)
    seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    i = int(at * SR); seg = seg[:N - i]; voice[i:i + len(seg)] += seg
music = load('g-musique.mp3')[:N]; music = np.pad(music, (0, N - len(music)))
# ── bruitages synthétiques
sfx = np.zeros(N, np.float32); rng = np.random.default_rng(7)
def put(t, x, g):
    i = int(t * SR); x = x[:N - i]; sfx[i:i + len(x)] += x * g
def env(n, a=0.005, d=0.2):
    t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-t / d)
def tone(fs, dur, d):
    t = np.arange(int(dur * SR)) / SR; return sum(np.sin(2 * np.pi * f * t) * (0.6 ** k) for k, f in enumerate(fs)) * env(len(t), 0.004, d)
def whoosh(dur):
    n = int(dur * SR); x = rng.standard_normal(n).astype(np.float32); y = np.zeros(n, np.float32); s = 0.0
    cut = 0.02 + 0.25 * np.sin(np.linspace(0, np.pi, n)) ** 2
    for k in range(n): s += cut[k] * (x[k] - s); y[k] = s
    return y * np.sin(np.linspace(0, np.pi, n)) ** 2
def click(): return rng.standard_normal(int(0.008 * SR)).astype(np.float32) * env(int(0.008 * SR), 0.0005, 0.002)
def flip():
    n = int(0.16 * SR); x = rng.standard_normal(n).astype(np.float32); x = np.diff(x, prepend=0); return x * np.sin(np.linspace(0, np.pi, n)) ** 1.5 * 0.5
for t in (2.6, 3.95, 8.95, 13.95, 20.0, 25.15): put(t, whoosh(0.8), 0.4)
for t in (1.9, ): put(t, tone([523, 784, 1047], 1.6, 0.7), 0.07)
for k in range(36): put(4.45 + k * 0.105, tone([1400 + (k % 6) * 60], 0.05, 0.015), 0.025)
for i in range(10): put(9.4 + i * 0.13, tone([1568 + i * 30, 3136], 0.12, 0.03), 0.06)
put(14.15, tone([523, 659, 784, 1047], 1.6, 0.7), 0.10)
for a, b in ((14.75, 15.45), (16.75, 17.25)):
    for k, t in enumerate(np.arange(a, b, 0.055)): put(t + (k % 3) * 0.008, click(), 0.11)
for t in (15.55, 17.35): put(t, tone([1200, 1800], 0.1, 0.03), 0.09)
put(16.0, tone([880, 1319], 0.7, 0.25), 0.09); put(16.1, whoosh(0.6), 0.25)
for k in range(3): put(18.4 + k * 0.33, tone([1175, 1760], 0.25, 0.07), 0.08)
put(21.1, tone([1175], 0.2, 0.06), 0.07); put(21.8, tone([1568, 2093, 3136], 0.7, 0.2), 0.09)
put(22.7, tone([523, 784, 1047], 1.2, 0.5), 0.07)
for i in range(5): put(26.1 + i * 0.16, flip(), 0.12)
tt = np.arange(int(2.0 * SR)) / SR; put(27.85, (np.sin(2 * np.pi * 55 * tt) * np.exp(-tt / 0.5)).astype(np.float32), 0.25)
put(27.85, tone([523, 659, 784, 1047, 1568], 2.2, 1.0), 0.08)
# ── mixage : musique abaissée sous la voix (enveloppe lissée), fondu de fin
lvl = np.convolve(np.abs(voice), np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); duck = 1 - 0.45 * np.clip(lvl / 0.03, 0, 1)
fade = np.ones(N, np.float32); fade[-int(0.6 * SR):] = np.linspace(1, 0.0, int(0.6 * SR)) ** 0.5
mus_v = music * 0.5 * duck; mus_n = music * 0.62
vn = voice * (0.9 / max(1e-6, np.abs(voice).max()))
mix_v = (mus_v + sfx + vn) * fade; mix_n = (mus_n + sfx) * fade
for name, x in (('g30-mix.wav', mix_v), ('g30-mix-sans-voix.wav', mix_n), ('g30-voix.wav', vn)):
    pk = np.abs(x).max(); save(name, x * (0.89 / pk) if pk > 0.89 else x); print(name, round(float(pk), 3))
