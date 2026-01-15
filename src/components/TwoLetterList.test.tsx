import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { TwoLetterList } from "./TwoLetterList"

describe("TwoLetterList", () => {
  const allWords = ["able", "about", "apple", "ball", "balloon", "cape", "capable"]
  const foundWords = ["able", "about", "ball"]

  describe("basic rendering", () => {
    it("renders heading", () => {
      render(<TwoLetterList allWords={allWords} foundWords={foundWords} />)

      expect(screen.getByText("Two-letter list")).toBeInTheDocument()
    })

    it("renders row headers with first letters", () => {
      render(<TwoLetterList allWords={allWords} foundWords={foundWords} />)

      // Should show letters A, B, C as row headers
      expect(screen.getByRole("rowheader", { name: "Letter A" })).toBeInTheDocument()
      expect(screen.getByRole("rowheader", { name: "Letter B" })).toBeInTheDocument()
      expect(screen.getByRole("rowheader", { name: "Letter C" })).toBeInTheDocument()
    })

    it("renders all two-letter prefixes as groups", () => {
      render(<TwoLetterList allWords={allWords} foundWords={foundWords} />)

      // Should show prefixes AB, AP, BA, CA as cell groups
      expect(screen.getByRole("cell", { name: /^AB:/ })).toBeInTheDocument()
      expect(screen.getByRole("cell", { name: /^AP:/ })).toBeInTheDocument()
      expect(screen.getByRole("cell", { name: /^BA:/ })).toBeInTheDocument()
      expect(screen.getByRole("cell", { name: /^CA:/ })).toBeInTheDocument()
    })

    it("renders prefixes grouped by first letter in alphabetical order", () => {
      render(<TwoLetterList allWords={allWords} foundWords={foundWords} />)

      const rows = screen.getAllByRole("row")
      // Should have 3 rows: A, B, C
      expect(rows.length).toBe(3)
    })
  })

  describe("dot display", () => {
    it("shows filled dots for found words", () => {
      render(<TwoLetterList allWords={allWords} foundWords={foundWords} />)

      // Filled dots (●) should be present for found words
      const filledDots = screen.getAllByText("●")
      expect(filledDots.length).toBeGreaterThan(0)
    })

    it("shows empty dots for unfound words", () => {
      render(<TwoLetterList allWords={allWords} foundWords={foundWords} />)

      // Empty dots (○) should be present for unfound words
      const emptyDots = screen.getAllByText("○")
      expect(emptyDots.length).toBeGreaterThan(0)
    })

    it("shows found/total in accessible labels", () => {
      render(<TwoLetterList allWords={allWords} foundWords={foundWords} />)

      // BA: ball, balloon - found ball = 1/2
      expect(screen.getByRole("cell", { name: "BA: 1 of 2 found" })).toBeInTheDocument()

      // CA: cape, capable - found 0 = 0/2
      expect(screen.getByRole("cell", { name: "CA: 0 of 2 found" })).toBeInTheDocument()
    })

    it("marks complete prefixes in accessible labels", () => {
      render(<TwoLetterList allWords={allWords} foundWords={foundWords} />)

      // AB: able, about - found both = complete
      expect(screen.getByRole("cell", { name: "AB: 2 of 2 found, complete" })).toBeInTheDocument()
    })
  })

  describe("prefix groups", () => {
    it("displays all prefix groups within letter rows", () => {
      render(<TwoLetterList allWords={allWords} foundWords={foundWords} />)

      // A row has AB and AP prefixes
      expect(screen.getByRole("cell", { name: "AB: 2 of 2 found, complete" })).toBeInTheDocument()
      expect(screen.getByRole("cell", { name: "AP: 0 of 1 found" })).toBeInTheDocument()

      // B row has BA prefix
      expect(screen.getByRole("cell", { name: "BA: 1 of 2 found" })).toBeInTheDocument()

      // C row has CA prefix
      expect(screen.getByRole("cell", { name: "CA: 0 of 2 found" })).toBeInTheDocument()
    })
  })

  describe("empty states", () => {
    it("shows message when no words provided", () => {
      render(<TwoLetterList allWords={[]} foundWords={[]} />)

      expect(screen.getByText("No puzzle data available")).toBeInTheDocument()
    })

    it("handles empty found words list", () => {
      render(<TwoLetterList allWords={allWords} foundWords={[]} />)

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
        <TwoLetterList allWords={allWords} foundWords={foundWords} className="custom-class" />,
      )

      expect(container.firstChild).toHaveClass("custom-class")
    })
  })

  describe("case insensitivity", () => {
    it("handles mixed case words correctly", () => {
      render(<TwoLetterList allWords={["ABLE", "About"]} foundWords={["able", "ABOUT"]} />)

      // Both should be found since comparison is case-insensitive
      // AB prefix should be complete
      expect(screen.getByRole("cell", { name: "AB: 2 of 2 found, complete" })).toBeInTheDocument()
    })

    it("displays prefixes in uppercase", () => {
      render(<TwoLetterList allWords={["able"]} foundWords={[]} />)

      expect(screen.getByRole("cell", { name: "AB: 0 of 1 found" })).toBeInTheDocument()
    })
  })

  describe("all words found", () => {
    it("shows all filled dots when all words are found", () => {
      render(<TwoLetterList allWords={allWords} foundWords={allWords} />)

      // All dots should be filled
      const filledDots = screen.getAllByText("●")
      expect(filledDots.length).toBe(7)
      expect(screen.queryAllByText("○").length).toBe(0)
    })
  })

  describe("accessibility", () => {
    it("has proper grid role", () => {
      render(<TwoLetterList allWords={allWords} foundWords={foundWords} />)

      expect(screen.getByRole("grid", { name: "Two-letter list" })).toBeInTheDocument()
    })

    it("has proper row structure", () => {
      render(<TwoLetterList allWords={allWords} foundWords={foundWords} />)

      // Should have rows for A, B, C
      const rows = screen.getAllByRole("row")
      expect(rows.length).toBe(3) // A, B, C
    })

    it("provides accessible labels for prefix groups", () => {
      render(<TwoLetterList allWords={allWords} foundWords={foundWords} />)

      // Each prefix group should have an accessible label
      expect(screen.getByRole("cell", { name: "BA: 1 of 2 found" })).toBeInTheDocument()
    })
  })
})
