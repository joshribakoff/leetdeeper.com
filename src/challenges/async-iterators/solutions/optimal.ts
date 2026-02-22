export type Page<T> = { items: T[]; nextCursor?: string };

// Async generator — yields items lazily, fetching pages on demand
export async function* paginate<T>(
  fetchPage: (cursor?: string) => Promise<Page<T>>,
): AsyncGenerator<T> {
  let cursor: string | undefined;
  do {
    const page = await fetchPage(cursor);
    // Yield each item individually — consumer controls the pace
    for (const item of page.items) yield item;
    cursor = page.nextCursor;
  } while (cursor); // Stop when there's no next page
}

// Drain an async iterable into a plain array
export async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of iter) result.push(item);
  return result;
}

// Transform each item lazily using an async function
export async function* asyncMap<T, U>(
  iter: AsyncIterable<T>,
  fn: (item: T) => Promise<U>,
): AsyncGenerator<U> {
  for await (const item of iter) yield await fn(item);
}
