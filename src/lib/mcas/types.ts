export const MCAS_ID = /^mcas-physics-(?:200[4-9]|201[0-9]|202[2-6])-\d{2}$/
export interface McasItem {
  id:string; year:number; number:number; type:'multiple_choice'|'open_response'|'multiple_select'|'multipart_selected_response';
  label:string; html:string; searchText:string; description:string; standard:string|null; sourceUrl:string;
  answer:string|null; topics:string[]; unitIds:string[]; hasContext:boolean; imagePaths:string[];
}
export type McasPresentation = Pick<McasItem,'id'|'year'|'number'|'label'|'html'|'sourceUrl'|'hasContext'>
export type McasSummary = Omit<McasItem,'html'|'searchText'|'imagePaths'>
export interface McasTopic {id:string;label:string;unitId:string}
export interface McasCatalog {items:McasSummary[];topics:McasTopic[];total:number;page:number;pages:number}
export function mcasPresentation(q:McasItem):McasPresentation {
  return {id:q.id,year:q.year,number:q.number,label:q.label,html:q.html,sourceUrl:q.sourceUrl,hasContext:q.hasContext}
}
