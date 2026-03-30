'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { BookHeart, KeyRound, Mail, MoonStar } from 'lucide-react';
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

      router.push('/');
      router.refresh();
    } catch (submitError) {
      console.error('登录时发生错误:', submitError);
      setError('登录时发生未知错误');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[2.4rem] border border-border/70 bg-card/80 p-8 shadow-soft backdrop-blur-xl sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(48,89,72,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(148,163,184,0.12),transparent_24%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/80 px-4 py-2 text-xs uppercase tracking-[0.24em] text-primary">
              <BookHeart className="h-3.5 w-3.5" />
              Private Diary
            </div>

            <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              回到你的日记里，看看今天的情绪、习惯和心事。
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-foreground/60">
              这里不是任务面板，也不是资料仓库，而是只属于你的每日记录空间。登录后，你会先看到今天的日期、心情变化和“学习 AI”等习惯打卡。
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <FeatureCard
                icon={<MoonStar className="h-5 w-5" />}
                title="记录情绪节奏"
                description="用 5 档心情轻松记录每天状态，慢慢看见自己的变化周期。"
              />
              <FeatureCard
                icon={<BookHeart className="h-5 w-5" />}
                title="养成长期习惯"
                description="把早睡、学习 AI、运动和阅读，变成每天看得见的小坚持。"
              />
            </div>
          </div>
        </section>

        <section className="rounded-[2.4rem] border border-border/70 bg-card/85 p-6 shadow-soft backdrop-blur-xl sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">Welcome Back</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">登录你的日记站</h2>
            </div>
            <div className="rounded-2xl bg-muted px-3 py-2 text-sm text-foreground/60">今天也记一点</div>
          </div>

          <p className="mt-4 text-sm leading-6 text-foreground/55">
            还没有账号？
            {' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              去创建一个新的日记账户
            </Link>
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-[1.3rem] border border-red-200/70 bg-red-50/90 px-4 py-3 text-sm leading-6 text-red-700">
                {error}
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground/70">邮箱</span>
              <div className="flex items-center gap-3 rounded-[1.35rem] border border-border/70 bg-background/80 px-4 py-3 focus-within:border-primary/30">
                <Mail className="h-4 w-4 text-foreground/45" />
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/35"
                  placeholder="输入你的邮箱"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground/70">密码</span>
              <div className="flex items-center gap-3 rounded-[1.35rem] border border-border/70 bg-background/80 px-4 py-3 focus-within:border-primary/30">
                <KeyRound className="h-4 w-4 text-foreground/45" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/35"
                  placeholder="输入你的密码"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-[1.4rem] bg-primary px-4 py-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? '正在进入日记站...' : '进入我的日记'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-border/70 bg-background/70 p-4">
      <div className="inline-flex rounded-2xl bg-card p-3 text-primary shadow-soft">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-foreground/58">{description}</p>
    </div>
  );
}
