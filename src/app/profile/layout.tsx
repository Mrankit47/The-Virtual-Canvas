'use client';

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === 'loading') return null;
  if (!session) redirect('/login');

  const role = (session.user as any)?.role || 'user';

  return (
    <DashboardLayout userRole={role}>
      {children}
    </DashboardLayout>
  );
}
