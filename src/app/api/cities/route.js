import { NextResponse } from 'next/server';
import { getCollections } from '@/lib/db';
import { seedDatabase } from '@/lib/seed';

export async function GET() {
  try {
    await seedDatabase();
    const { pgs } = await getCollections();
    const cities = await pgs.aggregate([
      { $group: { _id: '$city', pg_count: { $sum: 1 }, min_price: { $min: '$price_min' } } },
      { $sort: { pg_count: -1 } },
      { $project: { _id: 0, city: '$_id', pg_count: 1, min_price: 1 } },
    ]).toArray();

    return NextResponse.json({ cities });
  } catch (error) {
    console.error('Cities error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
