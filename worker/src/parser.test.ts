import { describe, it, expect } from "vitest"
import { parseGameData } from "./parser"

describe("parseGameData", () => {
  it("parses valid game data from HTML", () => {
    const html = `
      <html>
      <head>
        <script>
          window.gameData = {
            "today": {
              "displayWeekday": "Wednesday",
              "displayDate": "January 15, 2026",
              "printDate": "2026-01-15",
              "centerLetter": "o",
              "outerLetters": ["a", "b", "c", "e", "l", "p"],
              "validLetters": ["o", "a", "b", "c", "e", "l", "p"],
              "pangrams": ["placebo"],
              "answers": ["able", "bale", "ball", "placebo"],
              "id": 20035
            }
          };
        </script>
      </head>
      </html>
    `

    const result = parseGameData(html)

    expect(result).not.toBeNull()
    expect(result?.today.displayWeekday).toBe("Wednesday")
    expect(result?.today.displayDate).toBe("January 15, 2026")
    expect(result?.today.printDate).toBe("2026-01-15")
    expect(result?.today.centerLetter).toBe("o")
    expect(result?.today.outerLetters).toEqual(["a", "b", "c", "e", "l", "p"])
    expect(result?.today.validLetters).toEqual(["o", "a", "b", "c", "e", "l", "p"])
    expect(result?.today.pangrams).toEqual(["placebo"])
    expect(result?.today.answers).toEqual(["able", "bale", "ball", "placebo"])
    expect(result?.today.id).toBe(20035)
  })

  it("returns null for HTML without gameData", () => {
    const html = `
      <html>
      <head>
        <script>console.log('hello');</script>
      </head>
      </html>
    `

    const result = parseGameData(html)
    expect(result).toBeNull()
  })

  it("returns null for invalid JSON in gameData", () => {
    const html = `
      <html>
      <head>
        <script>
          window.gameData = { invalid json };
        </script>
      </head>
      </html>
    `

    const result = parseGameData(html)
    expect(result).toBeNull()
  })

  it("returns null for gameData without today property", () => {
    const html = `
      <html>
      <head>
        <script>
          window.gameData = { "yesterday": {} };
        </script>
      </head>
      </html>
    `

    const result = parseGameData(html)
    expect(result).toBeNull()
  })

  it("handles gameData with extra whitespace", () => {
    const html = `
      <html>
      <head>
        <script>
          window.gameData   =   {
            "today": {
              "displayWeekday": "Monday",
              "displayDate": "January 13, 2026",
              "printDate": "2026-01-13",
              "centerLetter": "a",
              "outerLetters": ["b", "c", "d", "e", "f", "g"],
              "validLetters": ["a", "b", "c", "d", "e", "f", "g"],
              "pangrams": ["abcdefg"],
              "answers": ["bad", "fad", "abcdefg"],
              "id": 20033
            }
          }  ;
        </script>
      </head>
      </html>
    `

    const result = parseGameData(html)

    expect(result).not.toBeNull()
    expect(result?.today.centerLetter).toBe("a")
  })

  it("handles gameData without trailing semicolon", () => {
    const html = `
      <html>
      <head>
        <script>
          window.gameData = {
            "today": {
              "displayWeekday": "Tuesday",
              "displayDate": "January 14, 2026",
              "printDate": "2026-01-14",
              "centerLetter": "z",
              "outerLetters": ["a", "b", "c", "e", "l", "p"],
              "validLetters": ["z", "a", "b", "c", "e", "l", "p"],
              "pangrams": ["zebra"],
              "answers": ["zebra"],
              "id": 20034
            }
          }
        </script>
      </head>
      </html>
    `

    const result = parseGameData(html)

    expect(result).not.toBeNull()
    expect(result?.today.centerLetter).toBe("z")
  })

  it("handles page with multiple script tags after gameData", () => {
    // This tests that we correctly extract just the gameData JSON
    // and don't accidentally include subsequent scripts
    const html = `
      <html>
      <head>
        <script>
          window.gameData = {
            "today": {
              "displayWeekday": "Wednesday",
              "displayDate": "January 14, 2026",
              "printDate": "2026-01-14",
              "centerLetter": "o",
              "outerLetters": ["a", "b", "c", "e", "l", "p"],
              "validLetters": ["o", "a", "b", "c", "e", "l", "p"],
              "pangrams": ["placebo"],
              "answers": ["placebo", "pole", "pool"],
              "id": 20035
            }
          }
        </script>
        <script>
          window.otherConfig = {
            "applicationId": "some-id",
            "clientToken": "some-token"
          }
        </script>
        <script>
          window.anotherConfig = { "key": "value" }
        </script>
      </head>
      </html>
    `

    const result = parseGameData(html)

    expect(result).not.toBeNull()
    expect(result?.today.centerLetter).toBe("o")
    expect(result?.today.answers).toEqual(["placebo", "pole", "pool"])
  })
})
