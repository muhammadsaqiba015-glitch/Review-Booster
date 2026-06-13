// Map a plain username to a synthetic email so Supabase Auth (which requires an
// email identifier) can be used with username + password only. No real emails
// are ever sent — email confirmation must be disabled in Supabase settings.
export function usernameToEmail(username: string): string {
  return `${username.trim().toLowerCase()}@reviewboost.app`
}

// Basic username rules: letters, numbers, underscores, 3-30 chars
export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_]{3,30}$/i.test(username.trim())
}
