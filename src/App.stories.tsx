import type { Meta, StoryObj } from "@storybook/react-vite"
import { AppContent } from "./AppContent"
import { calculateTotalPoints } from "@/lib/utils"
import type { GameData, ActivePuzzlesResponse, HintsByPrefix, PuzzleStats } from "@/types"

/**
 * Today's puzzle data (January 15, 2026)
 * Letters: center "L", outer "A E I N T U"
 */
const PUZZLE_DATE = "2026-01-15"
const CENTER_LETTER = "l"
const OUTER_LETTERS = ["a", "e", "i", "n", "t", "u"]

// All valid answers for today's puzzle
const ALL_ANSWERS = [
  // 4-letter words
  "alit",
  "anal",
  "ante",
  "anti",
  "elan",
  "etui",
  "ilea",
  "lain",
  "lane",
  "late",
  "latte",
  "lean",
  "lent",
  "lien",
  "lieu",
  "line",
  "lint",
  "lite",
  "luna",
  "lune",
  "lute",
  "nail",
  "null",
  "tail",
  "tale",
  "tall",
  "teal",
  "tell",
  "tile",
  "till",
  "tune",
  "ulna",
  "unit",
  // 5-letter words
  "alien",
  "aline",
  "alone",
  "anal",
  "anile",
  "atilt",
  "elate",
  "elite",
  "ennui",
  "inlet",
  "intel",
  "lateen",
  "latent",
  "latte",
  "leant",
  "lilac",
  "linen",
  "llama",
  "natal",
  "taint",
  "talon",
  "titan",
  "title",
  "tulle",
  "until",
  "utile",
  // 6-letter words
  "anneal",
  "entail",
  "innate",
  "insulate",
  "lanate",
  "latent",
  "latina",
  "lineal",
  "luteal",
  "tallit",
  "tattle",
  "tenant",
  "tenail",
  "tintinnabulation",
  "tittle",
  "tunnel",
  "unlawful",
  // 7+ letter words
  "alienate",
  "alliterate",
  "annulate",
  "antennae",
  "attenuate",
  "talliate",
  "lineate",
  "nailfile",
  "nautili",
  "retaliate",
  "titanate",
  "unlit",
  "ventilate",
]

// Pangrams (use all letters)
const PANGRAMS = ["ventilate", "lineate"]

// Dedupe and sort answers
const UNIQUE_ANSWERS = [...new Set([...ALL_ANSWERS, ...PANGRAMS])].sort()

/**
 * Create GameData for today's puzzle
 */
function createTodayPuzzle(): GameData {
  return {
    today: {
      displayWeekday: "Wednesday",
      displayDate: "January 15, 2026",
      printDate: PUZZLE_DATE,
      centerLetter: CENTER_LETTER,
      outerLetters: OUTER_LETTERS,
      validLetters: [CENTER_LETTER, ...OUTER_LETTERS],
      pangrams: PANGRAMS,
      answers: UNIQUE_ANSWERS,
      id: 20050,
    },
  }
}

/**
 * Create active puzzles data for the date picker
 */
function createActivePuzzles(): ActivePuzzlesResponse {
  const puzzles = []
  const baseDate = new Date(PUZZLE_DATE + "T12:00:00")

  // Generate 14 days of puzzles
  for (let i = 13; i >= 0; i--) {
    const date = new Date(baseDate)
    date.setDate(baseDate.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]
    puzzles.push({
      id: 20050 - i,
      center_letter: CENTER_LETTER,
      outer_letters: OUTER_LETTERS.join(""),
      pangrams: PANGRAMS,
      answers: UNIQUE_ANSWERS,
      print_date: dateStr,
      editor: "Sam Ezersky",
    })
  }

  return {
    puzzles,
    today: 13, // Last puzzle is today
    yesterday: 12,
    thisWeek: [7, 8, 9, 10, 11, 12, 13],
    lastWeek: [0, 1, 2, 3, 4, 5, 6],
  }
}

/**
 * Create hints for all words grouped by two-letter prefix
 */
