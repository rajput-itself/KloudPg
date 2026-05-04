import { getCollections, insertDoc } from './db.js';
import { hashPassword } from './auth.js';

const CITIES = ['Bangalore', 'Mumbai', 'Pune', 'Delhi', 'Hyderabad', 'Chennai'];

const LOCALITIES = {
  Bangalore: ['Koramangala', 'BTM Layout', 'HSR Layout', 'Indiranagar', 'Whitefield', 'Electronic City', 'Marathahalli'],
  Mumbai: ['Andheri', 'Bandra', 'Powai', 'Dadar', 'Malad', 'Goregaon', 'Thane'],
  Pune: ['Hinjewadi', 'Kothrud', 'Viman Nagar', 'Wakad', 'Baner', 'Aundh', 'Hadapsar'],
  Delhi: ['Karol Bagh', 'Lajpat Nagar', 'Hauz Khas', 'Dwarka', 'Rohini', 'Saket', 'Rajouri Garden'],
  Hyderabad: ['Madhapur', 'Gachibowli', 'Kondapur', 'Kukatpally', 'Ameerpet', 'Begumpet', 'Banjara Hills'],
  Chennai: ['Velachery', 'Adyar', 'T. Nagar', 'Anna Nagar', 'Tambaram', 'OMR', 'Guindy'],
};

const PG_NAME_PREFIXES = ['Harmony', 'Nest', 'Haven', 'Casa', 'Zenith', 'Urban', 'Royal', 'Sunshine', 'Green', 'Pacific', 'Silver', 'Golden', 'Crystal', 'Elite', 'Prime', 'Star', 'Comfort', 'Happy', 'Cozy', 'Metro', 'City', 'Classic', 'Modern', 'Bliss', 'Dream'];
const PG_NAME_SUFFIXES = ['PG', 'Living', 'Residency', 'Homes', 'Stay', 'House', 'Nest', 'Villa', 'Quarters', 'Lodge'];
const OWNER_NAMES = ['Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sunita Reddy', 'Vikram Singh', 'Meera Nair', 'Anand Joshi', 'Kavita Desai', 'Suresh Iyer', 'Deepa Gupta', 'Ramesh Rao', 'Lakshmi Pillai'];

const DESCRIPTIONS = [
  'A modern and well-maintained PG with all essential amenities. Located in a prime area with easy access to public transport, restaurants, and shopping centers. Perfect for students and working professionals.',
  'Spacious rooms with attached bathrooms, 24/7 water supply, and high-speed WiFi. Our PG offers a homely environment with delicious home-cooked meals. Security is our top priority with CCTV surveillance.',
  'Experience comfortable living in our fully furnished PG accommodation. We provide clean rooms, regular housekeeping, and a vibrant community of like-minded individuals. Walking distance from metro station.',
  'Premium PG accommodation with AC rooms, hot water, and power backup. Our trained staff ensures a hassle-free living experience. Located near IT parks and educational institutions.',
  'Affordable and comfortable PG with a focus on student needs. Study room, recreational area, and laundry facilities available. Nutritious vegetarian and non-vegetarian meals served daily.',
  'Newly renovated PG with modern interiors and premium fittings. Each room comes with a wardrobe, study desk, and charging points. Common areas include a lounge and terrace garden.',
];

const PG_PHOTOS = [
  'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1615874959474-d609969a20ed?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1560440021-33f9b867899d?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1598928506311-c55ez63b82e8?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1617104551722-3b2d51366400?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1556020685-ae41abfc9365?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1564078516393-cf04bd966897?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7c7d1b?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1600573472556-e636c2acda9e?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=600&q=80&fit=crop',
  'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=600&q=80&fit=crop',
];

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePGImageUrl(index) {
  return PG_PHOTOS[index % PG_PHOTOS.length];
}

function getGalleryImages(primaryIndex) {
  const imgs = [];
  for (let j = 1; j <= 3; j += 1) {
    imgs.push(PG_PHOTOS[(primaryIndex + j) % PG_PHOTOS.length]);
  }
  return imgs;
}

