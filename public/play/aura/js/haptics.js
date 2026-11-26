// Vibrations légères. Android : Vibration API. iPhone (iOS 18+) : un interrupteur natif caché
// déclenche le retour haptique système lorsqu'on le bascule.
let enabled = true; let last = 0; let label = null;
export function setHaptics(v) { enabled = v; }
function iosSwitch() {
  if (label) return label;
  label = document.createElement('label'); label.setAttribute('aria-hidden', 'true');
  label.style.cssText = 'position:fixed;left:-100px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden';
  const input = document.createElement('input'); input.type = 'checkbox'; input.setAttribute('switch', ''); input.tabIndex = -1;
  label.appendChild(input); document.body.appendChild(label); return label;
}
export function haptic(kind = 'soft') {
  if (!enabled) return; const now = performance.now(); const gap = kind === 'tick' ? 45 : 90; if (now - last < gap) return; last = now;
  if (navigator.vibrate) { navigator.vibrate(kind === 'strong' ? 18 : kind === 'tick' ? 4 : 8); return; }
  try { iosSwitch().click(); } catch { /* pas de retour haptique disponible */ }
}
