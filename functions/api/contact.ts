/**
 * Cloudflare Pages Function — POST /api/contact
 *
 * 1. Vérifie le jeton Cloudflare Turnstile (anti-spam) côté serveur.
 * 2. Valide et nettoie les champs.
 * 3. Envoie l'e-mail via l'API Resend (https://resend.com).
 *
 * Variables à définir dans Cloudflare Pages → Settings → Variables and Secrets :
 *   TURNSTILE_SECRET_KEY  (secret)  clé secrète Turnstile
 *   RESEND_API_KEY        (secret)  clé API Resend
 *   CONTACT_TO                      adresse qui reçoit les messages (la tienne)
 *   CONTACT_FROM                    expéditeur vérifié chez Resend, ex. "Portfolio <contact@augustefoucard.fr>"
 */

interface Env {
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const TYPES = new Set(['studio', 'recruiter', 'client', 'other']);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM || !env.TURNSTILE_SECRET_KEY) {
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  // Même origine uniquement
  const origin = request.headers.get('Origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return json({ ok: false, error: 'forbidden' }, 403);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid' }, 400);
  }

  const str = (k: string, max: number) => (typeof body[k] === 'string' ? (body[k] as string).trim().slice(0, max) : '');
  const name = str('name', 120);
  const email = str('email', 200);
  const message = str('message', 5000);
  const type = TYPES.has(str('type', 20)) ? str('type', 20) : 'other';
  const token = str('token', 4096);

  // Champ piège rempli → robot. On répond « ok » sans rien envoyer.
  if (str('website', 200)) return json({ ok: true });

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) {
    return json({ ok: false, error: 'invalid' }, 400);
  }

  const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token, remoteip: request.headers.get('CF-Connecting-IP') ?? '' }),
  }).then((r) => r.json<{ success: boolean }>()).catch(() => ({ success: false }));
  if (!verify.success) return json({ ok: false, error: 'captcha' }, 403);

  const html = `
    <h2>Nouveau message depuis augustefoucard.fr</h2>
    <p><strong>Nom :</strong> ${esc(name)}<br/>
    <strong>E-mail :</strong> ${esc(email)}<br/>
    <strong>Profil :</strong> ${esc(type)}</p>
    <p style="white-space:pre-wrap">${esc(message)}</p>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: [env.CONTACT_TO],
      reply_to: email,
      subject: `[Portfolio] ${name} — ${type}`,
      html,
      text: `${name} <${email}> (${type})\n\n${message}`,
    }),
  });

  if (!res.ok) return json({ ok: false, error: 'send_failed' }, 502);
  return json({ ok: true });
};

export const onRequest: PagesFunction<Env> = () => json({ ok: false, error: 'method_not_allowed' }, 405);
