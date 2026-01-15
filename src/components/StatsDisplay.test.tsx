import { render, screen } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { StatsDisplay, StatsNotAvailable } from "./StatsDisplay"
import type { PuzzleStats } from "@/types"

const mockStats: PuzzleStats = {
  id: 12345,
  n: 1000, // Sample size - percentages are based on this
  numberOfUsers: 5000, // Total players - different from n to verify we use n
  answers: {
    able: 900,
    about: 800,
    apple: 500,
    axle: 100,
  },
}

describe("StatsDisplay", () => {
  describe("rendering", () => {
    it("returns null when stats is null", () => {
      const { container } = render(
        <StatsDisplay stats={null} allWords={["able"]} foundWords={[]} />,
      )
      expect(container.firstChild).toBeNull()
    })

    it("shows player count (using numberOfUsers, not n)", () => {
      render(<StatsDisplay stats={mockStats} allWords={["able"]} foundWords={[]} />)
      // Should display numberOfUsers (5000), not n (1000)
      expect(screen.getByText("5,000 players")).toBeInTheDocument()
    })

    it("shows the section header", () => {
      render(<StatsDisplay stats={mockStats} allWords={["able"]} foundWords={[]} />)
      expect(screen.getByText("You vs other players")).toBeInTheDocument()
    })
  })

  describe("word display", () => {
    it("shows the full word for found words", () => {
      const allWords = ["able", "about"]
      const foundWords = ["able"]

      render(<StatsDisplay stats={mockStats} allWords={allWords} foundWords={foundWords} />)

      // Found word should show the full word
      expect(screen.getByText("able")).toBeInTheDocument()
    })

    it("shows first letter and length for unfound words", () => {
      const allWords = ["able", "about"]
      const foundWords = ["able"]

      render(<StatsDisplay stats={mockStats} allWords={allWords} foundWords={foundWords} />)

      // Unfound word "about" (5 letters) should show "A (5)" with the letter in bold
      // The text is split across elements so we use a function matcher
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === "A (5)" && element?.tagName.toLowerCase() === "span"
        }),
      ).toBeInTheDocument()
    })

    it("handles case-insensitive word matching", () => {
      const allWords = ["ABLE", "About"]
      const foundWords = ["able", "ABOUT"]

      render(<StatsDisplay stats={mockStats} allWords={allWords} foundWords={foundWords} />)

      // Both should show as found (full word displayed)
      expect(screen.getByText("ABLE")).toBeInTheDocument()
      expect(screen.getByText("About")).toBeInTheDocument()
    })

    it("shows words sorted by popularity (most found first)", () => {
      const allWords = ["axle", "apple", "able", "about"]
      const foundWords: string[] = []

      const { container } = render(
        <StatsDisplay stats={mockStats} allWords={allWords} foundWords={foundWords} />,
      )

      // Get all word displays in order
      const wordDisplays = container.querySelectorAll(".font-mono")
      const texts = Array.from(wordDisplays).map(el => el.textContent)

      // Should be sorted: able (90%), about (80%), apple (50%), axle (10%)
      expect(texts[0]).toBe("A (4)") // able
      expect(texts[1]).toBe("A (5)") // about
      expect(texts[2]).toBe("A (5)") // apple
      expect(texts[3]).toBe("A (4)") // axle
    })
  })

  describe("percentage display", () => {
    it("calculates percentage using n (sample size), not numberOfUsers", () => {
      const allWords = ["able"]
      const foundWords: string[] = []

      render(<StatsDisplay stats={mockStats} allWords={allWords} foundWords={foundWords} />)

      // "able" has 900 finds, n=1000, numberOfUsers=5000
      // Percentage should be 900/1000 = 90% (using n)
      // NOT 900/5000 = 18% (which would be wrong)
      expect(screen.getByText("90%")).toBeInTheDocument()
    })

    it("shows one decimal place for low percentages", () => {
      const statsWithLowPct: PuzzleStats = {
        id: 12345,
        n: 1000,
        numberOfUsers: 1000,
        answers: {
          rare: 50, // 5%
        },
      }

      render(<StatsDisplay stats={statsWithLowPct} allWords={["rare"]} foundWords={[]} />)

      expect(screen.getByText("5.0%")).toBeInTheDocument()
    })

    it("handles zero sample size gracefully", () => {
      const statsWithZeroN: PuzzleStats = {
        id: 12345,
        n: 0,
        numberOfUsers: 0,
        answers: { able: 0 },
      }

      render(<StatsDisplay stats={statsWithZeroN} allWords={["able"]} foundWords={[]} />)

      expect(screen.getByText("0.0%")).toBeInTheDocument()
    })
  })

  describe("word highlighting", () => {
    it("applies different styling for found vs unfound words", () => {
      const allWords = ["able", "about"]
      const foundWords = ["able"]

      render(<StatsDisplay stats={mockStats} allWords={allWords} foundWords={foundWords} />)

      const foundWord = screen.getByText("able")
      // The unfound word display has text split across elements, find the parent span
      const unfoundWord = screen.getByText((content, element) => {
        return element?.textContent === "A (5)" && element?.tagName.toLowerCase() === "span"
      })

      // Found word should have foreground text color (not muted)
      expect(foundWord).toHaveClass("text-foreground")

      // Unfound word should have muted text color
      expect(unfoundWord).toHaveClass("text-muted-foreground")
    })

    it("makes single letter bold for unfound words", () => {
      const allWords = ["about"]
      const foundWords: string[] = []

      render(<StatsDisplay stats={mockStats} allWords={allWords} foundWords={foundWords} />)

      // The single letter "A" should be bold
      const letterSpan = screen.getByText("A")
      expect(letterSpan).toHaveClass("font-bold")
    })
  })

  describe("StatsNotAvailable", () => {
    it("renders the not available message", () => {
      render(<StatsNotAvailable />)

      expect(screen.getByText("You vs other players")).toBeInTheDocument()
      expect(
        screen.getByText(/Stats are not available yet for this puzzle/),
      ).toBeInTheDocument()
      expect(
        screen.getByText(/They typically appear within a few minutes/),
      ).toBeInTheDocument()
    })

    it("applies custom className", () => {
      const { container } = render(<StatsNotAvailable className="my-custom-class" />)

      expect(container.firstChild).toHaveClass("my-custom-class")
    })
  })
})
