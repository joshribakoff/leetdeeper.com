import { paginate, collect, asyncMap } from './solution';

describe('Basic', () => {
  test('single page yields all items', async () => {
    const fetchPage = async () => ({ items: [10, 20], nextCursor: undefined });
    const result = await collect(paginate(fetchPage));
    expect(result).toEqual([10, 20]);
  });

  test('multiple pages yields items across pages', async () => {
    const pages = [
      { items: [1, 2], nextCursor: 'p2' },
      { items: [3, 4], nextCursor: 'p3' },
      { items: [5], nextCursor: undefined },
    ];
    let idx = 0;
    const fetchPage = async (cursor?: string) => {
      if (cursor) idx = parseInt(cursor.replace('p', '')) - 1;
      return pages[idx];
    };
    const result = await collect(paginate(fetchPage));
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  test('empty page yields nothing', async () => {
    const fetchPage = async () => ({ items: [] as number[], nextCursor: undefined });
    const result = await collect(paginate(fetchPage));
    expect(result).toEqual([]);
  });
});

describe('Extended', () => {
  test('lazy fetching — page 2 not fetched until page 1 consumed', async () => {
    let callCount = 0;
    const pages = [
      { items: [1, 2], nextCursor: 'p2' },
      { items: [3, 4], nextCursor: 'p3' },
      { items: [5], nextCursor: undefined },
    ];
    const fetchPage = async (cursor?: string) => {
      callCount++;
      const idx = cursor ? parseInt(cursor.replace('p', '')) - 1 : 0;
      return pages[idx];
    };
    const iter = paginate(fetchPage)[Symbol.asyncIterator]();
    expect(callCount).toBe(0);
    await iter.next(); // item 1
    expect(callCount).toBe(1);
    await iter.next(); // item 2 (still page 1)
    expect(callCount).toBe(1);
    await iter.next(); // item 3 (triggers page 2 fetch)
    expect(callCount).toBe(2);
  });

  test('asyncMap transforms each item', async () => {
    const fetchPage = async () => ({ items: [1, 2, 3], nextCursor: undefined });
    const mapped = asyncMap(paginate(fetchPage), async (x) => x * 10);
    const result = await collect(mapped);
    expect(result).toEqual([10, 20, 30]);
  });

  test('asyncMap with async transform', async () => {
    const fetchPage = async () => ({ items: ['a', 'b'], nextCursor: undefined });
    const mapped = asyncMap(paginate(fetchPage), async (x) => {
      await new Promise((r) => setTimeout(r, 5));
      return x.toUpperCase();
    });
    const result = await collect(mapped);
    expect(result).toEqual(['A', 'B']);
  });

  test('paginate passes cursor to fetchPage', async () => {
    const cursors: (string | undefined)[] = [];
    const fetchPage = async (cursor?: string) => {
      cursors.push(cursor);
      if (!cursor) return { items: [1], nextCursor: 'abc' };
      return { items: [2], nextCursor: undefined };
    };
    await collect(paginate(fetchPage));
    expect(cursors).toEqual([undefined, 'abc']);
  });

  test('preserves this binding of fetchPage', async () => {
    const api = {
      data: [{ items: [1, 2], nextCursor: undefined }],
      getPage() { return Promise.resolve(this.data[0]); },
    };
    const result = await collect(paginate(api.getPage.bind(api)));
    expect(result).toEqual([1, 2]);
  });

  test('preserves this binding of asyncMap transform', async () => {
    const formatter = {
      prefix: 'item-',
      format(n: number) { return Promise.resolve(this.prefix + n); },
    };
    const fetchPage = async () => ({ items: [1, 2], nextCursor: undefined });
    const mapped = asyncMap(paginate(fetchPage), formatter.format.bind(formatter));
    const result = await collect(mapped);
    expect(result).toEqual(['item-1', 'item-2']);
  });

  test('does not rebind fetchPage this', async () => {
    let receivedThis: any;
    const fetchPage = function(this: any) {
      receivedThis = this;
      return Promise.resolve({ items: [1], nextCursor: undefined });
    };
    await collect(paginate(fetchPage));
    expect(receivedThis).toBe(undefined);
  });

  test('does not rebind asyncMap transform this', async () => {
    let receivedThis: any;
    const fetchPage = async () => ({ items: [1], nextCursor: undefined });
    const transform = function(this: any, n: number) {
      receivedThis = this;
      return Promise.resolve(n * 2);
    };
    const result = await collect(asyncMap(paginate(fetchPage), transform));
    expect(result).toEqual([2]);
    expect(receivedThis).toBe(undefined);
  });
});