function createHints(): HintsByPrefix {
  const hintDescriptions: Record<string, string> = {
    alien: "Not from Earth, or a resident who's not a citizen",
    aline: "Variant spelling of 'align'",
    alit: "Past tense: descended and settled",
    alone: "By oneself, solitary",
    anal: "Relating to a certain body part, or excessively orderly",
    anile: "Like an old woman",
    anneal: "Heat and cool metal to toughen it",
    ante: "Poker stake paid before cards are dealt",
    anti: "Opposed to something",
    antennae: "Plural of antenna",
    atilt: "In a tilted position",
    attenuate: "Reduce the force or value of",
    elate: "Make ecstatically happy",
    elite: "A select group, the best",
    ennui: "A feeling of listlessness and dissatisfaction",
    entail: "Involve as a necessary consequence",
    elan: "Enthusiastic and energetic style",
    etui: "A small ornamental case for needles",
    ilea: "Plural of ileum, part of the small intestine",
    inlet: "A small arm of the sea or a lake",
    innate: "Inborn, natural",
    intel: "Information of military or political value",
    lain: "Past participle of 'lie'",
    lanate: "Woolly, covered with fine hairs",
    lane: "A narrow road or path",
    late: "After the expected time",
    latent: "Present but not yet active or visible",
    latina: "A woman of Latin American origin",
    lateen: "A triangular sail set on a long yard",
    latte: "Coffee drink with steamed milk",
    lean: "Thin, or to incline",
    leant: "Past tense of lean (British)",
    lent: "Past tense of lend, or a Christian season",
    lien: "A legal claim on property as security for a debt",
    lieu: "Instead of (in ___ of)",
    lilac: "A fragrant purple flowering shrub",
    line: "A long narrow mark or band",
    lineal: "In a direct line of descent",
    lineate: "Marked with lines",
    linen: "Cloth made from flax",
    lint: "Fluffy fibers that collect on clothes",
    lite: "Low in calories or alcohol",
    llama: "A South American camelid",
    luna: "The moon, especially in poetry",
    lune: "A crescent-shaped figure",
    lute: "A stringed musical instrument",
    luteal: "Relating to the corpus luteum",
    nail: "A small metal spike, or fingernail",
    natal: "Relating to birth",
    nautili: "Plural of nautilus",
    null: "Having no value or significance",
    tail: "The rear appendage of an animal",
    taint: "A trace of something bad",
    tale: "A story",
    tall: "Of great height",
    tallit: "Jewish prayer shawl",
    talon: "A claw, especially of a bird of prey",
    tattle: "Report someone's wrongdoing",
    teal: "A blue-green color, or a type of duck",
    tell: "Communicate information to someone",
    tenant: "Someone who rents property",
    tenail: "A low outwork in fortification",
    tile: "A flat piece for covering surfaces",
    till: "Up to the time of, or a cash register drawer",
    tintinnabulation: "A ringing or tinkling sound",
    titan: "A person of great size, strength, or importance",
    titanate: "A salt containing titanium",
    title: "A name of a book, or a position",
    tittle: "A tiny amount, a dot",
    tulle: "A fine netted fabric",
    tune: "A melody",
    tunnel: "An underground passage",
    ulna: "A bone in the forearm",
    unit: "A single thing regarded as part of a whole",
    unlit: "Not lit, dark",
    until: "Up to the time that",
    utile: "Useful, practical",
    ventilate: "Cause air to circulate through a space",
    alienate: "Cause someone to become unfriendly",
    alliterate: "Use the same letter or sound at the beginning of words",
    annulate: "Having rings or ringlike markings",
  }

  const hints: HintsByPrefix = {}

  for (const word of UNIQUE_ANSWERS) {
    const prefix = word.slice(0, 2).toUpperCase()
    if (!hints[prefix]) {
      hints[prefix] = []
    }
    hints[prefix].push({
      hint: hintDescriptions[word] ?? `A ${word.length}-letter word`,
      length: word.length,
    })
  }

  // Sort each prefix's hints by length
  for (const prefix of Object.keys(hints)) {
    hints[prefix].sort((a, b) => a.length - b.length)
  }

  return hints
}

/**
 * Create stats showing how many players found each word
 */
function createStats(multiplier: number = 1): PuzzleStats {
  const answers: Record<string, number> = {}
  const n = 10000

  for (const word of UNIQUE_ANSWERS) {
    // Shorter, more common words are found by more players
    // Pangrams are found by fewer players
    let findRate: number
    if (PANGRAMS.includes(word)) {
      findRate = 0.15 + Math.random() * 0.1 // 15-25% for pangrams
    } else if (word.length <= 4) {
      findRate = 0.7 + Math.random() * 0.25 // 70-95% for short words
    } else if (word.length <= 5) {
      findRate = 0.5 + Math.random() * 0.3 // 50-80% for 5-letter words
    } else if (word.length <= 6) {
      findRate = 0.3 + Math.random() * 0.3 // 30-60% for 6-letter words
    } else {
      findRate = 0.1 + Math.random() * 0.2 // 10-30% for long words
    }

    answers[word] = Math.round(n * findRate * multiplier)
  }

  return {
    id: 20050,
    answers,
    n,
    numberOfUsers: Math.round(15000 * multiplier),
  }
}

const todayPuzzle = createTodayPuzzle()
const activePuzzles = createActivePuzzles()
const maxPoints = calculateTotalPoints(UNIQUE_ANSWERS, PANGRAMS)
const allHints = createHints()

