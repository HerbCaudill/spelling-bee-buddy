import { describe, it, expect } from "vitest"
import {
  calculateWordPoints,
  calculateTotalPoints,
  getRank,
  getPointsToNextRank,
  getTwoLetterPrefix,
  getPangramsFound,
  buildWordGrid,
  getWordLengths,
  getStartingLetters,
  buildTwoLetterGroups,
  formatRelativeDate,
} from "./utils"

describe("calculateWordPoints", () => {
  const pangrams = ["placebo", "capable"]

  it("returns 1 point for 4-letter words", () => {
    expect(calculateWordPoints("able", pangrams)).toBe(1)
    expect(calculateWordPoints("cope", pangrams)).toBe(1)
  })

  it("returns 1 point per letter for 5+ letter words", () => {
    expect(calculateWordPoints("apple", pangrams)).toBe(5)
    expect(calculateWordPoints("balloon", pangrams)).toBe(7)
    expect(calculateWordPoints("acceptable", pangrams)).toBe(10)
  })

  it("adds 7 bonus points for pangrams", () => {
    expect(calculateWordPoints("placebo", pangrams)).toBe(7 + 7) // 7 letters + 7 bonus
    expect(calculateWordPoints("capable", pangrams)).toBe(7 + 7) // 7 letters + 7 bonus
  })

  it("is case-insensitive for pangram matching", () => {
    expect(calculateWordPoints("PLACEBO", pangrams)).toBe(14)
  })
})

describe("calculateTotalPoints", () => {
  const pangrams = ["placebo"]

  it("sums points for all words", () => {
    const words = ["able", "apple", "placebo"]
    // 1 + 5 + (7 + 7) = 20
    expect(calculateTotalPoints(words, pangrams)).toBe(20)
  })

  it("returns 0 for empty word list", () => {
    expect(calculateTotalPoints([], pangrams)).toBe(0)
  })
})

describe("getRank", () => {
  it("returns Beginner for 0 points", () => {
    expect(getRank(0, 100)).toBe("Beginner")
  })

  it("returns Beginner for less than 2% of max", () => {
    expect(getRank(1, 100)).toBe("Beginner")
  })

  it("returns Getting Warm at 2%", () => {
    expect(getRank(2, 100)).toBe("Getting Warm")
  })

  it("returns Moving Up at 5%", () => {
    expect(getRank(5, 100)).toBe("Moving Up")
  })

  it("returns Good at 8%", () => {
    expect(getRank(8, 100)).toBe("Good")
  })

  it("returns Solid at 15%", () => {
    expect(getRank(15, 100)).toBe("Solid")
  })

  it("returns Nice at 25%", () => {
    expect(getRank(25, 100)).toBe("Nice")
  })

  it("returns Great at 40%", () => {
    expect(getRank(40, 100)).toBe("Great")
  })

  it("returns Amazing at 50%", () => {
    expect(getRank(50, 100)).toBe("Amazing")
  })

  it("returns Genius at 70%", () => {
    expect(getRank(70, 100)).toBe("Genius")
  })

  it("returns Queen Bee at 100%", () => {
    expect(getRank(100, 100)).toBe("Queen Bee")
  })

  it("returns Beginner when maxPoints is 0", () => {
    expect(getRank(0, 0)).toBe("Beginner")
  })

  it("handles non-round percentages correctly", () => {
    expect(getRank(69, 100)).toBe("Amazing") // 69% is still Amazing
    expect(getRank(71, 100)).toBe("Genius") // 71% is Genius
  })
})

