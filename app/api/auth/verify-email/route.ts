import { NextRequest } from "next/server";
import { verifyEmailCode } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: "邮箱和验证码都是必需的" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const result = await verifyEmailCode(email, code);

    return new Response(
      JSON.stringify({
        message: "邮箱验证成功",
        user: result?.user ?? null,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("邮箱验证时发生错误:", error);

    return new Response(
      JSON.stringify({ error: error.message || "邮箱验证失败，请稍后再试" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
}
