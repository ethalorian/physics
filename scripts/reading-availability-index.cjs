const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const { buildSync } = require('esbuild')

const root = path.resolve(__dirname, '..')
const indexPath = path.join(root, 'src/data/interactive-reading-availability.json')

// Only the build/test process loads the complete, canonical reader catalogue.
// Keep the generated browser data limited to availability, not lesson content.
function availabilityIndex() {
  const { outputFiles } = buildSync({
    absWorkingDir: root,
    entryPoints: ['src/components/readings/interactive/registry.ts'],
    bundle: true, platform: 'node', format: 'cjs', write: false,
  })
  const filename = path.join(root, 'scripts/reader-registry.cjs')
  const registry = new Module(filename)
  registry.filename = filename
  registry.paths = Module._nodeModulePaths(root)
  registry._compile(outputFiles[0].text, filename)
  return registry.exports.INTERACTIVE_CHAPTERS.map(chapter => ({
    book: chapter.book, chapter: chapter.chapter, language: chapter.language,
    sections: chapter.sections.map(section => section.number),
  }))
}

function indexText(index = availabilityIndex()) {
  return '[\n' + index.map(chapter => '  ' + JSON.stringify(chapter)).join(',\n') + '\n]\n'
}

function verifyAvailabilityIndex(file = indexPath) {
  const expected = indexText()
  if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== expected) {
    throw new Error('Reading availability index is stale. Run "node scripts/reading-availability-index.cjs --write", review the generated metadata, then retry.')
  }
  console.log('Reading availability index verified against the canonical reader catalogue.')
}

module.exports = { availabilityIndex, indexText, verifyAvailabilityIndex }

if (require.main === module) {
  try {
    if (process.argv[2] === '--write') {
      fs.writeFileSync(indexPath, indexText())
      console.log('Updated src/data/interactive-reading-availability.json.')
    } else if (process.argv.length === 2 || process.argv[2] === '--check') {
      verifyAvailabilityIndex()
    } else {
      throw new Error('Usage: node scripts/reading-availability-index.cjs [--check|--write]')
    }
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
