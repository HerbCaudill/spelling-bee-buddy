import type { Meta, StoryObj } from "@storybook/react-vite"
import { TwoLetterList } from "./TwoLetterList"

const meta: Meta<typeof TwoLetterList> = {
  title: "Components/TwoLetterList",
  component: TwoLetterList,
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
type Story = StoryObj<typeof TwoLetterList>

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
 * Shows mix of complete prefixes (AB), partial prefixes (BA), and untouched prefixes (CA, AP)
 */
export const PartialProgress: Story = {
  args: {
    allWords: ["able", "about", "apple", "ball", "balloon", "cape", "capable"],
    foundWords: ["able", "about", "ball"],
  },
}

/**
 * User has found all words - complete puzzle
 */
export const Complete: Story = {
  args: {
    allWords: ["able", "about", "apple", "ball", "balloon", "cape", "capable"],
    foundWords: ["able", "about", "apple", "ball", "balloon", "cape", "capable"],
  },
}

/**
 * No words found yet - just started the puzzle
 */
export const NoWordsFound: Story = {
  args: {
    allWords: ["able", "about", "apple", "ball", "balloon", "cape", "capable"],
    foundWords: [],
  },
}

/**
 * Larger puzzle with many starting letters and prefixes
 * Demonstrates the grouped layout with multiple prefix groups per letter
 */
export const LargePuzzle: Story = {
  args: {
    allWords: [
      // A words
      "able",
      "about",
      "abate",
      "apple",
      "apply",
      "approve",
      // B words
      "ball",
      "balloon",
      "belt",
      "below",
      "beta",
      // C words
      "cable",
      "call",
      "cape",
      "capable",
      "cattle",
      // D words
      "dale",
      "data",
      "delta",
      "deal",
      // E words
      "eat",
      "elate",
      "enable",
      // L words
      "late",
      "label",
      "ladle",
      "letter",
      // T words
      "table",
      "tablet",
      "tall",
      "tattle",
    ],
    foundWords: [
      "able",
      "abate",
      "apple",
      "ball",
      "belt",
      "cable",
      "call",
      "dale",
      "data",
      "late",
      "table",
    ],
  },
}

/**
 * Single letter - all words start with same letter
 */
export const SingleLetter: Story = {
  args: {
    allWords: ["able", "about", "abate", "apple", "apply", "approve"],
    foundWords: ["able", "about", "apple"],
  },
}

/**
 * Almost complete - just one word left to find
 */
export const AlmostComplete: Story = {
  args: {
    allWords: ["able", "about", "apple", "ball", "balloon", "cape", "capable"],
    foundWords: ["able", "about", "apple", "ball", "balloon", "cape"],
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

/**
 * Many prefix groups per letter - shows wrapping behavior
 */
export const ManyPrefixes: Story = {
  args: {
    allWords: [
      // Many A prefixes
      "able",
      "about",
      "accept",
      "account",
      "achieve",
      "action",
      "advance",
      "after",
      "again",
      "almost",
      "alone",
      "amaze",
      "another",
      "appear",
      "arrange",
      "assume",
      "attack",
      "aware",
    ],
    foundWords: ["able", "about", "action", "again", "almost", "appear", "assume"],
  },
}
