import chapters from '@/data/etf-original/chapters.json'
import figures from '@/data/etf-original/figure-studies.json'
import meetings from '@/data/etf-original/meetings.json'
import { etfPages, etfPdf, etfSectionId } from '@/data/etf-original/source'
import { validateChapterDefinition, type InteractiveChapterDefinition } from './reader-contract'

export const etfChapters = chapters.map(c => {
  const number = etfSectionId(c.number), id = 'case-'+c.number
  const meeting = meetings.find(m => m.chapters.includes(c.number))!
  const figure=figures.find(s=>s.chapter===c.number)!
  const correct = c.number % 2
  const definition: InteractiveChapterDefinition = {
    book:'etf', bookTitle:'Engineering the Future', chapter:c.number, title:c.title, language:'en',
    contentVersion:'etf-case-1', pdfUrl:etfPdf(c), focus:c.read, guidingQuestion:c.heading,
    scopeNote:'Read the engineer’s account inside the reader. Compare the original illustrations, explore the figure study, and bring a page detail to your Engineer’s Notebook.',
    sections:[{id,number,title:c.title,heading:c.heading,subtitle:c.read,pages:etfPages(c),page:c.number===2?12:c.from,sourceUrl:etfPdf(c),
      target:'Use evidence from the reading to justify a project decision.',check:{
        title:'Test a design decision',prompt:c.question,options:correct?[c.other,c.correct]:[c.correct,c.other],correct,
        hint:c.read,feedback:correct?['Look again. '+c.reason,c.reason]:[c.reason,'Look again. '+c.reason],teacher:c.reason}}],
    visualCoverage:[{sourceLabel:figure.title,printedPage:figure.page,section:number,treatment:'adapted',anchors:['figure-study-'+c.number],note:'Guided detail of the printed illustration with three labeled observations. The complete page is available in the printed-page view.'}],teaching:{before:'Ask students to predict an answer to the guiding question before opening the chapter.',during:c.read,after:meeting.guide},
    synthesisIntro:'Choose an example from the chapter. Record the printed page and explain what changed because of a design decision.',
    reasoningRoutine:'Name the need, cite evidence and explain your choice.',
    transfer:{prompt:meeting.exit,starter:'On page ___, the engineer ___. In our design I would ___ because ___.',model:c.reason},
    questionSection:()=>id,isSectionAssigned:(a,s)=>Boolean(a?.section_ids.includes(s.number)),
  }
  return validateChapterDefinition(definition)
})
