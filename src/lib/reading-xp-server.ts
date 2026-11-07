import 'server-only'
import { assignmentXpReceipt } from './assignment-xp-receipt-server'
import { READING_ASSIGNMENT_XP } from './xp-policy'
import type { ReadingCourse } from './textbook-assignments'

export function readingXpStatus(assignmentId:string,userId:string,course:ReadingCourse) {
  return assignmentXpReceipt('reading',assignmentId,userId,course.id,course.program==='physics',READING_ASSIGNMENT_XP)
}
