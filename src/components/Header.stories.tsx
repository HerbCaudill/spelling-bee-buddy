import type { Meta, StoryObj } from "@storybook/react-vite"
import { Header } from "./Header"
import type { ActivePuzzlesResponse } from "@/types"

/**
 * Helper to get today's date in YYYY-MM-DD format
 */
function getTodayString(): string {
  return new Date().toISOString().split("T")[0]
}

/**
 * Helper to get a date N days ago in YYYY-MM-DD format
 */
function getDaysAgoString(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split("T")[0]
}

/**
 * Generate mock active puzzles for a given date range
 */
function createMockActivePuzzles(
  selectedDate: string,
  options?: { includeLastWeek?: boolean }
): { activePuzzles: ActivePuzzlesResponse; selectedPuzzleId: number } {
  // Generate puzzles for two weeks
  const puzzles = []
  const startDate = new Date(selectedDate + "T12:00:00")

  // Go back to start of last week (up to 14 days)
  const daysToGenerate = options?.includeLastWeek ? 14 : 7
  const startOffset = options?.includeLastWeek ? 13 : 6

  for (let i = startOffset; i >= 0; i--) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]
    puzzles.push({
      id: 100 + (daysToGenerate - i),
      center_letter: "a",
      outer_letters: "bcdefg",
      pangrams: ["example"],
      answers: ["example", "ace", "cab"],
      print_date: dateStr,
      editor: "Sam Ezersky",
    })
  }

  // Find today's index (the selected date)
  const todayIndex = puzzles.findIndex(p => p.print_date === selectedDate)

  // Calculate this week and last week indices
  const thisWeek: number[] = []
  const lastWeek: number[] = []

  puzzles.forEach((puzzle, index) => {
    const puzzleDate = new Date(puzzle.print_date + "T12:00:00")
    const daysSinceSelected = Math.floor(
      (startDate.getTime() - puzzleDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceSelected < 7) {
      thisWeek.push(index)
    } else {
      lastWeek.push(index)
    }
  })

  return {
    activePuzzles: {
      puzzles,
      today: todayIndex,
      yesterday: todayIndex > 0 ? todayIndex - 1 : 0,
      thisWeek,
      lastWeek,
    },
    selectedPuzzleId: puzzles[todayIndex]?.id ?? puzzles[0].id,
  }
}

const meta: Meta<typeof Header> = {
  title: "Components/Header",
  component: Header,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    printDate: {
      control: "text",
      description: "ISO date string (e.g., '2026-01-14')",
    },
    onSettingsClick: {
      action: "settings clicked",
      description: "Callback when settings button is clicked",
    },
    className: {
      control: "text",
      description: "Additional CSS classes for the container",
    },
    activePuzzles: {
      control: "object",
      description: "Active puzzles for the date picker",
    },
    selectedPuzzleId: {
      control: "number",
      description: "Currently selected puzzle ID",
    },
    onSelectPuzzle: {
      action: "puzzle selected",
      description: "Callback when a puzzle is selected from the date picker",
    },
  },
}

export default meta
type Story = StoryObj<typeof Header>

/**
 * Basic header showing "Today" - without date picker
 * Used when active puzzles data hasn't loaded yet
 */
export const TodayWithoutPicker: Story = {
  args: {
    printDate: getTodayString(),
  },
}

/**
 * Header showing "Yesterday"
 */
export const Yesterday: Story = {
  args: {
    printDate: getDaysAgoString(1),
  },
}

/**
 * Header showing day of week (for puzzles 2-6 days ago)
 */
export const DayOfWeek: Story = {
  args: {
    printDate: getDaysAgoString(3),
  },
}

/**
 * Header showing full date (for puzzles older than a week)
 */
export const OlderDate: Story = {
  args: {
    printDate: getDaysAgoString(10),
  },
}

/**
 * Header with date picker enabled showing "Today" - click the date to see available puzzles
 * Shows navigation arrows and week view for selecting different days
 */
export const WithDatePicker: Story = {
  args: {
    printDate: getTodayString(),
    ...createMockActivePuzzles(getTodayString()),
  },
}

/**
 * Date picker with both this week and last week puzzles available
 * Shows two rows of day buttons in the popover
 */
export const WithLastWeekPuzzles: Story = {
  args: {
    printDate: getTodayString(),
    ...createMockActivePuzzles(getTodayString(), { includeLastWeek: true }),
  },
}

/**
 * Yesterday's puzzle selected with date picker
 * Shows "Yesterday" as the relative date
 */
export const YesterdayWithPicker: Story = {
  args: {
    ...(() => {
      const data = createMockActivePuzzles(getTodayString())
      // Select yesterday's puzzle (second to last in the list)
      const yesterdayPuzzle = data.activePuzzles.puzzles[data.activePuzzles.puzzles.length - 2]
      return {
        ...data,
        printDate: yesterdayPuzzle?.print_date ?? getDaysAgoString(1),
        selectedPuzzleId: yesterdayPuzzle?.id ?? data.selectedPuzzleId,
      }
    })(),
  },
}

/**
 * Older puzzle selected - shows day of week
 * 3 days ago shows the day name (e.g., "Monday")
 */
export const OlderPuzzleWithPicker: Story = {
  args: {
    ...(() => {
      const data = createMockActivePuzzles(getTodayString(), { includeLastWeek: true })
      // Select a puzzle from 3 days ago
      const olderPuzzle = data.activePuzzles.puzzles.find(p => {
        const puzzleDate = new Date(p.print_date + "T12:00:00")
        const today = new Date()
        const diffDays = Math.round((today.getTime() - puzzleDate.getTime()) / (1000 * 60 * 60 * 24))
        return diffDays === 3
      })
      return {
        ...data,
        printDate: olderPuzzle?.print_date ?? getDaysAgoString(3),
        selectedPuzzleId: olderPuzzle?.id ?? data.selectedPuzzleId,
      }
    })(),
  },
}

/**
 * First puzzle in the list - previous button disabled
 * Useful for testing edge case when user is at the beginning of available puzzles
 */
export const FirstPuzzleSelected: Story = {
  args: {
    ...(() => {
      const data = createMockActivePuzzles(getTodayString(), { includeLastWeek: true })
      // Select the first puzzle
      const firstPuzzle = data.activePuzzles.puzzles[0]
      return {
        ...data,
        printDate: firstPuzzle?.print_date ?? getDaysAgoString(13),
        selectedPuzzleId: firstPuzzle?.id ?? data.activePuzzles.puzzles[0].id,
      }
    })(),
  },
}

/**
 * Last puzzle in the list (today) - next button disabled
 * The most common case - today's puzzle selected
 */
export const LastPuzzleSelected: Story = {
  args: {
    printDate: getTodayString(),
    ...(() => {
      const data = createMockActivePuzzles(getTodayString())
      // Select the last puzzle
      const lastPuzzle = data.activePuzzles.puzzles[data.activePuzzles.puzzles.length - 1]
      return {
        ...data,
        selectedPuzzleId: lastPuzzle.id,
      }
    })(),
  },
}

/**
 * With custom className applied to container
 */
export const WithCustomClassName: Story = {
  args: {
    printDate: getTodayString(),
    className: "bg-amber-50",
  },
}
