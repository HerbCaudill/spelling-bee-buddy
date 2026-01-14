import type { UserCredentials } from "@/types"

const STORAGE_KEY = "spelling-bee-buddy-credentials"

/**
 * Get credentials from environment variables (development only)
 */
function getEnvCredentials(): UserCredentials | null {
  const nytToken = import.meta.env.VITE_NYT_TOKEN
  const nytSubscriberId = import.meta.env.VITE_NYT_SUBSCRIBER_ID
  const anthropicKey = import.meta.env.VITE_ANTHROPIC_KEY

  if (nytToken && nytSubscriberId && anthropicKey) {
    return { nytToken, nytSubscriberId, anthropicKey }
  }
  return null
}

/**
 * Get user credentials from localStorage
 * In development, checks environment variables first
 * Returns null if no credentials are stored
 */
export function getCredentials(): UserCredentials | null {
  // In development, check env variables first
  if (import.meta.env.DEV) {
    const envCreds = getEnvCredentials()
    if (envCreds) return envCreds
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored) as UserCredentials

    // Validate that all fields exist
    if (
      typeof parsed.nytToken === "string" &&
      typeof parsed.nytSubscriberId === "string" &&
      typeof parsed.anthropicKey === "string"
    ) {
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
    nytSubscriberId: existing?.nytSubscriberId ?? "",
    anthropicKey: existing?.anthropicKey ?? "",
    [key]: value,
  }
  saveCredentials(updated)
}
