import { NextRequest } from "next/server";
import { resendVerificationCode } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "邮箱是必需的" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const result = await resendVerificationCode(email);

    return new Response(
      JSON.stringify({
        message: result?.message || "验证码已重新发送",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("重发验证码时发生错误:", error);

    return new Response(
      JSON.stringify({ error: error.message || "重发验证码失败，请稍后再试" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
}
