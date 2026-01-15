import type { Meta, StoryObj } from "@storybook/react-vite"
import { ProgressBar } from "./ProgressBar"

const meta: Meta<typeof ProgressBar> = {
  title: "Components/ProgressBar",
  component: ProgressBar,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    currentPoints: {
      control: { type: "number", min: 0 },
      description: "Current points earned by the user",
    },
    maxPoints: {
      control: { type: "number", min: 0 },
      description: "Maximum possible points for the puzzle",
    },
    pangrams: {
      control: "object",
      description: "List of all pangrams in the puzzle",
    },
    foundWords: {
      control: "object",
      description: "List of words the user has found",
    },
  },
}

export default meta
type Story = StoryObj<typeof ProgressBar>

/**
 * Starting state with 0 points - user just began the puzzle
 */
export const Beginner: Story = {
  args: {
    currentPoints: 0,
    maxPoints: 200,
    pangrams: ["pangram1", "pangram2"],
    foundWords: [],
  },
}

/**
 * User is making good progress - around "Nice" rank (25%)
 */
export const MidProgress: Story = {
  args: {
    currentPoints: 50,
    maxPoints: 200,
    pangrams: ["pangram1", "pangram2"],
    foundWords: ["word1", "word2", "word3", "pangram1"],
  },
}

/**
 * User has reached Genius rank (70%) - the typical goal for most players
 */
export const Genius: Story = {
  args: {
    currentPoints: 140,
    maxPoints: 200,
    pangrams: ["pangram1", "pangram2"],
    foundWords: ["word1", "word2", "word3", "word4", "word5", "pangram1", "pangram2"],
  },
}

/**
 * Perfect completion - user found all words and reached Queen Bee!
 */
export const QueenBee: Story = {
  args: {
    currentPoints: 200,
    maxPoints: 200,
    pangrams: ["pangram1", "pangram2"],
    foundWords: ["word1", "word2", "word3", "word4", "word5", "word6", "pangram1", "pangram2"],
  },
}

/**
 * Progress with pangrams shown - highlighting the pangram tracking feature
 */
export const WithPangrams: Story = {
  args: {
    currentPoints: 85,
    maxPoints: 200,
    pangrams: ["placebo", "capable", "peaceable"],
    foundWords: ["place", "cape", "able", "placebo", "capable"],
  },
}

/**
 * Progress with a single pangram found out of multiple
 */
export const PartialPangrams: Story = {
  args: {
    currentPoints: 60,
    maxPoints: 200,
    pangrams: ["pangram1", "pangram2", "pangram3"],
    foundWords: ["word1", "word2", "pangram1"],
  },
}

/**
 * All pangrams found - shows the highlighted state
 */
export const AllPangramsFound: Story = {
  args: {
    currentPoints: 120,
    maxPoints: 200,
    pangrams: ["pangram1", "pangram2"],
    foundWords: ["word1", "word2", "word3", "pangram1", "pangram2"],
  },
}

/**
 * Single pangram puzzle - uses singular "pangram" label
 */
export const SinglePangram: Story = {
  args: {
    currentPoints: 45,
    maxPoints: 150,
    pangrams: ["onlypangram"],
    foundWords: ["word1", "word2"],
  },
}

/**
 * No pangrams provided - pangram count is hidden
 */
export const NoPangrams: Story = {
  args: {
    currentPoints: 75,
    maxPoints: 200,
    pangrams: [],
    foundWords: ["word1", "word2", "word3"],
  },
}

/**
 * Edge case: zero max points (empty puzzle)
 */
export const EmptyPuzzle: Story = {
  args: {
    currentPoints: 0,
    maxPoints: 0,
    pangrams: [],
    foundWords: [],
  },
}

/**
 * "Getting Warm" rank - just starting to make progress (2%)
 */
export const GettingWarm: Story = {
  args: {
    currentPoints: 4,
    maxPoints: 200,
    pangrams: ["pangram1"],
    foundWords: ["word"],
  },
}

/**
 * "Amazing" rank - just before Genius (50%)
 */
export const Amazing: Story = {
  args: {
    currentPoints: 100,
    maxPoints: 200,
    pangrams: ["pangram1", "pangram2"],
    foundWords: ["word1", "word2", "word3", "word4", "pangram1"],
  },
}
