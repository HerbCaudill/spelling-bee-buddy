import { describe, it, expect } from "vitest"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HintsList } from "./HintsList"
import type { HintsByPrefix } from "@/types"

describe("HintsList", () => {
  const sampleHints: HintsByPrefix = {
    AB: [
      { hint: "Capable of doing something", length: 4 },
      { hint: "Approximately", length: 5 },
    ],
    BA: [
      { hint: "A spherical object used in games", length: 4 },
      { hint: "A large inflatable decoration", length: 7 },
    ],
    CA: [
      { hint: "A cloak or covering", length: 4 },
    ],
  }

  describe("basic rendering", () => {
    it("renders heading", () => {
      render(<HintsList hints={sampleHints} />)

      expect(screen.getByText("Hints")).toBeInTheDocument()
    })

    it("renders all two-letter prefixes", () => {
      render(<HintsList hints={sampleHints} />)

      expect(screen.getByText("AB")).toBeInTheDocument()
      expect(screen.getByText("BA")).toBeInTheDocument()
      expect(screen.getByText("CA")).toBeInTheDocument()
    })

    it("renders prefixes in alphabetical order", () => {
      render(<HintsList hints={sampleHints} />)

      const buttons = screen.getAllByRole("button", { expanded: false })
      // Filter to only prefix buttons (not expand/collapse all)
      const prefixButtons = buttons.filter((btn) =>
        ["AB", "BA", "CA"].some((p) => btn.textContent?.includes(p))
      )
      const prefixTexts = prefixButtons.map((btn) =>
        btn.textContent?.match(/^[A-Z]{2}/)?.[0]
      )
      expect(prefixTexts).toEqual(["AB", "BA", "CA"])
    })

    it("shows hint counts for each prefix", () => {
      render(<HintsList hints={sampleHints} />)

      // AB has 2 hints, BA has 2 hints, CA has 1 hint
      // Two prefixes have 2 hints each
      expect(screen.getAllByLabelText("0 of 2 found")).toHaveLength(2)
      expect(screen.getByLabelText("0 of 1 found")).toBeInTheDocument()
    })

    it("renders expand/collapse all buttons", () => {
      render(<HintsList hints={sampleHints} />)

      expect(screen.getByLabelText("Expand all sections")).toBeInTheDocument()
      expect(screen.getByLabelText("Collapse all sections")).toBeInTheDocument()
    })
  })

  describe("collapsible behavior", () => {
    it("starts with all sections collapsed", () => {
      render(<HintsList hints={sampleHints} />)

      // Hints should not be visible initially
      expect(
        screen.queryByText("Capable of doing something")
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText("A spherical object used in games")
      ).not.toBeInTheDocument()
    })

    it("expands section when prefix is clicked", async () => {
      const user = userEvent.setup()
      render(<HintsList hints={sampleHints} />)

      // Click on AB prefix
      await user.click(screen.getByRole("button", { name: /AB/ }))

      // AB hints should now be visible
      expect(
        screen.getByText("Capable of doing something")
      ).toBeInTheDocument()
      expect(screen.getByText("Approximately")).toBeInTheDocument()

      // Other hints should still be hidden
      expect(
        screen.queryByText("A spherical object used in games")
      ).not.toBeInTheDocument()
    })

    it("collapses section when expanded prefix is clicked again", async () => {
      const user = userEvent.setup()
      render(<HintsList hints={sampleHints} />)

      // Expand AB
      await user.click(screen.getByRole("button", { name: /AB/ }))
      expect(
        screen.getByText("Capable of doing something")
      ).toBeInTheDocument()

      // Collapse AB
      await user.click(screen.getByRole("button", { name: /AB/ }))
      expect(
        screen.queryByText("Capable of doing something")
      ).not.toBeInTheDocument()
    })

    it("expands all sections when 'Expand all' is clicked", async () => {
      const user = userEvent.setup()
      render(<HintsList hints={sampleHints} />)

      await user.click(screen.getByLabelText("Expand all sections"))

      // All hints should be visible
      expect(
        screen.getByText("Capable of doing something")
      ).toBeInTheDocument()
      expect(
        screen.getByText("A spherical object used in games")
      ).toBeInTheDocument()
      expect(screen.getByText("A cloak or covering")).toBeInTheDocument()
    })

    it("collapses all sections when 'Collapse all' is clicked", async () => {
      const user = userEvent.setup()
      render(<HintsList hints={sampleHints} />)

      // First expand all
      await user.click(screen.getByLabelText("Expand all sections"))

      // Then collapse all
      await user.click(screen.getByLabelText("Collapse all sections"))

      // All hints should be hidden
      expect(
        screen.queryByText("Capable of doing something")
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText("A spherical object used in games")
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText("A cloak or covering")
      ).not.toBeInTheDocument()
    })

    it("allows multiple sections to be expanded simultaneously", async () => {
      const user = userEvent.setup()
      render(<HintsList hints={sampleHints} />)

      // Expand AB and BA
      await user.click(screen.getByRole("button", { name: /AB/ }))
      await user.click(screen.getByRole("button", { name: /BA/ }))

      // Both should be visible
      expect(
        screen.getByText("Capable of doing something")
      ).toBeInTheDocument()
      expect(
        screen.getByText("A spherical object used in games")
      ).toBeInTheDocument()
    })
  })

  describe("hint details", () => {
    it("shows hint text and word length", async () => {
      const user = userEvent.setup()
      render(<HintsList hints={sampleHints} />)

      await user.click(screen.getByRole("button", { name: /AB/ }))

      expect(
        screen.getByText("Capable of doing something")
      ).toBeInTheDocument()
      expect(screen.getByText("4 letters")).toBeInTheDocument()
      expect(screen.getByText("5 letters")).toBeInTheDocument()
    })

    it("renders hints in a list", async () => {
      const user = userEvent.setup()
      render(<HintsList hints={sampleHints} />)

      await user.click(screen.getByRole("button", { name: /AB/ }))

      const list = screen.getByRole("list", { name: "" })
      const items = within(list).getAllByRole("listitem")
      expect(items).toHaveLength(2)
    })
  })

  describe("found words tracking", () => {
    it("shows found count based on foundWords prop", () => {
      render(
        <HintsList
          hints={sampleHints}
          foundWords={["able", "about"]} // Two AB words
        />
      )

      // AB should show 2 found
      expect(screen.getByLabelText("2 of 2, complete")).toBeInTheDocument()
    })

    it("shows checkmark for complete prefixes", () => {
      render(
        <HintsList
          hints={sampleHints}
          foundWords={["able", "about"]} // All AB words found
        />
      )

      // AB should show checkmark
      expect(screen.getByText(/✓/)).toBeInTheDocument()
    })

    it("handles case-insensitive word matching", () => {
      render(
        <HintsList
          hints={sampleHints}
          foundWords={["ABLE", "About"]} // Mixed case
        />
      )

      // Should still count as 2 found for AB
      expect(screen.getByLabelText("2 of 2, complete")).toBeInTheDocument()
    })

    it("handles empty foundWords array", () => {
      render(<HintsList hints={sampleHints} foundWords={[]} />)

      // All should show 0 found
      expect(screen.getAllByLabelText(/0 of \d+ found/).length).toBeGreaterThan(
        0
      )
    })
  })

  describe("empty states", () => {
    it("shows message when no hints provided", () => {
      render(<HintsList hints={{}} />)

      expect(screen.getByText("No hints available")).toBeInTheDocument()
    })

    it("shows message for empty hints object", () => {
      render(<HintsList hints={{}} foundWords={["able"]} />)

      expect(screen.getByText("No hints available")).toBeInTheDocument()
    })
  })

  describe("styling", () => {
    it("applies custom className", () => {
      const { container } = render(
        <HintsList hints={sampleHints} className="custom-class" />
      )

      expect(container.firstChild).toHaveClass("custom-class")
    })

    it("applies complete styling to complete prefixes", () => {
      render(
        <HintsList
          hints={sampleHints}
          foundWords={["able", "about"]} // Complete AB
        />
      )

      // Check that the complete prefix has the checkmark
      const completeLabel = screen.getByLabelText("2 of 2, complete")
      expect(completeLabel).toBeInTheDocument()
    })
  })

  describe("accessibility", () => {
    it("has aria-expanded attribute on prefix buttons", () => {
      render(<HintsList hints={sampleHints} />)

      const buttons = screen.getAllByRole("button", { expanded: false })
      const prefixButtons = buttons.filter((btn) =>
        btn.textContent?.includes("AB")
      )
      expect(prefixButtons[0]).toHaveAttribute("aria-expanded", "false")
    })

    it("updates aria-expanded when section is expanded", async () => {
      const user = userEvent.setup()
      render(<HintsList hints={sampleHints} />)

      const abButton = screen.getByRole("button", { name: /AB/ })
      expect(abButton).toHaveAttribute("aria-expanded", "false")

      await user.click(abButton)
      expect(abButton).toHaveAttribute("aria-expanded", "true")
    })

    it("has aria-controls linking header to content", async () => {
      const user = userEvent.setup()
      render(<HintsList hints={sampleHints} />)

      const abButton = screen.getByRole("button", { name: /AB/ })
      expect(abButton).toHaveAttribute("aria-controls", "hints-AB")

      await user.click(abButton)
      expect(screen.getByRole("list", { name: "" })).toHaveAttribute(
        "id",
        "hints-AB"
      )
    })

    it("has proper list roles", () => {
      render(<HintsList hints={sampleHints} />)

      expect(
        screen.getByRole("list", { name: "Hints by prefix" })
      ).toBeInTheDocument()
    })
  })
})
