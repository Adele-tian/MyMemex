import { NextRequest } from "next/server";
import { listHabitCheckins, upsertHabitCheckin } from "@/lib/insforge-db";
import { getServerAuthContext } from "@/lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    const auth = await getServerAuthContext(request);

    if (!auth) {
      return new Response("Unauthorized", { status: 401 });
    }

    const checkins = await listHabitCheckins(auth);

    return new Response(JSON.stringify(checkins), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("获取习惯打卡时发生错误:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuthContext(request);

    if (!auth) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { date, habitKey, completed } = await request.json();

    if (!date || !habitKey) {
      return new Response("Bad Request", { status: 400 });
    }

    const record = await upsertHabitCheckin(auth, {
      date,
      habitKey,
      completed: Boolean(completed),
    });

    return new Response(JSON.stringify(record), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("保存习惯打卡时发生错误:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
