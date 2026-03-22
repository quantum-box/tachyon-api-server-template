import { handle } from 'hono/aws-lambda'
import { serve } from '@hono/node-server'
import app from './app.js'

// AWS Lambda handler (used when deployed to Lambda)
export const handler = handle(app)

// Local development server
if (process.env.NODE_ENV !== 'production') {
  const port = Number(process.env.PORT) || 3000
  console.log(`Server running at http://localhost:${port}`)
  serve({ fetch: app.fetch, port })
}
