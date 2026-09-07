import { withAuth } from '@/lib/api-auth'
import { saveAvatar } from '@/lib/avatar/server'
export const POST = withAuth(saveAvatar)
