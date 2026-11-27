// Interface minimaliste : un compteur discret, trois accès, une feuille qui glisse et disparaît.
import { FORMS, POWERS, COMBOS, UPGRADES, UPGRADE, upCost, reqMet, xpFor, passiveRate, QUESTS, PALETTE_UNLOCK, dawnGain, DAWN_LEVEL } from './economy.js';
import { PALETTES } from './fx.js';
import { PATTERNS } from './serenity.js';
import { SKY, nextSky, skyCost, edgesOf } from './sky.js';
import { glyph } from './shapes.js';
import { t, L, lang } from './i18n.js';
import { fmt } from './util.js';
import { audio } from './audio.js';

const ICON = {
  powers: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/><circle cx="12" cy="12" r="2.2"/>',
  evolve: '<path d="M12 21V11"/><path d="M12 11c0-4 3-6 7-6 0 4-3 6-7 6Z"/><path d="M12 14c0-3-2.5-5-6-5 0 3 2.5 5 6 5Z"/>',
  menu: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  filaments: '<path d="M3 16c3-6 6 2 9-4s6 2 9-4"/>', fireworks: '<path d="M12 12 12 3M12 12l6.4-6.4M12 12l9 0M12 12l-6.4-6.4M12 12H3M12 12l6.4 6.4M12 12l-6.4 6.4M12 12v9"/>',
  water: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="6.5" opacity=".6"/><circle cx="12" cy="12" r="10" opacity=".3"/>',
  magnet: '<path d="M6 4v8a6 6 0 0 0 12 0V4"/><path d="M6 8h3M15 8h3"/>', kaleido: '<path d="M12 3l7.8 4.5v9L12 21l-7.8-4.5v-9Z"/><path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
  lock: '<rect x="6" y="11" width="12" height="9" rx="2"/><path d="M9 11V8a3 3 0 0 1 6 0v3"/>',
};
const svg = (k, s = 22) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
const glyphSvg = (type, s = 44) => { const p = glyph(type, 12, 12, 8.5); const d = p.map((q, i) => (i ? 'L' : 'M') + q.x.toFixed(1) + ' ' + q.y.toFixed(1)).join(''); return `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`; };
const el = (h) => { const d = document.createElement('div'); d.innerHTML = h.trim(); return d.firstElementChild; };

