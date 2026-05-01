import { NextResponse } from 'next/server';
import { addNotification, getCollections, insertDoc, toInt } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { seedDatabase } from '@/lib/seed';

export async function GET(request, { params }) {
  try {
    await seedDatabase();
    const { id } = await params;
    const pgId = toInt(id);
    const { pgs, users, pgRooms, pgImages, reviews } = await getCollections();

    const pg = await pgs.findOne({ id: pgId }, { projection: { _id: 0 } });
    if (!pg) return NextResponse.json({ error: 'PG not found' }, { status: 404 });

    const owner = await users.findOne({ id: pg.owner_id }, { projection: { _id: 0, name: 1, phone: 1, email: 1 } });
    const rooms = await pgRooms.find({ pg_id: pgId }, { projection: { _id: 0 } }).toArray();
    const images = await pgImages.find({ pg_id: pgId }, { projection: { _id: 0 } }).sort({ is_primary: -1 }).toArray();
    const reviewRows = await reviews.find({ pg_id: pgId }, { projection: { _id: 0 } }).sort({ created_at: -1 }).limit(10).toArray();
    const reviewUsers = await users.find(
      { id: { $in: [...new Set(reviewRows.map((r) => r.user_id))] } },
      { projection: { _id: 0, id: 1, name: 1, avatar_url: 1 } }
    ).toArray();
    const userById = new Map(reviewUsers.map((u) => [u.id, u]));

    const similar = await pgs
      .find({ city: pg.city, id: { $ne: pgId }, is_approved: 1 }, { projection: { _id: 0 } })
      .limit(4)
      .toArray();

    return NextResponse.json({
      pg: {
        ...pg,
        owner_name: owner?.name || null,
        owner_phone: owner?.phone || null,
        owner_email: owner?.email || null,
        rooms,
        images,
        reviews: reviewRows.map((review) => ({
          ...review,
          user_name: userById.get(review.user_id)?.name || null,
          avatar_url: userById.get(review.user_id)?.avatar_url || null,
        })),
      },
      similar,
    });
  } catch (error) {
    console.error('PG detail error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { id } = await params;
    const pgId = toInt(id);
    const { pgs, pgImages } = await getCollections();
    const pg = await pgs.findOne({ id: pgId });
    if (!pg) return NextResponse.json({ error: 'PG not found' }, { status: 404 });

    if (user.role !== 'admin' && pg.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    if (user.role === 'admin' && 'is_approved' in body) {
      const approved = !!body.is_approved;
      await pgs.updateOne({ id: pgId }, { $set: { is_approved: approved ? 1 : 0 } });
      await addNotification(
        pg.owner_id,
        approved ? 'PG Approved' : 'PG Rejected',
        approved ? `Your PG "${pg.name}" has been approved and is now live!` : `Your PG "${pg.name}" was rejected. Please review and resubmit.`,
        'info',
        '/owner/dashboard'
      );
      return NextResponse.json({ message: `PG ${approved ? 'approved' : 'rejected'}` });
    }

    const allowed = ['name', 'description', 'city', 'locality', 'address', 'gender', 'food_included', 'wifi', 'ac', 'parking', 'laundry', 'gym', 'power_backup', 'cctv', 'water_purifier', 'price_min', 'price_max', 'image_url'];
    const updates = {};
    for (const key of allowed) {
      if (key in body) updates[key] = ['price_min', 'price_max'].includes(key) ? toInt(body[key]) : body[key];
    }

    if (body.images?.length) {
      updates.image_url = body.images[0];
      await pgImages.deleteMany({ pg_id: pgId });
      for (const [index, imgUrl] of body.images.entries()) {
        await insertDoc(pgImages, 'pg_images', { pg_id: pgId, image_url: imgUrl, is_primary: index === 0 ? 1 : 0 });
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    await pgs.updateOne({ id: pgId }, { $set: updates });
    return NextResponse.json({ message: 'PG updated successfully' });
  } catch (error) {
    console.error('PG PATCH error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { id } = await params;
    const pgId = toInt(id);
    const { pgs, pgRooms, pgImages } = await getCollections();
    const pg = await pgs.findOne({ id: pgId });
    if (!pg) return NextResponse.json({ error: 'PG not found' }, { status: 404 });
    if (user.role !== 'admin' && pg.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await Promise.all([
      pgs.deleteOne({ id: pgId }),
      pgRooms.deleteMany({ pg_id: pgId }),
      pgImages.deleteMany({ pg_id: pgId }),
    ]);
    return NextResponse.json({ message: 'PG deleted successfully' });
  } catch (error) {
    console.error('PG DELETE error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
