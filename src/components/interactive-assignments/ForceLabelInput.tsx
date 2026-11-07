import {useFoundationLanguage} from './FoundationLanguage'
import {ForceNotation} from './ForceNotation'

const copy = {
  en: {symbol:'Use a subscript', plain:'Use a plain label', subscript:'Subscript'},
  es: {symbol:'Usar subíndice', plain:'Usar etiqueta simple', subscript:'Subíndice'},
  'pt-BR': {symbol:'Usar subscrito', plain:'Usar rótulo simples', subscript:'Subscrito'},
}

export function DiagramForceLabel({label}:{label:string}) {
  return label.startsWith('F_') ? <>F<sub>{label.slice(2)}</sub></> : <ForceNotation text={label}/>
}

export function ForceLabelInput({label, caption, name, onChange, readOnly}:{
  label:string; caption:string; name:string; onChange:(label:string)=>void; readOnly:boolean
}) {
  const words = copy[useFoundationLanguage().locale]
  const symbol = label.startsWith('F_')
  if (readOnly) return <div>{caption} <DiagramForceLabel label={label}/></div>
  return <div>
    <label>{caption}
      {symbol && <span>F<sub>…</sub> · {words.subscript}</span>}
      <input aria-label={symbol ? name+' · '+words.subscript : name}
        maxLength={symbol ? 98 : 100} value={symbol ? label.slice(2) : label}
        onChange={e=>onChange(symbol ? 'F_'+e.target.value : e.target.value)}/>
    </label>
    <button type="button" disabled={!symbol && label.length>98}
      onClick={()=>onChange(symbol ? label.slice(2) : 'F_'+label)}>
      {symbol ? words.plain : words.symbol}
    </button>
  </div>
}
