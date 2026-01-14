import { useState } from "react"
import { Header } from "@/components/Header"
import { ProgressBar } from "@/components/ProgressBar"
import { WordGrid } from "@/components/WordGrid"
import { TwoLetterList } from "@/components/TwoLetterList"
import { HintsList } from "@/components/HintsList"
import { SettingsModal } from "@/components/SettingsModal"
import { usePuzzle } from "@/hooks/usePuzzle"
import { useUserProgress } from "@/hooks/useUserProgress"
import { useHints } from "@/hooks/useHints"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export function App() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  const { puzzle, isLoading: puzzleLoading, error: puzzleError, maxPoints, refetch: refetchPuzzle } = usePuzzle()

  const {
    foundWords,
    isLoading: progressLoading,
    error: progressError,
    hasCredentials,
    currentPoints,
    refetch: refetchProgress,
  } = useUserProgress(puzzle?.today.pangrams ?? [], !!puzzle)

  const {
    hints,
    isLoading: hintsLoading,
    error: hintsError,
    hasApiKey,
    refetch: refetchHints,
  } = useHints(!!puzzle)

  // Combined loading state - show loading while puzzle is fetching
  const isLoading = puzzleLoading

  // Combined error - puzzle error is critical, progress error is not
  const criticalError = puzzleError

  // Handler for refresh
  const handleRefresh = async () => {
    await Promise.all([refetchPuzzle(), refetchProgress(), refetchHints()])
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading puzzle...</p>
        </div>
      </div>
    )
  }

  // Critical error state (can't load puzzle)
  if (criticalError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="size-12 text-destructive" />
          <h1 className="text-xl font-semibold">Failed to Load Puzzle</h1>
          <p className="text-muted-foreground">{criticalError}</p>
          <Button onClick={refetchPuzzle} variant="outline">
            <RefreshCw className="size-4 mr-2" />
            Try Again
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header
        displayWeekday={today.displayWeekday}
        displayDate={today.displayDate}
        printDate={today.printDate}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      {/* Main content */}
      <main className="container mx-auto px-4 py-6 space-y-8 max-w-4xl">
        {/* Progress section */}
        <section aria-label="Progress">
          {!hasCredentials && (
            <div className="mb-4 rounded-lg border border-border bg-muted/50 p-4 text-sm">
              <p className="text-muted-foreground">
                <strong>Tip:</strong> Click the settings icon to add your NYT token and track your progress.
              </p>
            </div>
          )}

          {progressError && (
            <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
              <p className="text-destructive">{progressError}</p>
            </div>
          )}

          <ProgressBar
            currentPoints={currentPoints}
            maxPoints={maxPoints}
            className={progressLoading ? "opacity-50" : ""}
          />
        </section>

        {/* Word Grid section */}
        <section aria-label="Word grid">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Word Grid
          </h2>
          <WordGrid
            allWords={today.answers}
            foundWords={foundWords}
          />
        </section>

        {/* Two-Letter List section */}
        <section aria-label="Two-letter list">
          <TwoLetterList
            allWords={today.answers}
            foundWords={foundWords}
          />
        </section>

        {/* Hints section */}
        <section aria-label="Hints">
          {!hasApiKey && (
            <div className="mb-4 rounded-lg border border-border bg-muted/50 p-4 text-sm">
              <p className="text-muted-foreground">
                <strong>Tip:</strong> Add your Anthropic API key in settings to see AI-generated hints.
              </p>
            </div>
          )}

          {hintsError && (
            <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
              <p className="text-destructive">{hintsError}</p>
            </div>
          )}

          {hintsLoading && (
            <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              <span>Generating hints...</span>
            </div>
          )}

          {hints && !hintsLoading && (
            <HintsList hints={hints} foundWords={foundWords} />
          )}
        </section>

        {/* Refresh button */}
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading || progressLoading}
          >
            <RefreshCw className={`size-4 mr-2 ${progressLoading ? "animate-spin" : ""}`} />
            Refresh Progress
          </Button>
        </div>
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
