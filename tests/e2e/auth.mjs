// End-to-end auth and access-control checks against a running app backed by
// the local Supabase stack (`npm run db:start` + seed). Used by CI.
//   BASE_URL     default http://localhost:3000 (must match supabase/config.toml redirect URLs)
//   MAILPIT_URL  default http://127.0.0.1:54324
import { chromium } from 'playwright';
const B = process.env.BASE_URL ?? 'http://localhost:3000';
const MAILPIT = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324';
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

async function latestEmailLink(to, afterId) {
  for (let i = 0; i < 30; i++) {
    const list = await (await fetch(`${MAILPIT}/api/v1/search?query=to:${encodeURIComponent(to)}`)).json();
    const msg = list.messages?.find((m) => m.ID !== afterId);
    if (msg) {
      const full = await (await fetch(`${MAILPIT}/api/v1/message/${msg.ID}`)).json();
      const link = (full.Text.match(/https?:\/\/\S+verify\S+/) || [])[0];
      return { id: msg.ID, link: link && link.replace(/&amp;/g, '&').replace(/\)$/, '') };
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return {};
}

async function signIn(page, identifier, password = 'password123') {
  await page.goto(`${B}/sign-in`);
  await page.fill('#email', identifier);
  await page.fill('#password', password);
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/sign-in'), { timeout: 15000 }).catch(() => {}), page.click('main form:has(input[type=password]) button[type=submit], form:has(#email) button[type=submit]')]);
}

await (async () => {
  // CHROMIUM_PATH lets you reuse an already-installed Chromium instead of `npx playwright install`.
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const errors = [];

  // ---- Customer (username login) -------------------------------------------
  let ctx = await browser.newContext({ viewport: { width: 1280, height: 1400 } });
  let page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await signIn(page, 'customer');
  check('customer signs in with username → /dashboard', new URL(page.url()).pathname === '/dashboard', page.url());
  let r = await page.request.post(`${B}/api/v1/feature-flags`, { data: {} });
  check('customer cannot create feature flags', r.status() === 403, String(r.status()));
  r = await page.request.get(`${B}/api/v1/print-jobs`);
  check('customer cannot read print jobs', r.status() === 403, String(r.status()));
  r = await page.request.post(`${B}/api/v1/users/role`, { data: { user: 'customer', role: 'ADMIN' } });
  check('customer cannot promote self', r.status() === 403, String(r.status()));
  await page.goto(`${B}/admin`);
  check('customer is redirected away from /admin', new URL(page.url()).pathname === '/', page.url());
  await ctx.close();

  // ---- Wrong password ------------------------------------------------------
  ctx = await browser.newContext({ viewport: { width: 1280, height: 1400 } }); page = await ctx.newPage();
  await signIn(page, 'customer', 'wrong-password');
  const genericError = await page.locator('[role=alert]').first().textContent().catch(() => '');
  check('wrong password shows generic error', /Invalid email\/username or password/.test(genericError || ''), genericError);
  await signIn(page, 'nobody-here', 'whatever123');
  const unknownUserError = await page.locator('[role=alert]').first().textContent().catch(() => '');
  check('unknown username shows the same generic error', unknownUserError === genericError);
  await ctx.close();

  // ---- Admin (email login) -------------------------------------------------
  ctx = await browser.newContext({ viewport: { width: 1280, height: 1400 } }); page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await signIn(page, 'admin@mav.local');
  await page.goto(`${B}/admin`);
  check('admin can open /admin', new URL(page.url()).pathname === '/admin', page.url());
  r = await page.request.post(`${B}/api/v1/users/role`, { data: { user: 'staff@mav.local', role: 'EVENT' } });
  check('admin can change roles by email', r.status() === 200, `${r.status()} ${await r.text()}`);
  r = await page.request.post(`${B}/api/v1/users/role`, { data: { user: 'admin', role: 'USER' } });
  check('admin cannot demote themselves', r.status() === 400, String(r.status()));
  r = await page.request.patch(`${B}/api/v1/feature-flags/does-not-exist`, { data: { enabled: true } });
  check('admin passes the access policy on content APIs', ![401, 403].includes(r.status()), String(r.status()));
  // Sign out from the navbar
  await page.goto(`${B}/`);
  await ctx.close();

  // ---- Print agent ---------------------------------------------------------
  ctx = await browser.newContext({ viewport: { width: 1280, height: 1400 } }); page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${B}/print-agent/login`);
  await page.fill('#email', 'printer');
  await page.fill('#password', 'password123');
  await Promise.all([page.waitForURL((u) => u.pathname !== '/print-agent/login', { timeout: 15000 }).catch(() => {}), page.click('main form:has(input[type=password]) button[type=submit], form:has(#email) button[type=submit]')]);
  await page.goto(`${B}/print-agent`);
  check('print agent reaches /print-agent', new URL(page.url()).pathname === '/print-agent', page.url());
  r = await page.request.get(`${B}/api/v1/print-jobs`);
  check('print agent can read print jobs', r.status() === 200, String(r.status()));
  r = await page.request.post(`${B}/api/v1/feature-flags`, { data: {} });
  check('print agent cannot edit content', r.status() === 403, String(r.status()));
  await ctx.close();

  // ---- New sign-up with email confirmation ---------------------------------
  const email = `new${Date.now()}@example.com`;
  ctx = await browser.newContext({ viewport: { width: 1280, height: 1400 } }); page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${B}/sign-up`);
  await page.fill('#username', 'customer');
  await page.fill('#email', email);
  await page.fill('#phoneNumber', '5555550199');
  await page.fill('#password', 'supersecret1');
  await page.fill('#confirmPassword', 'supersecret1');
  await page.click('main form:has(input[type=password]) button[type=submit], form:has(#email) button[type=submit]');
  await page.waitForTimeout(1500);
  const takenText = await page.locator('text=That username is taken').count();
  check('duplicate username is rejected (case-insensitive)', takenText > 0);
  await page.fill('#username', `newbie${Date.now() % 100000}`);
  await page.click('main form:has(input[type=password]) button[type=submit], form:has(#email) button[type=submit]');
  await page.waitForSelector('text=Confirm your email', { timeout: 15000 }).catch(() => {});
  check('sign-up asks for email confirmation', (await page.locator('text=Confirm your email').count()) > 0);
  const { id: confirmId, link } = await latestEmailLink(email);
  check('confirmation email delivered', Boolean(link), link || 'no link');
  if (link) {
    await page.goto(link);
    await page.waitForLoadState('networkidle').catch(() => {});
    check('confirmation link signs the user in → /dashboard', new URL(page.url()).pathname === '/dashboard', page.url());
  }
  await ctx.close();

  // ---- Password reset ------------------------------------------------------
  ctx = await browser.newContext({ viewport: { width: 1280, height: 1400 } }); page = await ctx.newPage();
  await page.goto(`${B}/forgot-password`);
  await page.fill('#email', email);
  await page.click('main form:has(input[type=password]) button[type=submit], form:has(#email) button[type=submit]');
  await page.waitForSelector('text=If an account exists', { timeout: 10000 }).catch(() => {});
  const { link: resetLink } = await latestEmailLink(email, confirmId);
  check('password reset email delivered', Boolean(resetLink), resetLink || 'no link');
  if (resetLink) {
    await page.goto(resetLink);
    await page.waitForLoadState('networkidle').catch(() => {});
    check('reset link lands on /reset-password', new URL(page.url()).pathname === '/reset-password', page.url());
    await page.fill('#new-password', 'brandnewpass2');
    await page.fill('#confirm-new-password', 'brandnewpass2');
    await Promise.all([page.waitForURL((u) => u.pathname === '/dashboard', { timeout: 15000 }).catch(() => {}), page.click('main form:has(input[type=password]) button[type=submit], form:has(#email) button[type=submit]')]);
    check('new password saved → /dashboard', new URL(page.url()).pathname === '/dashboard', page.url());
  }
  await ctx.close();
  ctx = await browser.newContext({ viewport: { width: 1280, height: 1400 } }); page = await ctx.newPage();
  await signIn(page, email, 'brandnewpass2');
  check('can sign in with the new password', new URL(page.url()).pathname === '/dashboard', page.url());
  await ctx.close();

  // ---- Open redirect -------------------------------------------------------
  ctx = await browser.newContext({ viewport: { width: 1280, height: 1400 } }); page = await ctx.newPage();
  await page.goto(`${B}/sign-in?next=//evil.example.com`);
  await page.fill('#email', 'customer');
  await page.fill('#password', 'password123');
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith('/sign-in'), { timeout: 15000 }).catch(() => {}), page.click('main form:has(input[type=password]) button[type=submit], form:has(#email) button[type=submit]')]);
  check('?next=//evil.example.com is ignored', new URL(page.url()).host === 'localhost:3000', page.url());
  await ctx.close();

  check('no uncaught page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  await browser.close();
  const failed = results.filter((x) => !x.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})();
