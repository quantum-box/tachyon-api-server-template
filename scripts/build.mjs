import { build } from 'esbuild'
import { createWriteStream, mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import archiver from 'archiver'

const DIST_DIR = 'dist'
const ZIP_NAME = 'lambda.zip'

// Clean previous build
if (existsSync(DIST_DIR)) {
  rmSync(DIST_DIR, { recursive: true })
}
mkdirSync(DIST_DIR, { recursive: true })

// Bundle with esbuild
await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: `${DIST_DIR}/index.mjs`,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  minify: true,
  sourcemap: false,
  external: ['@aws-sdk/*'],
  banner: {
    js: `import { createRequire } from 'module'; const require = createRequire(import.meta.url);`,
  },
})

console.log('Build completed: dist/index.mjs')

// Create ZIP for Lambda deployment
await new Promise((resolve, reject) => {
  const output = createWriteStream(ZIP_NAME)
  const archive = archiver('zip', { zlib: { level: 9 } })

  output.on('close', () => {
    console.log(`Lambda package created: ${ZIP_NAME} (${archive.pointer()} bytes)`)
    resolve()
  })

  archive.on('error', reject)
  archive.pipe(output)

  // Add all files from dist/
  for (const file of readdirSync(DIST_DIR)) {
    archive.file(join(DIST_DIR, file), { name: file })
  }

  archive.finalize()
})
