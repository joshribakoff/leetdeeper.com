import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const challenges = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/challenges' }),
  schema: z.object({
    title: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    course: z.string(),
  }),
});

const courses = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/courses' }),
  schema: z.object({
    title: z.string(),
    challenges: z.array(z.string()),
  }),
});

export const collections = { challenges, courses };
