import type { Meta, StoryObj } from "@storybook/react-vite"
import { StatsDisplay, StatsNotAvailable } from "./StatsDisplay"
import type { PuzzleStats } from "@/types"

const meta: Meta<typeof StatsDisplay> = {
  title: "Components/StatsDisplay",
  component: StatsDisplay,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    stats: {
      control: "object",
      description: "Puzzle statistics including player counts per word",
    },
    allWords: {
      control: "object",
      description: "All valid words in the puzzle",
    },
    foundWords: {
      control: "object",
      description: "Words found by the user",
    },
  },
}

export default meta
type Story = StoryObj<typeof StatsDisplay>

// Sample stats data for stories
const sampleWords = [
  "able",
  "about",
  "above",
  "apple",
  "ample",
  "babble",
  "babel",
  "cable",
  "capable",
  "chapel",
  "cobble",
  "couple",
]

const sampleStats: PuzzleStats = {
  id: 20035,
  numberOfUsers: 12543,
  n: 10000,
  answers: {
    able: 11500,
    about: 10200,
    above: 9800,
    apple: 8500,
    ample: 6200,
    babble: 4800,
    babel: 2100,
    cable: 7300,
    capable: 5600,
    chapel: 4200,
    cobble: 1800,
    couple: 9100,
  },
}

/**
 * No stats available - stats is null, component returns nothing
 */
export const NoStats: Story = {
  args: {
    stats: null,
    allWords: sampleWords,
    foundWords: [],
  },
}

/**
 * User hasn't found any words yet - all words shown as masked (e.g., "A (4)")
 */
export const NoWordsFound: Story = {
  args: {
    stats: sampleStats,
    allWords: sampleWords,
    foundWords: [],
  },
}

/**
 * User has found some words - mix of revealed words and masked hints
 */
export const PartialProgress: Story = {
  args: {
    stats: sampleStats,
    allWords: sampleWords,
    foundWords: ["able", "about", "apple", "cable"],
  },
}

/**
 * User has found all words - all words revealed
 */
export const AllWordsFound: Story = {
  args: {
    stats: sampleStats,
    allWords: sampleWords,
    foundWords: sampleWords,
  },
}

/**
 * Mix of common and rare words - shows range of percentages
 */
export const MixedPopularity: Story = {
  args: {
    stats: {
      id: 20035,
      numberOfUsers: 10000,
      n: 10000,
      answers: {
        easy: 9500,
        common: 7500,
        medium: 5000,
        harder: 2500,
        tricky: 1000,
        rare: 250,
      },
    },
    allWords: ["easy", "common", "medium", "harder", "tricky", "rare"],
    foundWords: ["easy", "medium", "rare"],
  },
}

/**
 * Very low percentages - tests decimal formatting
 */
export const LowPercentages: Story = {
  args: {
    stats: {
      id: 20035,
      numberOfUsers: 10000,
      n: 10000,
      answers: {
        obscure: 50,
        rare: 100,
        uncommon: 500,
        typical: 2500,
      },
    },
    allWords: ["obscure", "rare", "uncommon", "typical"],
    foundWords: ["rare"],
  },
}

/**
 * Large player count - tests number formatting with thousands separator
 */
export const LargePlayerCount: Story = {
  args: {
    stats: {
      id: 20035,
      numberOfUsers: 156789,
      n: 10000,
      answers: {
        popular: 145000,
        common: 98000,
        average: 75000,
      },
    },
    allWords: ["popular", "common", "average"],
    foundWords: ["popular"],
  },
}

/**
 * Small player count - early in the day or new puzzle
 */
export const SmallPlayerCount: Story = {
  args: {
    stats: {
      id: 20035,
      numberOfUsers: 42,
      n: 42,
      answers: {
        first: 40,
        second: 35,
        third: 20,
      },
    },
    allWords: ["first", "second", "third"],
    foundWords: [],
  },
}

/**
 * Single word puzzle - minimal case
 */
export const SingleWord: Story = {
  args: {
    stats: {
      id: 20035,
      numberOfUsers: 5000,
      n: 10000,
      answers: {
        onlyword: 4500,
      },
    },
    allWords: ["onlyword"],
    foundWords: [],
  },
}

/**
 * Many words - larger puzzle with more entries
 */
export const ManyWords: Story = {
  args: {
    stats: {
      id: 20035,
      numberOfUsers: 15000,
      n: 10000,
      answers: {
        able: 14000,
        above: 13500,
        ace: 12800,
        ache: 11200,
        acre: 10500,
        album: 9800,
        allow: 8900,
        alone: 8100,
        alpha: 7200,
        alter: 6500,
        ample: 5800,
        ankle: 5100,
        apple: 4200,
        apply: 3500,
        azure: 2800,
        babel: 2100,
        badge: 1500,
        balance: 900,
        bamboo: 450,
        bizarre: 150,
      },
    },
    allWords: [
      "able",
      "above",
      "ace",
      "ache",
      "acre",
      "album",
      "allow",
      "alone",
      "alpha",
      "alter",
      "ample",
      "ankle",
      "apple",
      "apply",
      "azure",
      "babel",
      "badge",
      "balance",
      "bamboo",
      "bizarre",
    ],
    foundWords: ["able", "ace", "alpha", "apple", "azure"],
  },
}

// StatsNotAvailable component story
const metaNotAvailable: Meta<typeof StatsNotAvailable> = {
  title: "Components/StatsNotAvailable",
  component: StatsNotAvailable,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
}

export const NotAvailableYet: StoryObj<typeof StatsNotAvailable> = {
  render: () => <StatsNotAvailable />,
}

export const NotAvailableWithClassName: StoryObj<typeof StatsNotAvailable> = {
  render: () => <StatsNotAvailable className="max-w-md" />,
}
