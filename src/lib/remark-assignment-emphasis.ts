import { directionRuns, emphasisRuns } from './assignment-emphasis.mjs'

interface Node { type: string; value?: string; children?: Node[]; data?: { hName: string } }
const protectedTypes = new Set(['strong', 'code', 'inlineCode', 'math', 'inlineMath', 'html', 'image', 'link', 'linkReference', 'definition', 'heading'])
const directionProtectedTypes = new Set([...protectedTypes].filter(type => type !== 'strong'))

/** Opt-in on authored question prompts; never alter stored content or student responses. */
export default function remarkAssignmentEmphasis() {
  return (tree: Node) => {
    function visit(node: Node) {
      if (protectedTypes.has(node.type) || !node.children) return
      node.children = node.children.flatMap(child => {
        if (child.type === 'text' && child.value) {
          return emphasisRuns(child.value).map(run => run.bold
            ? { type: 'strong', children: [{ type: 'text', value: run.text }] }
            : { type: 'text', value: run.text })
        }
        visit(child)
        return [child]
      })
    }
    visit(tree)
    function visitDirections(node: Node) {
      if (directionProtectedTypes.has(node.type) || node.data?.hName === 'u' || !node.children) return
      node.children = node.children.flatMap(child => {
        if (child.type === 'text' && child.value) {
          return directionRuns(child.value).map(run => run.direction
            ? { type: 'emphasis', children: [{ type: 'underline', data: { hName: 'u' }, children: [{ type: 'text', value: run.text }] }] }
            : { type: 'text', value: run.text })
        }
        visitDirections(child)
        return [child]
      })
    }
    visitDirections(tree)
  }
}
