import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dictionaries } from '../src/i18n/messages.ts';

const base = process.env.I18N_TEST_URL;
const options = { skip: !base && 'Run via start-dev.bat --check, or set I18N_TEST_URL for a running app' };
// Wallet routes compile on first visit too; match the launcher's cold-page budget.
const request = (path, init = {}) => fetch(`${base}${path}`, { ...init, signal: AbortSignal.timeout(600000) });

test('language redirects respect preference and keep checkout/overlay paths and query intact', options, async () => {
  const response = await request('/pay/42?ref=example', { redirect: 'manual', headers: { cookie: 'livecrypto_locale=es', 'accept-language': 'pt-BR' } });
  assert.equal(response.status, 307);
  const target = new URL(response.headers.get('location'), base);
  assert.equal(target.pathname, '/es/pay/42');
  assert.equal(target.search, '?ref=example');
  assert.match(response.headers.get('cache-control'), /no-store/);
  const overlay = await request('/overlay/test-token', { redirect: 'manual', headers: { 'accept-language': 'pt-PT,en;q=0.5' } });
  assert.equal(new URL(overlay.headers.get('location'), base).pathname, '/pt-BR/overlay/test-token');
  const fallback = await request('/', { redirect: 'manual', headers: { 'accept-language': 'ja-JP' } });
  assert.equal(new URL(fallback.headers.get('location'), base).pathname, '/en');
});

for (const [locale, m] of Object.entries(dictionaries)) {
  test(`${locale}: landing, login, studio, checkout and OBS render localized HTML`, options, async () => {
    for (const [path, expected] of [
      ['', m.home.hero[0]], ['/login', m.login.title], ['/dashboard', m.dashboard.title], ['/pay/1', m.pay.title], ['/overlay/test-token', m.overlay.supporters]
    ]) {
      const response = await request(`/${locale}${path}`, { headers: { cookie: 'livecrypto_locale=en', 'accept-language': 'en' } });
      assert.equal(response.status, 200, path);
      const html = await response.text();
      assert.match(html, new RegExp(`<html[^>]*lang="${locale}"`));
      assert.ok(html.includes(expected), `${locale}${path}: expected localized visible content`);
      if (!path) {
        for (const language of ['en', 'pt-BR', 'es']) assert.ok(html.includes(`hrefLang="${language}"`) || html.includes(`hreflang="${language}"`));
      } else assert.match(html, /noindex/);
      if (path.startsWith('/overlay')) assert.ok(!html.includes('class="language-switcher"'));
    }
  });
}

test('API/assets bypass locale redirects and sitemap only exposes public marketing URLs', options, async () => {
  const api = await request('/api/health', { redirect: 'manual', headers: { 'accept-language': 'es' } });
  assert.equal(api.status, 200);
  assert.ok((await api.json()).services);
  const asset = await request('/brand/logo-png.png', { redirect: 'manual' });
  assert.equal(asset.status, 200);
  const sitemap = await request('/sitemap.xml', { redirect: 'manual' });
  assert.equal(sitemap.status, 200);
  const xml = await sitemap.text();
  assert.ok(xml.includes('/pt-BR') && xml.includes('/en') && xml.includes('/es'));
  assert.ok(!xml.includes('/overlay/') && !xml.includes('/dashboard'));
});
