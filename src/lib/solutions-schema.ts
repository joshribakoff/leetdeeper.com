export interface SolutionMeta {
  key: string;
  label: string;
  approach: string;
  complexity?: string;
  steps?: string[];
}

export interface SolutionWithCode extends SolutionMeta {
  code: string;
}

export function validateManifest(data: unknown, slug: string): SolutionMeta[] {
  if (!Array.isArray(data)) throw new Error(`solutions.json for "${slug}" must be an array`);
  for (const entry of data) {
    if (!entry.key || typeof entry.key !== 'string' || !/^[a-z0-9-]+$/.test(entry.key))
      throw new Error(`Invalid key in "${slug}" solutions.json: ${JSON.stringify(entry.key)}`);
    if (!entry.label || typeof entry.label !== 'string')
      throw new Error(`Invalid label in "${slug}" solutions.json`);
    if (!entry.approach || typeof entry.approach !== 'string')
      throw new Error(`Invalid approach in "${slug}" solutions.json`);
    if (entry.steps && !Array.isArray(entry.steps))
      throw new Error(`Invalid steps in "${slug}" solutions.json — must be string[]`);
  }
  return data as SolutionMeta[];
}
