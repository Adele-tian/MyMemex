import { NextRequest } from 'next/server';
import type { Note } from '@/lib/types';
import { migrateNotes } from '@/lib/insforge-db';
import { getServerAuthContext } from '@/lib/server-auth';

export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuthContext(request);

    if (!auth) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { notes } = await request.json();

    if (!Array.isArray(notes)) {
      return new Response('Invalid data format', { status: 400 });
    }
    const result = await migrateNotes(auth, notes as Note[]);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('数据迁移过程中发生错误:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
