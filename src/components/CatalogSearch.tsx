import React, { useState, useMemo } from 'react';

export interface NoteItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: string;
  author: string;
  chaptersCount?: number;
  url: string;
  level?: string;
}

interface Props {
  initialNotes: NoteItem[];
}

export default function CatalogSearch({ initialNotes }: Props) {
  const [query, setQuery] = useState('');

  // Filter notes based solely on query text (title, description, author, level)
  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialNotes;

    return initialNotes.filter((note) => {
      return (
        note.title.toLowerCase().includes(q) ||
        note.description.toLowerCase().includes(q) ||
        note.author.toLowerCase().includes(q) ||
        note.type.toLowerCase().includes(q) ||
        (note.level && note.level.toLowerCase().includes(q))
      );
    });
  }, [initialNotes, query]);

  return (
    <div className="w-full">
      {/* Search Input Box - Blue & White Theme */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter notes..."
          className="w-full pl-10 pr-12 py-3 text-sm bg-white border border-blue-200/80 rounded-xl shadow-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs font-mono text-blue-600 hover:text-blue-800 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Section label */}
      <div className="flex items-center justify-between mb-3 text-[11px] font-mono tracking-wider text-blue-600/70 uppercase font-semibold">
        <span>ALL NOTES</span>
        <span>{filteredNotes.length} item{filteredNotes.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Notes list */}
      <div className="space-y-3">
        {filteredNotes.map((note) => (
          <a
            key={note.id}
            href={note.url}
            className="group block bg-white border border-blue-100 rounded-xl px-5 py-4 hover:border-blue-400 hover:shadow-md hover:shadow-blue-500/5 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                {/* Book icon box */}
                <div className="w-10 h-10 rounded-lg border border-blue-100 bg-blue-50/70 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.75"
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>

                {/* Title & subtitle */}
                <div className="min-w-0">
                  <h3 className="font-mono text-[15px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                    {note.title}
                  </h3>
                  <p className="font-mono text-xs text-slate-500 mt-0.5 truncate">
                    <span>{note.author}</span>
                    {note.level && <span> · {note.level}</span>}
                    {note.chaptersCount !== undefined && (
                      <span> · {note.chaptersCount} chapter{note.chaptersCount !== 1 ? 's' : ''}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Badge & Arrow */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-[11px] text-blue-700 border border-blue-200 rounded-md px-2.5 py-0.5 bg-blue-50/60 font-medium">
                  {note.type}
                </span>
                <span className="text-blue-400 group-hover:text-blue-700 group-hover:translate-x-1 transition-all text-sm font-mono font-bold">
                  →
                </span>
              </div>
            </div>
          </a>
        ))}

        {filteredNotes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-blue-200">
            <p className="font-mono text-xs text-slate-400">No matching notes found for "{query}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
