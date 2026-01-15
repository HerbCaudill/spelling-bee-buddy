import { useState } from "react"
import { Header } from "@/components/Header"
import { ProgressBar } from "@/components/ProgressBar"
import { WordGrid } from "@/components/WordGrid"
import { TwoLetterList } from "@/components/TwoLetterList"
import { HintsList } from "@/components/HintsList"
import { SettingsModal } from "@/components/SettingsModal"
import { StatsDisplay, StatsNotAvailable } from "@/components/StatsDisplay"
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
    isToday,
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
  } = useUserProgress(puzzle?.today.pangrams ?? [], !!puzzle && isToday)

  const {
    hints,
    isLoading: hintsLoading,
    error: hintsError,
    hasApiKey,
    refetch: refetchHints,
  } = useHints(!!puzzle && isToday)

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

  const { today } = puzzle

  // For non-today puzzles, we don't have progress tracking
  const effectiveFoundWords = isToday ? foundWords : []

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <Header
        displayWeekday={today.displayWeekday}
        displayDate={today.displayDate}
        printDate={today.printDate}
        onSettingsClick={() => setSettingsOpen(true)}
        activePuzzles={activePuzzles}
        selectedPuzzleId={selectedPuzzle?.id ?? null}
        onSelectPuzzle={selectPuzzle}
      />

      {/* Main content */}
      <main className="container mx-auto max-w-4xl space-y-8 px-4 py-6">
        {/* Notice for past puzzles */}
        {!isToday && (
          <div className="border-border bg-muted/50 rounded-lg border p-4 text-sm">
            <p className="text-muted-foreground">
              Viewing a past puzzle. Progress tracking and hints are only available for today's
              puzzle.
            </p>
          </div>
        )}

        {/* Progress section - only show for today's puzzle */}
        {isToday && (
          <section aria-label="Progress">
            {!hasCredentials && (
              <div className="border-border bg-muted/50 mb-4 rounded-lg border p-4 text-sm">
                <p className="text-muted-foreground">
                  <strong>Tip:</strong> Click the settings icon to add your NYT token and track your
                  progress.
                </p>
              </div>
            )}

            {progressError && (
              <div className="border-destructive/50 bg-destructive/10 mb-4 rounded-lg border p-4 text-sm">
                <p className="text-destructive">{progressError}</p>
              </div>
            )}

            <ProgressBar
              currentPoints={currentPoints}
              maxPoints={maxPoints}
              pangrams={today.pangrams}
              foundWords={foundWords}
              className={progressLoading ? "opacity-50" : ""}
            />
          </section>
        )}

        {/* Stats section */}
        {statsNotAvailableYet && (
          <section aria-label="Player stats">
            <StatsNotAvailable />
          </section>
        )}

        {stats && !statsLoading && (
          <section aria-label="Player stats">
            <StatsDisplay stats={stats} allWords={today.answers} foundWords={effectiveFoundWords} />
          </section>
        )}

        {statsError && (
          <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-4 text-sm">
            <p className="text-destructive">{statsError}</p>
          </div>
        )}

        {/* Word Grid section */}
        <section aria-label="Word grid">
          <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
            Word grid
          </h2>
          <WordGrid allWords={today.answers} foundWords={effectiveFoundWords} />
        </section>

        {/* Two-Letter List section */}
        <section aria-label="Two-letter list">
          <TwoLetterList allWords={today.answers} foundWords={effectiveFoundWords} />
        </section>

        {/* Hints section - only show for today's puzzle */}
        {isToday && (
          <section aria-label="Hints">
            {!hasApiKey && (
              <div className="border-border bg-muted/50 mb-4 rounded-lg border p-4 text-sm">
                <p className="text-muted-foreground">
                  <strong>Tip:</strong> Add your Anthropic API key in settings to see AI-generated
                  hints.
                </p>
              </div>
            )}

            {hintsError && (
              <div className="border-destructive/50 bg-destructive/10 mb-4 rounded-lg border p-4 text-sm">
                <p className="text-destructive">{hintsError}</p>
              </div>
            )}

            {hintsLoading && (
              <div className="text-muted-foreground flex items-center justify-center gap-2 py-8">
                <Loader2 className="size-4 animate-spin" />
                <span>Generating hints...</span>
              </div>
            )}

            {hints && !hintsLoading && <HintsList hints={hints} foundWords={foundWords} />}
          </section>
        )}

        {/* Refresh button - only show for today's puzzle */}
        {isToday && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={puzzleLoading || progressLoading}
            >
              <RefreshCw className={`mr-2 size-4 ${progressLoading ? "animate-spin" : ""}`} />
              Refresh progress
            </Button>
          </div>
        )}
      </main>

      {/* Settings modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={handleRefresh}
      />
    </div>
  )
}
