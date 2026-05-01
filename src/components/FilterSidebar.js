'use client';
import { SlidersHorizontal, Utensils, Wind, Wifi, User } from 'lucide-react';

export default function FilterSidebar({ filters, onChange }) {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  const handleToggle = (key) => {
    onChange({ ...filters, [key]: filters[key] ? '' : '1' });
  };

  return (
    <aside className="filter-sidebar">
      <h3><SlidersHorizontal size={18} /> Filters</h3>

      <div className="filter-group">
        <div className="filter-group-title">Gender</div>
        <div className="filter-options">
          {[
            { value: '', label: 'All' },
            { value: 'boys', label: 'Boys' },
            { value: 'girls', label: 'Girls' },
            { value: 'unisex', label: 'Unisex' },
          ].map(opt => (
            <button
              key={opt.value}
              className={`filter-option ${filters.gender === opt.value ? 'active' : ''}`}
              onClick={() => handleChange('gender', opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <div className="filter-group-title">Budget (₹/month)</div>
        <div className="price-range">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ''}
            onChange={(e) => handleChange('minPrice', e.target.value)}
            min="0"
            step="1000"
          />
          <span>to</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ''}
            onChange={(e) => handleChange('maxPrice', e.target.value)}
            min="0"
            step="1000"
          />
        </div>
      </div>

      <div className="filter-group">
        <div className="filter-group-title">Amenities</div>
        <div className="filter-options">
          <button
            className={`filter-option ${filters.food === '1' ? 'active' : ''}`}
            onClick={() => handleToggle('food')}
          >
            <Utensils size={14} /> Food Included
          </button>
          <button
            className={`filter-option ${filters.ac === '1' ? 'active' : ''}`}
            onClick={() => handleToggle('ac')}
          >
            <Wind size={14} /> AC Available
          </button>
          <button
            className={`filter-option ${filters.wifi === '1' ? 'active' : ''}`}
            onClick={() => handleToggle('wifi')}
          >
            <Wifi size={14} /> WiFi
          </button>
        </div>
      </div>

      <button
        className="btn btn-secondary btn-full btn-sm"
        onClick={() => onChange({ gender: '', minPrice: '', maxPrice: '', food: '', ac: '', wifi: '' })}
        style={{ marginTop: '8px' }}
      >
        Clear All Filters
      </button>
    </aside>
  );
}
