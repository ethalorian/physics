import type {Checkpoint} from './checkpoints'
import c from '@/data/foundations/day-twelve-copy.json'
function stop(id:Checkpoint['id'],title:string,a:string,b:string,example:string):Checkpoint {
  return {id,title,roles:[c.roleA,c.roleB],prompts:[a,b],discuss:c.discuss,reply:c.reply,reflection:c.reflect,
    demand:{blooms:'Analyze',dok:2,evidence:'Checks system mass, graph slope or evidence for an force trend.'},
    solo:{idea:a,example,critique:c.crit,reflection:c.reflect}}
}
export const DAY_TWELVE_CHECKPOINTS = [
  stop('evidence',c.c1,c.p1a,c.p1b,c.ex1),
  stop('model',c.c2,c.p2a,c.p2b,c.ex2),
  stop('questions',c.c3,c.p3a,c.p3b,c.ex3),
]
export const DAY_TWELVE_PREVIEW_WRITING = {
  evidence:{contribution:c.a2,reply:c.g16},
  model:{contribution:c.a4,reply:c.g19},
  questions:{contribution:c.b3,reply:c.g22},
}
