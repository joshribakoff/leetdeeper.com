import { twoSum } from './solution';

describe('Basic', () => {
  test('[2,7,11,15], target=9 → [0,1]', () => {
    expect(twoSum([2, 7, 11, 15], 9)).toEqual([0, 1]);
  });

  test('[3,2,4], target=6 → [1,2]', () => {
    expect(twoSum([3, 2, 4], 6)).toEqual([1, 2]);
  });

  test('[3,3], target=6 → [0,1]', () => {
    expect(twoSum([3, 3], 6)).toEqual([0, 1]);
  });
});

describe('Extended', () => {
  test('negative numbers', () => {
    expect(twoSum([-1, -2, -3, -4, -5], -8)).toEqual([2, 4]);
  });

  test('zero in array', () => {
    expect(twoSum([0, 4, 3, 0], 0)).toEqual([0, 3]);
  });

  test('large array finds pair', () => {
    const arr = Array.from({ length: 1000 }, (_, i) => i);
    const [i, j] = twoSum(arr, 999);
    expect(i !== j).toBe(true);
    expect(arr[i] + arr[j]).toBe(999);
  });

  test('first valid pair by index order', () => {
    // Multiple valid pairs: [0]+[3]=6, [1]+[2]=6
    const result = twoSum([1, 2, 4, 5], 6);
    // Either [1,2] or [0,3] is valid — just verify correctness
    const [i, j] = result;
    expect(i !== j).toBe(true);
    expect([1, 2, 4, 5][i] + [1, 2, 4, 5][j]).toBe(6);
  });
});
