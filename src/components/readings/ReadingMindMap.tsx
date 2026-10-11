'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState, type PointerEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, BookOpen, Expand, Focus, GitBranch, Maximize2, Minimize2, Search, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SYLLABUS_UNITS, type SyllabusCatalog } from '@/lib/reading-syllabus'
import { readingDashboardHref, readingResourceStatus, type ReadingDashboardGroup } from '@/lib/reading-dashboard'
import { MAP_RESOURCES, readingConcepts, readingConnections, readingMapGraph, readingMapPath, type ReadingMapMode, type ReadingMapNode } from '@/lib/reading-map'
import styles from './ReadingMindMap.module.css'

interface ReadingMindMapProps { syllabus: SyllabusCatalog; groups: ReadingDashboardGroup[]; courseId: string }
interface Camera { x: number; y: number; scale: number }

export default function ReadingMindMap({ syllabus, groups, courseId }: ReadingMindMapProps) {
  const params = useSearchParams(), requested = params.get('step_id')
  const [selected, setSelected] = useState(requested ?? '')
  const [mode, setMode] = useState<ReadingMapMode>(requested ? 'focus' : 'concepts')
  const [conceptId, setConceptId] = useState(''), [search, setSearch] = useState(''), [expanded, setExpanded] = useState(false), [hoverConcept, setHoverConcept] = useState(''), [fullPath, setFullPath] = useState(false)
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, scale: 1 }), [size, setSize] = useState({ width: 1000, height: 620 })
  const shell = useRef<HTMLDivElement>(null), viewport = useRef<HTMLDivElement>(null), details = useRef<HTMLElement>(null)
  const drag = useRef<{ x: number; y: number; camera: Camera; id: number } | null>(null)
  const marker = useId().replace(/:/g, '')
  const { steps } = syllabus
  const concepts = useMemo(() => readingConcepts(steps, SYLLABUS_UNITS), [steps])
  const graph = useMemo(() => readingMapGraph(steps, SYLLABUS_UNITS, mode, conceptId, selected), [steps, mode, conceptId, selected])
  const positions = useMemo(() => new Map(graph.nodes.map(node => [node.id, node])), [graph.nodes])
  const connections = useMemo(() => readingConnections(steps, selected), [steps, selected])
  const step = steps.find(item => item.id === selected)
  const scoped = groups.filter(group => !courseId || group.courseId === courseId)
  const stepGroups = scoped.filter(group => group.step?.id === selected)
  const standalone = scoped.filter(group => !group.step)
  const searchResults = search.trim() ? steps.filter(item => `${item.title} ${item.focus} ${item.words.map(word => word.term).join(' ')}`.toLowerCase().includes(search.trim().toLowerCase())) : []
  const fit = useCallback(() => {
    const scale = Math.max(.12, Math.min(1, (size.width - 40) / graph.width, (size.height - 40) / graph.height))
    setCamera({ scale, x: (size.width - graph.width * scale) / 2, y: (size.height - graph.height * scale) / 2 })
  }, [size.width, size.height, graph.width, graph.height])
  // A selection highlights the existing graph without moving it. Changing scope lays it out anew.
  const layoutKey = `${mode}:${conceptId}:${mode === 'focus' ? selected : ''}`
  useEffect(() => { fit() }, [fit, layoutKey])
  useEffect(() => {
    if (!viewport.current) return
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(viewport.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!expanded) return
    const previous = document.activeElement as HTMLElement | null, overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    shell.current?.querySelector<HTMLButtonElement>('[aria-label="Exit expanded map"]')?.focus()
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpanded(false)
      if (event.key !== 'Tab') return
      const controls = [...(shell.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, select, [tabindex="0"]') ?? [])]
      const first = controls[0], last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    window.addEventListener('keydown', escape)
    return () => { window.removeEventListener('keydown', escape); document.body.style.overflow = overflow; previous?.focus() }

  }, [expanded])

  function zoom(factor: number) {
    setCamera(current => {
      const scale = Math.max(.12, Math.min(2, current.scale * factor)), ratio = scale / current.scale
      return { scale, x: size.width / 2 - (size.width / 2 - current.x) * ratio, y: size.height / 2 - (size.height / 2 - current.y) * ratio }
    })
  }
  function reveal(node: ReadingMapNode) {
    setCamera(current => {
      const left = current.x + node.x * current.scale, top = current.y + node.y * current.scale
      if (current.scale >= .7 && left >= 0 && top >= 0 && left + node.width * current.scale <= size.width && top + node.height * current.scale <= size.height) return current
      const scale = Math.max(.8, current.scale)
      return { scale, x: size.width / 2 - (node.x + node.width / 2) * scale, y: size.height / 2 - (node.y + node.height / 2) * scale }
    })
  }
  function choose(id: string, trace = false) { setSelected(id); setSearch(''); if (trace) setMode('focus') }
  function chooseConcept(id: string) { setConceptId(id); setMode(id ? 'readings' : 'concepts'); setSelected(''); setSearch(''); setHoverConcept('') }
  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || (event.target as Element).closest('button,a')) return
    drag.current = { x: event.clientX, y: event.clientY, camera, id: event.pointerId }
    event.currentTarget.setPointerCapture(event.pointerId)
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current
    if (start?.id === event.pointerId) setCamera({ ...start.camera, x: start.camera.x + event.clientX - start.x, y: start.camera.y + event.clientY - start.y })
  }
  const title = (id: string) => steps.find(item => item.id === id)?.title ?? id
  const className = (id: string) => { const item = syllabus.courses.find(course => course.id === id); return item ? `${item.name}${item.section ? ` · ${item.section}` : ''}` : 'Class' }
  const status = (id: string) => {
    const saved = scoped.filter(group => group.step?.id === id), assigned = saved.filter(group => group.resources[0]?.status === 'published').length
    if (!courseId) return assigned ? `Assigned in ${assigned} ${assigned === 1 ? 'class' : 'classes'}` : saved.length ? `Prepared in ${saved.length} ${saved.length === 1 ? 'class' : 'classes'}` : 'Not prepared'
    return saved[0] ? readingResourceStatus(saved[0].resources[0]) : 'Not prepared'
  }
  const before = fullPath ? connections.before : new Set(connections.parents), after = fullPath ? connections.after : new Set(connections.children)
  const members = (id: string) => id.startsWith('concept:') ? concepts.find(concept => concept.id === id.slice(8))?.readings ?? [] : [id]
  const relation = (id: string) => id === selected ? 'selected' : members(id).some(item => before.has(item)) ? 'before' : members(id).some(item => after.has(item)) ? 'after' : 'unrelated'
  const relatedEdge = (from: string, to: string) => {
    if (mode === 'concepts') return !hoverConcept || from === hoverConcept || to === hoverConcept
    if (!selected) return !hoverConcept || from === hoverConcept || to === hoverConcept
    if (!fullPath) return from === selected || to === selected
    return members(from).some(id => id === selected || before.has(id)) && members(to).some(id => id === selected || before.has(id)) || members(from).some(id => id === selected || after.has(id)) && members(to).some(id => id === selected || after.has(id))
  }
  const resourceHref = (group: ReadingDashboardGroup, kind: typeof MAP_RESOURCES[number][0]) => {
    const resource = group.resources.find(item => item.kind === kind)
    return resource?.id ? readingDashboardHref({ view: 'assignments', courseId: group.courseId, stepId: group.step?.id, resource: kind, id: resource.id }) : null
  }
  if (courseId && !syllabus.courses.some(course => course.id === courseId)) return <Card className="p-6">Choose a Physics class above to explore its reading connections.</Card>
  if (!steps.length) return <Card className="p-6">No syllabus readings are available to map yet.</Card>

  return <section className={styles.page} aria-label="Reading mind map">
    <header className={styles.heading}><div><p className="text-overline text-primary">Ideas that build on each other</p><h2 className="text-title-1 mt-2">Concept interactions</h2><p className="text-muted-foreground mt-2">Explore neighborhoods of related ideas. Follow the bridges between them, then open a neighborhood to see the readings that connect it to the rest of the course.</p></div><span className={styles.count}>{steps.length} readings · {concepts.length} concept neighborhoods</span></header>
    <div ref={shell} className={expanded ? styles.expanded : styles.mapShell} role={expanded ? 'dialog' : undefined} aria-modal={expanded ? true : undefined} aria-label={expanded ? 'Expanded reading mind map' : undefined}>
      <div className={styles.toolbar}>
        <div className={styles.modes} aria-label="Mind map detail"><Button variant={mode === 'concepts' ? 'default' : 'outline'} aria-pressed={mode === 'concepts'} onClick={() => chooseConcept('')}><GitBranch size={17} />Concept neighborhoods</Button><Button variant={mode === 'readings' && !conceptId ? 'default' : 'outline'} aria-pressed={mode === 'readings' && !conceptId} onClick={() => { setMode('readings'); setConceptId('') }}><Expand size={17} />All readings</Button><Button variant={mode === 'focus' ? 'default' : 'outline'} disabled={!step} aria-pressed={mode === 'focus'} onClick={() => setMode('focus')}><Focus size={17} />Trace selected reading</Button></div>
        <label className={styles.unit}><span className="sr-only">Concept neighborhood</span><select aria-label="Concept neighborhood" value={conceptId} onChange={event => chooseConcept(event.target.value)}><option value="">Whole course</option>{concepts.map(concept => <option key={concept.id} value={concept.id}>{concept.title}</option>)}</select></label>
        <Button variant="ghost" aria-label={expanded ? 'Exit expanded map' : 'Expand map'} onClick={() => setExpanded(value => !value)}>{expanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</Button>
      </div>
      <div className={styles.searchRow}><div className={styles.search}><Search size={17} aria-hidden="true" /><Input aria-label="Find a reading on the mind map" placeholder="Find a reading, concept, or vocabulary word…" value={search} onChange={event => setSearch(event.target.value)} /></div><div className={styles.zoom}><Button variant="outline" aria-label="Zoom out of mind map" disabled={camera.scale <= .12} onClick={() => zoom(1 / 1.25)}><ZoomOut size={17} /></Button><output aria-label="Mind map zoom">{Math.round(camera.scale * 100)}%</output><Button variant="outline" aria-label="Zoom into mind map" disabled={camera.scale >= 2} onClick={() => zoom(1.25)}><ZoomIn size={17} /></Button><Button variant="outline" onClick={fit}>Fit map</Button></div></div>
      {!!search.trim() && <div className={styles.results} aria-label="Mind map search results">{searchResults.length ? searchResults.map(item => <Button key={item.id} variant="ghost" onClick={() => choose(item.id, true)}>{steps.indexOf(item) + 1}. {item.title}<ArrowRight size={15} /></Button>) : <p role="status">No matching readings. Try a concept such as energy, force, or current.</p>}</div>}
      <div className={styles.mapCaption}><strong>{mode === 'concepts' ? 'A network of connected ideas' : mode === 'focus' ? `Connections for ${step?.title ?? 'this reading'}` : conceptId ? concepts.find(concept => concept.id === conceptId)?.description : 'Every reading, grouped by the ideas it develops'}</strong><span>{mode === 'concepts' ? 'Open a neighborhood to explore its readings.' : mode === 'focus' ? 'Earlier foundations above · Later applications below' : conceptId ? 'Neighboring concepts stay connected at the edges.' : 'Zoom in or choose a neighborhood to read its branches.'}</span></div>
      <div ref={viewport} className={styles.viewport} tabIndex={0} role="region" aria-label="Interactive reading map" aria-describedby={`${marker}-help`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }} onKeyDown={event => {
        if (event.target !== event.currentTarget) return
        const directions: Record<string, [number, number]> = { ArrowLeft: [80, 0], ArrowRight: [-80, 0], ArrowUp: [0, 80], ArrowDown: [0, -80] }
        if (directions[event.key]) { event.preventDefault(); const [x, y] = directions[event.key]; setCamera(current => ({ ...current, x: current.x + x, y: current.y + y })) }
        else if (event.key === '+' || event.key === '=') { event.preventDefault(); zoom(1.25) }
        else if (event.key === '-') { event.preventDefault(); zoom(1 / 1.25) }
        else if (event.key === '0') { event.preventDefault(); fit() }
      }}>
        <div className={styles.world} style={{ width: graph.width, height: graph.height, transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})` }}>
          <svg width={graph.width} height={graph.height} className={styles.edges} aria-hidden="true"><defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" /></marker></defs>{graph.regions.map(region => <g key={region.id} data-map-region={region.id}><ellipse className={styles.region} cx={region.x + region.width / 2} cy={region.y + region.height / 2} rx={region.width / 2} ry={region.height / 2} /></g>)}{graph.edges.map(edge => {
            const from = positions.get(edge.from), to = positions.get(edge.to)
            return from && to ? <path key={`${edge.from}:${edge.to}`} data-map-edge={`${edge.from}:${edge.to}`} data-kind={edge.kind} data-active={relatedEdge(edge.from, edge.to) || edge.kind === 'assignment'} d={readingMapPath(from, to, edge.kind)} markerEnd={`url(#${marker})`}><title>{from.title} {edge.kind === 'assignment' ? 'has assignment' : 'supports'} {to.title}{edge.count > 1 ? ` · ${edge.count} prerequisite connections` : ''}</title></path> : null
          })}{graph.regions.filter(region => region.title).map(region => <text key={region.id} className={styles.regionTitle} x={region.x + region.width / 2} y={region.y + 30} textAnchor="middle">{region.title}</text>)}</svg>
          {graph.nodes.map(node => {
            const nodeStep = steps.find(item => item.id === node.id), concept = concepts.find(item => item.id === node.concept)
            const kind = node.kind === 'resource' ? MAP_RESOURCES.find(([kind]) => node.id === `resource:${kind}`)?.[0] : null
            const resource = kind && stepGroups.length === 1 ? stepGroups[0].resources.find(item => item.kind === kind) : null
            return <button key={node.id} type="button" data-map-node={node.id} data-kind={node.kind} data-concept={node.concept} data-context={node.context} data-relation={selected && node.kind !== 'resource' ? relation(node.id) : undefined} className={styles.node} style={{ left: node.x, top: node.y, width: node.width, height: node.height }} aria-label={node.kind === 'concept' ? `Explore ${node.title} · ${node.count} readings` : node.kind === 'resource' ? `Show ${node.title.toLowerCase()} assignments` : `Select reading ${steps.indexOf(nodeStep!) + 1}: ${node.title}`} aria-pressed={node.kind === 'reading' ? node.id === selected : undefined} onFocus={event => { if (event.currentTarget.matches(':focus-visible')) { reveal(node); if (node.kind === 'concept') setHoverConcept(node.id) } }} onBlur={() => setHoverConcept('')} onMouseEnter={() => node.kind === 'concept' && setHoverConcept(node.id)} onMouseLeave={() => setHoverConcept('')} onClick={() => {
              if (node.kind === 'concept') chooseConcept(node.concept!)
              else if (node.kind === 'reading') choose(node.id)
              else { setExpanded(false); requestAnimationFrame(() => details.current?.scrollIntoView({ block: 'start', behavior: 'instant' })) }
            }}>
              <span className={styles.nodeLabel}>{node.kind === 'concept' ? 'Concept neighborhood' : node.kind === 'resource' ? 'Connected assignment' : `Reading ${steps.indexOf(nodeStep!) + 1}`}</span><strong>{node.title}</strong><span className={styles.nodeStatus}>{node.kind === 'concept' ? `${node.count} readings · Explore →` : node.kind === 'reading' ? status(node.id) : resource ? readingResourceStatus(resource) : courseId ? 'Prepare from syllabus' : 'View class assignments'}</span>{node.kind === 'concept' && <span className="sr-only">{concept?.description}</span>}
            </button>
          })}
        </div>
      </div>
      <footer className={styles.legend}><p id={`${marker}-help`}>Drag the background to pan. Use zoom or Fit map. Keyboard: arrow keys to pan, + / − to zoom, 0 to fit.</p><div><span><i className={styles.solid} />Earlier idea → Later application</span><span><i className={styles.dashed} />Connected assignment</span>{selected && mode !== 'concepts' && <Button variant="outline" size="sm" aria-pressed={fullPath} onClick={() => setFullPath(value => !value)}>{fullPath ? 'Showing full learning path' : 'Showing direct connections'}</Button>}</div></footer>
      {step && <div className={styles.selectionBar}><span><strong>{step.title}</strong> · {connections.before.size} earlier foundations · {connections.after.size} later readings</span><Button onClick={() => { setMode('focus'); if (!expanded) requestAnimationFrame(() => viewport.current?.scrollIntoView({ block: 'center' })) }} variant="outline">Trace this reading <Focus size={16} /></Button></div>}
    </div>
    {step ? <section ref={details} className={styles.details} aria-label="Selected reading connections">
      <Card className={styles.explanation}><div><p className="text-overline text-primary">Reading {steps.indexOf(step) + 1} · {SYLLABUS_UNITS.find(([id]) => id === step.unit)?.[1]}</p><h3 className="text-title-1 mt-2">{step.title}</h3><p className="mt-3">{step.focus}</p></div><div className={styles.relationships}><div><h4 className="font-semibold">Builds directly on</h4>{connections.parents.length ? connections.parents.map(id => <button key={id} onClick={() => choose(id, true)}>{title(id)}<ArrowRight size={15} /></button>) : <p className="text-muted-foreground">A starting point in the syllabus.</p>}</div><div><h4 className="font-semibold">Directly supports</h4>{connections.children.length ? connections.children.map(id => <button key={id} onClick={() => choose(id, true)}>{title(id)}<ArrowRight size={15} /></button>) : <p className="text-muted-foreground">An application at the end of this sequence.</p>}</div></div><p className="text-caption text-muted-foreground">{connections.before.size} earlier readings feed into this idea; {connections.after.size} later readings build on it, directly or through other steps.</p><div><h4 className="font-semibold">Language that carries the idea</h4><div className={styles.words}>{step.words.map(word => <span key={word.term} title={word.definition}>{word.term}</span>)}</div></div></Card>
      <Card className={styles.explanation}><div><p className="text-overline text-primary">Reading → Practice → Check understanding</p><h3 className="text-title-2 mt-2">Assignments attached to this reading</h3></div>{(courseId ? syllabus.courses.filter(course => course.id === courseId) : syllabus.courses).map(course => {
        const group = stepGroups.find(item => item.courseId === course.id)
        return <div key={course.id} className={styles.classAssignments}><h4 className="font-semibold">{className(course.id)}</h4><p className="text-caption text-muted-foreground">{course.track === 'honors' && step.honorsReading ? `OpenStax AP Physics 2e · §${step.honorsReading.sections.join(', ')} · pp. ${step.honorsReading.from}–${step.honorsReading.to}` : step.passage ? 'Course reading' : `Hewitt · §${step.sections.join(', ')}`}</p>{group ? <div className={styles.resourceLinks}>{MAP_RESOURCES.map(([kind, label]) => { const href = resourceHref(group, kind), resource = group.resources.find(item => item.kind === kind); return href && resource ? <Link key={kind} href={href}><span>{label}</span><small>{readingResourceStatus(resource)}{resource.pending ? ` · ${resource.pending} to review` : ''}</small><ArrowRight size={16} /></Link> : <p key={kind}>{label} · Unavailable</p> })}</div> : <p className="text-muted-foreground">Four assignments have not been prepared for this class yet.</p>}<Button asChild variant="outline"><Link href={readingDashboardHref({ view: 'syllabus', courseId: course.id, stepId: step.id })}>{group ? 'Open syllabus step' : 'Preview & prepare assignments'}<ArrowRight size={16} /></Link></Button></div>
      })}{!syllabus.courses.length && <p>Connect a Physics class to prepare assignments from these readings.</p>}<p className="text-caption text-muted-foreground">The reading quiz unlocks after reading submission and stays marked “Needs completion” if saved for later. Vocabulary practice builds recall; the vocabulary quiz checks meaning and use.</p></Card>
    </section> : <Card className={styles.intro}><BookOpen size={24} className="text-primary" /><div><h3 className="text-title-3">Follow an idea across the course</h3><p className="text-muted-foreground">Open a concept neighborhood to see its readings and the ideas it connects to. Select a reading to highlight its direct connections, or trace the full learning path. “Trace this reading” places it at the center with its vocabulary and quizzes.</p></div></Card>}
    {!!standalone.length && <details className={styles.unmapped}><summary>{standalone.length} standalone {standalone.length === 1 ? 'reading' : 'readings'} outside the syllabus map</summary><p className="text-muted-foreground">These readings have no saved prerequisite connections. They remain available here without implying relationships that have not been defined.</p>{standalone.map(group => <Link key={group.id} href={readingDashboardHref({ view: 'assignments', courseId: group.courseId, resource: 'reading', id: group.resources[0].id })}>{group.title}<ArrowRight size={16} /></Link>)}</details>}
    <p className="text-caption text-muted-foreground">Connections come from the syllabus prerequisites. Assignment status reflects release to students, not student mastery.</p>
  </section>
}
