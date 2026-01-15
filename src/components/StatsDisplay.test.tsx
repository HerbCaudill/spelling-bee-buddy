import { render, screen, within } from "@testing-library/react"
import { describe, it, expect } from "vitest"
import { StatsDisplay } from "./StatsDisplay"
import type { PuzzleStats } from "@/types"

const mockStats: PuzzleStats = {
  numberOfUsers: 1000,
  answers: {
    able: 900,
    about: 800,
    apple: 500,
    axle: 100,
  },
}

describe("StatsDisplay", () => {
  describe("remaining words calculation", () => {
    it("shows correct remaining count when foundWords matches allWords", () => {
      const allWords = ["able", "about", "apple", "axle"]
      const foundWords = ["able", "about"]

      render(<StatsDisplay stats={mockStats} allWords={allWords} foundWords={foundWords} />)

      // Found: 2, Remaining: 2
      const foundSection = screen.getByText("Words found").parentElement!
      expect(within(foundSection).getByText("2")).toBeInTheDocument()

      const remainingSection = screen.getByText("Remaining").parentElement!
      expect(within(remainingSection).getByText("2")).toBeInTheDocument()
    })

    it("never shows negative remaining when foundWords has more items than allWords", () => {
      // This can happen if user's foundWords includes words not in the puzzle's answer list
      const allWords = ["able", "about"]
      const foundWords = ["able", "about", "apple", "axle", "extra"] // 5 words, but only 2 in allWords

      render(<StatsDisplay stats={mockStats} allWords={allWords} foundWords={foundWords} />)

      // Should show 2 found (only the ones in allWords), 0 remaining
      const remainingSection = screen.getByText("Remaining").parentElement!
      expect(within(remainingSection).getByText("0")).toBeInTheDocument()
    })

    it("only counts found words that exist in allWords", () => {
      const allWords = ["able", "about"]
      const foundWords = ["able", "nonexistent", "another"]

      render(<StatsDisplay stats={mockStats} allWords={allWords} foundWords={foundWords} />)

      // Only "able" should count as found since it's the only one in allWords
      const foundSection = screen.getByText("Words found").parentElement!
      expect(within(foundSection).getByText("1")).toBeInTheDocument()

      // The remaining should be 1 (about)
      const remainingSection = screen.getByText("Remaining").parentElement!
      expect(within(remainingSection).getByText("1")).toBeInTheDocument()
    })

    it("handles case-insensitive word matching", () => {
      const allWords = ["ABLE", "About"]
      const foundWords = ["able", "ABOUT"]

      render(<StatsDisplay stats={mockStats} allWords={allWords} foundWords={foundWords} />)

      // Both should match despite case differences
      const foundSection = screen.getByText("Words found").parentElement!
      expect(within(foundSection).getByText("2")).toBeInTheDocument()
    })

    it("shows 0 remaining when all words are found", () => {
      const allWords = ["able", "about"]
      const foundWords = ["able", "about"]

      render(<StatsDisplay stats={mockStats} allWords={allWords} foundWords={foundWords} />)

      const remainingSection = screen.getByText("Remaining").parentElement!
      expect(within(remainingSection).getByText("0")).toBeInTheDocument()
    })
  })

  describe("rendering", () => {
    it("returns null when stats is null", () => {
      const { container } = render(
        <StatsDisplay stats={null} allWords={["able"]} foundWords={[]} />,
      )
      expect(container.firstChild).toBeNull()
    })

    it("shows player count", () => {
      render(<StatsDisplay stats={mockStats} allWords={["able"]} foundWords={[]} />)
      expect(screen.getByText("1,000 players")).toBeInTheDocument()
    })

    it("shows rare finds section when user has rare words", () => {
      const allWords = ["able", "axle"]
      const foundWords = ["axle"] // axle is rare (10% of players)

      render(<StatsDisplay stats={mockStats} allWords={allWords} foundWords={foundWords} />)

      expect(screen.getByText("Your rare finds")).toBeInTheDocument()
      expect(screen.getByText("axle")).toBeInTheDocument()
    })

    it("does not show rare finds section when user has no rare words", () => {
      const allWords = ["able", "about"]
      const foundWords = ["able", "about"] // both are common (90% and 80%)

      render(<StatsDisplay stats={mockStats} allWords={allWords} foundWords={foundWords} />)

      expect(screen.queryByText("Your rare finds")).not.toBeInTheDocument()
    })
  })
})
