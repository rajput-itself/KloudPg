/**
 * Migration script: Updates existing MongoDB PG records from gradient placeholders
 * to real Unsplash photo URLs. Run with: node src/lib/migrate-images.mjs
 */
import { getCollections, insertDoc } from './db.js';

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

try {
  const { pgs, pgImages } = await getCollections();

  const rows = await pgs.find({ image_url: /^gradient:/ }, { projection: { _id: 0, id: 1 } }).toArray();

  if (rows.length === 0) {
    console.log('No gradient images found, nothing to migrate.');
    process.exit(0);
  }

  let count = 0;
  for (const pg of rows) {
    const photoIdx = count % PG_PHOTOS.length;
    const primaryUrl = PG_PHOTOS[photoIdx];

    await pgs.updateOne({ id: pg.id }, { $set: { image_url: primaryUrl } });
    await pgImages.deleteMany({ pg_id: pg.id });
    await insertDoc(pgImages, 'pg_images', { pg_id: pg.id, image_url: primaryUrl, is_primary: 1 });
    for (let j = 1; j <= 3; j += 1) {
      await insertDoc(pgImages, 'pg_images', { pg_id: pg.id, image_url: PG_PHOTOS[(photoIdx + j) % PG_PHOTOS.length], is_primary: 0 });
    }

    count += 1;
  }

  console.log(`Migrated ${count} PGs from gradient placeholders to real photos.`);
  process.exit(0);
} catch (err) {
  console.error('Migration error:', err);
  process.exit(1);
}
