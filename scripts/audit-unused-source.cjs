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
function scriptFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name)
    return entry.isDirectory() ? scriptFiles(file) : /\.(?:cjs|mjs|js)$/.test(file) ? [file] : []
  })
}
const files = [...new Set([
  ...config.fileNames.filter(file => file.startsWith('src/') || file.startsWith('scripts/')),
  ...scriptFiles('scripts'),
])]
const edges = new Map()
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8')
  const imports = ts.preProcessFile(content, true, true).importedFiles.map(i => i.fileName)
  // Browser harnesses embed imports in template strings; game builds use string
  // entryPoints. These are real consumers even though tsc does not include .cjs.
  if (file.startsWith('scripts/')) {
    for (const match of content.matchAll(/['"]((?:\.\/)?src\/[^'"\s]+|@\/[^'"\s]+)['"]/g)) imports.push(match[1])
  }
  edges.set(path.resolve(file), imports.flatMap(fileName => {
    if (/^(?:\.\/)?src\//.test(fileName)) fileName = './' + path.relative(path.dirname(file), fileName.replace(/^\.\//, ''))
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
// Treat all route files, maintenance scripts, tests and middleware as entry points.
// This deliberately preserves potentially externally invoked routes and scripts.
for (const file of files) {
  if (file.startsWith('src/app/') || file.startsWith('scripts/') || /\.test\./.test(file) || ['src/middleware.ts', 'src/instrumentation.ts', 'src/instrumentation-client.ts'].includes(file)) {
    visit(path.resolve(file))
  }
}
const candidates = files.filter(file => !file.endsWith('.d.ts') && !reachable.has(path.resolve(file)))
console.log(`${files.length} source/script files checked; ${candidates.length} unreachable candidates.`)
for (const file of candidates) console.log(file)
console.log('Manually check runtime string references, external consumers and framework conventions before deleting candidates.')