describe("getPointsToNextRank", () => {
  it("returns next rank and points needed", () => {
    const result = getPointsToNextRank(0, 100)
    expect(result).toEqual({ nextRank: "Getting Warm", pointsNeeded: 2 })
  })

  it("returns null when already at Queen Bee", () => {
    expect(getPointsToNextRank(100, 100)).toBeNull()
  })

  it("returns null when maxPoints is 0", () => {
    expect(getPointsToNextRank(0, 0)).toBeNull()
  })

  it("calculates correct points for each threshold", () => {
    expect(getPointsToNextRank(1, 100)).toEqual({
      nextRank: "Getting Warm",
      pointsNeeded: 1,
    })
    expect(getPointsToNextRank(4, 100)).toEqual({
      nextRank: "Moving Up",
      pointsNeeded: 1,
    })
    expect(getPointsToNextRank(69, 100)).toEqual({
      nextRank: "Genius",
      pointsNeeded: 1,
    })
  })
})

describe("getTwoLetterPrefix", () => {
  it("returns uppercase two-letter prefix", () => {
    expect(getTwoLetterPrefix("apple")).toBe("AP")
    expect(getTwoLetterPrefix("BANANA")).toBe("BA")
    expect(getTwoLetterPrefix("cApE")).toBe("CA")
  })
})

describe("getPangramsFound", () => {
  const pangrams = ["placebo", "capable"]

  it("returns pangrams that are in foundWords", () => {
    const foundWords = ["able", "placebo", "cape"]
    expect(getPangramsFound(foundWords, pangrams)).toEqual(["placebo"])
  })

  it("returns all pangrams when all are found", () => {
    const foundWords = ["placebo", "capable", "able"]
    const result = getPangramsFound(foundWords, pangrams)
    expect(result).toHaveLength(2)
    expect(result).toContain("placebo")
    expect(result).toContain("capable")
  })

  it("returns empty array when no pangrams are found", () => {
    const foundWords = ["able", "cape", "cope"]
    expect(getPangramsFound(foundWords, pangrams)).toEqual([])
  })

  it("returns empty array when foundWords is empty", () => {
    expect(getPangramsFound([], pangrams)).toEqual([])
  })

  it("returns empty array when pangrams is empty", () => {
    const foundWords = ["able", "cape"]
    expect(getPangramsFound(foundWords, [])).toEqual([])
  })

  it("is case-insensitive", () => {
    const foundWords = ["PLACEBO", "Capable"]
    const result = getPangramsFound(foundWords, pangrams)
    expect(result).toHaveLength(2)
    expect(result).toContain("PLACEBO")
    expect(result).toContain("Capable")
  })
})

describe("buildWordGrid", () => {
  const allWords = ["able", "apple", "axle", "ball", "balloon", "cape"]
  const foundWords = ["able", "apple", "ball"]

  it("groups words by letter and length", () => {
    const grid = buildWordGrid(allWords, foundWords)

    expect(grid).toContainEqual({
      letter: "A",
      length: 4,
      total: 2, // able, axle
      found: 1, // able
    })

    expect(grid).toContainEqual({
      letter: "A",
      length: 5,
      total: 1, // apple
      found: 1, // apple
    })

    expect(grid).toContainEqual({
      letter: "B",
      length: 4,
      total: 1, // ball
      found: 1, // ball
    })

    expect(grid).toContainEqual({
      letter: "B",
      length: 7,
      total: 1, // balloon
      found: 0,
    })

    expect(grid).toContainEqual({
      letter: "C",
      length: 4,
      total: 1, // cape
      found: 0,
    })
  })

  it("sorts by letter then length", () => {
    const grid = buildWordGrid(allWords, foundWords)
    const keys = grid.map(c => `${c.letter}-${c.length}`)
    expect(keys).toEqual(["A-4", "A-5", "B-4", "B-7", "C-4"])
  })

  it("is case-insensitive", () => {
    const grid = buildWordGrid(["ABLE", "able"], ["Able"])
    expect(grid).toContainEqual({
      letter: "A",
      length: 4,
      total: 2,
      found: 2, // Both match since they're the same word
    })
  })
})

describe("getWordLengths", () => {
  it("returns sorted unique lengths", () => {
    const words = ["able", "apple", "balloon", "cape", "cat"]
    expect(getWordLengths(words)).toEqual([3, 4, 5, 7])
  })

  it("returns empty array for empty input", () => {
    expect(getWordLengths([])).toEqual([])
  })
})

