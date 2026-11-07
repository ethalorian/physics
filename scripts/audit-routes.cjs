/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS audit. */
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const { normalizeAppPath } = require('next/dist/shared/lib/router/utils/app-paths')
const { getRouteRegex } = require('next/dist/shared/lib/router/utils/route-regex')

const files = ts.sys.readDirectory('src', ['.ts', '.tsx', '.js', '.jsx'])
const routes = files.filter(file => file.startsWith('src/app/') && !file.includes('/_') && /\/(page|route)\.[jt]sx?$/.test(file))
  .map(file => {
    const pathname = normalizeAppPath(file.slice('src/app'.length).replace(/\.[jt]sx?$/, ''))
    return { file, pathname, matcher: getRouteRegex(pathname).re, referenced: false }
  })

// Keep the known path segments in templates and concatenations. A placeholder
// can match a dynamic route, but cannot prove which static page a variable opens.
const unknown = '__dynamic__'
function pathText(node) {
  if (ts.isStringLiteralLike(node)) return node.text
  if (ts.isTemplateExpression(node)) {
    return node.head.text + node.templateSpans.map(span => pathText(span.expression) + span.literal.text).join('')
  }
  if (ts.isParenthesizedExpression(node)) return pathText(node.expression)
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    return pathText(node.left) + pathText(node.right)
  }
  return unknown
}

function isNavigation(node) {
  // href={condition ? '/a' : '/b'} and fetch((url)) have the same targets.
  while (ts.isParenthesizedExpression(node.parent) ||
    (ts.isConditionalExpression(node.parent) && node.parent.condition !== node)) node = node.parent
  let parent = node.parent
  if (ts.isJsxExpression(parent)) parent = parent.parent
  if (ts.isJsxAttribute(parent) || ts.isPropertyAssignment(parent)) return parent.name.getText() === 'href'
  if (!ts.isCallExpression(parent) || parent.arguments[0] !== node) return false
  return ['fetch', 'redirect', 'permanentRedirect', 'router.push', 'router.replace', 'window.open', 'window.location.assign'].includes(parent.expression.getText())
}

const misses = []
for (const file of files) {
  if (/\.(?:test|spec|d)\.[jt]sx?$/.test(file)) continue
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
  function scan(node) {
    if (ts.isTemplateExpression(node) || ts.isStringLiteralLike(node) || (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken)) {
      const url = pathText(node)
      if (url.startsWith('/') && !url.startsWith('//')) {
        const pathname = url.split(/[?#]/, 1)[0]
        // '/api/example' + query may keep the exact base pathname.
        const possibleBase = pathname.endsWith(unknown) ? pathname.slice(0, -unknown.length) : ''
        const matches = routes.filter(route => route.matcher.test(pathname) || (possibleBase && !possibleBase.endsWith('/') && route.matcher.test(possibleBase)))
        const exact = matches.find(route => route.pathname === pathname)
        for (const route of exact ? [exact] : matches) {
          if (route.file !== file) route.referenced = true
        }
        if (!matches.length && !pathname.includes(unknown) && isNavigation(node) && !fs.existsSync(path.join('public', pathname))) {
          const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
          misses.push(`${file}:${line}  ${pathname}`)
        }
        // Don't also count incomplete prefixes as URLs.
        return
      }
    }
    ts.forEachChild(node, scan)
  }
  scan(source)
}

const isPage = route => /\/page\.[jt]sx?$/.test(route.file)
const pageCount = routes.filter(isPage).length
const candidates = routes.filter(route => !route.referenced)
const candidatePages = candidates.filter(isPage).length
console.log(`${pageCount} pages and ${routes.length - pageCount} route handlers.`)
console.log(`\n${candidatePages} pages and ${candidates.length - candidatePages} handlers have no matching URL literal or template in another application source file:`)
for (const route of candidates) console.log(route.pathname)
console.log('\nConcrete navigation or fetch targets without a matching page, handler or public file:')
console.log(misses.join('\n') || '(none)')
console.log('\nReview configuration, generated URLs, scripts, course content and external callers before retiring routes.')
