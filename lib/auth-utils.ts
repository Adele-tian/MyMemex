// 此文件仅用于服务器端操作
// 客户端认证相关功能应使用 NextAuth API 路由

import { PrismaClient } from '@/lib/generated/prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// 注册新用户 - 仅在服务器端使用
export async function registerUser(email: string, password: string, name?: string) {
  try {
    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('用户已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0] // 使用邮箱前缀作为默认名称
      }
    });

    // 返回用户信息（不包含密码）
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    };
  } catch (error) {
    console.error('注册用户时发生错误:', error);
    throw error;
  }
}

// 验证用户登录 - 仅在服务器端使用
export async function validateUserLogin(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.password) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return null;
    }

    // 返回用户信息（不包含密码）
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    };
  } catch (error) {
    console.error('验证用户登录时发生错误:', error);
    throw error;
  }
}

// 根据ID获取用户
export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    return user;
  } catch (error) {
    console.error('获取用户信息时发生错误:', error);
    throw error;
  }
}