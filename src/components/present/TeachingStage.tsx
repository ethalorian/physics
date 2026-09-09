'use client'
import { LessonLocationLabel, lessonIdentityStyles, type LessonLocation } from '@/components/lessons/LessonVisualIdentity'
import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

/** A shared 16:9 student-facing surface. Portal windows inherit the app's palette. */
export function TeachingStage({ lesson, mode, footer, children, embedded = false, location }: { location?: LessonLocation | null; lesson: string; mode: string; footer?: ReactNode; children: ReactNode; embedded?: boolean }) {
  const host = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [palette, setPalette] = useState<CSSProperties>({})
  useLayoutEffect(() => {
    const style = getComputedStyle(document.documentElement)
    const values: Record<string, string> = {}
    for (const key of ['--background','--foreground','--card','--primary','--primary-foreground','--muted','--muted-foreground','--border','--success','--radius']) values[key] = style.getPropertyValue(key)
    setPalette(values)
    const win = host.current?.ownerDocument.defaultView
    const fit = () => { if (win) setScale(Math.min(win.innerWidth / 1600, win.innerHeight / 900)) }
    fit(); win?.addEventListener('resize', fit)
    return () => win?.removeEventListener('resize', fit)
  }, [])
  return <div ref={host} style={{ ...palette, position: embedded ? 'relative' : 'fixed', inset: embedded ? undefined : 0, width: embedded ? 1600 : undefined, height: embedded ? 900 : undefined, overflow: 'hidden', background: 'var(--foreground)' }}>
    <section className="teach-screen" aria-label="Classroom presentation" style={{ position: 'absolute', left: embedded ? 0 : '50%', top: embedded ? 0 : '50%', transform: embedded ? undefined : `translate(-50%, -50%) scale(${scale})` }}>
      <header className="teach-header"><div className="teach-brand" aria-hidden="true">φ</div><p className="teach-lesson">{lesson}</p><div className="teach-location"><LessonLocationLabel location={location ?? null} /><span className="teach-mode">{mode}</span></div></header>
      <div className="teach-main">{children}</div>
      <footer className="teach-footer"><span className="teach-footer-line" />{footer ?? 'Explore the idea. Make a connection.'}<span className="teach-signature">Antocci Physics</span></footer>
      <style>{lessonIdentityStyles + teachingStyles}</style>
    </section>
  </div>
}

/** Fit the complete representation, including graph axes/legend, without cropping or scrolling. */
export function FitTeachingContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  const bounds = useRef<HTMLDivElement>(null), content = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const fit = () => {
      const box = bounds.current, el = content.current
      if (box && el) setScale(Math.min(1, box.clientHeight / Math.max(1, el.scrollHeight), box.clientWidth / Math.max(1, el.scrollWidth)))
    }
    fit(); const observer = new ResizeObserver(fit)
    if (bounds.current) observer.observe(bounds.current)
    if (content.current) observer.observe(content.current)
    return () => observer.disconnect()
  }, [children])
  return <div ref={bounds} style={{ height: '100%', width: '100%', overflow: 'hidden' }}><div ref={content} className={className} style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>{children}</div></div>
}

