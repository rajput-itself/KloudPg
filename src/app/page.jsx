'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import PGCard from '@/components/PGCard';
import { MapPin, Users, Building2, ShieldCheck, Search, Star, ArrowRight, ClipboardList, CheckCircle } from 'lucide-react';
import { CITY_OPTIONS } from '@/lib/cities';

/* ── Real city photos (Unsplash — free, no API key) ── */
const CITY_IMAGES = {
  'Bangalore': 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=600&q=80&fit=crop',
  'Mumbai':    'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=600&q=80&fit=crop',
  'Pune':      'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=600&q=80&fit=crop',
  'Delhi':     'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80&fit=crop',
  'Hyderabad': 'https://images.unsplash.com/photo-1572445271230-a78b5944a659?w=600&q=80&fit=crop',
  'Chennai':   'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&q=80&fit=crop',
};

/* Fallback gradient if image fails or city is unknown */
const CITY_GRADIENTS = {
  'Bangalore': 'linear-gradient(135deg, #0A66C2, #38BDF8)',
  'Mumbai':    'linear-gradient(135deg, #084C91, #0891B2)',
  'Pune':      'linear-gradient(135deg, #0284C7, #67E8F9)',
  'Delhi':     'linear-gradient(135deg, #0F172A, #0A66C2)',
  'Hyderabad': 'linear-gradient(135deg, #075985, #F59E0B)',
  'Chennai':   'linear-gradient(135deg, #0891B2, #16A34A)',
};

const CITY_ICONS = {
  'Bangalore': <Building2 size={16} />,
  'Mumbai':    <Building2 size={16} />,
  'Pune':      <Building2 size={16} />,
  'Delhi':     <Building2 size={16} />,
  'Hyderabad': <Building2 size={16} />,
  'Chennai':   <Building2 size={16} />,
};

/* City Card with real photo + graceful gradient fallback */
function CityCard({ city: c }) {
  const [imgError, setImgError] = useState(false);
  const imgUrl = CITY_IMAGES[c.city];

  return (
    <Link href={`/pgs?city=${c.city}`} className="city-card">
      {/* Background: real photo if available & not errored, else gradient */}
      {imgUrl && !imgError ? (
        <img
          src={imgUrl}
          alt={`${c.city} cityscape`}
          className="city-card-img"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <div
          className="city-card-bg"
          style={{ background: CITY_GRADIENTS[c.city] || 'var(--gradient-primary)' }}
        />
      )}
      <div className="city-card-overlay" />
      <div className="city-card-content">
        <div className="city-card-name">{CITY_ICONS[c.city]} {c.city}</div>
        <div className="city-card-count">
          {c.pg_count} PGs • from ₹{(c.min_price || 5000).toLocaleString('en-IN')}/mo
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [featuredPGs, setFeaturedPGs] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [pgsRes, citiesRes] = await Promise.all([
          fetch('/api/pgs?featured=1&limit=6'),
          fetch('/api/cities'),
        ]);
        const pgsData = await pgsRes.json();
        const citiesData = await citiesRes.json();
        setFeaturedPGs(pgsData.pgs || []);
        setCities(citiesData.cities || []);
      } catch (err) {
        console.error('Error loading homepage:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <>
      {/* Hero Section — Dark OYO-style banner */}
      <section className="hero">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              <Star size={14} fill="currentColor" />
              #1 PG Booking Platform for Students
            </div>
            <h1>
              Find Your Perfect <span className="highlight">PG Stay</span> in India
            </h1>
            <p>
              Discover comfortable, verified PG accommodations across India&apos;s top cities.
              From ₹5,000/month — meals, WiFi, and a community of like-minded people await you.
            </p>
            <SearchBar />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section" style={{ paddingTop: '40px', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">500+</div>
              <div className="stat-label">Verified PGs</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">6</div>
              <div className="stat-label">Major Cities</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">10K+</div>
              <div className="stat-label">Happy Students</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">4.8</div>
              <div className="stat-label">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Cities */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>Explore Top Cities</h2>
            <p>Find PGs in India&apos;s most popular student cities</p>
          </div>
          <div className="cities-grid">
            {(cities.length > 0 ? cities : CITY_OPTIONS.slice(0, 8).map(c => ({ city: c, pg_count: 0, min_price: 5000 }))).map((c) => (
              <CityCard key={c.city} city={c} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured PGs */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <h2>Featured PGs</h2>
            <p>Hand-picked accommodations with the best ratings and amenities</p>
          </div>
          {loading ? (
            <div className="loading-spinner"><div className="spinner" /></div>
          ) : (
            <div className="listings-grid">
              {featuredPGs.map(pg => (
                <PGCard key={pg.id} pg={pg} />
              ))}
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <Link href="/pgs" className="btn btn-primary btn-lg">
              View All PGs <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Three simple steps to find your perfect PG</p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <span className="step-icon"><Search size={32} /></span>
              <h3>Search & Filter</h3>
              <p>Browse PGs by city, budget, and amenities. Use our smart filters to find exactly what you need.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <span className="step-icon"><ClipboardList size={32} /></span>
              <h3>Compare & Choose</h3>
              <p>View detailed listings with photos, amenity lists, room options, and genuine reviews from other students.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <span className="step-icon"><CheckCircle size={32} /></span>
              <h3>Book a Visit</h3>
              <p>Schedule a visit directly through the app. Meet the owner, see the PG, and move in hassle-free!</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: 'var(--text-heading)' }}>
              Own a PG? List it for Free!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '28px', fontSize: '1.05rem' }}>
              Reach thousands of students looking for PG accommodations. Create your listing in minutes and start getting inquiries today.
            </p>
            <Link href="/register" className="btn btn-accent btn-lg">
              <Building2 size={18} />
              List Your PG Now
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
