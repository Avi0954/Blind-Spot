export function deriveSeed(baseSeed: string, namespace: string): string {
  // A simple deterministic concatenation is sufficient since it will be hashed by cyrb53 in SeededRNG
  return `${baseSeed}::${namespace}`;
}