describe("getStartingLetters", () => {
  it("returns sorted unique uppercase letters", () => {
    const words = ["able", "apple", "balloon", "cape", "cat"]
    expect(getStartingLetters(words)).toEqual(["A", "B", "C"])
  })

  it("handles mixed case", () => {
    const words = ["Able", "apple", "BALLOON"]
    expect(getStartingLetters(words)).toEqual(["A", "B"])
  })

  it("returns empty array for empty input", () => {
    expect(getStartingLetters([])).toEqual([])
  })
})

describe("buildTwoLetterGroups", () => {
  const allWords = ["able", "about", "apple", "ball", "balloon", "cape"]
  const foundWords = ["able", "apple", "ball"]

  it("groups words by two-letter prefix", () => {
    const groups = buildTwoLetterGroups(allWords, foundWords)

    expect(groups).toContainEqual({
      prefix: "AB",
      total: 2, // able, about
      found: 1, // able
    })

    expect(groups).toContainEqual({
      prefix: "AP",
      total: 1, // apple
      found: 1, // apple
    })

    expect(groups).toContainEqual({
      prefix: "BA",
      total: 2, // ball, balloon
      found: 1, // ball
    })

    expect(groups).toContainEqual({
      prefix: "CA",
      total: 1, // cape
      found: 0,
    })
  })

  it("sorts alphabetically by prefix", () => {
    const groups = buildTwoLetterGroups(allWords, foundWords)
    const prefixes = groups.map(g => g.prefix)
    expect(prefixes).toEqual(["AB", "AP", "BA", "CA"])
  })

  it("is case-insensitive", () => {
    const groups = buildTwoLetterGroups(["ABLE", "about"], ["Able"])
    expect(groups).toContainEqual({
      prefix: "AB",
      total: 2,
      found: 1,
    })
  })
})

describe("formatRelativeDate", () => {
  // Reference date: January 15, 2026 (a Thursday)
  const referenceDate = new Date(2026, 0, 15, 12, 0, 0)

  it("returns 'Today' for today's date", () => {
    expect(formatRelativeDate("2026-01-15", referenceDate)).toBe("Today")
  })

  it("returns 'Yesterday' for yesterday's date", () => {
    expect(formatRelativeDate("2026-01-14", referenceDate)).toBe("Yesterday")
  })

  it("returns day of week for 2 days ago", () => {
    // 2 days ago from Thursday Jan 15 is Tuesday Jan 13
    expect(formatRelativeDate("2026-01-13", referenceDate)).toBe("Tuesday")
  })

  it("returns day of week for 3 days ago", () => {
    // 3 days ago from Thursday Jan 15 is Monday Jan 12
    expect(formatRelativeDate("2026-01-12", referenceDate)).toBe("Monday")
  })

  it("returns day of week for 6 days ago", () => {
    // 6 days ago from Thursday Jan 15 is Friday Jan 9
    expect(formatRelativeDate("2026-01-09", referenceDate)).toBe("Friday")
  })

  it("returns full date for 7 days ago", () => {
    // 7 days ago from Thursday Jan 15 is Thursday Jan 8
    expect(formatRelativeDate("2026-01-08", referenceDate)).toBe("January 8, 2026")
  })

  it("returns full date for older dates", () => {
    expect(formatRelativeDate("2025-12-25", referenceDate)).toBe("December 25, 2025")
    expect(formatRelativeDate("2025-01-01", referenceDate)).toBe("January 1, 2025")
  })

  it("handles future dates by showing full date", () => {
    // Future dates should show full date (negative diffDays)
    expect(formatRelativeDate("2026-01-20", referenceDate)).toBe("January 20, 2026")
  })

  it("uses current date when no reference date is provided", () => {
    // This test is less precise but ensures the function works without a reference date
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]
    expect(formatRelativeDate(todayStr)).toBe("Today")
  })
})
