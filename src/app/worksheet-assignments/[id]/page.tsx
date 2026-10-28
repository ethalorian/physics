import {auth} from '@/lib/auth'
import {redirect} from 'next/navigation'
import EnrollmentGate from '@/components/EnrollmentGate'
import WorksheetWork from '@/components/worksheets/WorksheetWork'
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;if(!(await auth())?.user)redirect('/auth/signin?callbackUrl='+encodeURIComponent('/worksheet-assignments/'+id));return <EnrollmentGate><WorksheetWork id={id}/></EnrollmentGate>}
