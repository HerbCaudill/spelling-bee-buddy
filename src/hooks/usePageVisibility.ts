import { useEffect } from "react"

/**
 * Calls the provided callback when the page becomes visible
 * (e.g., user switches back to the tab or back to the browser from another app).
 */
export const usePageVisibility = (onVisible: () => void) => {
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        onVisible()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("focus", onVisible)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("focus", onVisible)
    }
  }, [onVisible])
}
