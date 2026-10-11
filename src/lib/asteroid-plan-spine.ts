import { PHYSICS_VIDEOS } from '@/data/physics-videos'
import { ASTEROID_UNIT_CONTEXT, planVideoSupport } from '@/data/asteroid-video-support'

const escape = (s:string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
export function withVideoSpine<T extends {day:number;bodyHtml:string}>(unit:string,plan:T):T {
 const support=planVideoSupport(unit,plan.day)
 if(!support)return plan
 const videos=support.videos.map(use=>({use,video:PHYSICS_VIDEOS.find(v=>v.sequence===use.sequence)!}))
 const section=`<section data-video-spine="20261001"><h2>Video spine → classroom application</h2><p><strong>Asteroid course question:</strong> ${escape(ASTEROID_UNIT_CONTEXT[unit].question)}</p><p>The video sequence provides direct instruction and reusable help. This plan organizes the classroom experience. Video numbers and class days are separate sequences.</p>
 ${videos.length?`<h3>Video support for this meeting</h3><ul>${videos.map(({use,video})=>`<li><strong>${use.when} · Video ${video.sequence}: ${escape(video.title)}</strong><p>${escape(use.purpose)}</p><p><a href="https://www.antocciphysics.com/admin/dashboard?view=videos&amp;video=${video.youtubeId}">Preview video &amp; open its lesson</a> · <a href="https://www.youtube.com/watch?v=${video.youtubeId}">YouTube</a></p></li>`).join('')}</ul><p>Choose support from students’ prior responses. “Revisit” is optional help, not an instruction to watch every listed video. Open an assigned video lesson through Class access; a plan link does not release it.</p>`:'<p><strong>No new video assignment for this meeting.</strong> Keep the planned classroom work or assessment. Recommend a focused video afterward when feedback identifies a concept gap.</p>'}
 <h3>Fit it into the lesson flow</h3><p>${escape(support.flow??(videos.length?'Check the relevant video response in the opening recap. If the idea is secure, move straight to the planned task. If needed, replay one focused explanation within the existing instruction or workshop time; keep the investigation and individual exit.':'Follow the planned classroom sequence and its assessment conditions. No extra video viewing is needed during this meeting.'))}</p>
 <p><strong>In class:</strong> ${escape(support.classroom)}</p><p><strong>Collect for mastery:</strong> ${escape(support.evidence)} Video viewing can earn XP; it does not replace this evidence or set a mastery rating.</p><p><strong>Still teach and model:</strong> ${escape(support.gap)}</p><p><strong>Access and support:</strong> Offer the preparation in class if a student could not watch beforehand. Use the same video concepts for CPA and Honors; adjust scaffolds, problems, and the Honors extension in the classroom plan.</p></section>`
 // Older alignment notes named retired block IDs and claimed that this plan
 // and a student lesson were the same document. Preserve the authored flow.
 const body=plan.bodyHtml.replace(/<section data-video-spine="[^"]*">[\s\S]*?<\/section>/g,'').replace(/<section data-classroom-alignment="[^"]*">[\s\S]*?<\/section>/g,'')
 return {...plan,bodyHtml:section+body}
}
