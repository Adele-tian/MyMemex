import { AppShell } from "@/components/app-shell-new";
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from './api/auth/[...nextauth]/route';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    // 如果用户未登录，重定向到登录页
    redirect('/login');
  }

  return <AppShell />;
}