// Implementation of Mulberry32, a fast 32-bit PRNG
export function mulberry32(a: number) {
  return function() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Basic string hashing algorithm (cyrb53) to convert seed strings into 32-bit integers
export function cyrb53(str: string, seed = 0) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export class SeededRNG {
  private generator: () => number;

  constructor(seed: string | number) {
    let seedValue: number;
    if (typeof seed === "string") {
      seedValue = cyrb53(seed);
    } else {
      seedValue = seed;
    }
    this.generator = mulberry32(seedValue);
  }

  // Returns a float between 0 (inclusive) and 1 (exclusive)
  public next(): number {
    return this.generator();
  }

  // Returns an integer between min (inclusive) and max (inclusive)
  public integer(min: number, max: number): number {
    return Math.floor(this.generator() * (max - min + 1)) + min;
  }

  // Picks a random element from an array
  public pick<T>(items: T[]): T {
    if (items.length === 0) throw new Error("Cannot pick from empty array");
    return items[this.integer(0, items.length - 1)];
  }

  // Shuffles an array in place (Fisher-Yates) and returns it
  public shuffle<T>(items: T[]): T[] {
    const array = [...items];
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.integer(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Returns true with given probability
  public boolean(probability: number = 0.5): boolean {
    return this.next() < probability;
  }
}

export function createSeededRNG(seed: string): SeededRNG {
  return new SeededRNG(seed);
}
