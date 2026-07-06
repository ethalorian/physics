import { notFound } from 'next/navigation'
import DevLoginForm from './DevLoginForm'

/**
 * Dev-only test login (Surface 17). This route exists so the quick-login
 * buttons, manual credentials form, and test passwords live OFF the shipped
 * sign-in page. The server component 404s outside development, so none of it
 * is reachable (and the form component isn't referenced) in production.
 */
export default function DevLoginPage() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <DevLoginForm />
}
