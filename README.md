# Tachyon API Server Template

Node.js and Rust API server examples for [Tachyon Cloud Apps](https://txcloud.app). Both deploy to AWS Lambda and expose HTTP endpoints.

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

## Rust Lambda example

`apps/rust-api` is a native Rust HTTP Lambda using `lambda_http` and Cargo Lambda.
Its handler returns JSON from `/` and `/hello?name=Alice`; the package contains
an executable `bootstrap` at the ZIP root and targets x86_64 Lambda.

```bash
cd apps/rust-api
cargo test --locked
cargo lambda build --release --bin rust-api
```

The pinned Cargo Lambda image used by GitHub Actions builds the binary and
uploads `target/lambda/rust-api` as the Tachyon artifact. Tachyon handles the
Lambda deployment after the build completes.

### Node.js Lambda Configuration

| Setting | Value |
|---------|-------|
| Runtime | Node.js 22.x |
| Architecture | x86_64 |
| Handler | `index.handler` |
| Memory | 256 MB (recommended) |
| Timeout | 30 seconds |

The GitHub Actions backend currently targets `x86_64` for both samples. The
Rust app uses the `provided.al2023` runtime and `bootstrap` handler declared in
`tachyon.yml`.

## Deploy with Tachyon Cloud Apps

1. This sample is connected as `quantum-box/tachyon-api-server-template`. For
   a fork, update each `repository` block in `tachyon.yml` and connect that fork
   to Tachyon.
2. The Node declaration is named `gha-api-server-sample` and includes this
   repository's URL, owner, name, and default branch. Apply it with
   `tachyon compute apps apply -f tachyon.yml --app gha-api-server-sample`
   and `--tenant-id "$TACHYON_TENANT_ID"`. The Rust declaration is a separate
   app named `rust-api-server-sample`; apply it after the Tachyon API release
   supports the `cargo_lambda` framework.
3. Register `.github/workflows/tachyon-build.yml` for each Cloud App in Tachyon.
   Create builds through Tachyon with `runner_backend: github_actions`; Tachyon
   dispatches the workflow with an authorized build ID.

For example, from a trusted local shell (keep the token out of GitHub):

```bash
API_URL="${TACHYON_API_URL:-https://api.n1.tachy.one}"
SOURCE_BRANCH="${TACHYON_SOURCE_BRANCH:-main}"
COMMIT_SHA="$(git rev-parse HEAD)"
curl --fail-with-body --silent --show-error \
  -X POST "$API_URL/v1/apps/$TACHYON_APP_ID/builds" \
  -H "Authorization: Bearer ${TACHYON_AUTH_TOKEN:?set outside GitHub}" \
  -H "x-operator-id: ${TACHYON_TENANT_ID:?set outside GitHub}" \
  -H "Content-Type: application/json" \
  --data "$(jq -n --arg branch "$SOURCE_BRANCH" --arg sha "$COMMIT_SHA" \
    '{source_branch:$branch,commit_sha:$sha,runner_backend:"github_actions"}')"
```

The returned build ID is dispatched to the registered workflow.

The GitHub workflow deliberately omits `api-url`; the action defaults to
`https://api.n1.tachy.one`. No API token or AWS credential is stored in GitHub.
`github_actions` is selected on the Tachyon build request, not in `tachyon.yml`.
The build API request uses `source_branch`, the full 40-character `commit_sha`,
and `runner_backend: github_actions`; this action's `api-url` input is omitted
because its default is `https://api.n1.tachy.one`.

## Project Structure

```
src/
├── app.ts          # Hono app with middleware and routes
├── index.ts        # Lambda handler + local dev server
└── routes/
    └── hello.ts    # Example route module
scripts/
└── build.mjs       # esbuild bundler + ZIP creator
apps/rust-api/
├── Cargo.toml      # Rust Lambda package
├── Cargo.lock      # Locked Rust dependencies
└── src/main.rs     # Lambda handler and unit tests
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

## Tachyon GitHub Actions build

`.github/workflows/tachyon-build.yml` runs builds requested by Tachyon. It pins
[`quantum-box/tachyon-ops-action/cloud-app-build`](https://github.com/quantum-box/tachyon-ops-action/tree/main/cloud-app-build)
to a reviewed commit and uses GitHub OIDC, so no Tachyon API key or AWS credential
is stored in this repository. The only dispatch input is the Tachyon build ID.
Tachyon selects the exact source commit, receives `lambda.zip`, and deploys Lambda.

The Node app uses `npm ci` and `npm run build`. The Rust app uses
`cargo fetch --locked` and `cargo lambda build --release --bin rust-api`.
Both commands and output paths are declared in `tachyon.yml`. The workflow has
only a `build_id` dispatch input; directly dispatching an arbitrary ID or
rerunning a GitHub run cannot authenticate as an authorized Tachyon build.

The Sample CI workflow validates both Lambda packages and their handlers on
pull requests. The Rust job uses the same digest-pinned Cargo Lambda image as
the Tachyon Action.
