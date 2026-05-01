'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import PGCard from '@/components/PGCard';
import SearchBar from '@/components/SearchBar';
import FilterSidebar from '@/components/FilterSidebar';
import { Building2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PGsPageContent() {
  const searchParams = useSearchParams();
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [sort, setSort] = useState('newest');
  const [filters, setFilters] = useState({
    gender: searchParams.get('gender') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    food: searchParams.get('food') || '',
    ac: searchParams.get('ac') || '',
    wifi: searchParams.get('wifi') || '',
  });

  const city = searchParams.get('city') || '';
  const search = searchParams.get('search') || '';

  const fetchPGs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (city) params.set('city', city);
      if (search) params.set('search', search);
      if (filters.gender) params.set('gender', filters.gender);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      if (filters.food) params.set('food', filters.food);
      if (filters.ac) params.set('ac', filters.ac);
      if (filters.wifi) params.set('wifi', filters.wifi);
      params.set('sort', sort);
      params.set('page', page);
      params.set('limit', '12');

      const res = await fetch(`/api/pgs?${params.toString()}`);
      const data = await res.json();
      setPgs(data.pgs || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Error loading PGs:', err);
    } finally {
      setLoading(false);
    }
  }, [city, search, filters, sort]);

  useEffect(() => {
    fetchPGs(1);
  }, [fetchPGs]);

  const handlePageChange = (page) => {
    fetchPGs(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container">
      <div style={{ padding: '24px 0' }}>
        <SearchBar initialCity={city} initialSearch={search} variant="compact" />
      </div>

      <div className="listings-layout">
        <FilterSidebar filters={filters} onChange={setFilters} />

        <div>
          <div className="listings-header">
            <div>
              <h1>{city ? `PGs in ${city}` : 'All PG Accommodations'}</h1>
              <span className="listings-count">{pagination.total} PGs found</span>
            </div>
            <div className="listings-sort">
              <label>Sort by:</label>
              <select className="form-select" style={{ width: '160px', padding: '8px 12px' }} value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : pgs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Building2 size={48} /></div>
              <h3>No PGs Found</h3>
              <p>Try adjusting your filters or search in a different city.</p>
            </div>
          ) : (
            <>
              <div className="listings-grid">
                {pgs.map(pg => (
                  <PGCard key={pg.id} pg={pg} />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      className={p === pagination.page ? 'active' : ''}
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
