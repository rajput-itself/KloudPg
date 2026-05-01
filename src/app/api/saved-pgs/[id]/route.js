import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getCollections } from '@/lib/db';

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const tokenUser = getUserFromRequest(request);
    if (!tokenUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const pgId = parseInt(resolvedParams.id);
    if (isNaN(pgId)) {
      return NextResponse.json({ error: 'Invalid PG ID' }, { status: 400 });
    }

    const { savedPgs } = await getCollections();
    
    // Check if saved
    const existing = await savedPgs.findOne({ user_id: tokenUser.id, pg_id: pgId });
    if (!existing) {
      return NextResponse.json({ error: 'PG not found in saved list' }, { status: 404 });
    }

    // Remove from saved
    await savedPgs.deleteOne({ user_id: tokenUser.id, pg_id: pgId });

    return NextResponse.json({ success: true, message: 'PG removed from saved' });
  } catch (error) {
    console.error('Saved PGs DELETE error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
