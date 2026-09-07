/** Conservative import reachability audit. Report candidates; never auto-delete. */
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')

const config = ts.parseJsonConfigFileContent(
  ts.readConfigFile('tsconfig.json', ts.sys.readFile).config, ts.sys, '.',
)
const files = config.fileNames.filter(file => file.startsWith('src/') || file.startsWith('scripts/'))
const edges = new Map()
for (const file of files) {
  const imports = ts.preProcessFile(fs.readFileSync(file, 'utf8'), true, true).importedFiles
  edges.set(path.resolve(file), imports.flatMap(({ fileName }) => {
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
  if (file.startsWith('src/app/') || file.startsWith('scripts/') || /\.test\./.test(file) || file === 'src/middleware.ts') {
    visit(path.resolve(file))
  }
}
const candidates = files.filter(file => !file.endsWith('.d.ts') && !reachable.has(path.resolve(file)))
console.log(`${files.length} source/script files checked; ${candidates.length} unreachable candidates.`)
for (const file of candidates) console.log(file)
console.log('Manually check runtime string references, external consumers and framework conventions before deleting candidates.')
