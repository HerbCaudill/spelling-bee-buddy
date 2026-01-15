import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { WordGrid } from "./WordGrid"

describe("WordGrid", () => {
  const allWords = ["able", "apple", "axle", "ball", "balloon", "cape", "capable"]
  const foundWords = ["able", "apple", "ball"]

  describe("basic rendering", () => {
    it("renders row headers with starting letters", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // Should show letters A, B, C as row headers
      expect(screen.getByRole("rowheader", { name: "Letter A" })).toBeInTheDocument()
      expect(screen.getByRole("rowheader", { name: "Letter B" })).toBeInTheDocument()
      expect(screen.getByRole("rowheader", { name: "Letter C" })).toBeInTheDocument()
    })

    it("renders length groups with dots", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // A row has 4-letter words (able, axle - 1 found) and 5-letter word (apple - found)
      expect(screen.getByRole("cell", { name: "4-letter words: 1 of 2 found" })).toBeInTheDocument()
      expect(
        screen.getByRole("cell", { name: "5-letter words: 1 of 1 found, complete" }),
      ).toBeInTheDocument()
    })

  })

  describe("dot display", () => {
    it("shows filled dots for found words", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // Filled dots (●) should be present for found words
      const filledDots = screen.getAllByText("●")
      expect(filledDots.length).toBeGreaterThan(0)
    })

    it("shows empty dots for unfound words", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // Empty dots (○) should be present for unfound words
      const emptyDots = screen.getAllByText("○")
      expect(emptyDots.length).toBeGreaterThan(0)
    })

    it("shows only filled dots when all words in a group are found", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // The 5-letter group for A should be complete (apple found)
      expect(
        screen.getByRole("cell", { name: "5-letter words: 1 of 1 found, complete" }),
      ).toBeInTheDocument()
    })
  })

  describe("length groups", () => {
    it("displays all length groups for each letter", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // A has 4-letter and 5-letter words
      expect(screen.getByRole("cell", { name: "4-letter words: 1 of 2 found" })).toBeInTheDocument()
      expect(
        screen.getByRole("cell", { name: "5-letter words: 1 of 1 found, complete" }),
      ).toBeInTheDocument()

      // B has 4-letter (ball - found) and 7-letter (balloon) words
      // C has 4-letter (cape) and 7-letter (capable) words
      // Both B and C have "7-letter words: 0 of 1 found"
      const sevenLetterCells = screen.getAllByRole("cell", { name: "7-letter words: 0 of 1 found" })
      expect(sevenLetterCells.length).toBe(2)

      // B has 4-letter complete (ball found)
      expect(
        screen.getByRole("cell", { name: "4-letter words: 1 of 1 found, complete" }),
      ).toBeInTheDocument()

      // C has 4-letter unfound (cape not found)
      expect(screen.getByRole("cell", { name: "4-letter words: 0 of 1 found" })).toBeInTheDocument()
    })

    it("only shows length groups that have words", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // A should not have 6-letter or 7-letter groups
      // Check that A row doesn't have a 7-letter group by verifying the structure
      const aRowHeader = screen.getByRole("rowheader", { name: "Letter A" })
      const aRow = aRowHeader.closest('[role="row"]')
      expect(aRow).not.toHaveTextContent("7")
    })
  })

  describe("empty states", () => {
    it("shows message when no words provided", () => {
      render(<WordGrid allWords={[]} foundWords={[]} />)

      expect(screen.getByText("No puzzle data available")).toBeInTheDocument()
    })

    it("handles empty found words list", () => {
      render(<WordGrid allWords={allWords} foundWords={[]} />)

      // All dots should be empty
      const emptyDots = screen.getAllByText("○")
      expect(emptyDots.length).toBe(7) // Total of 7 words

      // No filled dots
      expect(screen.queryAllByText("●").length).toBe(0)
    })
  })

  describe("styling", () => {
    it("applies custom className", () => {
      const { container } = render(
        <WordGrid allWords={allWords} foundWords={foundWords} className="custom-class" />,
      )

      expect(container.firstChild).toHaveClass("custom-class")
    })

    it("renders row header letters in bold", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // Row headers should be bold
      const letterA = screen.getByRole("rowheader", { name: "Letter A" })
      expect(letterA).toHaveClass("font-bold")
    })
  })

  describe("case insensitivity", () => {
    it("handles mixed case words correctly", () => {
      render(<WordGrid allWords={["ABLE", "Apple"]} foundWords={["able", "APPLE"]} />)

      // Both should be found since comparison is case-insensitive
      // Should show only filled dots
      const filledDots = screen.getAllByText("●")
      expect(filledDots.length).toBe(2)
      expect(screen.queryAllByText("○").length).toBe(0)
    })
  })

  describe("all words found", () => {
    it("shows all filled dots when all words are found", () => {
      render(<WordGrid allWords={allWords} foundWords={allWords} />)

      // All dots should be filled
      const filledDots = screen.getAllByText("●")
      expect(filledDots.length).toBe(7)
      expect(screen.queryAllByText("○").length).toBe(0)
    })
  })

  describe("accessibility", () => {
    it("has proper grid role", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      expect(screen.getByRole("grid", { name: "Word grid" })).toBeInTheDocument()
    })

    it("has proper row structure", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // Should have rows for A, B, C
      const rows = screen.getAllByRole("row")
      expect(rows.length).toBe(3) // A, B, C
    })

    it("provides accessible labels for length groups", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // Each length group should have an accessible label
      expect(screen.getByRole("cell", { name: "4-letter words: 1 of 2 found" })).toBeInTheDocument()
    })
  })

  describe("table structure", () => {
    it("renders as a table with proper elements", () => {
      const { container } = render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // Should use table element
      const table = container.querySelector("table")
      expect(table).toBeInTheDocument()

      // Should have th elements for row headers
      const rowHeaders = container.querySelectorAll("th")
      expect(rowHeaders.length).toBe(3) // A, B, C

      // Should have td elements for content
      const cells = container.querySelectorAll("td")
      expect(cells.length).toBe(3) // One per row
    })

    it("renders row headers with border styling", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      const letterA = screen.getByRole("rowheader", { name: "Letter A" })
      expect(letterA).toHaveClass("border-r", "border-border")
    })
  })
})
