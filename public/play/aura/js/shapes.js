// Reconnaissance de formes volontairement très permissive.
// Le tracé est rééchantillonné puis décrit par quelques mesures simples (fermeture, rotation totale,
// angles vifs, lobes autour du centre). Mieux vaut reconnaître généreusement que frustrer.
import { TAU, wrapAngle } from './util.js';

const N = 64;

export function resample(raw, n = N) {
  const pts = raw.map((p) => ({ x: p.x, y: p.y }));
  let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  if (L === 0) return Array.from({ length: n }, () => ({ x: pts[0].x, y: pts[0].y }));
  const step = L / (n - 1); const out = [{ x: pts[0].x, y: pts[0].y }]; let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    let a = pts[i - 1]; const b = pts[i]; let d = Math.hypot(b.x - a.x, b.y - a.y);
    while (acc + d >= step && out.length < n) {
      const t = (step - acc) / d; const q = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
      out.push(q); a = q; d = Math.hypot(b.x - a.x, b.y - a.y); acc = 0;
    }
    acc += d;
  }
  while (out.length < n) out.push({ x: pts[pts.length - 1].x, y: pts[pts.length - 1].y });
  return out;
}

function smoothPts(p, w = 1, cyclic = false) {
  const n = p.length; const o = [];
  for (let i = 0; i < n; i++) {
    let x = 0, y = 0, c = 0;
    for (let k = -w; k <= w; k++) { let j = i + k; if (cyclic) j = (j + n) % n; else if (j < 0 || j >= n) continue; x += p[j].x; y += p[j].y; c++; }
    o.push({ x: x / c, y: y / c });
  }
  return o;
}

const ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);

