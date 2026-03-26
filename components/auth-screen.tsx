"use client";

import { FormEvent, useState } from "react";
import { LockKeyhole, Mail, UserRound } from "lucide-react";
import { loginUser, registerUser, SessionUser } from "@/lib/auth";

interface AuthScreenProps {
  onAuthenticated: (user: SessionUser) => void;
}

type AuthMode = "login" | "register";

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password.trim() || (mode === "register" && !name.trim())) {
      setMessage("请先填写完整信息。");
      return;
    }

    const result =
      mode === "login"
        ? loginUser({ email, password })
        : registerUser({ name, email, password });

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    setMessage("");
    onAuthenticated(result.user);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-border/70 bg-card/85 shadow-soft backdrop-blur-xl lg:grid lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative hidden min-h-[640px] overflow-hidden border-r border-border/60 bg-[radial-gradient(circle_at_top_left,rgba(48,89,72,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.4))] p-10 lg:block">
          <p className="text-xs uppercase tracking-[0.3em] text-foreground/45">Second Brain</p>
          <h1 className="mt-5 max-w-md text-5xl font-semibold leading-tight text-foreground">
            为你的知识库加上一层专属身份入口
          </h1>
          <p className="mt-6 max-w-lg text-base leading-8 text-foreground/62">
            本地登录后，你的灵感、卡片和回顾都会按账号隔离保存。现在先用轻量本地认证跑通体验，后续再无缝切到真实后端。
          </p>
          <div className="mt-10 space-y-4">
            <Feature text="支持注册、登录、登出和会话持久化" />
            <Feature text="不同账号分别保存自己的笔记数据" />
            <Feature text="保留当前网站的所有采集与回顾体验" />
          </div>
        </div>

        <div className="p-6 sm:p-8 lg:p-10">
          <p className="text-xs uppercase tracking-[0.24em] text-foreground/45">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
            {mode === "login" ? "登录 Second Brain" : "注册你的 Second Brain"}
          </h2>
          <p className="mt-3 text-sm leading-7 text-foreground/58">
            {mode === "login"
              ? "登录后进入你的个人知识库。"
              : "创建一个本地账号，开始保存你的灵感和卡片。"}
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {mode === "register" && (
              <Field
                icon={<UserRound className="h-4 w-4" />}
                value={name}
                onChange={setName}
                placeholder="你的昵称"
                type="text"
              />
            )}
            <Field
              icon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={setEmail}
              placeholder="邮箱"
              type="email"
            />
            <Field
              icon={<LockKeyhole className="h-4 w-4" />}
              value={password}
              onChange={setPassword}
              placeholder="密码"
              type="password"
            />

            {message && <p className="text-sm text-rose-500">{message}</p>}

            <button
              type="submit"
              className="w-full rounded-2xl bg-primary px-4 py-3.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              {mode === "login" ? "登录" : "注册并进入"}
            </button>
          </form>

          <div className="mt-6 rounded-2xl border border-dashed border-border/70 bg-background/55 px-4 py-4 text-sm leading-7 text-foreground/55">
            当前是本地演示登录，不会连接外部服务器。你可以用任意邮箱注册后立即体验。
          </div>

          <div className="mt-6 text-sm text-foreground/58">
            {mode === "login" ? "还没有账号？" : "已经有账号了？"}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setMessage("");
              }}
              className="ml-2 font-medium text-primary"
            >
              {mode === "login" ? "去注册" : "去登录"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 px-4 py-3 text-sm text-foreground/70">
      {text}
    </div>
  );
}

function Field({
  icon,
  value,
  onChange,
  placeholder,
  type,
}: {
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type: string;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/75 px-4 py-3 text-foreground/55 focus-within:border-primary/30 focus-within:text-primary">
      {icon}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/35"
      />
    </label>
  );
}
