import { NextResponse } from 'next/server';
import { escapeRegex, getCollections, insertDoc, toInt } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { seedDatabase } from '@/lib/seed';

function buildPgFilter(url) {
  const filter = {};
  const city = url.searchParams.get('city');
  const gender = url.searchParams.get('gender');
  const minPrice = url.searchParams.get('minPrice');
  const maxPrice = url.searchParams.get('maxPrice');
  const food = url.searchParams.get('food');
  const wifi = url.searchParams.get('wifi');
  const ac = url.searchParams.get('ac');
  const featured = url.searchParams.get('featured');
  const search = url.searchParams.get('search');

  if (city) filter.city = city;
  if (gender) filter.gender = gender;
  if (minPrice) filter.price_max = { ...(filter.price_max || {}), $gte: Number.parseInt(minPrice, 10) };
  if (maxPrice) filter.price_min = { ...(filter.price_min || {}), $lte: Number.parseInt(maxPrice, 10) };
  if (food === '1') filter.food_included = 1;
  if (wifi === '1') filter.wifi = 1;
  if (ac === '1') filter.ac = 1;
  if (featured === '1') filter.is_featured = 1;
  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: pattern }, { locality: pattern }, { city: pattern }];
  }

  return filter;
}

function sortFor(value) {
  if (value === 'price_asc') return { price_min: 1 };
  if (value === 'price_desc') return { price_max: -1 };
  if (value === 'rating') return { rating: -1 };
  return { created_at: -1 };
}

export async function GET(request) {
  try {
    await seedDatabase();

    const { pgs, users } = await getCollections();
    const url = new URL(request.url);
    const page = Number.parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Number.parseInt(url.searchParams.get('limit') || '12', 10);
    const filter = buildPgFilter(url);
    const sort = sortFor(url.searchParams.get('sort') || 'newest');
    const total = await pgs.countDocuments(filter);

    const rows = await pgs
      .find(filter, { projection: { _id: 0 } })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    const ownerIds = [...new Set(rows.map((pg) => pg.owner_id).filter(Boolean))];
    const owners = await users.find({ id: { $in: ownerIds } }, { projection: { _id: 0, id: 1, name: 1, phone: 1 } }).toArray();
    const ownerById = new Map(owners.map((owner) => [owner.id, owner]));

    return NextResponse.json({
      pgs: rows.map((pg) => {
        const owner = ownerById.get(pg.owner_id);
        return { ...pg, owner_name: owner?.name || null, owner_phone: owner?.phone || null };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('PGs list error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user || user.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can create PG listings' }, { status: 403 });
    }

    const body = await request.json();
    const { pgs, pgRooms, pgImages } = await getCollections();
    const primaryImage = body.images?.length ? body.images[0] : (body.image_url || 'gradient:#0A66C2:#38BDF8');

    const pg = await insertDoc(pgs, 'pgs', {
      owner_id: user.id,
      name: body.name,
      description: body.description,
      city: body.city,
      locality: body.locality,
      address: body.address || '',
      gender: body.gender || 'unisex',
      food_included: body.food_included ? 1 : 0,
      wifi: body.wifi ? 1 : 0,
      ac: body.ac ? 1 : 0,
      parking: body.parking ? 1 : 0,
      laundry: body.laundry ? 1 : 0,
      gym: body.gym ? 1 : 0,
      power_backup: body.power_backup ? 1 : 0,
      cctv: body.cctv ? 1 : 0,
      water_purifier: body.water_purifier ? 1 : 0,
      price_min: toInt(body.price_min),
      price_max: toInt(body.price_max),
      rating: 4,
      total_reviews: 0,
      is_featured: 0,
      is_approved: 0,
      image_url: primaryImage,
    });

    for (const room of body.rooms || []) {
      await insertDoc(pgRooms, 'pg_rooms', {
        pg_id: pg.id,
        room_type: room.room_type,
        price: toInt(room.price),
        available_count: toInt(room.available_count || 1),
      });
    }

    for (const [index, imgUrl] of (body.images || []).entries()) {
      await insertDoc(pgImages, 'pg_images', { pg_id: pg.id, image_url: imgUrl, is_primary: index === 0 ? 1 : 0 });
    }

    return NextResponse.json({ id: pg.id, message: 'PG created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Create PG error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
