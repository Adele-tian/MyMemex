import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const checkins = await prisma.habitCheckin.findMany({
      where: { userId: session.user.id },
      orderBy: [{ date: "desc" }, { habitKey: "asc" }],
    });

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
    const session = await getServerSession(authOptions);

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { date, habitKey, completed } = await request.json();

    if (!date || !habitKey) {
      return new Response("Bad Request", { status: 400 });
    }

    const normalizedDate = new Date(`${date}T00:00:00.000Z`);

    const record = await prisma.habitCheckin.upsert({
      where: {
        userId_date_habitKey: {
          userId: session.user.id,
          date: normalizedDate,
          habitKey,
        },
      },
      update: {
        completed: Boolean(completed),
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        date: normalizedDate,
        habitKey,
        completed: Boolean(completed),
      },
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
