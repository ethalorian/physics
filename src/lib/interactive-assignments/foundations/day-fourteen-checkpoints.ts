import type {Checkpoint} from './checkpoints'
import c from '@/data/foundations/day-fourteen-copy.json'
function stop(id:Checkpoint['id'],title:string,a:string,b:string,example:string):Checkpoint {
  return {id,title,roles:[c.roleA,c.roleB],prompts:[a,b],discuss:c.discuss,reply:c.reply,reflection:c.reflect,
    demand:{blooms:'Analyze',dok:2,evidence:'Compares forces on two objects using directions and simultaneous observations.'},
    solo:{idea:a,example,critique:c.crit,reflection:c.reflect}}
}
export const DAY_FOURTEEN_CHECKPOINTS = [
  stop('evidence',c.c1,c.g9,c.g10,c.ex1),
  stop('model',c.c2,c.g18,c.g21,c.ex2),
  stop('questions',c.c3,c.g23,c.g26,c.ex3),
]
export const DAY_FOURTEEN_PREVIEW_WRITING = {
  evidence:{contribution:c.a1,reply:c.g9},
  model:{contribution:c.a3,reply:c.a4},
  questions:{contribution:c.a5,reply:c.g12},
}
