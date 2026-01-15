import type { StorybookConfig } from "@storybook/react-vite"
import path from "path"
import { fileURLToPath } from "url"
import { mergeConfig, type Plugin } from "vite"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Recursively filter out PWA-related plugins
function filterPWAPlugins(plugins: unknown[]): unknown[] {
  return plugins
    .filter((plugin) => {
      if (!plugin || typeof plugin !== "object") return true
      const p = plugin as Plugin
      // Filter out vite-plugin-pwa and its related plugins
      if (p.name && p.name.includes("pwa")) return false
      return true
    })
    .map((plugin) => {
      // Handle nested plugin arrays
      if (Array.isArray(plugin)) {
        return filterPWAPlugins(plugin)
      }
      return plugin
    })
}

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
  ],
  framework: "@storybook/react-vite",
  viteFinal: async (config) => {
    // Remove PWA plugin from Storybook build
    const plugins = filterPWAPlugins(config.plugins || [])

    return mergeConfig(
      { ...config, plugins },
      {
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "../src"),
          },
        },
      }
    )
  },
}

export default config