export class UI {
  constructor(G, act) {
    this.G = G; this.act = act; this.tab = 'evolve'; this.root = document.getElementById('ui'); this.fmt = (n) => fmt(n, lang);
    this.root.innerHTML = `
      <div class="hud" id="hud">
        <button class="counter" id="counter" aria-label="${t('light')}">
          <svg class="ring" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" class="ring-bg"/><circle cx="20" cy="20" r="17" class="ring-fg" id="ringFg"/></svg>
          <span class="lv" id="lv">1</span>
          <span class="val"><b id="val">0</b><small id="unit">${t('light')}</small></span>
        </button>
        <div class="actions">
          <button class="ib" data-open="powers" id="bPow" aria-label="${t('tabPowers')}">${svg('filaments')}</button>
          <button class="ib" data-open="evolve" aria-label="${t('tabEvolve')}">${svg('evolve')}<i class="dot" id="dotEvolve"></i></button>
          <button class="ib" data-open="sky" aria-label="${t('tabSky')}">${svg('menu')}<i class="dot" id="dotSky"></i></button>
        </div>
      </div>
      <button class="obj" id="obj" hidden><span class="ot" id="objT"></span><span class="os" id="objS"></span><i class="ob"><b id="objB"></b></i></button>
      <div class="chip" id="chip"></div>
      <div class="toasts" id="toasts" aria-live="polite"></div>
      <div class="intro" id="intro" hidden><p class="i1">${t('start')}</p><p class="i2">${t('start2')}</p></div>
      <div class="breath-label" id="breathLabel"></div>
      <button class="exit" id="exit" aria-label="${t('stop')}">${svg('close', 18)}</button>
      <div class="sheet-wrap" id="sheetWrap" hidden>
        <div class="sheet" id="sheet" role="dialog" aria-modal="true">
          <div class="grab"></div>
          <button class="gear" data-tab="settings" aria-pressed="false" aria-label="${t('tabSettings')}">${svg('gear', 18)}</button>
          <button class="x" data-close aria-label="${t('close')}">${svg('close', 18)}</button>
          <nav class="tabs" id="tabs"></nav>
          <div class="sheet-body" id="body"></div>
        </div>
      </div>`;
    this.$ = (id) => document.getElementById(id);
    this.root.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => this.openSheet(b.dataset.open)));
    this.$('counter').addEventListener('click', () => this.openSheet('evolve'));
    this.$('obj').addEventListener('click', () => { audio.ui(); this.act.objectiveTap(); });
    this.$('exit').addEventListener('click', () => this.act.startMode('play'));
    this.$('sheetWrap').addEventListener('pointerdown', (e) => { if (e.target.id === 'sheetWrap') this.closeSheet(); });
    this.$('sheet').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) this.closeSheet(); });
    this.$('sheet').addEventListener('click', (e) => { if (e.target.closest('#body')) return; const b = e.target.closest('[data-tab]'); if (b) { this.tab = b.dataset.tab; audio.ui(); this.render(); } });
    this.$('body').addEventListener('click', (e) => this.onBody(e));
    this.$('body').addEventListener('input', (e) => { const r = e.target.closest('[data-range]'); if (r) this.act.setSetting(r.dataset.range, +r.value / 100); });
    // Glisser la feuille vers le bas pour la fermer.
    let y0 = null; const sh = this.$('sheet');
    sh.addEventListener('touchstart', (e) => { if (this.$('body').scrollTop <= 0) y0 = e.touches[0].clientY; }, { passive: true });
    sh.addEventListener('touchmove', (e) => { if (y0 !== null && e.touches[0].clientY - y0 > 70) { y0 = null; this.closeSheet(); } }, { passive: true });
    this.lastVal = -1; this.idle = null;
  }
  get s() { return this.G.state; }

  // ---------- HUD ----------
  hud() {
    const s = this.s;
    // Le chiffre défile en douceur vers sa vraie valeur au lieu de sauter.
    this.shown = this.shown === undefined || Math.abs(s.light - this.shown) > s.light * 0.5 + 500 ? s.light : this.shown + (s.light - this.shown) * 0.38;
    const v = Math.floor(Math.abs(s.light - this.shown) < 0.5 ? s.light : this.shown);
    if (v !== this.lastVal) { this.lastVal = v; this.$('val').textContent = this.fmt(v); }
    this.$('lv').textContent = s.level;
    const a = xpFor(s.level), b = xpFor(s.level + 1); const k = Math.min(1, (s.total - a) / Math.max(1, b - a));
    this.$('ringFg').style.strokeDashoffset = String(106.8 * (1 - k));
    const affordable = UPGRADES.some((u) => s.up[u.id] < u.max && reqMet(s, u) && upCost(u.id, s.up[u.id]) <= s.light);
    this.$('dotEvolve').classList.toggle('on', affordable);
    if (!this.$('sheetWrap').hidden && this.tab === 'evolve' && (this._lastEv ?? -1) !== v) { this._lastEv = v; this.refreshCosts(); }
    if (!this.$('sheetWrap').hidden && this.tab === 'sky') { const b = this.$('body').querySelector('[data-sky]'); const n = nextSky(this.s); if (b && n) b.disabled = this.s.light < skyCost(n); }
  }
  counterPos() { const r = this.$('lv').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
  /** Vide la file des messages (on change de moment : seul le nouveau message compte). */
  clearToasts() { this.q = []; }
  /** Objectif en cours, sous le compteur. */
  objective(info, visible) {
    const el = this.$('obj'); if (!info) { el.hidden = true; return; }
    el.hidden = false; el.classList.toggle('off', !visible); if (!visible) return;
    const name = L(info.o.name); let sub, k;
    if (info.locked) { sub = t('objLevel', { n: info.need }); k = Math.min(1, this.s.level / info.need); }
    else if (info.o.kind === 'sky') { sub = info.ready ? t('objTap') : `${this.fmt(this.s.light)} / ${this.fmt(info.cost)} ${t('light').toLowerCase()}`; k = info.ready ? 1 : Math.min(1, this.s.light / info.cost); }
    else if (info.o.kind === 'level') { sub = `${t('level')} ${this.s.level} / ${info.o.n}`; k = Math.min(1, this.s.level / info.o.n); }
    else { sub = `${info.v} / ${info.o.n}`; k = info.v / info.o.n; }
    const key = name + sub; if (key !== this._objKey) { this._objKey = key; this.$('objT').textContent = name; this.$('objS').textContent = sub; }
    this.$('objB').style.width = Math.round(k * 100) + '%'; el.classList.toggle('ready', !!info.ready);
  }
  objectiveDone() { const el = this.$('obj'); el.classList.remove('done'); void el.offsetWidth; el.classList.add('done'); this._objKey = null; }
  skyCount(txt) { if (txt === this._skyTxt) return; this._skyTxt = txt; const b = this.$('breathLabel'); b.textContent = txt; b.classList.add('in'); }
  skyReady(on) { this.$('dotSky').classList.toggle('on', on); }
  /** Petit scintillement du compteur quand la lumière du repos arrive : discret. */
  glint() { const c = this.$('counter'); c.classList.remove('glint'); void c.offsetWidth; c.classList.add('glint'); }
  pulse() { const c = this.$('counter'); c.classList.remove('pulse'); void c.offsetWidth; c.classList.add('pulse'); }
  drawing(on) { clearTimeout(this.idle); if (on) document.body.classList.add('drawing'); else this.idle = setTimeout(() => document.body.classList.remove('drawing'), 1400); }
  flashPower() { const p = POWERS.find((x) => x.id === this.s.power); const c = this.$('chip'); c.innerHTML = svg(p.id, 16) + '<span>' + L(p.name) + '</span>'; c.classList.remove('show'); void c.offsetWidth; c.classList.add('show'); }

  /** Un seul message à la fois, jamais d'empilement : les plus importants passent devant. */
  toast(title, sub = '', ms = 3000, prio = 1) {
    this.q = (this.q || []).filter((m) => m.prio >= prio - 1).slice(-2); this.q.push({ title, sub, ms, prio });
    this.q.sort((a, b) => b.prio - a.prio); if (!this.showing) this.nextToast();
  }
  nextToast() {
    const m = this.q.shift(); if (!m) { this.showing = false; return; } this.showing = true;
    const box = this.$('toasts'); const n = el(`<div class="toast"><b></b>${m.sub ? '<span></span>' : ''}</div>`); n.querySelector('b').textContent = m.title; if (m.sub) n.querySelector('span').textContent = m.sub;
    box.appendChild(n); requestAnimationFrame(() => n.classList.add('in'));
    const dur = this.q.length ? Math.min(m.ms, 2200) : m.ms;
    setTimeout(() => { n.classList.remove('in'); n.classList.add('out'); setTimeout(() => { n.remove(); this.nextToast(); }, 700); }, dur);
  }
  showIntro() { const i = this.$('intro'); i.hidden = false; requestAnimationFrame(() => i.classList.add('in')); }
  hideIntro() { const i = this.$('intro'); i.classList.remove('in'); setTimeout(() => (i.hidden = true), 1200); }
  breath(txt, sub = '') { const b = this.$('breathLabel'); b.classList.remove('in'); void b.offsetWidth; b.innerHTML = ''; const m = document.createElement('span'); m.textContent = txt; b.appendChild(m); if (sub) { const c = document.createElement('small'); c.textContent = sub; b.appendChild(c); } if (txt) b.classList.add('in'); }

  // ---------- Feuille ----------
  openSheet(tab) { this.tab = tab; audio.ui(); const w = this.$('sheetWrap'); w.hidden = false; this.render(); requestAnimationFrame(() => w.classList.add('open')); }
  closeSheet() { const w = this.$('sheetWrap'); if (w.hidden) return; w.classList.remove('open'); setTimeout(() => { if (!w.classList.contains('open')) w.hidden = true; }, 420); }

  render() {
    const s = this.s; const p = POWERS.find((x) => x.id === s.power) || POWERS[0];
    this.$('bPow').innerHTML = svg(p.id);
    this.$('unit').textContent = t('light');
    if (this.$('sheetWrap').hidden) return;
    const tabs = [['sky', t('tabSky')], ['evolve', t('tabEvolve')], ['powers', t('tabPowers')], ['codex', t('tabCodex')], ['calm', t('tabCalm')]];
    this.$('tabs').innerHTML = tabs.map(([id, n]) => `<button data-tab="${id}" aria-pressed="${this.tab === id}">${n}</button>`).join('');
    this.$('sheet').querySelector(':scope > .gear').setAttribute('aria-pressed', String(this.tab === 'settings'));
    const body = this.$('body'); body.innerHTML = this['tab_' + this.tab]();
  }

  tab_sky() {
    const s = this.s; const done = s.sky || []; const next = nextSky(s);
    const glyph = (c, lit, size = 64) => { const e = edgesOf(c); return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${e.map(([a, b]) => `<line x1="${c.pts[a][0] * 100}" y1="${c.pts[a][1] * 100}" x2="${c.pts[b][0] * 100}" y2="${c.pts[b][1] * 100}" stroke="currentColor" stroke-width="${lit ? 2.2 : 1.2}" stroke-linecap="round" ${lit ? '' : 'stroke-dasharray="2 5" opacity=".5"'}/>`).join('')}${c.pts.map(([x, y]) => `<circle cx="${x * 100}" cy="${y * 100}" r="${lit ? 3.4 : 2.4}" fill="currentColor" ${lit ? '' : 'opacity=".6"'}/>`).join('')}</svg>`; };
    let nextCard = '';
    if (next) {
      const cost = skyCost(next); const lvlOk = s.level >= next.gate;
      nextCard = `<article class="skynext"><span class="sg">${glyph(next, false, 92)}</span><span class="pt"><small>${t('skyNext')}</small><b>${L(next.name)}</b>
        ${lvlOk ? `<button class="buy" data-sky ${s.light < cost ? 'disabled' : ''}><span>${t('skyAwake')}</span> <b data-skycost>${this.fmt(cost)}</b></button>` : `<small class="lockd">${svg('lock', 13)} ${t('skyLevel', { n: next.gate })}</small>`}</span></article>`;
    } else nextCard = `<p class="note">${t('skyAll2')}</p>`;
    return `<p class="note skyintro">${t('skyIntro')}</p><div class="sum"><span>${done.length} <small>/ ${SKY.length}</small></span><small>${t('skyProgress', { n: done.length, p: 12 * done.length })}</small></div>${nextCard}
      <div class="skygrid">${SKY.map((c) => { const lit = done.includes(c.id); const isNext = next && c.id === next.id; return `<div class="skycell ${lit ? 'lit' : ''} ${isNext ? 'next' : ''}">${lit || isNext ? glyph(c, lit, 54) : '<span class="q">?</span>'}<b>${lit || isNext ? L(c.name) : t('unknown')}</b>${lit ? `<small>${L(c.tale)}</small>` : ''}</div>`; }).join('')}</div>`;
  }

  tab_evolve() {
    const s = this.s; const branches = [['gesture', t('branchGesture')], ['light', t('branchLight')], ['harmony', t('branchHarmony')]];
    const pr = passiveRate(s);
    const g = dawnGain(s); const dawnCard = `<article class="up dawn ${g ? '' : 'locked'}"><div class="up-t"><b>☀︎ ${t('dawnTitle')}</b>${s.dawns ? `<span class="lvl">${t('dawnHave', { n: s.dawns, p: 25 * s.dawns })}</span>` : ''}</div><p>${t('dawnDesc')}</p>
      <div class="up-b"><small>${g ? '' : t('dawnLocked', { n: DAWN_LEVEL })}</small>${g ? `<button class="buy" data-dawn>${t('dawnBtn', { n: g })}</button>` : `<span class="lockd">${svg('lock', 14)}</span>`}</div></article>`;
    return `<div class="sum"><span>${this.fmt(s.light)} <small>${t('light')}</small></span>${pr > 0 ? `<small>${t('passive', { v: this.fmt(pr) })}</small>` : ''}</div>` + (s.level >= 20 || s.dawns ? dawnCard : '') + branches.map(([b, name]) => `
      <section class="branch"><h3>${name}</h3>${UPGRADES.filter((u) => u.branch === b).map((u) => this.upCard(u)).join('')}</section>`).join('');
  }
  upCard(u) {
    const s = this.s; const lvl = s.up[u.id]; const ok = reqMet(s, u); const max = lvl >= u.max; const c = upCost(u.id, lvl);
    const req = !ok ? `${t('requires')} : ${L(UPGRADE[u.req[0]].name)} ${u.req[1]}` : '';
    const pips = u.max <= 15 ? `<span class="pips">${Array.from({ length: u.max }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('')}</span>` : `<span class="lvl">${lvl} / ${u.max}</span>`;
    return `<article class="up ${ok ? '' : 'locked'} ${max ? 'max' : ''}">
      <div class="up-t"><b>${L(u.name)}</b>${pips}</div>
      <p>${L(u.desc)}</p>
      <div class="up-b"><small>${ok ? L(u.fx) + ' · ' + t('perLevel') : req}</small>
      ${max ? `<span class="done">${t('maxed')}</span>` : ok ? `<button class="buy" data-buy="${u.id}" ${s.light < c ? 'disabled' : ''}><span>${t('buy')}</span> <b data-cost="${u.id}">${this.fmt(c)}</b></button>` : `<span class="lockd">${svg('lock', 14)}</span>`}</div>
    </article>`;
  }
  refreshCosts() { this.$('body').querySelectorAll('[data-buy]').forEach((b) => { const id = b.dataset.buy; b.disabled = this.s.light < upCost(id, this.s.up[id]); }); const sum = this.$('body').querySelector('.sum span'); if (sum) sum.innerHTML = `${this.fmt(this.s.light)} <small>${t('light')}</small>`; }

  tab_powers() {
    const s = this.s;
    return `<div class="list">${POWERS.map((p) => { const ok = s.level >= p.level; return `<button class="pow ${s.power === p.id ? 'sel' : ''}" ${ok ? `data-power="${p.id}"` : 'disabled'}>
      <span class="pi">${svg(ok ? p.id : 'lock', 26)}</span><span class="pt"><b>${L(p.name)}</b><small>${ok ? L(p.desc) : t('atLevel', { n: p.level })}</small></span></button>`; }).join('')}</div>`;
  }

  tab_codex() {
    const s = this.s; const found = COMBOS.filter((c) => s.combos[c.id]).length; const u = s.universe;
    const lights = u.stars.length + u.flowers.length + u.galaxies.length + u.loops.length + u.constellations.length + u.auroras.length;
    return `<h3>${t('forms')} <small>${FORMS.filter((f) => s.level >= f.level).length} / ${FORMS.length}</small></h3>
      <div class="forms">${FORMS.map((f) => { const ok = s.level >= f.level; return `<div class="form ${ok ? '' : 'locked'}" title="${L(f.desc)}">${glyphSvg(f.id)}<b>${ok ? L(f.name) : t('unknown')}</b><small>${ok ? (s.forms[f.id] ? '× ' + s.forms[f.id] : '—') : t('atLevel', { n: f.level })}</small></div>`; }).join('')}</div>
      <h3>${t('combos')} <small>${found} / ${COMBOS.length}</small></h3>
      <div class="combos">${COMBOS.map((c) => { const ok = !!s.combos[c.id]; const recipe = Object.entries(c.need).map(([k, n]) => (n > 1 ? n + ' × ' : '') + L(FORMS.find((f) => f.id === k).name)).join(' + '); return `<div class="combo ${ok ? 'found' : ''}"><b>${ok ? L(c.name) : t('unknown')}</b><small>${ok ? recipe : L(c.hint)}</small></div>`; }).join('')}</div>
      <h3>${t('path')} <small>${QUESTS.filter((q) => s.quests[q.id]).length} / ${QUESTS.length}</small></h3>
      <div class="quests">${QUESTS.map((q) => ({ q, v: Math.min(q.goal, q.metric(s)), done: !!s.quests[q.id] })).sort((a, b) => (a.done - b.done) || (b.v / b.q.goal - a.v / a.q.goal)).map(({ q, v, done }) => `<div class="quest ${done ? 'done' : ''}"><span class="qn">${done ? '✦ ' : ''}${L(q.name)}${q.palette ? ` <em>· ${L(PALETTES[q.palette].name)}</em>` : ''}</span><span class="qbar"><i style="width:${Math.round((v / q.goal) * 100)}%"></i></span></div>`).join('')}</div>
      <p class="stats">${t('stats', { s: s.stats.strokes, c: s.stats.created, u: lights })}</p>`;
  }

  tab_calm() {
    const MOON = '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg>';
    return `<p class="note">${t('calmNote')}</p><div class="list">
      <div class="pow calm sleepcard"><span class="pi">${MOON}</span><span class="pt"><b>${t('sleepTitle')}</b><small>${t('sleepDesc')}</small>
        <span class="picks">${[15, 30, 45, 60].map((m) => `<button class="pick" data-sleep="${m}">${m} min</button>`).join('')}</span></span></div>
      <div class="pow calm"><span class="pi">${svg('water', 26)}</span><span class="pt"><b>${t('breathe')}</b><small>${t('breatheDesc2')}</small>
        <span class="picks">${Object.entries(PATTERNS).map(([id, p]) => `<button class="pick" data-breath="${id}">${L(p.name)}</button>`).join('')}</span></span></div>
      <button class="pow" data-mode="contemplate"><span class="pi">${svg('powers', 26)}</span><span class="pt"><b>${t('contemplate')}</b><small>${t('contemplateDesc')}</small></span></button>
      <button class="pow" data-mode="free"><span class="pi">${svg('filaments', 26)}</span><span class="pt"><b>${t('free')}</b><small>${t('freeDesc')}</small></span></button>
    </div>`;
  }

  tab_settings() {
    const st = this.s.settings; const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const range = (k, label) => `<label class="row"><span>${label}</span><input type="range" min="0" max="100" value="${Math.round(st[k] * 100)}" data-range="${k}"></label>`;
    const tog = (k, label) => `<button class="row tog" data-toggle="${k}" aria-pressed="${!!st[k]}"><span>${label}</span><i></i></button>`;
    return `<div class="settings">
      ${range('sound', t('sound'))}${range('music', t('music'))}${range('intensity', t('intensity'))}
      ${tog('haptics', t('haptics'))}${tog('reduced', t('reduced'))}
      <div class="row col"><span>${t('palette')}</span><div class="pals">${Object.entries(PALETTES).map(([id, p]) => { const locked = PALETTE_UNLOCK[id] && !this.s.quests[PALETTE_UNLOCK[id]]; return `<button data-pal="${id}" aria-pressed="${st.palette === id}" ${locked ? `disabled title="${t('paletteLocked')}"` : ''} style="--g:linear-gradient(90deg,${p.stops.map((h) => `hsl(${h},${p.sat}%,70%)`).join(',')})"><i></i>${L(p.name)}${locked ? ' ' + svg('lock', 11) : ''}</button>`; }).join('')}</div></div>
      <div class="row"><span>${t('lang')}</span><div class="seg"><button data-lang="fr" aria-pressed="${lang === 'fr'}">FR</button><button data-lang="en" aria-pressed="${lang === 'en'}">EN</button></div></div>
      <p class="note">${t('silentHint')}</p>
      ${iOS && !standalone ? `<p class="note">${t('install')}</p>` : ''}
      <button class="reset" data-reset>${t('reset')}</button>
      <p class="note ver">${t('version')} ${window.__aura?.version && !window.__aura.version.startsWith('__') ? window.__aura.version : 'dev'} · ${window.__aura?.screenInfo ? window.__aura.screenInfo() : ''}</p>
    </div>`;
  }

  onBody(e) {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.buy) { if (this.act.buy(b.dataset.buy)) this.render(); return; }
    if (b.dataset.sky !== undefined) { if (this.act.awakenSky()) this.closeSheet(); return; }
    if (b.dataset.dawn !== undefined) { if (confirm(t('dawnConfirm', { n: dawnGain(this.s) }))) { this.act.dawn(); this.closeSheet(); } return; }
    if (b.dataset.power) { this.act.setPower(b.dataset.power); this.closeSheet(); return; }
    if (b.dataset.mode) { this.act.startMode(b.dataset.mode); return; }
    if (b.dataset.sleep) { this.act.startMode('sleep', +b.dataset.sleep); return; }
    if (b.dataset.breath) { this.act.startMode('breathe', b.dataset.breath); return; }
    if (b.dataset.toggle) { this.act.setSetting(b.dataset.toggle, !this.s.settings[b.dataset.toggle]); return; }
    if (b.dataset.pal) { this.act.setSetting('palette', b.dataset.pal); return; }
    if (b.dataset.lang) { this.act.setSetting('lang', b.dataset.lang); this.relabel(); return; }
    if (b.dataset.reset !== undefined) { if (confirm(t('resetConfirm'))) this.act.reset(); }
  }
  relabel() { this.$('unit').textContent = t('light'); this.render(); }
}

