import {splitForceLabels} from '@/lib/force-notation.cjs'

export function ForceNotation({text}:{text:string}) {
  return splitForceLabels(text).map((part:string,index:number) =>
    index % 2 === 0 ? part : <span key={index}>F<sub>{part}</sub></span>)
}
