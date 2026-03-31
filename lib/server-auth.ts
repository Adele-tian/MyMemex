import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export type ServerAuthContext = {
  userId: string;
  accessToken: string;
};

export async function getServerAuthContext(request: NextRequest): Promise<ServerAuthContext | null> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.sub || typeof token.insforgeAccessToken !== "string") {
    return null;
  }

  return {
    userId: token.sub,
    accessToken: token.insforgeAccessToken,
  };
}
