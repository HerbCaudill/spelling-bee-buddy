import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SettingsModal } from "./SettingsModal"
import * as storage from "@/lib/storage"

// Mock the storage module
vi.mock("@/lib/storage", () => ({
  getCredentials: vi.fn(),
  saveCredentials: vi.fn(),
  clearCredentials: vi.fn(),
}))

describe("SettingsModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(storage.getCredentials).mockReturnValue(null)
  })

  describe("rendering", () => {
    it("renders nothing when closed", () => {
      const { container } = render(<SettingsModal {...defaultProps} isOpen={false} />)
      expect(container).toBeEmptyDOMElement()
    })

    it("renders modal when open", () => {
      render(<SettingsModal {...defaultProps} />)
      expect(screen.getByRole("dialog", { name: "Settings" })).toBeInTheDocument()
    })

    it("renders title", () => {
      render(<SettingsModal {...defaultProps} />)
      expect(screen.getByText("Settings")).toBeInTheDocument()
    })

    it("renders NYT Token input", () => {
      render(<SettingsModal {...defaultProps} />)
      expect(screen.getByLabelText("NYT Token")).toBeInTheDocument()
    })

    it("renders Anthropic API Key input", () => {
      render(<SettingsModal {...defaultProps} />)
      expect(screen.getByLabelText("Anthropic API Key")).toBeInTheDocument()
    })

    it("renders close button", () => {
      render(<SettingsModal {...defaultProps} />)
      expect(screen.getByLabelText("Close settings")).toBeInTheDocument()
    })

    it("renders Save and Cancel buttons", () => {
      render(<SettingsModal {...defaultProps} />)
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
    })

    it("renders Clear All button", () => {
      render(<SettingsModal {...defaultProps} />)
      expect(screen.getByRole("button", { name: /Clear All/i })).toBeInTheDocument()
    })

    it("renders help text for NYT token", () => {
      render(<SettingsModal {...defaultProps} />)
      expect(screen.getByText(/Used to track your progress/i)).toBeInTheDocument()
    })

    it("renders help text with link for Anthropic key", () => {
      render(<SettingsModal {...defaultProps} />)
      expect(screen.getByText(/Used to generate AI hints/i)).toBeInTheDocument()
      expect(screen.getByRole("link", { name: /Get an API key/i })).toHaveAttribute(
        "href",
        "https://console.anthropic.com/settings/keys",
      )
    })
  })

  describe("loading existing credentials", () => {
    it("loads existing credentials when modal opens", () => {
      vi.mocked(storage.getCredentials).mockReturnValue({
        nytToken: "existing-nyt-token",
        anthropicKey: "existing-api-key",
      })

      render(<SettingsModal {...defaultProps} />)

      expect(screen.getByLabelText("NYT Token")).toHaveValue("existing-nyt-token")
      expect(screen.getByLabelText("Anthropic API Key")).toHaveValue("existing-api-key")
    })

    it("shows empty inputs when no credentials exist", () => {
      vi.mocked(storage.getCredentials).mockReturnValue(null)

      render(<SettingsModal {...defaultProps} />)

      expect(screen.getByLabelText("NYT Token")).toHaveValue("")
      expect(screen.getByLabelText("Anthropic API Key")).toHaveValue("")
    })
  })

  describe("input field types", () => {
    it("shows NYT token in plain text", () => {
      render(<SettingsModal {...defaultProps} />)
      expect(screen.getByLabelText("NYT Token")).toHaveAttribute("type", "text")
    })

    it("shows Anthropic key in plain text", () => {
      render(<SettingsModal {...defaultProps} />)
      expect(screen.getByLabelText("Anthropic API Key")).toHaveAttribute("type", "text")
    })
  })

  describe("saving credentials", () => {
    it("saves credentials when Save is clicked", async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()
      const onClose = vi.fn()

      render(<SettingsModal {...defaultProps} onSave={onSave} onClose={onClose} />)

      const nytTokenInput = screen.getByLabelText("NYT Token")
      const apiKeyInput = screen.getByLabelText("Anthropic API Key")

      // Use clear + type pattern for more reliable input
      await user.clear(nytTokenInput)
      await user.type(nytTokenInput, "my-nyt-token")
      await user.clear(apiKeyInput)
      await user.type(apiKeyInput, "my-api-key")
      await user.click(screen.getByRole("button", { name: "Save" }))

      await waitFor(() => {
        expect(storage.saveCredentials).toHaveBeenCalledWith({
          nytToken: "my-nyt-token",
          anthropicKey: "my-api-key",
        })
      })
    })

    it("trims whitespace from credentials", async () => {
      const user = userEvent.setup()

      render(<SettingsModal {...defaultProps} />)

      const nytTokenInput = screen.getByLabelText("NYT Token")
      const apiKeyInput = screen.getByLabelText("Anthropic API Key")

      // Use clear + type pattern for more reliable input
      await user.clear(nytTokenInput)
      await user.type(nytTokenInput, "  token  ")
      await user.clear(apiKeyInput)
      await user.type(apiKeyInput, "  key  ")
      await user.click(screen.getByRole("button", { name: "Save" }))

      await waitFor(() => {
        expect(storage.saveCredentials).toHaveBeenCalledWith({
          nytToken: "token",
          anthropicKey: "key",
        })
      })
    })

    it("calls onSave and onClose after saving", async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()
      const onClose = vi.fn()

      render(<SettingsModal {...defaultProps} onSave={onSave} onClose={onClose} />)

      await user.type(screen.getByLabelText("NYT Token"), "token")
      await user.click(screen.getByRole("button", { name: "Save" }))

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled()
        expect(onClose).toHaveBeenCalled()
      })
    })

    it("shows saving state", async () => {
      const user = userEvent.setup()

      render(<SettingsModal {...defaultProps} />)

      await user.type(screen.getByLabelText("NYT Token"), "token")
      await user.click(screen.getByRole("button", { name: "Save" }))

      expect(screen.getByText("Saving...")).toBeInTheDocument()
    })
  })

  describe("clearing credentials", () => {
    it("clears credentials when Clear All is clicked", async () => {
      const user = userEvent.setup()
      const onSave = vi.fn()

      vi.mocked(storage.getCredentials).mockReturnValue({
        nytToken: "existing-token",
        anthropicKey: "existing-key",
      })

      render(<SettingsModal {...defaultProps} onSave={onSave} />)

      await user.click(screen.getByRole("button", { name: /Clear All/i }))

      expect(storage.clearCredentials).toHaveBeenCalled()
      expect(onSave).toHaveBeenCalled()
    })

    it("clears input fields when Clear All is clicked", async () => {
      const user = userEvent.setup()

      vi.mocked(storage.getCredentials).mockReturnValue({
        nytToken: "existing-token",
        anthropicKey: "existing-key",
      })

      render(<SettingsModal {...defaultProps} />)

      expect(screen.getByLabelText("NYT Token")).toHaveValue("existing-token")

      await user.click(screen.getByRole("button", { name: /Clear All/i }))

      expect(screen.getByLabelText("NYT Token")).toHaveValue("")
      expect(screen.getByLabelText("Anthropic API Key")).toHaveValue("")
    })

    it("disables Clear All button when no credentials", () => {
      vi.mocked(storage.getCredentials).mockReturnValue(null)

      render(<SettingsModal {...defaultProps} />)

      expect(screen.getByRole("button", { name: /Clear All/i })).toBeDisabled()
    })
  })

  describe("closing modal", () => {
    it("calls onClose when close button is clicked", async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(<SettingsModal {...defaultProps} onClose={onClose} />)

      await user.click(screen.getByLabelText("Close settings"))

      expect(onClose).toHaveBeenCalled()
    })

    it("calls onClose when Cancel is clicked", async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(<SettingsModal {...defaultProps} onClose={onClose} />)

      await user.click(screen.getByRole("button", { name: "Cancel" }))

      expect(onClose).toHaveBeenCalled()
    })

    it("calls onClose when overlay is clicked", async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(<SettingsModal {...defaultProps} onClose={onClose} />)

      // The dialog container has the role="dialog" and acts as the overlay
      const overlay = screen.getByRole("dialog")
      // Click directly on the overlay itself (not the modal content)
      await user.click(overlay)

      expect(onClose).toHaveBeenCalled()
    })

    it("does not close when modal content is clicked", async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(<SettingsModal {...defaultProps} onClose={onClose} />)

      // Click on the modal content
      await user.click(screen.getByText("Settings"))

      expect(onClose).not.toHaveBeenCalled()
    })

    it("calls onClose when Escape is pressed", async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()

      render(<SettingsModal {...defaultProps} onClose={onClose} />)

      await user.keyboard("{Escape}")

      expect(onClose).toHaveBeenCalled()
    })
  })

  describe("accessibility", () => {
    it("has proper dialog role and aria-modal", () => {
      render(<SettingsModal {...defaultProps} />)

      const dialog = screen.getByRole("dialog")
      expect(dialog).toHaveAttribute("aria-modal", "true")
    })

    it("has proper aria-labelledby", () => {
      render(<SettingsModal {...defaultProps} />)

      const dialog = screen.getByRole("dialog")
      expect(dialog).toHaveAttribute("aria-labelledby", "settings-title")
    })

    it("focuses first input when opened", async () => {
      render(<SettingsModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByLabelText("NYT Token")).toHaveFocus()
      })
    })
  })

  describe("styling", () => {
    it("applies custom className to overlay", () => {
      render(<SettingsModal {...defaultProps} className="custom-class" />)

      // The dialog itself is the overlay
      const overlay = screen.getByRole("dialog")
      expect(overlay).toHaveClass("custom-class")
    })
  })
})
