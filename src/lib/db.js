import { MongoClient } from 'mongodb';
import fs from 'node:fs';
import path from 'node:path';

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const [key, ...valueParts] = trimmed.split('=');
    if (!process.env[key]) {
      process.env[key] = valueParts.join('=').replace(/^['"]|['"]$/g, '');
    }
  }
}

loadLocalEnv();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/';

function getDatabaseName() {
  if (process.env.MONGODB_DB) return process.env.MONGODB_DB;

  try {
    const parsed = new URL(uri);
    const name = parsed.pathname.replace(/^\/+/, '');
    return name || 'kloudpg';
  } catch {
    return 'kloudpg';
  }
}

const dbName = getDatabaseName();
let clientPromise;
let dbPromise;
let indexesPromise;

export function toInt(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? value : parsed;
}

export function now() {
  return new Date();
}

export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function ensureIndexes(db) {
  await Promise.all([
    db.collection('users').createIndex({ id: 1 }, { unique: true }),
    db.collection('users').createIndex({ email: 1 }, { unique: true }),
    db.collection('pgs').createIndex({ id: 1 }, { unique: true }),
    db.collection('pgs').createIndex({ city: 1 }),
    db.collection('pgs').createIndex({ owner_id: 1 }),
    db.collection('bookings').createIndex({ id: 1 }, { unique: true }),
    db.collection('bookings').createIndex({ user_id: 1 }),
    db.collection('bookings').createIndex({ pg_id: 1 }),
    db.collection('payments').createIndex({ id: 1 }, { unique: true }),
    db.collection('reviews').createIndex({ id: 1 }, { unique: true }),
    db.collection('reviews').createIndex({ user_id: 1, pg_id: 1 }, { unique: true }),
    db.collection('messages').createIndex({ id: 1 }, { unique: true }),
    db.collection('notifications').createIndex({ id: 1 }, { unique: true }),
db.collection('complaints').createIndex({ id: 1 }, { unique: true }),
    db.collection('saved_pgs').createIndex({ id: 1 }, { unique: true }),
    db.collection('saved_pgs').createIndex({ user_id: 1, pg_id: 1 }, { unique: true }),
  ]);
}

export async function getDb() {
  if (!clientPromise) {
    const client = new MongoClient(uri);
    clientPromise = client.connect();
  }

  if (!dbPromise) {
    dbPromise = clientPromise.then((client) => client.db(dbName));
  }

  const db = await dbPromise;
  if (!indexesPromise) {
    indexesPromise = ensureIndexes(db);
  }
  await indexesPromise;
  return db;
}

export async function getCollections() {
  const db = await getDb();
  return {
    db,
    users: db.collection('users'),
    pgs: db.collection('pgs'),
    pgRooms: db.collection('pg_rooms'),
    pgImages: db.collection('pg_images'),
    bookings: db.collection('bookings'),
    payments: db.collection('payments'),
    reviews: db.collection('reviews'),
    messages: db.collection('messages'),
notifications: db.collection('notifications'),
    complaints: db.collection('complaints'),
    counters: db.collection('counters'),
    savedPgs: db.collection('saved_pgs'),
  };
}

export async function nextId(collectionName) {
  const { counters } = await getCollections();
  const result = await counters.findOneAndUpdate(
    { _id: collectionName },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' }
  );
  return result?.seq ?? result?.value?.seq;
}

export async function insertDoc(collection, collectionName, doc) {
  const id = await nextId(collectionName);
  const record = { id, ...doc, created_at: doc.created_at || now() };
  await collection.insertOne(record);
  return record;
}

export async function addNotification(userId, title, message, type = 'info', link = '/') {
  const { notifications } = await getCollections();
  return insertDoc(notifications, 'notifications', {
    user_id: toInt(userId),
    title,
    message,
    type,
    link,
    is_read: 0,
  });
}
