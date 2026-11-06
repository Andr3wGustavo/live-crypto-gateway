import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectLocale, formatDecimal, localePath, stripLocale } from '../src/i18n/locale.ts';
import { dictionaries } from '../src/i18n/messages.ts';
import { docs } from '../src/i18n/docs.ts';

test('explicit preference wins over browser and country; unsupported cookies are ignored', () => {
  assert.equal(detectLocale('es', 'pt-BR,en;q=0.5', 'BR'), 'es');
  assert.equal(detectLocale('../../api', 'pt-PT', 'US'), 'pt-BR');
});
test('browser quality weights and language regions are honored', () => {
  assert.equal(detectLocale(undefined, 'fr-FR,es-MX;q=0.8,en;q=0.6', 'BR'), 'es');
  assert.equal(detectLocale(undefined, 'es;q=0,en-US;q=0.9', 'ES'), 'en');
  assert.equal(detectLocale(undefined, 'pt;q=NaN,es;q=2,en;q=0.5'), 'en');
});
test('country is a fallback, not an override, and unknown languages fall back to English', () => {
  assert.equal(detectLocale(undefined, 'en-GB', 'BR'), 'en');
  assert.equal(detectLocale(undefined, '', 'BR'), 'pt-BR');
  assert.equal(detectLocale(undefined, '', 'MX'), 'es');
  assert.equal(detectLocale(undefined, 'ja-JP', 'JP'), 'en');
});
test('locale changes preserve checkout and private overlay identifiers', () => {
  assert.equal(localePath('es', '/en/pay/42'), '/es/pay/42');
  assert.equal(localePath('pt-BR', '/overlay/abc-def'), '/pt-BR/overlay/abc-def');
  assert.equal(localePath('en', '/'), '/en');
  assert.equal(stripLocale('/pt-BR/dashboard'), '/dashboard');
  assert.equal(stripLocale('/en'), '/');
});
test('crypto precision is retained during localized display, including negative fractions', () => {
  assert.equal(formatDecimal('12345678901234567890.000000000000000001', 'pt-BR'), '12.345.678.901.234.567.890,000000000000000001');
  assert.equal(formatDecimal('0.000000001', 'es'), '0,000000001');
  assert.equal(formatDecimal('-0.01', 'en'), '-0.01');
});

function leaves(value, prefix = '') {
  return Object.entries(value).flatMap(([key, child]) => typeof child === 'string' ? [[`${prefix}${key}`, child]] : leaves(child, `${prefix}${key}.`));
}
test('every supported language covers the same UI keys, arrays and interpolation tokens', () => {
  const baseline = Object.fromEntries(leaves(dictionaries.en));
  for (const [locale, dictionary] of Object.entries(dictionaries)) {
    const translated = Object.fromEntries(leaves(dictionary));
    assert.deepEqual(Object.keys(translated).sort(), Object.keys(baseline).sort(), locale);
    for (const [key, value] of Object.entries(translated)) {
      assert.ok(value.trim(), `${locale}:${key} must not be empty`);
      assert.deepEqual((value.match(/\{\w+\}/g) || []).sort(), (baseline[key].match(/\{\w+\}/g) || []).sort(), `${locale}:${key}`);
    }
  }
});

test('documentation keeps the same section and block structure in every language', () => {
  const baseline = docs.en;
  for (const [locale, content] of Object.entries(docs)) {
    assert.deepEqual(content.sections.map(section => section.id), baseline.sections.map(section => section.id), locale);
    assert.deepEqual(content.sections.map(section => section.blocks.map(block => block.kind)), baseline.sections.map(section => section.blocks.map(block => block.kind)), locale);
    assert.deepEqual(content.groups.map(group => group.sections), baseline.groups.map(group => group.sections), locale);
    for (const section of content.sections) {
      assert.ok(section.nav.trim() && section.title.trim(), `${locale}:${section.id} needs navigation and title text`);
      for (const block of section.blocks) {
        if (block.kind === 'body') assert.ok(block.text.trim(), `${locale}:${section.id} body`);
        if (block.kind === 'list') assert.ok(block.items.length > 0, `${locale}:${section.id} list`);
        if (block.kind === 'steps') assert.ok(block.items.length > 0, `${locale}:${section.id} steps`);
        if (block.kind === 'table') assert.ok(block.rows.every(row => row.length === block.head.length), `${locale}:${section.id} table width`);
        if (block.kind === 'code') assert.ok(block.lines.length > 0, `${locale}:${section.id} code`);
        if (block.kind === 'note') assert.ok(block.title.trim() && block.text.trim(), `${locale}:${section.id} note`);
        if (block.kind === 'media') assert.ok(block.title.trim() && block.text.trim(), `${locale}:${section.id} media`);
      }
    }
    const ids = new Set(content.sections.map(section => section.id));
    for (const group of content.groups) for (const id of group.sections) assert.ok(ids.has(id), `${locale}: missing section ${id}`);
  }
});
