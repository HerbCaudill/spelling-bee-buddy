import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  getCredentials,
  saveCredentials,
  clearCredentials,
  hasCredentials,
  updateCredential,
} from "./storage"
import type { UserCredentials } from "@/types"

describe("storage", () => {
  const STORAGE_KEY = "spelling-bee-buddy-credentials"

  beforeEach(() => {
    localStorage.clear()
  })

  describe("getCredentials", () => {
    it("returns null when no credentials are stored", () => {
      expect(getCredentials()).toBeNull()
    })

    it("returns credentials when stored", () => {
      const credentials: UserCredentials = {
        nytToken: "test-token",
        anthropicKey: "sk-test-key",
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials))

      expect(getCredentials()).toEqual(credentials)
    })

    it("returns null for invalid JSON", () => {
      localStorage.setItem(STORAGE_KEY, "not-valid-json")
      expect(getCredentials()).toBeNull()
    })

    it("returns null for missing nytToken", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ anthropicKey: "key" }))
      expect(getCredentials()).toBeNull()
    })

    it("returns null for missing anthropicKey", () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ nytToken: "token" }))
      expect(getCredentials()).toBeNull()
    })

    it("returns null for non-string values", () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ nytToken: 123, anthropicKey: true })
      )
      expect(getCredentials()).toBeNull()
    })
  })

  describe("saveCredentials", () => {
    it("saves credentials to localStorage", () => {
      const credentials: UserCredentials = {
        nytToken: "test-token",
        anthropicKey: "sk-test-key",
      }
      saveCredentials(credentials)

      const stored = localStorage.getItem(STORAGE_KEY)
      expect(JSON.parse(stored!)).toEqual(credentials)
    })

    it("overwrites existing credentials", () => {
      const oldCredentials: UserCredentials = {
        nytToken: "old-token",
        anthropicKey: "old-key",
      }
      const newCredentials: UserCredentials = {
        nytToken: "new-token",
        anthropicKey: "new-key",
      }

      saveCredentials(oldCredentials)
      saveCredentials(newCredentials)

      expect(getCredentials()).toEqual(newCredentials)
    })
  })

  describe("clearCredentials", () => {
    it("removes credentials from localStorage", () => {
      const credentials: UserCredentials = {
        nytToken: "test-token",
        anthropicKey: "sk-test-key",
      }
      saveCredentials(credentials)
      expect(getCredentials()).not.toBeNull()

      clearCredentials()
      expect(getCredentials()).toBeNull()
    })

    it("does nothing if no credentials exist", () => {
      expect(() => clearCredentials()).not.toThrow()
    })
  })

  describe("hasCredentials", () => {
    it("returns false when no credentials are stored", () => {
      expect(hasCredentials()).toBe(false)
    })

    it("returns true when credentials are stored", () => {
      const credentials: UserCredentials = {
        nytToken: "test-token",
        anthropicKey: "sk-test-key",
      }
      saveCredentials(credentials)
      expect(hasCredentials()).toBe(true)
    })

    it("returns false for invalid stored data", () => {
      localStorage.setItem(STORAGE_KEY, "invalid-json")
      expect(hasCredentials()).toBe(false)
    })
  })

  describe("updateCredential", () => {
    it("updates nytToken while preserving anthropicKey", () => {
      const credentials: UserCredentials = {
        nytToken: "old-token",
        anthropicKey: "sk-test-key",
      }
      saveCredentials(credentials)

      updateCredential("nytToken", "new-token")

      expect(getCredentials()).toEqual({
        nytToken: "new-token",
        anthropicKey: "sk-test-key",
      })
    })

    it("updates anthropicKey while preserving nytToken", () => {
      const credentials: UserCredentials = {
        nytToken: "test-token",
        anthropicKey: "sk-old-key",
      }
      saveCredentials(credentials)

      updateCredential("anthropicKey", "sk-new-key")

      expect(getCredentials()).toEqual({
        nytToken: "test-token",
        anthropicKey: "sk-new-key",
      })
    })

    it("creates credentials with defaults if none exist", () => {
      updateCredential("nytToken", "new-token")

      expect(getCredentials()).toEqual({
        nytToken: "new-token",
        anthropicKey: "",
      })
    })
  })
})
