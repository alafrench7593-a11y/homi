"""Pub Communauté 30 s : place la voix (phrases calées sur l'image), synthétise les bruitages (aucune banque tierce), mixe avec la musique.
Sorties : public/audio/c30-mix.wav (voix+musique+bruitages), c30-mix-sans-voix.wav, c30-voix.wav (voix seule calée)."""
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
VO = [(0.00, 2.40, 0.50), (3.03, 6.54, 2.95), (6.81, 9.32, 6.70), (9.65, 11.03, 15.40), (11.23, 12.19, 17.00), (12.52, 14.50, 21.40), (14.87, 17.43, 25.80), (17.85, 19.44, 28.35)]
src = load('c-voix-brute.mp3'); voice = np.zeros(N, np.float32)
for a, b, at in VO:
    seg = src[int(a * SR):int(b * SR)].copy(); f = int(0.012 * SR)
    seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    i = int(at * SR); seg = seg[:N - i]; voice[i:i + len(seg)] += seg
music = load('c-musique.mp3')[:N]; music = np.pad(music, (0, N - len(music)))
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
for t in (4.1, 9.0, 14.9, 20.9, 25.7): put(t, whoosh(0.8), 0.4)
for i in range(3): put(0.4 + i * 0.6, tone([660 + i * 110], 0.5, 0.25), 0.05)
put(2.9, whoosh(0.9), 0.35); put(3.1, tone([523, 784, 1047], 1.4, 0.6), 0.08)
for k, at in enumerate((5.4, 6.4, 7.4)): put(at, tone([1319, 1760], 0.3, 0.08), 0.09); put(at + 0.08, tone([2093], 0.2, 0.05), 0.05)
for i in range(11): put(9.5 + i * 0.12, tone([1480 + i * 30, 2960], 0.12, 0.03), 0.05)
for at in (16.4, 17.3, 18.2): put(at, tone([1175, 1568], 0.3, 0.08), 0.08)
for k in range(9): put(16.6 + k * 0.32, tone([2349], 0.08, 0.02), 0.04)
put(21.15, tone([523, 659, 784, 1047], 1.6, 0.7), 0.10)
for a, b in ((21.75, 22.5),):
    for k, t in enumerate(np.arange(a, b, 0.06)): put(t, click(), 0.08)
put(23.1, tone([880, 1319], 0.7, 0.25), 0.09)
for i in range(4): put(23.35 + i * 0.15, tone([1568 + i * 196], 0.2, 0.06), 0.06)
for i in range(16): put(25.9 + i * 0.04, tone([2093 + (i % 4) * 262], 0.08, 0.02), 0.02)
put(27.7, whoosh(0.8), 0.3)
tt = np.arange(int(2.0 * SR)) / SR; put(28.2, (np.sin(2 * np.pi * 55 * tt) * np.exp(-tt / 0.5)).astype(np.float32), 0.25)
put(28.2, tone([523, 659, 784, 1047, 1568], 2.0, 1.0), 0.08)
# ── mixage : musique abaissée sous la voix (enveloppe lissée), fondu de fin
lvl = np.convolve(np.abs(voice), np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); duck = 1 - 0.45 * np.clip(lvl / 0.03, 0, 1)
fade = np.ones(N, np.float32); fade[-int(0.6 * SR):] = np.linspace(1, 0.0, int(0.6 * SR)) ** 0.5
mus_v = music * 0.5 * duck; mus_n = music * 0.62
vn = voice * (0.9 / max(1e-6, np.abs(voice).max()))
mix_v = (mus_v + sfx + vn) * fade; mix_n = (mus_n + sfx) * fade
for name, x in (('c30-mix.wav', mix_v), ('c30-mix-sans-voix.wav', mix_n), ('c30-voix.wav', vn)):
    pk = np.abs(x).max(); save(name, x * (0.89 / pk) if pk > 0.89 else x); print(name, round(float(pk), 3))