export const teachingStyles = `
.teach-sei-supports{margin-top:24px;padding:18px 22px;border:1px solid var(--border);border-radius:14px;background:var(--card);color:var(--foreground);font-size:23px;line-height:1.4}
.teach-sei-supports>strong{display:block;color:var(--primary);text-transform:uppercase;letter-spacing:.08em;font-size:17px;margin-bottom:10px}.teach-sei-supports>div+div{margin-top:10px}.teach-sei-supports span{display:block;font-size:16px;font-weight:700;color:var(--muted-foreground)}.teach-sei-supports p{margin:4px 0 0}.teach-sei-supports .markdown-content{font-size:inherit!important;line-height:inherit!important}

.teach-question{min-height:650px;padding:36px 54px;display:flex;align-items:center}
.teach-question-copy{width:100%;max-width:1240px;margin:auto}
.teach-question-kicker{margin:0 0 22px;color:var(--primary);font-size:20px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.teach-question-prompt{font-family:'Source Serif 4',Georgia,serif;font-size:62px;font-weight:700;line-height:1.16;letter-spacing:-.025em}
.teach-question-prompt p{margin:0}
.teach-screen .teach-question-prompt .markdown-content{font:inherit!important;color:inherit!important}
.teach-question-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin:38px 0 0;padding:0;list-style:none}
.teach-question-choices li{display:flex;align-items:center;gap:22px;padding:24px 28px;border:1px solid var(--border);border-radius:16px;background:var(--card);font-size:34px;line-height:1.3;min-width:0}
.teach-question-choices .markdown-content{font-size:inherit!important;line-height:inherit!important}.teach-question-choices p{margin:0}
.teach-question-letter{display:grid;place-items:center;width:48px;height:48px;flex-shrink:0;background:var(--primary);color:var(--primary-foreground);border-radius:12px;font-size:24px;font-weight:700}
.teach-question-explain{margin-top:38px;padding:2px 0 2px 24px;border-left:4px solid var(--primary);font-size:28px;line-height:1.4}
.teach-question-explain strong{display:block;font-size:18px;letter-spacing:.06em;text-transform:uppercase;color:var(--primary);margin-bottom:8px}
.teach-question-explain p{margin:0}.teach-question-explain .markdown-content{font-size:inherit!important;line-height:inherit!important}
.teach-question-with-visual{display:grid;grid-template-columns:1fr 1fr;gap:36px;padding:24px 12px}.teach-question-with-visual .teach-question-prompt{font-size:44px}.teach-question-with-visual .teach-question-choices{grid-template-columns:1fr}.teach-question-visual{min-width:0;font-size:26px}.teach-question-visual img{max-height:500px;object-fit:contain}

.teach-location{margin-left:auto;display:flex;align-items:center;gap:18px;color:var(--primary);font-size:17px;white-space:nowrap}
.teach-response-cue{border:2px solid var(--primary);border-radius:18px;background:color-mix(in oklch,var(--primary) 8%,var(--card));padding:18px 24px;margin-bottom:18px;font-size:26px;line-height:1.4}
.teach-response-cue .lesson-response-badge{font-size:20px;margin-right:16px}.teach-response-cue strong{font-size:28px}.teach-response-cue p{font-size:24px;margin:10px 0 0}.teach-response-cue ul{display:flex;flex-wrap:wrap;gap:8px 32px;font-size:24px;padding-left:26px;margin:10px 0 0}
.teach-screen .lesson-chapter-number{font-size:230px;top:auto;bottom:10px}
.teach-screen .teach-focus .teach-headline{font-family:'Source Serif 4',Georgia,serif}

.teach-screen{width:1600px;height:900px;padding:32px 64px;box-sizing:border-box;background:var(--background);color:var(--foreground);font-family:Inter,system-ui,sans-serif;display:flex;flex-direction:column;gap:18px;overflow:hidden}
.teach-screen *{box-sizing:border-box}.teach-header{display:flex;align-items:center;gap:16px;height:52px;flex-shrink:0}.teach-brand{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:var(--primary);color:var(--primary-foreground);font-size:32px;font-family:Georgia,serif}.teach-lesson{font-size:22px;font-weight:600;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:1000px}.teach-mode{margin-left:auto;font-size:19px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:10px 18px;border:1px solid var(--border);border-radius:999px;white-space:nowrap;color:var(--primary)}
.teach-main{flex:1;min-height:0;position:relative}.teach-footer{display:flex;gap:16px;align-items:center;height:36px;flex-shrink:0;font-size:21px;color:var(--muted-foreground)}.teach-footer-line{width:48px;height:4px;border-radius:999px;background:var(--primary)}.teach-signature{margin-left:auto;font-size:14px;letter-spacing:.15em;text-transform:uppercase}
.teach-eyebrow{font-size:20px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin:0 0 22px}.teach-headline{font-size:66px;line-height:1.08;font-weight:700;letter-spacing:-.04em;margin:0 0 28px}.teach-headline p{margin:0}.teach-subtitle{font-size:28px;line-height:1.5;margin:0}.teach-split{display:grid;grid-template-columns:.9fr 1.35fr;gap:28px;min-height:640px}.teach-focus{background:var(--primary);color:var(--primary-foreground);border-radius:var(--radius);padding:40px;display:flex;flex-direction:column;justify-content:center}.teach-focus .teach-headline{font-size:49px}.teach-focus .teach-headline p{line-height:1.2}.teach-focus .teach-eyebrow{opacity:.85}.teach-focus .teach-subtitle{opacity:.9}
.teach-options{display:grid;grid-template-columns:1fr 1fr;gap:20px}.teach-option{position:relative;background:var(--card);border:2px solid var(--border);border-radius:var(--radius);padding:26px;display:flex;flex-direction:column;gap:20px;min-width:0;overflow:hidden}.teach-option-letter{display:grid;place-items:center;width:58px;height:58px;border-radius:50%;background:color-mix(in oklch,var(--primary) 12%,var(--card));color:var(--primary);font-size:28px;font-weight:700}.teach-option-text{font-size:31px;line-height:1.3;flex:1}.teach-option-text p{margin:0}.teach-response{font-size:23px;color:var(--muted-foreground);display:flex;justify-content:space-between}.teach-bar{height:12px;border-radius:99px;background:var(--muted);overflow:hidden}.teach-bar>span{display:block;height:100%;background:var(--primary);border-radius:99px}.teach-participation{margin-top:28px;padding-top:22px;border-top:1px solid currentColor;font-size:24px}.teach-participation strong{font-size:42px;font-variant-numeric:tabular-nums;margin-right:8px}
.teach-join{display:grid;grid-template-columns:1.15fr 1fr;gap:36px;align-items:center;height:100%}.teach-code{font-size:112px;font-weight:700;letter-spacing:.1em;line-height:1.2;overflow-wrap:anywhere;margin:24px 0}.teach-join-steps{display:grid;gap:22px}.teach-join-step{display:flex;align-items:center;gap:24px;padding:28px;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);font-size:28px}.teach-join-step strong{font-size:34px;color:var(--primary)}.teach-join-url{font-size:27px;overflow-wrap:anywhere}
.teach-intro{height:100%;border-radius:var(--radius);background:var(--primary);color:var(--primary-foreground);display:grid;grid-template-columns:1.7fr 1fr;align-items:center;gap:32px;padding:56px;overflow:hidden}.teach-intro .teach-headline{font-family:'Source Serif 4',Georgia,serif;font-size:76px}.teach-orbit{width:320px;height:320px;position:relative;border:2px solid currentColor;border-radius:50%;opacity:.7;display:grid;place-items:center;font:110px Georgia,serif}.teach-orbit:before,.teach-orbit:after{content:'';position:absolute;inset:40px -36px;border:2px solid currentColor;border-radius:50%;transform:rotate(55deg)}.teach-orbit:after{transform:rotate(-55deg)}
.teach-block-card{background:var(--card);border:1px solid var(--border);border-top:6px solid var(--primary);border-radius:var(--radius);padding:30px 38px;font-size:32px;line-height:1.45;min-height:260px}.teach-block-card :is(p,li,label,input,textarea,button,td,th){font-size:max(1em,26px);line-height:1.4}.teach-block-card :is(.text-xs,.text-sm,.text-caption){font-size:24px!important}.teach-block-card :is(h1,h2,h3){font-size:44px!important;line-height:1.15;margin-top:0;color:var(--primary)}.teach-block-card :is(.overflow-y-auto,.overflow-auto,.overflow-x-auto){overflow:visible;max-height:none}.teach-block-card :is(svg,canvas,img,iframe){max-width:100%}.teach-block-card iframe{height:560px}.teach-block-card blockquote{border-left:6px solid var(--primary);padding:16px 28px;background:color-mix(in oklch,var(--primary) 7%,var(--card));border-radius:var(--radius)}.teach-block-card li{padding-left:10px;margin:16px 0}.teach-block-card li::marker{color:var(--primary);font-weight:700}.teach-block-card strong{font-weight:700}.teach-screen .katex{font-size:1em}.teach-screen .katex-display{overflow:visible}.teach-screen .prose{max-width:none}
.teach-screen .markdown-content{font-size:inherit!important;line-height:inherit!important;color:inherit!important;font-weight:inherit!important;letter-spacing:normal!important}
.teach-screen .markdown-content :is(p,li){font-size:inherit!important;line-height:inherit!important;color:inherit!important}
.teach-screen .teach-headline .markdown-content{font-size:49px!important;line-height:1.16!important;letter-spacing:-.025em!important}
.teach-screen .teach-option-text .markdown-content{font-size:31px!important;line-height:1.3!important}
.teach-screen .teach-block-card .markdown-content{font-size:32px!important;line-height:1.45!important}

`
