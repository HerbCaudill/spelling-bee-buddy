import { useEffect } from "react"

/**
 * Calls the provided callback when the page becomes visible (e.g., user switches back to the tab).
 */
export const usePageVisibility = (onVisible: () => void) => {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        onVisible()
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [onVisible])
}
