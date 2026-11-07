import type {Checkpoint} from './checkpoints'
import c from '@/data/foundations/day-sixteen-copy.json'
function stop(id:Checkpoint['id'],title:string,a:string,b:string,example:string):Checkpoint {
  return {id,title,roles:[c.roleA,c.roleB],prompts:[a,b],discuss:c.discuss,reply:c.reply,reflection:c.reflect,
    demand:{blooms:'Analyze',dok:2,evidence:'Checks axes, directions and component sums before interpreting acceleration.'},
    solo:{idea:a,example,critique:c.crit,reflection:c.reflect}}
}
export const DAY_SIXTEEN_CHECKPOINTS = [
  stop('evidence',c.c1,c.g8,c.g10,c.ex1),
  stop('model',c.c2,c.g15,c.g17,c.ex2),
  stop('questions',c.c3,c.g20,c.g23,c.ex3),
]
export const DAY_SIXTEEN_PREVIEW_WRITING = {
  evidence:{contribution:c.a1,reply:c.g11},
  model:{contribution:c.a2,reply:c.a3},
  questions:{contribution:c.a4,reply:c.g23},
}
