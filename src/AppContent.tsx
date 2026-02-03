import { Header } from "@/components/Header"
import { ProgressBar } from "@/components/ProgressBar"
import { WordGrid } from "@/components/WordGrid"
import { TwoLetterList } from "@/components/TwoLetterList"
import { HintsList } from "@/components/HintsList"
import { SettingsModal } from "@/components/SettingsModal"
import { StatsDisplay, StatsNotAvailable } from "@/components/StatsDisplay"
import { IconRefresh, IconLoader2 } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import type { GameData, ActivePuzzlesResponse, HintsByPrefix, PuzzleStats } from "@/types"

/**
 * Presentational component for the main app content.
 * Receives all data via props, making it easy to test and use in Storybook.
 */
export function AppContent({
  puzzle,
  activePuzzles,
  selectedPuzzleId,
  maxPoints,
  foundWords,
  currentPoints,
  hints,
  stats,
  hasCredentials,
  hasApiKey,
  progressLoading,
  hintsLoading,
  statsNotAvailableYet,
  progressError,
  hintsError,
  statsError,
  settingsOpen,
  onSettingsOpen,
  onSettingsClose,
  onSelectPuzzle,
  onRefresh,
  onSaveSettings,
}: Props) {
  const { today } = puzzle

  // Check if all words have been found
  const allWordsFound = foundWords.length >= today.answers.length

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <Header
        printDate={today.printDate}
        onSettingsClick={onSettingsOpen}
        activePuzzles={activePuzzles ?? undefined}
        selectedPuzzleId={selectedPuzzleId}
        onSelectPuzzle={onSelectPuzzle}
      />

      {/* Main content */}
      <main className="container mx-auto max-w-4xl space-y-8 px-4 py-6">
        {/* Progress section */}
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

        {/* Word Grid section */}
        <section aria-label="Word grid">
          <h2 className="text-muted-foreground mb-3 text-sm font-semibold tracking-wide uppercase">
            Word grid
          </h2>
          <WordGrid allWords={today.answers} foundWords={foundWords} />
        </section>

        {/* Two-Letter List section */}
        <section aria-label="Two-letter list">
          <TwoLetterList allWords={today.answers} foundWords={foundWords} />
        </section>

        {/* Stats section - you vs other players */}
        {statsNotAvailableYet && (
          <section aria-label="Player stats">
            <StatsNotAvailable />
          </section>
        )}

        {stats && (
          <section aria-label="Player stats">
            <StatsDisplay stats={stats} allWords={today.answers} foundWords={foundWords} />
          </section>
        )}

        {statsError && (
          <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-4 text-sm">
            <p className="text-destructive">{statsError}</p>
          </div>
        )}

        {/* Hints section - hidden when all words are found */}
        {!allWordsFound && (
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
                <IconLoader2 className="size-4 animate-spin" />
                <span>Generating hints...</span>
              </div>
            )}

            {hints && !hintsLoading && <HintsList hints={hints} foundWords={foundWords} />}
          </section>
        )}

        {/* Refresh button */}
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onRefresh} disabled={progressLoading}>
            <IconRefresh className={`mr-2 size-4 ${progressLoading ? "animate-spin" : ""}`} />
            Refresh progress
          </Button>
        </div>
      </main>

      {/* Settings modal */}
      <SettingsModal isOpen={settingsOpen} onClose={onSettingsClose} onSave={onSaveSettings} />
    </div>
  )
}

type Props = {
  puzzle: GameData
  activePuzzles: ActivePuzzlesResponse | null
  selectedPuzzleId: number | null
  maxPoints: number
  foundWords: string[]
  currentPoints: number
  hints: HintsByPrefix | null
  stats: PuzzleStats | null
  hasCredentials: boolean
  hasApiKey: boolean
  progressLoading: boolean
  hintsLoading: boolean
  statsNotAvailableYet: boolean
  progressError: string | null
  hintsError: string | null
  statsError: string | null
  settingsOpen: boolean
  onSettingsOpen: () => void
  onSettingsClose: () => void
  onSelectPuzzle: (puzzleId: number) => void
  onRefresh: () => void
  onSaveSettings: () => void
}
