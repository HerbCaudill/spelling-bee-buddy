import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Header } from "./Header"
import type { ActivePuzzlesResponse } from "@/types"

const defaultProps = {
  displayWeekday: "Wednesday",
  displayDate: "January 14, 2026",
  printDate: "2026-01-14",
}

const mockActivePuzzles: ActivePuzzlesResponse = {
  puzzles: [
    { id: 101, print_date: "2026-01-12" },
    { id: 102, print_date: "2026-01-13" },
    { id: 103, print_date: "2026-01-14" },
  ],
  today: 2,
  thisWeek: [0, 1, 2],
  lastWeek: [],
}

describe("Header", () => {
  describe("puzzle date display", () => {
    it("displays the weekday", () => {
      render(<Header {...defaultProps} />)
      expect(screen.getByText("Wednesday")).toBeInTheDocument()
    })

    it("displays the full date", () => {
      render(<Header {...defaultProps} />)
      expect(screen.getByText("January 14, 2026")).toBeInTheDocument()
    })

    it("renders time element with correct datetime attribute", () => {
      render(<Header {...defaultProps} />)
      const timeElement = screen.getByText("January 14, 2026")
      expect(timeElement.tagName).toBe("TIME")
      expect(timeElement).toHaveAttribute("datetime", "2026-01-14")
    })

    it("displays different dates correctly", () => {
      render(<Header displayWeekday="Friday" displayDate="March 20, 2026" printDate="2026-03-20" />)
      expect(screen.getByText("Friday")).toBeInTheDocument()
      expect(screen.getByText("March 20, 2026")).toBeInTheDocument()
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
      render(
        <Header
          {...defaultProps}
          activePuzzles={mockActivePuzzles}
          selectedPuzzleId={103}
          onSelectPuzzle={vi.fn()}
        />
      )
      expect(screen.getByRole("button", { name: /choose a different puzzle date/i })).toBeInTheDocument()
    })

    it("opens date picker popover when calendar button is clicked", async () => {
      const user = userEvent.setup()
      render(
        <Header
          {...defaultProps}
          activePuzzles={mockActivePuzzles}
          selectedPuzzleId={103}
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
      render(
        <Header
          {...defaultProps}
          activePuzzles={mockActivePuzzles}
          selectedPuzzleId={103}
          onSelectPuzzle={onSelectPuzzle}
        />
      )

      const calendarButton = screen.getByRole("button", { name: /choose a different puzzle date/i })
      await user.click(calendarButton)

      // Click on a different day (Mon Jan 12)
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /mon, jan 12/i })).toBeInTheDocument()
      })
      const dayButton = screen.getByRole("button", { name: /mon, jan 12/i })
      await user.click(dayButton)

      expect(onSelectPuzzle).toHaveBeenCalledWith(101)
    })

    it("calls onSelectPuzzle when previous button is clicked", async () => {
      const user = userEvent.setup()
      const onSelectPuzzle = vi.fn()
      render(
        <Header
          {...defaultProps}
          activePuzzles={mockActivePuzzles}
          selectedPuzzleId={103}
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

      expect(onSelectPuzzle).toHaveBeenCalledWith(102)
    })

    it("disables next button when on last puzzle", async () => {
      const user = userEvent.setup()
      render(
        <Header
          {...defaultProps}
          activePuzzles={mockActivePuzzles}
          selectedPuzzleId={103}
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
      render(
        <Header
          {...defaultProps}
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
