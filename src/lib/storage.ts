import type { UserCredentials } from "@/types"

const STORAGE_KEY = "spelling-bee-buddy-credentials"

/**
 * Get user credentials from localStorage
 * Returns null if no credentials are stored
 */
export function getCredentials(): UserCredentials | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored) as UserCredentials

    // Validate that both fields exist
    if (typeof parsed.nytToken === "string" && typeof parsed.anthropicKey === "string") {
      return parsed
    }

    return null
  } catch {
    return null
  }
}

/**
 * Save user credentials to localStorage
 */
export function saveCredentials(credentials: UserCredentials): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials))
}

/**
 * Remove user credentials from localStorage
 */
export function clearCredentials(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * Check if credentials are stored
 */
export function hasCredentials(): boolean {
  return getCredentials() !== null
}

/**
 * Update a single credential field
 */
export function updateCredential(key: keyof UserCredentials, value: string): void {
  const existing = getCredentials()
  const updated: UserCredentials = {
    nytToken: existing?.nytToken ?? "",
    anthropicKey: existing?.anthropicKey ?? "",
    [key]: value,
  }
  saveCredentials(updated)
}
