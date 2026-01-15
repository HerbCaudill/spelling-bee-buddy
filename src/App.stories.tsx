import type { Meta, StoryObj } from "@storybook/react-vite"
import { AppContent } from "./AppContent"
import { calculateTotalPoints } from "@/lib/utils"
import type { GameData, ActivePuzzlesResponse, HintsByPrefix, PuzzleStats } from "@/types"

// Import real data from examples
import puzzleData from "../examples/puzzle-data.json"
import activePuzzlesData from "../examples/active-puzzles.json"
import hintsData from "../examples/generated-hints.json"
import statsData from "../examples/puzzle-stats.json"

// Cast the imported data to the correct types
const todayPuzzle: GameData = puzzleData as GameData
const activePuzzles: ActivePuzzlesResponse = activePuzzlesData as ActivePuzzlesResponse
const allHints: HintsByPrefix = hintsData.hints as HintsByPrefix
const puzzleStats: PuzzleStats = statsData as PuzzleStats

// Calculate max points from the actual puzzle data
const maxPoints = calculateTotalPoints(todayPuzzle.today.answers, todayPuzzle.today.pangrams)

const meta: Meta<typeof AppContent> = {
  title: "Pages/Full screen",
  component: AppContent,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof AppContent>

// Default args shared across stories
const defaultArgs = {
  puzzle: todayPuzzle,
  activePuzzles: null, // No date picker at beginning
  selectedPuzzleId: todayPuzzle.today.id,
  maxPoints,
  hasCredentials: true,
  hasApiKey: true,
  progressLoading: false,
  hintsLoading: false,
  statsNotAvailableYet: false,
  progressError: null,
  hintsError: null,
  statsError: null,
  settingsOpen: false,
  onSettingsOpen: () => {},
  onSettingsClose: () => {},
  onSelectPuzzle: () => {},
  onRefresh: () => {},
  onSaveSettings: () => {},
}

/**
 * Just starting out - no words found yet, no stats available
 * This is what users see when they first open the puzzle for the day
 */
export const JustStarted: Story = {
  args: {
    ...defaultArgs,
    foundWords: [],
    currentPoints: 0,
    hints: allHints,
    stats: null,
    statsNotAvailableYet: true,
    hasCredentials: false,
    hasApiKey: false,
  },
}

/**
 * A few words found - early progress in the puzzle
 * User has found 5 words including some short ones
 */
export const EarlyProgress: Story = {
  args: {
    ...defaultArgs,
    foundWords: ["edit", "hide", "tide", "wide", "with"],
    currentPoints: calculateTotalPoints(
      ["edit", "hide", "tide", "wide", "with"],
      todayPuzzle.today.pangrams,
    ),
    hints: allHints,
    stats: puzzleStats,
    hasCredentials: true,
    hasApiKey: true,
  },
}

/**
 * Mid-progress - around "Nice" rank with a mix of words found
 * User has found about 25% of the points
 */
export const MidProgress: Story = {
  args: {
    ...defaultArgs,
    foundWords: [
      "died",
      "diet",
      "edit",
      "eight",
      "height",
      "hide",
      "high",
      "thigh",
      "tide",
      "tied",
      "tight",
      "twig",
      "twit",
      "weigh",
      "weight",
      "whit",
      "white",
      "wide",
      "width",
      "with",
    ],
    currentPoints: calculateTotalPoints(
      [
        "died",
        "diet",
        "edit",
        "eight",
        "height",
        "hide",
        "high",
        "thigh",
        "tide",
        "tied",
        "tight",
        "twig",
        "twit",
        "weigh",
        "weight",
        "whit",
        "white",
        "wide",
        "width",
        "with",
      ],
      todayPuzzle.today.pangrams,
    ),
    hints: allHints,
    stats: puzzleStats,
    activePuzzles, // Date picker available
    hasCredentials: true,
    hasApiKey: true,
  },
}

/**
 * Genius level - found 70% of points including the pangram
 * This is the level most dedicated players aim for
 */
export const GeniusLevel: Story = {
  args: {
    ...defaultArgs,
    foundWords: [
      "died",
      "diet",
      "dieted",
      "digit",
      "eddied",
      "edit",
      "edited",
      "eight",
      "eighth",
      "eightieth",
      "gigged",
      "height",
      "hide",
      "high",
      "thigh",
      "tide",
      "tided",
      "tidied",
      "tied",
      "tight",
      "tithe",
      "tithed",
      "twig",
      "twit",
      "weigh",
      "weighed",
      "weight",
      "weighted", // Pangram found!
      "whit",
      "white",
      "wide",
      "width",
      "with",
    ],
    currentPoints: calculateTotalPoints(
      [
        "died",
        "diet",
        "dieted",
        "digit",
        "eddied",
        "edit",
        "edited",
        "eight",
        "eighth",
        "eightieth",
        "gigged",
        "height",
        "hide",
        "high",
        "thigh",
        "tide",
        "tided",
        "tidied",
        "tied",
        "tight",
        "tithe",
        "tithed",
        "twig",
        "twit",
        "weigh",
        "weighed",
        "weight",
        "weighted",
        "whit",
        "white",
        "wide",
        "width",
        "with",
      ],
      todayPuzzle.today.pangrams,
    ),
    hints: allHints,
    stats: puzzleStats,
    activePuzzles,
    hasCredentials: true,
    hasApiKey: true,
  },
}

/**
 * Queen Bee - all words found!
 * The ultimate achievement, all words discovered
 */
export const QueenBee: Story = {
  args: {
    ...defaultArgs,
    foundWords: todayPuzzle.today.answers,
    currentPoints: maxPoints,
    hints: allHints, // Hints section will be hidden since all words are found
    stats: puzzleStats,
    activePuzzles,
    hasCredentials: true,
    hasApiKey: true,
  },
}
