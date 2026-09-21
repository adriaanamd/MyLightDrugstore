import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('frontend package exposes Start and quality-gate scripts without Figma metadata', async () => {
  const packageJson = JSON.parse(
    await readFile(new URL('../package.json', import.meta.url), 'utf8'),
  )

  assert.equal(packageJson.name, 'mylightdrugstore-frontend')
  assert.equal(packageJson.scripts.dev, 'vite dev')
  assert.equal(packageJson.scripts.build, 'vite build')
  assert.equal(packageJson.scripts.typecheck, 'tsc --noEmit')
  assert.equal(
    packageJson.scripts['test:architecture'],
    'node scripts/check-fsd-boundaries.test.mjs && node scripts/check-fsd-boundaries.mjs --enforce && node scripts/check-source-size.mjs --enforce',
  )
  assert.ok(packageJson.dependencies['@tanstack/react-start'])
  assert.ok(packageJson.dependencies['@tanstack/react-router'])
  assert.ok(packageJson.dependencies['@tanstack/react-query'])
  assert.equal(JSON.stringify(packageJson).toLowerCase().includes('figma'), false)
})
