import { Hono } from 'hono'

export const hello = new Hono()

hello.get('/', (c) => {
  const name = c.req.query('name') || 'World'
  return c.json({ message: `Hello, ${name}!` })
})

hello.get('/:name', (c) => {
  const name = c.req.param('name')
  return c.json({ message: `Hello, ${name}!` })
})

hello.post('/', async (c) => {
  const body = await c.req.json<{ name?: string }>()
  const name = body.name || 'World'
  return c.json({ message: `Hello, ${name}!`, method: 'POST' })
})
