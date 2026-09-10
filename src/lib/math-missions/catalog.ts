export const COMPETENCIES = {
  NS1:'Place value and comparison', NS2:'Fractions, decimals and percentages',
  PR1:'Ratios and proportions', PR2:'Direct, inverse and power relationships',
  QE1:'Scientific notation', QE2:'Unit conversion and dimensions', QE3:'Defensible estimation', QE4:'Measurement and precision',
  SM1:'Rearranging equations', SM2:'Substitution with units', GV1:'Slope and signed area', GV2:'Axes and fitted relationships', GV3:'Vector components and addition',
} as const
export type CompetencyCode = keyof typeof COMPETENCIES
export const MISSIONS = [
  {slug:'numberline-navigator',name:'Numberline Navigator',verb:'Land on the same value.',description:'Pilot a rover across place value, fractions and percentages.',codes:['NS1','NS2'],color:'#87dfbe',icon:'◎'},
  {slug:'ratio-reactor',name:'Ratio Reactor',verb:'Small changes. Big reactions.',description:'Tune a reactor using ratios, scaling and inverse relationships.',codes:['PR1','PR2'],color:'#fac97e',icon:'◈'},
  {slug:'unit-courier',name:'Unit Courier',verb:'Every unit has a destination.',description:'Build conversion routes and carry quantities across powers of ten.',codes:['QE1','QE2'],color:'#93cfff',icon:'⇄'},
  {slug:'precision-observatory',name:'Precision Observatory',verb:'Make a defensible discovery.',description:'Estimate from assumptions and measure with appropriate precision.',codes:['QE3','QE4'],color:'#bfb0ff',icon:'⌖'},
  {slug:'balance-bay',name:'Balance Bay',verb:'Keep both sides in balance.',description:'Repair equations, isolate a variable, and test values with units.',codes:['SM1','SM2'],color:'#8fe4de',icon:'⚖'},
  {slug:'motion-mapper',name:'Motion Mapper',verb:'Give your graph a journey.',description:'Guide a robot using slope, signed area and fitted data.',codes:['GV1','GV2'],color:'#f9adba',icon:'⌁'},
  {slug:'vector-rescue',name:'Vector Rescue',verb:'Find the way through the wind.',description:'Resolve thrust, add wind and navigate a rescue drone.',codes:['GV3'],color:'#c5df89',icon:'↗'},
] as const
export type MissionSlug = typeof MISSIONS[number]['slug']
export type MissionMode = 'practice'|'challenge'|'retention'
export const missionBySlug = (slug:string) => MISSIONS.find(m=>m.slug===slug)
export const missionForCode = (code:string) => MISSIONS.find(m=>(m.codes as readonly string[]).includes(code))
export function missionHref(code:string, source?:string) {const m=missionForCode(code);return m?`/arcade/missions/${m.slug}?skill=${code}${source?`&returnTo=${encodeURIComponent(source)}`:''}`:'/arcade/missions'}
export const SESSION_STEPS = 6
export const PRACTICE_XP = 3
export const CHALLENGE_XP = 3
export const MISSION_VERSION = 1
