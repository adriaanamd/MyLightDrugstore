import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createMemoryHistory } from '@tanstack/react-router'
import { createAppRouter } from '@/router'

test('router exposes public login and authenticated dashboard paths', async () => {
  const router = createAppRouter({
    history: createMemoryHistory({ initialEntries: ['/login'] }),
  })

  await router.load()

  assert.equal(router.state.location.pathname, '/login')
  assert.ok(router.routesByPath['/dashboard'])
})
