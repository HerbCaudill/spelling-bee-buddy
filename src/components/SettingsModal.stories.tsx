import type { Meta, StoryObj } from "@storybook/react-vite"
import { SettingsModal } from "./SettingsModal"
import { useEffect } from "react"
import { saveCredentials, clearCredentials } from "@/lib/storage"

const meta: Meta<typeof SettingsModal> = {
  title: "Components/SettingsModal",
  component: SettingsModal,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    isOpen: {
      control: "boolean",
      description: "Whether the modal is open",
    },
    onClose: {
      action: "close",
      description: "Callback when the modal should be closed",
    },
    onSave: {
      action: "save",
      description: "Callback when credentials are saved",
    },
    className: {
      control: "text",
      description: "Additional CSS classes for the modal overlay",
    },
  },
  // Clear credentials before each story to ensure clean state
  decorators: [
    Story => {
      useEffect(() => {
        clearCredentials()
        return () => clearCredentials()
      }, [])
      return <Story />
    },
  ],
}

export default meta
type Story = StoryObj<typeof SettingsModal>

/**
 * Default open modal with empty credentials
 * Shows placeholder text in both input fields
 */
export const Empty: Story = {
  args: {
    isOpen: true,
  },
}

/**
 * Modal with existing NYT token pre-filled
 * User has previously saved their progress tracking credentials
 */
export const WithNYTToken: Story = {
  decorators: [
    Story => {
      useEffect(() => {
        saveCredentials({ nytToken: "abc123-nyt-token-xyz789", anthropicKey: "" })
        return () => clearCredentials()
      }, [])
      return <Story />
    },
  ],
  args: {
    isOpen: true,
  },
}

/**
 * Modal with existing Anthropic API key pre-filled
 * User has previously saved their hints API key
 */
export const WithAnthropicKey: Story = {
  decorators: [
    Story => {
      useEffect(() => {
        saveCredentials({ nytToken: "", anthropicKey: "sk-ant-api03-example-key-1234567890" })
        return () => clearCredentials()
      }, [])
      return <Story />
    },
  ],
  args: {
    isOpen: true,
  },
}

/**
 * Modal with both credentials pre-filled
 * User has full configuration for both progress tracking and AI hints
 */
export const WithBothCredentials: Story = {
  decorators: [
    Story => {
      useEffect(() => {
        saveCredentials({
          nytToken: "abc123-nyt-token-xyz789",
          anthropicKey: "sk-ant-api03-example-key-1234567890",
        })
        return () => clearCredentials()
      }, [])
      return <Story />
    },
  ],
  args: {
    isOpen: true,
  },
}

/**
 * Modal in closed state - renders nothing
 * Demonstrates the component returns null when isOpen is false
 */
export const Closed: Story = {
  args: {
    isOpen: false,
  },
  parameters: {
    docs: {
      description: {
        story: "When isOpen is false, the modal renders nothing. This story shows an empty canvas.",
      },
    },
  },
}

/**
 * Modal with very long credential values
 * Tests how the input fields handle overflow
 */
export const WithLongCredentials: Story = {
  decorators: [
    Story => {
      useEffect(() => {
        saveCredentials({
          nytToken:
            "very-long-nyt-token-that-might-overflow-the-input-field-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
          anthropicKey:
            "sk-ant-api03-very-long-api-key-that-might-overflow-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz",
        })
        return () => clearCredentials()
      }, [])
      return <Story />
    },
  ],
  args: {
    isOpen: true,
  },
}
