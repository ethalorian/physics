import type {Checkpoint} from './checkpoints'
import c from '@/data/foundations/day-ten-copy.json'
function stop(id:Checkpoint['id'],title:string,a:string,b:string,example:string):Checkpoint {
  return {id,title,roles:[c.roleA,c.roleB],prompts:[a,b],discuss:c.discuss,reply:c.reply,reflection:c.reflect,
    demand:{blooms:'Analyze',dok:2,evidence:'Checks a force arrow against its source and direction.'},
    solo:{idea:a,example,critique:c.crit,reflection:c.reflect}}
}
export const DAY_TEN_CHECKPOINTS = [
  stop('evidence',c.c1,c.sensorA,c.sensorB,c.ex1),
  stop('model',c.c2,c.p2a,c.p2b,c.ex2),
  stop('questions',c.c3,c.p3a,c.p3b,c.ex3),
]
export const DAY_TEN_PREVIEW_WRITING = {
  evidence:{contribution:c.b4,reply:c.g4},
  model:{contribution:c.b7,reply:c.r8},
  questions:{contribution:c.r10,reply:c.g10},
}
