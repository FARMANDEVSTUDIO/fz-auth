'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

interface Props {
  placeholder?: string;
  filters?: { value: string; label: string }[];
  onSearch: (query: string) => void;
  onFilter?: (value: string) => void;
}

export default function SearchFilter({ placeholder = 'Search...', filters, onSearch, onFilter }: Props) {
  const [q, setQ] = useState('');

  return (
    <div className="flex gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={q}
          onChange={e => { setQ(e.target.value); onSearch(e.target.value); }}
          placeholder={placeholder}
          className="w-full bg-bg border border-edge rounded-xl ps-10 pe-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
        />
      </div>
      {filters && onFilter && (
        <select
          onChange={e => onFilter(e.target.value)}
          className="bg-bg border border-edge rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent cursor-pointer min-w-[140px]"
        >
          {filters.map(f => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      )}
    </div>
  );
}
