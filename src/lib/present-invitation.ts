import type {Pulse} from './presentation-tools'

export type PresentInvitation = {
  id:string; sessionId:string; courseName:string; createdAt:string; required:boolean;
} & ({kind:'pulse';pulse:Pulse}|{kind:'lobby';code:string;prompt:string}|{kind:'lesson_poll';prompt:string;href:string})
