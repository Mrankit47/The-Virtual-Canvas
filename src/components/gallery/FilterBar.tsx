'use client';

import { useGalleryStore } from '@/store/useGalleryStore';
import { Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface FilterBarProps {
  categories: { title: string; _id: string }[];
}

export function FilterBar({ categories }: FilterBarProps) {
  const { selectedCategory, setCategory, searchQuery, setSearchQuery } = useGalleryStore();

  const allCategories = [{ title: 'All', _id: 'all' }, ...categories];

  return (
    <div className="fixed top-24 md:top-32 left-0 w-full px-6 md:px-12 z-40 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pointer-events-none">
      
      {/* Search Input */}
      <div className="relative w-full md:w-64 pointer-events-auto shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={16} />
        <input 
          type="text"
          placeholder="SEARCH MASTERPIECES..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-b border-ink/20 focus:border-ink/60 outline-none pb-2 pl-10 text-[10px] md:text-xs uppercase tracking-[0.2em] transition-colors font-sans placeholder:opacity-50"
        />
      </div>

      {/* Category Toggles */}
      <div className="flex gap-2 md:gap-4 overflow-x-auto w-full md:w-auto pointer-events-auto pb-4 md:pb-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {allCategories.map((cat) => (
          <button
            key={cat._id}
            onClick={() => setCategory(cat.title)}
            className="relative px-5 py-2 text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap shrink-0"
          >
            <span className={`relative z-10 transition-colors duration-300 font-medium ${selectedCategory === cat.title ? 'text-canvas' : 'text-ink/60 hover:text-ink'}`}>
              {cat.title}
            </span>
            {selectedCategory === cat.title && (
              <motion.div 
                layoutId="activeCategory"
                className="absolute inset-0 bg-ink rounded-full -z-0"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

    </div>
  );
}
