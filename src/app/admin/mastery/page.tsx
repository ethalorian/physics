import { redirect } from 'next/navigation'

// The early unit-1-only mastery dashboard was superseded by the full mastery
// analytics surface (all units, all classes). Old links land there.
export default function MasteryRedirect() {
  redirect('/admin/analytics')
}
