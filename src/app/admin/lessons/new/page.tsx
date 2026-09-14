import { auth } from '@/lib/auth'
import { getEffectiveContext } from '@/lib/effective-context'
import { canEditArea } from '@/lib/content-access'
import { supabaseAdmin } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import NewLessonForm from '@/components/admin/NewLessonForm'
export default async function NewLessonPage() {
  const session = await auth(), email = session?.user?.email ?? ''
  if (!email) redirect('/home')
  const context = await getEffectiveContext(email)
  if (!await canEditArea(email, 'lessons', context.realRole === 'admin')) redirect('/admin/home')
  const r = await supabaseAdmin.from('units').select('id, name, program').order('order_index')
  if (r.error) throw r.error
  return <NewLessonForm units={r.data ?? []} />
}
