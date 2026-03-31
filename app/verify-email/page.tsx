'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { KeyRound, MailCheck, RefreshCw } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailFromQuery = useMemo(() => searchParams.get('email') || '', [searchParams]);

  const [email, setEmail] = useState(emailFromQuery);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(emailFromQuery ? '验证码已发送到你的邮箱，请输入 6 位验证码。' : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          code,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '邮箱验证失败');
        setIsSubmitting(false);
        return;
      }

      setMessage('邮箱验证成功，请使用刚才的账号密码登录。');
      window.setTimeout(() => {
        void signIn(undefined, { callbackUrl: '/login' });
        router.push('/login');
      }, 400);
    } catch (submitError: any) {
      setError(submitError.message || '邮箱验证失败');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  };

  const handleResend = async () => {
    if (!email) {
      setError('请先输入注册邮箱');
      return;
    }

    setIsResending(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '重发验证码失败');
        setIsResending(false);
        return;
      }

      setMessage(data.message || '验证码已重新发送，请查收邮箱。');
    } catch (resendError: any) {
      setError(resendError.message || '重发验证码失败');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[0.96fr_1.04fr]">
        <section className="rounded-[2.4rem] border border-border/70 bg-card/85 p-6 shadow-soft backdrop-blur-xl sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">Verify Email</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">完成邮箱验证</h2>
            </div>
            <div className="rounded-2xl bg-muted px-3 py-2 text-sm text-foreground/60">只差一步</div>
          </div>

          <p className="mt-4 text-sm leading-6 text-foreground/55">
            已经验证完成？
            {' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              返回登录页
            </Link>
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleVerify}>
            {error && (
              <div className="rounded-[1.3rem] border border-red-200/70 bg-red-50/90 px-4 py-3 text-sm leading-6 text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-[1.3rem] border border-emerald-200/70 bg-emerald-50/90 px-4 py-3 text-sm leading-6 text-emerald-700">
                {message}
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground/70">邮箱</span>
              <div className="flex items-center gap-3 rounded-[1.35rem] border border-border/70 bg-background/80 px-4 py-3 focus-within:border-primary/30">
                <MailCheck className="h-4 w-4 text-foreground/45" />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/35"
                  placeholder="输入注册时使用的邮箱"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-foreground/70">验证码</span>
              <div className="flex items-center gap-3 rounded-[1.35rem] border border-border/70 bg-background/80 px-4 py-3 focus-within:border-primary/30">
                <KeyRound className="h-4 w-4 text-foreground/45" />
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/35"
                  placeholder="输入 6 位验证码"
                />
              </div>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-[1.4rem] bg-primary px-4 py-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? '正在验证...' : '确认验证码'}
            </button>

            <button
              type="button"
              onClick={() => void handleResend()}
              disabled={isResending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-[1.4rem] border border-border/70 bg-background/70 px-4 py-4 text-sm font-medium text-foreground transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
              {isResending ? '正在重发...' : '重新发送验证码'}
            </button>
          </form>
        </section>

        <section className="relative overflow-hidden rounded-[2.4rem] border border-border/70 bg-card/80 p-8 shadow-soft backdrop-blur-xl sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(48,89,72,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(148,163,184,0.12),transparent_24%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/80 px-4 py-2 text-xs uppercase tracking-[0.24em] text-primary">
              <MailCheck className="h-3.5 w-3.5" />
              Email Verification
            </div>

            <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              你的账号已经创建好了，再完成一次邮箱验证就能正常登录。
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-foreground/60">
              这个 InsForge 项目当前启用了邮箱验证码验证。输入收到的 6 位验证码后，账号才会变成可登录状态。
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-paper">正在加载验证信息...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
