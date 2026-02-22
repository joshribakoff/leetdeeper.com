export type Page<T> = { items: T[]; nextCursor?: string };

export function paginate<T>(
  fetchPage: (cursor?: string) => Promise<Page<T>>,
): AsyncIterable<T> {
  // TODO: implement
  return {
    [Symbol.asyncIterator]() {
      return {
        async next(): Promise<IteratorResult<T>> {
          return { done: true, value: undefined as any };
        },
      };
    },
  };
}

export async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
  // TODO: implement
  return [];
}

export function asyncMap<T, U>(
  iter: AsyncIterable<T>,
  fn: (item: T) => Promise<U>,
): AsyncIterable<U> {
  // TODO: implement
  return {
    [Symbol.asyncIterator]() {
      return {
        async next(): Promise<IteratorResult<U>> {
          return { done: true, value: undefined as any };
        },
      };
    },
  };
}
