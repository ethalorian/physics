export type EvidenceSetting = {name:string; value:string}
export type EvidenceSnapshot = {settings:EvidenceSetting[]; observations:string[]}
export function compareEvidence(before:EvidenceSnapshot,after:EvidenceSnapshot) {
  const original=new Map(before.settings.map(setting=>[setting.name,setting.value]))
  return after.settings.filter(setting=>original.has(setting.name)&&original.get(setting.name)!==setting.value)
    .map(setting=>({name:setting.name,before:original.get(setting.name)!,after:setting.value}))
}
/** Read the model's own semantic outputs on demand, never recompute its physics. */
export function captureModelEvidence(root:HTMLElement):EvidenceSnapshot {
  const visible=(element:Element)=>!element.closest('[hidden],[aria-hidden="true"],[data-avatar-ignore]')
  const clean=(s:string|null|undefined)=>s?.replace(/\s+/g,' ').trim()??''
  const fields=Array.from(root.querySelectorAll<HTMLInputElement|HTMLSelectElement>('input[type="range"],input[type="number"],input[type="checkbox"],select')).filter(visible)
  const settings=new Map<string,string>()
  for(const input of fields){
    const container=input.labels?.[0]
    const labelText=container?Array.from(container.childNodes).filter(node=>node.nodeType===3||(node instanceof Element&&node.tagName==='SPAN')).map(node=>node.textContent).join(' '):''
    const label=clean(input.getAttribute('aria-label')||labelText).replace(/ slider$/,'')
    if(!label)continue
    const value=input.getAttribute('aria-valuetext')??(input instanceof HTMLSelectElement?input.selectedOptions[0]?.textContent??input.value:input.type==='checkbox'?(input.checked?'On':'Off'):input.value)
    settings.set(label,clean(value))
  }
  for(const button of Array.from(root.querySelectorAll('button[aria-pressed="true"]')).filter(visible)){
    const group=button.closest('[role="group"]')
    const label=clean(group?.getAttribute('aria-label')??null)
    if(label)settings.set(label,clean(button.textContent))
  }
  const observations=Array.from(new Set(Array.from(root.querySelectorAll('[data-avatar-evidence],svg[role="img"][aria-label]'))
    .filter(visible).flatMap(element=>element.hasAttribute('data-avatar-evidence')
      ? element.tagName==='DL'
        ? Array.from(element.querySelectorAll('dt')).map(term=>clean(term.textContent)+': '+clean(term.nextElementSibling?.textContent))
        : [clean(element.textContent)]
      : [clean(element.getAttribute('aria-label'))]).filter(Boolean)))
  return {settings:Array.from(settings,([name,value])=>({name,value})),observations}
}
