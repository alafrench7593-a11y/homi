// Sous-titres SRT et VTT depuis src/data/script.ts (source unique de la voix off).
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
const src = readFileSync(path.join(root, 'src/data/script.ts'), 'utf8');
const cues = [...src.matchAll(/\{ from: ([\d.]+), to: ([\d.]+), text: '((?:[^'\\]|\\.)*)' \}/g)].map((m) => ({ from: +m[1], to: +m[2], text: m[3].replace(/\\'/g, "'") }));
const ts = (s, sep) => { const ms = Math.round(s * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, ss = Math.floor(ms / 1000) % 60, r = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}${sep}${String(r).padStart(3, '0')}`; };
writeFileSync(path.join(root, 'subtitles/homi-film.fr.srt'), cues.map((c, i) => `${i + 1}\n${ts(c.from, ',')} --> ${ts(c.to, ',')}\n${c.text}\n`).join('\n'));
writeFileSync(path.join(root, 'subtitles/homi-film.fr.vtt'), 'WEBVTT\n\n' + cues.map((c) => `${ts(c.from, '.')} --> ${ts(c.to, '.')}\n${c.text}\n`).join('\n'));
console.log(`${cues.length} sous-titres`);
