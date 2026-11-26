"""Reels Instagram (15 s) : voix (une prise ElevenLabs découpée par reel), musique reprise des films HOMI, bruitages synthétisés.
Sorties : public/audio/reel-NN.wav (avec voix) et reel-NN-sans-voix.wav."""
import importlib.util, os, numpy as np
spec = importlib.util.spec_from_file_location('base', os.path.join(os.path.dirname(__file__), 'pub30_audio.py'))
SR = 48000; N = SR * 15; A = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')
import subprocess, wave
def load(name):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(A, name), '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768
def save(name, x):
    x = np.clip(x, -1, 1); st = np.stack([x, x], 1)
    with wave.open(os.path.join(A, name), 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype(np.int16).tobytes())
def tone(fs, dur, d):
    t = np.arange(int(dur * SR)) / SR; return sum(np.sin(2 * np.pi * f * t) * (0.6 ** k) for k, f in enumerate(fs)) * np.minimum(1, t / 0.004) * np.exp(-t / d)
voice = load('reels-voix-brute.mp3')
MUS = {'musique.mp3': load('musique.mp3'), 'c-musique.mp3': load('c-musique.mp3'), 'g-musique.mp3': load('g-musique.mp3')}
# reel : (début voix, fin voix, musique, début musique)
REELS = {2: (0.00, 7.09, 'musique.mp3', 3.0), 5: (7.78, 15.75, 'c-musique.mp3', 0.0), 8: (16.14, 23.34, 'musique.mp3', 9.0), 11: (23.77, 29.67, 'musique.mp3', 15.0), 14: (30.01, 37.76, 'g-musique.mp3', 0.0)}
for n, (a, b, m, ms) in REELS.items():
    v = np.zeros(N, np.float32); seg = voice[int(a * SR):int(b * SR)].copy(); f = int(0.012 * SR); seg[:f] *= np.linspace(0, 1, f); seg[-f:] *= np.linspace(1, 0, f)
    at = int(0.45 * SR); seg = seg[:N - at]; v[at:at + len(seg)] = seg; v *= 0.9 / max(1e-6, np.abs(v).max())
    mus = MUS[m][int(ms * SR):int(ms * SR) + N]; mus = np.pad(mus, (0, N - len(mus)))
    env = np.ones(N, np.float32); fi = int(0.4 * SR); fo = int(1.2 * SR); env[:fi] = np.linspace(0, 1, fi); env[-fo:] = np.linspace(1, 0, fo)
    sfx = np.zeros(N, np.float32)
    for i in range(3):
        x = tone([1568 + i * 196, 3136], 0.2, 0.05); s = int((4.2 + i * 1.3) * SR); sfx[s:s + len(x)] += x * 0.06
    x = tone([523, 784, 1047, 1568], 2.0, 0.9); s = int(11.8 * SR); sfx[s:s + len(x)] += x[:N - s] * 0.08
    lvl = np.convolve(np.abs(v), np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); duck = 1 - 0.5 * np.clip(lvl / 0.03, 0, 1)
    for suffix, mix in (('', mus * 0.5 * duck * env + sfx + v), ('-sans-voix', mus * 0.62 * env + sfx)):
        pk = np.abs(mix).max(); save(f'reel-{n:02d}{suffix}.wav', mix * (0.89 / pk) if pk > 0.89 else mix)
    print('reel', n, round(b - a, 2), 's de voix')
