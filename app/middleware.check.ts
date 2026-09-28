// Self-check for middleware.ts: node middleware.check.ts
import assert from 'node:assert';
import mw from './middleware.ts';

const base = 'https://x.test';
const login = (pw: string, nextPath = '/finance') =>
  mw(new Request(`${base}/__login`, { method: 'POST', body: new URLSearchParams({ password: pw, next: nextPath }) }));

delete process.env.DASHBOARD_PASSWORD;
assert.equal((await mw(new Request(`${base}/`))).status, 503, 'fails closed without password');

process.env.DASHBOARD_PASSWORD = 'correct horse';
assert.equal((await mw(new Request(`${base}/assets/index.js`))).status, 401, 'bundle blocked');
assert.equal((await login('wrong')).status, 401, 'wrong password rejected');

const ok = await login('correct horse');
assert.equal(ok.status, 303);
assert.equal(ok.headers.get('location'), '/finance');
const cookie = ok.headers.get('set-cookie')!.split(';')[0];
assert.match(ok.headers.get('set-cookie')!, /HttpOnly; Secure/);

const authed = await mw(new Request(`${base}/assets/index.js`, { headers: { cookie } }));
assert.notEqual(authed.status, 401, 'session grants access');

const forged = cookie.replace(/\.(.)/, (_, c) => '.' + (c === 'A' ? 'B' : 'A'));
assert.equal((await mw(new Request(`${base}/`, { headers: { cookie: forged } }))).status, 401, 'forged sig rejected');
assert.equal((await mw(new Request(`${base}/`, { headers: { cookie: 'ms_session=99999999999999.x' } }))).status, 401);

assert.equal((await login('correct horse', '//evil.com')).headers.get('location'), '/', 'no open redirect');

process.env.DASHBOARD_PASSWORD = 'rotated';
assert.equal((await mw(new Request(`${base}/`, { headers: { cookie } }))).status, 401, 'rotation logs out');
console.log('middleware ok');
