import { useState } from "react"
import { AppContent } from "@/AppContent"
import { useSelectedPuzzle } from "@/hooks/useSelectedPuzzle"
import { useUserProgress } from "@/hooks/useUserProgress"
import { useHints } from "@/hooks/useHints"
import { usePuzzleStats } from "@/hooks/usePuzzleStats"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  const {
    puzzle,
    activePuzzles,
    selectedPuzzle,
    isLoading: puzzleLoading,
    error: puzzleError,
    maxPoints,
    selectPuzzle,
    refetch: refetchPuzzle,
  } = useSelectedPuzzle()

  const {
    foundWords,
    isLoading: progressLoading,
    error: progressError,
    hasCredentials,
    currentPoints,
    refetch: refetchProgress,
  } = useUserProgress(puzzle?.today.pangrams ?? [], !!puzzle, selectedPuzzle?.id)

  const {
    hints,
    isLoading: hintsLoading,
    error: hintsError,
    hasApiKey,
    refetch: refetchHints,
  } = useHints(!!puzzle, selectedPuzzle?.id)

  const {
    stats,
    isLoading: statsLoading,
    error: statsError,
    notAvailableYet: statsNotAvailableYet,
    refetch: refetchStats,
  } = usePuzzleStats(selectedPuzzle?.id ?? null, { enabled: !!selectedPuzzle })

  // Combined error - puzzle error is critical, progress error is not
  const criticalError = puzzleError

  // Handler for refresh
  const handleRefresh = async () => {
    await Promise.all([refetchPuzzle(), refetchProgress(), refetchHints(), refetchStats()])
  }

  // Initial loading state - only show full-page loader when we have no data yet
  // During refreshes, we keep the existing UI to avoid unmounting the settings modal
  if (puzzleLoading && !puzzle) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
          <p className="text-muted-foreground">Loading puzzle...</p>
        </div>
      </div>
    )
  }

  // Critical error state (can't load puzzle)
  if (criticalError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <AlertCircle className="text-destructive size-12" />
          <h1 className="text-xl font-semibold">Failed to load puzzle</h1>
          <p className="text-muted-foreground">{criticalError}</p>
          <Button onClick={refetchPuzzle} variant="outline">
            <RefreshCw className="mr-2 size-4" />
            Try again
          </Button>
        </div>
      </div>
    )
  }

  // No puzzle data (shouldn't happen if no error, but handle gracefully)
  if (!puzzle) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">No puzzle available</p>
      </div>
    )
  }

  return (
    <AppContent
      puzzle={puzzle}
      activePuzzles={activePuzzles}
      selectedPuzzleId={selectedPuzzle?.id ?? null}
      maxPoints={maxPoints}
      foundWords={foundWords}
      currentPoints={currentPoints}
      hints={hints}
      stats={stats && !statsLoading ? stats : null}
      hasCredentials={hasCredentials}
      hasApiKey={hasApiKey}
      progressLoading={progressLoading}
      hintsLoading={hintsLoading}
      statsNotAvailableYet={statsNotAvailableYet}
      progressError={progressError}
      hintsError={hintsError}
      statsError={statsError}
      settingsOpen={settingsOpen}
      onSettingsOpen={() => setSettingsOpen(true)}
      onSettingsClose={() => setSettingsOpen(false)}
      onSelectPuzzle={selectPuzzle}
      onRefresh={handleRefresh}
      onSaveSettings={handleRefresh}
    />
  )
}
