/** Design-system guardrails. Run in prebuild and independently with npm run audit:styles. */
const fs = require('node:fs')
const path = require('node:path')
const postcss = require('postcss')

const root = path.resolve(__dirname, '..')
function sourceFiles(dir = path.join(root, 'src')) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name)
    return entry.isDirectory() ? sourceFiles(file) : [file]
  })
}

// These selectors are emitted by KaTeX/markdown HTML and may originate in saved
// lesson content rather than a literal className in a React component.
const generatedClasses = new Set([
  'katex', 'katex-display', 'frac-line', 'sqrt', 'root',
  'admonition', 'admonition-info', 'admonition-note', 'admonition-tip',
  'admonition-caution', 'admonition-warning', 'toc',
])

function auditCss(files = sourceFiles()) {
  const content = files.filter(file => /\.(tsx?|css|md|mdx|html|json)$/.test(file) && !file.endsWith('/app/globals.css'))
    .map(file => fs.readFileSync(file, 'utf8')).join('\n')
  const css = postcss.parse(fs.readFileSync(path.join(root, 'src/app/globals.css'), 'utf8'))
  const classes = new Set()
  css.walkRules(rule => {
    for (const match of rule.selector.matchAll(/\.([a-zA-Z_][\w-]*)/g)) classes.add(match[1])
  })
  const unused = [...classes].filter(name => !generatedClasses.has(name) && !new RegExp(`(?<![\\w-])${name}(?![\\w-])`).test(content))
  for (const name of unused) console.error(`src/app/globals.css: unused class .${name}`)
  console.log(`CSS usage: ${classes.size} global classes checked; ${unused.length} unreferenced.`)
  return unused.length
}

function auditStyles() {
  const files = sourceFiles()
  const palette = /\b(?:bg|text|border|ring|from|via|to)-(?:red|green|blue|yellow|amber|emerald|purple|indigo|gray|slate|zinc|orange|pink|teal|cyan|sky|fuchsia|rose|lime|stone|neutral)-\d{2,3}\b/g
  let failures = 0
  const check = (file, text, pattern, message) => {
    for (const match of text.matchAll(pattern)) {
      const line = text.slice(0, match.index).split('\n').length
      console.error(`${path.relative(root, file)}:${line}: ${message}: ${match[0]}`)
      failures++
    }
  }
  for (const file of files.filter(file => file.endsWith('.tsx'))) {
    const text = fs.readFileSync(file, 'utf8'), relative = path.relative(root, file)
    if (!/^src\/(components\/avatar|app\/arcade)\//.test(relative)) check(file, text, palette, 'Use a semantic color token')
    check(file, text, /borderRadius:\s*\d+/g, 'Use a radius token')
    if (!/\/(?:present|teach-[^/]+)\//.test(relative)) {
      check(file, text, /fontSize:\s*(?:9|10(?:\.5)?|12\.5)\b/g, 'Use the type scale (minimum 11px)')
      check(file, text, /text-\[(?:[0-9]|10(?:\.5)?|12\.5)px\]/g, 'Use the type scale')
    }
    check(file, text, /0\.5px solid/g, 'Student borders must be at least 1px')
    check(file, text, /rgba\(0,\s*0,\s*0\s*,/g, 'Tint shadows with the primary token')
    check(file, text, /(?:apple-|hover-gold-|gold-(?:accent|glow|shine|gradient)|glass-card)[\w-]*/g, 'Use the shared primitives')
    if (!relative.endsWith('/ui/spinner.tsx')) check(file, text, /\banimate-spin\b|\bLoader2\b/g, 'Use Spinner')
    check(file, text, /@keyframes\s+(?:arcade\w+|lc(?:Shake|Float|Pop)|avatarNudge|er[A-Z]\w*)/g, 'Define shared game motion in styles/arcade.css')
  }
  failures += auditCss(files)
  console.log(`Style audit: ${failures ? `${failures} violations` : 'passed'}.`)
  return failures
}

module.exports = { auditCss, auditStyles }
if (require.main === module) process.exitCode = auditStyles() ? 1 : 0
