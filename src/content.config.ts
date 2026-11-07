import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notebooks = defineCollection({
  loader: glob({
    pattern: '**/notebook.json',
    base: './src/content/notebooks',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    level: z.string().default('Beginner'),
    category: z.string().default('Machine Learning'),
    type: z.string().default('Notebook'),
    author: z.string().default('MeerKat47'),
    tags: z.array(z.string()).default([]),
    chapters: z.array(z.string()).optional(),
  }),
});

const chapters = defineCollection({
  loader: glob({
    pattern: '**/chapters/*.{md,mdx}',
    base: './src/content/notebooks',
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    order: z.number().default(1),
    readingTime: z.number().default(10),
  }),
});

export const collections = {
  notebooks,
  chapters,
};
