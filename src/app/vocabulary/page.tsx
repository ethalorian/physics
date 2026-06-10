import { redirect } from 'next/navigation'

/**
 * /vocabulary → /arcade. There is exactly ONE arcade now: the unified hub
 * holds the vocab games (training floor / XP earners) alongside the ranked
 * physics cabinets (main floor / XP spenders). Individual games still live
 * at /vocabulary/<game> — only this index page moved. Every game's "back"
 * link funnels here, so finishing any game returns players to the hub.
 */
export default function VocabularyRedirect() {
  redirect('/arcade')
}
