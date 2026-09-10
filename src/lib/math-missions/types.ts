import type {CompetencyCode, MissionMode, MissionSlug} from './catalog'
export type Field = {id:string;label:string;kind:'number'|'select'|'text';unit?:string;options?:{value:string;label:string}[];min?:number;max?:number;step?:number}
export type Answer = Record<string,string>
export type BoardKind = 'numberline'|'reactor'|'courier'|'precision'|'balance'|'motion'|'vector'
export type Task = {id:string;code:CompetencyCode;title:string;prompt:string;fields:Field[];board:BoardKind;data:Record<string,number|string|number[]>;hint:string;worked:string[];expected:Answer;explanation:string;errorRules:{field:string;value:string;code:string;feedback:string}[];review?:boolean}
export type PublicTask = Omit<Task,'expected'|'hint'|'worked'|'errorRules'>
export type Evidence = {taskId:string;code:CompetencyCode;phase:string;prompt:string;answers:Answer[];firstCorrect:boolean;firstAssisted:boolean;correct:boolean;assisted:boolean;hints:number;errorCodes:string[];review:boolean;explanation:string;completedAt:string}
export type MissionState = {index:number;level:number;variant?:number;answers:Answer[];hintCount:number;firstHintCount?:number;errorCodes:string[];evidence:Evidence[];feedback?:{correct:boolean;message:string;review:boolean};revealed:boolean;checked:boolean;draft:Answer;paused:boolean}
export type Session = {id:string;user_id:string;mission:MissionSlug;code:CompetencyCode;mode:MissionMode;seed:number;version:number;state:MissionState;status:'active'|'completed';created_at:string;completed_at:string|null;assignment_id:string|null;ranked:boolean;xp:number;score:number;revision:number;staff:boolean}
export type SessionView = {id:string;mission:MissionSlug;code:CompetencyCode;mode:MissionMode;index:number;phase:string;level:number;revision:number;status:string;ranked:boolean;xp:number;score:number;maxScore:number;task:PublicTask|null;hint:string|null;worked:string[];state:MissionState;dueAt?:string|null;strategy?:{idea:string;words:{term:string;meaning:string}[]}}
