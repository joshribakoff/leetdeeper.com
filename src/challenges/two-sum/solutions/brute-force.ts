export function twoSum(nums: number[], target: number): number[] {
  // Try every pair (i, j) where j > i
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      // Does this pair sum to target?
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }

  return [];
}
