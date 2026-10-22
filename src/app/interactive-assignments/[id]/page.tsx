import VelocityAssignment from '@/components/interactive-assignments/VelocityAssignment'
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <VelocityAssignment key={id} id={id}/>}
