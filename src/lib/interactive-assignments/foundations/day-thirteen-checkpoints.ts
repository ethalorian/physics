import type {Checkpoint} from './checkpoints'
import c from '@/data/foundations/day-thirteen-copy.json'
function stop(id:Checkpoint['id'],title:string,a:string,b:string,example:string):Checkpoint {
  return {id,title,roles:[c.roleA,c.roleB],prompts:[a,b],discuss:c.discuss,reply:c.reply,reflection:c.reflect,
    demand:{blooms:'Analyze',dok:2,evidence:'Checks the direction, units and sum of forces on one object.'},
    solo:{idea:a,example,critique:c.crit,reflection:c.reflect}}
}
export const DAY_THIRTEEN_CHECKPOINTS = [
  stop('evidence',c.c1,c.g7,c.g8,c.ex1),
  stop('model',c.c2,c.g17,c.g19,c.ex2),
  stop('questions',c.c3,c.g20,c.g22,c.ex3),
]
export const DAY_THIRTEEN_PREVIEW_WRITING = {
  evidence:{contribution:c.a1,reply:c.g9},
  model:{contribution:c.a2,reply:c.a3},
  questions:{contribution:c.a4,reply:c.g20},
}