/** Analyse un tracé. Renvoie { type, info } ; type = null pour un geste libre. */
export function analyze(raw) {
  if (raw.length < 4) return { type: null, info: null };
  let L = 0; for (let i = 1; i < raw.length; i++) L += Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of raw) { if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y; if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y; }
  const w = maxX - minX, h = maxY - minY; const size = Math.max(w, h, 1);
  const info = { L, size, bbox: { minX, minY, maxX, maxY }, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
  if (L < 24 || size < 16) return { type: null, info };

  let p = smoothPts(resample(raw), 1);
  const gap = Math.hypot(p[N - 1].x - p[0].x, p[N - 1].y - p[0].y);
  let Ls = 0; for (let i = 1; i < N; i++) Ls += Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y);
  const straight = gap / Ls;

  // Rotation totale signée et absolue.
  const th = []; for (let i = 0; i < N - 1; i++) th.push(ang(p[i], p[i + 1]));
  let total = 0, abs = 0; for (let i = 0; i < th.length - 1; i++) { const d = wrapAngle(th[i + 1] - th[i]); total += d; abs += Math.abs(d); }
  info.total = total; info.abs = abs; info.dir = Math.sign(total) || 1;

  if (straight > 0.8 || (straight > 0.7 && abs < 1.2)) return { type: 'line', info: { ...info, pts: p } };

  // Corrélation rang / rayon pour les spirales (centre = barycentre du tracé).
  const gx = p.reduce((s, q) => s + q.x, 0) / N, gy = p.reduce((s, q) => s + q.y, 0) / N;
  const rs = p.map((q) => Math.hypot(q.x - gx, q.y - gy));
  const corr = correlation(rs);
  const turns = Math.abs(total) / TAU;
  if (turns > 1.2 && Math.abs(corr) > 0.5) {
    return { type: turns > 2.6 && size > 160 ? 'galaxy' : 'spiral', info: { ...info, pts: p, turns, corr, cx: gx, cy: gy } };
  }

  const closed = gap / size < 0.42 || (gap / size < 0.6 && Math.abs(total) > 1.6 * Math.PI);

  // Infini : fermé, beaucoup de rotation mais signes qui s'annulent.
  if (closed && abs > 2.6 * Math.PI && Math.abs(total) < 1.3) return { type: 'infinity', info: { ...info, pts: p } };

  if (closed) {
    // Coupe le dépassement final pour une boucle propre.
    let cut = N - 1, best = Infinity;
    for (let i = Math.floor(N * 0.72); i < N; i++) { const d = Math.hypot(p[i].x - p[0].x, p[i].y - p[0].y); if (d < best) { best = d; cut = i; } }
    const loop = resample(p.slice(0, cut + 1), N);
    const q = smoothPts(loop, 1, true);
    const cx = q.reduce((s, v) => s + v.x, 0) / N, cy = q.reduce((s, v) => s + v.y, 0) / N;
    // Angles vifs (fenêtre cyclique), séparés en convexes / concaves selon le sens global.
    const K = 3; const dir = info.dir; const sharp = [];
    const cornerAt = (i) => wrapAngle(ang(q[i], q[(i + K) % N]) - ang(q[(i - K + N) % N], q[i]));
    const ca = []; for (let i = 0; i < N; i++) ca.push(cornerAt(i));
    for (let i = 0; i < N; i++) {
      const a = Math.abs(ca[i]); if (a < 1.05) continue;
      let isMax = true; for (let k = -3; k <= 3; k++) if (k && Math.abs(ca[(i + k + N) % N]) > a) isMax = false;
      if (isMax && !sharp.some((s) => Math.min(Math.abs(s.i - i), N - Math.abs(s.i - i)) < 4)) sharp.push({ i, a: ca[i], convex: Math.sign(ca[i]) === dir });
    }
    const convex = sharp.filter((s) => s.convex).length, concave = sharp.length - convex;
    // Zones concaves franches (sans être forcément pointues).
    let concaveTurn = 0; for (let i = 0; i < N; i++) { const d = wrapAngle(ang(q[i], q[(i + 1) % N]) - ang(q[(i - 1 + N) % N], q[i])); if (Math.sign(d) !== dir) concaveTurn += Math.abs(d); }
    // Lobes : passages du rayon au-dessus de la moyenne, avec hystérésis.
    const r = q.map((v) => Math.hypot(v.x - cx, v.y - cy)); const mr = r.reduce((a, b) => a + b, 0) / N;
    const cv = Math.sqrt(r.reduce((a, b) => a + (b - mr) ** 2, 0) / N) / mr;
    const lobes = countLobes(r, mr);
    let curvy = 0; for (let i = 0; i < N; i++) { if (sharp.some((s) => Math.min(Math.abs(s.i - i), N - Math.abs(s.i - i)) <= K)) continue; curvy += Math.abs(wrapAngle(ang(q[i], q[(i + 1) % N]) - ang(q[(i - 1 + N) % N], q[i]))); }
    curvy /= Math.max(1e-3, abs);
    // Rectitude des segments entre angles : une étoile est faite de traits presque droits.
    let segStraight = 0;
    if (sharp.length >= 3) {
      const qs = smoothPts(q, 2, true); const idx = sharp.map((s) => s.i).sort((a, b) => a - b); let acc = 0;
      for (let k = 0; k < idx.length; k++) {
        const i0 = idx[k], i1 = idx[(k + 1) % idx.length]; const span = (i1 - i0 + N) % N || N; let arc = 0;
        for (let j = 0; j < span; j++) { const a = qs[(i0 + j) % N], b = qs[(i0 + j + 1) % N]; arc += Math.hypot(b.x - a.x, b.y - a.y); }
        acc += arc > 0 ? Math.hypot(qs[i1].x - qs[i0].x, qs[i1].y - qs[i0].y) / arc : 0;
      }
      segStraight = acc / idx.length;
    }
    Object.assign(info, { curvy, segStraight, pts: q, cx, cy, r: mr, cv, lobes, convex, concave, sharp, concaveTurn, closed: true });

    const starry = (Math.abs(total) > 3.2 * Math.PI && convex >= 4) || (convex >= 4 && concave >= 2) || (convex >= 5 && lobes >= 5) || (convex >= 3 && concave >= 3);
    if (starry && segStraight > 0.86) return { type: 'star', info };
    if (starry && lobes >= 3) return { type: 'flower', info: { ...info, petals: Math.max(4, Math.min(9, lobes)) } };
    if ((lobes >= 4 && convex <= 3) || (abs > 5 * Math.PI && lobes >= 3) || (lobes >= 3 && sharp.length >= 3 && Math.abs(total) > 2.8 * Math.PI && segStraight <= 0.86)) return { type: 'flower', info: { ...info, petals: Math.max(4, Math.min(9, lobes)) } };
    if ((concave >= 1 || concaveTurn > 0.9) && lobes >= 2 && lobes <= 3 && convex <= 2) return { type: 'heart', info };
    if (convex >= 3 && convex <= 4 && concave === 0) return { type: 'triangle', info };
    if (lobes === 3 && concave === 0 && convex <= 4 && cv > 0.07) return { type: 'triangle', info };
    if (Math.abs(total) > 1.2 * Math.PI && Math.abs(total) < 3.6 * Math.PI) return { type: 'circle', info };
    return { type: null, info };
  }

  // Formes ouvertes.
  const sp = smoothPts(p, 2);
  const lobesW = signLobes(sp);
  if (lobesW >= 3 && straight > 0.3) return { type: 'wave', info: { ...info, pts: p } };
  // Cercle presque refermé (un « C »).
  if (Math.abs(total) > 1.35 * Math.PI && gap / size < 0.7) return { type: 'circle', info: { ...info, pts: p, cx: gx, cy: gy, r: rs.reduce((a, b) => a + b, 0) / N } };
  if (lobesW >= 2 && straight > 0.45) return { type: 'wave', info: { ...info, pts: p } };
  if (lobesW <= 1 && straight > 0.55) return { type: 'line', info: { ...info, pts: p } };
  return { type: null, info: { ...info, pts: p } };
}

