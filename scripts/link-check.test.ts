import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkSourceUrl, isSourceUnavailable } from './link-check.js'

test('falls back to GET when a source rejects HEAD requests', async () => {
  const methods: string[] = []
  const fakeFetch: typeof fetch = async (_url, init) => {
    const method = init?.method ?? 'GET'
    methods.push(method)
    return new Response('', { status: method === 'HEAD' ? 403 : 200 })
  }

  const result = await checkSourceUrl('https://operator.example/postmortem', fakeFetch)

  assert.deepEqual(methods, ['HEAD', 'GET'])
  assert.deepEqual(result, { status: 200, method: 'GET' })
})

test('does not download a source when HEAD succeeds', async () => {
  const methods: string[] = []
  const fakeFetch: typeof fetch = async (_url, init) => {
    methods.push(init?.method ?? 'GET')
    return new Response(null, { status: 204 })
  }

  const result = await checkSourceUrl('https://operator.example/postmortem', fakeFetch)

  assert.deepEqual(methods, ['HEAD'])
  assert.deepEqual(result, { status: 204, method: 'HEAD' })
})

test('uses GET directly for hosts known to reject HEAD probes', async () => {
  const methods: string[] = []
  const fakeFetch: typeof fetch = async (_url, init) => {
    methods.push(init?.method ?? 'GET')
    return new Response('', { status: 200 })
  }

  const result = await checkSourceUrl('https://openai.com/index/postmortem/', fakeFetch)

  assert.deepEqual(methods, ['GET'])
  assert.deepEqual(result, { status: 200, method: 'GET' })
})

test('distinguishes bot protection from a broken source', () => {
  assert.equal(isSourceUnavailable(401), true)
  assert.equal(isSourceUnavailable(403), false)
  assert.equal(isSourceUnavailable(429), false)
  assert.equal(isSourceUnavailable(404), true)
  assert.equal(isSourceUnavailable(410), true)
  assert.equal(isSourceUnavailable(503), true)
})
