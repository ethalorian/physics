import { withAuth } from '@/lib/api-auth'
import { saveAvatar } from '@/lib/avatar/server'
// Revisioned trait patches stay drafts; only complete:true finishes setup.
export const POST = withAuth(saveAvatar)
