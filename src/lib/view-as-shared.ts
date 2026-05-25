// Client-safe constants/helpers for "view as teacher". Kept separate from
// effective-context.ts (which imports next/headers and is server-only).

export const VIEW_AS_COOKIE = 'view_as_teacher'

export function readViewAsCookie(): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|; )view_as_teacher=([^;]*)/)
  return m ? decodeURIComponent(m[1]) : null
}

export function setViewAs(email: string): void {
  document.cookie = `${VIEW_AS_COOKIE}=${encodeURIComponent(email)}; path=/; max-age=86400; samesite=lax`
}

export function clearViewAs(): void {
  document.cookie = `${VIEW_AS_COOKIE}=; path=/; max-age=0; samesite=lax`
}
