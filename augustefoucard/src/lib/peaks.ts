import { seeded } from './util';

const cache = new Map<string, Promise<number[]>>();
let ctx: BaseAudioContext | null = null;

function getCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  // OfflineAudioContext suffit pour décoder et n'émet aucun son.
  try { ctx = new OfflineAudioContext(1, 1, 44100); } catch { ctx = new AC(); }
  return ctx;
}

/** Formes d'onde de secours, stables, en attendant (ou en cas d'échec) du décodage. */
export function fakePeaks(seed: string, n = 120) {
  const r = seeded(seed);
  let v = 0.5;
  return Array.from({ length: n }, (_, i) => {
    v = Math.min(1, Math.max(0.12, v + (r() - 0.5) * 0.35));
    return v * (0.7 + 0.3 * Math.sin(i / 7));
  });
}

/** Calcule les pics audio d'un fichier (mis en cache). */
export function getPeaks(src: string, n = 140): Promise<number[]> {
  const key = `${src}#${n}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const p = fetch(src)
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.arrayBuffer();
    })
    .then((buf) => new Promise<AudioBuffer>((res, rej) => getCtx().decodeAudioData(buf, res, rej)))
    .then((audio) => {
      const data = audio.getChannelData(0);
      const block = Math.floor(data.length / n);
      const out: number[] = [];
      let max = 0;
      for (let i = 0; i < n; i++) {
        let sum = 0;
        for (let j = 0; j < block; j += 8) {
          const v = data[i * block + j];
          sum += v * v;
        }
        const rms = Math.sqrt(sum / (block / 8));
        out.push(rms);
        max = Math.max(max, rms);
      }
      return out.map((v) => Math.max(0.06, max ? v / max : 0));
    })
    .catch(() => fakePeaks(src, n));
  cache.set(key, p);
  return p;
}
