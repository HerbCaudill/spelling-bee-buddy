import { useState, useEffect, useCallback } from "react"
import { fetchHints, ApiError } from "@/lib/api"
import { getCredentials } from "@/lib/storage"
import type { CachedHints, HintsByPrefix } from "@/types"

/**
 * Hook state for hints data
 */
export interface UseHintsState {
  /** The hints grouped by two-letter prefix */
  hints: HintsByPrefix | null
  /** When the hints were generated */
  generatedAt: string | null
  /** Whether hints are currently loading */
  isLoading: boolean
  /** Error message if loading failed */
  error: string | null
  /** Whether Anthropic API key is configured */
  hasApiKey: boolean
}

/**
 * Hook return type
 */
export interface UseHintsReturn extends UseHintsState {
  /** Refetch the hints */
  refetch: () => Promise<void>
}

/**
 * Hook to fetch and manage puzzle hints
 *
 * Requires Anthropic API key to be stored in localStorage.
 * If no API key is stored, returns null hints.
 *
 * @param enabled - Whether to fetch hints (defaults to true)
 * @param puzzleId - Optional puzzle ID to get hints for a specific puzzle
 *
 * @example
 * ```tsx
 * function HintsDisplay() {
 *   const { hints, generatedAt, isLoading, error, hasApiKey, refetch } = useHints(true, 20035)
 *
 *   if (!hasApiKey) return <div>Please configure Anthropic API key</div>
 *   if (isLoading) return <div>Loading hints...</div>
 *   if (error) return <div>Error: {error}</div>
 *   if (!hints) return null
 *
 *   return (
 *     <div>
 *       <p>Generated at: {generatedAt}</p>
 *       {Object.entries(hints).map(([prefix, hintList]) => (
 *         <div key={prefix}>
 *           <h3>{prefix.toUpperCase()}</h3>
 *           <ul>
 *             {hintList.map((hint, i) => (
 *               <li key={i}>{hint.hint} ({hint.length} letters)</li>
 *             ))}
 *           </ul>
 *         </div>
 *       ))}
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useHints(enabled: boolean = true, puzzleId?: number): UseHintsReturn {
  const [hints, setHints] = useState<HintsByPrefix | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasApiKey, setHasApiKey] = useState(false)

  const fetchData = useCallback(async () => {
    const credentials = getCredentials()
    setHasApiKey(credentials !== null && credentials.anthropicKey !== "")

    if (!credentials || !credentials.anthropicKey) {
      setHints(null)
      setGeneratedAt(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data: CachedHints = await fetchHints(credentials.anthropicKey, puzzleId)
      setHints(data.hints)
      setGeneratedAt(data.generatedAt)
    } catch (err) {
      if (err instanceof ApiError) {
        // Handle 401 specifically - likely invalid API key
        if (err.status === 401) {
          setError("Invalid Anthropic API key. Please update your credentials.")
        } else if (err.status === 404) {
          setError("Hints are only available for puzzles from the last two weeks.")
        } else {
          setError(err.message)
        }
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("Failed to load hints")
      }
      setHints(null)
      setGeneratedAt(null)
    } finally {
      setIsLoading(false)
    }
  }, [puzzleId])

  useEffect(() => {
    if (enabled) {
      fetchData()
    }
  }, [fetchData, enabled])

  return {
    hints,
    generatedAt,
    isLoading,
    error,
    hasApiKey,
    refetch: fetchData,
  }
}
