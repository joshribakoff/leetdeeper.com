export function delay(ms: number): Promise<void> {
  // Wrap setTimeout in a promise — resolve fires after ms
  return new Promise((resolve) => setTimeout(resolve, ms));
}