function correlation(rs) {
  const n = rs.length; const mi = (n - 1) / 2; const mr = rs.reduce((a, b) => a + b, 0) / n;
  let num = 0, di = 0, dr = 0;
  for (let i = 0; i < n; i++) { num += (i - mi) * (rs[i] - mr); di += (i - mi) ** 2; dr += (rs[i] - mr) ** 2; }
  return dr === 0 ? 0 : num / Math.sqrt(di * dr);
}

function countLobes(r, mr) {
  const hi = mr * 1.07, lo = mr * 0.93; const n = r.length;
  // Point de départ dans une zone basse pour compter des montées complètes.
  let start = 0; for (let i = 0; i < n; i++) if (r[i] < lo) { start = i; break; }
  let state = 'low', count = 0;
  for (let k = 0; k <= n; k++) { const v = r[(start + k) % n]; if (state === 'low' && v > hi) { state = 'high'; count++; } else if (state === 'high' && v < lo) state = 'low'; }
  return count;
}

/** Nombre de courbures alternées franches (pour les vagues). */
function signLobes(p) {
  // Hystérésis : un petit tremblement inverse ne coupe pas une courbe en deux.
  let lobes = 0, sign = 0, mag = 0, opp = 0;
  for (let i = 1; i < p.length - 1; i++) {
    const d = wrapAngle(ang(p[i], p[i + 1]) - ang(p[i - 1], p[i])); const s = Math.sign(d);
    if (!sign) { sign = s; mag = Math.abs(d); continue; }
    if (s === sign) { mag += Math.abs(d); opp *= 0.5; }
    else { opp += Math.abs(d); if (opp > 0.35) { if (mag > 0.5) lobes++; sign = s; mag = opp; opp = 0; } }
  }
  if (mag > 0.5) lobes++;
  return lobes;
}

