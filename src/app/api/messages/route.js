import { NextResponse } from 'next/server';
import { addNotification, getCollections, insertDoc, toInt } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

async function enrichMessages(messages, users) {
  const userIds = [...new Set(messages.flatMap((message) => [message.sender_id, message.receiver_id]))];
  const rows = await users.find({ id: { $in: userIds } }, { projection: { _id: 0, id: 1, name: 1, avatar_url: 1 } }).toArray();
  const userById = new Map(rows.map((row) => [row.id, row]));
  return messages.map((message) => ({
    ...message,
    sender_name: userById.get(message.sender_id)?.name || null,
    sender_avatar: userById.get(message.sender_id)?.avatar_url || null,
    receiver_name: userById.get(message.receiver_id)?.name || null,
  }));
}

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { messages, pgs, users } = await getCollections();
    const url = new URL(request.url);
    const pg_id = url.searchParams.get('pg_id');
    const otherUserIdParam = url.searchParams.get('other_user_id');
    const otherUserId = otherUserIdParam ? toInt(otherUserIdParam) : null;

    if (pg_id) {
      const pgId = toInt(pg_id);
      const pg = await pgs.findOne({ id: pgId }, { projection: { _id: 0, owner_id: 1, name: 1 } });
      if (!pg) return NextResponse.json({ error: 'PG not found' }, { status: 404 });

      let threadUserId = otherUserId;
      if (!threadUserId) {
        if (user.id === pg.owner_id) {
          const latest = await messages.find({
            pg_id: pgId,
            $or: [
              { sender_id: pg.owner_id },
              { receiver_id: pg.owner_id },
            ],
          }, { projection: { sender_id: 1, receiver_id: 1 } }).sort({ created_at: -1 }).limit(1).toArray();

          if (latest.length > 0) {
            const row = latest[0];
            threadUserId = row.sender_id === pg.owner_id ? row.receiver_id : row.sender_id;
          }
        } else {
          threadUserId = pg.owner_id;
        }
      }

      if (!threadUserId) {
        return NextResponse.json({ messages: [], pg_owner_id: pg.owner_id, pg_name: pg.name });
      }

      if (threadUserId === user.id) return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
      if (user.id !== pg.owner_id && threadUserId !== pg.owner_id) {
        return NextResponse.json({ error: 'Invalid conversation for this PG' }, { status: 400 });
      }

      const rows = await messages.find({
        pg_id: pgId,
        $or: [
          { sender_id: user.id, receiver_id: threadUserId },
          { sender_id: threadUserId, receiver_id: user.id },
        ],
      }, { projection: { _id: 0 } }).sort({ created_at: 1 }).toArray();

      await messages.updateMany({ pg_id: pgId, receiver_id: user.id, sender_id: threadUserId }, { $set: { is_read: 1 } });
      const threadUser = await users.findOne({ id: threadUserId }, { projection: { _id: 0, id: 1, name: 1 } });

      return NextResponse.json({
        messages: await enrichMessages(rows, users),
        pg_owner_id: pg.owner_id,
        pg_name: pg.name,
        other_user_id: threadUserId,
        other_user_name: threadUser?.name || null,
      });
    }

    const rows = await messages.find(
      { $or: [{ sender_id: user.id }, { receiver_id: user.id }] },
      { projection: { _id: 0 } }
    ).sort({ created_at: -1 }).toArray();
    const pgsRows = await pgs.find({ id: { $in: [...new Set(rows.map((message) => message.pg_id))] } }, { projection: { _id: 0, id: 1, name: 1 } }).toArray();
    const pgById = new Map(pgsRows.map((pg) => [pg.id, pg]));
    const userRows = await users.find(
      { id: { $in: [...new Set(rows.flatMap((message) => [message.sender_id, message.receiver_id]))] } },
      { projection: { _id: 0, id: 1, name: 1 } }
    ).toArray();
    const userById = new Map(userRows.map((row) => [row.id, row]));
    const threads = new Map();

    for (const message of rows) {
      const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
      const key = `${message.pg_id}:${otherUserId}`;
      const existing = threads.get(key);
      if (!existing) {
        threads.set(key, {
          pg_id: message.pg_id,
          pg_name: pgById.get(message.pg_id)?.name || null,
          other_user_id: otherUserId,
          other_user_name: userById.get(otherUserId)?.name || null,
          last_message_time: message.created_at,
          last_message: message.content,
          unread_count: message.receiver_id === user.id && !message.is_read ? 1 : 0,
        });
      } else if (message.receiver_id === user.id && !message.is_read) {
        existing.unread_count += 1;
      }
    }

    return NextResponse.json({ threads: [...threads.values()] });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    const { pg_id, content, receiver_id } = await request.json();
    const pgId = toInt(pg_id);
    if (!pgId || !content) return NextResponse.json({ error: 'pg_id and content required' }, { status: 400 });

    const { messages, pgs, users } = await getCollections();
    const pg = await pgs.findOne({ id: pgId });
    if (!pg) return NextResponse.json({ error: 'PG not found' }, { status: 404 });

    const actualReceiver = receiver_id ? toInt(receiver_id) : pg.owner_id;
    if (actualReceiver === user.id) return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });

    const message = await insertDoc(messages, 'messages', {
      sender_id: user.id,
      receiver_id: actualReceiver,
      pg_id: pgId,
      content: content.trim(),
      is_read: 0,
    });

    await addNotification(actualReceiver, 'New Message', `${user.name} sent you a message about "${pg.name}".`, 'chat', `/chat/${pgId}`);
    const [enriched] = await enrichMessages([message], users);

    return NextResponse.json({ message: enriched }, { status: 201 });
  } catch (error) {
    console.error('Messages POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
