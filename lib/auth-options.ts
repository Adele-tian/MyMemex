import type { AuthOptions, DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { createInsforgeServerClient } from "@/lib/insforge";

type AuthSession = {
  session: DefaultSession;
  token: JWT;
};

type AuthJwt = {
  token: JWT;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    insforgeAccessToken?: string;
  };
};

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const client = createInsforgeServerClient();
        const { data, error } = await client.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error || !data?.user || !data.accessToken) {
          return null;
        }

        return {
          id: data.user.id,
          email: data.user.email,
          name: typeof data.user.profile?.name === "string" ? data.user.profile.name : null,
          insforgeAccessToken: data.accessToken,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }: AuthSession) {
      if (session.user && token.sub) {
        (session.user as typeof session.user & { id: string }).id = token.sub;
        session.user.name = typeof token.name === "string" ? token.name : session.user.name;
        session.user.email = typeof token.email === "string" ? token.email : session.user.email;
      }

      return session;
    },
    async jwt({ token, user }: AuthJwt) {
      if (user?.id) {
        token.sub = user.id;
      }

      if (user?.name) {
        token.name = user.name;
      }

      if (user?.email) {
        token.email = user.email;
      }

      if (user?.insforgeAccessToken) {
        token.insforgeAccessToken = user.insforgeAccessToken;
      }

      return token;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
};
