'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { BookHeart, KeyRound, Mail, NotebookPen, UserRound } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('密码至少需要 6 个字符');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name: name || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError(data.error || '这个邮箱已经注册过了');
        } else {
          setError(data.error || '注册时发生错误');
        }
        setIsLoading(false);
        return;
      }

      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error);
        setIsLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch (submitError: any) {
      console.error('注册时发生错误:', submitError);
      setError(submitError.message || '注册时发生未知错误');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-[2.4rem] border border-border/70 bg-card/85 p-6 shadow-soft backdrop-blur-xl sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">Create Diary</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">创建你的日记账户</h2>
            </div>
            <div className="rounded-2xl bg-muted px-3 py-2 text-sm text-foreground/60">从今天开始</div>
          </div>

          <p className="mt-4 text-sm leading-6 text-foreground/55">
            已经有账号了？
            {' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              回到登录页
            </Link>
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-[1.3rem] border border-red-200/70 bg-red-50/90 px-4 py-3 text-sm leading-6 text-red-700">
                {error}
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground/70">名字</span>
              <div className="flex items-center gap-3 rounded-[1.35rem] border border-border/70 bg-background/80 px-4 py-3 focus-within:border-primary/30">
                <UserRound className="h-4 w-4 text-foreground/45" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/35"
                  placeholder="别人怎么称呼你"
                />
              </div>
            </label>

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
                  placeholder="用来登录的邮箱"
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
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/35"
                  placeholder="至少 6 位"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground/70">确认密码</span>
              <div className="flex items-center gap-3 rounded-[1.35rem] border border-border/70 bg-background/80 px-4 py-3 focus-within:border-primary/30">
                <KeyRound className="h-4 w-4 text-foreground/45" />
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/35"
                  placeholder="再输入一次密码"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-[1.4rem] bg-primary px-4 py-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? '正在创建你的日记站...' : '创建我的日记账户'}
            </button>
          </form>
        </section>

        <section className="relative overflow-hidden rounded-[2.4rem] border border-border/70 bg-card/80 p-8 shadow-soft backdrop-blur-xl sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(48,89,72,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(148,163,184,0.12),transparent_24%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/80 px-4 py-2 text-xs uppercase tracking-[0.24em] text-primary">
              <BookHeart className="h-3.5 w-3.5" />
              Daily Journal
            </div>

            <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              把普通的一天，慢慢写成属于你自己的长期记录。
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-foreground/60">
              注册后，你会得到一个只属于自己的日记空间。可以记录心情、完成习惯打卡，也可以每天写几句，慢慢积累自己的变化轨迹。
            </p>

            <div className="mt-10 space-y-4">
              <RegisterFeature
                icon={<NotebookPen className="h-5 w-5" />}
                title="按日期写日记"
                description="每天可写多条，不必追求完整，先写下来就很好。"
              />
              <RegisterFeature
                icon={<BookHeart className="h-5 w-5" />}
                title="看见情绪变化"
                description="情绪周期和习惯打卡会慢慢变成你自己的生活轨迹图。"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function RegisterFeature({
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
