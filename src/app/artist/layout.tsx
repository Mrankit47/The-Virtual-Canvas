'use client';

import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function ArtistLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout userRole="artist">
      {children}
    </DashboardLayout>
  );
}