const meta: Meta<typeof AppContent> = {
  title: "Pages/Full screen",
  component: AppContent,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof AppContent>

// Default args shared across stories
const defaultArgs = {
  puzzle: todayPuzzle,
  activePuzzles: null, // No date picker at beginning
  selectedPuzzleId: 20050,
  maxPoints,
  hasCredentials: true,
  hasApiKey: true,
  progressLoading: false,
  hintsLoading: false,
  statsNotAvailableYet: false,
  progressError: null,
  hintsError: null,
  statsError: null,
  settingsOpen: false,
  onSettingsOpen: () => {},
  onSettingsClose: () => {},
  onSelectPuzzle: () => {},
  onRefresh: () => {},
  onSaveSettings: () => {},
}

/**
 * Just starting out - no words found yet, no stats available
 * This is what users see when they first open the puzzle for the day
 */
export const JustStarted: Story = {
  args: {
    ...defaultArgs,
    foundWords: [],
    currentPoints: 0,
    hints: allHints,
    stats: null,
    statsNotAvailableYet: true,
    hasCredentials: false,
    hasApiKey: false,
  },
}

/**
 * A few words found - early progress in the puzzle
 * User has found 5 words including some short ones
 */
export const EarlyProgress: Story = {
  args: {
    ...defaultArgs,
    foundWords: ["lane", "lean", "lent", "tale", "tile"],
    currentPoints: calculateTotalPoints(["lane", "lean", "lent", "tale", "tile"], PANGRAMS),
    hints: allHints,
    stats: createStats(0.3), // Lower player count early in the day
    hasCredentials: true,
    hasApiKey: true,
  },
}

/**
 * Mid-progress - around "Nice" rank with a mix of words found
 * User has found about 25% of the points
 */
export const MidProgress: Story = {
  args: {
    ...defaultArgs,
    foundWords: [
      "alit",
      "anal",
      "ante",
      "elan",
      "lane",
      "late",
      "lean",
      "lent",
      "lien",
      "line",
      "lint",
      "lite",
      "nail",
      "tail",
      "tale",
      "tall",
      "teal",
      "tell",
      "tile",
      "till",
      "tune",
      "unit",
      "alien",
      "alone",
      "elite",
      "inlet",
      "title",
    ],
    currentPoints: calculateTotalPoints(
      [
        "alit",
        "anal",
        "ante",
        "elan",
        "lane",
        "late",
        "lean",
        "lent",
        "lien",
        "line",
        "lint",
        "lite",
        "nail",
        "tail",
        "tale",
        "tall",
        "teal",
        "tell",
        "tile",
        "till",
        "tune",
        "unit",
        "alien",
        "alone",
        "elite",
        "inlet",
        "title",
      ],
      PANGRAMS,
    ),
    hints: allHints,
    stats: createStats(),
    activePuzzles, // Date picker available
    hasCredentials: true,
    hasApiKey: true,
  },
}

/**
 * Genius level - found 70% of points including one pangram
 * This is the level most dedicated players aim for
 */
export const GeniusLevel: Story = {
  args: {
    ...defaultArgs,
    foundWords: [
      "alit",
      "anal",
      "ante",
      "anti",
      "elan",
      "etui",
      "ilea",
      "lain",
      "lane",
      "late",
      "latte",
      "lean",
      "lent",
      "lien",
      "lieu",
      "line",
      "lint",
      "lite",
      "luna",
      "lune",
      "lute",
      "nail",
      "null",
      "tail",
      "tale",
      "tall",
      "teal",
      "tell",
      "tile",
      "till",
      "tune",
      "ulna",
      "unit",
      "alien",
      "aline",
      "alone",
      "anile",
      "atilt",
      "elate",
      "elite",
      "inlet",
      "intel",
      "latent",
      "latte",
      "leant",
      "linen",
      "natal",
      "taint",
      "talon",
      "titan",
      "title",
      "tulle",
      "until",
      "utile",
      "anneal",
      "entail",
      "innate",
      "tenant",
      "tunnel",
      "ventilate", // Pangram found!
    ],
    currentPoints: calculateTotalPoints(
      [
        "alit",
        "anal",
        "ante",
        "anti",
        "elan",
        "etui",
        "ilea",
        "lain",
        "lane",
        "late",
        "latte",
        "lean",
        "lent",
        "lien",
        "lieu",
        "line",
        "lint",
        "lite",
        "luna",
        "lune",
        "lute",
        "nail",
        "null",
        "tail",
        "tale",
        "tall",
        "teal",
        "tell",
        "tile",
        "till",
        "tune",
        "ulna",
        "unit",
        "alien",
        "aline",
        "alone",
        "anile",
        "atilt",
        "elate",
        "elite",
        "inlet",
        "intel",
        "latent",
        "latte",
        "leant",
        "linen",
        "natal",
        "taint",
        "talon",
        "titan",
        "title",
        "tulle",
        "until",
        "utile",
        "anneal",
        "entail",
        "innate",
        "tenant",
        "tunnel",
        "ventilate",
      ],
      PANGRAMS,
    ),
    hints: allHints,
    stats: createStats(),
    activePuzzles,
    hasCredentials: true,
    hasApiKey: true,
  },
}

/**
 * Queen Bee - all words found!
 * The ultimate achievement, all words discovered
 */
export const QueenBee: Story = {
  args: {
    ...defaultArgs,
    foundWords: UNIQUE_ANSWERS,
    currentPoints: maxPoints,
    hints: allHints, // Hints section will be hidden since all words are found
    stats: createStats(),
    activePuzzles,
    hasCredentials: true,
    hasApiKey: true,
  },
}
