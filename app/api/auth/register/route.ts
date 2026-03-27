import { NextRequest } from 'next/server';
import { registerUser } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // 验证输入
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: '邮箱和密码都是必需的' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: '密码至少需要6个字符' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 尝试注册用户
    const user = await registerUser(email, password, name);

    return new Response(
      JSON.stringify({
        message: '用户注册成功',
        user: { id: user.id, email: user.email, name: user.name }
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('注册时发生错误:', error);

    // 如果是用户已存在的错误
    if (error.message === '用户已存在') {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: '注册时发生错误，请稍后再试' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}