import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ProgressBar } from "./ProgressBar"

describe("ProgressBar", () => {
  describe("rank display", () => {
    it("shows Beginner rank at 0 points", () => {
      render(<ProgressBar currentPoints={0} maxPoints={100} />)
      expect(screen.getByText("Beginner")).toBeInTheDocument()
    })

    it("shows Genius rank at 70% of max points", () => {
      render(<ProgressBar currentPoints={70} maxPoints={100} />)
      expect(screen.getByText("Genius")).toBeInTheDocument()
    })

    it("shows Queen Bee rank at 100% of max points", () => {
      render(<ProgressBar currentPoints={100} maxPoints={100} />)
      expect(screen.getByText("Queen Bee")).toBeInTheDocument()
    })

    it("shows intermediate ranks correctly", () => {
      // 25% should be "Nice"
      render(<ProgressBar currentPoints={25} maxPoints={100} />)
      expect(screen.getByText("Nice")).toBeInTheDocument()
    })
  })

  describe("points display", () => {
    it("shows current and max points", () => {
      render(<ProgressBar currentPoints={42} maxPoints={200} />)
      expect(screen.getByText("42 / 200 points")).toBeInTheDocument()
    })

    it("handles zero max points gracefully", () => {
      render(<ProgressBar currentPoints={0} maxPoints={0} />)
      expect(screen.getByText("0 / 0 points")).toBeInTheDocument()
      expect(screen.getByText("Beginner")).toBeInTheDocument()
    })
  })

  describe("next rank info", () => {
    it("shows points needed for next rank", () => {
      // At 0 points, need 2% of 100 = 2 points to reach "Getting Warm"
      render(<ProgressBar currentPoints={0} maxPoints={100} />)
      expect(screen.getByText("2")).toBeInTheDocument()
      expect(screen.getByText("Getting Warm")).toBeInTheDocument()
    })

    it("does not show next rank info when at Queen Bee", () => {
      render(<ProgressBar currentPoints={100} maxPoints={100} />)
      expect(screen.queryByText(/points to/)).not.toBeInTheDocument()
    })
  })

  describe("Queen Bee celebration", () => {
    it("shows celebration message at Queen Bee rank", () => {
      render(<ProgressBar currentPoints={100} maxPoints={100} />)
      expect(screen.getByText("🐝 Congratulations! You found all the words!")).toBeInTheDocument()
    })

    it("does not show celebration message below Queen Bee", () => {
      render(<ProgressBar currentPoints={99} maxPoints={100} />)
      expect(screen.queryByText(/Congratulations/)).not.toBeInTheDocument()
    })
  })

  describe("progress bar styling", () => {
    it("applies custom className to container", () => {
      const { container } = render(
        <ProgressBar currentPoints={50} maxPoints={100} className="custom-class" />,
      )
      expect(container.firstChild).toHaveClass("custom-class")
    })

    it("renders progress bar fill with correct width", () => {
      const { container } = render(<ProgressBar currentPoints={50} maxPoints={100} />)
      const fillElement = container.querySelector('[style*="width"]')
      expect(fillElement).toHaveStyle({ width: "50%" })
    })

    it("caps progress bar at 100%", () => {
      const { container } = render(<ProgressBar currentPoints={150} maxPoints={100} />)
      const fillElement = container.querySelector('[style*="width"]')
      expect(fillElement).toHaveStyle({ width: "100%" })
    })
  })

  describe("rank markers", () => {
    it("renders rank markers on the progress bar", () => {
      const { container } = render(<ProgressBar currentPoints={50} maxPoints={100} />)
      // Should have markers for intermediate ranks (not 0% and 100%)
      // Ranks: Getting Warm (2%), Moving Up (5%), Good (8%), Solid (15%),
      // Nice (25%), Great (40%), Amazing (50%), Genius (70%)
      const markers = container.querySelectorAll('[style*="left"]')
      expect(markers.length).toBe(8)
    })
  })

  describe("pangram display", () => {
    it("shows hexagon icons when pangrams are provided", () => {
      const { container } = render(
        <ProgressBar
          currentPoints={50}
          maxPoints={100}
          pangrams={["placebo", "capable"]}
          foundWords={["placebo"]}
        />,
      )
      // Should have 2 hexagon SVGs (one filled, one outline)
      const hexagons = container.querySelectorAll("svg")
      expect(hexagons.length).toBe(2)
      // First hexagon should be filled (found)
      expect(hexagons[0]).toHaveAttribute("fill", "currentColor")
      // Second hexagon should be outline (unfound)
      expect(hexagons[1]).toHaveAttribute("fill", "none")
      // aria-label should describe the pangram status
      expect(screen.getByLabelText("1 of 2 pangrams found")).toBeInTheDocument()
    })

    it("uses singular 'pangram' when there is only one", () => {
      render(
        <ProgressBar
          currentPoints={50}
          maxPoints={100}
          pangrams={["placebo"]}
          foundWords={[]}
        />,
      )
      expect(screen.getByLabelText("0 of 1 pangram found")).toBeInTheDocument()
    })

    it("shows all pangrams found", () => {
      const { container } = render(
        <ProgressBar
          currentPoints={50}
          maxPoints={100}
          pangrams={["placebo", "capable"]}
          foundWords={["placebo", "capable"]}
        />,
      )
      // Both hexagons should be filled
      const hexagons = container.querySelectorAll("svg")
      expect(hexagons[0]).toHaveAttribute("fill", "currentColor")
      expect(hexagons[1]).toHaveAttribute("fill", "currentColor")
      expect(screen.getByLabelText("2 of 2 pangrams found")).toBeInTheDocument()
    })

    it("does not show pangram hexagons when pangrams array is empty", () => {
      const { container } = render(
        <ProgressBar
          currentPoints={50}
          maxPoints={100}
          pangrams={[]}
          foundWords={["able"]}
        />,
      )
      expect(container.querySelectorAll("svg").length).toBe(0)
      expect(screen.queryByLabelText(/pangram/)).not.toBeInTheDocument()
    })

    it("does not show pangram hexagons when pangrams is not provided", () => {
      const { container } = render(<ProgressBar currentPoints={50} maxPoints={100} />)
      expect(container.querySelectorAll("svg").length).toBe(0)
      expect(screen.queryByLabelText(/pangram/)).not.toBeInTheDocument()
    })

    it("is case-insensitive when matching found pangrams", () => {
      const { container } = render(
        <ProgressBar
          currentPoints={50}
          maxPoints={100}
          pangrams={["placebo"]}
          foundWords={["PLACEBO"]}
        />,
      )
      // Single hexagon should be filled
      const hexagons = container.querySelectorAll("svg")
      expect(hexagons.length).toBe(1)
      expect(hexagons[0]).toHaveAttribute("fill", "currentColor")
      expect(screen.getByLabelText("1 of 1 pangram found")).toBeInTheDocument()
    })
  })
})
