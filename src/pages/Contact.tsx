import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { site } from '../content';
import { useLang } from '../i18n/lang';
import { useMeta } from '../lib/hooks';
import { Button, EASE, PageHead, Reveal } from '../components/Motion';
import { ArrowUpRight } from '../components/Icons';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
      remove: (id: string) => void;
    };
  }
}

type Status = { kind: 'ok' | 'err'; msg: string } | null;

export default function Contact() {
  const { t, lang } = useLang();
  useMeta(t('nav.contact'), t('contact.intro'));
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [invalid, setInvalid] = useState<Record<string, boolean>>({});
  const token = useRef<string>('');
  const widget = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  // Cloudflare Turnstile (anti-spam respectueux de la vie privée), chargé uniquement si configuré.
  useEffect(() => {
    if (!SITE_KEY || !widget.current) return;
    const render = () => {
      if (!window.turnstile || !widget.current || widgetId.current) return;
      widgetId.current = window.turnstile.render(widget.current, {
        sitekey: SITE_KEY, theme: 'dark', language: lang,
        callback: (tk: string) => { token.current = tk; },
        'expired-callback': () => { token.current = ''; },
      });
    };
    if (window.turnstile) render();
    else {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true; s.defer = true; s.onload = render;
      document.head.appendChild(s);
    }
    return () => { if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current); widgetId.current = null; };
  }, [lang]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries()) as Record<string, string>;
    const bad = {
      name: !data.name?.trim(),
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email ?? ''),
      message: (data.message?.trim().length ?? 0) < 10,
    };
    setInvalid(bad);
    if (bad.name || bad.email || bad.message) { setStatus({ kind: 'err', msg: t('contact.invalid') }); return; }
    setSending(true); setStatus(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, token: token.current, lang }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.ok) {
        setStatus({ kind: 'ok', msg: t('contact.sent') });
        (e.target as HTMLFormElement).reset();
      } else if (!json || res.status === 404 || json?.error === 'not_configured') {
        setStatus({ kind: 'err', msg: t('contact.notConfigured') });
      } else {
        setStatus({ kind: 'err', msg: json?.error === 'invalid' ? t('contact.invalid') : t('contact.error') });
      }
    } catch {
      setStatus({ kind: 'err', msg: t('contact.error') });
    } finally {
      setSending(false);
      token.current = '';
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
    }
  };

  return (
    <>
      <PageHead eyebrow={t('contact.eyebrow')} title={t('contact.title')} lede={t('contact.intro')} />
      <section className="wrap" style={{ paddingBottom: 'var(--section)' }}>
        <div className="contact-grid">
          <Reveal>
            <form className="form" onSubmit={submit} noValidate>
              <div className="grid-2" style={{ gap: '1.75rem' }}>
                <div className="field" data-invalid={invalid.name}>
                  <label htmlFor="c-name">{t('contact.name')}</label>
                  <input id="c-name" name="name" autoComplete="name" required maxLength={120} aria-invalid={invalid.name || undefined} />
                </div>
                <div className="field" data-invalid={invalid.email}>
                  <label htmlFor="c-email">{t('contact.email')}</label>
                  <input id="c-email" name="email" type="email" inputMode="email" autoComplete="email" required maxLength={200} aria-invalid={invalid.email || undefined} />
                </div>
              </div>
              <div className="field">
                <fieldset>
                  <legend>{t('contact.type')}</legend>
                  <div className="radio-chips">
                    {(['studio', 'recruiter', 'client', 'other'] as const).map((k, i) => (
                      <span key={k}>
                        <input type="radio" id={`c-type-${k}`} name="type" value={k} defaultChecked={i === 0} />
                        <label htmlFor={`c-type-${k}`}>{t(`contact.type.${k}`)}</label>
                      </span>
                    ))}
                  </div>
                </fieldset>
              </div>
              <div className="field" data-invalid={invalid.message}>
                <label htmlFor="c-msg">{t('contact.message')}</label>
                <textarea id="c-msg" name="message" required minLength={10} maxLength={5000} aria-invalid={invalid.message || undefined} />
              </div>
              {/* Champ piège anti-robots, invisible pour les humains */}
              <div className="hp" aria-hidden="true">
                <label htmlFor="c-web">Website</label>
                <input id="c-web" name="website" tabIndex={-1} autoComplete="off" />
              </div>
              {SITE_KEY && <div ref={widget} />}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="dim" style={{ fontSize: '0.8125rem' }}>{t('contact.privacy')}</span>
                <Button type="submit" disabled={sending}>{sending ? t('contact.sending') : t('contact.send')}</Button>
              </div>
              <AnimatePresence>
                {status && (
                  <motion.p key={status.msg} className="form-status" data-kind={status.kind} role="status" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: EASE }}>
                    {status.msg}
                  </motion.p>
                )}
              </AnimatePresence>
            </form>
          </Reveal>

          <Reveal delay={0.1}>
            <span className="eyebrow">{t('contact.elsewhere')}</span>
            <ul className="socials" style={{ marginTop: '1.5rem' }}>
              {site.email && <li><a href={`mailto:${site.email}`}>{site.email}<ArrowUpRight size={18} /></a></li>}
              {site.socials.map((s) => (
                <li key={s.id}>
                  {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer me">{s.label}<ArrowUpRight size={18} /></a>
                    : <span>{s.label}<small>{t('contact.soon')}</small></span>}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>
    </>
  );
}