/** Version idéalisée du tracé (mêmes indices), vers laquelle la forme se transforme en douceur. */
export function idealize(type, info) {
  const p = info.pts; const n = p.length;
  if (type === 'circle') {
    return p.map((q) => { const a = Math.atan2(q.y - info.cy, q.x - info.cx); return { x: info.cx + Math.cos(a) * info.r, y: info.cy + Math.sin(a) * info.r }; });
  }
  if (type === 'line') {
    const a = p[0], b = p[n - 1]; return p.map((_, i) => ({ x: a.x + (b.x - a.x) * (i / (n - 1)), y: a.y + (b.y - a.y) * (i / (n - 1)) }));
  }
  if (type === 'spiral' || type === 'galaxy') {
    let prev = Math.atan2(p[0].y - info.cy, p[0].x - info.cx), acc = prev; const angs = [acc];
    for (let i = 1; i < n; i++) { const a = Math.atan2(p[i].y - info.cy, p[i].x - info.cx); acc += wrapAngle(a - prev); prev = a; angs.push(acc); }
    const r0 = Math.hypot(p[0].x - info.cx, p[0].y - info.cy), r1 = Math.hypot(p[n - 1].x - info.cx, p[n - 1].y - info.cy);
    return p.map((_, i) => { const r = r0 + (r1 - r0) * (i / (n - 1)); return { x: info.cx + Math.cos(angs[i]) * r, y: info.cy + Math.sin(angs[i]) * r }; });
  }
  if ((type === 'triangle' || type === 'star') && info.sharp && info.sharp.length >= 3) {
    // Redresse les segments entre les angles détectés.
    const idx = info.sharp.map((s) => s.i).sort((a, b) => a - b); const out = new Array(n);
    for (let k = 0; k < idx.length; k++) {
      const i0 = idx[k], i1 = idx[(k + 1) % idx.length]; const span = (i1 - i0 + n) % n || n;
      const a = p[i0], b = p[i1];
      for (let j = 0; j <= span; j++) { const i = (i0 + j) % n; out[i] = { x: a.x + (b.x - a.x) * (j / span), y: a.y + (b.y - a.y) * (j / span) }; }
    }
    return out.map((v, i) => v || p[i]);
  }
  return smoothPts(p, 3, !!info.closed);
}

// Tracés-modèles (pour les icônes de la collection et les démonstrations).
export function glyph(type, cx = 0.5, cy = 0.5, s = 0.36) {
  const pts = []; const M = 72;
  for (let i = 0; i < M; i++) {
    const t = i / (M - 1); let x = 0, y = 0;
    switch (type) {
      case 'line': x = -1 + 2 * t; y = 0.5 - t; break;
      case 'circle': x = Math.cos(t * TAU - 1.57); y = Math.sin(t * TAU - 1.57); break;
      case 'wave': x = -1 + 2 * t; y = Math.sin(t * TAU * 1.5) * 0.45; break;
      case 'spiral': case 'galaxy': { const turns = type === 'galaxy' ? 3 : 2; const a = t * TAU * turns; const r = 0.08 + t * 0.92; x = Math.cos(a) * r; y = Math.sin(a) * r; break; }
      case 'triangle': { const k = Math.min(2.999, t * 3); const v = Math.floor(k), f = k - v; const A = (j) => [Math.cos(-1.57 + j * TAU / 3), Math.sin(-1.57 + j * TAU / 3)]; const a = A(v), b = A(v + 1); x = a[0] + (b[0] - a[0]) * f; y = a[1] + (b[1] - a[1]) * f; break; }
      case 'star': { const k = Math.min(9.999, t * 10); const v = Math.floor(k), f = k - v; const A = (j) => { const r = j % 2 ? 0.42 : 1; const a = -1.57 + j * TAU / 10; return [Math.cos(a) * r, Math.sin(a) * r]; }; const a = A(v), b = A(v + 1); x = a[0] + (b[0] - a[0]) * f; y = a[1] + (b[1] - a[1]) * f; break; }
      case 'flower': { const a = t * TAU; const r = 0.55 + 0.45 * Math.abs(Math.cos(a * 2.5)); x = Math.cos(a) * r; y = Math.sin(a) * r; break; }
      case 'heart': case 'mandala': { const a = t * TAU; x = 16 * Math.pow(Math.sin(a), 3) / 17; y = -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) / 17; if (type === 'mandala') { const r = 0.6 + 0.4 * Math.cos(a * 6); x = Math.cos(a) * r; y = Math.sin(a) * r; } break; }
      case 'infinity': { const a = t * TAU; const d = 1 + Math.sin(a) ** 2; x = Math.cos(a) / d; y = Math.sin(a) * Math.cos(a) / d; break; }
    }
    pts.push({ x: cx + x * s, y: cy + y * s });
  }
  return pts;
}
