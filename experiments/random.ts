/* Seeded randomness helpers so samples are reproducible across runs. */

/** Take a seeded random sample of n items. */
export function sampleWithoutReplacement<T>(items: T[], n: number, seed: string): T[] {
  const random = mulberry32(hashString(seed))
  const pool = [...items]
  const result: T[] = []
  while (result.length < n && pool.length > 0) {
    const i = Math.floor(random() * pool.length)
    result.push(pool[i])
    pool[i] = pool[pool.length - 1]
    pool.pop()
  }
  return result
}

/** Hash a string to a 32-bit integer for seeding. */
export function hashString(s: string): number {
  let h = 2166136261
  for (const char of s) {
    h ^= char.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Deterministic pseudorandom generator (mulberry32). */
export function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
