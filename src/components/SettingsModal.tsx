import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { IconX, IconTrash } from "@tabler/icons-react"
import { getCredentials, saveCredentials, clearCredentials } from "@/lib/storage"
import type { UserCredentials } from "@/types"

export interface SettingsModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when the modal should be closed */
  onClose: () => void
  /** Callback when credentials are saved (triggers data refetch) */
  onSave?: () => void
  /** Optional className for the modal overlay */
  className?: string
}

/**
 * Modal for managing user credentials
 *
 * Allows users to:
 * - Enter their NYT-S cookie token for progress tracking
 * - Enter their Anthropic API key for AI-generated hints
 * - Clear stored credentials
 */
export function SettingsModal({ isOpen, onClose, onSave, className }: SettingsModalProps) {
  const [nytToken, setNytToken] = useState("")
  const [anthropicKey, setAnthropicKey] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  // Load existing credentials when modal opens
  useEffect(() => {
    if (isOpen) {
      const existing = getCredentials()
      setNytToken(existing?.nytToken ?? "")
      setAnthropicKey(existing?.anthropicKey ?? "")

      // Focus the first input after a short delay for animation
      setTimeout(() => {
        firstInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Trap focus within modal
  useEffect(() => {
    if (!isOpen) return

    const modal = modalRef.current
    if (!modal) return

    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    document.addEventListener("keydown", handleTabKey)
    return () => document.removeEventListener("keydown", handleTabKey)
  }, [isOpen])

  const handleSave = () => {
    setIsSaving(true)

    const credentials: UserCredentials = {
      nytToken: nytToken.trim(),
      anthropicKey: anthropicKey.trim(),
    }

    saveCredentials(credentials)

    // Small delay to show saving state
    setTimeout(() => {
      setIsSaving(false)
      onSave?.()
      onClose()
    }, 200)
  }

  const handleClear = () => {
    clearCredentials()
    setNytToken("")
    setAnthropicKey("")
    onSave?.()
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const hasCredentials = nytToken.trim() || anthropicKey.trim()

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",
        className,
      )}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div
        ref={modalRef}
        className="bg-background relative w-full max-w-md rounded-lg p-6 shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="focus:ring-ring absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none"
          aria-label="Close settings"
        >
          <IconX className="size-4" />
        </button>

        {/* Title */}
        <h2 id="settings-title" className="mb-6 text-lg font-semibold">
          Settings
        </h2>

        {/* Form */}
        <div className="space-y-6">
          {/* NYT Token */}
          <div className="space-y-2">
            <label htmlFor="nyt-token" className="block text-sm font-medium">
              NYT Token
            </label>
            <input
              ref={firstInputRef}
              id="nyt-token"
              type="text"
              value={nytToken}
              onChange={e => setNytToken(e.target.value)}
              placeholder="Enter your NYT-S cookie value"
              className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
              autoComplete="off"
            />
            <p className="text-muted-foreground text-xs">
              Used to track your progress. Find this in your browser&apos;s cookies for nytimes.com
              (look for NYT-S).
            </p>
          </div>

          {/* Anthropic API Key */}
          <div className="space-y-2">
            <label htmlFor="anthropic-key" className="block text-sm font-medium">
              Anthropic API Key
            </label>
            <input
              id="anthropic-key"
              type="text"
              value={anthropicKey}
              onChange={e => setAnthropicKey(e.target.value)}
              placeholder="Enter your Anthropic API key"
              className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
              autoComplete="off"
            />
            <p className="text-muted-foreground text-xs">
              Used to generate AI hints.{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline underline-offset-2"
              >
                Get an API key
              </a>
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={!hasCredentials || isSaving}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <IconTrash className="size-4" />
            Clear All
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
