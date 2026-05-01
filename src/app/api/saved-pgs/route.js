import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getCollections, insertDoc } from '@/lib/db';

export async function GET(request) {
  try {
    const tokenUser = getUserFromRequest(request);
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { savedPgs, pgs } = await getCollections();
    
    // Get saved PGs with PG details
    const saved = await savedPgs.find({ user_id: tokenUser.id }).toArray();
    
    if (saved.length === 0) {
      return NextResponse.json({ savedPgs: [] });
    }

    const pgIds = saved.map(s => s.pg_id);
    const pgDetails = await pgs.find({ id: { $in: pgIds } }).toArray();

    // Merge saved info with PG details
    const result = saved.map(s => {
      const pg = pgDetails.find(p => p.id === s.pg_id);
      return {
        saved_id: s.id,
        saved_at: s.created_at,
        pg_id: s.pg_id,
        pg_name: pg?.name || 'Unknown',
        locality: pg?.locality || '',
        city: pg?.city || '',
        image_url: pg?.images?.[0] || pg?.image_url || '',
        gender_type: pg?.gender_type,
      };
    });

    return NextResponse.json({ savedPgs: result });
  } catch (error) {
    console.error('Saved PGs GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const tokenUser = getUserFromRequest(request);
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { pg_id } = body;

    if (!pg_id) {
      return NextResponse.json({ error: 'PG ID required' }, { status: 400 });
    }

    const { savedPgs, pgs } = await getCollections();
    
    // Check if PG exists
    const pg = await pgs.findOne({ id: parseInt(pg_id) });
    if (!pg) {
      return NextResponse.json({ error: 'PG not found' }, { status: 404 });
    }

    // Check if already saved
    const existing = await savedPgs.findOne({ user_id: tokenUser.id, pg_id: parseInt(pg_id) });
    if (existing) {
      return NextResponse.json({ error: 'PG already saved' }, { status: 400 });
    }

    // Save PG
    const saved = await insertDoc(savedPgs, 'saved_pgs', {
      user_id: tokenUser.id,
      pg_id: parseInt(pg_id),
    });

    return NextResponse.json({ saved, message: 'PG saved successfully' });
  } catch (error) {
    console.error('Saved PGs POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
