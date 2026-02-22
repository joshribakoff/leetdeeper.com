export function promiseAll<T>(promises: Promise<T>[]): Promise<T[]> {
  return new Promise((resolve, reject) => {
    // Edge case: empty array resolves immediately
    if (promises.length === 0) return resolve([]);

    const results: T[] = new Array(promises.length);
    let remaining = promises.length;

    promises.forEach((p, i) => {
      p.then(
        (val) => {
          // Store at original index to preserve order
          results[i] = val;
          // All done? Resolve the outer promise
          if (--remaining === 0) resolve(results);
        },
        // First rejection wins — immediately rejects outer promise
        reject,
      );
    });
  });
}
