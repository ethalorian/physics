export const lessonReadingKey = (lessonId:string,blockId:string) => `lesson:${lessonId}:${blockId}`
export function parseLessonReadingKey(key:string) {
  const match = key.match(/^lesson:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):([^\s]{1,160})$/i)
  return match ? {lessonId:match[1],blockId:match[2]} : null
}
