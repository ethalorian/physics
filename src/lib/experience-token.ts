import { EXPERIENCE_MAX_AGE, isUserRole, type RoleExperience } from './experience'

const encoder = new TextEncoder()
const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
const decode = (text: string) => Uint8Array.from(atob(text.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0))
async function key(secret: string) {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}
export async function signExperience(value: RoleExperience, secret: string): Promise<string> {
  if (!secret) throw new Error('Experience signing key unavailable')
  const payload = encode(encoder.encode(JSON.stringify(value)))
  const signature = await crypto.subtle.sign('HMAC', await key(secret), encoder.encode(payload))
  return payload + '.' + encode(new Uint8Array(signature))
}
export async function verifyExperience(token: string | undefined, secret: string | undefined, now = Date.now()): Promise<RoleExperience | null> {
  if (!token || !secret || token.length > 5000) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 2 || !await crypto.subtle.verify('HMAC', await key(secret), decode(parts[1]), encoder.encode(parts[0]))) return null
    const value = JSON.parse(new TextDecoder().decode(decode(parts[0]))) as RoleExperience
    if (!value || value.readOnly !== true || typeof value.id !== 'string' || !value.id || !Number.isFinite(value.expiresAt) || value.expiresAt <= now || value.expiresAt > now + EXPERIENCE_MAX_AGE * 1000 + 60000) return null
    for (const user of [value.actor, value.user]) {
      if (!user || typeof user.id !== 'string' || !user.id || typeof user.email !== 'string' || !user.email || typeof user.name !== 'string' || !isUserRole(user.role)) return null
    }
    return value.actor.role === 'admin' ? value : null
  } catch { return null }
}
