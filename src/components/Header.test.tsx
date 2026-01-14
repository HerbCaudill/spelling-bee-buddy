import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { Header } from "./Header"

const defaultProps = {
  displayWeekday: "Wednesday",
  displayDate: "January 14, 2026",
  printDate: "2026-01-14",
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
      render(
        <Header
          displayWeekday="Friday"
          displayDate="March 20, 2026"
          printDate="2026-03-20"
        />
      )
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
      expect(link).toHaveAttribute(
        "href",
        "https://www.nytimes.com/puzzles/spelling-bee"
      )
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
      const { container } = render(
        <Header {...defaultProps} className="custom-class" />
      )
      expect(container.firstChild).toHaveClass("custom-class")
    })

    it("renders as a header element", () => {
      render(<Header {...defaultProps} />)
      expect(screen.getByRole("banner")).toBeInTheDocument()
    })
  })
})
