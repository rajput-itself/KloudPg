'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PGCard from '@/components/PGCard';
import BookingModal from '@/components/BookingModal';
import { MapPin, Star, Wifi, Wind, Utensils, Car, ShirtIcon, Dumbbell, Zap, ShieldCheck, Droplets, Phone, Mail, ArrowLeft, Calendar, ChevronLeft, ChevronRight, Home, FileText, Sparkles, Bed, Frown, MessageSquare } from 'lucide-react';

function GalleryImage({ url, className, style, alt }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const isRealImage = url && !url.startsWith('gradient:');

  if (isRealImage && !error) {
    return (
      <div className={`${className || ''} pg-gallery-img-wrapper`} style={style}>
        {!loaded && (
          <div className="pg-gallery-placeholder">
            <div className="pg-img-shimmer" />
          </div>
        )}
        <img
          src={url}
          alt={alt || 'PG accommodation'}
          className={`pg-gallery-real-img ${loaded ? 'pg-img-loaded' : ''}`}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      </div>
    );
  }

  // Fallback gradient
  let bg = 'linear-gradient(135deg, #0A66C2, #38BDF8)';
  if (url && url.startsWith('gradient:')) {
    const parts = url.split(':');
    const c1 = parts[1] || '#0A66C2';
    const c2 = parts[2] || '#38BDF8';
    bg = `linear-gradient(135deg, ${c1}, ${c2})`;
  }
  return (
    <div className={`${className || ''} gradient-bg`} style={{ ...style, background: bg }}>
      <Home size={48} color="rgba(255,255,255,0.5)" />
    </div>
  );
}

const AMENITIES = [
  { key: 'wifi', label: 'WiFi', icon: <Wifi size={18} /> },
  { key: 'ac', label: 'Air Conditioning', icon: <Wind size={18} /> },
  { key: 'food_included', label: 'Daily Meals', icon: <Utensils size={18} /> },
  { key: 'parking', label: 'Parking', icon: <Car size={18} /> },
  { key: 'laundry', label: 'Laundry', icon: <ShirtIcon size={18} /> },
  { key: 'gym', label: 'Gym', icon: <Dumbbell size={18} /> },
  { key: 'power_backup', label: 'Power Backup', icon: <Zap size={18} /> },
  { key: 'cctv', label: 'CCTV Security', icon: <ShieldCheck size={18} /> },
  { key: 'water_purifier', label: 'Water Purifier', icon: <Droplets size={18} /> },
];

