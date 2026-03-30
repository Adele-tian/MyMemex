'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { loadUsers } from '@/lib/auth';

async function tryMigrateLegacyAccount(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const legacyUsers = loadUsers();
  const legacyUser = legacyUsers.find(
    (user) => user.email.trim().toLowerCase() === normalizedEmail && user.password === password,
  );

  if (!legacyUser) {
    return false;
  }

  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: legacyUser.email,
      password,
      name: legacyUser.name,
    }),
  });

  return response.ok || response.status === 409;
}

function getReadableError(error: string) {
  if (error === 'CredentialsSignin') {
    return '邮箱或密码不正确。如果这是你旧版本的账号，我已经尝试自动迁移；如果还是不行，可能旧账号数据已经不在当前浏览器里了。';
  }

  return error;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error === 'CredentialsSignin') {
        const migrated = await tryMigrateLegacyAccount(email, password);

        if (migrated) {
          res = await signIn('credentials', {
            redirect: false,
            email,
            password,
          });
        }
      }

      if (res?.error) {
        setError(getReadableError(res.error));
        setIsLoading(false);
        return;
      }

      // 登录成功，跳转到主页
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('登录时发生错误:', error);
      setError('登录时发生未知错误');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            登录到您的知识库
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            或{' '}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              创建新账户
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                邮箱地址
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="邮箱地址"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="密码"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? '登录中...' : '登录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
