import { paginate, collect, asyncMap } from './solution';

describe('paginate', () => {
  function makeFetcher() {
    const pages = [
      { items: [1, 2], nextCursor: 'page2' },
      { items: [3, 4], nextCursor: 'page3' },
      { items: [5], nextCursor: undefined },
    ];
    let callCount = 0;
    const fetchPage = async (cursor?: string) => {
      const idx = cursor ? parseInt(cursor.replace('page', '')) - 1 : 0;
      callCount++;
      return pages[idx];
    };
    return { fetchPage, getCallCount: () => callCount };
  }

  test('single page yields all items', async () => {
    const fetchPage = async () => ({ items: [10, 20], nextCursor: undefined });
    const result = await collect(paginate(fetchPage));
    expect(result).toEqual([10, 20]);
  });

  test('multiple pages yields items across pages', async () => {
    const { fetchPage } = makeFetcher();
    const result = await collect(paginate(fetchPage));
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  test('empty page yields nothing', async () => {
    const fetchPage = async () => ({ items: [] as number[], nextCursor: undefined });
    const result = await collect(paginate(fetchPage));
    expect(result).toEqual([]);
  });

  test('lazy fetching — page 2 not fetched until page 1 consumed', async () => {
    const { fetchPage, getCallCount } = makeFetcher();
    const iter = paginate(fetchPage)[Symbol.asyncIterator]();
    expect(getCallCount()).toBe(0);
    await iter.next(); // item 1
    expect(getCallCount()).toBe(1);
    await iter.next(); // item 2 (still page 1)
    expect(getCallCount()).toBe(1);
    await iter.next(); // item 3 (triggers page 2)
    expect(getCallCount()).toBe(2);
  });
});

describe('asyncMap', () => {
  test('transforms each item', async () => {
    const fetchPage = async () => ({ items: [1, 2, 3], nextCursor: undefined });
    const mapped = asyncMap(paginate(fetchPage), async (x) => x * 10);
    const result = await collect(mapped);
    expect(result).toEqual([10, 20, 30]);
  });
});
