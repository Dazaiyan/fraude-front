export interface AppUser {
  name: string
  role: string
  email?: string
}

const STORAGE_KEY = "shieldmind-user"

export function getUserInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export function loadStoredUser(): AppUser | null {
  if (typeof window === "undefined") return null

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as AppUser
    if (!parsed?.name?.trim()) return null

    return {
      name: parsed.name.trim(),
      role: parsed.role?.trim() || "Analista de Fraude",
      email: parsed.email?.trim() || undefined,
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function saveUser(user: AppUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function clearUser(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function appUserFromGmailScan(user: { email: string; name: string; role: string }): AppUser {
  return {
    name: user.name.trim() || user.email,
    role: user.role.trim() || "Analista de Fraude",
    email: user.email.trim() || undefined,
  }
}
