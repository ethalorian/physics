'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { ArrowRight, BookOpen, Eye, GraduationCap, ShieldCheck, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type UserRole } from '@/lib/permissions'

type Student = { id: string; name: string | null; email: string | null }
type Course = { id: string; name: string; section?: string | null }
const roles = [
  { role: 'student', title: 'Student', icon: GraduationCap, detail: 'Their home, assigned lessons, feedback, XP, arcade, and store.' },
  { role: 'teacher', title: 'Teacher', icon: BookOpen, detail: 'A teacher’s classes, lesson preparation, and review tools.' },
  { role: 'observer', title: 'Observer', icon: Eye, detail: 'School-wide insights and lesson plans, with observer access.' },
  { role: 'admin', title: 'Admin', icon: ShieldCheck, detail: 'Your full admin workspace with saving switched off.' },
] as const
export default function ExperiencePage() {
  const { data: session, status } = useSession()
  const isAdmin = (session?.experience?.actor.role ?? session?.user?.role) === 'admin'
  const [role, setRole] = useState<UserRole>('student')
  const [classes, setClasses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<string[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classId, setClassId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [availability,setAvailability]=useState<{id:string;title:string;reason:string}[]>([])
  const [accessError,setAccessError]=useState('')
  useEffect(()=>{setAvailability([]);setAccessError('');if(!studentId||!classId)return;const ac=new AbortController();fetch('/api/admin/experience?class='+encodeURIComponent(classId)+'&student='+encodeURIComponent(studentId),{signal:ac.signal}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);setAvailability(d.availability??[])}).catch(e=>{if(!ac.signal.aborted)setAccessError(e.message)});return()=>ac.abort()},[studentId,classId])
  const [teacherEmail, setTeacherEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [rosterLoading, setRosterLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!isAdmin) return
    const controller = new AbortController()
    fetch('/api/admin/experience', { signal: controller.signal }).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error)
      setClasses(data.classes); setTeachers(data.teachers); setTeacherEmail(data.actor.email); setLoading(false)
    }).catch(error => { if (!controller.signal.aborted) { setError(error.message); setLoading(false) } })
    return () => controller.abort()
  }, [isAdmin])
  useEffect(() => {
    setStudents([]); setStudentId('')
    if (!classId) { setRosterLoading(false); return }
    const controller = new AbortController()
    setRosterLoading(true); setError('')
    fetch('/api/admin/experience?class=' + encodeURIComponent(classId), { signal: controller.signal }).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error)
      setStudents(data.students); setRosterLoading(false)
    }).catch(error => { if (!controller.signal.aborted) { setError(error.message); setRosterLoading(false) } })
    return () => controller.abort()
  }, [classId])
  async function start() {
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/admin/experience', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role, classId, studentId, teacherEmail }) })
      const data = await response.json(); if (!response.ok) throw new Error(data.error)
      try { localStorage.setItem('experience-changed', String(Date.now())) } catch { /* Switching still works when storage is unavailable. */ }
      window.location.assign(data.redirect)
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not open the walkthrough.'); setBusy(false) }
  }
  async function inspectLesson() {
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/admin/experience', { method: 'DELETE' })
      if (!response.ok) throw new Error('Could not leave the walkthrough. Try again.')
      try { localStorage.setItem('experience-changed', String(Date.now())) } catch { /* Storage may be unavailable. */ }
      window.location.assign('/admin/student-preview')
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not open inspector.'); setBusy(false) }
  }
  if (status === 'loading') return <p role="status">Loading your account…</p>
  if (!isAdmin) return <div className="mx-auto max-w-xl space-y-4"><h1 className="text-2xl font-semibold">Admin access required</h1><p>This tool is available to the administrator.</p><Button asChild><Link href="/">Go home</Link></Button></div>
  const ready = !loading && !busy && (role === 'student' ? !!studentId && !rosterLoading : role === 'teacher' ? !!teacherEmail : true)
  return <div className="mx-auto max-w-5xl space-y-8">
    <header className="space-y-3"><p className="text-sm font-medium text-primary">Experience as…</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Walk through another role.</h1><p className="max-w-3xl text-muted-foreground">See the actual pages, navigation, and account data each role uses. Choose a student to check what is available to them, then follow the same links they would.</p></header>
    <fieldset><legend className="mb-3 font-semibold">1. Choose a role</legend><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{roles.map(item => <label key={item.role} className={'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ' + (role === item.role ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/40')}><input type="radio" name="experience-role" value={item.role} checked={role === item.role} onChange={() => { setRole(item.role); setError('') }} className="mt-1 accent-primary" /><span><item.icon className="mb-3 size-6 text-primary" /><span className="block font-semibold">{item.title}</span><span className="mt-2 block text-sm text-muted-foreground">{item.detail}</span></span></label>)}</div></fieldset>
    <section className="space-y-5 rounded-xl border bg-card p-5 sm:p-6" aria-label="Account selection">
      <h2 className="font-semibold">2. {role === 'student' ? 'Choose a student' : role === 'teacher' ? 'Choose a teacher' : 'Open the workspace'}</h2>
      {loading ? <p role="status">Loading accounts…</p> : role === 'student' ? <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium"><span className="block">Class</span><select value={classId} onChange={e => setClassId(e.target.value)} className="min-h-11 w-full rounded-md border bg-background px-3"><option value="">Choose a class</option>{classes.map(course => <option key={course.id} value={course.id}>{course.name}{course.section ? ' · ' + course.section : ''}</option>)}</select></label>
        <label className="space-y-2 text-sm font-medium"><span className="block">Student</span><select disabled={!classId || rosterLoading} value={studentId} onChange={e => setStudentId(e.target.value)} className="min-h-11 w-full rounded-md border bg-background px-3 disabled:opacity-60"><option value="">{rosterLoading ? 'Loading students…' : !classId ? 'Choose a class first' : students.length ? 'Choose a student' : 'No students in this class'}</option>{students.map(student => <option key={student.id} value={student.id}>{student.name || student.email} {student.name && student.email ? '· ' + student.email : ''}</option>)}</select></label>
      </div> : role === 'teacher' ? <label className="block max-w-xl space-y-2 text-sm font-medium"><span className="block">Teacher account</span><select value={teacherEmail} onChange={e => setTeacherEmail(e.target.value)} className="min-h-11 w-full rounded-md border bg-background px-3">{teachers.map(email => <option key={email}>{email}</option>)}</select></label> : <p className="text-sm text-muted-foreground">{role === 'observer' ? 'Use your account with observer permissions. Only the tools and data available to that role will be shown.' : 'Explore your admin workspace with protection against accidental changes.'}</p>}
      <div className="flex items-start gap-3 rounded-lg bg-muted/50 p-4 text-sm"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" /><p><strong>Read-only walkthrough.</strong> You can navigate and review saved work. Submitting answers, earning or spending XP, joining live activities, and editing settings are blocked. A banner stays visible with a return-to-admin button. The mode lasts one hour and applies to this browser’s tabs.</p></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button disabled={!ready} onClick={start}>{busy ? 'Opening…' : 'Open ' + role + ' experience'}<ArrowRight className="size-4" /></Button>
    </section>
    {role==='student'&&studentId&&<section className="space-y-3 rounded-xl border p-5"><h2 className="font-semibold">Lesson availability for this student</h2><p className="text-sm text-muted-foreground">Check why a lesson is missing before opening the student experience. Availability includes all their enrolled classes.</p>{accessError?<p role="alert">{accessError}</p>:<div className="max-h-72 overflow-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Lesson</th><th className="p-2">Access</th></tr></thead><tbody>{availability.map(l=><tr key={l.id} className="border-t"><td className="p-2">{l.title}</td><td className="p-2">{l.reason}</td></tr>)}</tbody></table></div>}</section>}
    <section className="grid gap-6 sm:grid-cols-2"><div><h2 className="mb-2 flex items-center gap-2 font-semibold"><Users className="size-5 text-primary" />What to check</h2><ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground"><li>Can this role find the next thing to do?</li><li>Are the expected lessons and tools available?</li><li>Do progress, feedback, and XP match what you expect?</li><li>Does the journey still make sense on an iPad?</li></ul></div><div><h2 className="mb-2 font-semibold">Inspect a lesson in detail</h2><p className="mb-3 text-sm text-muted-foreground">The saved-work inspector compares a student’s answers, feedback, and lesson availability in one place.</p>{session?.experience ? <button disabled={busy} onClick={inspectLesson} className="text-sm font-medium text-primary underline underline-offset-4">Return to admin and open lesson inspector</button> : <Link className="text-sm font-medium text-primary underline underline-offset-4" href="/admin/student-preview">Open student lesson inspector</Link>}</div></section>
  </div>
}
