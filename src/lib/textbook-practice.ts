import practice from '@/data/textbook-practice.json'

/** Reviewed classroom adaptations. Original textbook pages remain available. */
export function textbookPracticePrompt(chapter:number,reference:string):string {
  return (practice as Record<string,Record<string,string>>)[String(chapter)]?.[reference] ?? ''
}
