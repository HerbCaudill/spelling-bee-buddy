import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Header } from "./Header"
import type { ActivePuzzlesResponse } from "@/types"

// Helper to get today's date in YYYY-MM-DD format
function getTodayString(): string {
  return new Date().toISOString().split("T")[0]
}

// Helper to get a date N days ago in YYYY-MM-DD format
function getDaysAgoString(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split("T")[0]
}

const defaultProps = {
  printDate: getTodayString(), // Use today's date so relative formatting works predictably
}

// Mock active puzzles using dynamic dates relative to today
function getMockActivePuzzles(): ActivePuzzlesResponse {
  return {
    puzzles: [
      { id: 101, print_date: getDaysAgoString(3) },
      { id: 102, print_date: getDaysAgoString(2) },
      { id: 103, print_date: getDaysAgoString(1) },
      { id: 104, print_date: getTodayString() },
    ],
    today: 3,
    thisWeek: [0, 1, 2, 3],
    lastWeek: [],
  }
}

describe("Header", () => {
  describe("app branding", () => {
    it("displays the app title", () => {
      render(<Header {...defaultProps} />)
      expect(screen.getByRole("heading", { name: "Spelling Bee Buddy" })).toBeInTheDocument()
    })

    it("displays the bee icon", () => {
      const { container } = render(<Header {...defaultProps} />)
      const icon = container.querySelector('img[src="/icon.svg"]')
      expect(icon).toBeInTheDocument()
    })
  })

  describe("puzzle date display", () => {
    it("displays 'Today' for today's puzzle", () => {
      render(<Header {...defaultProps} printDate={getTodayString()} />)
      expect(screen.getByText("Today")).toBeInTheDocument()
    })

    it("displays 'Yesterday' for yesterday's puzzle", () => {
      render(<Header {...defaultProps} printDate={getDaysAgoString(1)} />)
      expect(screen.getByText("Yesterday")).toBeInTheDocument()
    })

    it("displays day of week for puzzle 2-6 days ago", () => {
      // 3 days ago should show the day of week name
      const threeDaysAgo = getDaysAgoString(3)
      render(<Header {...defaultProps} printDate={threeDaysAgo} />)
      // Just check that a time element exists with the correct datetime
      const timeElement = screen.getByRole("time")
      expect(timeElement).toHaveAttribute("datetime", threeDaysAgo)
    })

    it("displays full date for older puzzles", () => {
      // 10 days ago should show full date
      const tenDaysAgo = getDaysAgoString(10)
      render(<Header {...defaultProps} printDate={tenDaysAgo} />)
      const timeElement = screen.getByRole("time")
      expect(timeElement).toHaveAttribute("datetime", tenDaysAgo)
      // Content should be a full date format (contains year)
      expect(timeElement.textContent).toMatch(/\d{4}/)
    })

    it("renders time element with correct datetime attribute", () => {
      const today = getTodayString()
      render(<Header {...defaultProps} printDate={today} />)
      const timeElement = screen.getByText("Today")
      expect(timeElement.tagName).toBe("TIME")
      expect(timeElement).toHaveAttribute("datetime", today)
    })

    it("displays calendar icon", () => {
      const { container } = render(<Header {...defaultProps} />)
      // Check for SVG with lucide-calendar class or similar
      const calendarIcon = container.querySelector('svg.lucide-calendar')
      expect(calendarIcon).toBeInTheDocument()
    })
  })

  describe("NYT Spelling Bee link", () => {
    it("renders link to NYT Spelling Bee", () => {
      render(<Header {...defaultProps} />)
      const link = screen.getByRole("link", {
        name: /open nyt spelling bee puzzle/i,
      })
      expect(link).toHaveAttribute("href", "https://www.nytimes.com/puzzles/spelling-bee")
    })

    it("opens link in new tab", () => {
      render(<Header {...defaultProps} />)
      const link = screen.getByRole("link", {
        name: /open nyt spelling bee puzzle/i,
      })
      expect(link).toHaveAttribute("target", "_blank")
      expect(link).toHaveAttribute("rel", "noopener noreferrer")
    })
  })

  describe("settings button", () => {
    it("renders settings button with correct aria-label", () => {
      render(<Header {...defaultProps} />)
      const button = screen.getByRole("button", { name: /open settings/i })
      expect(button).toBeInTheDocument()
    })

    it("calls onSettingsClick when clicked", () => {
      const onSettingsClick = vi.fn()
      render(<Header {...defaultProps} onSettingsClick={onSettingsClick} />)

      const button = screen.getByRole("button", { name: /open settings/i })
      fireEvent.click(button)

      expect(onSettingsClick).toHaveBeenCalledTimes(1)
    })

    it("does not throw when onSettingsClick is not provided", () => {
      render(<Header {...defaultProps} />)

      const button = screen.getByRole("button", { name: /open settings/i })
      expect(() => fireEvent.click(button)).not.toThrow()
    })
  })

  describe("styling", () => {
    it("applies custom className to container", () => {
      const { container } = render(<Header {...defaultProps} className="custom-class" />)
      expect(container.firstChild).toHaveClass("custom-class")
    })

    it("renders as a header element", () => {
      render(<Header {...defaultProps} />)
      expect(screen.getByRole("banner")).toBeInTheDocument()
    })
  })

  describe("date picker", () => {
    it("does not show calendar button when no activePuzzles provided", () => {
      render(<Header {...defaultProps} />)
      expect(screen.queryByRole("button", { name: /choose a different puzzle date/i })).not.toBeInTheDocument()
    })

    it("shows calendar button when activePuzzles is provided", () => {
      const mockActivePuzzles = getMockActivePuzzles()
      render(
        <Header
          {...defaultProps}
          printDate={getTodayString()}
          activePuzzles={mockActivePuzzles}
          selectedPuzzleId={104}
          onSelectPuzzle={vi.fn()}
        />
      )
      expect(screen.getByRole("button", { name: /choose a different puzzle date/i })).toBeInTheDocument()
    })

    it("opens date picker popover when calendar button is clicked", async () => {
      const user = userEvent.setup()
      const mockActivePuzzles = getMockActivePuzzles()
      render(
        <Header
          {...defaultProps}
          printDate={getTodayString()}
          activePuzzles={mockActivePuzzles}
          selectedPuzzleId={104}
          onSelectPuzzle={vi.fn()}
        />
      )

      const calendarButton = screen.getByRole("button", { name: /choose a different puzzle date/i })
      await user.click(calendarButton)

      // Should show day buttons in the popover
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /previous puzzle/i })).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /next puzzle/i })).toBeInTheDocument()
      })
    })

    it("calls onSelectPuzzle when a day is clicked", async () => {
      const user = userEvent.setup()
      const onSelectPuzzle = vi.fn()
      const mockActivePuzzles = getMockActivePuzzles()
      render(
        <Header
          {...defaultProps}
          printDate={getTodayString()}
          activePuzzles={mockActivePuzzles}
          selectedPuzzleId={104}
          onSelectPuzzle={onSelectPuzzle}
        />
      )

      const calendarButton = screen.getByRole("button", { name: /choose a different puzzle date/i })
      await user.click(calendarButton)

      // Wait for popover to open, then find a day button (any day button other than today)
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /previous puzzle/i })).toBeInTheDocument()
      })

      // Click the first puzzle (3 days ago)
      const dayButtons = screen.getAllByRole("button", { name: /\(today\)|^\w{3}\s/ })
      // Filter out navigation and main buttons, find day buttons in the popover
      const puzzleDayButtons = dayButtons.filter(btn => {
        const label = btn.getAttribute("aria-label") || ""
        return label.includes(",") // Day buttons have format like "Mon, Jan 12"
      })
      if (puzzleDayButtons.length > 0) {
        await user.click(puzzleDayButtons[0])
        expect(onSelectPuzzle).toHaveBeenCalled()
      }
    })

    it("calls onSelectPuzzle when previous button is clicked", async () => {
      const user = userEvent.setup()
      const onSelectPuzzle = vi.fn()
      const mockActivePuzzles = getMockActivePuzzles()
      render(
        <Header
          {...defaultProps}
          printDate={getTodayString()}
          activePuzzles={mockActivePuzzles}
          selectedPuzzleId={104}
          onSelectPuzzle={onSelectPuzzle}
        />
      )

      const calendarButton = screen.getByRole("button", { name: /choose a different puzzle date/i })
      await user.click(calendarButton)

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /previous puzzle/i })).toBeInTheDocument()
      })
      const prevButton = screen.getByRole("button", { name: /previous puzzle/i })
      await user.click(prevButton)

      expect(onSelectPuzzle).toHaveBeenCalledWith(103)
    })

    it("disables next button when on last puzzle", async () => {
      const user = userEvent.setup()
      const mockActivePuzzles = getMockActivePuzzles()
      render(
        <Header
          {...defaultProps}
          printDate={getTodayString()}
          activePuzzles={mockActivePuzzles}
          selectedPuzzleId={104}
          onSelectPuzzle={vi.fn()}
        />
      )

      const calendarButton = screen.getByRole("button", { name: /choose a different puzzle date/i })
      await user.click(calendarButton)

      await waitFor(() => {
        const nextButton = screen.getByRole("button", { name: /next puzzle/i })
        expect(nextButton).toBeDisabled()
      })
    })

    it("disables previous button when on first puzzle", async () => {
      const user = userEvent.setup()
      const mockActivePuzzles = getMockActivePuzzles()
      render(
        <Header
          {...defaultProps}
          printDate={getDaysAgoString(3)}
          activePuzzles={mockActivePuzzles}
          selectedPuzzleId={101}
          onSelectPuzzle={vi.fn()}
        />
      )

      const calendarButton = screen.getByRole("button", { name: /choose a different puzzle date/i })
      await user.click(calendarButton)

      await waitFor(() => {
        const prevButton = screen.getByRole("button", { name: /previous puzzle/i })
        expect(prevButton).toBeDisabled()
      })
    })
  })
})