export default function PGDetailPage() {
  const { id } = useParams();
  const [pg, setPg] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    async function fetchPG() {
      try {
        const res = await fetch(`/api/pgs/${id}`);
        const data = await res.json();
        setPg(data.pg);
        setSimilar(data.similar || []);
      } catch (err) {
        console.error('Error loading PG:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPG();
  }, [id]);

  if (loading) {
    return <div className="container pg-detail"><div className="loading-spinner"><div className="spinner" /></div></div>;
  }

  if (!pg) {
    return (
      <div className="container pg-detail">
        <div className="empty-state">
          <div className="empty-state-icon"><Frown size={48} /></div>
          <h3>PG Not Found</h3>
          <p>The PG you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <Link href="/pgs" className="btn btn-primary" style={{ marginTop: '16px' }}>Browse All PGs</Link>
        </div>
      </div>
    );
  }

  const genderLabel = { boys: 'Boys', girls: 'Girls', unisex: 'Unisex' };

  // Build images array from pg_images or fallback
  const images = pg.images && pg.images.length > 0
    ? pg.images
    : [{ image_url: pg.image_url, is_primary: 1 }];

  const handlePrev = () => setActiveImg((prev) => (prev - 1 + images.length) % images.length);
  const handleNext = () => setActiveImg((prev) => (prev + 1) % images.length);

  return (
    <div className="container pg-detail">
      <Link href="/pgs" className="btn btn-ghost" style={{ marginBottom: '16px' }}>
        <ArrowLeft size={16} /> Back to listings
      </Link>

      <div className="pg-detail-header">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
          <span className={`badge badge-${pg.gender}`}>{genderLabel[pg.gender]}</span>
          {pg.food_included ? <span className="badge badge-food"><Utensils size={12} /> Food Included</span> : null}
          {pg.is_featured ? <span className="badge badge-featured"><Star size={12} fill="currentColor" /> Featured</span> : null}
        </div>
        <h1>{pg.name}</h1>
        <div className="pg-detail-meta">
          <span className="pg-detail-meta-item"><MapPin size={16} /> {pg.locality}, {pg.city}</span>
          <span className="pg-detail-meta-item"><Star size={16} fill="#F59E0B" color="#F59E0B" /> {pg.rating?.toFixed?.(1) || '4.0'} ({pg.total_reviews} reviews)</span>
        </div>
      </div>

      {/* Gallery */}
      <div className="pg-gallery">
        <div className="pg-gallery-main">
          <GalleryImage url={images[activeImg]?.image_url} className="pg-gallery-img" alt={`${pg.name} - photo ${activeImg + 1}`} />
          {images.length > 1 && (
            <>
              <button className="pg-gallery-nav pg-gallery-prev" onClick={handlePrev} aria-label="Previous image">
                <ChevronLeft size={22} />
              </button>
              <button className="pg-gallery-nav pg-gallery-next" onClick={handleNext} aria-label="Next image">
                <ChevronRight size={22} />
              </button>
              <div className="pg-gallery-counter">{activeImg + 1} / {images.length}</div>
            </>
          )}
        </div>
        <div className="pg-gallery-side">
          {images.slice(0, 4).map((img, i) => (
            <div
              key={i}
              className={`pg-gallery-thumb ${i === activeImg ? 'pg-gallery-thumb-active' : ''}`}
              onClick={() => setActiveImg(i)}
            >
              <GalleryImage url={img.image_url} className="pg-gallery-img" alt={`${pg.name} thumbnail ${i + 1}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="pg-detail-grid">
        {/* Left content */}
        <div>
          <div className="pg-detail-section">
            <h2><FileText size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> About this PG</h2>
            <p className="pg-detail-description">{pg.description}</p>
          </div>

          <div className="pg-detail-section">
            <h2><Sparkles size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Amenities</h2>
            <div className="amenities-grid">
              {AMENITIES.map(amenity => (
                <div key={amenity.key} className={`amenity-item ${pg[amenity.key] ? 'available' : 'unavailable'}`}>
                  {amenity.icon}
                  <span>{amenity.label}</span>
                </div>
              ))}
            </div>
          </div>

          {pg.rooms && pg.rooms.length > 0 && (
            <div className="pg-detail-section">
              <h2><Bed size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Room Options</h2>
              <div className="rooms-table-wrapper">
                <table className="rooms-table">
                  <thead>
                    <tr>
                      <th>Room Type</th>
                      <th>Price/Month</th>
                      <th>Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pg.rooms.map(room => (
                      <tr key={room.id}>
                        <td style={{ textTransform: 'capitalize' }}>{room.room_type} Occupancy</td>
                        <td className="room-price">₹{room.price?.toLocaleString('en-IN')}</td>
                        <td className="room-available">{room.available_count} rooms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="pg-detail-section">
            <h2>📍 Location</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{pg.address || `${pg.locality}, ${pg.city}`}</p>
          </div>
        </div>

        {/* Booking sidebar */}
        <div className="booking-sidebar">
          <div className="booking-card">
            <div className="booking-card-price">
              ₹{pg.price_min?.toLocaleString('en-IN')} – ₹{pg.price_max?.toLocaleString('en-IN')}
              <span> /month</span>
            </div>
            <div className="booking-card-rating">
              <Star size={16} fill="#F59E0B" color="#F59E0B" className="star" />
              <strong>{pg.rating?.toFixed?.(1) || '4.0'}</strong> · {pg.total_reviews} reviews
            </div>

            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={() => setShowBooking(true)}
              id="book-visit-btn"
            >
              <Calendar size={18} />
              Book a Visit
            </button>

            <div className="booking-card-divider" />

            <button
              className="btn btn-secondary btn-full"
              onClick={() => setShowBooking(true)}
            >
              <Phone size={16} />
              Contact Owner
            </button>

            <Link
              href={`/chat/${id}?other_user_id=${pg.owner_id}`}
              className="btn btn-ghost btn-full"
              style={{ marginTop: '10px' }}
            >
              <MessageSquare size={16} />
              Chat with Owner
            </Link>

            {pg.owner_name && (
              <div className="owner-info">
                <div className="owner-avatar">{pg.owner_name.charAt(0)}</div>
                <div className="owner-info-text">
                  <h4>{pg.owner_name}</h4>
                  <p>PG Owner</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Similar PGs */}
      {similar.length > 0 && (
        <div className="section" style={{ paddingBottom: '0' }}>
          <div className="section-header">
            <h2>Similar PGs in {pg.city}</h2>
            <p>Other accommodations you might like</p>
          </div>
          <div className="listings-grid">
            {similar.map(s => (
              <PGCard key={s.id} pg={s} />
            ))}
          </div>
        </div>
      )}

      {showBooking && (
        <BookingModal pg={pg} onClose={() => setShowBooking(false)} />
      )}
    </div>
  );
}
