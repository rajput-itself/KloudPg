'use client';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CITY_OPTIONS } from '@/lib/cities';

export default function SearchBar({ initialCity, initialSearch, variant }) {
  const [city, setCity] = useState(initialCity || '');
  const [search, setSearch] = useState(initialSearch || '');
  const router = useRouter();

  const handleSearch = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (city && city !== 'All Cities') params.set('city', city);
    if (search) params.set('search', search);
    router.push(`/pgs?${params.toString()}`);
  };

  return (
    <form className="search-bar" onSubmit={handleSearch} style={variant === 'compact' ? { maxWidth: '100%' } : {}}>
      <div className="search-input-wrapper">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search by PG name or locality..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="search-input"
        />
      </div>
      <select value={city} onChange={(e) => setCity(e.target.value)} id="city-select">
        <option value="">All Cities</option>
        {CITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <button type="submit" className="btn btn-primary" id="search-button">
        <Search size={18} />
        Search
      </button>
    </form>
  );
}
