import type {Element, Root, Text} from 'hast'
import {splitForceLabels} from './force-notation.cjs'

export default function rehypeForceNotation() {
  function visit(node: Root | Element) {
    if (node.type === 'element' && ['pre','code','math','svg','sub','script','style'].includes(node.tagName)) return
    for (let i = node.children.length - 1; i >= 0; i--) {
      const child = node.children[i]
      if (child.type === 'element') visit(child)
      if (child.type !== 'text') continue
      const parts = splitForceLabels(child.value)
      if (parts.length === 1) continue
      const children: (Text | Element)[] = []
      parts.forEach((part: string, index: number) => {
        if (index % 2 === 0) children.push({type:'text', value:part})
        else children.push({type:'text',value:'F'}, {type:'element',tagName:'sub',properties:{},children:[{type:'text',value:part}]})
      })
      node.children.splice(i, 1, ...children)
    }
  }
  return visit
}
