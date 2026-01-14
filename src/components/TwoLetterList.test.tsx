import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { TwoLetterList } from "./TwoLetterList"

describe("TwoLetterList", () => {
  const allWords = ["able", "about", "apple", "ball", "balloon", "cape", "capable"]
  const foundWords = ["able", "about", "ball"]

  describe("basic rendering", () => {
    it("renders heading", () => {
      render(<TwoLetterList allWords={allWords} foundWords={foundWords} />)

      expect(screen.getByText("Two-Letter List")).toBeInTheDocument()
    })

    it("renders all two-letter prefixes", () => {
      render(<TwoLetterList allWords={allWords} foundWords={foundWords} />)

      // Should show prefixes AB, AP, BA, CA from the test words
      expect(screen.getByText("AB")).toBeInTheDocument()
      expect(screen.getByText("AP")).toBeInTheDocument()
      expect(screen.getByText("BA")).toBeInTheDocument()
      expect(screen.getByText("CA")).toBeInTheDocument()
    })

    it("renders prefixes in alphabetical order", () => {
      render(<TwoLetterList allWords={allWords} foundWords={foundWords} />)

      const prefixes = screen.getAllByText(/^[A-Z]{2}$/)
      const prefixTexts = prefixes.map(el => el.textContent)
      const sortedPrefixes = [...prefixTexts].sort()
      expect(prefixTexts).toEqual(sortedPrefixes)
    })
  })

  describe("counts", () => {
    it("shows found/total counts for incomplete prefixes", () => {
      render(<TwoLetterList allWords={allWords} foundWords={foundWords} />)

      // BA: ball, balloon - found ball = 1/2
      expect(screen.getByLabelText("1 of 2 found")).toBeInTheDocument()

      // CA: cape, capable - found 0 = 0/2
      expect(screen.getByLabelText("0 of 2 found")).toBeInTheDocument()
    })

    it("shows checkmark for complete prefixes", () => {
      render(<TwoLetterList allWords={allWords} foundWords={foundWords} />)

      // AB: able, about - found both = complete
      expect(screen.getByLabelText("2 of 2, complete")).toBeInTheDocument()
    })

    it("shows checkmarks when all words in a prefix are found", () => {
      render(<TwoLetterList allWords={allWords} foundWords={foundWords} />)

      // Should have at least one checkmark (AB is complete)
      expect(screen.getAllByText("✓").length).toBeGreaterThan(0)
    })
  })

  describe("empty states", () => {
    it("shows message when no words provided", () => {
      render(<TwoLetterList allWords={[]} foundWords={[]} />)

      expect(screen.getByText("No puzzle data available")).toBeInTheDocument()
    })

    it("handles empty found words list", () => {
      render(<TwoLetterList allWords={allWords} foundWords={[]} />)

      // All prefixes should show 0/total (multiple prefixes have 0/2)
      expect(screen.getAllByLabelText("0 of 2 found").length).toBeGreaterThan(0)
      expect(screen.queryByText("✓")).not.toBeInTheDocument()
    })
  })

  describe("styling", () => {
    it("applies custom className", () => {
      const { container } = render(
        <TwoLetterList allWords={allWords} foundWords={foundWords} className="custom-class" />,
      )

      expect(container.firstChild).toHaveClass("custom-class")
    })

    it("applies complete styling to complete prefixes", () => {
      render(<TwoLetterList allWords={allWords} foundWords={foundWords} />)

      // AB is complete, should have special styling
      const abCheckmark = screen.getByLabelText("2 of 2, complete")
      expect(abCheckmark).toBeInTheDocument()
    })
  })

  describe("case insensitivity", () => {
    it("handles mixed case words correctly", () => {
      render(<TwoLetterList allWords={["ABLE", "About"]} foundWords={["able", "ABOUT"]} />)

      // Both should be found since comparison is case-insensitive
      // AB prefix should be complete
      expect(screen.getByLabelText("2 of 2, complete")).toBeInTheDocument()
    })

    it("displays prefixes in uppercase", () => {
      render(<TwoLetterList allWords={["able"]} foundWords={[]} />)

      expect(screen.getByText("AB")).toBeInTheDocument()
    })
  })

  describe("all words found", () => {
    it("shows all checkmarks when all words are found", () => {
      render(<TwoLetterList allWords={allWords} foundWords={allWords} />)

      // All prefixes should show checkmarks
      const checkmarks = screen.getAllByText("✓")
      expect(checkmarks.length).toBe(4) // AB, AP, BA, CA
    })
  })

  describe("grid layout", () => {
    it("renders items in a grid", () => {
      const { container } = render(<TwoLetterList allWords={allWords} foundWords={foundWords} />)

      const grid = container.querySelector(".grid")
      expect(grid).toBeInTheDocument()
    })
  })
})
