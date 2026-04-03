import DashboardLayout from "@/components/dashboard/DashboardLayout";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout userRole="user">
      {children}
    </DashboardLayout>
  );
}
