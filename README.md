# Tachyon API Server Template

Simple API server template for [Tachyon Compute](https://txcloud.app). Deploys to AWS Lambda with Function URL.

Built with [Hono](https://hono.dev/) - a lightweight, fast web framework that runs on Lambda, Cloudflare Workers, Node.js, and more.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check / app info |
| GET | `/hello` | Hello World (query: `?name=Alice`) |
| GET | `/hello/:name` | Hello with path parameter |
| POST | `/hello` | Hello with JSON body (`{ "name": "Alice" }`) |

## Build for Lambda

```bash
# Build and create lambda.zip
npm run build
```

This creates:
- `dist/index.mjs` - Bundled ESM module
- `lambda.zip` - Ready-to-deploy Lambda package

### Lambda Configuration

| Setting | Value |
|---------|-------|
| Runtime | Node.js 22.x |
| Architecture | arm64 |
| Handler | `index.handler` |
| Memory | 256 MB (recommended) |
| Timeout | 30 seconds |

## Deploy with Tachyon Compute

1. Fork this repository
2. Connect it to Tachyon Compute with `deployment_target: lambda`
3. Push to your default branch to trigger a build and deploy

## Project Structure

```
src/
├── app.ts          # Hono app with middleware and routes
├── index.ts        # Lambda handler + local dev server
└── routes/
    └── hello.ts    # Example route module
scripts/
└── build.mjs       # esbuild bundler + ZIP creator
```

## Adding Routes

Create a new file in `src/routes/`:

```ts
import { Hono } from 'hono'

export const users = new Hono()

users.get('/', (c) => {
  return c.json({ users: [] })
})
```

Register it in `src/app.ts`:

```ts
import { users } from './routes/users.js'

app.route('/users', users)
```

## Environment Variables

Environment variables are configured through Tachyon Compute's environment settings. For local development, copy `.env.example` to `.env`.

## License

MIT
