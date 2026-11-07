/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS audit. */
/** Conservative import reachability audit. Report candidates; never auto-delete. */
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

if (process.argv.includes('--css')) {
  process.exitCode = require('./audit-styles.cjs').auditCss() ? 1 : 0
  return
}

const config = ts.parseJsonConfigFileContent(
  ts.readConfigFile('tsconfig.json', ts.sys.readFile).config, ts.sys, '.',
)
const javascript = ['.js', '.jsx', '.cjs', '.mjs']
const files = [...new Set([
  ...config.fileNames.filter(file => file.startsWith('src/') || file.startsWith('scripts/')),
  ...ts.sys.readDirectory('scripts', javascript),
  ...ts.sys.readDirectory('src', [...javascript, '.css']),
])]
const edges = new Map()
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8')
  const imports = file.endsWith('.css')
    ? Array.from(content.matchAll(/(?:@import\s+(?:url\(\s*)?|\bfrom\s+)['"]?([^\s'")]+\.css)\b/g), match => match[1])
    : ts.preProcessFile(content, true, true).importedFiles.map(i => i.fileName)
  // Browser harnesses embed imports in template strings; game builds use string
  // entryPoints. These are real consumers even though tsc does not include .cjs.
  if (file.startsWith('scripts/')) {
    for (const match of content.matchAll(/['"]((?:\.\/)?src\/[^'"\s]+|@\/[^'"\s]+)['"]/g)) imports.push(match[1])
  }
  edges.set(path.resolve(file), imports.flatMap(fileName => {
    if (/^(?:\.\/)?src\//.test(fileName)) fileName = './' + path.relative(path.dirname(file), fileName.replace(/^\.\//, ''))
    if (fileName.endsWith('.css')) {
      const css = fileName.startsWith('@/') ? path.resolve('src', fileName.slice(2)) : path.resolve(path.dirname(file), fileName)
      return [css]
    }
    const resolved = ts.resolveModuleName(fileName, file, config.options, ts.sys).resolvedModule
    return resolved ? [path.resolve(resolved.resolvedFileName)] : []
  }))
}
const reachable = new Set()
function visit(file) {
  if (reachable.has(file)) return
  reachable.add(file)
  for (const dependency of edges.get(file) ?? []) visit(dependency)
}
// Next discovers these files by convention. Colocated components and engines
// under src/app still need a caller. Preserve external routes and script entry points.
const appEntry = /\/(?:page|route|layout|loading|error|global-error|not-found|global-not-found|forbidden|unauthorized|template|default|robots|manifest|sitemap|(?:icon|apple-icon|opengraph-image|twitter-image)\d*)\.[jt]sx?$/
const frameworkHooks = new Set(['src/middleware.ts', 'src/instrumentation.ts', 'src/instrumentation-client.ts'])
for (const file of files) {
  // scripts/sim-render/render.mjs discovers definitions by directory at runtime.
  const simulationDefinition = /^src\/app\/simulations\/[^/]+\/def\.ts$/.test(file)
  // Deck builders and the explainer packager also read authored files by name.
  const authoredAsset = file.startsWith('src/data/deck-sources/') || file.startsWith('src/data/explainers/claude-source/')
  const frameworkEntry = file.startsWith('src/app/') && appEntry.test(file)
  if (frameworkEntry || frameworkHooks.has(file) || simulationDefinition || authoredAsset || file.startsWith('scripts/') || /\.(?:test|spec)\./.test(file)) {
    visit(path.resolve(file))
  }
}
// Plain CSS can also be served or copied by content builders without an import.
const candidates = files.filter(file => {
  if (file.endsWith('.d.ts') || (file.endsWith('.css') && !file.endsWith('.module.css'))) return false
  return !reachable.has(path.resolve(file))
})
console.log(`${files.length} source, script and stylesheet files checked; ${candidates.length} unreachable candidates.`)
for (const file of candidates) console.log(file)
console.log('Manually check runtime string references, external consumers and framework conventions before deleting candidates.')
