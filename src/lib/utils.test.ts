import { describe, it, expect } from "vitest"
import {
  calculateWordPoints,
  calculateTotalPoints,
  getRank,
  getPointsToNextRank,
  getTwoLetterPrefix,
  buildWordGrid,
  getWordLengths,
  getStartingLetters,
  buildTwoLetterGroups,
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
    const keys = grid.map((c) => `${c.letter}-${c.length}`)
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
    const prefixes = groups.map((g) => g.prefix)
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
