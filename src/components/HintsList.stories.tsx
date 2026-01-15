import type { Meta, StoryObj } from "@storybook/react-vite"
import { HintsList } from "./HintsList"
import type { HintsByPrefix } from "@/types"

const meta: Meta<typeof HintsList> = {
  title: "Components/HintsList",
  component: HintsList,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    hints: {
      control: "object",
      description: "Hints grouped by two-letter prefix",
    },
    foundWords: {
      control: "object",
      description: "Words the user has found",
    },
  },
}

export default meta
type Story = StoryObj<typeof HintsList>

// Sample hints data for stories
const sampleHints: HintsByPrefix = {
  AB: [
    { hint: "Capable of being done", length: 4 },
    { hint: "Reduce or diminish", length: 5 },
    { hint: "Give up or abandon", length: 4 },
  ],
  BA: [
    { hint: "A bundle of goods", length: 4 },
    { hint: "A type of dance", length: 6 },
  ],
  CA: [
    { hint: "A thick wire rope", length: 5 },
    { hint: "A secret group or faction", length: 5 },
  ],
  TA: [
    { hint: "A piece of furniture", length: 5 },
    { hint: "A flat handheld device", length: 6 },
    { hint: "Prohibited or forbidden", length: 5 },
  ],
}

/**
 * Empty state - no hints available
 */
export const Empty: Story = {
  args: {
    hints: {},
    foundWords: [],
  },
}

/**
 * All sections collapsed (default state)
 */
export const AllCollapsed: Story = {
  args: {
    hints: sampleHints,
    foundWords: [],
  },
}

/**
 * Shows partial progress - user has found some words
 */
export const PartialProgress: Story = {
  args: {
    hints: sampleHints,
    foundWords: ["able", "bale", "cable", "table"],
  },
}

/**
 * One section is complete - all words in that prefix found
 */
export const OneCompleteSection: Story = {
  args: {
    hints: {
      AB: [
        { hint: "Capable of being done", length: 4 },
        { hint: "Give up or abandon", length: 4 },
      ],
      BA: [
        { hint: "A bundle of goods", length: 4 },
        { hint: "A type of dance", length: 6 },
      ],
      CA: [
        { hint: "A thick wire rope", length: 5 },
      ],
    },
    foundWords: ["able", "abet", "bale"], // AB section complete (2 words)
  },
}

/**
 * All sections complete - puzzle finished
 */
export const AllComplete: Story = {
  args: {
    hints: {
      AB: [
        { hint: "Capable of being done", length: 4 },
        { hint: "Reduce or diminish", length: 5 },
      ],
      CA: [
        { hint: "A thick wire rope", length: 5 },
      ],
    },
    foundWords: ["able", "abate", "cable"],
  },
}

/**
 * Single prefix with many hints
 */
export const SinglePrefixManyHints: Story = {
  args: {
    hints: {
      AB: [
        { hint: "Capable of being done", length: 4 },
        { hint: "Reduce or diminish", length: 5 },
        { hint: "Give up or abandon", length: 4 },
        { hint: "Remove by cutting", length: 6 },
        { hint: "Stomach muscles", length: 3 },
        { hint: "A church recess", length: 4 },
        { hint: "Wash or cleanse", length: 5 },
        { hint: "Take away", length: 5 },
      ],
    },
    foundWords: ["able", "abate", "abet"],
  },
}

/**
 * Many prefixes for scrolling/overflow testing
 */
export const ManyPrefixes: Story = {
  args: {
    hints: {
      AB: [{ hint: "Capable of being done", length: 4 }],
      AC: [{ hint: "To behave", length: 3 }],
      AD: [{ hint: "To include", length: 3 }],
      AL: [{ hint: "Relating to all", length: 3 }],
      AN: [{ hint: "Indefinite article", length: 2 }],
      AP: [{ hint: "A type of primate", length: 3 }],
      AT: [{ hint: "Positioned near", length: 2 }],
      BA: [{ hint: "A bundle of goods", length: 4 }],
      BE: [{ hint: "To exist", length: 2 }],
      BL: [{ hint: "Color or pale", length: 5 }],
      CA: [{ hint: "A thick wire rope", length: 5 }],
      CE: [{ hint: "A room", length: 4 }],
      CL: [{ hint: "To applaud", length: 4 }],
      DA: [{ hint: "Information", length: 4 }],
      DE: [{ hint: "A valley", length: 4 }],
    },
    foundWords: ["able", "act", "add", "bale", "cable"],
  },
}

/**
 * Hints with varying lengths within same prefix
 */
export const VaryingLengths: Story = {
  args: {
    hints: {
      AB: [
        { hint: "Short hint", length: 4 },
        { hint: "Medium length hint text", length: 5 },
        { hint: "This is a longer hint that describes the word in more detail", length: 7 },
        { hint: "A very detailed and comprehensive hint for a longer word", length: 9 },
      ],
    },
    foundWords: [],
  },
}

/**
 * Just started - no words found yet, shows all 0/N counts
 */
export const NoWordsFound: Story = {
  args: {
    hints: sampleHints,
    foundWords: [],
  },
}

/**
 * Single hint in single prefix - minimal case
 */
export const SingleHint: Story = {
  args: {
    hints: {
      AB: [{ hint: "Capable of being done", length: 4 }],
    },
    foundWords: [],
  },
}

/**
 * Single hint found - complete minimal case
 */
export const SingleHintFound: Story = {
  args: {
    hints: {
      AB: [{ hint: "Capable of being done", length: 4 }],
    },
    foundWords: ["able"],
  },
}
