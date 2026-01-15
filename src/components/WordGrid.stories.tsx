import type { Meta, StoryObj } from "@storybook/react-vite"
import { WordGrid } from "./WordGrid"

const meta: Meta<typeof WordGrid> = {
  title: "Components/WordGrid",
  component: WordGrid,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    allWords: {
      control: "object",
      description: "All valid words for the puzzle",
    },
    foundWords: {
      control: "object",
      description: "Words the user has found",
    },
  },
}

export default meta
type Story = StoryObj<typeof WordGrid>

/**
 * Empty state - no puzzle data available
 */
export const Empty: Story = {
  args: {
    allWords: [],
    foundWords: [],
  },
}

/**
 * User has started the puzzle and found some words
 */
export const PartialProgress: Story = {
  args: {
    allWords: [
      "able",
      "abet",
      "abate",
      "bale",
      "bale",
      "beat",
      "belt",
      "beta",
      "cable",
      "cabal",
      "table",
      "tablet",
      "tabletop",
    ],
    foundWords: ["able", "bale", "beat", "cable", "table"],
  },
}

/**
 * User has found all words - complete puzzle
 */
export const Complete: Story = {
  args: {
    allWords: [
      "able",
      "abet",
      "abate",
      "bale",
      "beat",
      "belt",
      "beta",
      "cable",
      "cabal",
      "table",
      "tablet",
    ],
    foundWords: [
      "able",
      "abet",
      "abate",
      "bale",
      "beat",
      "belt",
      "beta",
      "cable",
      "cabal",
      "table",
      "tablet",
    ],
  },
}

/**
 * Puzzle with words starting with only one letter
 */
export const SingleLetter: Story = {
  args: {
    allWords: ["able", "abet", "abate", "above", "about", "abstract", "abundance"],
    foundWords: ["able", "abate", "about"],
  },
}

/**
 * Just started - no words found yet
 */
export const NoWordsFound: Story = {
  args: {
    allWords: ["able", "abet", "abate", "bale", "beat", "cable", "cabal", "table"],
    foundWords: [],
  },
}

/**
 * Larger puzzle with many starting letters
 */
export const LargePuzzle: Story = {
  args: {
    allWords: [
      // A words
      "able",
      "abet",
      "abate",
      "about",
      // B words
      "bale",
      "beat",
      "belt",
      "beta",
      "ballet",
      // C words
      "cable",
      "cabal",
      "call",
      "cattle",
      // D words
      "dale",
      "data",
      "delta",
      // E words
      "eat",
      "elate",
      // L words
      "late",
      "label",
      "ladle",
      // T words
      "table",
      "tablet",
      "tall",
      "tattle",
    ],
    foundWords: ["able", "abate", "bale", "beat", "cable", "call", "dale", "data", "late", "table"],
  },
}

/**
 * Puzzle showing various word lengths (4-8 letters)
 */
export const VariedLengths: Story = {
  args: {
    allWords: [
      "able", // 4
      "abate", // 5
      "ablate", // 6
      "ablated", // 7
      "ablation", // 8
      "bale", // 4
      "cable", // 5
      "tableau", // 7
      "tableaux", // 8
    ],
    foundWords: ["able", "ablate", "bale", "cable"],
  },
}

/**
 * Almost complete - just one word left
 */
export const AlmostComplete: Story = {
  args: {
    allWords: ["able", "abet", "abate", "bale", "beat", "cable"],
    foundWords: [
      "able",
      "abet",
      "abate",
      "bale",
      "beat",
      // "cable" is the one word left to find
    ],
  },
}

/**
 * Single word puzzle - edge case
 */
export const SingleWord: Story = {
  args: {
    allWords: ["pangram"],
    foundWords: [],
  },
}

/**
 * Single word found - edge case
 */
export const SingleWordFound: Story = {
  args: {
    allWords: ["pangram"],
    foundWords: ["pangram"],
  },
}
