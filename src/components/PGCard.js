'use client';
import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Star, Utensils, Wifi, Wind, Home } from 'lucide-react';

function PGImage({ url }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const isRealImage = url && !url.startsWith('gradient:');

  if (isRealImage && !error) {
    return (
      <div className="pg-card-image-wrapper">
        {!loaded && (
          <div className="pg-gradient-bg pg-img-placeholder">
            <div className="pg-img-shimmer" />
          </div>
        )}
        <img
          src={url}
          alt="PG accommodation"
          className={`pg-img ${loaded ? 'pg-img-loaded' : ''}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      </div>
    );
  }

  // Fallback gradient
  if (url && url.startsWith('gradient:')) {
    const parts = url.split(':');
    const c1 = parts[1] || '#0A66C2';
    const c2 = parts[2] || '#38BDF8';
    return (
      <div
        className="pg-gradient-bg"
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      >
        <Home size={32} color="rgba(255,255,255,0.6)" />
      </div>
    );
  }

  return (
    <div className="pg-gradient-bg" style={{ background: 'linear-gradient(135deg, #0A66C2, #38BDF8)' }}>
      <Home size={32} color="rgba(255,255,255,0.6)" />
    </div>
  );
}

export default function PGCard({ pg }) {
  const genderLabel = { boys: 'Boys', girls: 'Girls', unisex: 'Unisex' };

  return (
    <Link href={`/pgs/${pg.id}`} className="card pg-card">
      <div className="pg-card-image">
        <PGImage url={pg.image_url} />
        <div className="pg-card-badges">
          <span className={`badge badge-${pg.gender}`}>
            {genderLabel[pg.gender] || 'Unisex'}
          </span>
          {pg.food_included ? <span className="badge badge-food"><Utensils size={10} /> Food</span> : null}
        </div>
        {pg.is_featured ? (
          <span className="pg-card-featured">
            <span className="badge badge-featured"><Star size={10} fill="currentColor" /> Featured</span>
          </span>
        ) : null}
      </div>
      <div className="pg-card-body">
        <h3 className="pg-card-title">{pg.name}</h3>
        <div className="pg-card-location">
          <MapPin size={14} />
          <span>{pg.locality}, {pg.city}</span>
        </div>
        <div className="pg-card-amenities">
          {pg.wifi ? <span className="badge badge-amenity"><Wifi size={12} /> WiFi</span> : null}
          {pg.ac ? <span className="badge badge-amenity"><Wind size={12} /> AC</span> : null}
          {pg.food_included ? <span className="badge badge-amenity"><Utensils size={12} /> Meals</span> : null}
        </div>
        <div className="pg-card-footer">
          <div className="pg-card-price">
            ₹{pg.price_min?.toLocaleString('en-IN')}
            <span>/month</span>
          </div>
          <div className="pg-card-rating">
            <Star size={14} fill="currentColor" />
            {pg.rating?.toFixed?.(1) || '4.0'}
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              ({pg.total_reviews || 0})
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
