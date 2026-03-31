import { createInsforgeServerClient } from "@/lib/insforge";

export type RegisterUserResult = {
  id?: string;
  email: string;
  name: string | null;
  createdAt?: string;
  requireEmailVerification: boolean;
};

// 注册新用户 - 仅在服务器端使用
export async function registerUser(email: string, password: string, name?: string): Promise<RegisterUserResult> {
  try {
    const client = createInsforgeServerClient();
    const normalizedEmail = email.trim().toLowerCase();

    const { data, error } = await client.auth.signUp({
      email: normalizedEmail,
      password,
      name: name || normalizedEmail.split("@")[0],
    });

    if (error) {
      if (error.statusCode === 409) {
        throw new Error("用户已存在");
      }

      throw error;
    }

    if (data?.requireEmailVerification && !data.user) {
      return {
        email: normalizedEmail,
        name: name || normalizedEmail.split("@")[0],
        requireEmailVerification: true,
      };
    }

    const user = data?.user;

    if (!user) {
      throw new Error("InsForge 注册成功，但未返回用户信息");
    }

    return {
      id: user.id,
      email: user.email,
      name: typeof user.profile?.name === "string" ? user.profile.name : null,
      createdAt: user.createdAt,
      requireEmailVerification: Boolean(data?.requireEmailVerification),
    };
  } catch (error) {
    console.error('注册用户时发生错误:', error);
    throw error;
  }
}

export async function verifyEmailCode(email: string, otp: string) {
  const client = createInsforgeServerClient();
  const { data, error } = await client.auth.verifyEmail({
    email: email.trim().toLowerCase(),
    otp: otp.trim(),
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function resendVerificationCode(email: string) {
  const client = createInsforgeServerClient();
  const { data, error } = await client.auth.resendVerificationEmail({
    email: email.trim().toLowerCase(),
  });

  if (error) {
    throw error;
  }

  return data;
}