export async function seedDatabase() {
  const { users, pgs, pgRooms, pgImages, bookings } = await getCollections();

  const userCount = await users.countDocuments();
  if (userCount > 0) {
    return { message: 'Database already seeded', seeded: false };
  }

  const demoStudent = await insertDoc(users, 'users', {
    name: 'Rahul Verma',
    email: 'student@demo.com',
    password_hash: hashPassword('password123'),
    phone: '9876543210',
    role: 'student',
    city: 'Bangalore',
    is_blocked: 0,
  });

  const adminUser = await insertDoc(users, 'users', {
    name: 'Admin',
    email: 'admin@demo.com',
    password_hash: hashPassword('password123'),
    phone: '9999999999',
    role: 'admin',
    city: 'Bangalore',
    is_blocked: 0,
  });

  const ownerIds = [];
  for (let i = 0; i < OWNER_NAMES.length; i += 1) {
    const owner = await insertDoc(users, 'users', {
      name: OWNER_NAMES[i],
      email: `owner${i + 1}@demo.com`,
      password_hash: hashPassword('password123'),
      phone: `98765${String(43210 + i).padStart(5, '0')}`,
      role: 'owner',
      city: randomChoice(CITIES),
      is_blocked: 0,
    });
    ownerIds.push(owner.id);
  }

  let pgCount = 0;
  for (const city of CITIES) {
    const localities = LOCALITIES[city];
    const numPGs = randomInt(4, 6);
    for (let i = 0; i < numPGs; i += 1) {
      const locality = localities[i % localities.length];
      const basePrice = randomInt(5, 12) * 1000;
      const priceMin = basePrice;
      const priceMax = basePrice + randomInt(2, 6) * 1000;
      const rating = Number((3.5 + Math.random() * 1.5).toFixed(1));
      const imageUrl = generatePGImageUrl(pgCount);

      const pg = await insertDoc(pgs, 'pgs', {
        owner_id: randomChoice(ownerIds),
        name: `${randomChoice(PG_NAME_PREFIXES)} ${randomChoice(PG_NAME_SUFFIXES)}`,
        description: randomChoice(DESCRIPTIONS),
        city,
        locality,
        address: `${randomInt(1, 500)}, ${locality}, ${city}`,
        gender: randomChoice(['boys', 'girls', 'unisex']),
        food_included: Math.random() > 0.3 ? 1 : 0,
        wifi: 1,
        ac: Math.random() > 0.4 ? 1 : 0,
        parking: Math.random() > 0.5 ? 1 : 0,
        laundry: Math.random() > 0.4 ? 1 : 0,
        gym: Math.random() > 0.7 ? 1 : 0,
        power_backup: 1,
        cctv: 1,
        water_purifier: 1,
        price_min: priceMin,
        price_max: priceMax,
        rating,
        total_reviews: randomInt(5, 150),
        is_featured: pgCount < 8 ? 1 : (Math.random() > 0.7 ? 1 : 0),
        is_approved: 1,
        image_url: imageUrl,
      });

      await insertDoc(pgRooms, 'pg_rooms', { pg_id: pg.id, room_type: 'single', price: priceMax, available_count: randomInt(1, 5) });
      await insertDoc(pgRooms, 'pg_rooms', { pg_id: pg.id, room_type: 'double', price: Math.round((priceMin + priceMax) / 2), available_count: randomInt(2, 8) });
      await insertDoc(pgRooms, 'pg_rooms', { pg_id: pg.id, room_type: 'triple', price: priceMin, available_count: randomInt(1, 4) });

      await insertDoc(pgImages, 'pg_images', { pg_id: pg.id, image_url: imageUrl, is_primary: 1 });
      for (const galleryUrl of getGalleryImages(pgCount)) {
        await insertDoc(pgImages, 'pg_images', { pg_id: pg.id, image_url: galleryUrl, is_primary: 0 });
      }

      pgCount += 1;
    }
  }

  await insertDoc(bookings, 'bookings', {
    user_id: demoStudent.id,
    pg_id: 1,
    room_type: 'double',
    status: 'confirmed',
    visit_date: '2026-04-10',
    message: 'I am a student at IIT Bangalore, looking for PG near campus.',
    phone: '9876543210',
  });

  await insertDoc(bookings, 'bookings', {
    user_id: demoStudent.id,
    pg_id: 3,
    room_type: 'single',
    status: 'pending',
    visit_date: '2026-04-15',
    message: 'Looking for a single room with AC. Will be joining office next month.',
    phone: '9876543210',
  });

  return {
    message: `Seeded ${pgCount} PGs across ${CITIES.length} cities`,
    seeded: true,
    admin: adminUser.email,
  };
}
