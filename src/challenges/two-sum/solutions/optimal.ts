export function twoSum(nums: number[], target: number): number[] {
  // Map stores {value → index} for O(1) lookups
  const map = new Map<number, number>();

  for (let i = 0; i < nums.length; i++) {
    // What value do we need to pair with nums[i]?
    const complement = target - nums[i];

    // Have we already seen the complement?
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }

    // Remember this value's index for future lookups
    map.set(nums[i], i);
  }

  return [];
}
