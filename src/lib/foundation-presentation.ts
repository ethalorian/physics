import catalog from '@/data/foundation-classroom-scenes.json'

export interface FoundationScene {
  id: string; label: string; notes: string; section: number; question?: number
  next: number; prev: number
}
export function foundationPresentation(day: number, track?: string | null) {
  const edition=track==='cpa'||track==='cpa-sei'||track==='mvp'?'cpa':'honors'
  const scenes=(catalog as Record<string,FoundationScene[]>)[day+'-'+edition]
  if(!scenes)return null
  return {src:`/foundations/unit-1/projector.html?day=${day}&edition=${edition}&classroom=1`,scenes}
}
export function foundationScenesFromSrc(src: string) {
  const url=new URL(src,'https://www.antocciphysics.com')
  return url.pathname==='/foundations/unit-1/projector.html'&&url.searchParams.get('classroom')==='1'
    ? foundationPresentation(Number(url.searchParams.get('day')),url.searchParams.get('edition'))?.scenes ?? null : null
}
