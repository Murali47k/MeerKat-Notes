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
      {/* Search Filter Input */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-blue-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
              d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter notes or chapters..."
          className="w-full pl-11 pr-20 py-3.5 text-sm bg-white border border-slate-200/90 rounded-2xl shadow-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-mono transition-all"
        />
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center gap-2">
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-xs font-mono text-blue-600 hover:text-blue-800 transition-colors px-2 py-1"
            >
              Clear
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded-md">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Section Header */}
      <div className="flex items-center justify-between mb-4 text-xs font-mono tracking-wider text-slate-500 uppercase font-semibold">
        <span className="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-blue-600"></span>
          AVAILABLE NOTEBOOKS
        </span>
        <span class="text-slate-400 font-normal">
          {filteredNotes.length} notebook{filteredNotes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Rich Notebook Cards List */}
      <div className="space-y-4">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className="group relative bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-xs hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/5 transition-all"
          >
            {/* Top Row: Meta badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                  {note.type}
                </span>
                {note.level && (
                  <span className="font-mono text-[11px] text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md">
                    {note.level}
                  </span>
                )}
                <span className="font-mono text-[11px] text-slate-500">
                  By <strong className="text-slate-700">{note.author}</strong>
                </span>
              </div>

              <span className="font-mono text-xs text-blue-600 font-semibold bg-blue-50/60 px-2.5 py-0.5 rounded-md">
                {note.chaptersCount || 1} Chapter Available
              </span>
            </div>

            {/* Notebook Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              <a href={note.url} className="focus:outline-none">
                {note.title}
              </a>
            </h2>

            {/* Description */}
            <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed font-sans">
              {note.description}
            </p>

            {/* Featured Chapter Highlight Box */}
            <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-blue-50/70 to-indigo-50/30 border border-blue-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 shadow-xs">
                  01
                </div>
                <div>
                  <h3 className="font-mono text-sm font-bold text-slate-900">
                    Linear Regression
                  </h3>
                  <p className="text-xs text-slate-500 font-sans mt-0.5">
                    Mathematical derivations (KaTeX), interactive React plots, Manim video & NumPy implementation.
                  </p>
                </div>
              </div>

              <a
                href="/notebooks/mathematics-ml/01-linear-regression"
                className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Read Chapter</span>
                <span aria-hidden="true">→</span>
              </a>
            </div>

            {/* Card Footer Actions */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <a
                href={note.url}
                className="text-slate-500 hover:text-blue-600 font-medium transition-colors"
              >
                View Curriculum Syllabus →
              </a>
              <span className="text-slate-400">
                Estimated: ~15 mins
              </span>
            </div>
          </div>
        ))}

        {filteredNotes.length === 0 && (
          <div className="text-center py-14 bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="font-mono text-sm text-slate-400">No notes found matching "{query}"</p>
            <button
              onClick={() => setQuery('')}
              className="mt-3 text-xs font-mono text-blue-600 hover:underline"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
