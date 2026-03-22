import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { hello } from './routes/hello.js'

const app = new Hono()

app.use('*', logger())

app.get('/', (c) => {
  return c.json({
    name: 'tachyon-api-server-template',
    version: '0.1.0',
    status: 'ok',
  })
})

app.route('/hello', hello)

export default app
