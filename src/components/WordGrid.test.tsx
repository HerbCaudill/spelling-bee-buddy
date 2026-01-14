import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { WordGrid } from "./WordGrid"

describe("WordGrid", () => {
  const allWords = ["able", "apple", "axle", "ball", "balloon", "cape", "capable"]
  const foundWords = ["able", "apple", "ball"]

  describe("basic rendering", () => {
    it("renders column headers with word lengths", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // Should show lengths 4, 5, 7 (from the test words)
      expect(screen.getByRole("columnheader", { name: "4" })).toBeInTheDocument()
      expect(screen.getByRole("columnheader", { name: "5" })).toBeInTheDocument()
      expect(screen.getByRole("columnheader", { name: "7" })).toBeInTheDocument()
    })

    it("renders row headers with starting letters", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // Should show letters A, B, C
      expect(screen.getByText("A")).toBeInTheDocument()
      expect(screen.getByText("B")).toBeInTheDocument()
      expect(screen.getByText("C")).toBeInTheDocument()
    })

    it("renders total column header", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // Should show sigma symbol for totals (appears twice - column header and row header)
      const sigmas = screen.getAllByText("Σ")
      expect(sigmas.length).toBe(2)
    })
  })

  describe("cell content", () => {
    it("shows found/total counts for each cell", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // A-4: able, axle - found able = 1/2 (also B row total is 1/2)
      const oneOfTwoElements = screen.getAllByLabelText("1 of 2 found")
      expect(oneOfTwoElements.length).toBeGreaterThanOrEqual(1)

      // A-5: apple - found apple = checkmark (complete)
      // Multiple cells show "1 of 1 found, complete"
      const oneOfOneComplete = screen.getAllByLabelText("1 of 1 found, complete")
      expect(oneOfOneComplete.length).toBeGreaterThan(0)

      // B-4: ball - found ball = checkmark (complete)
      const completeMarks = screen.getAllByLabelText(/complete/)
      expect(completeMarks.length).toBeGreaterThan(0)
    })

    it("shows checkmark for complete cells", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // Should show checkmarks for complete cells
      expect(screen.getAllByText("✓").length).toBeGreaterThan(0)
    })

    it("shows dash for empty cells (no words with that letter-length combo)", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // Should show dashes for non-existent combinations
      const dashes = screen.getAllByText("-")
      expect(dashes.length).toBeGreaterThan(0)
    })
  })

  describe("totals", () => {
    it("shows correct row totals", () => {
      // All words starting with A: able, apple, axle = 3 total, found able, apple = 2
      // All words starting with B: ball, balloon = 2 total, found ball = 1
      // All words starting with C: cape, capable = 2 total, found = 0
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // Row total for A: 2/3
      expect(screen.getByLabelText("2 of 3 found")).toBeInTheDocument()

      // Row total for B: 1/2 (also A-4 cell is 1/2)
      const oneOfTwoElements = screen.getAllByLabelText("1 of 2 found")
      expect(oneOfTwoElements.length).toBeGreaterThanOrEqual(1)

      // Row total for C: 0/2 (also column total for length 7)
      const zeroOfTwoElements = screen.getAllByLabelText("0 of 2 found")
      expect(zeroOfTwoElements.length).toBeGreaterThanOrEqual(1)
    })

    it("shows correct column totals", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // Column total for length 4: able, axle, ball, cape = 4 total, found able, ball = 2
      // This appears as "2/4" in the bottom row
      expect(screen.getByLabelText("2 of 4 found")).toBeInTheDocument()
    })

    it("shows grand total", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // Grand total: 3/7 (3 found out of 7 total words)
      expect(screen.getByLabelText("3 of 7 found")).toBeInTheDocument()
    })
  })

  describe("empty states", () => {
    it("shows message when no words provided", () => {
      render(<WordGrid allWords={[]} foundWords={[]} />)

      expect(screen.getByText("No puzzle data available")).toBeInTheDocument()
    })

    it("handles empty found words list", () => {
      render(<WordGrid allWords={allWords} foundWords={[]} />)

      // Should show 0/total for all cells
      // Grand total should be 0/7
      expect(screen.getByLabelText("0 of 7 found")).toBeInTheDocument()
    })
  })

  describe("styling", () => {
    it("applies custom className", () => {
      const { container } = render(
        <WordGrid allWords={allWords} foundWords={foundWords} className="custom-class" />
      )

      expect(container.firstChild).toHaveClass("custom-class")
    })

    it("has overflow-x-auto for responsiveness", () => {
      const { container } = render(
        <WordGrid allWords={allWords} foundWords={foundWords} />
      )

      expect(container.firstChild).toHaveClass("overflow-x-auto")
    })
  })

  describe("case insensitivity", () => {
    it("handles mixed case words correctly", () => {
      render(<WordGrid allWords={["ABLE", "Apple"]} foundWords={["able", "APPLE"]} />)

      // Both should be found since comparison is case-insensitive
      const completeMarks = screen.getAllByText("✓")
      expect(completeMarks.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe("all words found", () => {
    it("shows all checkmarks when all words are found", () => {
      render(<WordGrid allWords={allWords} foundWords={allWords} />)

      // Grand total should be complete
      expect(
        screen.getByLabelText("7 of 7 found, complete")
      ).toBeInTheDocument()
    })
  })
})
