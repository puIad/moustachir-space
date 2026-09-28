/**
 * Vercel Routing Middleware — password gate for the whole deployment.
 *
 * Runs on Vercel's edge before any file is served, so index.html, the JS bundle
 * (which embeds seed.json) and every asset stay private until the visitor signs in.
 * A client-side React login would not do this: the data ships inside the bundle.
 *
 * Config: set DASHBOARD_PASSWORD in the Vercel project env. Unset → site stays locked.
 * Changing the password signs everyone out (the session is keyed off it).
 */
import { next } from '@vercel/functions';

const COOKIE = 'ms_session';
const SESSION_DAYS = 7;
const enc = new TextEncoder();

async function hmac(key: string, msg: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(msg));
  return btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Constant-time: compare HMACs of both sides instead of the raw strings.
async function safeEqual(a: string, b: string, key: string): Promise<boolean> {
  const [x, y] = await Promise.all([hmac(key, a), hmac(key, b)]);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.min(x.length, y.length); i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

async function validSession(cookieHeader: string | null, secret: string): Promise<boolean> {
  const raw = cookieHeader?.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!raw) return false;
  const [exp, sig] = raw.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, await hmac(secret, `session:${exp}`), secret);
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function loginPage(status: number, error = '', nextPath = '/'): Response {
  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Moustachir · Connexion</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root { --blue:#0074ff; --blue-600:#2667e8; --navy:#0d0d1b; --navy-700:#15233f; --ink:#15171f; --ink-500:#6b7180;
          --line:#e2e5ee; --surface:#fff; --danger:#d93a3a; --danger-bg:#fdecec; --orange:#ff9142; }
  * { box-sizing: border-box; margin: 0; }
  body { min-height: 100dvh; display: grid; place-items: center; padding: 24px 16px;
         font-family: Manrope, system-ui, sans-serif; color: var(--ink); background: var(--navy);
         background-image: radial-gradient(60rem 40rem at 85% -10%, rgba(0,116,255,.35), transparent 60%),
                           radial-gradient(40rem 30rem at -10% 110%, rgba(255,145,66,.18), transparent 60%); }
  main { width: 100%; max-width: 400px; }
  .brand { display: flex; justify-content: center; margin-bottom: 28px; }
  .brand img { height: 40px; }
  .card { background: var(--surface); border-radius: 20px; padding: 36px 32px 32px;
          box-shadow: 0 30px 80px -20px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.06); }
  h1 { font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 600; letter-spacing: -.01em; }
  .sub { margin-top: 6px; color: var(--ink-500); font-size: 14px; line-height: 1.5; }
  form { margin-top: 28px; display: grid; gap: 18px; }
  label { display: grid; gap: 8px; font-size: 13px; font-weight: 600; }
  input { width: 100%; font: inherit; font-size: 15px; padding: 13px 14px; border: 1px solid var(--line);
          border-radius: 12px; background: #f7f8fb; transition: border-color .15s, box-shadow .15s, background .15s; }
  input:focus { outline: none; border-color: var(--blue); background: #fff; box-shadow: 0 0 0 4px rgba(0,116,255,.15); }
  button { font: inherit; font-weight: 700; font-size: 15px; color: #fff; background: var(--blue); border: 0;
           border-radius: 12px; padding: 14px; cursor: pointer; transition: background .15s, transform .05s; }
  button:hover { background: var(--blue-600); }
  button:active { transform: translateY(1px); }
  button:focus-visible { outline: 3px solid rgba(0,116,255,.4); outline-offset: 2px; }
  .error { display: flex; gap: 8px; align-items: center; padding: 11px 14px; border-radius: 10px;
           background: var(--danger-bg); color: var(--danger); font-size: 13px; font-weight: 600; }
  .foot { margin-top: 22px; text-align: center; color: rgba(255,255,255,.45); font-size: 12px; }
</style>
</head>
<body>
<main>
  <div class="brand"><img src="/moustachir-logo-white.png" alt="Moustachir"></div>
  <div class="card">
    <h1>Espace sécurisé</h1>
    <p class="sub">Ce tableau de bord contient des données clients confidentielles. Saisissez le mot de passe pour continuer.</p>
    <form method="post" action="/__login">
      ${error ? `<div class="error" role="alert">${esc(error)}</div>` : ''}
      <input type="hidden" name="next" value="${esc(nextPath)}">
      <input type="text" name="username" value="moustachir" autocomplete="username" hidden>
      <label>Mot de passe
        <input type="password" name="password" autocomplete="current-password" required autofocus>
      </label>
      <button type="submit">Se connecter</button>
    </form>
  </div>
  <p class="foot">Accès réservé à l'équipe Moustachir</p>
</main>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' },
  });
}

// Only allow same-site relative redirects after login (no open redirect).
const safeNext = (p: unknown) => (typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') ? p : '/');

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const secret = process.env.DASHBOARD_PASSWORD;

  // The login page's logo is the only asset served without a session.
  if (url.pathname === '/moustachir-logo-white.png') return next();

  if (!secret) return new Response('Site verrouillé : DASHBOARD_PASSWORD non configuré.', { status: 503 });

  if (url.pathname === '/__logout') {
    return new Response(null, {
      status: 303,
      headers: { location: '/', 'set-cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` },
    });
  }

  if (url.pathname === '/__login' && request.method === 'POST') {
    const form = await request.formData();
    const password = String(form.get('password') ?? '');
    const dest = safeNext(form.get('next'));
    if (!(await safeEqual(password, secret, secret))) {
      await new Promise((r) => setTimeout(r, 1000)); // ponytail: per-request delay only; add Vercel Firewall rate limit if it's ever targeted
      return loginPage(401, 'Mot de passe incorrect.', dest);
    }
    const exp = String(Date.now() + SESSION_DAYS * 86_400_000);
    return new Response(null, {
      status: 303,
      headers: {
        location: dest,
        'set-cookie': `${COOKIE}=${exp}.${await hmac(secret, `session:${exp}`)}; Path=/; Max-Age=${SESSION_DAYS * 86_400}; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  }

  if (await validSession(request.headers.get('cookie'), secret)) return next();

  return loginPage(401, '', url.pathname === '/__login' ? '/' : url.pathname + url.search);
}
