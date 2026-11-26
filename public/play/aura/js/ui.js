// Interface minimaliste : un compteur discret, trois accès, une feuille qui glisse et disparaît.
import { FORMS, POWERS, COMBOS, UPGRADES, UPGRADE, upCost, reqMet, xpFor, passiveRate } from './economy.js';
import { PALETTES } from './fx.js';
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
          <button class="ib" data-open="codex" aria-label="${t('tabCodex')}">${svg('menu')}</button>
        </div>
      </div>
      <div class="chip" id="chip"></div>
      <div class="toasts" id="toasts" aria-live="polite"></div>
      <div class="intro" id="intro" hidden><p class="i1">${t('start')}</p><p class="i2">${t('start2')}</p></div>
      <div class="breath-label" id="breathLabel"></div>
      <button class="exit" id="exit" aria-label="${t('stop')}">${svg('close', 18)}</button>
      <div class="sheet-wrap" id="sheetWrap" hidden>
        <div class="sheet" id="sheet" role="dialog" aria-modal="true">
          <div class="grab"></div>
          <nav class="tabs" id="tabs"></nav>
          <div class="sheet-body" id="body"></div>
        </div>
      </div>`;
    this.$ = (id) => document.getElementById(id);
    this.root.querySelectorAll('[data-open]').forEach((b) => b.addEventListener('click', () => this.openSheet(b.dataset.open)));
    this.$('counter').addEventListener('click', () => this.openSheet('evolve'));
    this.$('exit').addEventListener('click', () => this.act.startMode('play'));
    this.$('sheetWrap').addEventListener('pointerdown', (e) => { if (e.target.id === 'sheetWrap') this.closeSheet(); });
    this.$('tabs').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) { this.closeSheet(); return; } const b = e.target.closest('[data-tab]'); if (b) { this.tab = b.dataset.tab; audio.ui(); this.render(); } });
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
    const s = this.s; const v = Math.floor(s.light);
    if (v !== this.lastVal) { this.lastVal = v; this.$('val').textContent = this.fmt(v); }
    this.$('lv').textContent = s.level;
    const a = xpFor(s.level), b = xpFor(s.level + 1); const k = Math.min(1, (s.total - a) / Math.max(1, b - a));
    this.$('ringFg').style.strokeDashoffset = String(106.8 * (1 - k));
    const affordable = UPGRADES.some((u) => s.up[u.id] < u.max && reqMet(s, u) && upCost(u.id, s.up[u.id]) <= s.light);
    this.$('dotEvolve').classList.toggle('on', affordable);
    if (!this.$('sheetWrap').hidden && this.tab === 'evolve' && (this._lastEv ?? -1) !== v) { this._lastEv = v; this.refreshCosts(); }
  }
  counterPos() { const r = this.$('lv').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
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
  breath(txt) { const b = this.$('breathLabel'); b.classList.remove('in'); void b.offsetWidth; b.textContent = txt; b.classList.add('in'); }

  // ---------- Feuille ----------
  openSheet(tab) { this.tab = tab; audio.ui(); const w = this.$('sheetWrap'); w.hidden = false; this.render(); requestAnimationFrame(() => w.classList.add('open')); }
  closeSheet() { const w = this.$('sheetWrap'); if (w.hidden) return; w.classList.remove('open'); setTimeout(() => { if (!w.classList.contains('open')) w.hidden = true; }, 420); }

  render() {
    const s = this.s; const p = POWERS.find((x) => x.id === s.power) || POWERS[0];
    this.$('bPow').innerHTML = svg(p.id);
    this.$('unit').textContent = t('light');
    if (this.$('sheetWrap').hidden) return;
    const tabs = [['evolve', t('tabEvolve')], ['powers', t('tabPowers')], ['codex', t('tabCodex')], ['calm', t('tabCalm')]];
    this.$('tabs').innerHTML = tabs.map(([id, n]) => `<button data-tab="${id}" aria-pressed="${this.tab === id}">${n}</button>`).join('') + `<button class="gear" data-tab="settings" aria-pressed="${this.tab === 'settings'}" aria-label="${t('tabSettings')}">${svg('gear', 18)}</button>` + `<button class="x" data-close aria-label="${t('close')}">${svg('close', 18)}</button>`;
    const body = this.$('body'); body.innerHTML = this['tab_' + this.tab]();
  }

  tab_evolve() {
    const s = this.s; const branches = [['gesture', t('branchGesture')], ['light', t('branchLight')], ['harmony', t('branchHarmony')]];
    const pr = passiveRate(s);
    return `<div class="sum"><span>${this.fmt(s.light)} <small>${t('light')}</small></span>${pr > 0 ? `<small>${t('passive', { v: this.fmt(pr) })}</small>` : ''}</div>` + branches.map(([b, name]) => `
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
      <p class="stats">${t('stats', { s: s.stats.strokes, c: s.stats.created, u: lights })}</p>`;
  }

  tab_calm() {
    return `<p class="note">${t('calmNote')}</p><div class="list">
      <button class="pow" data-mode="free"><span class="pi">${svg('filaments', 26)}</span><span class="pt"><b>${t('free')}</b><small>${t('freeDesc')}</small></span></button>
      <button class="pow" data-mode="contemplate"><span class="pi">${svg('powers', 26)}</span><span class="pt"><b>${t('contemplate')}</b><small>${t('contemplateDesc')}</small></span></button>
      <button class="pow" data-mode="breathe"><span class="pi">${svg('water', 26)}</span><span class="pt"><b>${t('breathe')}</b><small>${t('breatheDesc')}</small></span></button>
      <button class="pow ${this.s.settings.night ? 'sel' : ''}" data-toggle="night"><span class="pi">${'<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg>'}</span><span class="pt"><b>${t('night')}</b><small>${this.s.settings.night ? t('on') : t('off')}</small></span></button>
    </div>`;
  }

  tab_settings() {
    const st = this.s.settings; const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    const range = (k, label) => `<label class="row"><span>${label}</span><input type="range" min="0" max="100" value="${Math.round(st[k] * 100)}" data-range="${k}"></label>`;
    const tog = (k, label) => `<button class="row tog" data-toggle="${k}" aria-pressed="${!!st[k]}"><span>${label}</span><i></i></button>`;
    return `<div class="settings">
      ${range('sound', t('sound'))}${range('music', t('music'))}${range('intensity', t('intensity'))}
      ${tog('haptics', t('haptics'))}${tog('reduced', t('reduced'))}${tog('night', t('night'))}
      <div class="row col"><span>${t('palette')}</span><div class="pals">${Object.entries(PALETTES).map(([id, p]) => `<button data-pal="${id}" aria-pressed="${st.palette === id}" style="--g:linear-gradient(90deg,${p.stops.map((h) => `hsl(${h},${p.sat}%,70%)`).join(',')})"><i></i>${L(p.name)}</button>`).join('')}</div></div>
      <div class="row"><span>${t('lang')}</span><div class="seg"><button data-lang="fr" aria-pressed="${lang === 'fr'}">FR</button><button data-lang="en" aria-pressed="${lang === 'en'}">EN</button></div></div>
      <p class="note">${t('silentHint')}</p>
      ${iOS && !standalone ? `<p class="note">${t('install')}</p>` : ''}
      <button class="reset" data-reset>${t('reset')}</button>
    </div>`;
  }

  onBody(e) {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.buy) { if (this.act.buy(b.dataset.buy)) this.render(); return; }
    if (b.dataset.power) { this.act.setPower(b.dataset.power); this.closeSheet(); return; }
    if (b.dataset.mode) { this.act.startMode(b.dataset.mode); return; }
    if (b.dataset.toggle) { this.act.setSetting(b.dataset.toggle, !this.s.settings[b.dataset.toggle]); return; }
    if (b.dataset.pal) { this.act.setSetting('palette', b.dataset.pal); return; }
    if (b.dataset.lang) { this.act.setSetting('lang', b.dataset.lang); this.relabel(); return; }
    if (b.dataset.reset !== undefined) { if (confirm(t('resetConfirm'))) this.act.reset(); }
  }
  relabel() { this.$('unit').textContent = t('light'); this.render(); }
}

