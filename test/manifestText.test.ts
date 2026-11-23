// Run with: npm test  (node --experimental-strip-types --test test/)
// start-cli refuses to pack a manifest whose short description is over 120 characters in any locale; this
// catches it here instead of at the end of a build.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { short, long } from '../startos/manifest/i18n.ts'

const locales = ['en_US', 'es_ES', 'de_DE', 'pl_PL', 'fr_FR']

test('short description: every locale, at most 120 characters', () => {
  for (const l of locales) {
    const s = (short as Record<string, string>)[l]
    assert.ok(s, `short.${l} missing`)
    assert.ok([...s].length <= 120, `short.${l} is ${[...s].length} characters`)
  }
})

test('long description: every locale, and translated (not the English text)', () => {
  const en = (long as Record<string, string>).en_US
  for (const l of locales) {
    const s = (long as Record<string, string>)[l]
    assert.ok(s, `long.${l} missing`)
    if (l !== 'en_US') assert.notEqual(s, en, `long.${l} is untranslated`)
  }
})
