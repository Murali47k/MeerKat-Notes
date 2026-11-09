import { getCollection, type CollectionEntry } from 'astro:content';

export interface ChapterItem {
  id: string;
  notebookSlug: string;
  chapterSlug: string;
  url: string;
  title: string;
  description: string;
  order: number;
  readingTime: number;
  entry: CollectionEntry<'chapters'>;
}

export interface NotebookItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  category: string;
  type: string;
  author: string;
  tags: string[];
  chapters: ChapterItem[];
}

export function parseChapterId(id: string): { notebookSlug: string; chapterSlug: string } {
  // e.g. "mathematics-ml/chapters/01-linear-regression" -> notebook: "mathematics-ml", chapter: "01-linear-regression"
  const parts = id.split('/');
  if (parts.length >= 3 && parts[1] === 'chapters') {
    return {
      notebookSlug: parts[0],
      chapterSlug: parts[2].replace(/\.(md|mdx)$/, ''),
    };
  }
  if (parts.length === 2) {
    return {
      notebookSlug: parts[0],
      chapterSlug: parts[1].replace(/\.(md|mdx)$/, ''),
    };
  }
  return {
    notebookSlug: 'general',
    chapterSlug: id.replace(/\.(md|mdx)$/, ''),
  };
}

// Helper to respect import.meta.env.BASE_URL for GitHub Pages
export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export function parseNotebookId(id: string): string {
  // e.g. "mathematics-ml/notebook" -> "mathematics-ml"
  return id.replace(/\/notebook(\.json)?$/, '');
}

export async function getAllNotebooks(): Promise<NotebookItem[]> {
  const notebookEntries = await getCollection('notebooks');
  const chapterEntries = await getCollection('chapters');

  // Group chapters by notebookSlug
  const chaptersMap = new Map<string, ChapterItem[]>();

  for (const entry of chapterEntries) {
    const { notebookSlug, chapterSlug } = parseChapterId(entry.id);
    const item: ChapterItem = {
      id: entry.id,
      notebookSlug,
      chapterSlug,
      url: withBase(`/notebooks/${notebookSlug}/${chapterSlug}`),
      title: entry.data.title,
      description: entry.data.description || '',
      order: entry.data.order ?? 1,
      readingTime: entry.data.readingTime ?? 10,
      entry,
    };

    if (!chaptersMap.has(notebookSlug)) {
      chaptersMap.set(notebookSlug, []);
    }
    chaptersMap.get(notebookSlug)!.push(item);
  }

  // Sort chapters by order
  for (const list of chaptersMap.values()) {
    list.sort((a, b) => a.order - b.order);
  }

  return notebookEntries.map((n) => {
    const slug = parseNotebookId(n.id);
    const chapters = chaptersMap.get(slug) || [];
    return {
      id: n.id,
      slug,
      title: n.data.title,
      description: n.data.description,
      level: n.data.level,
      category: n.data.category,
      type: n.data.type,
      author: n.data.author,
      tags: n.data.tags || [],
      chapters,
    };
  });
}

export async function getNotebookBySlug(slug: string): Promise<NotebookItem | undefined> {
  const notebooks = await getAllNotebooks();
  return notebooks.find((n) => n.slug === slug);
}

export async function getChapterDetails(notebookSlug: string, chapterSlug: string) {
  const notebook = await getNotebookBySlug(notebookSlug);
  if (!notebook) return null;

  const chapterIndex = notebook.chapters.findIndex((c) => c.chapterSlug === chapterSlug);
  if (chapterIndex === -1) return null;

  const currentChapter = notebook.chapters[chapterIndex];
  const prevChapter = chapterIndex > 0 ? notebook.chapters[chapterIndex - 1] : null;
  const nextChapter =
    chapterIndex < notebook.chapters.length - 1 ? notebook.chapters[chapterIndex + 1] : null;

  return {
    notebook,
    chapter: currentChapter,
    prevChapter,
    nextChapter,
  };
}
