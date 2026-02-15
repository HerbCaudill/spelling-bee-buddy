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

    it("renders column headers with word lengths", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // Should show column headers for lengths 4, 5, 7
      expect(screen.getByRole("columnheader", { name: "4-letter words" })).toBeInTheDocument()
      expect(screen.getByRole("columnheader", { name: "5-letter words" })).toBeInTheDocument()
      expect(screen.getByRole("columnheader", { name: "7-letter words" })).toBeInTheDocument()
    })

    it("renders cells with dots for each letter/length combination", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // A row, 4-letter: able (found) + axle (not found) = 1 of 2
      expect(
        screen.getByRole("cell", { name: "4-letter A words: 1 of 2 found" }),
      ).toBeInTheDocument()

      // A row, 5-letter: apple (found) = 1 of 1
      expect(
        screen.getByRole("cell", { name: "5-letter A words: 1 of 1 found, complete" }),
      ).toBeInTheDocument()
    })
  })

  describe("dot display", () => {
    it("shows filled dots for found words", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      const filledDots = screen.getAllByText("●")
      expect(filledDots.length).toBeGreaterThan(0)
    })

    it("shows empty dots for unfound words", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      const emptyDots = screen.getAllByText("○")
      expect(emptyDots.length).toBeGreaterThan(0)
    })

    it("shows only filled dots when all words in a group are found", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // The 5-letter A cell should be complete (apple found)
      expect(
        screen.getByRole("cell", { name: "5-letter A words: 1 of 1 found, complete" }),
      ).toBeInTheDocument()
    })
  })

  describe("matrix structure", () => {
    it("renders empty cells where no words exist for a letter/length combination", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // A has no 7-letter words, so that cell should be empty
      expect(
        screen.getByRole("cell", { name: "No 7-letter A words" }),
      ).toBeInTheDocument()

      // C has no 5-letter words
      expect(
        screen.getByRole("cell", { name: "No 5-letter C words" }),
      ).toBeInTheDocument()
    })

    it("has a cell for every letter/length combination", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // 3 letters x 3 lengths = 9 data cells + 3 empty cells for combinations without words
      // Plus the header row. Total cells = 9 data cells
      const allCells = screen.getAllByRole("cell")
      // 3 letters × 3 lengths = 9 cells
      expect(allCells.length).toBe(9)
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

      const letterA = screen.getByRole("rowheader", { name: "Letter A" })
      expect(letterA).toHaveClass("font-bold")
    })
  })

  describe("case insensitivity", () => {
    it("handles mixed case words correctly", () => {
      render(<WordGrid allWords={["ABLE", "Apple"]} foundWords={["able", "APPLE"]} />)

      // Both should be found since comparison is case-insensitive
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

    it("has proper row structure including header row", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      // Should have rows for header + A, B, C
      const rows = screen.getAllByRole("row")
      expect(rows.length).toBe(4) // header + A, B, C
    })

    it("provides accessible labels for cells", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      expect(
        screen.getByRole("cell", { name: "4-letter A words: 1 of 2 found" }),
      ).toBeInTheDocument()
    })
  })

  describe("table structure", () => {
    it("renders as a table with proper elements", () => {
      const { container } = render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      const table = container.querySelector("table")
      expect(table).toBeInTheDocument()

      // Should have th elements for row headers + column headers + corner cell
      const rowHeaders = container.querySelectorAll("th")
      // 1 corner + 3 column headers + 3 row headers = 7
      expect(rowHeaders.length).toBe(7)

      // Should have td elements: one per cell in the matrix
      const cells = container.querySelectorAll("td")
      expect(cells.length).toBe(9) // 3 letters × 3 lengths
    })

    it("renders row headers with border styling", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      const letterA = screen.getByRole("rowheader", { name: "Letter A" })
      expect(letterA).toHaveClass("border-r", "border-border")
    })

    it("renders table with outer border", () => {
      const { container } = render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      const table = container.querySelector("table")
      expect(table).toHaveClass("border", "border-border")
    })

    it("renders horizontal gridlines between rows", () => {
      render(<WordGrid allWords={allWords} foundWords={foundWords} />)

      const rows = screen.getAllByRole("row")
      // Header row and all data rows except last should have bottom border
      rows.slice(0, -1).forEach(row => {
        expect(row).toHaveClass("border-b", "border-border")
      })
      // Last row should not have bottom border
      const lastRow = rows[rows.length - 1]
      expect(lastRow).not.toHaveClass("border-b")
    })
  })
})
