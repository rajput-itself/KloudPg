'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Plus, MapPin, Star, Eye, Check, X, Edit2, Trash2, MessageSquare, Upload, Image as ImageIcon, X as XIcon, Home, AlertTriangle, Building2, ClipboardList, Calendar, Utensils, Wifi, Wind, Car, Shirt, Dumbbell } from 'lucide-react';
import { CITY_OPTIONS, DEFAULT_CITY } from '@/lib/cities';

const STATUS_COLOR = { pending: 'var(--warning)', confirmed: 'var(--success)', cancelled: '#ef4444', rejected: '#ef4444', visited: 'var(--text-muted)' };

export default function OwnerDashboardPage() {
  const { user, authFetch, loading: authLoading } = useAuth();
  const router = useRouter();
  const [pgs, setPgs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('listings');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editPg, setEditPg] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', city: DEFAULT_CITY, locality: '', address: '',
    gender: 'unisex', food_included: false, wifi: true, ac: false, parking: false,
    laundry: false, gym: false, power_backup: true, cctv: true, water_purifier: true,
    price_min: '', price_max: '',
  });
  const [addError, setAddError] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // Image upload state
  const [imageFiles, setImageFiles] = useState([]);       // File objects for new uploads
  const [imagePreviews, setImagePreviews] = useState([]);  // preview URLs (both new + existing)
  const [existingImages, setExistingImages] = useState([]); // existing image URLs when editing
  const [uploadProgress, setUploadProgress] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'owner')) { router.push('/login'); return; }
    if (user) fetchAll();
  }, [user, authLoading]);

  const fetchAll = async () => {
    try {
      const res = await authFetch('/api/pgs/owner');
      const data = await res.json();
      setPgs(data.pgs || []);
      setBookings(data.bookings || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // ── Image handling ──
  const handleFilesSelected = (files) => {
    const validFiles = Array.from(files).filter(f =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(f.type) && f.size <= 5 * 1024 * 1024
    );

    const totalCount = imageFiles.length + existingImages.length + validFiles.length;
    if (totalCount > 5) {
      setAddError('Maximum 5 images allowed');
      return;
    }

    setImageFiles(prev => [...prev, ...validFiles]);

    // Generate previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, { url: e.target.result, isNew: true, file }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const removeImage = (index) => {
    const preview = imagePreviews[index];
    if (preview.isNew) {
      // Remove from imageFiles too
      setImageFiles(prev => prev.filter(f => f !== preview.file));
    } else {
      // Remove from existingImages
      setExistingImages(prev => prev.filter(url => url !== preview.url));
    }
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    if (imageFiles.length === 0) return existingImages;

    setUploadProgress(true);
    try {
      const formData = new FormData();
      imageFiles.forEach(f => formData.append('images', f));

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Combine existing images + newly uploaded
      return [...existingImages, ...data.urls];
    } catch (err) {
      throw err;
    } finally {
      setUploadProgress(false);
    }
  };

  const resetImageState = () => {
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setDragActive(false);
    setUploadProgress(false);
  };

  const handleAddPG = async (e) => {
    e.preventDefault();
    setAddError(''); setAddLoading(true);

    try {
      // Upload images first
      let imageUrls = [];
      try {
        imageUrls = await uploadImages();
      } catch (uploadErr) {
        setAddError(uploadErr.message || 'Image upload failed');
        setAddLoading(false);
        return;
      }

      const url = editPg ? `/api/pgs/${editPg.id}` : '/api/pgs';
      const method = editPg ? 'PATCH' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price_min: parseInt(form.price_min),
          price_max: parseInt(form.price_max),
          images: imageUrls,
          ...(editPg ? {} : {
            rooms: [
              { room_type: 'single', price: parseInt(form.price_max), available_count: 2 },
              { room_type: 'double', price: Math.round((parseInt(form.price_min) + parseInt(form.price_max)) / 2), available_count: 4 },
              { room_type: 'triple', price: parseInt(form.price_min), available_count: 2 },
            ],
          }),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.error || 'Failed'); }
      else { setShowAddForm(false); setEditPg(null); resetImageState(); fetchAll(); }
    } catch (err) {
      setAddError('Something went wrong');
    }
    setAddLoading(false);
  };

  const handleBookingAction = async (bookingId, status) => {
    await authFetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchAll();
  };

  const handleDelete = async (pgId) => {
    if (!confirm('Delete this PG listing? This cannot be undone.')) return;
    await authFetch(`/api/pgs/${pgId}`, { method: 'DELETE' });
    fetchAll();
  };

  const openEdit = (pg) => {
    setEditPg(pg);
    setForm({ name: pg.name, description: pg.description || '', city: pg.city, locality: pg.locality, address: pg.address || '', gender: pg.gender, food_included: !!pg.food_included, wifi: !!pg.wifi, ac: !!pg.ac, parking: !!pg.parking, laundry: !!pg.laundry, gym: !!pg.gym, power_backup: !!pg.power_backup, cctv: !!pg.cctv, water_purifier: !!pg.water_purifier, price_min: pg.price_min, price_max: pg.price_max });

    // Load existing images for edit
    resetImageState();
    const existing = [];
    if (pg.image_url && !pg.image_url.startsWith('gradient:')) {
      existing.push(pg.image_url);
    }
    setExistingImages(existing);
    setImagePreviews(existing.map(url => ({ url, isNew: false })));

    setShowAddForm(true);
  };

  const openAddForm = () => {
    setEditPg(null);
    setForm({ name: '', description: '', city: DEFAULT_CITY, locality: '', address: '', gender: 'unisex', food_included: false, wifi: true, ac: false, parking: false, laundry: false, gym: false, power_backup: true, cctv: true, water_purifier: true, price_min: '', price_max: '' });
    resetImageState();
    setShowAddForm(true);
  };

  if (authLoading || !user) return <div className="container dashboard"><div className="loading-spinner"><div className="spinner" /></div></div>;

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const stats = {
    pgs: pgs.length, reviews: pgs.reduce((s, p) => s + (p.total_reviews || 0), 0),
    avgRating: pgs.length ? (pgs.reduce((s, p) => s + (p.rating || 0), 0) / pgs.length).toFixed(1) : '0',
    pendingBookings: pendingBookings.length,
  };

  // Helper to get PG thumbnail
  const getPGThumb = (pg) => {
    if (pg.image_url && !pg.image_url.startsWith('gradient:')) {
      return <img src={pg.image_url} alt={pg.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />;
    }
    return <div className="gradient-bg" style={{ background: 'linear-gradient(135deg,#0A66C2,#38BDF8)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Home size={24} color="rgba(255,255,255,0.72)" /></div>;
  };

  return (
    <div className="container dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Owner Dashboard</h1>
          <p className="dashboard-welcome">Manage your PG listings, {user.name}</p>
        </div>
        <button className="btn btn-primary" onClick={openAddForm}>
          <Plus size={18} /> Add New PG
        </button>
      </div>

      <div className="dashboard-stats">
        {[
          { label: 'Listed PGs', value: stats.pgs },
          { label: 'Pending Requests', value: stats.pendingBookings, color: 'var(--warning)' },
          { label: 'Total Reviews', value: stats.reviews, color: 'var(--secondary)' },
          { label: 'Avg Rating', value: stats.avgRating, color: 'var(--accent-light)' },
        ].map(s => (
          <div key={s.label} className="dashboard-stat">
            <div className="dashboard-stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="dashboard-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Pending Bookings Alert */}
      {pendingBookings.length > 0 && (
        <div className="dashboard-alert">
          <span><AlertTriangle size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} /> You have <strong>{pendingBookings.length}</strong> pending booking request{pendingBookings.length > 1 ? 's' : ''} waiting for action.</span>
          <button className="btn btn-sm btn-ghost" onClick={() => setTab('bookings')} style={{ color: 'var(--warning)' }}>View →</button>
        </div>
      )}

      {/* Tabs */}
      <div className="module-tabs module-tabs-bordered">
        {[['listings', <><Building2 size={14} /> My Listings</>], ['bookings', <><ClipboardList size={14} /> Bookings {pendingBookings.length > 0 ? `(${pendingBookings.length})` : ''}</>], ['messages', <><MessageSquare size={14} /> Messages</>]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className="btn btn-ghost btn-sm"
            style={{ borderRadius: '8px 8px 0 0', borderBottom: tab === key ? '2px solid var(--primary)' : '2px solid transparent', paddingBottom: '10px', fontWeight: tab === key ? 700 : 400, color: tab === key ? 'var(--primary)' : 'var(--text-muted)' }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-spinner"><div className="spinner" /></div> : (
        <>
          {/* LISTINGS TAB */}
          {tab === 'listings' && (
            pgs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><Building2 size={48} /></div>
                <h3>No PGs Listed</h3>
                <p>Add your first PG listing to start receiving booking requests.</p>
                <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={openAddForm}><Plus size={18} /> Add Your First PG</button>
              </div>
            ) : (
              <div className="booking-list">
                {pgs.map(pg => (
                  <div key={pg.id} className="booking-item">
                    <div className="booking-item-image">
                      {getPGThumb(pg)}
                    </div>
                    <div className="booking-item-info">
                      <h3>{pg.name}</h3>
                      <p><MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {pg.locality}, {pg.city}</p>
                      <p style={{ marginTop: '4px', color: 'var(--secondary)' }}>₹{pg.price_min?.toLocaleString('en-IN')} – ₹{pg.price_max?.toLocaleString('en-IN')}/mo</p>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pg.total_bookings || 0} bookings · {pg.pending_bookings || 0} pending</span>
                      </div>
                    </div>
                    <div className="booking-item-status">
                      <span className={`badge badge-${pg.gender}`}>{pg.gender}</span>
                      {!pg.is_approved && <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', marginTop: '4px' }}>Pending Approval</span>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-light)', fontSize: '0.9rem', marginTop: '6px' }}>
                        <Star size={14} fill="currentColor" /> {pg.rating?.toFixed?.(1) || '4.0'}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <Link href={`/pgs/${pg.id}`} className="btn btn-ghost btn-sm"><Eye size={14} /> View</Link>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(pg)}><Edit2 size={14} /> Edit</button>
                        <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={() => handleDelete(pg.id)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* BOOKINGS TAB */}
          {tab === 'bookings' && (
            bookings.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon"><ClipboardList size={48} /></div><h3>No Booking Requests</h3><p>Booking requests from students will appear here.</p></div>
            ) : (
              <div className="booking-list">
                {bookings.map(booking => (
                  <div key={booking.id} className="booking-item">
                    <div className="booking-item-info">
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {booking.user_name}
                        <span className={`badge badge-status-${booking.status}`} style={{ color: STATUS_COLOR[booking.status], fontSize: '0.75rem' }}>{booking.status}</span>
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{booking.user_email} · {booking.user_phone}</p>
                      <p style={{ marginTop: '4px' }}>
                        {booking.room_type && <span style={{ textTransform: 'capitalize' }}>{booking.room_type} room</span>}
                        {booking.visit_date && <> · <Calendar size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> {booking.visit_date}</>}
                      </p>
                      {booking.message && <p style={{ marginTop: '4px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>"{booking.message}"</p>}
                    </div>
                    <div className="booking-item-status">
                      <div className="booking-item-date">{new Date(booking.created_at).toLocaleDateString('en-IN')}</div>
                      {booking.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleBookingAction(booking.id, 'confirmed')}><Check size={14} /> Accept</button>
                          <button className="btn btn-ghost btn-sm" style={{ color: '#ef4444' }} onClick={() => handleBookingAction(booking.id, 'rejected')}><X size={14} /> Reject</button>
                        </div>
                      )}
                      <Link href={`/chat/${booking.pg_id}?other_user_id=${booking.user_id}`} className="btn btn-ghost btn-sm" style={{ marginTop: '6px' }}><MessageSquare size={14} /> Chat</Link>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* MESSAGES TAB */}
          {tab === 'messages' && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ color: 'var(--primary)', marginBottom: '12px' }}><MessageSquare size={48} /></div>
              <h3 style={{ marginBottom: '8px' }}>Go to Messages</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>View and reply to all conversations from tenants.</p>
              <Link href="/chat" className="btn btn-primary">Open Messages</Link>
            </div>
          )}
        </>
      )}

      {/* Add / Edit PG Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => { setShowAddForm(false); setEditPg(null); resetImageState(); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h2>{editPg ? <><Edit2 size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Edit PG</> : <><Plus size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} /> Add New PG</>}</h2>
              <button className="modal-close" onClick={() => { setShowAddForm(false); setEditPg(null); resetImageState(); }}>×</button>
            </div>
            {addError && <div className="form-error" style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,118,117,0.1)', borderRadius: 'var(--radius-sm)' }}>{addError}</div>}
            <form onSubmit={handleAddPG}>
              <div className="form-group"><label className="form-label">PG Name</label><input className="form-input" placeholder="e.g. Sunshine PG" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-input" placeholder="Describe your PG..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>

              {/* ── Image Upload Zone ── */}
              <div className="form-group">
                <label className="form-label"><ImageIcon size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />PG Photos <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>(max 5, JPEG/PNG/WebP, up to 5MB each)</span></label>

                {/* Drag & drop zone */}
                <div
                  className={`upload-zone ${dragActive ? 'upload-zone-active' : ''}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={(e) => {
                      handleFilesSelected(e.target.files);
                      e.target.value = ''; // reset so same file can be selected again
                    }}
                  />
                  <Upload size={28} strokeWidth={1.5} />
                  <p style={{ margin: '8px 0 4px', fontWeight: 600, fontSize: '0.95rem' }}>
                    Drag & drop photos here
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    or click to browse from your device
                  </p>
                </div>

                {/* Image previews */}
                {imagePreviews.length > 0 && (
                  <div className="upload-previews">
                    {imagePreviews.map((preview, i) => (
                      <div key={i} className="upload-preview-item">
                        <img src={preview.url} alt={`Preview ${i + 1}`} />
                        {i === 0 && <span className="upload-preview-primary">Cover</span>}
                        <button
                          type="button"
                          className="upload-preview-remove"
                          onClick={(e) => { e.stopPropagation(); removeImage(i); }}
                          aria-label="Remove image"
                        >
                          <XIcon size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group"><label className="form-label">City</label>
                  <select className="form-select" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}>
                    {CITY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Locality</label><input className="form-input" placeholder="e.g. Koramangala" value={form.locality} onChange={e => setForm({ ...form, locality: e.target.value })} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Gender</label>
                  <select className="form-select" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                    <option value="boys">Boys</option><option value="girls">Girls</option><option value="unisex">Unisex</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Address</label><input className="form-input" placeholder="Full address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Min Price (₹/mo)</label><input type="number" className="form-input" placeholder="5000" value={form.price_min} onChange={e => setForm({ ...form, price_min: e.target.value })} required /></div>
                <div className="form-group"><label className="form-label">Max Price (₹/mo)</label><input type="number" className="form-input" placeholder="15000" value={form.price_max} onChange={e => setForm({ ...form, price_max: e.target.value })} required /></div>
              </div>
              <div className="form-group"><label className="form-label">Amenities</label>
                <div className="amenity-check-grid">
                  {[['food_included', <><Utensils size={14} /> Food</>], ['wifi', <><Wifi size={14} /> WiFi</>], ['ac', <><Wind size={14} /> AC</>], ['parking', <><Car size={14} /> Parking</>], ['laundry', <><Shirt size={14} /> Laundry</>], ['gym', <><Dumbbell size={14} /> Gym</>]].map(([k, l]) => (
                    <label key={k} className="form-checkbox"><input type="checkbox" checked={form[k]} onChange={e => setForm({ ...form, [k]: e.target.checked })} />{l}</label>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={addLoading || uploadProgress}>
                {uploadProgress ? 'Uploading images...' : addLoading ? 'Saving...' : editPg ? 'Update PG' : 'Create PG Listing'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
