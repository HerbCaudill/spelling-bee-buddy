import type { Meta, StoryObj } from "@storybook/react-vite"
import { Header } from "./Header"
import type { ActivePuzzlesResponse } from "@/types"

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
    displayWeekday: {
      control: "text",
      description: "Day of the week (e.g., 'Wednesday')",
    },
    displayDate: {
      control: "text",
      description: "Full date display (e.g., 'January 14, 2026')",
    },
    printDate: {
      control: "text",
      description: "ISO date for URL construction (e.g., '2026-01-14')",
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
 * Basic header without date picker - displays date as static text
 * Used when active puzzles data hasn't loaded yet
 */
export const WithoutDatePicker: Story = {
  args: {
    displayWeekday: "Wednesday",
    displayDate: "January 14, 2026",
    printDate: "2026-01-14",
  },
}

/**
 * Header with date picker enabled - click the date to see available puzzles
 * Shows navigation arrows and week view for selecting different days
 */
export const WithDatePicker: Story = {
  args: {
    displayWeekday: "Wednesday",
    displayDate: "January 14, 2026",
    printDate: "2026-01-14",
    ...createMockActivePuzzles("2026-01-14"),
  },
}

/**
 * Date picker with both this week and last week puzzles available
 * Shows two rows of day buttons in the popover
 */
export const WithLastWeekPuzzles: Story = {
  args: {
    displayWeekday: "Wednesday",
    displayDate: "January 14, 2026",
    printDate: "2026-01-14",
    ...createMockActivePuzzles("2026-01-14", { includeLastWeek: true }),
  },
}

/**
 * Monday puzzle - beginning of the week
 */
export const MondayPuzzle: Story = {
  args: {
    displayWeekday: "Monday",
    displayDate: "January 12, 2026",
    printDate: "2026-01-12",
    ...createMockActivePuzzles("2026-01-12"),
  },
}

/**
 * Sunday puzzle - end of the week
 */
export const SundayPuzzle: Story = {
  args: {
    displayWeekday: "Sunday",
    displayDate: "January 18, 2026",
    printDate: "2026-01-18",
    ...createMockActivePuzzles("2026-01-18"),
  },
}

/**
 * Different month - showing date display flexibility
 */
export const DifferentMonth: Story = {
  args: {
    displayWeekday: "Friday",
    displayDate: "March 20, 2026",
    printDate: "2026-03-20",
    ...createMockActivePuzzles("2026-03-20"),
  },
}

/**
 * First puzzle in the list - previous button disabled
 * Useful for testing edge case when user is at the beginning of available puzzles
 */
export const FirstPuzzleSelected: Story = {
  args: {
    displayWeekday: "Wednesday",
    displayDate: "January 14, 2026",
    printDate: "2026-01-14",
    ...(() => {
      const data = createMockActivePuzzles("2026-01-14")
      // Select the first puzzle
      return {
        ...data,
        selectedPuzzleId: data.activePuzzles.puzzles[0].id,
      }
    })(),
  },
}

/**
 * Last puzzle in the list - next button disabled
 * The most common case - today's puzzle selected
 */
export const LastPuzzleSelected: Story = {
  args: {
    displayWeekday: "Wednesday",
    displayDate: "January 14, 2026",
    printDate: "2026-01-14",
    ...(() => {
      const data = createMockActivePuzzles("2026-01-14")
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
    displayWeekday: "Wednesday",
    displayDate: "January 14, 2026",
    printDate: "2026-01-14",
    className: "bg-amber-50",
  },
}
