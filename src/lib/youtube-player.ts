export interface LessonYouTubePlayer {
  pauseVideo(): void
  getCurrentTime(): number
  getPlayerState(): number
  destroy(): void
}
interface YouTubeApi {
  Player: new (iframe: HTMLIFrameElement, options: { events: { onReady: () => void; onStateChange: () => void } }) => LessonYouTubePlayer
}
let pending: Promise<YouTubeApi> | null = null

export function loadLessonYouTubeApi(): Promise<YouTubeApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT as YouTubeApi)
  if (pending) return pending
  pending = new Promise<YouTubeApi>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady
    const ready = () => {
      if (!window.YT?.Player) return
      clearTimeout(timer); clearInterval(poll)
      resolve(window.YT as YouTubeApi)
    }
    window.onYouTubeIframeAPIReady = () => { previous?.(); ready() }
    // An editor may already be loading the same API with its own ready callback.
    const poll = setInterval(ready, 100)
    const timer = setTimeout(() => { clearInterval(poll); pending = null; reject(new Error('YouTube tracking could not load.')) }, 15000)
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      document.head.appendChild(script)
    }
  })
  return pending
}
